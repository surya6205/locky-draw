import React, { useState } from 'react';
import { auth } from '../lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { ORGANIZER_INFO } from '../types';
import { ShieldCheck, Lock, Mail, AlertCircle, Loader2, Sparkles } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (email: string) => void;
  onCancel?: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onCancel }) => {
  // Read configured credentials from environment safely
  const metaEnv = (import.meta as any).env || {};
  const defaultAdminEmail = (metaEnv.VITE_ADMIN_INITIAL_EMAIL as string) || 'admin@dharmalabh.in';
  const defaultAdminPass = (metaEnv.VITE_ADMIN_INITIAL_PASSWORD as string) || 'Admin@DharmaLabh#2026';

  const [email, setEmail] = useState(defaultAdminEmail);
  const [password, setPassword] = useState(defaultAdminPass);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setIsLoggingIn(true);
      // 1. Try signInWithEmailAndPassword
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        onLoginSuccess(userCred.user.email || cleanEmail);
        return;
      } catch (signInErr: any) {
        // If user not found, try creating the initial admin user automatically
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-login-credentials'
        ) {
          try {
            const createCred = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
            onLoginSuccess(createCred.user.email || cleanEmail);
            return;
          } catch (createErr: any) {
            // If email already in use or creation failed, rethrow original error
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error('Incorrect password. Please enter the correct password.');
            }
            if (createErr.code === 'auth/operation-not-allowed') {
              // Firebase Email/Password auth provider not yet toggled on in console
              // Provide fallback for initial admin so they are never locked out
              if (cleanEmail === defaultAdminEmail && cleanPassword === defaultAdminPass) {
                onLoginSuccess(cleanEmail);
                return;
              }
              throw new Error('Please enable Email/Password provider in Firebase Console or use Google Sign-In.');
            }
            throw createErr;
          }
        } else if (signInErr.code === 'auth/operation-not-allowed') {
          if (cleanEmail === defaultAdminEmail && cleanPassword === defaultAdminPass) {
            onLoginSuccess(cleanEmail);
            return;
          }
          throw new Error('Email/Password provider is not enabled in Firebase Authentication.');
        } else {
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('Admin Login Error:', err);
      setErrorMsg(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    try {
      setIsLoggingIn(true);
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      onLoginSuccess(res.user.email || 'Admin');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error signing in with Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600"></div>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center mx-auto mb-3 shadow-md border border-slate-800">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            Admin Login
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {ORGANIZER_INFO.name} • Secure Admin Console
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Admin Email / ID
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@dharmalabh.in"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden"
              />
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              id="btn-submit-admin-login"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Secure Login</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        </form>

        {onCancel && (
          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <button
              onClick={onCancel}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium"
            >
              ← Back to Main Page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
