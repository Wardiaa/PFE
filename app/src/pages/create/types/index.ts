// builder/types/index.ts
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
}

export interface ContextData {
  id?: string;                     // optional, for existing contexts
  title: string;
  description: string;             // kept as required (existing behaviour)
  theme: string;
  category: string;
  tags: string[];
  coverImage?: string | null;
  questions: Question[];
  settings: any;

  // NEW: elimination mode & visual theme for live session
  gameMode?: GameMode;             // "standard" | "elimination"
  themeId?: SessionThemeId;        // e.g. "default" | "cent-pour-cent-logique"
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
  // ── NEW: 100% Logique support ────────────────────────────────────────────
  | { type: "SET_GAME_MODE"; payload: GameMode }
  | { type: "SET_THEME_ID"; payload: SessionThemeId }
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
