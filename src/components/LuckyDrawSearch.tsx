import React, { useState } from 'react';
import { Participant, ORGANIZER_INFO } from '../types';
import { searchByLuckyDrawNumber, searchByMobile } from '../lib/drawService';
import { Search, Loader2, AlertCircle, Ticket, Printer, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { RegistrationSlip } from './RegistrationSlip';

export const LuckyDrawSearch: React.FC = () => {
  const [searchMode, setSearchMode] = useState<'number' | 'mobile'>('number');
  const [queryVal, setQueryVal] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [singleResult, setSingleResult] = useState<Participant | null>(null);
  const [mobileResults, setMobileResults] = useState<Participant[]>([]);
  const [selectedForSlip, setSelectedForSlip] = useState<Participant | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryVal.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSingleResult(null);
    setMobileResults([]);
    setSelectedForSlip(null);

    try {
      if (searchMode === 'number') {
        const res = await searchByLuckyDrawNumber(queryVal);
        setSingleResult(res);
      } else {
        const res = await searchByMobile(queryVal);
        setMobileResults(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
          Search Lucky Draw Number
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          {ORGANIZER_INFO.name} • Check your registration details & Lucky Draw Number status
        </p>

        {/* Toggle between Draw Number search & Mobile Number search */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl mt-4 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setSearchMode('number');
              setQueryVal('');
              setHasSearched(false);
              setSingleResult(null);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              searchMode === 'number'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Lucky Draw Number
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchMode('mobile');
              setQueryVal('');
              setHasSearched(false);
              setMobileResults([]);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              searchMode === 'mobile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            By Mobile Number (Family Members)
          </button>
        </div>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 sm:p-6 mb-8">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            {searchMode === 'number' ? (
              <input
                id="input-draw-number-search"
                type="text"
                value={queryVal}
                onChange={(e) => setQueryVal(e.target.value)}
                placeholder="Enter Lucky Draw Number (e.g. 001, 005)"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm sm:text-base outline-hidden transition font-medium"
              />
            ) : (
              <input
                id="input-mobile-search"
                type="tel"
                value={queryVal}
                onChange={(e) => setQueryVal(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm sm:text-base outline-hidden transition font-medium font-mono"
              />
            )}
          </div>
          <button
            id="btn-search-draw"
            type="submit"
            disabled={isSearching || !queryVal.trim()}
            className="px-6 py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Selected Participant Full Slip view */}
      {selectedForSlip && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-slate-700">Registration Slip Preview:</span>
            <button
              onClick={() => setSelectedForSlip(null)}
              className="text-xs text-amber-700 hover:underline font-semibold"
            >
              ✕ Close
            </button>
          </div>
          <RegistrationSlip
            participant={selectedForSlip}
            onRegisterAnother={() => setSelectedForSlip(null)}
          />
        </div>
      )}

      {/* Single Result for Lucky Draw Number */}
      {hasSearched && searchMode === 'number' && (
        <div>
          {singleResult ? (
            <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                Verified Entry
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex flex-col items-center justify-center text-white shadow-md border-2 border-amber-300 shrink-0">
                  <Ticket className="w-6 h-6 mb-1 opacity-80" />
                  <span className="text-2xl font-black font-mono tracking-wider">
                    {singleResult.drawNumber}
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-amber-100">
                    Lucky No.
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h3 className="text-xl font-bold text-slate-900">{singleResult.fullName}</h3>
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                    <div>
                      <span className="text-slate-400">Father's Name:</span>{' '}
                      <span className="font-semibold text-slate-800">{singleResult.fatherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mother's Name:</span>{' '}
                      <span className="font-semibold text-slate-800">{singleResult.motherName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Mobile Number:</span>{' '}
                      <span className="font-semibold text-slate-800 font-mono">+91 {singleResult.mobile}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">City / Location:</span>{' '}
                      <span className="font-semibold text-slate-800">{singleResult.location}</span>
                    </div>
                    <div className="sm:col-span-2 text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      Registration Date:{' '}
                      {new Date(singleResult.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </div>
                  </div>

                  <div className="pt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <button
                      onClick={() => setSelectedForSlip(singleResult)}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>View & Print Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No Record Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No participant found with Lucky Draw Number <strong className="text-slate-700">"{queryVal}"</strong>. Please verify the number.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Multiple Results for Mobile Number */}
      {hasSearched && searchMode === 'mobile' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800">
              Members registered with Mobile Number {queryVal} ({mobileResults.length}/5):
            </h3>
          </div>

          {mobileResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mobileResults.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-amber-300 transition"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Lucky Draw Number:</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white font-mono font-bold text-sm">
                        {p.drawNumber}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">#{p.sequenceNumber}</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{p.fullName}</div>
                    <div className="text-slate-600">Father: {p.fatherName} • Mother: {p.motherName}</div>
                    <div className="text-slate-500">{p.location}</div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setSelectedForSlip(p)}
                      className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" /> View Slip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No Registrations Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No participants have registered under mobile number {queryVal} yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
