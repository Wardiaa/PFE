export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean; // Add for quiz functionality
}

export interface BaseQuestion {
  id: string;
  number: number;
  type: 'multiple-choice' | 'rating' | 'open-text' | 'word-cloud';
  text: string;
  description?: string;
  timeLimit?: number; // Add timeLimit in seconds
  media?: string; // Add optional media URL
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  options: QuestionOption[];
}

export interface RatingQuestion extends BaseQuestion {
  type: 'rating';
  options?: never;
}

export interface OpenTextQuestion extends BaseQuestion {
  type: 'open-text';
  options?: never;
}

export interface WordCloudQuestion extends BaseQuestion {
  type: 'word-cloud';
  options?: never;
}

export type Question = MultipleChoiceQuestion | RatingQuestion | OpenTextQuestion | WordCloudQuestion;

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
}

export interface MultipleChoiceResponses {
  [optionId: string]: number;
}

export interface RatingResponses {
  total: number;
  average: string;
  [key: string]: number | string; // Allow both number and string types for other properties
}

export interface OpenTextResponse {
  text: string;
  timestamp: Date;
}

export interface OpenTextResponses {
  count: number;
  recent: OpenTextResponse[];
}

export interface WordCloudWord {
  text: string;
  count: number;
  color?: string;
}

export interface WordCloudResponses {
  uniqueWords: number;
  words: WordCloudWord[];
}

export type QuestionResponses = 
  | MultipleChoiceResponses 
  | RatingResponses 
  | OpenTextResponses 
  | WordCloudResponses;

export interface Participant {
  id: string;
  name: string;
  score: number;
  avatar?: string;
}

// Context type for the old host session
export interface Context {
  id: string;
  code: string;
  title: string;
  questions: (BaseQuestion & { options?: QuestionOption[] })[];
}