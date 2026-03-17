import React, { useState } from 'react';
import { ArrowLeft, Sun, Moon } from 'lucide-react';
import { DecorativeGrid } from './components/DecorativeGrid';
import { SignInForm } from './components/SignInForm';
import { SignUpForm } from './components/SignUpForm';

export default function AuthPage() {
  const [isDark, setIsDark] = useState(true);
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-zinc-950 selection:bg-indigo-500' : 'bg-zinc-50 selection:bg-indigo-200'}`}>
      
      {/* LEFT SIDE: Auth Forms - Fixed width */}
      <div className={`
        flex w-full flex-col lg:w-[480px] xl:w-[540px] transition-all duration-500 z-10
        ${isDark 
          ? 'bg-black/40 backdrop-blur-3xl border-r border-zinc-900/50 text-zinc-100' 
          : 'bg-white border-r border-zinc-200 text-zinc-900 shadow-xl'}
      `}>
        {/* Fixed header section */}
        <div className="flex-shrink-0 px-8 py-8 lg:px-14 lg:py-10">
          {/* Top Navigation & Toggle */}
          <div className="flex items-center justify-between">
            <button className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDark ? 'text-zinc-600 hover:text-indigo-400' : 'text-zinc-400 hover:text-indigo-600'}`}>
              <ArrowLeft size={14} strokeWidth={3} />
              Back to home
            </button>

            {/* LIGHT/DARK TOGGLE BUTTON */}
            <button 
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-lg transition-all ${isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 lg:px-14 lg:pb-10">
          {isSignUp ? (
            <SignUpForm 
              isDark={isDark} 
              onSwitchToSignIn={() => setIsSignUp(false)}
            />
          ) : (
            <SignInForm 
              isDark={isDark} 
              onSwitchToSignUp={() => setIsSignUp(true)}
            />
          )}
        </div>
      </div>

      {/* RIGHT SIDE: Decorative Grid - Fixed aspect ratio container */}
      <div className="hidden lg:block flex-1 relative transition-colors duration-500 overflow-hidden">
        {/* Container with padding */}
        <div className={`absolute inset-0 p-8 transition-colors duration-500 ${
          isDark ? 'bg-black' : 'bg-zinc-100'
        }`}>
          {/* Inner container with fixed aspect ratio */}
          <div className="relative h-full w-full">
            {/* This wrapper maintains a 6:10 aspect ratio (matching grid-cols-6 grid-rows-10) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full max-h-full aspect-[6/10]">
                <div className={`relative w-full h-full rounded-2xl overflow-hidden transition-colors duration-500 ${
                  isDark ? 'bg-black' : 'bg-white shadow-xl'
                }`}>
                  <DecorativeGrid isDark={isDark} />
                  
                  {/* Gradient overlays */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
                  <div className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
                  <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    isDark 
                      ? 'bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-100' 
                      : 'bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-30'
                  }`} />
                  <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                    isDark 
                      ? 'bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-100' 
                      : 'bg-gradient-to-r from-black/5 via-transparent to-transparent opacity-30'
                  }`} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}