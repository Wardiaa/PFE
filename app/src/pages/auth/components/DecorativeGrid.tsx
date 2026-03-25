import React from 'react';
import { 
  BarChart2, CheckSquare, Heart, MessageSquare, Zap, Users, Vote, Hash,
  PieChart, TrendingUp, Award, Star, ThumbsUp, MessageCircle, Share2, Bell
} from 'lucide-react';
import type { TileContent, InteractionIcon, TileProps } from '../types';

const tileColors = [
  'bg-black', 'bg-zinc-900', 'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black',
  'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-900', 'bg-zinc-800',
  'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-800', 'bg-black', 'bg-zinc-900',
  'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-900', 'bg-zinc-800',
  'bg-black', 'bg-zinc-900', 'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black',
  'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-800', 'bg-zinc-900',
  'bg-black', 'bg-zinc-900', 'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black',
  'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-800', 'bg-zinc-900',
  'bg-black', 'bg-zinc-900', 'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black',
  'bg-zinc-800', 'bg-black', 'bg-zinc-900', 'bg-black', 'bg-zinc-800', 'bg-zinc-900'
];

const tileTypes: TileContent[] = [
  { type: 'abstract', id: 0 }, { type: 'icon', iconIndex: 0 }, { type: 'abstract', id: 1 }, { type: 'abstract', id: 2 }, { type: 'icon', iconIndex: 1 }, { type: 'abstract', id: 3 },
  { type: 'abstract', id: 4 }, { type: 'icon', iconIndex: 2 }, { type: 'abstract', id: 5 }, { type: 'abstract', id: 6 }, { type: 'icon', iconIndex: 3 }, { type: 'abstract', id: 7 },
  { type: 'abstract', id: 8 }, { type: 'icon', iconIndex: 4 }, { type: 'abstract', id: 9 }, { type: 'abstract', id: 10 }, { type: 'icon', iconIndex: 5 }, { type: 'abstract', id: 11 },
  { type: 'abstract', id: 12 }, { type: 'icon', iconIndex: 6 }, { type: 'abstract', id: 0 }, { type: 'abstract', id: 1 }, { type: 'icon', iconIndex: 7 }, { type: 'abstract', id: 2 },
  { type: 'abstract', id: 3 }, { type: 'icon', iconIndex: 8 }, { type: 'abstract', id: 4 }, { type: 'abstract', id: 5 }, { type: 'icon', iconIndex: 9 }, { type: 'abstract', id: 6 },
  { type: 'abstract', id: 7 }, { type: 'icon', iconIndex: 10 }, { type: 'abstract', id: 8 }, { type: 'abstract', id: 9 }, { type: 'icon', iconIndex: 11 }, { type: 'abstract', id: 10 },
  { type: 'abstract', id: 11 }, { type: 'icon', iconIndex: 12 }, { type: 'abstract', id: 12 }, { type: 'abstract', id: 0 }, { type: 'icon', iconIndex: 13 }, { type: 'abstract', id: 1 },
  { type: 'abstract', id: 2 }, { type: 'icon', iconIndex: 14 }, { type: 'abstract', id: 3 }, { type: 'abstract', id: 4 }, { type: 'icon', iconIndex: 15 }, { type: 'abstract', id: 5 },
  { type: 'abstract', id: 6 }, { type: 'icon', iconIndex: 0 }, { type: 'abstract', id: 7 }, { type: 'abstract', id: 8 }, { type: 'icon', iconIndex: 1 }, { type: 'abstract', id: 9 },
  { type: 'abstract', id: 10 }, { type: 'icon', iconIndex: 2 }, { type: 'abstract', id: 11 }, { type: 'abstract', id: 12 }, { type: 'icon', iconIndex: 3 }, { type: 'abstract', id: 0 }
];

const interactionIcons: InteractionIcon[] = [
  { icon: BarChart2, label: 'Poll' }, { icon: CheckSquare, label: 'Quiz' },
  { icon: Heart, label: 'React' }, { icon: MessageSquare, label: 'Chat' },
  { icon: Zap, label: 'Live' }, { icon: Users, label: 'Groups' },
  { icon: Vote, label: 'Vote' }, { icon: Hash, label: 'Topic' },
  { icon: PieChart, label: 'Results' }, { icon: TrendingUp, label: 'Trending' },
  { icon: Award, label: 'Leaderboard' }, { icon: Star, label: 'Favorite' },
  { icon: ThumbsUp, label: 'Like' }, { icon: MessageCircle, label: 'Discuss' },
  { icon: Share2, label: 'Share' }, { icon: Bell, label: 'Notify' }
];

const Tile: React.FC<TileProps> = ({ index, isDark }) => {
  const bgColor = tileColors[index];
  const tileConfig = tileTypes[index];

  const renderContent = () => {
    const iconColor = isDark ? 'text-zinc-500' : 'text-white';

    if (tileConfig.type === 'icon') {
      const Icon = interactionIcons[tileConfig.iconIndex].icon;
      return <Icon size={32} className={`${iconColor} transition-colors duration-300 group-hover:text-white group-hover:scale-110`} />;
    }

    if (tileConfig.type === 'abstract') {
      const baseAbstractColor = isDark ? 'bg-zinc-400/20' : 'bg-white';
      const baseBorderColor = isDark ? 'border-zinc-700' : 'border-white';
      const baseDotColor = isDark ? 'bg-zinc-500' : 'bg-white';

      switch (tileConfig.id) {
        case 0: return (
          <div className="relative h-full w-full">
            <div className={`absolute top-0 left-0 h-1/2 w-1/2 rounded-br-full ${baseAbstractColor} group-hover:bg-white/20`} />
          </div>
        );
        case 1: return (
          <div className="relative h-full w-full">
            <div className={`absolute bottom-0 right-0 h-1/2 w-1/2 rounded-tl-full ${baseAbstractColor} group-hover:bg-white/20`} />
          </div>
        );
        case 2: return (
          <div className="relative flex items-center justify-center h-full w-full">
            <div className={`absolute h-3 w-3 rounded-full border ${baseBorderColor} group-hover:border-white/50`} />
            <div className={`absolute h-6 w-6 rounded-full border ${baseBorderColor} group-hover:border-white/50`} />
            <div className={`absolute h-9 w-9 rounded-full border ${baseBorderColor} group-hover:border-white/50`} />
          </div>
        );
        case 3: return (
          <div className="grid grid-cols-3 gap-1 opacity-40 group-hover:opacity-100">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${baseDotColor} group-hover:bg-white transition-colors`} />
            ))}
          </div>
        );
        case 4: return <div className={`h-6 w-6 rotate-45 border-2 ${baseBorderColor} group-hover:border-white/50`} />;
        case 5: return (
          <div className="relative h-8 w-8">
            <div className={`absolute inset-0 rounded-tl-full border-2 ${baseBorderColor} group-hover:border-white/50`} />
            <div className={`absolute inset-0 rounded-br-full border-2 ${baseBorderColor} rotate-90 group-hover:border-white/50`} />
          </div>
        );
        case 6: return (
          <div className="relative h-8 w-8">
            <div className={`absolute top-0 left-0 h-5 w-5 rounded-br-full border-2 ${baseBorderColor} group-hover:border-white/50`} />
            <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-tl-full border-2 ${baseBorderColor} group-hover:border-white/50`} />
          </div>
        );
        case 7: return (
          <div className="relative h-full w-full">
            <div className={`absolute top-0 left-0 h-1/3 w-1/3 rounded-br-full border ${baseBorderColor} group-hover:border-white/50`} />
            <div className={`absolute top-0 left-0 h-2/3 w-2/3 rounded-br-full border ${baseBorderColor} group-hover:border-white/50`} />
          </div>
        );
        case 8: return (
          <div className="flex items-end justify-center gap-1 h-8 w-8">
            <div className={`w-2 h-3 ${baseDotColor} group-hover:bg-white/100 rounded-t`} />
            <div className={`w-2 h-5 ${baseDotColor} group-hover:bg-white/100 rounded-t`} />
            <div className={`w-2 h-4 ${baseDotColor} group-hover:bg-white/100 rounded-t`} />
            <div className={`w-2 h-6 ${baseDotColor} group-hover:bg-white/100 rounded-t`} />
          </div>
        );
        case 9: return (
          <div className="relative h-8 w-8">
            <div className={`absolute top-0 left-0 text-[8px] font-bold ${isDark ? 'text-zinc-600/70' : 'text-white/90'} group-hover:text-white/90`}>YES</div>
            <div className={`absolute bottom-0 right-0 text-[8px] font-bold ${isDark ? 'text-zinc-600/60' : 'text-white/80'} group-hover:text-white/80`}>NO</div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold ${isDark ? 'text-zinc-600/80' : 'text-white/100'} group-hover:text-white/100`}>?</div>
          </div>
        );
        case 10: return (
          <div className="grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-2.5 w-2.5 rounded-full border ${isDark ? 'border-zinc-600/70' : 'border-white/90'} group-hover:border-white/90`} />
            ))}
          </div>
        );
        case 11: return (
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <polyline points="4 16 8 12 12 14 16 8 20 12" stroke="currentColor" strokeWidth="2" fill="none" className={isDark ? 'text-zinc-600/80' : 'text-white/100'} />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" className={isDark ? 'text-zinc-600/70' : 'text-white/90'} />
            <circle cx="16" cy="8" r="1.5" fill="currentColor" className={isDark ? 'text-zinc-600/70' : 'text-white/90'} />
          </svg>
        );
        case 12: return (
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full ${isDark ? 'bg-zinc-300/70 group-hover:bg-white/80' : 'bg-white/90 group-hover:bg-white/100'}`} />
                <div className={`h-3 w-2.5 rounded-t-lg mt-0.5 ${isDark ? 'bg-zinc-300/80 group-hover:bg-white/90' : 'bg-white/90 group-hover:bg-white/100'}`} />
              </div>
            ))}
          </div>
        );
        default: return null;
      }
    }
    return null;
  };

  return (
    <div className={`group relative flex items-center justify-center overflow-hidden ${bgColor} transition-all duration-500 cursor-crosshair hover:bg-indigo-600 hover:z-20 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]`}>
      {renderContent()}
    </div>
  );
};

export const DecorativeGrid: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <div className={`grid h-full w-full grid-cols-6 grid-rows-10 gap-px ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-300/50'}`}>
    {[...Array(60)].map((_, i) => <Tile key={i} index={i} isDark={isDark} />)}
  </div>
);
