import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  BarChart2,
  CheckSquare,
  Heart,
  MessageSquare,
  Zap,
  Users,
  Vote,
  Hash,
  Sun,
  Moon,
  PieChart,
  TrendingUp,
  Award,
  Star,
  ThumbsUp,
  MessageCircle,
  Share2,
  Bell
} from 'lucide-react';

type IconContent = { type: 'icon'; iconIndex: number; };
type AbstractContent = { type: 'abstract'; id: number; };
type TileContent = IconContent | AbstractContent;

// Predefined colors for each tile (60 tiles)
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

// Predefined content types for each tile (icon or abstract)
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

const interactionIcons = [
  { icon: BarChart2, label: 'Poll' }, { icon: CheckSquare, label: 'Quiz' },
  { icon: Heart, label: 'React' }, { icon: MessageSquare, label: 'Chat' },
  { icon: Zap, label: 'Live' }, { icon: Users, label: 'Groups' },
  { icon: Vote, label: 'Vote' }, { icon: Hash, label: 'Topic' },
  { icon: PieChart, label: 'Results' }, { icon: TrendingUp, label: 'Trending' },
  { icon: Award, label: 'Leaderboard' }, { icon: Star, label: 'Favorite' },
  { icon: ThumbsUp, label: 'Like' }, { icon: MessageCircle, label: 'Discuss' },
  { icon: Share2, label: 'Share' }, { icon: Bell, label: 'Notify' }
];

const Tile = ({ index, isDark }: { index: number; isDark: boolean }) => {
  const bgColor = tileColors[index];
  const tileConfig = tileTypes[index];

  // Check if this is a quarter circle tile (ids 0, 1, and also parts of 5, 6, 7)
  const isQuarterCircle = tileConfig.type === 'abstract' && (
    tileConfig.id === 0 || 
    tileConfig.id === 1 || 
    tileConfig.id === 5 || 
    tileConfig.id === 6 || 
    tileConfig.id === 7
  );

  // Check if this is a bar chart (id 8) or three dots with bars (id 12)
  const shouldTurnWhite = tileConfig.type === 'abstract' && (
    tileConfig.id === 8 || tileConfig.id === 12
  );

  const renderContent = () => {
    // Icon colors
    const iconColor = isDark ? 'text-zinc-500' : 'text-zinc-700';
    
    if (tileConfig.type === 'icon') {
      const Icon = interactionIcons[tileConfig.iconIndex].icon;
      return <Icon size={32} className={`${iconColor} transition-colors duration-300 group-hover:text-white group-hover:scale-110`} />;
    }
    
    if (tileConfig.type === 'abstract') {
      // Base colors
      const baseAbstractColor = isDark ? 'bg-zinc-400/20' : 'bg-zinc-600/10';
      const baseBorderColor = isDark ? 'border-zinc-700' : 'border-zinc-500';
      const baseDotColor = isDark ? 'bg-zinc-500' : 'bg-zinc-600';
      
      // Quarter circles become white in light mode
      // Bar chart and three dots also become white in light mode
      // Other elements get a mix
      let abstractColor = baseAbstractColor;
      let borderColor = baseBorderColor;
      let dotColor = baseDotColor;
      
      if (!isDark) {
        if (isQuarterCircle || shouldTurnWhite) {
          // These elements become white in light mode
          abstractColor = 'bg-white';
          borderColor = 'border-white';
          dotColor = 'bg-white';
        } else {
          // Other elements get a mix (every 2nd, 3rd, etc.)
          const shouldBeWhite = (
            index % 2 === 0 ||
            index % 3 === 1 ||
            index % 5 === 2
          );
          if (shouldBeWhite) {
            abstractColor = 'bg-white';
            borderColor = 'border-white';
            dotColor = 'bg-white';
          }
        }
      }
      
      switch (tileConfig.id) {
        // Quarter circle top-left
        case 0: return (
          <div className="relative h-full w-full">
            <div className={`absolute top-0 left-0 h-1/2 w-1/2 rounded-br-full ${abstractColor} group-hover:bg-white/20`} />
          </div>
        );
        
        // Quarter circle bottom-right
        case 1: return (
          <div className="relative h-full w-full">
            <div className={`absolute bottom-0 right-0 h-1/2 w-1/2 rounded-tl-full ${abstractColor} group-hover:bg-white/20`} />
          </div>
        );
        
        // Concentric circles
        case 2: return (
          <div className="relative flex items-center justify-center h-full w-full">
            <div className={`absolute h-3 w-3 rounded-full border ${borderColor} group-hover:border-white/50`} />
            <div className={`absolute h-6 w-6 rounded-full border ${borderColor} group-hover:border-white/50`} />
            <div className={`absolute h-9 w-9 rounded-full border ${borderColor} group-hover:border-white/50`} />
          </div>
        );
        
        // Dot grid
        case 3: return (
          <div className="grid grid-cols-3 gap-1 opacity-40 group-hover:opacity-100">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${dotColor} group-hover:bg-white transition-colors`} />
            ))}
          </div>
        );
        
        // Rotated square
        case 4: return <div className={`h-6 w-6 rotate-45 border-2 ${borderColor} group-hover:border-white/50`} />;
        
        // Double quarter circles (both corners)
        case 5: return (
          <div className="relative h-8 w-8">
            <div className={`absolute inset-0 rounded-tl-full border-2 ${borderColor} group-hover:border-white/50`} />
            <div className={`absolute inset-0 rounded-br-full border-2 ${borderColor} rotate-90 group-hover:border-white/50`} />
          </div>
        );
        
        // Corner brackets (two quarter circles)
        case 6: return (
          <div className="relative h-8 w-8">
            <div className={`absolute top-0 left-0 h-5 w-5 rounded-br-full border-2 ${borderColor} group-hover:border-white/50`} />
            <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-tl-full border-2 ${borderColor} group-hover:border-white/50`} />
          </div>
        );
        
        // Nested quarter circles
        case 7: return (
          <div className="relative h-full w-full">
            <div className={`absolute top-0 left-0 h-1/3 w-1/3 rounded-br-full border ${borderColor} group-hover:border-white/50`} />
            <div className={`absolute top-0 left-0 h-2/3 w-2/3 rounded-br-full border ${borderColor} group-hover:border-white/50`} />
          </div>
        );
        
        // Bar chart - turns white in light mode
        case 8: return (
          <div className="flex items-end justify-center gap-1 h-8 w-8">
            <div className={`w-2 h-3 ${dotColor}/70 group-hover:bg-white/70 rounded-t`} />
            <div className={`w-2 h-5 ${dotColor} group-hover:bg-white/100 rounded-t`} />
            <div className={`w-2 h-4 ${dotColor}/80 group-hover:bg-white/80 rounded-t`} />
            <div className={`w-2 h-6 ${dotColor} group-hover:bg-white/100 rounded-t`} />
          </div>
        );
        
        // YES/NO/? - preserved original styling
        case 9: return (
          <div className="relative h-8 w-8">
            <div className="absolute top-0 left-0 text-[8px] font-bold text-zinc-600/70 group-hover:text-white/90">YES</div>
            <div className="absolute bottom-0 right-0 text-[8px] font-bold text-zinc-600/60 group-hover:text-white/80">NO</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600/80 group-hover:text-white/100">?</div>
          </div>
        );
        
        // Four dots border
        case 10: return (
          <div className="grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-full border border-zinc-600/70 group-hover:border-white/90" />
            ))}
          </div>
        );
        
        // Line chart
        case 11: return (
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <polyline points="4 16 8 12 12 14 16 8 20 12" stroke="currentColor" strokeWidth="2" fill="none" className="text-zinc-600/80 group-hover:text-white/100" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" className="text-zinc-600/70 group-hover:text-white/90" />
            <circle cx="16" cy="8" r="1.5" fill="currentColor" className="text-zinc-600/70 group-hover:text-white/90" />
          </svg>
        );
        
        // Three dots with bars - turns white in light mode
        case 12: return (
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`h-2 w-2 rounded-full ${dotColor}/60 group-hover:bg-white/80`} />
                <div className={`h-3 w-2.5 ${dotColor}/70 group-hover:bg-white/90 rounded-t-lg mt-0.5`} />
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

const DecorativeGrid = ({ isDark }: { isDark: boolean }) => (
  <div className={`grid h-full w-full grid-cols-6 grid-rows-10 gap-px ${isDark ? 'bg-zinc-900/50' : 'bg-zinc-300/50'}`}>
    {[...Array(60)].map((_, i) => <Tile key={i} index={i} isDark={isDark} />)}
  </div>
);

export default function SignInPage() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-zinc-950 selection:bg-indigo-500' : 'bg-zinc-50 selection:bg-indigo-200'}`}>
      
      {/* LEFT SIDE: Sign In Form - Balanced sizing */}
      <div className={`
        flex w-full flex-col px-8 py-8 lg:w-[480px] xl:w-[540px] lg:px-14 lg:py-10 transition-all duration-500 z-10
        ${isDark 
          ? 'bg-black/40 backdrop-blur-3xl border-r border-zinc-900/50 text-zinc-100' 
          : 'bg-white border-r border-zinc-200 text-zinc-900 shadow-xl'}
      `}>
        
        {/* Top Navigation & Toggle */}
        <div className="mb-12 flex items-center justify-between">
          <button className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isDark ? 'text-zinc-600 hover:text-indigo-400' : 'text-zinc-400 hover:text-indigo-600'}`}>
            <ArrowLeft size={14} strokeWidth={3} />
            Back to home
          </button>

          {/* LIGHT/DARK TOGGLE BUTTON */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className={`p-2 rounded-lg transition-all ${isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:text-zinc-900'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-col justify-center">
          
          {/* Stylized Logo Icon */}
          <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl ring-1 shadow-sm transition-colors ${isDark ? 'bg-zinc-900 ring-zinc-800' : 'bg-zinc-50 ring-zinc-200'}`}>
            <div className="relative">
               <div className="absolute -right-1 -top-1 h-2 w-2 bg-indigo-500" />
               <ArrowUpRight size={26} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
            </div>
          </div>

          <h1 className={`mb-1 text-3xl font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Sign in
          </h1>
          <p className={`mb-8 text-[15px] font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Continue to your business account
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <input 
                type="email" 
                placeholder="Enter your email"
                className={`w-full rounded-xl border px-5 py-4 text-[15px] outline-none transition-all focus:ring-4 focus:ring-indigo-500/10 
                  ${isDark 
                    ? 'border-zinc-800 bg-zinc-900/30 text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900/80' 
                    : 'border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-600 focus:bg-white'}`}
              />
            </div>

            <button className="w-full rounded-xl bg-indigo-600 py-4 text-[15px] font-bold text-white transition-all hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
              Continue
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8 flex items-center">
            <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
            <span className={`px-4 text-[11px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>Or</span>
            <div className={`flex-grow border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}></div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button className={`flex w-full items-center justify-center gap-3 rounded-xl border py-4 text-[15px] font-bold transition-all active:scale-[0.98]
              ${isDark 
                ? 'border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700' 
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'}`}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
              Continue with Google
            </button>
            <button className={`flex w-full items-center justify-center gap-3 rounded-xl border py-4 text-[15px] font-bold transition-all active:scale-[0.98]
              ${isDark 
                ? 'border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700' 
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'}`}>
              <svg className="h-5 w-5 fill-[#5865F2]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03z" />
              </svg>
              Continue with Discord
            </button>
          </div>
        </div>

      
      </div>

      {/* RIGHT SIDE: Decorative Grid */}
      <div className={`hidden flex-1 lg:block relative transition-colors duration-500 overflow-hidden`}>
        {/* Container with padding */}
        <div className={`absolute inset-0 p-8 transition-colors duration-500 ${
          isDark ? 'bg-black' : 'bg-zinc-100'
        }`}>
          {/* Inner container with the grid */}
          <div className={`relative h-full w-full rounded-2xl overflow-hidden transition-colors duration-500 ${
            isDark ? 'bg-black' : 'bg-white shadow-xl'
          }`}>
            <DecorativeGrid isDark={isDark} />
            
            {/* Gradient overlays */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
            <div className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              isDark 
                ? 'bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-100' 
                : 'bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-30'
            }`} />
            <div className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
              isDark 
                ? 'bg-gradient-to-r from-black/30 via-transparent to-transparent opacity-100' 
                : 'bg-gradient-to-r from-black/5 via-transparent to-transparent opacity-30'
            }`} />
          </div>
        </div>
      </div>

    </div>
  );
}