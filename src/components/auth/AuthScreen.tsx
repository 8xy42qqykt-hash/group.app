import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PaperPlaneTilt } from '@phosphor-icons/react';
import { handleEnterKeyNavigation } from '../../utils/formNavigation';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !displayName)) return;
    setError(null);
    setSubmitting(true);
    try {
      if (isSignUp) {
        const res = await signUp(email, password, displayName);
        if (res.error) setError(res.error);
      } else {
        const res = await signIn(email, password);
        if (res.error) setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center px-4 py-12 max-w-sm mx-auto animate-calm-fade-in bg-black text-white select-none">
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-[24px] bg-white/10 border border-white/15 flex items-center justify-center mb-3 shadow-lg">
          <PaperPlaneTilt size={32} weight="fill" className="text-white -ml-0.5 mt-0.5" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Trip
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          {isSignUp ? 'Create your account' : 'Sign in to access your trips'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Inset-grouped input box with dividers, no borders */}
        <div className="rounded-[18px] bg-white dark:bg-[#1c1c1e] divide-y divide-black/5 dark:divide-white/5 overflow-hidden shadow-2xs">
          {isSignUp && (
            <div className="px-4 py-2">
              <input
                type="text"
                inputMode="text"
                autoComplete="name"
                enterKeyHint="next"
                autoCapitalize="words"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => handleEnterKeyNavigation(e)}
                required={isSignUp}
                className="w-full h-9 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[16px] outline-none"
              />
            </div>
          )}

          <div className="px-4 py-2">
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              enterKeyHint="next"
              autoCapitalize="none"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => handleEnterKeyNavigation(e)}
              required
              className="w-full h-9 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[16px] outline-none"
            />
          </div>

          <div className="px-4 py-2">
            <input
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              enterKeyHint="go"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => handleEnterKeyNavigation(e)}
              required
              className="w-full h-9 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 text-[16px] outline-none"
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-500 text-center px-3 py-1.5 bg-red-500/10 rounded-[14px]">
            {error}
          </div>
        )}

        {/* Primary filled rounded blue action button */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full h-12 rounded-[20px] bg-[#007AFF] dark:bg-[#0A84FF] text-white font-semibold text-sm flex items-center justify-center active-press cursor-pointer disabled:opacity-50 shadow-sm"
        >
          {submitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
        </button>

        {/* Secondary plain blue text button */}
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
            }}
            className="text-xs font-semibold text-[#007AFF] dark:text-[#0A84FF] active-press cursor-pointer hover:opacity-85 transition-opacity"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>
      </form>
    </div>
  );
};
