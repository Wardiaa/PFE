// WinnerCelebration.tsx
import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { Crown, PartyPopper, Trophy } from "lucide-react";
import type { Participant } from "../../../lib/presentation.types";

interface Props {
  winner: Participant;
  isWinnerMe: boolean;
}

export function WinnerCelebration({ winner, isWinnerMe }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (!isWinnerMe || fired.current) return;
    fired.current = true;

    // Big burst at the start
    confetti({
      particleCount: 300,
      spread: 130,
      origin: { y: 0.5 },
      colors: ["#00D9FF", "#FF1B6B", "#FFD24A", "#22EE88", "#FFFFFF"],
      startVelocity: 25,
      scalar: 1.2,
    });

    // Continuous celebration
    const duration = 8000;
    const end = Date.now() + duration;
    const colors = ["#00D9FF", "#FF1B6B", "#FFD24A", "#22EE88", "#FFFFFF"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 45,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 45,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, [isWinnerMe]);

  return (
    <div className="cpl-theme min-h-screen flex items-center justify-center px-4 py-12">
      <div className="cpl-card cpl-winner-card w-full max-w-xl p-8 sm:p-12 text-center animate-in zoom-in-95 duration-500">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-[color:var(--cpl-gold)]/20 p-4 animate-bounce">
            {isWinnerMe ? (
              <Trophy className="h-12 w-12 text-[color:var(--cpl-gold)]" />
            ) : (
              <Crown className="h-12 w-12 text-[color:var(--cpl-gold)]" />
            )}
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--cpl-text-muted)]">
          {isWinnerMe ? "🎉 VOUS AVEZ GAGNÉ ! 🎉" : "🏆 LE GAGNANT EST 🏆"}
        </p>

        <h1
          className="cpl-display mt-3 text-4xl sm:text-6xl"
          style={{
            color: "var(--cpl-gold)",
            textShadow: "0 0 24px rgba(255, 210, 74, 0.6)",
          }}
        >
          {winner.name}
        </h1>

        <p className="mt-4 text-lg text-white font-semibold">
          {winner.score} points
        </p>

        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[color:var(--cpl-gold)]/40 bg-[color:var(--cpl-gold)]/10 px-5 py-2 text-sm font-semibold text-[color:var(--cpl-gold)]">
          {isWinnerMe ? (
            <>
              <PartyPopper className="h-4 w-4" />
              Bravo, vous êtes le grand gagnant !
              <PartyPopper className="h-4 w-4" />
            </>
          ) : (
            <>
              <Crown className="h-4 w-4" />
              Félicitations au grand gagnant !
            </>
          )}
        </div>

        <p className="mt-8 text-xs text-[color:var(--cpl-text-dim)]">
          {isWinnerMe
            ? "Vous avez survécu jusqu'à la fin et mérité votre victoire !"
            : "Merci à tous les participants pour cette belle partie !"}
        </p>
      </div>
    </div>
  );
}