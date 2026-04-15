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
  displayStyle?: 'numbers' | 'stars' | 'hearts' | 'smileys';
  questionSettings?: QuestionSettings;
  theme?: string;
  font?: string;
  background?: string;
  animation?: string;
  showResultsInstantly?: boolean;
}

export interface ContextData {
  title: string;
  description: string;
  theme: string;
  category: string;
  tags: string[];
  coverImage?: string | null;
  questions: Question[];
  settings: any;
}

export type HistoryAction =
    | { type: 'SET_QUESTIONS'; payload: Question[] }
    | { type: 'SET_TITLE'; payload: string }
    | { type: 'SET_DESCRIPTION'; payload: string }
    | { type: 'SET_THEME'; payload: string }
    | { type: 'SET_SETTINGS'; payload: any }
    | { type: 'SET_CATEGORY'; payload: string }
    | { type: 'SET_TAGS'; payload: string[] }
    | { type: 'SET_COVER_IMAGE'; payload: string | null }
    | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
    | { type: 'ADD_QUESTION'; payload: Question }
    | { type: 'DELETE_QUESTION'; payload: string }
    | { type: 'REORDER_QUESTIONS'; payload: Question[] };
  