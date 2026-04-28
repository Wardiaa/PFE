// LiveLeaderboard.tsx
// Renders the alive players as a glowing pod grid (top 12) plus a count
// badge for total alive / total players.

import { Crown, Skull } from "lucide-react";
import type { GameState, Participant } from "../../../lib/presentation.types";

interface Props {
  gameState: GameState;
  highlightParticipantId?: string;
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

function Pod({
  participant,
  variant,
  highlight,
  rank,
}: {
  participant: Participant;
  variant: "alive" | "leader" | "eliminated";
  highlight?: boolean;
  rank?: number;
}) {
  return (
    <div
      className={`cpl-pod ${
        variant === "leader"
          ? "cpl-pod--leader"
          : variant === "eliminated"
          ? "cpl-pod--eliminated"
          : "cpl-pod--alive"
      } ${highlight ? "ring-2 ring-[color:var(--cpl-primary)]" : ""}`}
    >
      <div className="flex items-center gap-3 p-3">
        <div className="relative h-10 w-10 flex-shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-sm font-bold text-white">
            {initials(participant.name)}
          </div>
          {variant === "leader" && (
            <Crown className="absolute -top-2 -right-2 h-4 w-4 text-[color:var(--cpl-gold)] drop-shadow" />
          )}
          {variant === "eliminated" && (
            <Skull className="absolute -top-1 -right-1 h-3.5 w-3.5 text-[color:var(--cpl-danger)]" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">
            {participant.name}
          </div>
          <div className="text-xs text-[color:var(--cpl-text-muted)]">
            {variant === "eliminated"
              ? `Éliminé · manche ${participant.eliminatedAtRound ?? "?"}`
              : `${participant.score} pts${rank ? ` · #${rank}` : ""}`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LiveLeaderboard({ gameState, highlightParticipantId }: Props) {
  // Sort alive participants by score (highest first)
  const aliveSorted = [...gameState.alive].sort((a, b) => b.score - a.score);
  const leaderId = aliveSorted[0]?.id;
  const visibleAlive = aliveSorted.slice(0, 12);
  
  // Sort eliminated participants by elimination round (most recent first)
  const recentEliminated = [...gameState.eliminated]
    .sort((a, b) => (b.eliminatedAtRound ?? 0) - (a.eliminatedAtRound ?? 0))
    .slice(0, 8);

  // Calculate correct counts
  const aliveCount = gameState.alive.length;
  const totalCount = gameState.totalPlayers;
  const eliminatedCount = gameState.eliminated.length;
  const currentRound = gameState.currentRound;

  return (
    <section className="cpl-card p-5 sm:p-6">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="cpl-display text-lg text-white">En lice</h3>
          <p className="text-xs text-[color:var(--cpl-text-muted)]">
            {aliveCount} joueur{aliveCount > 1 ? "s" : ""} survivant{aliveCount > 1 ? "s" : ""} sur {totalCount}
          </p>
        </div>
        <div className="text-right">
          <div className="cpl-wordmark text-xl">
            {aliveCount}/{totalCount}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--cpl-text-dim)]">
            Manche {currentRound}
          </div>
        </div>
      </header>

      {visibleAlive.length === 0 ? (
        <p className="text-sm text-[color:var(--cpl-text-muted)]">
          {eliminatedCount > 0 ? "Tous les joueurs ont été éliminés." : "En attente des participants..."}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {visibleAlive.map((p, i) => (
            <Pod
              key={p.id}
              participant={p}
              rank={i + 1}
              highlight={p.id === highlightParticipantId}
              variant={p.id === leaderId ? "leader" : "alive"}
            />
          ))}
        </div>
      )}

      {gameState.alive.length > visibleAlive.length && (
        <p className="mt-3 text-xs text-[color:var(--cpl-text-dim)]">
          +{gameState.alive.length - visibleAlive.length} autres joueurs en lice…
        </p>
      )}

      {recentEliminated.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-xs uppercase tracking-widest text-[color:var(--cpl-text-dim)]">
            Éliminés
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {recentEliminated.map((p) => (
              <Pod key={p.id} participant={p} variant="eliminated" />
            ))}
          </div>
          {gameState.eliminated.length > recentEliminated.length && (
            <p className="mt-2 text-xs text-[color:var(--cpl-text-dim)]">
              +{gameState.eliminated.length - recentEliminated.length} autres éliminés
            </p>
          )}
        </div>
      )}
    </section>
  );
}