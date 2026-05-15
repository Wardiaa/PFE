// FinalRoundDecision.tsx
// Shown to participants when reaching the final round
// They must choose whether to continue or withdraw

import { useState, useEffect } from "react";
import { Crown, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FinalRoundDecisionProps {
  visible: boolean;
  decisionTimer: number;
  onContinue: () => void;
  onWithdraw: () => void;
}

export function FinalRoundDecision({
  visible,
  decisionTimer,
  onContinue,
  onWithdraw,
}: FinalRoundDecisionProps) {
  const [timeLeft, setTimeLeft] = useState(decisionTimer);
  const [hasDecided, setHasDecided] = useState(false);

  console.log("[FinalRoundDecision] Props:", { visible, decisionTimer, hasDecided });

  // Reset when visibility changes
  useEffect(() => {
    if (visible) {
      console.log("[FinalRoundDecision] Becoming visible, resetting timer to", decisionTimer);
      setTimeLeft(decisionTimer);
      setHasDecided(false);
    }
  }, [visible, decisionTimer]);

  // Timer countdown
  useEffect(() => {
    if (!visible) return;
    if (timeLeft <= 0) return;

    console.log("[FinalRoundDecision] Timer running:", timeLeft);

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          console.log("[FinalRoundDecision] Timer expired");
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, timeLeft]);

  // Auto-withdraw when timer expires
  useEffect(() => {
    if (!visible) return;
    if (timeLeft === 0 && !hasDecided) {
      console.log("[FinalRoundDecision] Auto-withdrawing due to timer expiration");
      setHasDecided(true);
      onWithdraw();
    }
  }, [visible, timeLeft, hasDecided, onWithdraw]);

  const handleContinue = () => {
    if (hasDecided) return;
    console.log("[FinalRoundDecision] User chose to continue");
    setHasDecided(true);
    onContinue();
  };

  const handleWithdraw = () => {
    if (hasDecided) return;
    console.log("[FinalRoundDecision] User chose to withdraw");
    setHasDecided(true);
    onWithdraw();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl"
        >
          {/* Left accent bar */}
          <div className="absolute inset-y-0 left-0 w-[6px] bg-gradient-to-b from-amber-500 to-amber-700 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />

          <div className="px-8 sm:px-10 pt-10 pb-8">
            {/* Timer */}
            <div className="flex justify-end mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                  <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                </svg>
                <span className="text-sm font-mono font-bold text-white tabular-nums">
                  {timeLeft}s
                </span>
              </div>
            </div>

            {/* Crown icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-400" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-3xl sm:text-4xl font-black text-center text-white tracking-tighter mb-3">
              DERNIÈRE MANCHE
            </h2>
            <p className="text-center text-white/70 text-base mb-8">
              Vous êtes arrivé à la dernière question.<br />
              Voulez-vous continuer pour tenter de gagner ?
            </p>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleContinue}
                disabled={hasDecided}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="w-5 h-5" />
                OUI, je continue
              </button>
              <button
                onClick={handleWithdraw}
                disabled={hasDecided}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm uppercase tracking-wider transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
                NON, je me retire
              </button>
            </div>

            <p className="text-center text-white/30 text-[11px] mt-6">
              {hasDecided ? "Décision enregistrée..." : `Faites votre choix avant la fin du temps (${timeLeft}s)`}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
