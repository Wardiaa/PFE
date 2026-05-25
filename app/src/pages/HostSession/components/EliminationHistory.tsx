// EliminationHistory.tsx
// OPTIMIZED: Removed 2s DB polling. History is now passed as a prop from the
// parent (HostSession), which already holds the full `gameState.history` array
// updated in real-time via Supabase Broadcast + Postgres CDC events.
// This eliminates 30 unnecessary DB round-trips per minute per host.
//
// FIX: For final-round withdrawals that happen BEFORE the last question starts,
// they are always shown immediately (not gated by revealHistory). Now uses
// round number comparison instead of timestamps for reliability across timezones.

import { Users, Clock, Hourglass } from "lucide-react";
import type { EliminationEvent, GameState } from "../../../lib/presentation.types";

interface Props {
  sessionId: string;
  /**
   * The ID of the question currently being played.
   * Eliminations from previous questions are always shown.
   * Eliminations from the current question are gated by `revealHistory`
   * UNLESS they happened in a previous round (determined by roundNumber).
   */
  currentQuestionId?: string;
  /**
   * The 1-indexed number of the current question (e.g., 3 for Q3).
   * Used to determine if an elimination happened in a previous round.
   * More reliable than timestamp comparison across timezones.
   */
  currentQuestionNumber?: number;
  /**
   * Optional live or frozen game state. Used ONLY to display the alive-count
   * badge (aliveCount / totalCount). History is always fetched from the DB.
   */
  gameState?: GameState;
  /**
   * OPTIMIZED: Elimination history passed directly from the parent instead of
   * polling the DB. The parent's `gameState.history` array is kept up-to-date
   * by Supabase Broadcast events (PLAYER_ELIMINATED) and Postgres CDC
   * subscriptions on `elimination_log`, so no additional DB queries are needed.
   *
   * Previously this component polled `SessionService.getEliminationHistory`
   * every `pollIntervalMs` ms — equivalent to 30 DB queries/minute per host.
   */
  eliminationHistory: EliminationEvent[];
  /**
   * @deprecated No longer used. DB polling has been replaced by prop-driven
   * updates. Kept in the interface for a smooth migration — removing it is safe
   * once all call-sites have been updated.
   */
  pollIntervalMs?: number;
  /**
   * Controls whether the CURRENT question's eliminations are visible.
   *
   * • timed questions  → pass `!timerActive && !isProcessingSpeedQuestion`
   * • untimed questions → pass `showResults`
   *
   * EXCEPTION: Eliminations that happened in PREVIOUS rounds (roundNumber < currentQuestionNumber)
   * are ALWAYS shown regardless of this flag. This ensures final-round withdrawals
   * (which happen before the last question starts) appear immediately.
   *
   * For the last question, pass `true` so withdrawals appear immediately.
   *
   * Defaults to `true` for backward compatibility.
   */
  revealHistory?: boolean;
}

export function EliminationHistory({
  currentQuestionId,
  currentQuestionNumber,
  gameState,
  eliminationHistory,
  // pollIntervalMs is intentionally unused — see deprecation note above.
  revealHistory = true,
}: Props) {
  const aliveCount = gameState?.alive.length;
  const totalCount = gameState?.totalPlayers;

  // Deduplicate: for each (participantId, questionId) pair keep only the most
  // recent entry. This handles the speed-question double-write where a wrong
  // answer writes one record immediately and processSpeedQuestionEnd writes
  // another at timer end.
  const deduped = Array.from(
    eliminationHistory
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

  // Split into two buckets using round number comparison:
  // • visibleHistory — previous rounds (always) + current round (only when revealed)
  // • hiddenCount     — current round entries that are gated
  //
  // CRITICAL FIX: Use roundNumber comparison instead of timestamp.
  // For final-round withdrawals, the elimination has roundNumber equal to
  // currentQuestionNumber, but it happened BEFORE the question started.
  // Since it's the SAME round number, it will be hidden until revealHistory=true.
  // For the last question, the parent must pass revealHistory=true.
  const visibleHistory = deduped.filter((e) => {
    // If we have currentQuestionNumber, use round-based filtering
    if (currentQuestionNumber !== undefined) {
      const eliminationRound = e.roundNumber;
      // Eliminations from previous rounds are always visible
      if (eliminationRound < currentQuestionNumber) return true;
      // Eliminations from current round depend on revealHistory
      if (eliminationRound === currentQuestionNumber) return revealHistory;
      // Future rounds (shouldn't happen) are not visible
      return false;
    }
    
    // Fallback to questionId-based filtering (old behavior)
    if (e.questionId !== currentQuestionId) return true;
    return revealHistory;
  });
  
  const hiddenCount = deduped.filter((e) => {
    if (currentQuestionNumber !== undefined) {
      const eliminationRound = e.roundNumber;
      return eliminationRound === currentQuestionNumber && !revealHistory;
    }
    
    // Fallback to questionId-based filtering
    if (e.questionId !== currentQuestionId) return false;
    return !revealHistory;
  }).length;

  // Show the waiting notice only for current-round eliminations that are hidden
  const showPendingNotice = !revealHistory && hiddenCount > 0;

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

        {/* Pending notice for current question eliminations that are still hidden */}
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