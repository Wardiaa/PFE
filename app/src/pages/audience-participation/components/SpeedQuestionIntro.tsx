// SpeedQuestionIntro.tsx
// Full-screen overlay shown BEFORE a speed question begins — on BOTH the host
// and participant screens simultaneously (host broadcasts the trigger via the
// same WebSocket event that fires QUESTION_CHANGE, participants mount it when
// the incoming question has isSpeedQuestion === true and the question has not
// yet started).
//
// The countdown timer has been replaced with a manual "Show Question" button
// on the HOST side.  The host clicks it when ready; the click dismisses the
// host overlay AND broadcasts a SPEED_INTRO_DISMISS event so all participant
// overlays close at the same moment.  This eliminates all timer-sync issues.
//
// No amber colour is used anywhere in this component.

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface SpeedQuestionIntroProps {
  visible: boolean;
  /** How many of the fastest participants advance to the next question. */
  maxAdvance: number;
  /**
   * When true the host-only "Show Question" button is rendered.
   * Participants receive false (default) and see a "Waiting for host…" hint.
   */
  isHost?: boolean;
  /**
   * Called when the host clicks "Show Question".
   * The parent should flip `visible` to false here AND broadcast
   * SPEED_INTRO_DISMISS to all participant screens.
   */
  onDismiss?: () => void;
}

export function SpeedQuestionIntro({
  visible,
  maxAdvance,
  isHost = false,
  onDismiss,
}: SpeedQuestionIntroProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="speed-question-intro-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            key="speed-question-intro-card"
            initial={{ scale: 0.96, y: 22, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.97, y: 10, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 340 }}
            className="relative w-full max-w-[520px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Top primary accent line (replaces the draining progress bar) */}
            <div className="h-[4px] w-full bg-primary" />

            <div className="px-8 pt-10 pb-12">
              {/* Header row: "Speed Question" label */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2 px-3 py-1 bg-muted border border-border rounded text-sm font-mono font-bold text-foreground">
                  <Zap className="w-3.5 h-3.5" />
                  Speed Question
                </div>
              </div>

              {/* Main headline */}
              <div className="text-center mb-10">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 }}
                  className="text-5xl font-black text-foreground tracking-tighter uppercase leading-none mb-5"
                >
                  STEADY.
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 }}
                  className="text-muted-foreground text-base leading-relaxed"
                >
                  A speed question is about to begin.
                  <br />
                  Only the fastest answers count.
                </motion.p>

                {/* Advance count badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.28 }}
                  className="mt-6 inline-flex items-center gap-2 bg-primary/10 text-primary px-5 py-2.5 rounded-xl"
                >
                  <span className="text-sm font-bold">
                    Top&nbsp;{maxAdvance}&nbsp;fastest&nbsp;advance
                  </span>
                </motion.div>
              </div>

              {/* Footer — host sees the "Show Question" trigger button;
                  participants see a waiting hint. */}
              <div className="text-center">
                {isHost ? (
                  <motion.button
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.36 }}
                    onClick={onDismiss}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-widest transition-transform active:scale-[0.98] cursor-pointer"
                  >
                    Show Question
                  </motion.button>
                ) : (
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/55">
                    Waiting for host — the question appears shortly
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
