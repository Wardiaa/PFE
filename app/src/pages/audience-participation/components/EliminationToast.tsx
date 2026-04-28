// EliminationToast.tsx
// Stack of elimination announcements that slides in from the top of the
// screen. The audience flow pushes one toast per PLAYER_ELIMINATED event and
// auto-dismisses each after ~4s.

import { useEffect, useState } from "react";
import { Skull } from "lucide-react";
import type { EliminationEvent } from "../../../lib/presentation.types";

interface Props {
  events: EliminationEvent[]; // newest at the end
}

const TOAST_TTL_MS = 4000;

export function EliminationToast({ events }: Props) {
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = events.map(
      (e) => `${e.participantId}-${e.questionId}-${e.roundNumber}`,
    );
    setVisibleIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });

    const timers = ids.map((id) =>
      setTimeout(() => {
        setVisibleIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, TOAST_TTL_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [events]);

  const visible = events.filter((e) =>
    visibleIds.has(`${e.participantId}-${e.questionId}-${e.roundNumber}`),
  );

  if (visible.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[90] flex flex-col items-center gap-2 px-3"
      aria-live="polite"
    >
      {visible.slice(-3).map((e) => (
        <div
          key={`${e.participantId}-${e.questionId}-${e.roundNumber}`}
          className="cpl-card pointer-events-auto flex items-center gap-3 rounded-full border-[color:var(--cpl-danger)]/40 px-4 py-2 text-sm text-white shadow-2xl animate-in slide-in-from-top-2 fade-in duration-300"
          style={{ borderColor: "rgba(255,51,68,0.35)" }}
        >
          <Skull className="h-4 w-4 text-[color:var(--cpl-danger)] flex-shrink-0" />
          <span>
            <span className="font-semibold text-[color:var(--cpl-danger)]">
              {e.participantName}
            </span>{" "}
            a été éliminé{" "}
            <span className="text-[color:var(--cpl-text-muted)]">
              · manche {e.roundNumber}
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}
