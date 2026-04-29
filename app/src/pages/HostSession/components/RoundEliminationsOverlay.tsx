// RoundEliminationsOverlay.tsx
// Host-side overlay shown the moment the round timer ends. Modern editorial
// "broadcast graphics" style: dark glass card, vertical red accent bar,
// tabular display number, and a live status pill. Still firmly red, just
// not generic-looking.
//
// Render only when `count > 0`. If count is 0 or null, the overlay should
// not be mounted at all.

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Props {
  /** Number of participants eliminated during the round that just ended. */
  count: number | null;
  /** Optional round number to display alongside the count. */
  roundNumber?: number;
  onClose: () => void;
}

export function RoundEliminationsOverlay({ count, roundNumber, onClose }: Props) {
  const visible = typeof count === "number" && count > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="round-elim-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/75 backdrop-blur-md"
          onClick={onClose}
        >
          

          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-2xl "
          >
            {/* Vertical dark-red accent bar */}
            <div className="absolute inset-y-0 left-0 w-[6px] bg-red-800 shadow-[0_0_30px_rgba(127,29,29,0.8)]" />

            {/* Diagonal hazard stripes, top edge */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgb(153 27 27) 0 8px, transparent 8px 16px)",
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-10 sm:px-14 pt-10 pb-12">
              {/* Header row: live status pill + meta */}
              <div className="flex items-center justify-between mb-10">

                {typeof roundNumber === "number" && roundNumber > 0 && (
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/40">
                    Q{String(roundNumber).padStart(2, "0")}
                  </div>
                )}
              </div>

              {/* Count + label, asymmetric layout */}
              <div className="flex items-end gap-6">
                {/* Big tabular number */}
                <motion.div
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", damping: 18, stiffness: 220 }}
                  className="leading-[0.85] font-black tracking-tighter text-white tabular-nums"
                  style={{
                    fontSize: "clamp(7rem, 18vw, 11rem)",
                    fontFeatureSettings: '"tnum" 1, "ss01" 1',
                    textShadow:
                      "0 0 40px rgba(127,29,29,0.55), 0 2px 0 rgba(0,0,0,0.4)",
                  }}
                >
                  {count}
                </motion.div>

                {/* Stacked label, baseline-aligned */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 }}
                  className="pb-4 sm:pb-6"
                >
                  <div className="text-2xl sm:text-3xl font-black uppercase leading-none text-white">
                    {count === 1 ? "Joueur" : "Joueurs"}
                  </div>
                  <div className="mt-1 text-2xl sm:text-3xl font-black uppercase leading-none bg-red-700 bg-clip-text text-transparent">
                    Éliminé{count === 1 ? "" : "s"}
                  </div>
                </motion.div>
              </div>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                className="origin-left mt-10 h-px bg-gradient-to-r from-red-700/70 via-white/10 to-transparent"
              />

              {/* Footer meta row */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.22em] text-white/40"
              >
                <span>100% Logique</span>
                <span className="text-white/30">echap · clic pour fermer</span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
