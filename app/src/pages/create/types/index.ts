// builder/types/index.ts — Updated to include statements (Scaling) and ranking items support.
// MODE SELECTION UPDATE: Added maxSkipsPerParticipant to ContextData, skipAllowed to Question
// SPEED QUESTION UPDATE: Added isSpeedQuestion, speedMaxAdvance to Question

import type { GameMode } from "../../../lib/presentation.types";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  imageUrl?: string | null;
}

export interface Scale {
  min: number;
  max: number;
}

export interface Labels {
  min?: string;
  max?: string;
}

export interface QuestionSettings {
  liveChat?: boolean;
  qaEnabled?: boolean;
  showReactions?: boolean;
  theme?: string;
  font?: string;
  background?: string;
  animation?: string;
}

/** A single scaling statement. */
export interface ScalingStatement {
  id: string;
  text: string;
}

export interface Question {
  text: string;
  id: string;
  type: string;
  title: string;
  description?: string;
  points: number;
  timeLimit: number | null;
  options?: QuestionOption[];
  locked?: boolean;
  uiType?: string;
  isVisible: boolean;
  imageUrl?: string | null;
  scale?: Scale;
  labels?: Labels;
  displayStyle?: "numbers" | "stars" | "hearts" | "smileys";
  questionSettings?: QuestionSettings;
  theme?: string;
  font?: string;
  background?: string;
  animation?: string;
  showResultsInstantly?: boolean;
  hideParticipantNames?: boolean;
  /** Used by Scaling questions — list of statements to rate. */
  statements?: ScalingStatement[];
  /** Whether participants can skip this question (elimination mode only) */
  skipAllowed?: boolean;
  /** NEW: Whether this is a speed question (elimination mode only) */
  isSpeedQuestion?: boolean;
  /** NEW: Max number of participants who can advance (only for speed questions) */
  speedMaxAdvance?: number;
}

export interface ContextData {
  id?: string;
  title: string;
  description: string;
  theme: string;
  category: string;
  tags: string[];
  coverImage?: string | null;
  questions: Question[];
  settings: any;
  gameMode?: GameMode;
  themeId?: SessionThemeId;
  maxSkipsPerParticipant?: number;
  /** NEW: Final round decision timer in seconds */
  finalRoundDecisionTimer?: number;
}

export type HistoryAction =
  | { type: "SET_QUESTIONS"; payload: Question[] }
  | { type: "SET_TITLE"; payload: string }
  | { type: "SET_DESCRIPTION"; payload: string }
  | { type: "SET_THEME"; payload: string }
  | { type: "SET_SETTINGS"; payload: any }
  | { type: "SET_CATEGORY"; payload: string }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "SET_COVER_IMAGE"; payload: string | null }
  | { type: "SET_GAME_MODE"; payload: GameMode }
  | { type: "SET_THEME_ID"; payload: SessionThemeId }
  | { type: "SET_MAX_SKIPS"; payload: number }
  | { type: "SET_FINAL_ROUND_TIMER"; payload: number }
  | {
      type: "UPDATE_QUESTION";
      payload: { id: string; updates: Partial<Question> };
    }
  | { type: "ADD_QUESTION"; payload: Question }
  | { type: "DELETE_QUESTION"; payload: string }
  | { type: "REORDER_QUESTIONS"; payload: Question[] };

// ============================================================================
// New type: visual theme identifier for sessions
// ============================================================================
export type SessionThemeId = "default" | "cent-pour-cent-logique" | string;

// ============================================================================
// Helpers to safely read gameMode and themeId from a Supabase context row
// ============================================================================
export const getGameMode = (
  ctx: { game_mode?: string | null } | null | undefined,
): GameMode =>
  (ctx?.game_mode as GameMode) === "elimination" ? "elimination" : "standard";

export const getThemeId = (
  ctx: { theme_id?: string | null; settings?: any } | null | undefined,
): SessionThemeId =>
  ctx?.theme_id ?? ctx?.settings?.theme ?? "default";