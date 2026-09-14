import React, { useState, useEffect } from 'react';
import { Participant, DrawWinner, DrawConfig, ORGANIZER_INFO } from '../types';
import { ScratchCard } from './ScratchCard';
import { TopThreeDrawCards } from './TopThreeDrawCards';
import { saveWinnerToHistory, updateDrawConfig } from '../lib/drawService';
import {
  Sparkles,
  Award,
  Trophy,
  Lock,
  Unlock,
  CheckCircle2,
  RefreshCw,
  Gift,
  Phone,
  User,
  AlertTriangle,
} from 'lucide-react';

interface LuckyDrawGameProps {
  participants: Participant[];
  winners: DrawWinner[];
  config: DrawConfig;
  isAdmin: boolean;
  onWinnerAdded: (winner: DrawWinner) => void;
}

export const LuckyDrawGame: React.FC<LuckyDrawGameProps> = ({
  participants,
  winners,
  config,
  isAdmin,
  onWinnerAdded,
}) => {
  const [drawMode, setDrawMode] = useState<'top3' | 'single'>('top3');
  const [selectedPrize, setSelectedPrize] = useState('1st Grand Prize');
  const [customPrize, setCustomPrize] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [rollingNumber, setRollingNumber] = useState('000');
  const [currentDrawnParticipant, setCurrentDrawnParticipant] = useState<Participant | null>(null);
  const [isWinnerSaved, setIsWinnerSaved] = useState(false);
  const [savingWinner, setSavingWinner] = useState(false);

  // Filter eligible participants (exclude already drawn winners)
  const winnerParticipantIds = new Set(winners.map((w) => w.participantId));
  const eligibleParticipants = participants.filter((p) => !winnerParticipantIds.has(p.id));

  // Sound or animation effect when rolling
  const startDraw = () => {
    if (config.drawLocked) {
      alert('Lucky draw is currently locked. Please unlock it first.');
      return;
    }

    if (eligibleParticipants.length === 0) {
      alert('No eligible participants available for draw. Please register participants first.');
      return;
    }

    setIsDrawing(true);
    setCurrentDrawnParticipant(null);
    setIsWinnerSaved(false);

    // Suspense rolling ticker
    let counter = 0;
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
      setRollingNumber(eligibleParticipants[randomIndex].drawNumber);
      counter++;

      if (counter > 25) {
        clearInterval(interval);
        // Final pick
        const finalWinnerIndex = Math.floor(Math.random() * eligibleParticipants.length);
        const finalWinner = eligibleParticipants[finalWinnerIndex];
        setRollingNumber(finalWinner.drawNumber);
        setCurrentDrawnParticipant(finalWinner);
        setIsDrawing(false);
      }
    }, 90);
  };

  const handleSaveWinner = async () => {
    if (!currentDrawnParticipant || isWinnerSaved) return;

    try {
      setSavingWinner(true);
      const prizeName = selectedPrize === 'Custom Prize' ? (customPrize.trim() || 'Special Prize') : selectedPrize;
      const winnerData: Omit<DrawWinner, 'id'> = {
        drawNumber: currentDrawnParticipant.drawNumber,
        participantId: currentDrawnParticipant.id,
        fullName: currentDrawnParticipant.fullName,
        fatherName: currentDrawnParticipant.fatherName,
        motherName: currentDrawnParticipant.motherName,
        mobile: currentDrawnParticipant.mobile,
        location: currentDrawnParticipant.location,
        prize: prizeName,
        wonAt: new Date().toISOString(),
        scratchRevealed: true,
      };

      const saved = await saveWinnerToHistory(winnerData);
      setIsWinnerSaved(true);
      if (saved) {
        onWinnerAdded(saved);
      }
    } catch (err: any) {
      alert('Error saving winner: ' + err.message);
    } finally {
      setSavingWinner(false);
    }
  };

  const handleToggleRegistrationLock = async () => {
    try {
      await updateDrawConfig({ registrationLocked: !config.registrationLocked });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleDrawLock = async () => {
    try {
      await updateDrawConfig({ drawLocked: !config.drawLocked });
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2 border border-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Person-wise Lucky Draw & Scratch Card</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
          {ORGANIZER_INFO.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Every registered person receives an independent Lucky Draw Number. The participant details for drawn numbers will be automatically retrieved.
        </p>
      </div>

      {/* Lock Status & Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Total Registrations:</span>
            <span className="font-bold text-slate-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {participants.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Eligible for Draw:</span>
            <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {eligibleParticipants.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Announced Winners:</span>
            <span className="font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
              {winners.length}
            </span>
          </div>
        </div>

        {/* Lock Controls (Visible to Admin or available with warning) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleRegistrationLock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              config.registrationLocked
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Lock or unlock registration"
          >
            {config.registrationLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{config.registrationLocked ? 'Registration Locked' : 'Registration Active'}</span>
          </button>

          <button
            onClick={handleToggleDrawLock}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border ${
              config.drawLocked
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
            title="Lock or unlock draw process"
          >
            {config.drawLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{config.drawLocked ? 'Draw Locked' : 'Draw Active'}</span>
          </button>
        </div>
      </div>

      {/* Draw Mode Switcher */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <button
          id="btn-mode-top3"
          onClick={() => setDrawMode('top3')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-xs ${
            drawMode === 'top3'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md ring-2 ring-amber-300'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-300" />
          <span>Top 3 Winners Scratch Cards (1st, 2nd, 3rd)</span>
        </button>

        <button
          id="btn-mode-single"
          onClick={() => setDrawMode('single')}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 transition shadow-xs ${
            drawMode === 'single'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md ring-2 ring-amber-300'
              : 'bg-white text-slate-700 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Single Lucky Number Draw</span>
        </button>
      </div>

      {drawMode === 'top3' ? (
        <TopThreeDrawCards
          participants={participants}
          winners={winners}
          config={config}
          isAdmin={isAdmin}
          onWinnerAdded={onWinnerAdded}
        />
      ) : (
        /* Main Draw Arena Card */
        <div className="bg-gradient-to-b from-amber-500/10 via-white to-white rounded-3xl border-2 border-amber-300 shadow-xl p-6 sm:p-10 text-center relative overflow-hidden mb-10">
        <div className="max-w-md mx-auto space-y-6">
          {/* Prize Selection */}
          <div className="text-left">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Prize Category
            </label>
            <select
              value={selectedPrize}
              onChange={(e) => setSelectedPrize(e.target.value)}
              disabled={isDrawing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-800 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden transition"
            >
              <option value="1st Grand Prize">1st Grand Prize</option>
              <option value="2nd Prize">2nd Prize</option>
              <option value="3rd Prize">3rd Prize</option>
              <option value="4th Prize">4th Prize</option>
              <option value="5th Prize">5th Prize</option>
              <option value="Consolation Prize">Consolation Prize</option>
              <option value="Special Dharma Labh Gift">Special Dharma Labh Gift</option>
              <option value="Custom Prize">Custom Prize (Enter Name)</option>
            </select>

            {selectedPrize === 'Custom Prize' && (
              <input
                type="text"
                value={customPrize}
                onChange={(e) => setCustomPrize(e.target.value)}
                placeholder="Enter custom prize name (e.g. Smart TV / Refrigerator / Silver Coin)"
                className="mt-2 w-full px-3.5 py-2 rounded-xl border border-amber-300 text-xs text-slate-800 focus:outline-hidden"
              />
            )}
          </div>

          {/* Rolling Number Display */}
          <div className="py-2">
            <div className="inline-flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-900 text-white shadow-2xl border-4 border-amber-400 min-w-[240px]">
              <span className="text-[11px] uppercase tracking-widest text-amber-300 font-bold mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Lucky Draw Number
              </span>
              <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-amber-400">
                {isDrawing ? rollingNumber : (currentDrawnParticipant ? currentDrawnParticipant.drawNumber : '---')}
              </div>
              <span className="text-[10px] text-slate-400 mt-2">
                {isDrawing ? 'Rolling number...' : (currentDrawnParticipant ? 'Draw Completed!' : 'Ready')}
              </span>
            </div>
          </div>

          {/* Trigger Draw Button */}
          {!currentDrawnParticipant && (
            <div>
              <button
                id="btn-trigger-draw"
                onClick={startDraw}
                disabled={isDrawing || config.drawLocked || eligibleParticipants.length === 0}
                className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-black text-lg shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDrawing ? (
                  <>
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <span>Drawing lucky number...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-6 h-6 text-amber-300" />
                    <span>Draw Lucky Number</span>
                  </>
                )}
              </button>

              {eligibleParticipants.length === 0 && (
                <p className="text-xs text-rose-600 mt-2 font-medium">
                  At least 1 participant must be registered to run the draw.
                </p>
              )}
            </div>
          )}

          {/* Scratch to Reveal Card Area */}
          {currentDrawnParticipant && (
            <div className="pt-4 animate-in fade-in zoom-in duration-300">
              <div className="mb-3 text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Scratch the card to reveal the winner's name and details!</span>
              </div>

              {/* Scratch Card Component */}
              <ScratchCard
                width={360}
                height={260}
                onRevealComplete={() => {
                  // Confetti triggers inside ScratchCard
                }}
              >
                <div className="text-center p-3 w-full">
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider mb-1">
                    {selectedPrize === 'Custom Prize' ? (customPrize || 'Winner') : selectedPrize}
                  </div>

                  <div className="text-3xl font-black font-mono text-amber-700 tracking-wider">
                    {currentDrawnParticipant.drawNumber}
                  </div>

                  <div className="text-xl font-bold text-slate-900 mt-1">
                    {currentDrawnParticipant.fullName}
                  </div>

                  <div className="text-xs text-slate-600 mt-1">
                    Father: <span className="font-semibold text-slate-800">{currentDrawnParticipant.fatherName}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Mother: <span className="font-semibold text-slate-800">{currentDrawnParticipant.motherName}</span>
                  </div>

                  <div className="text-xs text-slate-700 font-mono mt-1">
                    Mob: +91 {currentDrawnParticipant.mobile}
                  </div>

                  <div className="text-[11px] text-amber-900 font-medium mt-1">
                    Location: {currentDrawnParticipant.location}
                  </div>
                </div>
              </ScratchCard>

              {/* Save Winner Button */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  id="btn-save-winner"
                  onClick={handleSaveWinner}
                  disabled={isWinnerSaved || savingWinner}
                  className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-md ${
                    isWinnerSaved
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-slate-900 hover:bg-black text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    {isWinnerSaved
                      ? 'Winner successfully saved to history'
                      : savingWinner
                      ? 'Saving...'
                      : 'Save Winner to History'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setCurrentDrawnParticipant(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs sm:text-sm font-semibold transition border border-amber-300"
                >
                  Draw Next Lucky Number
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};
