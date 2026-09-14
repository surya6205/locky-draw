import React, { useState } from 'react';
import { Participant, DrawWinner, DrawConfig, ORGANIZER_INFO } from '../types';
import { ScratchCard } from './ScratchCard';
import { saveWinnerToHistory } from '../lib/drawService';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Gift,
  Lock,
  Phone,
  MapPin,
  Flame,
  Radio,
  Share2,
} from 'lucide-react';

interface TopThreeDrawCardsProps {
  participants: Participant[];
  winners: DrawWinner[];
  config: DrawConfig;
  isAdmin: boolean;
  onWinnerAdded?: (winner: DrawWinner) => void;
}

interface DrawnCard {
  position: 1 | 2 | 3;
  prizeTitle: string;
  theme: 'gold' | 'silver' | 'bronze';
  badge: string;
  participant: Participant;
  isRevealed: boolean;
  isSavedLive: boolean;
  isSaving: boolean;
}

export const TopThreeDrawCards: React.FC<TopThreeDrawCardsProps> = ({
  participants,
  winners,
  config,
  isAdmin,
  onWinnerAdded,
}) => {
  // Existing winners participant IDs to avoid duplicate draws
  const existingWinnerIds = new Set(winners.map((w) => w.participantId));
  const eligibleParticipants = participants.filter((p) => !existingWinnerIds.has(p.id));

  const [cards, setCards] = useState<DrawnCard[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Cryptographically secure unbiased random selection strictly from eligible registered participants
  const generateRandomThree = () => {
    setGlobalError(null);
    if (config.drawLocked) {
      setGlobalError('Lucky draw is currently locked by the administrator.');
      return;
    }

    if (eligibleParticipants.length < 3) {
      setGlobalError(
        `At least 3 eligible participants are required to draw 1st, 2nd, and 3rd winners. Currently available: ${eligibleParticipants.length}`
      );
      return;
    }

    setIsGenerating(true);

    // Cryptographic shuffle (Fisher-Yates)
    setTimeout(() => {
      try {
        const pool = [...eligibleParticipants];
        const cryptoObj = window.crypto || (window as any).msCrypto;

        for (let i = pool.length - 1; i > 0; i--) {
          const randomBuffer = new Uint32Array(1);
          cryptoObj.getRandomValues(randomBuffer);
          const j = randomBuffer[0] % (i + 1);
          [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        const picked = pool.slice(0, 3);

        const newCards: DrawnCard[] = [
          {
            position: 1,
            prizeTitle: '1st Prize (Grand Winner)',
            theme: 'gold',
            badge: '🥇 1st Position',
            participant: picked[0],
            isRevealed: false,
            isSavedLive: false,
            isSaving: false,
          },
          {
            position: 2,
            prizeTitle: '2nd Prize (Second Winner)',
            theme: 'silver',
            badge: '🥈 2nd Position',
            participant: picked[1],
            isRevealed: false,
            isSavedLive: false,
            isSaving: false,
          },
          {
            position: 3,
            prizeTitle: '3rd Prize (Third Winner)',
            theme: 'bronze',
            badge: '🥉 3rd Position',
            participant: picked[2],
            isRevealed: false,
            isSavedLive: false,
            isSaving: false,
          },
        ];

        setCards(newCards);
      } catch (err: any) {
        setGlobalError('Error generating random cards: ' + err.message);
      } finally {
        setIsGenerating(false);
      }
    }, 600);
  };

  // When a card is scratched or revealed, immediately persist to Firestore to show LIVE everywhere!
  const handleRevealCard = async (cardIndex: number) => {
    if (!cards || !cards[cardIndex]) return;
    const targetCard = cards[cardIndex];
    if (targetCard.isRevealed || targetCard.isSavedLive) return;

    // Update local card state to revealed & saving
    const updatedCards = [...cards];
    updatedCards[cardIndex] = {
      ...targetCard,
      isRevealed: true,
      isSaving: true,
    };
    setCards(updatedCards);

    // Save directly to Firestore database
    try {
      const winnerPayload: Omit<DrawWinner, 'id'> = {
        drawNumber: targetCard.participant.drawNumber,
        participantId: targetCard.participant.id,
        fullName: targetCard.participant.fullName,
        fatherName: targetCard.participant.fatherName,
        motherName: targetCard.participant.motherName,
        mobile: targetCard.participant.mobile,
        location: targetCard.participant.location,
        prize: targetCard.prizeTitle,
        position: targetCard.position,
        wonAt: new Date().toISOString(),
        scratchRevealed: true,
      };

      const saved = await saveWinnerToHistory(winnerPayload);

      // Trigger celebratory confetti
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });

      // Update card as saved live
      setCards((prev) => {
        if (!prev) return null;
        const copy = [...prev];
        copy[cardIndex] = {
          ...copy[cardIndex],
          isRevealed: true,
          isSaving: false,
          isSavedLive: true,
        };
        return copy;
      });

      if (saved && onWinnerAdded) {
        onWinnerAdded(saved);
      }
    } catch (err: any) {
      console.error('Error saving winner to Firestore:', err);
      setCards((prev) => {
        if (!prev) return null;
        const copy = [...prev];
        copy[cardIndex] = {
          ...copy[cardIndex],
          isSaving: false,
        };
        return copy;
      });
      alert('Error updating live winners: ' + err.message);
    }
  };

  // Reveal all 3 cards in one click
  const handleRevealAll = async () => {
    if (!cards) return;
    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].isRevealed) {
        await handleRevealCard(i);
      }
    }
  };

  const handleReset = () => {
    if (cards && cards.some((c) => c.isRevealed && !c.isSavedLive)) {
      if (!confirm('Are you sure you want to discard these cards?')) return;
    }
    setCards(null);
  };

  return (
    <div className="w-full">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg mb-6 border-2 border-amber-400/40">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-amber-400/20 text-amber-200 border border-amber-300/30">
                <Trophy className="w-5 h-5 text-amber-300" />
              </span>
              <span className="text-xs uppercase font-mono tracking-widest text-amber-200 font-bold">
                100% RANDOM DRAW • 3 SCRATCH CARDS
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold font-heading">
              Top 3 Winners Draw (1st, 2nd, 3rd Prize)
            </h3>
            <p className="text-xs text-amber-100 mt-1 max-w-2xl">
              Generates 3 separate scratch cards picked 100% at random from all registered participants (Numbers #001 to #{participants.length.toString().padStart(3, '0')}). Once scratched, each winner's Lucky Draw Number and Name immediately broadcast <strong className="text-white underline">LIVE on all devices</strong>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!cards ? (
              <button
                id="btn-generate-3-cards"
                onClick={generateRandomThree}
                disabled={isGenerating || config.drawLocked || eligibleParticipants.length < 3}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-amber-50 text-slate-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                    <span>Picking Random Numbers...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Generate 3 Random Scratch Cards</span>
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleRevealAll}
                  className="px-4 py-2 rounded-xl bg-amber-900/60 hover:bg-amber-900 text-white text-xs font-bold transition flex items-center gap-1.5 border border-amber-400/40"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Reveal All 3 Cards</span>
                </button>
                <button
                  onClick={handleReset}
                  className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition"
                >
                  New Draw
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="mt-4 pt-3 border-t border-amber-500/40 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-300"></span>
            </span>
            <span className="font-semibold text-emerald-200">
              Live Cloud Broadcast: Active
            </span>
          </div>
          <div className="text-amber-100 text-[11px] font-mono">
            Pool: {eligibleParticipants.length} eligible participants • No preset numbers allowed
          </div>
        </div>
      </div>

      {/* Error Message */}
      {globalError && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
          <Lock className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* 3 Scratch Cards Grid */}
      {cards && (
        <div>
          <div className="mb-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold border border-amber-300">
              <Flame className="w-3.5 h-3.5 text-orange-600" />
              <span>3 Winner Cards Ready: Scratch each card with your finger or mouse</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <div
                key={card.position}
                className={`bg-white rounded-3xl border-2 p-5 shadow-lg flex flex-col items-center relative transition ${
                  card.position === 1
                    ? 'border-amber-400 shadow-amber-500/10'
                    : card.position === 2
                    ? 'border-slate-300 shadow-slate-500/10'
                    : 'border-orange-500 shadow-orange-500/10'
                }`}
              >
                {/* Position Title Pill */}
                <div className="w-full flex items-center justify-between mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs ${
                      card.position === 1
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-900 border border-amber-300'
                        : card.position === 2
                        ? 'bg-gradient-to-r from-slate-300 to-slate-200 text-slate-900 border border-slate-300'
                        : 'bg-gradient-to-r from-orange-600 to-amber-700 text-white border border-orange-400'
                    }`}
                  >
                    {card.badge}
                  </span>

                  {card.isSavedLive ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1 border border-emerald-300">
                      <Radio className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>LIVE ON ALL SCREENS</span>
                    </span>
                  ) : card.isSaving ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Saving live...</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium">
                      Scratch to reveal
                    </span>
                  )}
                </div>

                {/* The Scratch Card Canvas Component */}
                <div className="w-full flex justify-center my-2">
                  <ScratchCard
                    width={290}
                    height={220}
                    theme={card.theme}
                    cardTitle={card.badge}
                    cardSubtitle="Scratch to Reveal Lucky Winner"
                    isRevealedExternal={card.isRevealed}
                    onRevealComplete={() => handleRevealCard(idx)}
                  >
                    <div className="text-center w-full px-2">
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-slate-900 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                        {card.prizeTitle}
                      </div>

                      <div className="text-3xl font-black font-mono tracking-wider text-slate-900 mt-0.5">
                        #{card.participant.drawNumber}
                      </div>

                      <div className="text-base sm:text-lg font-bold text-slate-900 leading-snug mt-1">
                        {card.participant.fullName}
                      </div>

                      <div className="text-[11px] text-slate-600 mt-1">
                        Father: <span className="font-semibold text-slate-800">{card.participant.fatherName}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Mother: <span className="font-semibold text-slate-800">{card.participant.motherName}</span>
                      </div>

                      <div className="text-[11px] text-slate-700 font-mono mt-1 font-semibold">
                        Mob: +91 {card.participant.mobile}
                      </div>

                      <div className="text-[10px] text-amber-900 font-medium mt-0.5 flex items-center justify-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-700" />
                        <span>{card.participant.location}</span>
                      </div>
                    </div>
                  </ScratchCard>
                </div>

                {/* Card footer status */}
                <div className="w-full mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {card.isSavedLive
                      ? 'Saved & Broadcasted'
                      : card.isRevealed
                      ? 'Revealed'
                      : 'Unscratched'}
                  </span>

                  {card.isSavedLive && (
                    <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified Winner</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info card when no cards generated */}
      {!cards && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200">
            <Trophy className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-900">
            Ready to Draw 1st, 2nd, and 3rd Prize Winners
          </h4>
          <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
            Click the "Generate 3 Random Scratch Cards" button above. The algorithm will randomly draw 3 unique participants from total registrations ({participants.length} registered) and create scratch cards for Position 1, Position 2, and Position 3.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              🥇 <strong>1st Prize (Gold Card)</strong>
            </span>
            <span className="flex items-center gap-1">
              🥈 <strong>2nd Prize (Silver Card)</strong>
            </span>
            <span className="flex items-center gap-1">
              🥉 <strong>3rd Prize (Bronze Card)</strong>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
