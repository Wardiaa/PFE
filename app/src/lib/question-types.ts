// question-types.ts - UPDATED WITH COMING SOON TYPES
import { 
  CheckSquare, 
  AlignLeft, 
  BarChart2, 
  Star, 
  Image as ImageIcon,
  Type,
  List,
  Trophy
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

export const QUESTION_TYPE_DETAILS = [
  {
    id: QUESTION_TYPES.SINGLE_CHOICE,
    name: "Multiple Choice",
    icon: CheckSquare,
    color: "text-blue-500 bg-blue-50",
    description: "Participants choose one correct answer",
    available: true
  },
  {
    id: QUESTION_TYPES.MULTIPLE_CHOICE,
    name: "Multi-Select",
    icon: List,
    color: "text-purple-500 bg-purple-50",
    description: "Participants choose all correct answers",
    available: true
  },
  {
    id: QUESTION_TYPES.TRUE_FALSE,
    name: "True or False",
    icon: Trophy,
    color: "text-green-500 bg-green-50",
    description: "Simple binary choice question",
    available: true
  },
  {
    id: QUESTION_TYPES.OPEN_TEXT,
    name: "Open Ended",
    icon: AlignLeft,
    color: "text-orange-500 bg-orange-50",
    description: "Participants type their own answer",
    available: true
  },
  {
    id: QUESTION_TYPES.POLL,
    name: "Poll",
    icon: BarChart2,
    color: "text-cyan-500 bg-cyan-50",
    description: "Gather opinions, no correct answer",
    available: true
  },
  {
    id: QUESTION_TYPES.RATING,
    name: "Rating",
    icon: Star,
    color: "text-yellow-500 bg-yellow-50",
    description: "Rate on a scale of stars or numbers",
    available: false,
    comingSoon: true
  },
  {
    id: QUESTION_TYPES.IMAGE_CHOICE,
    name: "Image Choice",
    icon: ImageIcon,
    color: "text-pink-500 bg-pink-50",
    description: "Use images as answer options",
    available: false,
    comingSoon: true
  },
  {
    id: QUESTION_TYPES.WORD_CLOUD,
    name: "Word Cloud",
    icon: Type,
    color: "text-indigo-500 bg-indigo-50",
    description: "Visualize popular text answers",
    available: false,
    comingSoon: true
  }
];

export const getDefaultQuestion = (type: string, id: string) => {
  const base = {
    id,
    type,
    title: "New Question",
    points: 100,
    timeLimit: 30,
  };

  switch (type) {
    case QUESTION_TYPES.SINGLE_CHOICE:
    case QUESTION_TYPES.MULTIPLE_CHOICE:
      return {
        ...base,
        options: [
          { id: "1", text: "Option 1", isCorrect: false },
          { id: "2", text: "Option 2", isCorrect: true },
          { id: "3", text: "Option 3", isCorrect: false },
          { id: "4", text: "Option 4", isCorrect: false },
        ],
      };
    case QUESTION_TYPES.TRUE_FALSE:
      return {
        ...base,
        options: [
          { id: "1", text: "True", isCorrect: true },
          { id: "2", text: "False", isCorrect: false },
        ],
      };
    case QUESTION_TYPES.POLL:
      return {
        ...base,
        title: "What is your opinion?",
        options: [
          { id: "1", text: "Strongly Agree", isCorrect: false },
          { id: "2", text: "Agree", isCorrect: false },
          { id: "3", text: "Neutral", isCorrect: false },
          { id: "4", text: "Disagree", isCorrect: false },
          { id: "5", text: "Strongly Disagree", isCorrect: false },
        ],
        points: 0,
      };
    case QUESTION_TYPES.RATING:
      return {
        ...base,
        title: "How would you rate this?",
        maxRating: 5,
        ratingLabels: ["Poor", "Fair", "Good", "Very Good", "Excellent"],
        points: 0,
      };
    case QUESTION_TYPES.WORD_CLOUD:
      return {
        ...base,
        title: "What comes to mind?",
        maxWords: 3,
        points: 50,
      };
    default:
      return {
        ...base,
        options: [],
      };
  }
};