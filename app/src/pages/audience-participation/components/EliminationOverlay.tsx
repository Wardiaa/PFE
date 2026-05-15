// EliminationOverlay.tsx
// Full-screen overlay shown to a participant AFTER the question timer has ended.
// The participant chooses whether to stay as a spectator or leave the session.
//
// Speed-question logic:
//   • isSpeedQuestion=true  AND rank is a positive number
//       → participant answered CORRECTLY but was too slow.
//         Show "#rank · Seuls les N plus rapides avancent."
//   • isSpeedQuestion=true  AND rank is null / 0
//       → participant answered WRONG.
//         Show the default elimination message (no rank detail).
//   • isSpeedQuestion=false
//       → regular elimination, default message.

import { Eye, LogOut } from "lucide-react";

interface Props {
  show: boolean;
  roundNumber: number;
  onStay: () => void;
  onLeave: () => void;
  // Optional — only relevant for speed-question eliminations.
  isSpeedQuestion?: boolean;
  // rank > 0  → correct-but-slow (rank text shown)
  // rank null / 0 → wrong answer (no rank text)
  rank?: number | null;
  maxAdvance?: number;
}

export function EliminationOverlay({
  show,
  roundNumber,
  onStay,
  onLeave,
  isSpeedQuestion = false,
  rank = null,
  maxAdvance = 3,
}: Props) {
  if (!show) return null;

  const getEliminationMessage = () => {
    // Speed question + correct answer + rank available → show rank detail
    if (isSpeedQuestion && rank !== null && rank > 0) {
      return (
        <>
          <p className="mt-8 text-xl text-[color:var(--cpl-text-muted)] cpl-display">
            Question {roundNumber} · Vous êtes éliminé
          </p>
          <p className="mt-2 text-sm text-[color:var(--cpl-text-dim)]">
            Vous étiez #{rank}. Seuls les {maxAdvance} plus rapides avancent.
          </p>
        </>
      );
    }

    // Default: wrong answer on speed question, or regular elimination
    return (
      <>
        <p className="mt-8 text-xl text-[color:var(--cpl-text-muted)] cpl-display">
          Question {roundNumber} · Vous êtes éliminé
        </p>
        <p className="mt-2 text-sm text-[color:var(--cpl-text-dim)]">
          Voulez-vous rester pour voir la suite ou quitter la session ?
        </p>
      </>
    );
  };

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md cpl-wrong-shake px-4"
    >
      <div className="text-center max-w-md w-full">
        <div className="cpl-eliminated-stamp">ÉLIMINÉ</div>

        {getEliminationMessage()}

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onStay}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white/90 bg-teal-700 hover:bg-teal-600 transition-colors border border-white/20"
          >
            <Eye className="w-5 h-5" />
            Rester en spectateur
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white/90 bg-white/5 hover:bg-white/10 transition-colors border border-white/20"
          >
            <LogOut className="w-5 h-5" />
            Quitter la session
          </button>
        </div>
      </div>
    </div>
  );
}
