// themes/cent-pour-cent-logique.theme.ts
// Visual tokens for the 100% Logique session theme.
// Echoes the TF1 stage: deep navy → indigo → magenta, electric cyan accents,
// neon glow, dramatic typography.

export const centPourCentLogiqueTheme = {
  id: "cent-pour-cent-logique",
  name: "100% Logique",
  description: "Ambiance plateau TV — bleu nuit, néons cyan, lumière dramatique.",

  // Token palette — also exposed as CSS variables in the .css file.
  colors: {
    bgGradient:
      "linear-gradient(160deg, #050b1f 0%, #0d1949 35%, #1f0f4a 70%, #3a0d5e 100%)",
    bgSolid: "#050b1f",
    surface: "rgba(13, 25, 73, 0.65)",
    surfaceBorder: "rgba(0, 217, 255, 0.18)",

    primary: "#00D9FF", // electric cyan — main wordmark + CTAs
    primaryGlow: "rgba(0, 217, 255, 0.55)",

    accent: "#FF1B6B", // hot pink — used sparingly (alerts, eliminations)
    accentGlow: "rgba(255, 27, 107, 0.55)",

    success: "#22EE88", // alive / correct
    successGlow: "rgba(34, 238, 136, 0.55)",
    danger: "#FF3344", // eliminated / wrong
    dangerGlow: "rgba(255, 51, 68, 0.55)",
    gold: "#FFD24A", // winner crown / podium

    textPrimary: "#FFFFFF",
    textMuted: "#9AA8D6",
    textDim: "#5C6A9A",
  },

  fonts: {
    display: '"Space Grotesk", "Inter", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif',
  },

  effects: {
    neonGlow: "0 0 18px var(--cpl-primary-glow), 0 0 42px var(--cpl-primary-glow)",
    softGlow: "0 0 24px rgba(0, 217, 255, 0.25)",
    dangerPulse: "0 0 28px var(--cpl-danger-glow)",
    successPulse: "0 0 28px var(--cpl-success-glow)",
  },

  motion: {
    eliminationStampDurationMs: 900,
    correctPulseDurationMs: 600,
    leaderboardEnterMs: 350,
    spotlightSweepMs: 12000,
  },

  // Helper to apply the theme to a session container element.
  rootClass: "cpl-theme",
};

export type CentPourCentLogiqueTheme = typeof centPourCentLogiqueTheme;
