// EliminationHistory.tsx
import { useEffect, useRef, useState } from "react";
import { Users, Clock, Hourglass } from "lucide-react";
import { SessionService } from "../../../service/session.service";
import type { EliminationEvent, GameState } from "../../../lib/presentation.types";

interface Props {
  sessionId: string;
  /**
   * The ID of the question currently being played.
   * Eliminations from previous questions are always shown.
   * Eliminations from the current question are gated by `revealHistory`.
   */
  currentQuestionId?: string;
  /**
   * Optional live or frozen game state. Used ONLY to display the alive-count
   * badge (aliveCount / totalCount). History is always fetched from the DB.
   */
  gameState?: GameState;
  /** How often to poll the DB for new eliminations (ms). Defaults to 2000. */
  pollIntervalMs?: number;
  /**
   * Controls whether the CURRENT question's eliminations are visible.
   *
   * • timed questions  → pass `!timerActive && !isProcessingSpeedQuestion`
   * • untimed questions → pass `showResults`
   *
   * Eliminations from ALL previous questions are always shown regardless of
   * this flag.  Defaults to `true` for backward compatibility.
   */
  revealHistory?: boolean;
}

export function EliminationHistory({
  sessionId,
  currentQuestionId,
  gameState,
  pollIntervalMs = 2000,
  revealHistory = true,
}: Props) {
  const [history, setHistory] = useState<EliminationEvent[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Always poll in the background regardless of display gates.
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

  // Deduplicate: for each (participantId, questionId) pair keep only the most
  // recent entry. This handles the speed-question double-write where a wrong
  // answer writes one record immediately and processSpeedQuestionEnd writes
  // another at timer end.
  const deduped = Array.from(
    history
      .slice()
      .sort((a, b) => new Date(b.eliminatedAt).getTime() - new Date(a.eliminatedAt).getTime())
      .reduce((map, e) => {
        const key = `${e.participantId}::${e.questionId}`;
        if (!map.has(key)) map.set(key, e);
        return map;
      }, new Map<string, EliminationEvent>())
      .values(),
  // Re-sort ascending by eliminatedAt so the list reads oldest → newest
  ).sort((a, b) => new Date(a.eliminatedAt).getTime() - new Date(b.eliminatedAt).getTime());

  // Split into two buckets:
  // • visibleHistory  — past questions (always) + current question (only when revealed)
  // • hiddenCount     — current question entries that are gated
  const visibleHistory = deduped.filter(
    (e) => e.questionId !== currentQuestionId || revealHistory,
  );
  const hiddenCount = deduped.filter(
    (e) => e.questionId === currentQuestionId && !revealHistory,
  ).length;

  // Show the waiting notice when the current question still has pending entries
  // OR when we're mid-question and revealHistory is false (even if 0 elims yet).
  const showPendingNotice = !revealHistory;

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
      <div className="flex-1 overflow-hidden flex flex-col gap-3">
        {visibleHistory.length === 0 && !showPendingNotice ? (
          <div className="flex-1 flex items-center justify-center py-10">
            <p className="text-sm text-muted-foreground/60 italic font-light">
              No eliminations recorded yet
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {visibleHistory.length === 0 ? null : visibleHistory.map((e) => (
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

        {/* Pending notice for the current question — shown inline, not full-screen */}
        {showPendingNotice && (
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
            <Hourglass size={12} className="shrink-0 text-muted-foreground/60" />
            <span>
              {hiddenCount > 0
                ? `${hiddenCount} élimination${hiddenCount > 1 ? "s" : ""} en attente de la fin de la question`
                : "En attente de la fin de la question…"}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-auto pt-6">
        <div className="rounded-lg bg-muted/50 p-3 border border-border/50">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Status</span>
            <span className="text-foreground">
              {revealHistory ? "Live Feed Active" : "En attente…"}
            </span>
          </div>
        </div>
      </footer>
    </aside>
  );
}
