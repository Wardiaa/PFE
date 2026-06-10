// GameOverOverlay.tsx
// Full-screen "End of game — No winner" overlay shown on BOTH the host
// view and every participant view when alive.length reaches 0 in elimination
// mode (everyone was eliminated before the session ended naturally with a
// winner).
//
// Host variant (isHost=true): shows a "End session" button → onEnd().
// Participant variant: shows a "Quit" button → onQuit() (navigates away).

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  visible: boolean;
  /** Pass true on the host side to show the "End session" button. */
  isHost?: boolean;
  /** Called when the host clicks "End session". */
  onEnd?: () => void;
  /** Called when a participant clicks "Quit". Typically navigates to /audience-participation. */
  onQuit?: () => void;
}

export function GameOverOverlay({ visible, isHost = false, onEnd, onQuit }: Props) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="game-over-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/85 backdrop-blur-lg"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 240, delay: 0.05 }}
            className="relative w-full max-w-[600px] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90 backdrop-blur-2xl"
          >
            {/* Left accent bar */}
            <div className="absolute inset-y-0 left-0 w-[6px] bg-red-800 shadow-[0_0_30px_rgba(127,29,29,0.8)]" />

            {/* Top hazard stripes */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] opacity-80"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgb(153 27 27) 0 8px, transparent 8px 16px)",
              }}
            />

            <div className="px-10 sm:px-14 pt-12 pb-12">

              {/* Headline */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div
                  className="font-black uppercase tracking-tighter text-white leading-none"
                  style={{ fontSize: "clamp(3rem, 10vw, 5.5rem)" }}
                >
                  Game
                </div>
                <div
                  className="font-black uppercase tracking-tighter leading-none bg-red-700 bg-clip-text text-transparent"
                  style={{ fontSize: "clamp(3rem, 10vw, 5.5rem)" }}
                >
                  Over
                </div>
              </motion.div>

              {/* Sub-copy */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-6 text-base sm:text-lg font-medium text-white/60 leading-snug max-w-[400px]"
              >
                All participants have been eliminated.
                <br />
                <span className="text-white/40">No winner this time.</span>
              </motion.p>

              {/* Divider */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.45, duration: 0.5, ease: "easeOut" }}
                className="origin-left mt-8 h-px bg-gradient-to-r from-red-700/60 via-white/10 to-transparent"
              />

              {/* Footer / action row */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 }}
                className="mt-6 flex items-center justify-between gap-4"
              >

                {isHost && onEnd && (
                  <button
                    onClick={onEnd}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    End session
                    <span className="text-white/50">→</span>
                  </button>
                )}

                {!isHost && onQuit && (
                  <button
                    onClick={onQuit}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                  >
                    Leave
                    <span className="text-white/50">→</span>
                  </button>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
