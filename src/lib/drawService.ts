import {
  collection,
  doc,
  runTransaction,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore';

import { db, handleFirestoreError, OperationType } from './firebase';
import { Participant, DrawWinner, DrawConfig } from '../types';

export function makeCompositeKey(
  fullName: string,
  fatherName: string,
  motherName: string,
  mobile: string
): string {
  const clean = (s: string) =>
    s.trim().toLowerCase().replace(/\s+/g, ' ');

  return `${clean(fullName)}__${clean(fatherName)}__${clean(motherName)}__${mobile.trim()}`;
}

export function formatDrawNumber(num: number): string {
  return String(num).padStart(3, '0');
}

export interface RegisterParams {
  fullName: string;
  fatherName: string;
  motherName: string;
  mobile: string;
  location: string;
}

/**
 * Register a new participant.
 * One mobile number can register maximum 5 persons.
 */
export async function registerParticipant(
  params: RegisterParams
): Promise<Participant> {
  const cleanFullName = params.fullName.trim();
  const cleanFatherName = params.fatherName.trim();
  const cleanMotherName = params.motherName.trim();
  const cleanMobile = params.mobile.trim().replace(/\D/g, '');
  const cleanLocation = params.location.trim();

  if (
    !cleanFullName ||
    !cleanFatherName ||
    !cleanMotherName ||
    !cleanMobile ||
    !cleanLocation
  ) {
    throw new Error(
      'Please fill in all required fields (Full Name, Father Name, Mother Name, Mobile Number, City/Location)'
    );
  }

  if (cleanMobile.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const compositeKey = makeCompositeKey(
    cleanFullName,
    cleanFatherName,
    cleanMotherName,
    cleanMobile
  );

  try {
    const newParticipant = await runTransaction(
      db,
      async (transaction) => {
        // 1. READ SETTINGS
        const configRef = doc(db, 'config', 'settings');
        const configSnap = await transaction.get(configRef);

        const configData = configSnap.exists()
          ? (configSnap.data() as DrawConfig)
          : {
              currentSequence: 0,
              registrationLocked: false,
              drawLocked: false,
              updatedAt: new Date().toISOString(),
            };

        if (configData.registrationLocked) {
          throw new Error(
            'Registration is currently locked by the organizer.'
          );
        }

        // 2. READ UNIQUENESS RECORD
        const uniquenessRef = doc(
          db,
          'unique_persons',
          compositeKey
        );

        const uniquenessSnap = await transaction.get(
          uniquenessRef
        );

        if (uniquenessSnap.exists()) {
          const existingData = uniquenessSnap.data();

          throw new Error(
            `This participant is already registered! Lucky Draw Number: ${
              existingData?.drawNumber || ''
            } (A person with this exact Full Name, Father's Name, Mother's Name, and Mobile Number already exists).`
          );
        }

        // 3. READ MOBILE TRACKER
        const mobileRef = doc(
          db,
          'mobile_trackers',
          cleanMobile
        );

        const mobileSnap = await transaction.get(mobileRef);

        const currentMobileCount = mobileSnap.exists()
          ? mobileSnap.data()?.count || 0
          : 0;

        const currentParticipantIds: string[] =
          mobileSnap.exists()
            ? mobileSnap.data()?.participantIds || []
            : [];

        if (currentMobileCount >= 5) {
          throw new Error(
            `Limit reached: A single mobile number can register up to 5 family members. Mobile number ${cleanMobile} already has 5 persons registered.`
          );
        }

        // 4. GENERATE DRAW NUMBER
        const nextSequence =
          (configData.currentSequence || 0) + 1;

        const drawNumber = formatDrawNumber(nextSequence);

        // 5. CREATE PARTICIPANT REFERENCE
        const participantsCol = collection(
          db,
          'participants'
        );

        const newParticipantRef = doc(participantsCol);

        const now = new Date().toISOString();

        const participantData: Omit<
          Participant,
          'id'
        > = {
          drawNumber,
          sequenceNumber: nextSequence,
          fullName: cleanFullName,
          fatherName: cleanFatherName,
          motherName: cleanMotherName,
          mobile: cleanMobile,
          location: cleanLocation,
          compositeKey,
          createdAt: now,
        };

        // ------------------------------------------------
        // ALL READS ARE ABOVE.
        // ALL WRITES START BELOW.
        // ------------------------------------------------

        // 6. CREATE PARTICIPANT
        transaction.set(
          newParticipantRef,
          participantData
        );

        // 7. CREATE UNIQUENESS RECORD
        transaction.set(uniquenessRef, {
          compositeKey,
          participantId: newParticipantRef.id,
          drawNumber,
          createdAt: now,
        });

        // 8. UPDATE MOBILE TRACKER
        transaction.set(
          mobileRef,
          {
            mobile: cleanMobile,
            count: currentMobileCount + 1,
            participantIds: [
              ...currentParticipantIds,
              newParticipantRef.id,
            ],
            updatedAt: now,
          },
          { merge: true }
        );

        // 9. UPDATE SETTINGS
        transaction.set(
          configRef,
          {
            currentSequence: nextSequence,
            registrationLocked:
              configData.registrationLocked ?? false,
            drawLocked:
              configData.drawLocked ?? false,
            updatedAt: now,
          },
          { merge: true }
        );

        return {
          id: newParticipantRef.id,
          ...participantData,
        } as Participant;
      }
    );

    return newParticipant;
  } catch (err: any) {
    if (err.message && !err.code) {
      throw err;
    }

    handleFirestoreError(
      err,
      OperationType.WRITE,
      'participants/registration'
    );

    throw err;
  }
}

/**
 * Search participant by lucky draw number.
 */
export async function searchByLuckyDrawNumber(
  rawNumber: string
): Promise<Participant | null> {
  const clean = rawNumber.trim();

  if (!clean) {
    return null;
  }

  const padded =
    clean.length < 3 && !isNaN(Number(clean))
      ? formatDrawNumber(Number(clean))
      : clean;

  try {
    const q1 = query(
      collection(db, 'participants'),
      where('drawNumber', '==', padded)
    );

    const snap1 = await getDocs(q1);

    if (!snap1.empty) {
      const docData = snap1.docs[0];

      return {
        id: docData.id,
        ...docData.data(),
      } as Participant;
    }

    if (padded !== clean) {
      const q2 = query(
        collection(db, 'participants'),
        where('drawNumber', '==', clean)
      );

      const snap2 = await getDocs(q2);

      if (!snap2.empty) {
        const docData = snap2.docs[0];

        return {
          id: docData.id,
          ...docData.data(),
        } as Participant;
      }
    }

    return null;
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.GET,
      'participants'
    );

    return null;
  }
}

/**
 * Search participants by mobile number.
 */
export async function searchByMobile(
  mobile: string
): Promise<Participant[]> {
  const clean = mobile.trim().replace(/\D/g, '');

  if (!clean) {
    return [];
  }

  try {
    const q = query(
      collection(db, 'participants'),
      where('mobile', '==', clean)
    );

    const snap = await getDocs(q);

    return snap.docs.map(
      (docItem) =>
        ({
          id: docItem.id,
          ...docItem.data(),
        } as Participant)
    );
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.LIST,
      'participants'
    );

    return [];
  }
}

/**
 * Update participant details.
 */
export async function updateParticipantDetails(
  participant: Participant,
  updates: Partial<
    Pick<
      Participant,
      | 'fullName'
      | 'fatherName'
      | 'motherName'
      | 'mobile'
      | 'location'
    >
  >
): Promise<void> {
  const newFullName = (
    updates.fullName ?? participant.fullName
  ).trim();

  const newFatherName = (
    updates.fatherName ?? participant.fatherName
  ).trim();

  const newMotherName = (
    updates.motherName ?? participant.motherName
  ).trim();

  const newMobile = (
    updates.mobile ?? participant.mobile
  )
    .trim()
    .replace(/\D/g, '');

  const newLocation = (
    updates.location ?? participant.location
  ).trim();

  if (
    !newFullName ||
    !newFatherName ||
    !newMotherName ||
    !newMobile ||
    !newLocation
  ) {
    throw new Error(
      'All participant fields are required.'
    );
  }

  if (newMobile.length !== 10) {
    throw new Error(
      'Please enter a valid 10-digit mobile number.'
    );
  }

  const newCompositeKey = makeCompositeKey(
    newFullName,
    newFatherName,
    newMotherName,
    newMobile
  );

  try {
    await runTransaction(db, async (tx) => {
      // ------------------------------------------------
      // ALL READS FIRST
      // ------------------------------------------------

      let checkNewSnap: any = null;

      if (
        newCompositeKey !== participant.compositeKey
      ) {
        checkNewSnap = await tx.get(
          doc(
            db,
            'unique_persons',
            newCompositeKey
          )
        );

        if (checkNewSnap.exists()) {
          throw new Error(
            'Another participant already exists with this exact Name, Father Name, Mother Name, and Mobile combination.'
          );
        }
      }

      let oldMobileSnap: any = null;
      let newMobileSnap: any = null;

      if (newMobile !== participant.mobile) {
        const oldMobileRef = doc(
          db,
          'mobile_trackers',
          participant.mobile
        );

        oldMobileSnap = await tx.get(oldMobileRef);

        const newMobileRef = doc(
          db,
          'mobile_trackers',
          newMobile
        );

        newMobileSnap = await tx.get(newMobileRef);

        const newCount =
          (newMobileSnap.exists()
            ? newMobileSnap.data()?.count || 0
            : 0) + 1;

        if (newCount > 5) {
          throw new Error(
            'Limit reached: The new mobile number already has 5 persons registered.'
          );
        }
      }

      // ------------------------------------------------
      // ALL WRITES AFTER ALL READS
      // ------------------------------------------------

      if (
        newCompositeKey !== participant.compositeKey
      ) {
        // Remove old uniqueness document
        if (participant.compositeKey) {
          tx.delete(
            doc(
              db,
              'unique_persons',
              participant.compositeKey
            )
          );
        }

        // Create new uniqueness document
        tx.set(
          doc(
            db,
            'unique_persons',
            newCompositeKey
          ),
          {
            compositeKey: newCompositeKey,
            participantId: participant.id,
            drawNumber: participant.drawNumber,
            createdAt: participant.createdAt,
          }
        );
      }

      // Update mobile trackers if mobile changed
      if (newMobile !== participant.mobile) {
        const oldMobileRef = doc(
          db,
          'mobile_trackers',
          participant.mobile
        );

        if (
          oldMobileSnap &&
          oldMobileSnap.exists()
        ) {
          const oldCount = Math.max(
            0,
            (oldMobileSnap.data()?.count || 1) - 1
          );

          const oldIds: string[] = (
            oldMobileSnap.data()?.participantIds || []
          ).filter(
            (id: string) => id !== participant.id
          );

          tx.update(oldMobileRef, {
            count: oldCount,
            participantIds: oldIds,
            updatedAt: new Date().toISOString(),
          });
        }

        const newMobileRef = doc(
          db,
          'mobile_trackers',
          newMobile
        );

        const newCount =
          (newMobileSnap?.exists()
            ? newMobileSnap.data()?.count || 0
            : 0) + 1;

        const newIds = newMobileSnap?.exists()
          ? [
              ...(newMobileSnap.data()?.participantIds ||
                []),
              participant.id,
            ]
          : [participant.id];

        tx.set(
          newMobileRef,
          {
            mobile: newMobile,
            count: newCount,
            participantIds: newIds,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      }

      // Update participant document
      const participantRef = doc(
        db,
        'participants',
        participant.id
      );

      tx.update(participantRef, {
        fullName: newFullName,
        fatherName: newFatherName,
        motherName: newMotherName,
        mobile: newMobile,
        location: newLocation,
        compositeKey: newCompositeKey,
      });
    });
  } catch (err: any) {
    if (err.message && !err.code) {
      throw err;
    }

    handleFirestoreError(
      err,
      OperationType.UPDATE,
      `participants/${participant.id}`
    );

    throw err;
  }
}

/**
 * DELETE PARTICIPANT
 *
 * IMPORTANT:
 * Firestore transaction requires:
 * READS FIRST -> WRITES AFTER.
 *
 * This is the corrected version of the delete bug.
 */
export async function deleteParticipant(
  participant: Participant
): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      // ==================================================
      // STEP 1: ALL READS FIRST
      // ==================================================

      const mobileRef = doc(
        db,
        'mobile_trackers',
        participant.mobile
      );

      const mobileSnap = await tx.get(mobileRef);

      // ==================================================
      // STEP 2: ALL WRITES AFTER READS
      // ==================================================

      // Delete participant document
      tx.delete(
        doc(
          db,
          'participants',
          participant.id
        )
      );

      // Delete uniqueness record
      if (participant.compositeKey) {
        tx.delete(
          doc(
            db,
            'unique_persons',
            participant.compositeKey
          )
        );
      }

      // Update mobile tracker
      if (mobileSnap.exists()) {
        const data = mobileSnap.data();

        const curCount = data?.count || 1;

        const curIds: string[] =
          data?.participantIds || [];

        const nextCount = Math.max(
          0,
          curCount - 1
        );

        const nextIds = curIds.filter(
          (id: string) =>
            id !== participant.id
        );

        if (nextCount === 0) {
          // Keep tracker document but reset it.
          tx.update(mobileRef, {
            count: 0,
            participantIds: [],
            updatedAt: new Date().toISOString(),
          });
        } else {
          tx.update(mobileRef, {
            count: nextCount,
            participantIds: nextIds,
            updatedAt: new Date().toISOString(),
          });
        }
      }
    });
  } catch (err: any) {
    console.error(
      'Error deleting participant:',
      err
    );

    if (err.message && !err.code) {
      throw err;
    }

    handleFirestoreError(
      err,
      OperationType.DELETE,
      `participants/${participant.id}`
    );

    throw err;
  }
}

/**
 * Save winner to history.
 */
export async function saveWinnerToHistory(
  winnerData: Omit<DrawWinner, 'id'>
): Promise<DrawWinner> {
  try {
    const winnersCol = collection(
      db,
      'winners'
    );

    const newDoc = doc(winnersCol);

    const dataWithId: DrawWinner = {
      id: newDoc.id,
      ...winnerData,
    };

    await runTransaction(db, async (tx) => {
      tx.set(newDoc, winnerData);
    });

    return dataWithId;
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.CREATE,
      'winners'
    );

    throw err;
  }
}

/**
 * Delete winner from history.
 */
export async function deleteWinnerFromHistory(
  winnerId: string
): Promise<void> {
  try {
    await deleteDoc(
      doc(db, 'winners', winnerId)
    );
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.DELETE,
      `winners/${winnerId}`
    );

    throw err;
  }
}

/**
 * Update draw configuration.
 */
export async function updateDrawConfig(
  updates: Partial<DrawConfig>
): Promise<void> {
  try {
    const configRef = doc(
      db,
      'config',
      'settings'
    );

    await updateDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.UPDATE,
      'config/settings'
    );

    throw err;
  }
}

/**
 * Get initial draw configuration.
 */
export async function getInitialConfig(): Promise<DrawConfig> {
  try {
    const configRef = doc(
      db,
      'config',
      'settings'
    );

    const snap = await getDoc(configRef);

    if (snap.exists()) {
      return snap.data() as DrawConfig;
    }

    return {
      currentSequence: 0,
      registrationLocked: false,
      drawLocked: false,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    handleFirestoreError(
      err,
      OperationType.GET,
      'config/settings'
    );

    return {
      currentSequence: 0,
      registrationLocked: false,
      drawLocked: false,
      updatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Optional helper:
 * Listen to participants in real time.
 */
export function subscribeToParticipants(
  callback: (participants: Participant[]) => void,
  onError?: (error: Error) => void
): () => void {
  const participantsRef = collection(
    db,
    'participants'
  );

  const q = query(
    participantsRef,
    orderBy('sequenceNumber', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const participants =
        snapshot.docs.map(
          (docItem) =>
            ({
              id: docItem.id,
              ...docItem.data(),
            } as Participant)
        );

      callback(participants);
    },
    (error) => {
      console.error(
        'Participants realtime listener error:',
        error
      );

      if (onError) {
        onError(error);
      }
    }
  );
}