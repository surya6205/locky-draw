import React from 'react';
import { ORGANIZER_INFO } from '../types';
import { Phone, Mail, MapPin, User, Sparkles, MessageCircle, ExternalLink } from 'lucide-react';

export const OrganizerCard: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl border-2 border-amber-300 shadow-xl overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-6 sm:p-8 text-center relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-100 text-xs font-semibold mb-2 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>Authorized Organizer Details</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">{ORGANIZER_INFO.name}</h2>
          <p className="text-xs sm:text-sm text-amber-100 mt-1">
            Official guidelines, coordination, and transparent Lucky Draw operation
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Organizer name and badge */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-amber-300 shrink-0">
              MJ
            </div>
            <div className="text-center sm:text-left">
              <span className="text-xs uppercase font-bold text-amber-800 tracking-wider">
                Head Organizer
              </span>
              <h3 className="text-xl font-bold text-slate-900 mt-0.5">{ORGANIZER_INFO.organizer}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Authorized contact and coordinator for DHARMALABH SAUBHAGYA DRAW.
              </p>
            </div>
          </div>

          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Phone numbers */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Contact Numbers</span>
              </div>
              <div className="space-y-1.5 font-mono text-sm">
                <div>
                  <a
                    href={`tel:${ORGANIZER_INFO.secondaryPhones[1]}`}
                    className="font-bold text-slate-800 hover:text-amber-700 transition"
                  >
                    {ORGANIZER_INFO.primaryPhone}
                  </a>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md ml-2 border border-emerald-200">
                    Primary
                  </span>
                </div>
                <div className="text-slate-700">
                  <a href={`tel:${ORGANIZER_INFO.secondaryPhones[0]}`} className="hover:text-amber-700 transition">
                    9782162010
                  </a>
                  {' / '}
                  <a href={`tel:${ORGANIZER_INFO.secondaryPhones[1]}`} className="hover:text-amber-700 transition">
                    8386862130
                  </a>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold">
                <Mail className="w-4 h-4 text-blue-600" />
                <span>Email Address</span>
              </div>
              <a
                href={`mailto:${ORGANIZER_INFO.email}`}
                className="font-semibold text-slate-800 hover:text-amber-700 transition break-all text-sm"
              >
                {ORGANIZER_INFO.email}
              </a>
            </div>

            {/* Address full width */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs sm:col-span-2">
              <div className="flex items-center gap-2 text-slate-500 mb-2 font-semibold">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Office & Contact Address</span>
              </div>
              <p className="font-bold text-slate-900 text-sm">{ORGANIZER_INFO.address}</p>
              <span className="text-slate-500 text-[11px] mt-1 block">
                Near Panchayat Samithi, 3 New Colony, Jhotwara, Jaipur - 325185 (Rajasthan)
              </span>
            </div>
          </div>

          {/* WhatsApp & Call Direct Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <a
              href={`https://wa.me/918386862130?text=${encodeURIComponent('Hello Manish ji, I would like to inquire about DHARMALABH SAUBHAGYA DRAW.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Send WhatsApp Message</span>
            </a>

            <a
              href={`tel:${ORGANIZER_INFO.secondaryPhones[1]}`}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-md"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now ({ORGANIZER_INFO.primaryPhone})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
