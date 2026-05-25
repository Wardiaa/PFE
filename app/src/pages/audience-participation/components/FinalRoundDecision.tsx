// FinalRoundDecision.tsx
import { useState, useEffect, useRef } from "react";
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
  // Add a ref to track if the component should ignore further updates
  const isActiveRef = useRef(true);

  // Reset when visibility changes
  useEffect(() => {
    if (visible) {
      isActiveRef.current = true;
      setTimeLeft(decisionTimer);
      setHasDecided(false);
    }
  }, [visible, decisionTimer]);

  // Timer countdown logic - only run if still active and no decision made
  useEffect(() => {
    if (!visible || !isActiveRef.current || hasDecided || timeLeft <= 0) return;

    const interval = setInterval(() => {
      // Only update if still active and no decision made
      if (!isActiveRef.current || hasDecided) {
        clearInterval(interval);
        return;
      }
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        // If we hit zero, trigger auto-withdraw but only if not already decided
        if (newTime <= 0 && !hasDecided && isActiveRef.current) {
          // Clear interval immediately
          clearInterval(interval);
          // Trigger withdraw
          setHasDecided(true);
          isActiveRef.current = false;
          onWithdraw();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, hasDecided, onWithdraw, decisionTimer]); // Removed timeLeft from dependencies

  // Auto-withdraw when timer expires (fallback)
  useEffect(() => {
    if (visible && timeLeft === 0 && !hasDecided && isActiveRef.current) {
      setHasDecided(true);
      isActiveRef.current = false;
      onWithdraw();
    }
  }, [visible, timeLeft, hasDecided, onWithdraw]);

  const handleContinue = () => {
    if (hasDecided || !isActiveRef.current) return;
    // Immediately deactivate to prevent any further state changes
    isActiveRef.current = false;
    setHasDecided(true);
    onContinue();
  };

  const handleWithdraw = () => {
    if (hasDecided || !isActiveRef.current) return;
    // Immediately deactivate to prevent any further state changes
    isActiveRef.current = false;
    setHasDecided(true);
    onWithdraw();
  };

  // Calculate progress percentage - safe for negative values
  const progressPercentage = decisionTimer > 0 
    ? Math.max(0, (Math.max(0, timeLeft) / decisionTimer) * 100)
    : 0;

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          {/* Progress Bar Container */}
          <div className="w-full h-1.5 bg-primary/10">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: "100%" }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5, ease: "linear" }}
            />
          </div>

          <div className="px-8 pt-10 pb-12">
            {/* Header / Meta Info */}
            <div className="flex justify-between items-center mb-12">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Final Round Decision
              </span>
              <div className="px-3 py-1 bg-muted border border-border rounded text-sm font-mono font-bold text-foreground tabular-nums">
                {Math.max(0, timeLeft)}s
              </div>
            </div>

            {/* Main Content */}
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-4">
                DERNIÈRE MANCHE
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Vous êtes arrivé à la dernière question.<br />
                Voulez-vous tenter le tout pour le tout ?
              </p>
            </div>

            {/* Action Buttons (Mentimeter Style: Big, Solid, No Icons) */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={hasDecided}
                className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                OUI, JE CONTINUE
              </button>
              
              <button
                onClick={handleWithdraw}
                disabled={hasDecided}
                className="w-full py-5 rounded-xl bg-muted border border-border text-foreground font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                NON, JE ME RETIRE
              </button>
            </div>

            {/* Footer status with auto-withdrawal hint */}
            <div className="mt-8 text-center h-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                {hasDecided 
                  ? "Décision enregistrée..." 
                  : `Sélectionnez une option (retrait automatique dans ${Math.max(0, timeLeft)}s)`
                }
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}