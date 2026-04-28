// SpectatorMode.tsx
// Shown to participants who have been eliminated. They can still watch the
// current question, see eliminations as they happen, and watch the live
// leaderboard — but cannot submit answers. Includes a "Quitter" button.

import { Eye, LogOut } from "lucide-react";
import { LiveLeaderboard } from "./LiveLeaderboard";
import type { GameState, Question } from "../../../lib/presentation.types";

interface Props {
  currentQuestion: Question | null;
  gameState: GameState;
  eliminatedAtRound: number;
  onLeave: () => void;
}

export function SpectatorMode({
  currentQuestion,
  gameState,
  eliminatedAtRound,
  onLeave,
}: Props) {
  return (
    <div className="cpl-theme min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        {/* Spectator banner */}
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
              <img
                src={currentQuestion.image}
                alt=""
                className="w-full rounded-xl border border-white/10 mb-4"
              />
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {(currentQuestion.options ?? []).map((opt) => (
                <li
                  key={opt.id}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-white/70"
                >
                  {opt.text}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[color:var(--cpl-text-dim)]">
              Mode spectateur — vous ne pouvez pas répondre.
            </p>
          </div>
        ) : (
          <div className="cpl-card p-6 mb-6 text-center text-[color:var(--cpl-text-muted)]">
            En attente de la prochaine question…
          </div>
        )}

        {/* Live leaderboard */}
        <LiveLeaderboard gameState={gameState} />
      </div>
    </div>
  );
}
