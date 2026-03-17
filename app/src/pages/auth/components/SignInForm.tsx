import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SocialButtons } from './SocialButtons';

interface SignInFormProps {
  isDark: boolean;
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ isDark, onSwitchToSignUp }) => {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col justify-center min-h-[500px]">
      {/* Stylized Logo Icon */}
      <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ring-1 shadow-sm transition-colors ${isDark ? 'bg-zinc-900 ring-zinc-800' : 'bg-zinc-50 ring-zinc-200'}`}>
        <div className="relative">
          <div className="absolute -right-1 -top-1 h-2 w-2 bg-indigo-500" />
          <ArrowUpRight size={26} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
        </div>
      </div>

      <h1 className={`mb-1 text-3xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        Sign in
      </h1>
      <p className={`mb-8 text-[15px] font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Continue to your business account
      </p>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-1.5">
          <input 
            type="email" 
            placeholder="Enter your email"
            className={`w-full rounded-xl border px-5 py-4 text-[15px] outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 
              ${isDark 
                ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80' 
                : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
          />
          <input 
            type="password" 
            placeholder="Password"
            className={`w-full rounded-xl border px-5 py-4 text-[15px] outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 
              ${isDark 
                ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80' 
                : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
          />
        </div>

        <button className="w-full rounded-xl bg-indigo-600 py-4 text-[15px] font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
          Continue
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-8 flex items-center">
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
        <span className={`px-4 text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Or</span>
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
      </div>

      <SocialButtons isDark={isDark} />

      {/* Sign up link */}
      <p className="mt-6 text-center text-sm">
        <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>Don't have an account? </span>
        <button 
          onClick={onSwitchToSignUp}
          className={`font-semibold transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
        >
          Sign up
        </button>
      </p>
    </div>
  );
};