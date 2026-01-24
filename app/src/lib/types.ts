
export type UserRole = 'USER' | 'ADMIN' | 'SUPER-ADMIN';

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  createdAt: string;
};

export type QuestionType = 'QUIZ' | 'MULTIPLE_CHOICE' | 'OPEN' | 'POLL' | 'RATING';

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO';

export type Media = {
  id: string;
  type: MediaType;
  url: string;
};

export type Option = {
  id: string;
  text: string;
  isCorrect?: boolean;
};

export type Question = {
  id: string;
  type: QuestionType;
  title: string;
  media?: Media;
  options?: Option[];
  correctAnswer?: string; // For text/open questions if auto-validated
  timeLimit?: number; // in seconds
  points?: number;
};

export type ContextType = 'QUIZ' | 'VOTE' | 'POLL' | 'GAME';

export type Context = {
  id: string;
  title: string;
  description?: string;
  type: ContextType;
  creatorId: string;
  questions: Question[];
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  code: string;
  createdAt: string;
  participantsCount: number;
  coverImage?: string;
};

export type Participation = {
  id: string;
  contextId: string;
  userId: string; // or guest ID
  userName: string;
  answers: Record<string, any>; // questionId -> answer
  score: number;
  joinedAt: string;
};

// --- Mock Data ---

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Alice Creator',
    email: 'alice@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
    role: 'ADMIN',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'u2',
    name: 'Bob Participant',
    email: 'bob@example.com',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob',
    role: 'USER',
    createdAt: new Date().toISOString(),
  },
];

export const MOCK_CONTEXTS: Context[] = [
  {
    id: 'c1',
    title: 'General Knowledge Quiz',
    description: 'Test your knowledge about the world!',
    type: 'QUIZ',
    creatorId: 'u1',
    status: 'ACTIVE',
    code: 'QUIZ24',
    createdAt: new Date().toISOString(),
    participantsCount: 12,
    coverImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&q=80&w=1000',
    questions: [
      {
        id: 'q1',
        type: 'QUIZ',
        title: 'What is the capital of France?',
        timeLimit: 30,
        points: 100,
        options: [
          { id: 'o1', text: 'London', isCorrect: false },
          { id: 'o2', text: 'Berlin', isCorrect: false },
          { id: 'o3', text: 'Paris', isCorrect: true },
          { id: 'o4', text: 'Madrid', isCorrect: false },
        ],
      },
      {
        id: 'q2',
        type: 'QUIZ',
        title: 'Which planet is known as the Red Planet?',
        timeLimit: 20,
        points: 100,
        options: [
          { id: 'o1', text: 'Mars', isCorrect: true },
          { id: 'o2', text: 'Venus', isCorrect: false },
          { id: 'o3', text: 'Jupiter', isCorrect: false },
        ],
      },
    ],
  },
  {
    id: 'c2',
    title: 'Team Feedback',
    description: 'Weekly team sync feedback session',
    type: 'POLL',
    creatorId: 'u1',
    status: 'DRAFT',
    code: 'TEAM01',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    participantsCount: 0,
    coverImage: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000',
    questions: [
      {
        id: 'q1',
        type: 'RATING',
        title: 'How was the sprint planning?',
        options: [], // 1-5 scale implied
      },
      {
        id: 'q2',
        type: 'OPEN',
        title: 'Any suggestions for next week?',
      },
    ],
  },
];

export const MOCK_PARTICIPATIONS: Participation[] = [
  {
    id: 'p1',
    contextId: 'c1',
    userId: 'u2',
    userName: 'Bob Participant',
    answers: {
      'q1': 'o3',
      'q2': 'o1',
    },
    score: 200,
    joinedAt: new Date().toISOString(),
  }
];
