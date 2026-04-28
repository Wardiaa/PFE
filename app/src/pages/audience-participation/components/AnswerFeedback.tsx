// AnswerFeedback.tsx
// Briefly flashes a green "BIEN JOUÉ +N pts" or red "MAUVAISE RÉPONSE" badge
// over the question after a participant submits, before the elimination
// overlay (if applicable) takes over.

import { Check, X } from "lucide-react";

interface Props {
  show: boolean;
  correct: boolean;
  pointsAwarded?: number;
}

export function AnswerFeedback({ show, correct, pointsAwarded = 0 }: Props) {
  if (!show) return null;

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[60] flex items-center justify-center ${
        correct ? "cpl-correct-flash" : ""
      }`}
      aria-live="polite"
    >
      <div
        className="rounded-2xl px-8 py-6 text-center backdrop-blur-md border"
        style={{
          background: correct
            ? "rgba(34, 238, 136, 0.18)"
            : "rgba(255, 51, 68, 0.18)",
          borderColor: correct
            ? "rgba(34, 238, 136, 0.5)"
            : "rgba(255, 51, 68, 0.5)",
          boxShadow: correct
            ? "0 0 36px rgba(34,238,136,0.45)"
            : "0 0 36px rgba(255,51,68,0.45)",
        }}
      >
        <div className="flex items-center justify-center mb-2">
          {correct ? (
            <Check
              className="h-12 w-12 text-[color:var(--cpl-success)]"
              strokeWidth={3}
            />
          ) : (
            <X className="h-12 w-12 text-[color:var(--cpl-danger)]" strokeWidth={3} />
          )}
        </div>
        <div
          className="cpl-display text-2xl"
          style={{ color: correct ? "var(--cpl-success)" : "var(--cpl-danger)" }}
        >
          {correct ? "BIEN JOUÉ" : "MAUVAISE RÉPONSE"}
        </div>
        {correct && pointsAwarded > 0 && (
          <div className="mt-1 text-lg font-bold text-white">
            +{pointsAwarded} pts
          </div>
        )}
      </div>
    </div>
  );
}
