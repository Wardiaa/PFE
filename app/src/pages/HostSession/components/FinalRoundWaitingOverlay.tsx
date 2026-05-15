// FinalRoundWaitingOverlay.tsx
// Host-side overlay shown while alive participants decide whether to continue
// to the final round. Prevents the host screen from appearing frozen.

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Users } from "lucide-react";

interface Props {
  visible: boolean;
  /** Number of alive participants who received the decision prompt. */
  totalDeciding: number;
  /** Number who have already submitted a decision (optional live count). */
  decidedCount?: number;
  /** Seconds remaining on the decision timer. */
  secondsRemaining?: number;
}

export function FinalRoundWaitingOverlay({
  visible,
  totalDeciding,
  decidedCount,
  secondsRemaining,
}: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="final-round-waiting"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[155] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="relative w-full max-w-[480px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Top primary accent line */}
            <div className="h-[4px] w-full bg-primary" />

            <div className="px-8 pt-8 pb-10 text-center">
              {/* Spinner */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">
                En attente des joueurs…
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Les participants décident s'ils veulent continuer au round final.
              </p>

              {/* Progress row */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  {typeof decidedCount === "number"
                    ? `${decidedCount} / ${totalDeciding} ont répondu`
                    : `${totalDeciding} joueur${totalDeciding !== 1 ? "s" : ""} en train de décider`}
                </span>
              </div>

              {/* Timer pill */}
              {typeof secondsRemaining === "number" && secondsRemaining > 0 && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-mono text-muted-foreground">
                  Avance automatiquement dans{" "}
                  <span className="font-bold text-foreground tabular-nums">
                    {secondsRemaining}s
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
