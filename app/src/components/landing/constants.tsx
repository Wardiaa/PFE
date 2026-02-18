
import type { FeatureSlide, StatItem } from '../../types/index';

export const FEATURES: FeatureSlide[] = [
  {
    id: 'quizzes',
    title: 'Live Quizzes',
    description: 'Transform passive listeners into active players. Real-time trivia with high-stakes leaderboards that update in sub-100ms.',
    image: 'https://images.unsplash.com/photo-1606326666490-af6745103efc?q=80&w=2070&auto=format&fit=crop',
    color: 'bg-indigo-600',
    details: ['Competitive Leaderboards', 'Timed Questions', 'Instant Scoring', 'Streak Bonuses']
  },
  {
    id: 'polls',
    title: 'Instant Polls',
    description: 'Capture the pulse of the room. Watch beautiful visual charts grow as votes pour in from every device in the building.',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop',
    color: 'bg-emerald-500',
    details: ['Live Visualizations', 'Multiple Choice', 'Word Clouds', 'Anonymous Voting']
  },
  {
    id: 'qa',
    title: 'Live Q&A',
    description: 'Democratic moderation. Let the best questions rise to the top with an audience-driven upvoting system.',
    image: 'https://images.unsplash.com/photo-1577563906417-45a11b3f9f7c?q=80&w=2070&auto=format&fit=crop',
    color: 'bg-violet-600',
    details: ['Upvote Ranking', 'Host Moderation', 'Anonymous Entry', 'Session Archive']
  },
  {
    id: 'ai',
    title: 'AI Analytics',
    description: 'Deep insights, instantly. Our AI summarizes thousands of responses into sentiment reports and key takeaways.',
    image: 'https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=2070&auto=format&fit=crop',
    color: 'bg-rose-500',
    details: ['Sentiment Analysis', 'Automatic Summaries', 'Engagement Tracking', 'Exportable Reports']
  }
];

export const STATS: StatItem[] = [
  { label: 'Latency', value: '100', suffix: 'ms' },
  { label: 'Participants', value: '10k', suffix: '+' },
  { label: 'Uptime', value: '99.9', suffix: '%' },
  { label: 'Sessions', value: '500k', suffix: '+' }
];
