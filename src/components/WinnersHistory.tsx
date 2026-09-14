import React, { useState } from 'react';
import { DrawWinner, ORGANIZER_INFO } from '../types';
import { deleteWinnerFromHistory } from '../lib/drawService';
import { Trophy, Printer, Download, Search, Trash2, Sparkles, User, MapPin } from 'lucide-react';

interface WinnersHistoryProps {
  winners: DrawWinner[];
  isAdmin: boolean;
  onWinnerDeleted?: (winnerId: string) => void;
}

export const WinnersHistory: React.FC<WinnersHistoryProps> = ({
  winners,
  isAdmin,
  onWinnerDeleted,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredWinners = winners.filter((w) => {
    const q = searchTerm.toLowerCase().trim();
    return (
      w.drawNumber.toLowerCase().includes(q) ||
      w.fullName.toLowerCase().includes(q) ||
      w.mobile.includes(q) ||
      w.location.toLowerCase().includes(q) ||
      w.prize.toLowerCase().includes(q)
    );
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (winners.length === 0) return;
    const headers = ['Lucky Draw Number', 'Prize', 'Winner Name', 'Father Name', 'Mother Name', 'Mobile', 'Location', 'Draw Date'];
    const rows = winners.map((w) => [
      `"${w.drawNumber}"`,
      `"${w.prize}"`,
      `"${w.fullName}"`,
      `"${w.fatherName}"`,
      `"${w.motherName}"`,
      `"${w.mobile}"`,
      `"${w.location}"`,
      `"${new Date(w.wonAt).toLocaleString('en-IN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DHARMALABH_Lucky_Draw_Winners_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async (winnerId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove winner "${name}" from history?`)) return;
    try {
      await deleteWinnerFromHistory(winnerId);
      if (onWinnerDeleted) onWinnerDeleted(winnerId);
    } catch (err: any) {
      alert('Error deleting winner: ' + err.message);
    }
  };

  const firstWinner = winners.find((w) => w.position === 1 || w.prize?.toLowerCase().includes('1st'));
  const secondWinner = winners.find((w) => w.position === 2 || w.prize?.toLowerCase().includes('2nd'));
  const thirdWinner = winners.find((w) => w.position === 3 || w.prize?.toLowerCase().includes('3rd'));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2 border border-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          <span>Lucky Draw Winners History</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading uppercase">
          {ORGANIZER_INFO.name} - Winners List
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Organizer: {ORGANIZER_INFO.organizer} • Jhotwara, Jaipur
        </p>
      </div>

      {/* Top 3 Winners Podium Showcase */}
      {(firstWinner || secondWinner || thirdWinner) && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 font-heading">
              Top 3 Winning Positions
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1st Winner */}
            {firstWinner ? (
              <div className="bg-gradient-to-b from-amber-50 to-white rounded-2xl border-2 border-amber-400 p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[11px] shadow-xs flex items-center gap-1">
                    🥇 1st Prize Winner
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-300">
                    #{firstWinner.drawNumber}
                  </span>
                </div>
                <div className="my-2">
                  <h4 className="text-lg font-bold text-slate-900">{firstWinner.fullName}</h4>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Father: <span className="font-semibold text-slate-800">{firstWinner.fatherName}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Mother: <span className="font-semibold text-slate-800">{firstWinner.motherName}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-amber-200/70 text-[11px] text-slate-700 flex items-center justify-between">
                  <span className="font-mono font-semibold">+91 {firstWinner.mobile}</span>
                  <span className="text-amber-900 font-medium">{firstWinner.location}</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[140px] text-slate-400 text-xs">
                <span className="text-xl mb-1">🥇</span>
                <span className="font-semibold">1st Prize</span>
                <span className="text-[11px]">Pending Scratch Draw</span>
              </div>
            )}

            {/* 2nd Winner */}
            {secondWinner ? (
              <div className="bg-gradient-to-b from-slate-100 to-white rounded-2xl border-2 border-slate-300 p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-600 text-white font-extrabold text-[11px] shadow-xs flex items-center gap-1">
                    🥈 2nd Prize Winner
                  </span>
                  <span className="text-2xl font-black font-mono text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-lg border border-slate-300">
                    #{secondWinner.drawNumber}
                  </span>
                </div>
                <div className="my-2">
                  <h4 className="text-lg font-bold text-slate-900">{secondWinner.fullName}</h4>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Father: <span className="font-semibold text-slate-800">{secondWinner.fatherName}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Mother: <span className="font-semibold text-slate-800">{secondWinner.motherName}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 flex items-center justify-between">
                  <span className="font-mono font-semibold">+91 {secondWinner.mobile}</span>
                  <span className="text-slate-800 font-medium">{secondWinner.location}</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[140px] text-slate-400 text-xs">
                <span className="text-xl mb-1">🥈</span>
                <span className="font-semibold">2nd Prize</span>
                <span className="text-[11px]">Pending Scratch Draw</span>
              </div>
            )}

            {/* 3rd Winner */}
            {thirdWinner ? (
              <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl border-2 border-orange-400 p-4 shadow-md relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-orange-700 text-white font-extrabold text-[11px] shadow-xs flex items-center gap-1">
                    🥉 3rd Prize Winner
                  </span>
                  <span className="text-2xl font-black font-mono text-orange-800 bg-orange-100/80 px-2 py-0.5 rounded-lg border border-orange-300">
                    #{thirdWinner.drawNumber}
                  </span>
                </div>
                <div className="my-2">
                  <h4 className="text-lg font-bold text-slate-900">{thirdWinner.fullName}</h4>
                  <div className="text-xs text-slate-600 mt-0.5">
                    Father: <span className="font-semibold text-slate-800">{thirdWinner.fatherName}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Mother: <span className="font-semibold text-slate-800">{thirdWinner.motherName}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-orange-200 text-[11px] text-slate-700 flex items-center justify-between">
                  <span className="font-mono font-semibold">+91 {thirdWinner.mobile}</span>
                  <span className="text-orange-900 font-medium">{thirdWinner.location}</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center flex flex-col items-center justify-center min-h-[140px] text-slate-400 text-xs">
                <span className="text-xl mb-1">🥉</span>
                <span className="font-semibold">3rd Prize</span>
                <span className="text-[11px]">Pending Scratch Draw</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Control bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search winner name or number..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            disabled={winners.length === 0}
            className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={winners.length === 0}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print List</span>
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div id="printable-area">
        {filteredWinners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWinners.map((winner, idx) => (
              <div
                key={winner.id}
                className="bg-white rounded-2xl border-2 border-amber-200/90 shadow-sm p-5 hover:border-amber-400 transition relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex flex-col items-center justify-center font-mono font-black text-xl shadow-md border-2 border-amber-300 shrink-0">
                      {winner.drawNumber}
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-1 border border-amber-300">
                        {winner.prize}
                      </span>
                      <h4 className="text-base font-bold text-slate-900">{winner.fullName}</h4>
                    </div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(winner.id, winner.fullName)}
                      title="Remove from winner history"
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400">Father:</span> <span className="font-semibold text-slate-800">{winner.fatherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Mother:</span> <span className="font-semibold text-slate-800">{winner.motherName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Mobile:</span> <span className="font-semibold text-slate-800 font-mono">+91 {winner.mobile}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Location:</span> <span className="font-semibold text-slate-800">{winner.location}</span>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-400 pt-1">
                    Announced on: {new Date(winner.wonAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No winners announced yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Once a lucky draw is performed, all winning participants will be automatically displayed here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
