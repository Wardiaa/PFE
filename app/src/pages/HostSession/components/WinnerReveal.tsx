// src/pages/HostSession/components/WinnerReveal.tsx
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
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
  
  // Core functionality: Confetti trigger remains unchanged
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
          {/* Unified Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-background border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Solid Primary Top Accent Bar */}
            <div className="h-1.5 w-full bg-primary" />

            <div className="p-10 flex flex-col items-center">
              
              {/* Top Meta Tag */}
              <div className="mb-10 text-center">
                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground bg-muted px-3 py-1 rounded border border-border">
                  Session Terminée
                </span>
              </div>

              {/* Text-Based Winner Badge (Replacing Crown Icon) */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="mb-6 px-4 py-1.5 bg-primary rounded text-primary-foreground text-[11px] font-black uppercase tracking-[0.2em]"
              >
                LE GAGNANT
              </motion.div>

              {/* Giant Winner Name - High Contrast */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-5xl font-black text-foreground tracking-tighter uppercase text-center mb-10 leading-tight"
              >
                {revealedWinner.name}
              </motion.h2>

              {/* Stats Block - Solid Dividers, No Gradients */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full flex items-center justify-between border-t border-b border-border py-8 mb-10"
              >
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Score Final</p>
                  <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                    {revealedWinner.score}
                  </p>
                </div>
                
                <div className="w-px h-10 bg-border" />
                
                <div className="flex-1 text-center">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Participants</p>
                  <p className="text-3xl font-black text-foreground tabular-nums leading-none">
                    {gameState.totalPlayers}
                  </p>
                </div>
              </motion.div>

              {/* Solid Mentimeter-style Action Button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="w-full"
              >
                <button
                  onClick={handleViewFinalResults}
                  className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Voir les résultats finaux
                </button>
              </motion.div>

              {/* Bottom detail */}
              <div className="mt-6">
                <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-[0.1em]">
                  Félicitations au vainqueur
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WinnerReveal;