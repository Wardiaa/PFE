// EliminationOverlay.tsx
// Full-screen overlay shown to a participant AFTER the question timer has ended.
// The participant chooses whether to stay as a spectator or leave the session.

import { Skull, Eye, LogOut } from "lucide-react";

interface Props {
  show: boolean;
  roundNumber: number;
  onStay: () => void;
  onLeave: () => void;
}

export function EliminationOverlay({ show, roundNumber, onStay, onLeave }: Props) {
  if (!show) return null;

  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md cpl-wrong-shake px-4"
    >
      <div className="text-center max-w-md w-full">
        <div className="flex justify-center mb-6">
          <Skull className="w-20 h-20 text-[color:var(--cpl-danger)]" />
        </div>

        <div className="cpl-eliminated-stamp">ÉLIMINÉ</div>

        <p className="mt-8 text-xl text-[color:var(--cpl-text-muted)] cpl-display">
          Manche {roundNumber} · Vous êtes éliminé
        </p>
        <p className="mt-2 text-sm text-[color:var(--cpl-text-dim)]">
          Voulez-vous rester pour voir la suite ou quitter la session ?
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onStay}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white bg-[color:var(--cpl-primary,#1b2a8a)] hover:opacity-90 transition-opacity border border-white/20 shadow-lg"
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
