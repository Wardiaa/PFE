// presentation.types.ts — Updated to include SCALING, RANKING, GRID_2X2, and VOTE question types.
// SKIP BUTTON UPDATE: Added skipAllowed to Question interface
// SPEED QUESTION UPDATE: Added isSpeedQuestion, speedMaxAdvance to Question, choseContinue to Participant

export type QuestionType =
  | "multiple-choice"
  | "rating"
  | "open-text"
  | "word-cloud"
  | "scaling"
  | "ranking"
  | "grid-2x2"
  | "vote";

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

/** Axis configuration for Grid 2x2 questions */
export interface GridAxis {
  label: string;
  minLabel: string;
  maxLabel: string;
}

/** A single statement inside a Scaling question. */
export interface ScalingStatement {
  id: string;
  text: string;
}

/** A single item inside a Ranking question. */
export interface RankingItem {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  text: string;
  description?: string;
  timeLimit?: number;
  options?: QuestionOption[];
  /** Used by Scaling questions — list of statements to rate. */
  statements?: ScalingStatement[];
  /** Used by Ranking questions — list of items to rank. Stored in options field. */
  rankingItems?: RankingItem[];
  scale?: Scale;
  labels?: Labels;
  points?: number;
  image?: string;
  displayStyle?: DisplayStyle;
  showResultsInstantly?: boolean;
  hideParticipantNames?: boolean;
  /** Grid 2x2 specific: X-axis configuration */
  xAxis?: GridAxis;
  /** Grid 2x2 specific: Y-axis configuration */
  yAxis?: GridAxis;

  /** optional explanation revealed after the round (for elimination mode). */
  explanation?: string;

  /** per-question override; defaults to the session's gameMode. */
  gameMode?: GameMode;
  
  /** whether participants can skip this question (elimination mode only) */
  skipAllowed?: boolean;
  
  /** whether this is a speed question (elimination mode only) */
  isSpeedQuestion?: boolean;
  
  /** max number of participants who can advance (only for speed questions) */
  speedMaxAdvance?: number;
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
  /** number of skips used by this participant */
  skipsUsed?: number;
  /** whether participant chose to continue in final round (NULL = no decision yet) */
  choseContinue?: boolean | null;
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

/** A single participant's answer for one statement in a Scaling question. */
export interface IndividualScalingResponse {
  statementId: string;
  value: number | null; // null = skipped
  participantName?: string;
  timestamp: Date;
}

/** A single participant's ranking answer. */
export interface IndividualRankingResponse {
  rankingOrder: string[]; // itemIds ordered from rank 1 to last
  participantName?: string;
  timestamp: Date;
}

/** A single placement for Grid 2x2 questions */
export interface GridPlacement {
  x: number; // 0-100
  y: number; // 0-100
}

/** A single participant's grid answer */
export interface IndividualGridResponse {
  placements: Record<string, GridPlacement>; // itemId -> placement
  participantName?: string;
  timestamp: Date;
}

/** A single participant's vote answer */
export interface IndividualVoteResponse {
  optionId: string;
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

/** Per-statement aggregated result inside ScalingResponses. */
export interface ScalingStatementResult {
  /** How many people chose each value: { 1: 3, 2: 5, 3: 12, 4: 8, 5: 2 } */
  distribution: Record<number, number>;
  average: string;
  total: number;
}

/** Aggregated responses for a Scaling question. */
export interface ScalingResponses {
  /** Keyed by statement id. */
  statements: Record<string, ScalingStatementResult>;
  /** Total number of respondents (may differ per statement if skip is used). */
  total: number;
  individualResponses?: IndividualScalingResponse[];
}

/** Per-item aggregated result inside RankingResponses. */
export interface RankingItemResult {
  /**
   * Borda count score: each participant awards (N - position) points to each item.
   * Higher score = more often ranked first.
   */
  bordaScore: number;
  /** How many times this item was placed at each rank position. { 1: 5, 2: 3, ... } */
  rankDistribution: Record<number, number>;
  /** Total number of responses that included this item. */
  total: number;
}

/** Aggregated responses for a Ranking question. */
export interface RankingResponses {
  /** Keyed by item id (matches options[].id). */
  items: Record<string, RankingItemResult>;
  /** Total number of respondents. */
  total: number;
  individualResponses?: IndividualRankingResponse[];
}

/** Aggregated responses for a Grid 2x2 question. */
export interface Grid2x2Responses {
  /** Total number of respondents */
  totalResponses: number;
  /** Individual participant submissions */
  individualResponses?: IndividualGridResponse[];
  /** For each item, aggregated placement data */
  itemPlacements?: Record<string, { placements: GridPlacement[]; centroid: GridPlacement }>;
}

/** Aggregated responses for a Vote question. */
export type VoteResponses = {
  total?: number;
  individualResponses?: IndividualVoteResponse[];
} & {
  [optionId: string]: number | IndividualVoteResponse[] | undefined;
};

export type QuestionResponses =
  | MultipleChoiceResponses
  | RatingResponses
  | OpenTextResponses
  | WordCloudResponses
  | ScalingResponses
  | RankingResponses
  | Grid2x2Responses
  | VoteResponses;

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
  | { type: "ANSWER_RECEIVED"; payload: { participantId: string; questionId: string; correct: boolean } }
  | { type: "FINAL_ROUND_DECISION"; payload: { decisionTimer: number } }
  | { type: "FINAL_ROUND_DECISION_RESPONSE"; payload: { participantId: string; choseContinue: boolean } }
  | { type: "FINAL_ROUND_START"; payload: { questionId: string; timeLimit: number } }
  | { type: "FINAL_ROUND_RESULTS"; payload: { winner: Participant | null } };