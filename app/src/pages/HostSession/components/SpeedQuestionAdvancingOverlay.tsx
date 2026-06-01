// SpeedQuestionAdvancingOverlay.tsx
// Host-side overlay shown once the speed question timer ends and results are processed.
// Same editorial structure as RoundEliminationsOverlay — big number + names toggle —
// but light mode with the app's primary colour. Zero gradients.

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Zap } from "lucide-react";

interface Props {
  /** Number of participants advancing. */
  count: number | null;
  /** Optional question number. */
  questionNumber?: number;
  /** Names of advancing participants. */
  advancingNames?: string[];
  onClose: () => void;
}

export function SpeedQuestionAdvancingOverlay({
  count,
  questionNumber,
  advancingNames = [],
  onClose,
}: Props) {
  const [showNames, setShowNames] = useState(false);
  const visible = typeof count === "number" && count > 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="speed-advancing-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 260 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
          >
            {/* Left accent bar — primary colour, no glow */}
            <div className="absolute inset-y-0 left-0 w-[6px] bg-primary" />

            {/* Top accent line — solid primary, no gradient */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary/30" />

            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="px-10 sm:px-14 pt-10 pb-12">
              {/* Header */}
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Speed Question
                  </span>
                </div>
                {typeof questionNumber === "number" && questionNumber > 0 && (
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                    Q{String(questionNumber).padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="min-h-[220px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {!showNames ? (
                    /* Big Number View */
                    <motion.div
                      key="count-view"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-end gap-6"
                    >
                      <motion.div
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1, type: "spring", damping: 18, stiffness: 220 }}
                        className="leading-[0.85] font-black tracking-tighter text-foreground tabular-nums"
                        style={{
                          fontSize: "clamp(7rem, 18vw, 11rem)",
                          fontFeatureSettings: '"tnum" 1, "ss01" 1',
                        }}
                      >
                        {count}
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 }}
                        className="pb-4 sm:pb-6"
                      >
                        <div className="text-2xl sm:text-3xl font-black uppercase leading-none text-foreground">
                          {count === 1 ? "Joueur" : "Joueurs"}
                        </div>
                        <div className="mt-1 text-2xl sm:text-3xl font-black uppercase leading-none text-primary">
                          {count === 1 ? "Avance" : "Avancent"}
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    /* Names List View */
                    <motion.div
                      key="names-view"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="w-full"
                    >
                      <div className="flex items-center gap-2 mb-4 text-primary">
                        <Users size={18} />
                        <span className="text-sm font-bold uppercase tracking-wider">
                          Joueurs qui avancent
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                        {advancingNames.length > 0 ? (
                          advancingNames.map((name, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="bg-primary/8 border border-primary/20 rounded px-3 py-2 text-foreground text-sm font-medium truncate"
                            >
                              {name}
                            </motion.div>
                          ))
                        ) : (
                          <div className="col-span-full text-muted-foreground text-sm italic">
                            Aucun nom disponible
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Divider — solid, no gradient */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
                className="origin-left mt-10 h-px bg-border"
              />

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-5 flex items-center justify-between"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNames(!showNames);
                  }}
                  className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-2 text-sm font-medium cursor-pointer"
                >
                  {showNames ? "Retour au score" : "Voir les noms"}
                </button>
                <span className="text-muted-foreground text-[11px] font-mono uppercase tracking-[0.22em]">
                  echap · clic pour fermer
                </span>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
