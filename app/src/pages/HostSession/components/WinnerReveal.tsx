// src/pages/HostSession/components/WinnerReveal.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import AppIcon from '../../../components/AppIcon';
import type { Participant, GameState } from '../../../lib/presentation.types';

interface WinnerRevealProps {
  isElimination: boolean;
  revealedWinner: Participant | null;
  gameState: GameState;
  handleViewFinalResults: () => void;
}

const WinnerReveal: React.FC<WinnerRevealProps> = ({ 
  isElimination, 
  revealedWinner, 
  gameState, 
  handleViewFinalResults 
}) => {
  
  // Trigger confetti when the winner is revealed
  useEffect(() => {
    if (isElimination && revealedWinner) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti from two sides
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isElimination, revealedWinner]);

  return (
    <AnimatePresence>
      {isElimination && revealedWinner && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 overflow-hidden">
          {/* Minimalist Backdrop: Pure dark with very subtle blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ 
              duration: 0.6, 
              ease: [0.23, 1, 0.32, 1] 
            }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Subtle Top Accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

            <div className="p-10 flex flex-col items-center text-center">
              {/* Minimalist Icon Container */}
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
                className="mb-8"
              >
                <div className="w-20 h-20 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center shadow-inner">
                  <AppIcon name="Crown" size={36} className="text-amber-400" />
                </div>
              </motion.div>

              {/* Typography Section */}
              <div className="space-y-2 mb-10">
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-500"
                >
                  Session Terminée
                </motion.span>
                
                <motion.h2 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-4xl font-bold text-white tracking-tight"
                >
                  {revealedWinner.name}
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-amber-500/90 text-sm font-semibold tracking-wide"
                >
                  Vainqueur de la partie
                </motion.p>
              </div>

              {/* Clean Stats Row */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="w-full flex items-center justify-center gap-12 mb-10 py-6 border-y border-white/5"
              >
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Score</p>
                  <p className="text-2xl font-bold text-white">{revealedWinner.score}</p>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-1">Joueurs</p>
                  <p className="text-2xl font-bold text-white">{gameState.totalPlayers}</p>
                </div>
              </motion.div>

              {/* Sleek Action Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full"
              >
                <button
                  onClick={handleViewFinalResults}
                  className="w-full py-4 px-6 rounded-2xl bg-white text-black font-bold text-sm hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  Voir les résultats
                  <AppIcon name="ArrowRight" size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WinnerReveal;