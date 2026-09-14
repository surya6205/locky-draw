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
  const clean = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
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

export async function registerParticipant(params: RegisterParams): Promise<Participant> {
  const cleanFullName = params.fullName.trim();
  const cleanFatherName = params.fatherName.trim();
  const cleanMotherName = params.motherName.trim();
  const cleanMobile = params.mobile.trim().replace(/\D/g, '');
  const cleanLocation = params.location.trim();

  if (!cleanFullName || !cleanFatherName || !cleanMotherName || !cleanMobile || !cleanLocation) {
    throw new Error('Please fill in all required fields (Full Name, Father Name, Mother Name, Mobile Number, City/Location)');
  }

  if (cleanMobile.length !== 10) {
    throw new Error('Please enter a valid 10-digit mobile number');
  }

  const compositeKey = makeCompositeKey(cleanFullName, cleanFatherName, cleanMotherName, cleanMobile);

  try {
    const newParticipant = await runTransaction(db, async (transaction) => {
      // 1. Check Settings
      const configRef = doc(db, 'config', 'settings');
      const configSnap = await transaction.get(configRef);
      const configData = configSnap.exists()
        ? (configSnap.data() as DrawConfig)
        : { currentSequence: 0, registrationLocked: false, drawLocked: false, updatedAt: new Date().toISOString() };

      if (configData.registrationLocked) {
        throw new Error('Registration is currently locked by the organizer.');
      }

      // 2. Check Duplicate Person
      const uniquenessRef = doc(db, 'unique_persons', compositeKey);
      const uniquenessSnap = await transaction.get(uniquenessRef);
      if (uniquenessSnap.exists()) {
        const existingData = uniquenessSnap.data();
        throw new Error(
          `This participant is already registered! Lucky Draw Number: ${existingData?.drawNumber || ''} (A person with this exact Full Name, Father's Name, Mother's Name, and Mobile Number already exists).`
        );
      }

      // 3. Check Mobile Limit (Max 5 persons)
      const mobileRef = doc(db, 'mobile_trackers', cleanMobile);
      const mobileSnap = await transaction.get(mobileRef);
      const currentMobileCount = mobileSnap.exists() ? (mobileSnap.data()?.count || 0) : 0;
      const currentParticipantIds: string[] = mobileSnap.exists() ? (mobileSnap.data()?.participantIds || []) : [];

      if (currentMobileCount >= 5) {
        throw new Error(
          `Limit reached: A single mobile number can register up to 5 family members. Mobile number ${cleanMobile} already has 5 persons registered.`
        );
      }

      // 4. Generate Unique Sequential Number
      const nextSequence = (configData.currentSequence || 0) + 1;
      const drawNumber = formatDrawNumber(nextSequence);

      // 5. Create Participant document
      const participantsCol = collection(db, 'participants');
      const newParticipantRef = doc(participantsCol);
      const now = new Date().toISOString();

      const participantData: Omit<Participant, 'id'> = {
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

      transaction.set(newParticipantRef, participantData);

      // 6. Set Uniqueness record to block duplicate registration
      transaction.set(uniquenessRef, {
        compositeKey,
        participantId: newParticipantRef.id,
        drawNumber,
        createdAt: now,
      });

      // 7. Update Mobile Tracker
      transaction.set(
        mobileRef,
        {
          mobile: cleanMobile,
          count: currentMobileCount + 1,
          participantIds: [...currentParticipantIds, newParticipantRef.id],
          updatedAt: now,
        },
        { merge: true }
      );

      // 8. Update Settings sequence
      transaction.set(
        configRef,
        {
          currentSequence: nextSequence,
          registrationLocked: configData.registrationLocked ?? false,
          drawLocked: configData.drawLocked ?? false,
          updatedAt: now,
        },
        { merge: true }
      );

      return {
        id: newParticipantRef.id,
        ...participantData,
      } as Participant;
    });

    return newParticipant;
  } catch (err: any) {
    if (err.message && !err.code) {
      throw err;
    }
    handleFirestoreError(err, OperationType.WRITE, 'participants/registration');
  }
}

export async function searchByLuckyDrawNumber(rawNumber: string): Promise<Participant | null> {
  const clean = rawNumber.trim();
  if (!clean) return null;

  // Try padded format or direct match
  const padded = clean.length < 3 && !isNaN(Number(clean)) ? formatDrawNumber(Number(clean)) : clean;

  try {
    const q1 = query(collection(db, 'participants'), where('drawNumber', '==', padded));
    const snap1 = await getDocs(q1);
    if (!snap1.empty) {
      const docData = snap1.docs[0];
      return { id: docData.id, ...docData.data() } as Participant;
    }

    if (padded !== clean) {
      const q2 = query(collection(db, 'participants'), where('drawNumber', '==', clean));
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        const docData = snap2.docs[0];
        return { id: docData.id, ...docData.data() } as Participant;
      }
    }

    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'participants');
  }
}

export async function searchByMobile(mobile: string): Promise<Participant[]> {
  const clean = mobile.trim().replace(/\D/g, '');
  if (!clean) return [];

  try {
    const q = query(collection(db, 'participants'), where('mobile', '==', clean));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Participant));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'participants');
  }
}

export async function updateParticipantDetails(
  participant: Participant,
  updates: Partial<Pick<Participant, 'fullName' | 'fatherName' | 'motherName' | 'mobile' | 'location'>>
): Promise<void> {
  const newFullName = (updates.fullName ?? participant.fullName).trim();
  const newFatherName = (updates.fatherName ?? participant.fatherName).trim();
  const newMotherName = (updates.motherName ?? participant.motherName).trim();
  const newMobile = (updates.mobile ?? participant.mobile).trim().replace(/\D/g, '');
  const newLocation = (updates.location ?? participant.location).trim();

  const newCompositeKey = makeCompositeKey(newFullName, newFatherName, newMotherName, newMobile);

  try {
    await runTransaction(db, async (tx) => {
      // If composite key changed, check if new one already exists
      if (newCompositeKey !== participant.compositeKey) {
        const checkNewSnap = await tx.get(doc(db, 'unique_persons', newCompositeKey));
        if (checkNewSnap.exists()) {
          throw new Error('Another participant already exists with this exact Name, Father Name, Mother Name, and Mobile combination.');
        }
        // Remove old uniqueness doc
        tx.delete(doc(db, 'unique_persons', participant.compositeKey));
        // Add new uniqueness doc
        tx.set(doc(db, 'unique_persons', newCompositeKey), {
          compositeKey: newCompositeKey,
          participantId: participant.id,
          drawNumber: participant.drawNumber,
          createdAt: participant.createdAt,
        });
      }

      // If mobile changed, adjust mobile counters
      if (newMobile !== participant.mobile) {
        const oldMobileRef = doc(db, 'mobile_trackers', participant.mobile);
        const oldMobileSnap = await tx.get(oldMobileRef);
        if (oldMobileSnap.exists()) {
          const oldCount = Math.max(0, (oldMobileSnap.data()?.count || 1) - 1);
          const oldIds: string[] = (oldMobileSnap.data()?.participantIds || []).filter((id: string) => id !== participant.id);
          tx.update(oldMobileRef, { count: oldCount, participantIds: oldIds, updatedAt: new Date().toISOString() });
        }

        const newMobileRef = doc(db, 'mobile_trackers', newMobile);
        const newMobileSnap = await tx.get(newMobileRef);
        const newCount = (newMobileSnap.exists() ? (newMobileSnap.data()?.count || 0) : 0) + 1;
        const newIds = newMobileSnap.exists() ? [...(newMobileSnap.data()?.participantIds || []), participant.id] : [participant.id];
        if (newCount > 5) {
          throw new Error('Limit reached: The new mobile number already has 5 persons registered.');
        }
        tx.set(newMobileRef, { mobile: newMobile, count: newCount, participantIds: newIds, updatedAt: new Date().toISOString() }, { merge: true });
      }

      // Update participant doc
      const participantRef = doc(db, 'participants', participant.id);
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
    handleFirestoreError(err, OperationType.UPDATE, `participants/${participant.id}`);
  }
}

export async function deleteParticipant(participant: Participant): Promise<void> {
  try {
    await runTransaction(db, async (tx) => {
      // 1. Delete participant doc
      tx.delete(doc(db, 'participants', participant.id));

      // 2. Delete unique_person entry
      if (participant.compositeKey) {
        tx.delete(doc(db, 'unique_persons', participant.compositeKey));
      }

      // 3. Decrement mobile tracker
      const mobileRef = doc(db, 'mobile_trackers', participant.mobile);
      const mobileSnap = await tx.get(mobileRef);
      if (mobileSnap.exists()) {
        const curCount = mobileSnap.data()?.count || 1;
        const curIds: string[] = mobileSnap.data()?.participantIds || [];
        const nextCount = Math.max(0, curCount - 1);
        const nextIds = curIds.filter((id) => id !== participant.id);
        tx.update(mobileRef, { count: nextCount, participantIds: nextIds, updatedAt: new Date().toISOString() });
      }
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `participants/${participant.id}`);
  }
}

export async function saveWinnerToHistory(winnerData: Omit<DrawWinner, 'id'>): Promise<DrawWinner> {
  try {
    const winnersCol = collection(db, 'winners');
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
    handleFirestoreError(err, OperationType.CREATE, 'winners');
  }
}

export async function deleteWinnerFromHistory(winnerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'winners', winnerId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `winners/${winnerId}`);
  }
}

export async function updateDrawConfig(updates: Partial<DrawConfig>): Promise<void> {
  try {
    const configRef = doc(db, 'config', 'settings');
    await updateDoc(configRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, 'config/settings');
  }
}

export async function getInitialConfig(): Promise<DrawConfig> {
  try {
    const configRef = doc(db, 'config', 'settings');
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
    handleFirestoreError(err, OperationType.GET, 'config/settings');
  }
}
