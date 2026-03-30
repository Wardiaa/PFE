// src/pages/auth/components/SignInForm.tsx
import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SocialButtons } from './SocialButtons';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SignInFormProps {
  isDark: boolean;
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ isDark, onSwitchToSignUp }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error } = await signIn(email, password);
    
    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="flex w-full flex-col justify-center">
      <div className={`mb-6 mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl ring-1 shadow-sm transition-colors ${isDark ? 'bg-zinc-900 ring-zinc-800' : 'bg-zinc-50 ring-zinc-200'}`}>
        <div className="relative">
          <div className="absolute -right-1 -top-1 h-2 w-2 bg-indigo-500" />
          <ArrowUpRight size={24} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
        </div>
      </div>

      <h1 className={`mb-1 text-2xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        Sign in
      </h1>
      <p className={`mb-6 text-sm font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
        Continue to your business account
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10
            ${isDark
              ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={`w-full rounded-xl border px-4 py-3.5 text-sm outline-none transition-all focus:ring-4 focus:ring-indigo-500/10
            ${isDark
              ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80'
              : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
        />
        <button 
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Signing in...' : 'Continue'}
        </button>
      </form>

      <div className="relative my-6 flex items-center">
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
        <span className={`px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Or</span>
        <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
      </div>

      <SocialButtons isDark={isDark} />

      <p className="mt-5 text-center text-sm">
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