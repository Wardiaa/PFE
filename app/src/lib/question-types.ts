// question-types.ts - COMPLETE WITH ALL TYPES AVAILABLE
import { 
  CheckSquare, 
  AlignLeft, 
  BarChart2, 
  Star, 
  Image as ImageIcon,
  Type,
  List,
  Trophy,
  HelpCircle,
  Cloud,
  MessageSquare
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
} as const;

// Mapping for UI-friendly IDs
export const UI_QUESTION_TYPES = {
  'multiple-choice': QUESTION_TYPES.SINGLE_CHOICE,
  'open-text': QUESTION_TYPES.OPEN_TEXT,
  'word-cloud': QUESTION_TYPES.WORD_CLOUD,
  'rating-scale': QUESTION_TYPES.RATING,
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
  }
];

export const getDefaultQuestion = (type: string, id: string) => {
  // Handle both UI IDs and constant IDs
  let actualType = type;
  
  // Map UI IDs to constant IDs if needed
  if (type === 'multiple-choice') actualType = QUESTION_TYPES.SINGLE_CHOICE;
  if (type === 'open-text') actualType = QUESTION_TYPES.OPEN_TEXT;
  if (type === 'word-cloud') actualType = QUESTION_TYPES.WORD_CLOUD;
  if (type === 'rating-scale') actualType = QUESTION_TYPES.RATING;

  const base = {
    id,
    type: actualType, // Store the actual type constant
    uiType: type, // Also store the UI type for display
    title: type === 'multiple-choice' ? "New Multiple Choice Question" :
           type === 'open-text' ? "New Open Text Question" :
           type === 'word-cloud' ? "New Word Cloud Question" :
           type === 'rating-scale' ? "New Rating Scale Question" : "New Question",
    description: "",
    points: type === 'word-cloud' ? 5 : 
            type === 'rating-scale' ? 10 :
            type === 'open-text' ? 10 : 10,
    timeLimit: type === 'word-cloud' ? 30 :
               type === 'open-text' ? 60 : 30,
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
    default:
      return {
        ...base,
        options: [],
      };
  }
};