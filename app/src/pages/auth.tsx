import React, { useMemo } from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  BarChart2,    // Polls
  CheckSquare,  // Quizzes
  Heart,        // Reactions
  MessageSquare,// Live Chat
  Zap,          // Live/Instant
  Users,        // Community
  Vote,         // Voting
  Hash          // Contexts
} from 'lucide-react';

type IconContent = {
  type: 'icon';
  data: {
    icon: React.ElementType;
    label: string;
  };
};

type AbstractContent = {
  type: 'abstract';
  id: number;
};

type EmptyContent = {
  type: 'empty';
};

type TileContent = IconContent | AbstractContent | EmptyContent;

const Tile = () => {
  // Weighted color selection favoring deep blacks
  const bgColor = useMemo(() => {
    const rand = Math.random();
    if (rand > 0.98) return 'bg-zinc-200'; // Very rare light accent
    if (rand > 0.85) return 'bg-zinc-800'; 
    if (rand > 0.60) return 'bg-zinc-900'; 
    return 'bg-black';
  }, []);

  const interactionIcons = [
    { icon: BarChart2, label: 'Poll' },
    { icon: CheckSquare, label: 'Quiz' },
    { icon: Heart, label: 'React' },
    { icon: MessageSquare, label: 'Chat' },
    { icon: Zap, label: 'Live' },
    { icon: Users, label: 'Groups' },
    { icon: Vote, label: 'Vote' },
    { icon: Hash, label: 'Topic' }
  ];

  // Determine if this tile shows an interaction icon or an abstract shape
  const content = useMemo((): TileContent => {
    const rand = Math.random();
    if (rand > 0.7) {
      return { 
        type: 'icon', 
        data: interactionIcons[Math.floor(Math.random() * interactionIcons.length)] 
      };
    } else if (rand > 0.2) {
      return { 
        type: 'abstract', 
        id: Math.floor(Math.random() * 8) 
      };
    }
    return { type: 'empty' };
  }, []);

  const renderContent = () => {
    const iconColor = bgColor === 'bg-zinc-200' ? 'text-zinc-900' : 'text-zinc-500';
    
    if (content.type === 'icon') {
      const Icon = content.data.icon;
      return <Icon size={20} className={`${iconColor} transition-colors duration-300 group-hover:text-white group-hover:scale-110`} />;
    }

    if (content.type === 'abstract') {
      const abstractColor = bgColor === 'bg-zinc-200' ? 'bg-black/20' : 'bg-zinc-400/20';
      
      switch (content.id) {
        // Quarter-circles
        case 0: 
          return (
            <div className="relative h-full w-full">
              <div className={`absolute top-0 left-0 h-1/2 w-1/2 rounded-br-full ${abstractColor} group-hover:bg-white/20`} />
            </div>
          );
        case 1: 
          return (
            <div className="relative h-full w-full">
              <div className={`absolute bottom-0 right-0 h-1/2 w-1/2 rounded-tl-full ${abstractColor} group-hover:bg-white/20`} />
            </div>
          );
        
        // Concentric rings
        case 2:
          return (
            <div className="relative flex items-center justify-center h-full w-full">
              <div className={`absolute h-3 w-3 rounded-full border border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute h-6 w-6 rounded-full border border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute h-9 w-9 rounded-full border border-zinc-700 group-hover:border-white/50`} />
            </div>
          );
        
        // Dot grid
        case 3:
          return (
            <div className="grid grid-cols-3 gap-1 opacity-40 group-hover:opacity-100">
              {[...Array(9)].map((_, i) => (
                <div 
                  key={i} 
                  className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:bg-white transition-colors" 
                />
              ))}
            </div>
          );
        
        // Rotated diamond
        case 4:
          return (
            <div className={`h-6 w-6 rotate-45 border-2 border-zinc-700 group-hover:border-white/50`} />
          );
        
        // Leaf shape (overlapping arcs)
        case 5:
          return (
            <div className="relative h-8 w-8">
              <div className={`absolute inset-0 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute inset-0 rounded-br-full border-2 border-zinc-700 rotate-90 group-hover:border-white/50`} />
            </div>
          );
        
        // Another leaf variation
        case 6:
          return (
            <div className="relative h-8 w-8">
              <div className={`absolute top-0 left-0 h-5 w-5 rounded-br-full border-2 border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute bottom-0 right-0 h-5 w-5 rounded-tl-full border-2 border-zinc-700 group-hover:border-white/50`} />
            </div>
          );
        
        // Concentric quarter-circles
        case 7:
          return (
            <div className="relative h-full w-full">
              <div className={`absolute top-0 left-0 h-1/3 w-1/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute top-0 left-0 h-2/3 w-2/3 rounded-br-full border border-zinc-700 group-hover:border-white/50`} />
              <div className={`absolute top-0 left-0 h-full w-full rounded-br-full border border-zinc-700 group-hover:border-white/50`} />
            </div>
          );
        
        default: 
          return <div className={`h-px w-8 ${abstractColor} rotate-45 group-hover:bg-white/50`} />;
      }
    }
    return null;
  };

  return (
    <div className={`
      group relative flex items-center justify-center overflow-hidden 
      ${bgColor} transition-all duration-500 cursor-crosshair
      hover:bg-indigo-600 hover:z-20 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)]
    `}>
      {renderContent()}
    </div>
  );
};

const DecorativeGrid = () => {
  return (
    <div className="grid h-full w-full grid-cols-6 grid-rows-10 gap-px bg-zinc-900/50">
      {[...Array(60)].map((_, i) => (
        <Tile key={i} />
      ))}
    </div>
  );
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-zinc-950 font-sans text-zinc-100 selection:bg-indigo-500 selection:text-white">
      
      {/* LEFT SIDE: Sign In Form */}
      <div className="flex w-full flex-col px-8 py-10 lg:w-[480px] xl:w-[540px] lg:px-16 lg:py-16 bg-black/40 backdrop-blur-3xl border-r border-zinc-900/50 z-10">
        
        <button className="mb-20 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 transition-colors hover:text-indigo-400">
          <ArrowLeft size={14} strokeWidth={3} />
          Return to Home
        </button>

        <div className="mx-auto flex w-full max-w-sm flex-col justify-center">
          <div className="group mb-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800 transition-all hover:bg-indigo-600 hover:border-indigo-500">
             <ArrowUpRight size={28} className="text-zinc-400 transition-colors group-hover:text-white" strokeWidth={2.5} />
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Sign In 
          </h1>
          <p className="mb-10 text-[15px] font-medium text-zinc-500 leading-relaxed">
            Access your workspace and creative tools.
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Identity</label>
              <input 
                type="email" 
                placeholder="you@interaction.app"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900/30 px-5 py-4 text-[15px] outline-none transition-all focus:border-indigo-500/50 focus:bg-zinc-900/80 focus:ring-4 focus:ring-indigo-500/10"
              />
            </div>

            <button className="w-full rounded-xl bg-white py-4 text-[15px] font-bold text-black transition-all hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98]">
              Continue
            </button>
          </form>

          <div className="relative my-12 flex items-center">
            <div className="flex-grow border-t border-zinc-900"></div>
            <span className="px-5 text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-700">Or Access With</span>
            <div className="flex-grow border-t border-zinc-900"></div>
          </div>

          <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-transparent py-4 text-[15px] font-bold text-zinc-400 transition-all hover:bg-zinc-900 hover:text-zinc-100 hover:border-zinc-700 active:scale-[0.98]">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-4 w-4 grayscale opacity-70 group-hover:opacity-100" alt="Google" />
            Continue with Google
          </button>
        </div>

        <div className="mt-auto pt-10">
          <p className="text-[11px] text-zinc-600 font-medium">
            Building the future of engagement. &copy; 2024
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Enhanced Abstract Grid */}
      <div className="hidden flex-1 lg:block relative bg-black overflow-hidden">
        <div className="absolute inset-0">
           <DecorativeGrid />
           
           {/* Dynamic light overlays for depth */}
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent" />
           <div className="pointer-events-none absolute -inset-[10%] bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05)_0%,transparent_50%)]" />
           
           {/* Additional gradient overlays for depth */}
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
           <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />
        </div>
      </div>

    </div>
  );
};