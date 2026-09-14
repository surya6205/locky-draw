import React from 'react';
import { Participant, ORGANIZER_INFO } from '../types';
import { Sparkles, Printer, Share2, UserPlus, CheckCircle2 } from 'lucide-react';

interface RegistrationSlipProps {
  participant: Participant;
  onRegisterAnother: (sameFamily: boolean) => void;
  onClose?: () => void;
}

export const RegistrationSlip: React.FC<RegistrationSlipProps> = ({
  participant,
  onRegisterAnother,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `🎉 *${ORGANIZER_INFO.name}* 🎉\n` +
      `✅ Registration Confirmation Slip\n\n` +
      `🎟️ *Lucky Draw Number: ${participant.drawNumber}*\n` +
      `👤 Participant Name: ${participant.fullName}\n` +
      `👨‍👦 Father's Name: ${participant.fatherName}\n` +
      `👩‍👦 Mother's Name: ${participant.motherName}\n` +
      `📱 Mobile Number: +91 ${participant.mobile}\n` +
      `📍 Location: ${participant.location}\n` +
      `📅 Registration Date: ${new Date(participant.createdAt).toLocaleDateString('en-IN')}\n\n` +
      `Organizer: ${ORGANIZER_INFO.organizer}\n` +
      `Contact: ${ORGANIZER_INFO.primaryPhone}\n` +
      `Address: ${ORGANIZER_INFO.address}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const formattedDate = new Date(participant.createdAt).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xl overflow-hidden max-w-xl mx-auto my-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 text-white p-5 text-center relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/10 blur-xl"></div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle2 className="w-6 h-6 text-emerald-300" />
          <span className="text-xs tracking-wider uppercase font-semibold text-amber-200">
            Registration Confirmed
          </span>
        </div>
        <h2 className="text-2xl font-bold font-heading">{ORGANIZER_INFO.name}</h2>
        <p className="text-xs text-amber-100 mt-0.5">
          Organizer: {ORGANIZER_INFO.organizer} • Jhotwara, Jaipur
        </p>
      </div>

      {/* Printable certificate card */}
      <div id="printable-area" className="p-6 bg-amber-50/40">
        <div className="bg-white border-2 border-dashed border-amber-300 rounded-xl p-5 shadow-xs relative">
          {/* Watermark badge */}
          <div className="text-center pb-4 border-b border-amber-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Your Lucky Draw Number
            </span>
            <div className="mt-2 inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 text-white shadow-md border-2 border-amber-300">
              <span className="text-4xl font-black tracking-widest font-mono">
                {participant.drawNumber}
              </span>
            </div>
            <p className="text-[11px] text-amber-800 font-medium mt-1">
              ★ Please preserve this number until the draw announcement ★
            </p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 py-4 text-xs">
            <div>
              <span className="text-slate-500 block">Participant Name:</span>
              <span className="font-bold text-slate-800 text-sm">{participant.fullName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mobile Number:</span>
              <span className="font-bold text-slate-800 text-sm font-mono">+91 {participant.mobile}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Father's Name:</span>
              <span className="font-semibold text-slate-800">{participant.fatherName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Mother's Name:</span>
              <span className="font-semibold text-slate-800">{participant.motherName}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-500 block">City / Location:</span>
              <span className="font-semibold text-slate-800">{participant.location}</span>
            </div>
            <div className="sm:col-span-2 pt-2 border-t border-slate-100 flex justify-between text-[11px] text-slate-500">
              <span>Registration Date: {formattedDate}</span>
              <span>Sequence: #{participant.sequenceNumber}</span>
            </div>
          </div>

          {/* Footer note in printable */}
          <div className="bg-amber-100/60 rounded-lg p-2.5 text-center text-[11px] text-amber-950 font-medium border border-amber-200">
            <span>Organizer: {ORGANIZER_INFO.organizer} | Contact: {ORGANIZER_INFO.primaryPhone}</span>
            <br />
            <span className="text-[10px] text-slate-600">{ORGANIZER_INFO.address}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-white border-t border-amber-100 flex flex-col sm:flex-row items-center gap-2.5 justify-between">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-print-slip"
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save</span>
          </button>
          <button
            id="btn-share-whatsapp"
            onClick={handleShareWhatsApp}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share on WhatsApp</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="btn-register-family-member"
            onClick={() => onRegisterAnother(true)}
            title="Register another member with the same mobile number (up to 5)"
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register Family Member</span>
          </button>
          <button
            id="btn-new-registration"
            onClick={() => onRegisterAnother(false)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition"
          >
            New Registration
          </button>
        </div>
      </div>
    </div>
  );
};
