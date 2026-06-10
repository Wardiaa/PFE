// SpeedQuestionWaiting.tsx
// Shown to participants after submitting a speed question.
//
// Flow:
//   Phase 1 — "Waiting for others..." (no rank yet, waiting for results)
//   Phase 2 — Results received:
//     • Eliminated  → immediately calls onEliminated so the EliminationOverlay
//                     takes over. No intermediate "ELIMINATED" screen here.
//     • Advancing   → shows "YOU ADVANCE !" and stays visible until the parent
//                     resets speed state on the next QUESTION_CHANGE.

import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface SpeedQuestionWaitingProps {
  visible: boolean;
  rank?: number | null;
  maxAdvance: number;
  waitingForOthers: boolean;
  // Called immediately when results arrive and participant did NOT advance.
  onEliminated?: () => void;
  // Kept for API compatibility; never called automatically — the "you advance"
  // screen persists until the parent resets state on the next question.
  onAdvanced?: () => void;
}

export function SpeedQuestionWaiting({
  visible,
  rank,
  maxAdvance,
  waitingForOthers,
  onEliminated,
}: SpeedQuestionWaitingProps) {
  const hasRank = rank !== undefined && rank !== null && rank > 0;
  const hasAdvanced = hasRank && rank <= maxAdvance;

  // When rank arrives:
  //   • Eliminated → call onEliminated immediately (EliminationOverlay takes over)
  //   • Advancing  → do nothing; stay visible showing "YOU ADVANCE !"
  useEffect(() => {
    if (hasRank && visible && !hasAdvanced) {
      onEliminated?.();
    }
  }, [hasRank, visible, hasAdvanced, onEliminated]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="text-center max-w-md w-full px-6"
        >
          {/* ── Waiting: submitted, timer still running ─────────────── */}
          {!hasRank && !waitingForOthers && (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Waiting for the timer to end...
              </h2>
              <p className="text-white/60">
                Results will be announced when time runs out.
              </p>
            </>
          )}

          {/* ── Waiting: submitted, waiting for others ──────────────── */}
          {!hasRank && waitingForOthers && (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Waiting for others...
              </h2>
              <p className="text-white/60">
                The {maxAdvance} fastest players will advance to the next question.
              </p>
            </>
          )}

          {/* ── Advancing: "YOU ADVANCE !" — stays until next question ─ */}
          {hasRank && hasAdvanced && (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-emerald-400" />
                </div>
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-3">
                YOU ADVANCE!
              </h2>
              <p className="text-white/60">
                You were #{rank}. The {maxAdvance} fastest advance.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
