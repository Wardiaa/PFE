import React, { useMemo, useState } from 'react';
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

type IconContent = { type: 'icon'; data: { icon: React.ElementType; label: string; }; };
type AbstractContent = { type: 'abstract'; id: number; };
type TileContent = IconContent | AbstractContent;

const Tile = () => {
  const bgColor = useMemo(() => {
    const rand = Math.random();
    if (rand > 0.98) return 'bg-zinc-700';
    if (rand > 0.85) return 'bg-zinc-800'; 
    if (rand > 0.60) return 'bg-zinc-900'; 
    return 'bg-black';
  }, []);

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

  const content = useMemo((): TileContent => {
    const rand = Math.random();
    // 30% icons, 70% abstract shapes (more arcs!)
    if (rand > 0.7) {
      return { type: 'icon', data: interactionIcons[Math.floor(Math.random() * interactionIcons.length)] };
    } else {
      return { type: 'abstract', id: Math.floor(Math.random() * 13) }; // 13 total abstract shapes (8 arcs + 5 engagement)
    }
  }, []);

  const renderContent = () => {
    const iconColor = bgColor === 'bg-zinc-700' ? 'text-zinc-900' : 'text-zinc-500';
    
    if (content.type === 'icon') {
      const Icon = content.data.icon;
      return <Icon size={28} className={`${iconColor} transition-colors duration-300 group-hover:text-white group-hover:scale-110`} />;
    }
    
    if (content.type === 'abstract') {
      const abstractColor = bgColor === 'bg-zinc-700' ? 'bg-black/20' : 'bg-zinc-400/20';
      
      // FIRST 8 CASES - Original arcs (these will appear most frequently)
      switch (content.id) {
        // ORIGINAL ARC SHAPES - Cases 0-7 (8 shapes)
        case 0: return <div className="relative h-full w-full"><div className={`absolute top-0 left-0 h-1/2 w-1/2 rounded-br-full ${abstractColor} group-hover:bg-white/20`} /></div>;
        case 1: return <div className="relative h-full w-full"><div className={`absolute bottom-0 right-0 h-1/2 w-1/2 rounded-tl-full ${abstractColor} group-hover:bg-white/20`} /></div>;
        case 2: return <div className="relative flex items-center justify-center h-full w-full"><div className={`absolute h-3 w-3 rounded-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute h-6 w-6 rounded-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute h-9 w-9 rounded-full border border-zinc-700 group-hover:border-white/50`} /></div>;
        case 3: return <div className="grid grid-cols-3 gap-1 opacity-40 group-hover:opacity-100">{[...Array(9)].map((_, i) => (<div key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:bg-white transition-colors" />))}</div>;
        case 4: return <div className={`h-6 w-6 rotate-45 border-2 border-zinc-700 group-hover:border-white/50`} />;
        case 5: return <div className="relative h-8 w-8"><div className={`absolute inset-0 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} /><div className={`absolute inset-0 rounded-br-full border-2 border-zinc-700 rotate-90 group-hover:border-white/50`} /></div>;
        case 6: return <div className="relative h-8 w-8"><div className={`absolute top-0 left-0 h-5 w-5 rounded-br-full border-2 border-zinc-700 group-hover:border-white/50`} /><div className={`absolute bottom-0 right-0 h-5 w-5 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} /></div>;
        case 7: return <div className="relative h-full w-full"><div className={`absolute top-0 left-0 h-1/3 w-1/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute top-0 left-0 h-2/3 w-2/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute top-0 left-0 h-full w-full rounded-br-full border border-zinc-700 group-hover:border-white/50`} /></div>;
        
        // YOUR FAVORITE ENGAGEMENT SHAPES - Cases 8-12 (5 shapes - reduced to make arcs more prominent)
        // Bar chart / poll results
        case 8: return (
          <div className="flex items-end justify-center gap-1 h-8 w-8">
            <div className="w-2 h-3 bg-zinc-600/50 group-hover:bg-white/70 rounded-t" />
            <div className="w-2 h-5 bg-zinc-600/70 group-hover:bg-white/90 rounded-t" />
            <div className="w-2 h-4 bg-zinc-600/60 group-hover:bg-white/80 rounded-t" />
            <div className="w-2 h-6 bg-zinc-600/80 group-hover:bg-white/100 rounded-t" />
          </div>
        );
        
        // Word cloud / text bubble
        case 9: return (
          <div className="relative h-8 w-8">
            <div className="absolute top-0 left-0 text-[8px] font-bold text-zinc-600/70 group-hover:text-white/90">YES</div>
            <div className="absolute bottom-0 right-0 text-[8px] font-bold text-zinc-600/60 group-hover:text-white/80">NO</div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-600/80 group-hover:text-white/100">?</div>
          </div>
        );
        
        // Multiple choice dots
        case 10: return (
          <div className="grid grid-cols-2 gap-1.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-2.5 w-2.5 rounded-full border border-zinc-600/70 group-hover:border-white/90" />
            ))}
          </div>
        );
        
        // Rising trend / growth
        case 11: return (
          <svg className="h-8 w-8" viewBox="0 0 24 24">
            <polyline points="4 16 8 12 12 14 16 8 20 12" stroke="currentColor" strokeWidth="2" fill="none" className="text-zinc-600/80 group-hover:text-white/100" />
            <circle cx="8" cy="12" r="1.5" fill="currentColor" className="text-zinc-600/70 group-hover:text-white/90" />
            <circle cx="16" cy="8" r="1.5" fill="currentColor" className="text-zinc-600/70 group-hover:text-white/90" />
          </svg>
        );
        
        // Live audience / people
        case 12: return (
          <div className="flex gap-0.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-2 w-2 rounded-full bg-zinc-600/60 group-hover:bg-white/80" />
                <div className="h-3 w-2.5 bg-zinc-600/70 group-hover:bg-white/90 rounded-t-lg mt-0.5" />
              </div>
            ))}
          </div>
        );
        
        // If any ID falls through (shouldn't happen), show a random arc from the original set
        default: {
          const arcId = Math.floor(Math.random() * 8);
          switch (arcId) {
            case 0: return <div className="relative h-full w-full"><div className={`absolute top-0 left-0 h-1/2 w-1/2 rounded-br-full ${abstractColor} group-hover:bg-white/20`} /></div>;
            case 1: return <div className="relative h-full w-full"><div className={`absolute bottom-0 right-0 h-1/2 w-1/2 rounded-tl-full ${abstractColor} group-hover:bg-white/20`} /></div>;
            case 2: return <div className="relative flex items-center justify-center h-full w-full"><div className={`absolute h-3 w-3 rounded-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute h-6 w-6 rounded-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute h-9 w-9 rounded-full border border-zinc-700 group-hover:border-white/50`} /></div>;
            case 3: return <div className="grid grid-cols-3 gap-1 opacity-40 group-hover:opacity-100">{[...Array(9)].map((_, i) => (<div key={i} className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:bg-white transition-colors" />))}</div>;
            case 4: return <div className={`h-6 w-6 rotate-45 border-2 border-zinc-700 group-hover:border-white/50`} />;
            case 5: return <div className="relative h-8 w-8"><div className={`absolute inset-0 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} /><div className={`absolute inset-0 rounded-br-full border-2 border-zinc-700 rotate-90 group-hover:border-white/50`} /></div>;
            case 6: return <div className="relative h-8 w-8"><div className={`absolute top-0 left-0 h-5 w-5 rounded-br-full border-2 border-zinc-700 group-hover:border-white/50`} /><div className={`absolute bottom-0 right-0 h-5 w-5 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} /></div>;
            case 7: return <div className="relative h-full w-full"><div className={`absolute top-0 left-0 h-1/3 w-1/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute top-0 left-0 h-2/3 w-2/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} /><div className={`absolute top-0 left-0 h-full w-full rounded-br-full border border-zinc-700 group-hover:border-white/50`} /></div>;
            default: return null;
          }
        }
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

const DecorativeGrid = () => (
  <div className="grid h-full w-full grid-cols-6 grid-rows-10 gap-px bg-zinc-900/50">
    {[...Array(60)].map((_, i) => <Tile key={i} />)}
  </div>
);

export default function SignInPage() {
  const [isDark, setIsDark] = useState(true);

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-500 ${isDark ? 'bg-zinc-950 selection:bg-indigo-500' : 'bg-zinc-50 selection:bg-indigo-200'}`}>
      
      {/* LEFT SIDE: Sign In Form */}
      <div className={`
        flex w-full flex-col px-8 py-10 lg:w-[480px] xl:w-[540px] lg:px-16 lg:py-16 transition-all duration-500 z-10
        ${isDark 
          ? 'bg-black/40 backdrop-blur-3xl border-r border-zinc-900/50 text-zinc-100' 
          : 'bg-white border-r border-zinc-200 text-zinc-900 shadow-xl'}
      `}>
        
        {/* Top Navigation & Toggle */}
        <div className="mb-20 flex items-center justify-between">
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
          <div className={`mb-8 flex h-14 w-14 items-center justify-center rounded-xl ring-1 shadow-sm transition-colors ${isDark ? 'bg-zinc-900 ring-zinc-800' : 'bg-zinc-50 ring-zinc-200'}`}>
            <div className="relative">
               <div className="absolute -right-1 -top-1 h-2 w-2 bg-indigo-500" />
               <ArrowUpRight size={28} className={isDark ? 'text-zinc-400' : 'text-zinc-600'} />
            </div>
          </div>

          <h1 className={`mb-2 text-[32px] font-bold tracking-tight transition-colors ${isDark ? 'text-white' : 'text-zinc-900'}`}>
            Sign in to your account
          </h1>
          <p className={`mb-10 text-[15px] font-medium transition-colors ${isDark ? 'text-zinc-500' : 'text-zinc-500'}`}>
            Please continue to sign in to your business account
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
          <div className="relative my-10 flex items-center">
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
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className={`h-5 w-5 ${isDark ? 'grayscale opacity-70' : ''}`} alt="Google" />
              Continue with Google
            </button>
            <button className={`flex w-full items-center justify-center gap-3 rounded-xl border py-4 text-[15px] font-bold transition-all active:scale-[0.98]
              ${isDark 
                ? 'border-zinc-800 bg-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700' 
                : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300'}`}>
              <svg className="h-5 w-5 fill-[#5865F2] opacity-80" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03z" />
              </svg>
              Continue with Discord
            </button>
          </div>
        </div>

        <div className="mt-auto pt-10">
          <p className={`text-[11px] font-medium transition-colors ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`}>
            Building the future of engagement. &copy; 2024
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Remains DARK always */}
      <div className="hidden flex-1 lg:block relative bg-black overflow-hidden">
        <div className="absolute inset-0">
           <DecorativeGrid />
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
           <div className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        </div>
      </div>

    </div>
  );
}