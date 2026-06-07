// SpeedQuestionIntro.tsx
// Full-screen overlay shown BEFORE a speed question begins — on BOTH the host
// and participant screens simultaneously (host broadcasts the trigger via the
// same WebSocket event that fires QUESTION_CHANGE, participants mount it when
// the incoming question has isSpeedQuestion === true and the question has not
// yet started).
//
// Auto-dismisses after `duration` seconds (default 10). The parent resets
// visibility by flipping `visible` to false on the QUESTION_START event (or
// after the countdown ends via onDismiss).
//
// No amber colour is used anywhere in this component.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface SpeedQuestionIntroProps {
  visible: boolean;
  /** How many of the fastest participants advance to the next question. */
  maxAdvance: number;
  /**
   * Auto-dismiss countdown in seconds.
   * Defaults to 10.
   */
  duration?: number;
  /**
   * Called once when the countdown reaches 0 (auto-dismiss).
   * The parent should flip `visible` to false here, which will also
   * trigger the exit animation.
   */
  onDismiss?: () => void;
}

export function SpeedQuestionIntro({
  visible,
  maxAdvance,
  duration = 10,
  onDismiss,
}: SpeedQuestionIntroProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const dismissedRef = useRef(false);

  // Reset state whenever the overlay becomes visible again.
  useEffect(() => {
    if (visible) {
      dismissedRef.current = false;
      setTimeLeft(duration);
    }
  }, [visible, duration]);

  // Countdown — fires onDismiss once when it reaches 0.
  useEffect(() => {
    if (!visible || dismissedRef.current) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          if (!dismissedRef.current) {
            dismissedRef.current = true;
            onDismiss?.();
          }
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, onDismiss, duration]);

  // Progress bar percentage (100 → 0 as time elapses).
  const progress = duration > 0 ? Math.max(0, (timeLeft / duration)) * 100 : 0;

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
            {/* Draining progress bar */}
            <div className="w-full h-1.5 bg-primary/10">
              <motion.div
                className="h-full bg-primary origin-left"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: progress / 100 }}
                transition={{ duration: 0.9, ease: "linear" }}
                style={{ transformOrigin: "left" }}
              />
            </div>

            <div className="px-8 pt-10 pb-12">
              {/* Header row: "Speed Question" label + timer pill */}
              <div className="flex items-center justify-between mb-10">
                <div className="px-3 py-1 mt-0 bg-muted border border-border rounded text-sm font-mono font-bold text-foreground tabular-nums">
                  {timeLeft}s
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

              {/* Footer hint */}
              <div className="text-center">
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground/55">
                  Get ready — the question appears shortly
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
