// presentation.types.ts — UPDATED for 100% Logique elimination mode.
// Adds GameMode + per-participant elimination state + new event payload types.
// Existing fields are unchanged so non-elimination sessions keep working.

export type QuestionType =
  | "multiple-choice"
  | "rating"
  | "open-text"
  | "word-cloud";

export type DisplayStyle = "numbers" | "stars" | "hearts" | "smileys";

/** session-level game mode flag. */
export type GameMode = "standard" | "elimination";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
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

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  description?: string;
  timeLimit?: number;
  options?: QuestionOption[];
  scale?: Scale;
  labels?: Labels;
  points?: number;
  image?: string;
  displayStyle?: DisplayStyle;
  showResultsInstantly?: boolean;
  hideParticipantNames?: boolean;

  /** optional explanation revealed after the round (for elimination mode). */
  explanation?: string;

  /** per-question override; defaults to the session's gameMode. */
  gameMode?: GameMode;
}

export interface Presentation {
  id: string;
  title: string;
  questions: Question[];

  /** surfaced from contexts.game_mode. */
  gameMode?: GameMode;

  /** optional theme id (e.g. "cent-pour-cent-logique"). */
  themeId?: string;
}

export interface Session {
  id: string;
  code: string;
  participantCount: number;
  startTime: Date;
  presentation: Presentation;
  status: "WAITING" | "ACTIVE" | "PAUSED" | "ENDED";
  currentQuestionIndex: number;
  currentQuestionId?: string;
  currentQuestionStartedAt?: Date;

  /** derived from the context, mirrored on the session for convenience. */
  gameMode?: GameMode;
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  avatar?: string;
  isAnonymous?: boolean;
  joinedAt: Date;

  /** elimination state. */
  isAlive?: boolean;
  eliminatedAtRound?: number | null;
  eliminatedAtQuestionId?: string | null;
}

export interface IndividualChoiceResponse {
  optionId: string;
  participantName?: string;
  timestamp: Date;
}

export interface IndividualRatingResponse {
  rating: number;
  participantName?: string;
  timestamp: Date;
}

export interface IndividualWordResponse {
  words: string[];
  participantName?: string;
  timestamp: Date;
}

export interface WordCloudWord {
  text: string;
  count: number;
  color?: string;
}

export interface MultipleChoiceResponses {
  individualResponses?: IndividualChoiceResponse[];
  [optionId: string]: number | IndividualChoiceResponse[] | undefined;
}

export interface RatingResponses {
  [rating: number]: number;
  average?: string;
  total?: number;
  individualRatings?: IndividualRatingResponse[];
}

export interface OpenTextResponses {
  count: number;
  recent?: Array<{
    text: string;
    timestamp: Date;
    participantName?: string;
  }>;
}

export interface WordCloudResponses {
  uniqueWords: number;
  words: WordCloudWord[];
  individualWords?: IndividualWordResponse[];
}

export type QuestionResponses =
  | MultipleChoiceResponses
  | RatingResponses
  | OpenTextResponses
  | WordCloudResponses;

/* ============================================================================
 * Elimination / game-show types
 * ========================================================================== */

export interface EliminationEvent {
  participantId: string;
  participantName: string;
  questionId: string;
  roundNumber: number;
  eliminatedAt: Date;
}

export interface GameState {
  alive: Participant[];
  eliminated: Participant[];
  winner?: Participant | null;
  totalPlayers: number;
  currentRound: number;
  history: EliminationEvent[];
}

/* Real-time broadcast payload helpers ----------------------------------- */

export type GameSocketMessage =
  | { type: "PLAYER_ELIMINATED"; payload: EliminationEvent }
  | { type: "GAME_STATE_UPDATE"; payload: GameState }
  | { type: "GAME_END"; payload: { winner: Participant | null } }
  | { type: "ANSWER_RECEIVED"; payload: { participantId: string; questionId: string; correct: boolean } };