import React, { useState, useEffect, useRef } from 'react';
import { Participant, POPULAR_LOCATIONS, ORGANIZER_INFO } from '../types';
import { registerParticipant } from '../lib/drawService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RegistrationSlip } from './RegistrationSlip';
import {
  User,
  Phone,
  MapPin,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
  Users,
  Sparkles,
  Search,
  Loader2,
  Info,
} from 'lucide-react';

interface RegistrationFormProps {
  initialMobile?: string;
  initialLocation?: string;
  onSuccess?: (participant: Participant) => void;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  initialMobile = '',
  initialLocation = '',
  onSuccess,
}) => {
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [mobile, setMobile] = useState(initialMobile);
  const [location, setLocation] = useState(initialLocation);

  // Autocomplete state
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);
  const locationRef = useRef<HTMLDivElement>(null);

  // Mobile count status
  const [mobileRegisteredCount, setMobileRegisteredCount] = useState<number | null>(null);
  const [checkingMobile, setCheckingMobile] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successParticipant, setSuccessParticipant] = useState<Participant | null>(null);

  // Filter locations as user types
  useEffect(() => {
    if (!location.trim()) {
      setFilteredLocations(POPULAR_LOCATIONS.slice(0, 8));
    } else {
      const q = location.toLowerCase();
      const matches = POPULAR_LOCATIONS.filter((loc) => loc.toLowerCase().includes(q));
      setFilteredLocations(matches.slice(0, 8));
    }
  }, [location]);

  // Click outside to close location dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setShowLocationSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live check of mobile number registrations (up to 5)
  useEffect(() => {
    const clean = mobile.trim().replace(/\D/g, '');
    if (clean.length === 10) {
      setCheckingMobile(true);
      const checkMobile = async () => {
        try {
          const snap = await getDoc(doc(db, 'mobile_trackers', clean));
          if (snap.exists()) {
            setMobileRegisteredCount(snap.data()?.count || 0);
          } else {
            setMobileRegisteredCount(0);
          }
        } catch (e) {
          setMobileRegisteredCount(0);
        } finally {
          setCheckingMobile(false);
        }
      };
      checkMobile();
    } else {
      setMobileRegisteredCount(null);
    }
  }, [mobile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanMobile = mobile.trim().replace(/\D/g, '');
    if (!fullName.trim() || !fatherName.trim() || !motherName.trim() || !cleanMobile || !location.trim()) {
      setErrorMsg('Please enter all required details (Full Name, Father Name, Mother Name, Mobile Number, City/Location).');
      return;
    }

    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (mobileRegisteredCount !== null && mobileRegisteredCount >= 5) {
      setErrorMsg(`Maximum limit reached: 5 members have already registered with mobile number ${cleanMobile}. Please use another mobile number.`);
      return;
    }

    try {
      setIsSubmitting(true);
      const participant = await registerParticipant({
        fullName: fullName.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        mobile: cleanMobile,
        location: location.trim(),
      });

      setSuccessParticipant(participant);
      if (onSuccess) onSuccess(participant);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterAnother = (sameFamily: boolean) => {
    setSuccessParticipant(null);
    setErrorMsg(null);
    setFullName('');
    setFatherName(sameFamily ? fatherName : '');
    setMotherName(sameFamily ? motherName : '');
    if (!sameFamily) {
      setMobile('');
      setLocation('');
      setMobileRegisteredCount(null);
    } else {
      // Refresh count for current mobile
      const clean = mobile.trim().replace(/\D/g, '');
      if (clean.length === 10) {
        getDoc(doc(db, 'mobile_trackers', clean)).then((snap) => {
          if (snap.exists()) setMobileRegisteredCount(snap.data()?.count || 0);
        });
      }
    }
  };

  if (successParticipant) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <RegistrationSlip
          participant={successParticipant}
          onRegisterAnother={handleRegisterAnother}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8">
      {/* Title & Guidelines Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-semibold mb-2 border border-amber-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Participant Registration Form</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading">
          {ORGANIZER_INFO.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
          Please enter accurate and complete details. Each registered person receives a distinct sequential Lucky Draw Number immediately.
        </p>
      </div>

      {/* Rules Notice Box */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 mb-6 text-xs sm:text-sm shadow-xs">
        <div className="flex items-center gap-2 font-bold text-amber-950 mb-2">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Key Registration Rules & Guidelines:</span>
        </div>
        <ul className="space-y-1.5 text-slate-700 pl-6 list-disc marker:text-amber-600">
          <li>
            <strong className="text-slate-900">Up to 5 Persons per Mobile Number:</strong> One mobile number can register up to 5 family members.
          </li>
          <li>
            <strong className="text-slate-900">Individual Lucky Draw Number:</strong> Each registered person gets an individual sequential number (e.g. 001, 002, 003...).
          </li>
          <li>
            <strong className="text-slate-900">No Duplicate Registrations:</strong> The same person cannot register twice (automatic duplicate detection via Full Name + Father Name + Mother Name + Mobile Number).
          </li>
          <li>
            Different family members can freely use the same mobile number up to the 5-member limit.
          </li>
        </ul>
      </div>

      {/* Main Registration Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
              Participant Full Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="input-fullname"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter participant's full name (e.g. Rahul Jain)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm outline-hidden transition"
              />
            </div>
          </div>

          {/* Father Name & Mother Name (2 columns on tablet/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Father's Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-fathername"
                  type="text"
                  required
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="Enter father's name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm outline-hidden transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
                Mother's Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <input
                  id="input-mothername"
                  type="text"
                  required
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="Enter mother's name"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm outline-hidden transition"
                />
              </div>
            </div>
          </div>

          {/* Mobile Number with Counter Badge */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-800">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              {checkingMobile && (
                <span className="text-[11px] text-amber-700 flex items-center gap-1 font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Checking limit...
                </span>
              )}
              {mobileRegisteredCount !== null && !checkingMobile && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    mobileRegisteredCount >= 5
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  On this number: {mobileRegisteredCount}/5 registered
                </span>
              )}
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-medium text-xs">
                +91
              </div>
              <input
                id="input-mobile"
                type="tel"
                maxLength={10}
                required
                value={mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMobile(val);
                }}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm font-mono outline-hidden transition"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Family members can register up to 5 people using this single mobile number.
            </p>
          </div>

          {/* City / Location with Searchable suggestions dropdown */}
          <div ref={locationRef} className="relative">
            <label className="block text-xs sm:text-sm font-semibold text-slate-800 mb-1.5">
              City / Location <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <MapPin className="w-4 h-4" />
              </div>
              <input
                id="input-location"
                type="text"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowLocationSuggestions(true);
                }}
                onFocus={() => setShowLocationSuggestions(true)}
                placeholder="Enter city or area (e.g. Jhotwara, Jaipur)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900 text-sm outline-hidden transition"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showLocationSuggestions && filteredLocations.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-amber-200 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                <div className="p-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 border-b border-amber-100 flex items-center gap-1">
                  <Search className="w-3 h-3 text-amber-600" />
                  <span>Suggested Locations (click to select):</span>
                </div>
                {filteredLocations.map((loc, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setLocation(loc);
                      setShowLocationSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-800 hover:bg-amber-50 hover:text-amber-900 transition flex items-center gap-2 border-b border-slate-50 last:border-0"
                  >
                    <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                    <span>{loc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-registration"
              type="submit"
              disabled={isSubmitting || (mobileRegisteredCount !== null && mobileRegisteredCount >= 5)}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white font-bold text-sm sm:text-base shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering & generating Lucky Draw Number...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>Register & Get Lucky Draw Number</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Organizer mini footer in card */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>{ORGANIZER_INFO.name} • Organizer: {ORGANIZER_INFO.organizer}</span>
          <span className="block text-[11px] text-slate-400 mt-0.5">{ORGANIZER_INFO.address}</span>
        </div>
      </div>
    </div>
  );
};
