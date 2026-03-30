// src/pages/auth/index.tsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, ArrowUpRight } from 'lucide-react';
import { DecorativeGrid } from './components/DecorativeGrid';
import { SignInForm } from './components/SignInForm';
import { SignUpForm } from './components/SignUpForm';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isDark, setIsDark] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

if (isLoading) {
  return (
    <div className={`min-h-screen w-full flex items-center justify-center transition-colors duration-500 ${
      isDark ? 'bg-zinc-950' : 'bg-zinc-100'
    }`}>
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
}

  return (
    <div
      className={`min-h-screen w-full font-sans transition-colors duration-500 flex items-center justify-center p-4 sm:p-6 lg:p-8
        ${isDark ? 'bg-zinc-950' : 'bg-zinc-100'}`}
    >
      {/* Centered card with max-width cap so it never gets huge */}
      <div
        className={`relative w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-2xl transition-colors duration-500
          ${isDark ? 'shadow-black/60' : 'shadow-zinc-400/40'}`}
        style={{ minHeight: 'min(680px, 90vh)' }}
      >
        {/* LEFT PANEL — Auth form */}
        <div
          className={`relative z-10 flex w-full flex-col lg:w-[420px] xl:w-[460px] flex-shrink-0 transition-colors duration-500
            ${isDark
              ? 'bg-black/70 backdrop-blur-3xl border-r border-zinc-900/60 text-zinc-100'
              : 'bg-white border-r border-zinc-200 text-zinc-900'}`}
        >
          {/* Header */}
          <div className="flex-shrink-0 px-8 py-7">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors
                  ${isDark ? 'text-zinc-600 hover:text-indigo-400' : 'text-zinc-400 hover:text-indigo-600'}`}
              >
                <ArrowLeft size={13} strokeWidth={3} />
                Back to home
              </button>
              <button
                onClick={() => setIsDark(!isDark)}
                className={`p-2 rounded-lg transition-all ${isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
              >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>

          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {isSignUp ? (
              <SignUpForm isDark={isDark} onSwitchToSignIn={() => setIsSignUp(false)} />
            ) : (
              <SignInForm isDark={isDark} onSwitchToSignUp={() => setIsSignUp(true)} />
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Decorative grid, hidden on mobile */}
        <div
          className={`hidden lg:flex flex-1 relative transition-colors duration-500 overflow-hidden
            ${isDark ? 'bg-black' : 'bg-zinc-200'}`}
        >
          {/* Grid fills the panel */}
          <div className="absolute inset-0">
            <DecorativeGrid isDark={isDark} />
          </div>

          {/* Gradient overlays */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
          <div className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.06)_0%,transparent_55%)]" />
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500
              ${isDark
                ? 'bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-100'
                : 'bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-30'}`}
          />
          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-500
              ${isDark
                ? 'bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-100'
                : 'bg-gradient-to-r from-black/5 via-transparent to-transparent opacity-30'}`}
          />

          
        </div>
      </div>
    </div>
  );
}