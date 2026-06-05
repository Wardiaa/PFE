// lib/templates.ts
import { huntArenaTemplate } from "./templates/hunt-arena";
import {
  Trophy,
  BarChart3,
  ThumbsUp,
  Gamepad2,
  Star,
  FileText,
  Snowflake,
  Palette,
  Sparkles,
  TrendingUp,
  Grid,
  GraduationCap,
  Briefcase,
  Users as UsersIcon,
  BookOpen,
  ListChecks,
  Crown,
} from "lucide-react";
import { QUESTION_TYPES } from "./question-types";

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  category: string;
  popularity?: number;
  isPopular?: boolean;
  isNew?: boolean;
  questions?: any[];
  settings?: any;
  estimatedSetupTime?: string;
  avgCompletionTime?: string;
  targetAudience?: string;
  gameMode?: "standard" | "elimination";
  themeId?: string;
  coverImage?: string;
  extras?: any[];
}

export const TEMPLATE_CATEGORIES = [
  { id: "all", name: "All Templates", icon: Grid, count: 12 },
  { id: "popular", name: "Most Popular", icon: TrendingUp, count: 6 },
  { id: "new", name: "New & Trending", icon: Sparkles, count: 4 },
  { id: "education", name: "Education", icon: GraduationCap, count: 3 },
  { id: "business", name: "Business", icon: Briefcase, count: 4 },
  { id: "team", name: "Team Building", icon: UsersIcon, count: 3 },
  { id: "entertainment", name: "Entertainment", icon: Gamepad2, count: 1 },
  { id: "game-show", name: "Game Show", icon: Crown, count: 1 },
];

export const SORT_OPTIONS = [
  { id: "popularity", name: "Most Popular", icon: TrendingUp },
  { id: "newest", name: "Newest First", icon: Sparkles },
  { id: "questions", name: "Most Questions", icon: ListChecks },
  { id: "alphabetical", name: "A to Z", icon: BookOpen },
];

export const templates: Template[] = [
  huntArenaTemplate,

  // ─── EDUCATION ───────────────────────────────────────────────────────────

  {
    id: "quiz-classic",
    name: "Interactive Lesson",
    description:
      "Engage students with a mix of knowledge checks, confidence ratings, and open reflection.",
    icon: Trophy,
    color: "bg-gradient-to-br from-purple-500 to-pink-500",
    category: "Education",
    popularity: 95,
    isPopular: true,
    isNew: false,
    questions: [
      {
        // Classic knowledge check — single correct answer
        id: "q1",
        type: QUESTION_TYPES.SINGLE_CHOICE,
        title: "Which of the following is the primary driver of climate change?",
        points: 100,
        timeLimit: 30,
        options: [
          { id: "1", text: "Volcanic eruptions", isCorrect: false },
          { id: "2", text: "Greenhouse gas emissions from human activity", isCorrect: true },
          { id: "3", text: "Changes in Earth's orbit", isCorrect: false },
          { id: "4", text: "Solar flares", isCorrect: false },
        ],
      },
      {
        // confidence self-assessment
        id: "q2",
        type: QUESTION_TYPES.SCALING,
        title: "Rate your understanding of these environmental concepts",
        description: "Move the sliders to reflect how well you understand each concept",
        points: 0,
        timeLimit: 60,
        statements: [
          { id: "s1", text: "The greenhouse effect" },
          { id: "s2", text: "Carbon footprint" },
          { id: "s3", text: "Renewable vs. non-renewable energy" },
          { id: "s4", text: "Biodiversity loss" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Not at all", max: "Completely" },
      },
      {
        // Word association — popular Mentimeter opener/closer
        id: "q3",
        type: QUESTION_TYPES.WORD_CLOUD,
        title: "What is the first word that comes to mind when you hear 'sustainability'?",
        description: "Enter a single word or short phrase",
        points: 0,
        timeLimit: 25,
      },
      {
        // Prioritisation — shows critical thinking
        id: "q4",
        type: QUESTION_TYPES.RANKING,
        title: "Rank these climate solutions from most to least impactful",
        description: "Drag to reorder — place the most effective solution at the top",
        points: 0,
        timeLimit: 60,
        options: [
          { id: "r1", text: "Transition to renewable energy", isCorrect: false },
          { id: "r2", text: "Reduce meat and dairy consumption", isCorrect: false },
          { id: "r3", text: "Switch to electric vehicles", isCorrect: false },
          { id: "r4", text: "Large-scale reforestation", isCorrect: false },
        ],
      },
    ],
    settings: {
      participationMode: "PUBLIC",
      timeLimit: 60,
      showLeaderboard: true,
      soundEffects: true,
      shuffleQuestions: false,
      allowRetry: false,
    },
    estimatedSetupTime: "2 minutes",
    avgCompletionTime: "6 minutes",
    targetAudience: "Students, Classrooms",
  },

  {
    id: "assessment-test",
    name: "Knowledge Assessment",
    description:
      "Evaluate understanding with scored questions, confidence checks, and open-ended reflection.",
    icon: FileText,
    color: "bg-gradient-to-br from-indigo-500 to-purple-500",
    category: "Education",
    popularity: 78,
    isPopular: false,
    isNew: false,
    questions: [
      {
        // Conceptual multiple choice
        id: "q1",
        type: QUESTION_TYPES.SINGLE_CHOICE,
        title: "What is the core purpose of version control systems like Git?",
        points: 100,
        timeLimit: 45,
        options: [
          { id: "1", text: "To encrypt source code securely", isCorrect: false },
          { id: "2", text: "To track changes, enable collaboration, and revert to previous states", isCorrect: true },
          { id: "3", text: "To compile and run code faster", isCorrect: false },
          { id: "4", text: "To auto-generate documentation", isCorrect: false },
        ],
      },
      {
        id: "q2",
        type: QUESTION_TYPES.TRUE_FALSE,
        title: "An API (Application Programming Interface) allows two different applications to communicate with each other.",
        points: 50,
        timeLimit: 20,
        options: [
          { id: "1", text: "True", isCorrect: true },
          { id: "2", text: "False", isCorrect: false },
        ],
      },
      {
        // Self-assessment of skill confidence
        id: "q3",
        type: QUESTION_TYPES.SCALING,
        title: "Rate your confidence in the following programming concepts",
        description: "Be honest — this helps us calibrate the session",
        points: 0,
        timeLimit: 60,
        statements: [
          { id: "s1", text: "Variables and data types" },
          { id: "s2", text: "Functions and scope" },
          { id: "s3", text: "Loops and iteration" },
          { id: "s4", text: "Error handling and debugging" },
          { id: "s5", text: "Working with APIs" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Not confident", max: "Very confident" },
      },
      {
        // Open reflection — tests real comprehension
        id: "q4",
        type: QUESTION_TYPES.OPEN_TEXT,
        title: "In your own words, explain what an API is and give one real-world example",
        description: "There is no single right answer — we want to see your thinking",
        points: 200,
        timeLimit: 120,
      },
    ],
    settings: {
      participationMode: "RESTRICTED",
      requireAccount: true,
      allowGuest: false,
      timeLimit: 600,
      showLeaderboard: false,
      showProgress: true,
      allowRetry: false,
      shuffleQuestions: false,
      answerValidation: "AUTO",
    },
    estimatedSetupTime: "4 minutes",
    avgCompletionTime: "10 minutes",
    targetAudience: "Students, Trainees, Job Applicants",
  },

  // ─── BUSINESS ────────────────────────────────────────────────────────────

  {
    id: "poll-quick",
    name: "Strategy Pulse Check",
    description:
      "Align your team on priorities, surface blockers, and capture honest feedback in minutes.",
    icon: BarChart3,
    color: "bg-gradient-to-br from-blue-500 to-cyan-500",
    category: "Business",
    popularity: 88,
    isPopular: true,
    isNew: false,
    questions: [
      {
        // Scales
        id: "q1",
        type: QUESTION_TYPES.SCALING,
        title: "Rate how well our team is currently performing in these areas",
        description: "1 = needs urgent attention, 5 = firing on all cylinders",
        points: 0,
        timeLimit: 60,
        statements: [
          { id: "s1", text: "Cross-team communication" },
          { id: "s2", text: "Delivery speed and reliability" },
          { id: "s3", text: "Innovation and new ideas" },
          { id: "s4", text: "Customer focus" },
          { id: "s5", text: "Collaboration across roles" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Needs work", max: "Excellent" },
      },
      {
        // Word cloud — surfaces patterns in culture perception
        id: "q2",
        type: QUESTION_TYPES.WORD_CLOUD,
        title: "What one word best describes our company culture right now?",
        description: "Be honest — your anonymity is protected",
        points: 0,
        timeLimit: 20,
      },
      {
        // Vote — democratic decision making
        id: "q3",
        type: QUESTION_TYPES.VOTE,
        title: "Which strategic priority should we double down on this quarter?",
        description: "Choose the one that will have the most impact",
        points: 0,
        timeLimit: 45,
        options: [
          { id: "v1", text: "Acquiring new customers", isCorrect: false },
          { id: "v2", text: "Improving the core product", isCorrect: false },
          { id: "v3", text: "Growing and developing the team", isCorrect: false },
          { id: "v4", text: "Streamlining operations", isCorrect: false },
          { id: "v5", text: "Retaining existing customers", isCorrect: false },
        ],
      },
      {
        // Open text — surfaces the most important qualitative signal
        id: "q4",
        type: QUESTION_TYPES.OPEN_TEXT,
        title: "What is the single biggest obstacle between us and our goals right now?",
        description: "Be specific — vague answers don't lead to action",
        points: 0,
        timeLimit: 90,
      },
    ],
    settings: {
      participationMode: "RESTRICTED",
      showLeaderboard: false,
      showProgress: true,
      allowAnonymous: true,
      requireAccount: false,
      maxParticipants: 500,
    },
    estimatedSetupTime: "3 minutes",
    avgCompletionTime: "5 minutes",
    targetAudience: "Leadership Teams, Managers",
  },

  {
    id: "survey-feedback",
    name: "Product Feedback Session",
    description:
      "Gather structured product feedback — what works, what to fix, and what to build next.",
    icon: Star,
    color: "bg-gradient-to-br from-pink-500 to-rose-500",
    category: "Business",
    popularity: 82,
    isPopular: false,
    isNew: true,
    questions: [
      {
        // Multi-statement satisfaction — much richer than a single star rating
        id: "q1",
        type: QUESTION_TYPES.SCALING,
        title: "Rate your satisfaction with these product areas",
        description: "Your honest feedback directly shapes what we build next",
        points: 0,
        timeLimit: 60,
        statements: [
          { id: "s1", text: "Ease of use" },
          { id: "s2", text: "Performance and reliability" },
          { id: "s3", text: "Range of features" },
          { id: "s4", text: "Visual design" },
          { id: "s5", text: "Customer support" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Very dissatisfied", max: "Very satisfied" },
      },
      {
        // Ranking — reveals true feature priority vs stated priority
        id: "q2",
        type: QUESTION_TYPES.RANKING,
        title: "Rank the product qualities that matter most to you",
        description: "Drag to reorder — most important at the top",
        points: 0,
        timeLimit: 60,
        options: [
          { id: "r1", text: "Speed and performance", isCorrect: false },
          { id: "r2", text: "Reliability and uptime", isCorrect: false },
          { id: "r3", text: "Intuitive design", isCorrect: false },
          { id: "r4", text: "Depth of integrations", isCorrect: false },
          { id: "r5", text: "Customisation options", isCorrect: false },
        ],
      },
      {
        id: "q3",
        type: QUESTION_TYPES.WORD_CLOUD,
        title: "In one word, describe your overall experience with the product",
        points: 0,
        timeLimit: 20,
      },
      {
        // Vote — democratic roadmap input
        id: "q4",
        type: QUESTION_TYPES.VOTE,
        title: "Which new capability should we prioritise next?",
        description: "Only one vote — make it count",
        points: 0,
        timeLimit: 45,
        options: [
          { id: "v1", text: "AI-powered automation", isCorrect: false },
          { id: "v2", text: "Advanced analytics and reporting", isCorrect: false },
          { id: "v3", text: "Mobile app improvements", isCorrect: false },
          { id: "v4", text: "More third-party integrations", isCorrect: false },
          { id: "v5", text: "Better collaboration tools", isCorrect: false },
        ],
      },
      {
        id: "q5",
        type: QUESTION_TYPES.OPEN_TEXT,
        title: "If you could change one thing about the product, what would it be?",
        description: "Be specific — 'make it better' helps no one",
        points: 0,
        timeLimit: 90,
      },
    ],
    settings: {
      participationMode: "ANONYMOUS",
      showLeaderboard: false,
      showProgress: true,
      allowRetry: false,
      allowAnonymous: true,
      maxParticipants: 1000,
    },
    estimatedSetupTime: "5 minutes",
    avgCompletionTime: "7 minutes",
    targetAudience: "Customers, Beta Users",
  },

  // ─── TEAM BUILDING ────────────────────────────────────────────────────────

  {
    id: "vote-decision",
    name: "Team Decision Maker",
    description:
      "Make group decisions together — vote, rank priorities, and map initiatives on an effort-impact matrix.",
    icon: ThumbsUp,
    color: "bg-gradient-to-br from-green-500 to-emerald-500",
    category: "Team Building",
    popularity: 75,
    isPopular: false,
    isNew: true,
    questions: [
      {
        // Vote — simple democratic decision
        id: "q1",
        type: QUESTION_TYPES.VOTE,
        title: "Where should the next team offsite be held?",
        description: "One vote per person — majority wins",
        points: 0,
        timeLimit: 60,
        options: [
          { id: "v1", text: "City hotel (urban escape)", isCorrect: false },
          { id: "v2", text: "Nature retreat (mountains/forest)", isCorrect: false },
          { id: "v3", text: "Beach or lakeside resort", isCorrect: false },
          { id: "v4", text: "Stay local — a venue nearby", isCorrect: false },
        ],
      },
      {
        // Ranking — surfaces true team values
        id: "q2",
        type: QUESTION_TYPES.RANKING,
        title: "Rank these team values from most to least important to you",
        description: "Your personal ranking — there is no wrong answer",
        points: 0,
        timeLimit: 60,
        options: [
          { id: "r1", text: "Transparency and open communication", isCorrect: false },
          { id: "r2", text: "Autonomy and ownership", isCorrect: false },
          { id: "r3", text: "Collaboration and shared success", isCorrect: false },
          { id: "r4", text: "Continuous learning and growth", isCorrect: false },
          { id: "r5", text: "Work-life balance and wellbeing", isCorrect: false },
        ],
      },
      {
        // Grid 2x2
        id: "q3",
        type: QUESTION_TYPES.GRID_2X2,
        title: "Place these team initiatives on the Effort vs. Impact matrix",
        description: "Drag each item to where you think it belongs",
        points: 0,
        timeLimit: 90,
        options: [
          { id: "g1", text: "Weekly team standup" },
          { id: "g2", text: "Monthly skill-sharing sessions" },
          { id: "g3", text: "Peer recognition programme" },
          { id: "g4", text: "Team retrospectives" },
          { id: "g5", text: "Internal documentation" },
        ],
        xAxis: { label: "Effort", minLabel: "Low effort", maxLabel: "High effort" },
        yAxis: { label: "Impact", minLabel: "Low impact", maxLabel: "High impact" },
      },
      {
        id: "q4",
        type: QUESTION_TYPES.OPEN_TEXT,
        title: "What is one change that would make this team's environment meaningfully better for you?",
        description: "Be honest — your response is anonymous",
        points: 0,
        timeLimit: 90,
      },
    ],
    settings: {
      participationMode: "RESTRICTED",
      showLeaderboard: false,
      allowAnonymous: true,
      requireAccount: false,
      maxParticipants: 50,
    },
    estimatedSetupTime: "2 minutes",
    avgCompletionTime: "5 minutes",
    targetAudience: "Team Leaders, Managers, Any Team",
  },

  {
    id: "icebreaker",
    name: "Meeting Icebreaker",
    description:
      "Warm up any group in under 5 minutes — word associations, quick votes, and light check-ins.",
    icon: Snowflake,
    color: "bg-gradient-to-br from-cyan-500 to-blue-500",
    category: "Team Building",
    popularity: 90,
    isPopular: true,
    isNew: false,
    questions: [
      {
        // for engagement
        id: "q1",
        type: QUESTION_TYPES.WORD_CLOUD,
        title: "One word that describes your energy level right now",
        description: "Be honest — even 'tired' is a valid answer",
        points: 0,
        timeLimit: 20,
      },
      {
        // Fun vote — low-stakes, gets people laughing
        id: "q2",
        type: QUESTION_TYPES.VOTE,
        title: "If you could have one superpower for today, what would it be?",
        points: 0,
        timeLimit: 30,
        options: [
          { id: "v1", text: "Teleportation", isCorrect: false },
          { id: "v2", text: "Reading minds", isCorrect: false },
          { id: "v3", text: "Pausing time", isCorrect: false },
          { id: "v4", text: "Invisibility", isCorrect: false },
          { id: "v5", text: "Infinite energy", isCorrect: false },
        ],
      },
      {
        // Scales — team mood check-in
        id: "q3",
        type: QUESTION_TYPES.SCALING,
        title: "How do you feel about these right now?",
        description: "Quick gut-check — no overthinking",
        points: 0,
        timeLimit: 45,
        statements: [
          { id: "s1", text: "I feel clear on my priorities this week" },
          { id: "s2", text: "I feel heard in team discussions" },
          { id: "s3", text: "I have what I need to do my best work" },
          { id: "s4", text: "I'm looking forward to today's session" },
        ],
        scale: { min: 1, max: 5 },
        labels: { min: "Not really", max: "Absolutely" },
      },
      {
        // Personal win — builds psychological safety
        id: "q4",
        type: QUESTION_TYPES.OPEN_TEXT,
        title: "Share one personal or professional win from the past week",
        description: "Big or small — all wins count",
        points: 0,
        timeLimit: 45,
      },
      {
        // Ranking — reveals individual working preferences
        id: "q5",
        type: QUESTION_TYPES.RANKING,
        title: "Rank these meeting formats from most to least useful for you",
        description: "Your honest take — drag to reorder",
        points: 0,
        timeLimit: 45,
        options: [
          { id: "r1", text: "Short daily stand-up (15 min)", isCorrect: false },
          { id: "r2", text: "Focused workshop (1 hour)", isCorrect: false },
          { id: "r3", text: "Open brainstorm session", isCorrect: false },
          { id: "r4", text: "1-on-1 with manager", isCorrect: false },
          { id: "r5", text: "Company-wide town hall", isCorrect: false },
        ],
      },
    ],
    settings: {
      participationMode: "PUBLIC",
      showLeaderboard: false,
      showProgress: true,
      allowAnonymous: true,
      soundEffects: false,
    },
    estimatedSetupTime: "1 minute",
    avgCompletionTime: "5 minutes",
    targetAudience: "Any team, Remote workers, New groups",
  },

  // ─── ENTERTAINMENT ────────────────────────────────────────────────────────

  {
    id: "game-trivia",
    name: "Pop Culture Quiz",
    description:
      "Test pop culture knowledge with a fun mix of trivia, opinion votes, and word associations.",
    icon: Gamepad2,
    color: "bg-gradient-to-br from-orange-500 to-yellow-500",
    category: "Entertainment",
    popularity: 92,
    isPopular: true,
    isNew: false,
    questions: [
      {
        id: "q1",
        type: QUESTION_TYPES.SINGLE_CHOICE,
        title: "Which of these is the best-selling video game of all time?",
        points: 200,
        timeLimit: 20,
        options: [
          { id: "1", text: "Grand Theft Auto V", isCorrect: false },
          { id: "2", text: "Minecraft", isCorrect: true },
          { id: "3", text: "Tetris", isCorrect: false },
          { id: "4", text: "PUBG: Battlegrounds", isCorrect: false },
        ],
      },
      {
        id: "q2",
        type: QUESTION_TYPES.SINGLE_CHOICE,
        title: "How many Oscars did the movie 'Titanic' (1997) win?",
        points: 300,
        timeLimit: 25,
        options: [
          { id: "1", text: "7", isCorrect: false },
          { id: "2", text: "9", isCorrect: false },
          { id: "3", text: "11", isCorrect: true },
          { id: "4", text: "14", isCorrect: false },
        ],
      },
      {
        // Opinion vote — no right answer, gets people talking
        id: "q3",
        type: QUESTION_TYPES.VOTE,
        title: "Vote for the greatest music act of all time",
        description: "Settle this debate once and for all",
        points: 0,
        timeLimit: 30,
        options: [
          { id: "v1", text: "The Beatles", isCorrect: false },
          { id: "v2", text: "Michael Jackson", isCorrect: false },
          { id: "v3", text: "Queen", isCorrect: false },
          { id: "v4", text: "Beyoncé", isCorrect: false },
          { id: "v5", text: "Elvis Presley", isCorrect: false },
        ],
      },
      {
        // Word cloud — fun, visual, unpredictable
        id: "q4",
        type: QUESTION_TYPES.WORD_CLOUD,
        title: "Name a movie you would watch on an endless loop",
        description: "One title only",
        points: 0,
        timeLimit: 20,
      },
      {
        // Ranking — great for debate and discussion
        id: "q5",
        type: QUESTION_TYPES.RANKING,
        title: "Rank these iconic TV shows from most to least legendary",
        description: "Drag to order — no ties allowed",
        points: 0,
        timeLimit: 45,
        options: [
          { id: "r1", text: "Friends", isCorrect: false },
          { id: "r2", text: "Breaking Bad", isCorrect: false },
          { id: "r3", text: "Game of Thrones", isCorrect: false },
          { id: "r4", text: "The Office", isCorrect: false },
          { id: "r5", text: "Stranger Things", isCorrect: false },
        ],
      },
    ],
    settings: {
      showLeaderboard: true,
      soundEffects: true,
      shuffleQuestions: false,
      timeLimit: 300,
      showProgress: true,
    },
    estimatedSetupTime: "3 minutes",
    avgCompletionTime: "8 minutes",
    targetAudience: "Friends, Social groups, Party games",
  },

  // ─── BLANK CANVAS ─────────────────────────────────────────────────────────

  {
    id: "custom-blank",
    name: "Blank Canvas",
    description: "Start from scratch with full control over every question and setting.",
    icon: Palette,
    color: "bg-gradient-to-br from-gray-500 to-gray-700",
    category: "Custom",
    popularity: 65,
    isPopular: false,
    isNew: false,
    questions: [],
    settings: {},
    estimatedSetupTime: "5+ minutes",
    avgCompletionTime: "Custom",
    targetAudience: "Power users, Creators",
  },
];
