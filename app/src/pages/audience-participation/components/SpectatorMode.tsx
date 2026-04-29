// SpectatorMode.tsx
// Shown to participants who have been eliminated. They can still watch the
// current question, see eliminations as they happen, and watch the live
// leaderboard — but cannot submit answers. Includes a "Quitter" button.
//
// Answer reveal behaviour:
//   - `hideEliminationBanner`: hides the red "you have been eliminated"
//     banner during the post-submit waiting window so a participant doesn't
//     learn their fate before the round timer ends.
//   - `showAnswerReveal` + `submittedOptionId`: when the round timer ends,
//     the audience code flips `showAnswerReveal` on so this component
//     highlights:
//       • the CORRECT option with a green border (always)
//       • the WRONG option the participant submitted with a red border
//         (only when they actually picked a wrong answer this round —
//         established spectators who didn't submit see only the green
//         border on the correct option, no red borders).

import { Eye, LogOut } from "lucide-react";
import { LiveLeaderboard } from "./LiveLeaderboard";
import type { GameState, Question } from "../../../lib/presentation.types";

interface Option {
  id: string;
  text: string;
  imageUrl?: string | null;
  isCorrect?: boolean;
}

interface Props {
  currentQuestion: Question | null;
  gameState: GameState;
  eliminatedAtRound: number;
  onLeave: () => void;
  /**
   * When true, the red "Vous avez été éliminé à la manche X" banner is not
   * rendered. Use this while the round timer is still running so the
   * participant doesn't learn their fate before the round closes.
   * Defaults to false (banner shown — original behaviour).
   */
  hideEliminationBanner?: boolean;
  /**
   * When true, highlight the correct option with a green border and the
   * participant's submitted option (if wrong) with a red border. Used for
   * the brief "answer reveal" window right before the EliminationOverlay
   * appears for a participant who answered incorrectly.
   */
  showAnswerReveal?: boolean;
  /**
   * The option id the participant submitted for the current question (if
   * any). Used together with `showAnswerReveal` to draw a red border around
   * the wrong choice.
   */
  submittedOptionId?: string | null;
}

// Helper: check if an option has only an image and no text
const isImageOnlyOption = (option: Option): boolean => {
  const hasImage = !!option.imageUrl;
  const hasNoText = !option.text || option.text.trim() === '';
  return hasImage && hasNoText;
};

export function SpectatorMode({
  currentQuestion,
  gameState,
  eliminatedAtRound,
  onLeave,
  hideEliminationBanner = false,
  showAnswerReveal = false,
  submittedOptionId = null,
}: Props) {
  return (
    <div className="cpl-theme min-h-screen px-4 py-8 sm:py-12">
      {/* Keyframes powering the subtle fade-in on green/red answer reveal
          borders. Scoped to this component so it doesn't bleed elsewhere. */}
      <style>{`
        @keyframes cplRevealFade {
          0%   { opacity: 0; transform: scale(0.97); }
          60%  { opacity: 1; transform: scale(1.01); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div className="mx-auto max-w-3xl">
        {/* Spectator banner — hidden during the post-submit waiting window. */}
        {!hideEliminationBanner && (
          <div className="cpl-card flex items-center justify-between gap-4 p-4 sm:p-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[color:var(--cpl-danger)]/15 p-2">
                <Eye className="h-5 w-5 text-[color:var(--cpl-danger)]" />
              </div>
              <div>
                <p className="cpl-display text-base sm:text-lg">
                  Vous avez été éliminé à la manche {eliminatedAtRound}
                </p>
                <p className="text-sm text-[color:var(--cpl-text-muted)]">
                  Vous pouvez continuer à regarder la partie.
                </p>
              </div>
            </div>
            <button
              onClick={onLeave}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/80 hover:bg-white/5 transition"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        )}

        {/* Current question (read-only) */}
        {currentQuestion ? (
          <div className="cpl-card p-6 sm:p-8 mb-6">
            <div className="text-xs uppercase tracking-widest text-[color:var(--cpl-text-dim)] mb-2">
              Question en cours · Manche {gameState.currentRound}
            </div>
            <h2 className="cpl-display text-xl sm:text-2xl text-white mb-4">
              {currentQuestion.text}
            </h2>
            {currentQuestion.image && (
              <div className="mb-4 flex justify-center rounded-xl border border-white/10 bg-white/[0.02] p-2">
                <img
                  src={currentQuestion.image}
                  alt=""
                  className="block w-auto max-w-full h-auto max-h-[420px] object-contain mx-auto rounded-lg"
                />
              </div>
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {(currentQuestion.options ?? []).map((opt) => {
                const imageOnly = isImageOnlyOption(opt as Option);
                const isCorrect = !!(opt as any).isCorrect;

                // Default look — neutral border.
                let optionClass = imageOnly
                  ? "rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden transition-colors"
                  : "rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white/70 transition-colors";

                let highlightStyle: React.CSSProperties | undefined;

                if (showAnswerReveal) {
                  // Red border ONLY for the specific wrong option this
                  // participant submitted. Established spectators (no
                  // submission this round) just see the green border on
                  // the correct option.
                  const isSubmittedWrong =
                    submittedOptionId === opt.id && !isCorrect;

                  if (isCorrect) {
                    if (imageOnly) {
                      optionClass =
                        "rounded-lg border-2 border-green-500 bg-green-500/10 overflow-hidden ring-2 ring-green-500/40 transition-colors";
                    } else {
                      optionClass =
                        "rounded-lg border-2 border-green-500 bg-green-500/10 px-4 py-3 text-white ring-2 ring-green-500/40 transition-colors";
                    }
                    highlightStyle = {
                      animation: "cplRevealFade 500ms ease-out both",
                    };
                  } else if (isSubmittedWrong) {
                    if (imageOnly) {
                      optionClass =
                        "rounded-lg border-2 border-red-500 bg-red-500/10 overflow-hidden ring-2 ring-red-500/40 transition-colors";
                    } else {
                      optionClass =
                        "rounded-lg border-2 border-red-500 bg-red-500/10 px-4 py-3 text-white ring-2 ring-red-500/40 transition-colors";
                    }
                    highlightStyle = {
                      animation: "cplRevealFade 500ms ease-out both",
                    };
                  }
                }

                return (
                  <li key={opt.id} className={optionClass} style={highlightStyle}>
                    {imageOnly ? (
                      <div className="relative">
                        <img
                          src={(opt as Option).imageUrl || ''}
                          alt=""
                          className="w-full h-auto object-contain max-h-32"
                        />
                      </div>
                    ) : (
                      opt.text
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-[color:var(--cpl-text-dim)]">
              {showAnswerReveal
                ? "Réponse correcte révélée…"
                : hideEliminationBanner
                ? "Réponse enregistrée — en attente de la fin de la manche…"
                : "Mode spectateur — vous ne pouvez pas répondre."}
            </p>
          </div>
        ) : (
          <div className="cpl-card p-6 mb-6 text-center text-[color:var(--cpl-text-muted)]">
            En attente de la prochaine question…
          </div>
        )}

        {/* Live leaderboard — only shown once the participant is truly in
            "spectator after elimination" mode. We hide it during the
            post-submit waiting window (hideEliminationBanner === true),
            because the round timer is still running and seeing the
            leaderboard would spoil the participant's own elimination.
            Default-collapsed to keep the screen compact when there are
            many players. */}
        {!hideEliminationBanner && (
          <LiveLeaderboard gameState={gameState} defaultCollapsed />
        )}
      </div>
    </div>
  );
}
