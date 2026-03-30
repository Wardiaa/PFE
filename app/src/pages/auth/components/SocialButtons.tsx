// src/pages/auth/components/SocialButtons.tsx
import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface SocialButtonsProps {
  isDark: boolean;
}

export const SocialButtons: React.FC<SocialButtonsProps> = ({ isDark }) => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="space-y-3">
      <button 
        onClick={signInWithGoogle}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border py-3.5 text-[14px] font-semibold transition-all active:scale-[0.98]
        ${isDark
          ? 'border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700'
          : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'}`}>
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
        Continue with Google
      </button>
      
    </div>
  );
};