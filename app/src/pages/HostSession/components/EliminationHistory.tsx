// EliminationHistory.tsx
import { useEffect, useRef, useState } from "react";
import { Skull, Users, Clock } from "lucide-react";
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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let alive = true;

    const tick = async () => {
      const h = await SessionService.getEliminationHistory(sessionId);
      if (alive) setHistory(h);
    };

    tick();
    intervalRef.current = setInterval(tick, pollIntervalMs);

    return () => {
      alive = false;
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, pollIntervalMs]);

  const aliveCount = gameState?.alive.length;
  const totalCount = gameState?.totalPlayers;

  return (
    <aside className="flex flex-col h-full bg-background font-sans">
      {/* Minimal Header */}
      <header className="flex items-end justify-between pb-4 mb-4 border-b border-border">
        <div>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1">
            Activity Log
          </h3>
          <div className="text-lg font-semibold tracking-tight">
            Eliminations
          </div>
        </div>
        
        {typeof aliveCount === "number" && typeof totalCount === "number" && (
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users size={14} className="text-muted-foreground" />
            <span className="tabular-nums">
              {aliveCount} <span className="text-muted-foreground">/ {totalCount}</span>
            </span>
          </div>
        )}
      </header>

      {/* Feed Container */}
      <div className="flex-1 overflow-hidden">
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground/60 italic font-light">
              No eliminations recorded yet
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {history.map((e) => (
              <div
                key={`${e.participantId}-${e.questionId}-${e.roundNumber}`}
                className="group flex items-center justify-between py-3 px-1 border-b border-border/40 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-red-500/40 group-hover:bg-red-500 transition-colors" />
                  <span className="text-sm font-medium text-foreground truncate max-w-[160px]">
                    {e.participantName}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground uppercase">
                  <div className="flex items-center gap-1.5 bg-muted px-2 py-0.5 rounded text-foreground/70 font-semibold">
                    Q{String(e.roundNumber).padStart(2, "0")}
                  </div>
                  <div className="hidden sm:flex items-center gap-1 w-16 justify-end tabular-nums">
                    <Clock size={10} />
                    {new Date(e.eliminatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-auto pt-6">
        <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Status</span>
            <span className="text-foreground">Live Feed Active</span>
          </div>
        </div>
      </footer>
    </aside>
  );
}