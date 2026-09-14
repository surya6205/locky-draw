import React from 'react';
import { ORGANIZER_INFO } from '../types';
import { Sparkles, Phone, MapPin, Mail, ShieldCheck, Ticket, Trophy } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onOpenAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isAdminLoggedIn,
  onOpenAdmin,
}) => {
  return (
    <header className="bg-white border-b border-amber-200/80 shadow-xs sticky top-0 z-40">
      {/* Top Gold / Saffron announcement banner */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white px-4 py-1.5 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-200 animate-pulse"></span>
            <span className="font-bold tracking-wide">| DHARMALABH SAUBHAGYA DRAW 2026 |</span>
          </div>
          <div className="flex items-center gap-4 text-amber-100 text-xs">
            <a href={`tel:${ORGANIZER_INFO.secondaryPhones[1]}`} className="hover:text-white flex items-center gap-1 transition">
              <Phone className="w-3 h-3" />
              <span>{ORGANIZER_INFO.primaryPhone}</span>
            </a>
            <span className="hidden sm:inline opacity-70">|</span>
            <span className="hidden md:inline flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>Jhotwara, Jaipur</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Branding Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0 border border-amber-300">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-950 font-heading">
                  {ORGANIZER_INFO.name}
                </h1>
                <span className="bg-amber-100 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                  Official Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                Organizer: <span className="text-amber-900 font-semibold">{ORGANIZER_INFO.organizer}</span> • Jhotwara, Jaipur (Raj.)
              </p>
            </div>
          </div>

          {/* Quick contact badge */}
          <div className="hidden lg:flex items-center gap-3 bg-amber-50/80 border border-amber-200/90 rounded-xl px-3.5 py-2 text-xs">
            <div className="text-right">
              <div className="font-semibold text-slate-800">Helpline & Inquiries</div>
              <div className="text-slate-600 font-mono text-[11px]">{ORGANIZER_INFO.secondaryPhones[0]} / {ORGANIZER_INFO.secondaryPhones[1]}</div>
            </div>
            <a
              href={`https://wa.me/918386862130?text=${encodeURIComponent('Hello Manish ji, I have an inquiry regarding DHARMALABH SAUBHAGYA DRAW.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg font-medium transition text-xs flex items-center gap-1 shadow-xs"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Navigation Bar */}
        <nav className="flex items-center justify-between border-t border-slate-100 mt-4 pt-3 overflow-x-auto gap-2 scrollbar-none">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              id="nav-tab-register"
              onClick={() => setActiveTab('register')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'register'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Registration</span>
            </button>

            <button
              id="nav-tab-search"
              onClick={() => setActiveTab('search')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'search'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Search Number</span>
            </button>

            <button
              id="nav-tab-winners"
              onClick={() => setActiveTab('winners')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'winners'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Winners List (Live Results)</span>
            </button>

            <button
              id="nav-tab-organizer"
              onClick={() => setActiveTab('organizer')}
              className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'organizer'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-amber-50 hover:text-amber-900'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span>Organizer Info</span>
            </button>

            {/* Admin only Draw shortcut if logged in */}
            {isAdminLoggedIn && (
              <button
                id="nav-tab-admin-draw"
                onClick={() => setActiveTab('draw')}
                className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 whitespace-nowrap border border-amber-400/60 ${
                  activeTab === 'draw'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                }`}
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Admin Draw & Scratch</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="nav-tab-admin"
              onClick={onOpenAdmin}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 border ${
                activeTab === 'admin'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <span>{isAdminLoggedIn ? 'Admin Panel' : 'Admin Login'}</span>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
};
