import React, { useState } from 'react';
import { Participant, DrawWinner, DrawConfig, ORGANIZER_INFO } from '../types';
import { AdminParticipantManagement } from './AdminParticipantManagement';
import { WinnersHistory } from './WinnersHistory';
import { TopThreeDrawCards } from './TopThreeDrawCards';
import { updateDrawConfig } from '../lib/drawService';
import { auth } from '../lib/firebase';
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut,
} from 'firebase/auth';
import {
  Users,
  Smartphone,
  Ticket,
  Trophy,
  ShieldCheck,
  KeyRound,
  LogOut,
  Lock,
  Unlock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Flame,
} from 'lucide-react';

interface AdminPanelProps {
  participants: Participant[];
  winners: DrawWinner[];
  config: DrawConfig;
  currentAdminEmail: string;
  onLogout: () => void;
  onWinnerAdded?: (winner: DrawWinner) => void;
  onParticipantUpdated?: (updated: Participant) => void;
  onParticipantDeleted?: (id: string) => void;
  onWinnerDeleted?: (id: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  participants,
  winners,
  config,
  currentAdminEmail,
  onLogout,
  onWinnerAdded,
  onParticipantUpdated,
  onParticipantDeleted,
  onWinnerDeleted,
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'draw' | 'participants' | 'winners' | 'settings'>('draw');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Quick Lock Toggles
  const [updatingLock, setUpdatingLock] = useState(false);

  // Compute metrics in real-time
  const totalPersons = participants.length;
  const uniqueMobiles = new Set(participants.map((p) => p.mobile)).size;
  const totalLuckyDrawNumbers = participants.length;
  const totalWinners = winners.length;

  const handleToggleRegLock = async () => {
    try {
      setUpdatingLock(true);
      await updateDrawConfig({ registrationLocked: !config.registrationLocked });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleToggleDrawLock = async () => {
    try {
      setUpdatingLock(true);
      await updateDrawConfig({ drawLocked: !config.drawLocked });
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    } finally {
      setUpdatingLock(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setPasswordError('Session expired. Please log in again.');
      return;
    }

    try {
      setChangingPassword(true);
      // If user has email provider and entered currentPassword, re-authenticate first
      if (user.email && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        try {
          await reauthenticateWithCredential(user, credential);
        } catch (reauthErr) {
          console.warn('Re-auth skipped or not required:', reauthErr);
        }
      }

      await updatePassword(user, newPassword);
      setPasswordSuccess('Password successfully updated and secured in Firebase Authentication.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setPasswordError('For security reasons, please log out and log in again, then change your password.');
      } else {
        setPasswordError(err.message || 'Error updating password.');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Admin Header Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-400/30">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase font-mono tracking-widest text-amber-400 font-bold">
              ADMIN CONTROL PANEL
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading mt-1">
            {ORGANIZER_INFO.name} - Admin Portal
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Admin Email: <span className="text-white font-mono">{currentAdminEmail}</span> • Organizer: {ORGANIZER_INFO.organizer}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-admin-logout"
            onClick={onLogout}
            className="px-4 py-2.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold flex items-center gap-2 transition shadow-md"
          >
            <LogOut className="w-4 h-4" />
            <span>Admin Logout</span>
          </button>
        </div>
      </div>

      {/* Real-time KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-8">
        {/* Total Persons */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Persons</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {totalPersons}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Registered Participants</span>
        </div>

        {/* Total Registered Mobile Numbers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Mobiles</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
            {uniqueMobiles}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Unique Mobile Numbers</span>
        </div>

        {/* Total Lucky Draw Numbers */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Lucky Numbers</span>
            <Ticket className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
            {totalLuckyDrawNumbers}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Issued Draw Numbers</span>
        </div>

        {/* Total Winners */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Winners</span>
            <Trophy className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-800 font-mono">
            {totalWinners}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Announced Winners</span>
        </div>

        {/* Registration Status */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Registration Status</span>
            {config.registrationLocked ? (
              <Lock className="w-4 h-4 text-rose-600" />
            ) : (
              <Unlock className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm sm:text-base font-bold px-2.5 py-0.5 rounded-lg ${
                config.registrationLocked
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {config.registrationLocked ? 'Locked' : 'Active'}
            </span>
          </div>
          <button
            onClick={handleToggleRegLock}
            disabled={updatingLock}
            className="mt-2 text-[11px] text-amber-700 hover:underline font-semibold block"
          >
            {config.registrationLocked ? 'Unlock →' : 'Lock →'}
          </button>
        </div>
      </div>

      {/* Admin Sub Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3 mb-6">
        <button
          id="admin-tab-draw"
          onClick={() => setActiveAdminTab('draw')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'draw'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-sm ring-2 ring-amber-300'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Draw 3 Winners (1st, 2nd, 3rd)</span>
        </button>

        <button
          id="admin-tab-participants"
          onClick={() => setActiveAdminTab('participants')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'participants'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Participants ({totalPersons})</span>
        </button>

        <button
          id="admin-tab-winners"
          onClick={() => setActiveAdminTab('winners')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'winners'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Winners History ({totalWinners})</span>
        </button>

        <button
          id="admin-tab-settings"
          onClick={() => setActiveAdminTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 ${
            activeAdminTab === 'settings'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Security & Password</span>
        </button>
      </div>

      {/* Tab 0: Top 3 Winners Scratch Draw */}
      {activeAdminTab === 'draw' && (
        <TopThreeDrawCards
          participants={participants}
          winners={winners}
          config={config}
          isAdmin={true}
          onWinnerAdded={onWinnerAdded}
        />
      )}

      {/* Tab 1: Participant Management */}
      {activeAdminTab === 'participants' && (
        <AdminParticipantManagement
          participants={participants}
          onParticipantUpdated={onParticipantUpdated}
          onParticipantDeleted={onParticipantDeleted}
        />
      )}

      {/* Tab 2: Winners History */}
      {activeAdminTab === 'winners' && (
        <WinnersHistory
          winners={winners}
          isAdmin={true}
          onWinnerDeleted={onWinnerDeleted}
        />
      )}

      {/* Tab 3: Security & Real-Time Password Change */}
      {activeAdminTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Password Change Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Real-Time Password Change</h3>
                <p className="text-[11px] text-slate-500">
                  New password will be securely updated in Firebase Authentication.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter at least 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Firebase Auth...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick Draw & Registration Controls Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">System Controls & Status</h3>
              <p className="text-[11px] text-slate-500">
                Manage registration availability and Lucky Draw locking status.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Registration Control</span>
                  <span className="text-slate-500 text-[11px]">
                    {config.registrationLocked ? 'Status: Locked (No new registrations allowed)' : 'Status: Active (Registrations open)'}
                  </span>
                </div>
                <button
                  onClick={handleToggleRegLock}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    config.registrationLocked ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {config.registrationLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <span className="font-bold text-slate-800 block">Lucky Draw Game Control</span>
                  <span className="text-slate-500 text-[11px]">
                    {config.drawLocked ? 'Status: Locked' : 'Status: Active'}
                  </span>
                </div>
                <button
                  onClick={handleToggleDrawLock}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    config.drawLocked ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {config.drawLocked ? 'Unlock' : 'Lock'}
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-950 block">Organizer Details Verification</span>
                <span className="text-slate-600 block mt-1">Organizer: {ORGANIZER_INFO.organizer}</span>
                <span className="text-slate-600 block">Contact: {ORGANIZER_INFO.primaryPhone}</span>
                <span className="text-slate-600 block">Address: {ORGANIZER_INFO.address}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
