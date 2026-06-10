// FinalRoundDecision.tsx
// Participant-side overlay shown when the host triggers the final-round
// decision phase.  The countdown timer has been removed — participants
// decide in their own time and the host manually triggers the transition
// to the final question via the "Start Final Round" button on their screen.
// There is therefore no auto-withdrawal: a participant who has not yet
// clicked either button remains on this screen until FINAL_ROUND_START
// is received, at which point the overlay is hidden by the parent.

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FinalRoundDecisionProps {
  visible: boolean;
  onContinue: () => void;
  onWithdraw: () => void;
}

export function FinalRoundDecision({
  visible,
  onContinue,
  onWithdraw,
}: FinalRoundDecisionProps) {
  const [hasDecided, setHasDecided] = useState(false);
  // Guard against double-firing if the parent re-renders while the handler runs.
  const isActiveRef = useRef(true);

  // Reset state whenever the overlay becomes visible again.
  // (Kept as an effect so that if the parent toggles visibility it resets cleanly.)
  // Using visible as a key on the outer wrapper achieves the same thing without
  // an effect — see the `key` prop on the AnimatePresence child below.

  const handleContinue = () => {
    if (hasDecided || !isActiveRef.current) return;
    isActiveRef.current = false;
    setHasDecided(true);
    onContinue();
  };

  const handleWithdraw = () => {
    if (hasDecided || !isActiveRef.current) return;
    isActiveRef.current = false;
    setHasDecided(true);
    onWithdraw();
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      {/* key={String(visible)} resets hasDecided whenever visibility cycles */}
      <div
        key={String(visible)}
        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-[500px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        >
          {/* Top primary accent line */}
          <div className="h-[4px] w-full bg-primary" />

          <div className="px-8 pt-10 pb-12">
            {/* Header / Meta Info */}
            <div className="flex justify-between items-center mb-12">
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                Final Round Decision
              </span>
            </div>

            {/* Main Content */}
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-4">
                FINAL ROUND
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                You've reached the final question.<br />
                Do you want to go all in?
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={hasDecided}
                className="w-full py-5 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                YES, I CONTINUE
              </button>

              <button
                onClick={handleWithdraw}
                disabled={hasDecided}
                className="w-full py-5 rounded-xl bg-muted border border-border text-foreground font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                NO, I WITHDRAW
              </button>
            </div>

            {/* Footer status */}
            <div className="mt-8 text-center h-4">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                {hasDecided
                  ? "Decision recorded…"
                  : "Select an option"}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
