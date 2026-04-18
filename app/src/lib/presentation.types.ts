export type QuestionType =
  | "multiple-choice"
  | "rating"
  | "open-text"
  | "word-cloud";

export type DisplayStyle = "numbers" | "stars" | "hearts" | "smileys";

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
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
}

export interface Presentation {
  id: string;
  title: string;
  questions: Question[];
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
}

export interface Participant {
  id: string;
  name: string;
  score: number;
  avatar?: string;
  isAnonymous?: boolean;
  joinedAt: Date;
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
  [optionId: string]: number;
  individualResponses?: IndividualChoiceResponse[];
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