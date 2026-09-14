import React, { useState, useEffect } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Participant, DrawWinner, DrawConfig, ORGANIZER_INFO } from './types';
import { Header } from './components/Header';
import { LiveWinnersBanner } from './components/LiveWinnersBanner';
import { RegistrationForm } from './components/RegistrationForm';
import { LuckyDrawSearch } from './components/LuckyDrawSearch';
import { LuckyDrawGame } from './components/LuckyDrawGame';
import { WinnersHistory } from './components/WinnersHistory';
import { AdminPanel } from './components/AdminPanel';
import { AdminLogin } from './components/AdminLogin';
import { OrganizerCard } from './components/OrganizerCard';
import { Sparkles, Phone, MapPin, ShieldCheck, Ticket } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'register' | 'search' | 'draw' | 'winners' | 'organizer' | 'admin'>('register');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [winners, setWinners] = useState<DrawWinner[]>([]);
  const [config, setConfig] = useState<DrawConfig>({
    currentSequence: 0,
    registrationLocked: false,
    drawLocked: false,
    updatedAt: new Date().toISOString(),
  });

  // Admin Auth State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [currentAdminEmail, setCurrentAdminEmail] = useState('');

  // Check URL hash for direct #admin link
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#admin' || hash === '#/admin') {
        setActiveTab('admin');
      }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Track Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdminLoggedIn(true);
        setCurrentAdminEmail(user.email || 'Admin');
      } else {
        setIsAdminLoggedIn(false);
        setCurrentAdminEmail('');
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to Firestore participants in real-time
  useEffect(() => {
    const q = query(collection(db, 'participants'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Participant[];
        // Sort by sequenceNumber or drawNumber
        list.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
        setParticipants(list);
      },
      (error) => {
        console.error('Participants snapshot error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to Firestore winners in real-time
  useEffect(() => {
    const q = query(collection(db, 'winners'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as DrawWinner[];
        list.sort((a, b) => new Date(b.wonAt).getTime() - new Date(a.wonAt).getTime());
        setWinners(list);
      },
      (error) => {
        console.error('Winners snapshot error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to config/settings
  useEffect(() => {
    const configDocRef = doc(db, 'config', 'settings');
    const unsubscribe = onSnapshot(
      configDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setConfig(snapshot.data() as DrawConfig);
        }
      },
      (error) => {
        console.error('Config snapshot error:', error);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleAdminLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    setIsAdminLoggedIn(false);
    setCurrentAdminEmail('');
    setActiveTab('register');
    window.location.hash = '';
  };

  const handleOpenAdmin = () => {
    setActiveTab('admin');
    window.location.hash = 'admin';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab: string) => {
          setActiveTab(tab as any);
          if (tab !== 'admin') {
            window.location.hash = '';
          }
        }}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdmin={handleOpenAdmin}
      />

      {/* Live Winners Announcement Banner */}
      <LiveWinnersBanner
        winners={winners}
        onViewWinners={() => {
          setActiveTab('winners');
          window.location.hash = '';
        }}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'register' && (
          <RegistrationForm
            onSuccess={() => {
              // Participant registered
            }}
          />
        )}

        {activeTab === 'search' && <LuckyDrawSearch />}

        {activeTab === 'draw' && (
          isAdminLoggedIn ? (
            <LuckyDrawGame
              participants={participants}
              winners={winners}
              config={config}
              isAdmin={isAdminLoggedIn}
              onWinnerAdded={(newWinner) => {
                setWinners((prev) => [newWinner, ...prev]);
              }}
            />
          ) : (
            <WinnersHistory
              winners={winners}
              isAdmin={false}
            />
          )
        )}

        {activeTab === 'winners' && (
          <WinnersHistory
            winners={winners}
            isAdmin={isAdminLoggedIn}
            onWinnerDeleted={(id) => {
              setWinners((prev) => prev.filter((w) => w.id !== id));
            }}
          />
        )}

        {activeTab === 'organizer' && <OrganizerCard />}

        {activeTab === 'admin' && (
          <>
            {isAdminLoggedIn ? (
              <AdminPanel
                participants={participants}
                winners={winners}
                config={config}
                currentAdminEmail={currentAdminEmail}
                onLogout={handleAdminLogout}
                onWinnerAdded={(newWinner) => {
                  setWinners((prev) => [newWinner, ...prev]);
                }}
                onParticipantUpdated={(updated) => {
                  setParticipants((prev) =>
                    prev.map((p) => (p.id === updated.id ? updated : p))
                  );
                }}
                onParticipantDeleted={(id) => {
                  setParticipants((prev) => prev.filter((p) => p.id !== id));
                }}
                onWinnerDeleted={(id) => {
                  setWinners((prev) => prev.filter((w) => w.id !== id));
                }}
              />
            ) : (
              <AdminLogin
                onLoginSuccess={(email) => {
                  setIsAdminLoggedIn(true);
                  setCurrentAdminEmail(email);
                }}
                onCancel={() => {
                  setActiveTab('register');
                  window.location.hash = '';
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Professional Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 text-xs text-slate-600">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <div className="font-bold text-slate-900 text-sm font-heading">
                {ORGANIZER_INFO.name}
              </div>
              <div className="mt-0.5">
                Lead Organizer: <span className="font-semibold text-amber-900">{ORGANIZER_INFO.organizer}</span>
              </div>
              <div className="text-slate-500 text-[11px] mt-0.5">{ORGANIZER_INFO.address}</div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <a href={`tel:${ORGANIZER_INFO.secondaryPhones[1]}`} className="hover:text-amber-800 flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-amber-600" />
                <span>{ORGANIZER_INFO.primaryPhone}</span>
              </a>
              <span className="opacity-40">|</span>
              <button
                onClick={handleOpenAdmin}
                className="hover:text-amber-800 flex items-center gap-1 font-semibold text-slate-700"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAdminLoggedIn ? 'Admin Panel' : 'Admin Login'}</span>
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>© 2026 {ORGANIZER_INFO.name}. All rights reserved.</span>
            <span className="text-slate-500">
              Contact: {ORGANIZER_INFO.secondaryPhones[0]} / {ORGANIZER_INFO.secondaryPhones[1]} • {ORGANIZER_INFO.email}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
