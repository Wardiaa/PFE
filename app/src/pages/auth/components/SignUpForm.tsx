import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SocialButtons } from './SocialButtons';

interface SignUpFormProps {
  isDark: boolean;
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ isDark, onSwitchToSignIn }) => {
  return (
    <div className="flex w-full flex-col justify-center">
      

      <h1 className={`mb-1 text-2xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        Sign up
      </h1>
      <p className={`mb-6 text-sm font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Create your business account
      </p>

      <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
        <input
          type="text"
          placeholder="Full name"
          className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10
            ${isDark
              ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
        />
        <input
          type="email"
          placeholder="Email address"
          className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10
            ${isDark
              ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
        />
        <input
          type="password"
          placeholder="Password"
          className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10
            ${isDark
              ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
        />
        <button className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
          Create account
        </button>
      </form>

      <div className="relative my-6 flex items-center">
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
        <span className={`px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Or</span>
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
      </div>

      <SocialButtons isDark={isDark} />

      <p className="mt-5 text-center text-sm">
        <span className={isDark ? 'text-zinc-600' : 'text-zinc-400'}>Already have an account? </span>
        <button
          onClick={onSwitchToSignIn}
          className={`font-semibold transition-colors ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'}`}
        >
          Sign in
        </button>
      </p>
    </div>
  );
};
