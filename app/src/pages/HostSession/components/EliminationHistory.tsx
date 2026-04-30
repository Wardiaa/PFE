// EliminationHistory.tsx
// Compact side-panel widget for the presenter (host) view. Shows every
// elimination in order: who, on which round, at what time. Pulls from the
// `elimination_log` table via SessionService.getEliminationHistory().

import { useEffect, useState } from "react";
import { Skull, Users, History } from "lucide-react";
import { SessionService } from "../../../service/session.service";
import type { EliminationEvent, GameState } from "../../../lib/presentation.types";

interface Props {
  sessionId: string;
  /** Optional — if you already have the live game state, pass it; otherwise we poll. */
  gameState?: GameState;
  /** Optional — how often to refresh (ms). Defaults to 4000. Ignored if gameState is provided. */
  pollIntervalMs?: number;
}

export function EliminationHistory({ sessionId, gameState, pollIntervalMs = 4000 }: Props) {
  const [history, setHistory] = useState<EliminationEvent[]>(
    gameState?.history ?? [],
  );

  useEffect(() => {
    if (gameState?.history) {
      setHistory(gameState.history);
      return;
    }
    let alive = true;
    const tick = async () => {
      const h = await SessionService.getEliminationHistory(sessionId);
      if (alive) setHistory(h);
    };
    tick();
    const id = setInterval(tick, pollIntervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [sessionId, gameState, pollIntervalMs]);

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
