import React from 'react';
import { DrawWinner } from '../types';
import { Trophy, Sparkles, Radio, ArrowRight } from 'lucide-react';

interface LiveWinnersBannerProps {
  winners: DrawWinner[];
  onViewWinners: () => void;
}

export const LiveWinnersBanner: React.FC<LiveWinnersBannerProps> = ({
  winners,
  onViewWinners,
}) => {
  if (winners.length === 0) return null;

  // Find 1st, 2nd, and 3rd winners
  const firstWinner = winners.find((w) => w.position === 1 || w.prize?.toLowerCase().includes('1st'));
  const secondWinner = winners.find((w) => w.position === 2 || w.prize?.toLowerCase().includes('2nd'));
  const thirdWinner = winners.find((w) => w.position === 3 || w.prize?.toLowerCase().includes('3rd'));

  return (
    <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b-2 border-amber-400/80 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 text-xs">
        {/* Left Live Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 text-[11px]">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>LIVE WINNERS</span>
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-amber-300 font-medium hidden sm:inline">
            Official Lucky Draw Results
          </span>
        </div>

        {/* Center Winners Ticker */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {firstWinner && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 px-2.5 py-0.5 rounded-lg border border-amber-400/40">
              <span className="text-base">🥇</span>
              <span className="font-bold text-amber-300">1st Prize:</span>
              <span className="text-white font-semibold">{firstWinner.fullName}</span>
              <span className="font-mono font-bold text-amber-200 bg-black/40 px-1.5 py-0.2 rounded text-[11px]">
                #{firstWinner.drawNumber}
              </span>
            </div>
          )}

          {secondWinner && (
            <div className="flex items-center gap-1.5 bg-slate-400/20 px-2.5 py-0.5 rounded-lg border border-slate-300/40">
              <span className="text-base">🥈</span>
              <span className="font-bold text-slate-200">2nd Prize:</span>
              <span className="text-white font-semibold">{secondWinner.fullName}</span>
              <span className="font-mono font-bold text-slate-100 bg-black/40 px-1.5 py-0.2 rounded text-[11px]">
                #{secondWinner.drawNumber}
              </span>
            </div>
          )}

          {thirdWinner && (
            <div className="flex items-center gap-1.5 bg-orange-700/30 px-2.5 py-0.5 rounded-lg border border-orange-400/40">
              <span className="text-base">🥉</span>
              <span className="font-bold text-orange-300">3rd Prize:</span>
              <span className="text-white font-semibold">{thirdWinner.fullName}</span>
              <span className="font-mono font-bold text-orange-200 bg-black/40 px-1.5 py-0.2 rounded text-[11px]">
                #{thirdWinner.drawNumber}
              </span>
            </div>
          )}

          {!firstWinner && !secondWinner && !thirdWinner && (
            <div className="text-slate-300">
              Latest Winner: <strong className="text-amber-300">{winners[0].fullName}</strong> (#{winners[0].drawNumber} - {winners[0].prize})
            </div>
          )}
        </div>

        {/* Right CTA */}
        <button
          onClick={onViewWinners}
          className="self-end md:self-auto text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 hover:underline text-[11px] shrink-0"
        >
          <span>View All Winners ({winners.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
