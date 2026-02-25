export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  isVisible: boolean;
  id: string;
  type: string;
  title: string;
  description?: string;
  points: number;
  timeLimit: number;
  options?: QuestionOption[];
  locked?: boolean;
  uiType?: string;
}

export interface ContextData {
  title: string;
  description: string;
  theme: string;
  category: string;
  tags: string[];
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
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'REORDER_QUESTIONS'; payload: Question[] };