// EliminationHistory.tsx
// Compact side-panel widget for the presenter (host) view. Shows every
// elimination in order: who, on which round, at what time. Pulls from the
// `elimination_log` table via SessionService.getEliminationHistory().
//
// FIX: history now ALWAYS comes from the DB via polling, regardless of whether
// `gameState` is supplied. Previously, passing `gameState` caused the component
// to read from the frozen `displayedGameState.history` snapshot, which is only
// refreshed at timer-end or when the host clicks "Next Question". This meant
// eliminations on no-timer questions were invisible until the host manually
// advanced — the DB had the record, but the UI was reading the stale snapshot.
//
// `gameState` is now used ONLY for the alive-count badge (top-right), which is
// fine to come from the frozen state. All history items come from live DB polls.

import { useEffect, useRef, useState } from "react";
import { Skull, Users, History } from "lucide-react";
import { SessionService } from "../../../service/session.service";
import type { EliminationEvent, GameState } from "../../../lib/presentation.types";

interface Props {
  sessionId: string;
  /**
   * Optional live or frozen game state. Used ONLY to display the alive-count
   * badge (aliveCount / totalCount). History is always fetched from the DB.
   */
  gameState?: GameState;
  /** How often to poll the DB for new eliminations (ms). Defaults to 2000. */
  pollIntervalMs?: number;
}

export function EliminationHistory({ sessionId, gameState, pollIntervalMs = 2000 }: Props) {
  const [history, setHistory] = useState<EliminationEvent[]>([]);
  // Keep a stable ref to the interval so we can clear it cleanly.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      const h = await SessionService.getEliminationHistory(sessionId);
      if (alive) setHistory(h);
    };

    // Fetch immediately on mount and whenever sessionId changes.
    tick();

    // Then poll on the given interval. Using a short default (2 s) so an
    // elimination shows up within a couple of seconds of the participant
    // answering wrongly, even on no-timer questions where the host has not
    // yet clicked "Next Question".
    intervalRef.current = setInterval(tick, pollIntervalMs);

    return () => {
      alive = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, pollIntervalMs]);
  // Note: `gameState` is intentionally NOT in the dependency array here.
  // History always comes from the DB; gameState is only read for the badge below.

  // These can come from either the live or the frozen game state — both are fine
  // for display purposes. The live state (if available) gives a more accurate
  // count, but the frozen state is also acceptable.
  const aliveCount = gameState?.alive.length;
  const totalCount = gameState?.totalPlayers;

  return (
    <aside className="rounded-xl border border-border bg-card p-4">
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Historique des éliminations</h3>
        </div>
        {typeof aliveCount === "number" && typeof totalCount === "number" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-0.5 text-xs">
            <Users className="h-3 w-3" />
            {aliveCount}/{totalCount} en lice
          </span>
        )}
      </header>

      {history.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aucune élimination pour l'instant.
        </p>
      ) : (
        <ol className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {history.map((e) => (
            <li
              key={`${e.participantId}-${e.questionId}-${e.roundNumber}`}
              className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/30 px-3 py-2"
            >
              <Skull className="h-3.5 w-3.5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1 text-xs">
                <div className="font-medium text-foreground truncate">
                  {e.participantName}
                </div>
                <div className="text-muted-foreground">
                  Question {e.roundNumber} ·{" "}
                  {new Date(e.eliminatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
