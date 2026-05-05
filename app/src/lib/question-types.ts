// question-types.ts — COMPLETE WITH ALL TYPES (includes SCALING + RANKING)
import {
  CheckSquare,
  AlignLeft,
  BarChart2,
  Star,
  Image as ImageIcon,
  List,
  Trophy,
  Cloud,
  SlidersHorizontal,
  ArrowUpDown,
} from "lucide-react";

export const QUESTION_TYPES = {
  SINGLE_CHOICE: "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE",
  OPEN_TEXT: "OPEN_TEXT",
  POLL: "POLL",
  RATING: "RATING",
  IMAGE_CHOICE: "IMAGE_CHOICE",
  WORD_CLOUD: "WORD_CLOUD",
  SCALING: "SCALING",
  RANKING: "RANKING",
} as const;

// Mapping for UI-friendly IDs
export const UI_QUESTION_TYPES = {
  'multiple-choice': QUESTION_TYPES.SINGLE_CHOICE,
  'open-text': QUESTION_TYPES.OPEN_TEXT,
  'word-cloud': QUESTION_TYPES.WORD_CLOUD,
  'rating-scale': QUESTION_TYPES.RATING,
  'scales': QUESTION_TYPES.SCALING,
  'ranking': QUESTION_TYPES.RANKING,
} as const;

export const QUESTION_TYPE_DETAILS = [
  {
    id: QUESTION_TYPES.SINGLE_CHOICE,
    name: "Multiple Choice",
    icon: CheckSquare,
    color: "text-blue-500 bg-blue-50",
    description: "Participants choose one correct answer",
    available: true,
    uiId: 'multiple-choice'
  },
  {
    id: QUESTION_TYPES.MULTIPLE_CHOICE,
    name: "Multi-Select",
    icon: List,
    color: "text-purple-500 bg-purple-50",
    description: "Participants choose all correct answers",
    available: true,
    uiId: 'multiple-choice'
  },
  {
    id: QUESTION_TYPES.TRUE_FALSE,
    name: "True or False",
    icon: Trophy,
    color: "text-green-500 bg-green-50",
    description: "Simple binary choice question",
    available: true,
    uiId: 'multiple-choice'
  },
  {
    id: QUESTION_TYPES.OPEN_TEXT,
    name: "Open Ended",
    icon: AlignLeft,
    color: "text-orange-500 bg-orange-50",
    description: "Participants type their own answer",
    available: true,
    uiId: 'open-text'
  },
  {
    id: QUESTION_TYPES.POLL,
    name: "Poll",
    icon: BarChart2,
    color: "text-cyan-500 bg-cyan-50",
    description: "Gather opinions, no correct answer",
    available: true,
    uiId: 'multiple-choice'
  },
  {
    id: QUESTION_TYPES.RATING,
    name: "Rating",
    icon: Star,
    color: "text-yellow-500 bg-yellow-50",
    description: "Rate on a scale of stars or numbers",
    available: true,
    comingSoon: false,
    uiId: 'rating-scale'
  },
  {
    id: QUESTION_TYPES.IMAGE_CHOICE,
    name: "Image Choice",
    icon: ImageIcon,
    color: "text-pink-500 bg-pink-50",
    description: "Use images as answer options",
    available: false,
    comingSoon: true,
    uiId: 'multiple-choice'
  },
  {
    id: QUESTION_TYPES.WORD_CLOUD,
    name: "Word Cloud",
    icon: Cloud,
    color: "text-indigo-500 bg-indigo-50",
    description: "Visualize popular text answers",
    available: true,
    comingSoon: false,
    uiId: 'word-cloud'
  },
  {
    id: QUESTION_TYPES.SCALING,
    name: "Scales",
    icon: SlidersHorizontal,
    color: "text-teal-500 bg-teal-50",
    description: "Rate multiple statements on a scale",
    available: true,
    comingSoon: false,
    uiId: 'scales'
  },
  {
    id: QUESTION_TYPES.RANKING,
    name: "Ranking",
    icon: ArrowUpDown,
    color: "text-violet-500 bg-violet-50",
    description: "Drag items into your preferred order",
    available: true,
    comingSoon: false,
    uiId: 'ranking'
  },
];

export const getDefaultQuestion = (type: string, id: string) => {
  // Handle both UI IDs and constant IDs
  let actualType = type;

  // Map UI IDs to constant IDs if needed
  if (type === 'multiple-choice') actualType = QUESTION_TYPES.SINGLE_CHOICE;
  if (type === 'open-text') actualType = QUESTION_TYPES.OPEN_TEXT;
  if (type === 'word-cloud') actualType = QUESTION_TYPES.WORD_CLOUD;
  if (type === 'rating-scale') actualType = QUESTION_TYPES.RATING;
  if (type === 'scales') actualType = QUESTION_TYPES.SCALING;
  if (type === 'ranking') actualType = QUESTION_TYPES.RANKING;

  const base = {
    id,
    type: actualType,
    uiType: type,
    title: type === 'multiple-choice' ? "New Multiple Choice Question" :
           type === 'open-text' ? "New Open Text Question" :
           type === 'word-cloud' ? "New Word Cloud Question" :
           type === 'rating-scale' ? "New Rating Scale Question" :
           type === 'scales' ? "Rate the following statements" :
           type === 'ranking' ? "Rank the following items" : "New Question",
    description: "",
    points: type === 'word-cloud' ? 5 :
            type === 'rating-scale' ? 10 :
            type === 'open-text' ? 10 :
            type === 'scales' ? 0 :
            type === 'ranking' ? 0 : 10,
    timeLimit: type === 'word-cloud' ? 30 :
               type === 'open-text' ? 60 :
               type === 'scales' ? 60 :
               type === 'ranking' ? 60 : 30,
    isVisible: true,
    locked: false,
  };

  switch (actualType) {
    case QUESTION_TYPES.SINGLE_CHOICE:
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return {
        ...base,
        options: [
          { id: `${id}-1`, text: "Option 1", isCorrect: false },
          { id: `${id}-2`, text: "Option 2", isCorrect: true },
          { id: `${id}-3`, text: "Option 3", isCorrect: false },
          { id: `${id}-4`, text: "Option 4", isCorrect: false },
        ],
      };
    case QUESTION_TYPES.TRUE_FALSE:
      return {
        ...base,
        options: [
          { id: `${id}-1`, text: "True", isCorrect: true },
          { id: `${id}-2`, text: "False", isCorrect: false },
        ],
      };
    case QUESTION_TYPES.POLL:
      return {
        ...base,
        title: "What is your opinion?",
        options: [
          { id: `${id}-1`, text: "Strongly Agree", isCorrect: false },
          { id: `${id}-2`, text: "Agree", isCorrect: false },
          { id: `${id}-3`, text: "Neutral", isCorrect: false },
          { id: `${id}-4`, text: "Disagree", isCorrect: false },
          { id: `${id}-5`, text: "Strongly Disagree", isCorrect: false },
        ],
        points: 0,
      };
    case QUESTION_TYPES.RATING:
      return {
        ...base,
        title: "How would you rate this?",
        description: "Rate from 1 to 5",
        points: 10,
        timeLimit: 30,
        options: [
          { id: `${id}-1`, text: "1 - Poor", isCorrect: false },
          { id: `${id}-2`, text: "2 - Fair", isCorrect: false },
          { id: `${id}-3`, text: "3 - Good", isCorrect: false },
          { id: `${id}-4`, text: "4 - Very Good", isCorrect: false },
          { id: `${id}-5`, text: "5 - Excellent", isCorrect: false }
        ],
      };
    case QUESTION_TYPES.WORD_CLOUD:
      return {
        ...base,
        title: "What comes to mind?",
        description: "Enter a word or phrase",
        points: 5,
        timeLimit: 30,
      };
    case QUESTION_TYPES.OPEN_TEXT:
      return {
        ...base,
        title: "New Open Text Question",
        description: "Type your answer in the space below",
        points: 10,
        timeLimit: 60,
      };
    case QUESTION_TYPES.SCALING:
      return {
        ...base,
        title: "Rate the following statements",
        description: "Move the sliders to express how much you agree with each statement",
        points: 0,
        timeLimit: 60,
        statements: [
          { id: `${id}-s1`, text: "Statement 1" },
          { id: `${id}-s2`, text: "Statement 2" },
          { id: `${id}-s3`, text: "Statement 3" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Strongly disagree", max: "Strongly agree" },
      };
    case QUESTION_TYPES.RANKING:
      return {
        ...base,
        title: "Rank the following items",
        description: "Drag the items to rank them from most to least important",
        points: 0,
        timeLimit: 60,
        // Ranking items stored in options field (reusing existing DB column)
        options: [
          { id: `${id}-r1`, text: "Item 1", isCorrect: false },
          { id: `${id}-r2`, text: "Item 2", isCorrect: false },
          { id: `${id}-r3`, text: "Item 3", isCorrect: false },
          { id: `${id}-r4`, text: "Item 4", isCorrect: false },
        ],
      };
    default:
      return {
        ...base,
        options: [],
      };
  }
};
