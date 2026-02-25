import React from 'react';
import { ArrowLeft, ArrowUpRight, Github } from 'lucide-react';

// A helper to generate the geometric shapes for the decorative side
const DecorativeGrid = () => {
  const shapes = [
    'rounded-full', 'rounded-none', 'rounded-tr-full', 'rounded-bl-full', 
    'polygon-tri', 'grid-dots', 'diamond'
  ];
  const colors = ['bg-zinc-900', 'bg-zinc-800', 'bg-zinc-700', 'bg-zinc-950', 'bg-zinc-600', 'bg-white/10'];

  return (
    <div className="grid h-full w-full grid-cols-6 grid-rows-8 gap-1 p-1">
      {[...Array(48)].map((_, i) => {
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Specific logic to match the "hero" logo look in the center-right
        if (i === 27) return (
          <div key={i} className="flex items-center justify-center bg-zinc-800 rounded-none">
            <div className="relative h-8 w-8 text-zinc-400">
               <ArrowUpRight size={32} />
            </div>
          </div>
        );

        return (
          <div 
            key={i} 
            className={`${randomColor} ${randomShape === 'rounded-full' ? 'rounded-full' : ''} 
            ${randomShape === 'rounded-tr-full' ? 'rounded-tr-[100%]' : ''}
            ${randomShape === 'rounded-bl-full' ? 'rounded-bl-[100%]' : ''}
            flex items-center justify-center transition-opacity hover:opacity-80`}
          >
            {randomShape === 'grid-dots' && (
              <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, j) => <div key={j} className="h-1 w-1 rounded-full bg-zinc-500" />)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen bg-white font-sans text-zinc-950">
      
      {/* LEFT SIDE: Sign In Form */}
      <div className="flex w-full flex-col px-8 py-10 lg:w-[45%] lg:px-20 lg:py-16">
        
        {/* Back navigation */}
        <button className="mb-20 flex items-center gap-2 text-sm font-semibold text-zinc-900 transition-colors hover:text-zinc-500">
          <ArrowLeft size={16} strokeWidth={3} />
          Back to home
        </button>

        <div className="mx-auto flex w-full max-w-sm flex-col justify-center">
          
          {/* Stylized Logo Icon */}
          <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl bg-white ring-1 ring-zinc-100 shadow-sm">
            <div className="relative">
               <div className="absolute -right-1 -top-1 h-2 w-2 bg-zinc-950" />
               <ArrowUpRight size={24} className="text-zinc-950" />
            </div>
          </div>

          <h1 className="mb-2 text-[32px] font-bold tracking-tight text-zinc-900">
            Sign in to your account
          </h1>
          <p className="mb-10 text-[15px] font-medium text-zinc-500">
            Please continue to sign in to your business account
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-1.5">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="w-full rounded-xl border border-zinc-200 bg-white px-5 py-4 text-[15px] outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
              />
            </div>

            <button className="w-full rounded-xl bg-zinc-950 py-4 text-[15px] font-bold text-white transition-all hover:bg-zinc-800 active:scale-[0.98]">
              Continue
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-10 flex items-center">
            <div className="flex-grow border-t border-zinc-100"></div>
            <span className="px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-300">Or</span>
            <div className="flex-grow border-t border-zinc-100"></div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-4 text-[15px] font-bold transition-all hover:bg-zinc-50 active:scale-[0.98]">
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />
              Continue with Google
            </button>
            <button className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white py-4 text-[15px] font-bold transition-all hover:bg-zinc-50 active:scale-[0.98]">
              <svg className="h-5 w-5 fill-[#5865F2]" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03z" />
              </svg>
              Continue with Discord
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Decorative Geometric Grid */}
      <div className="hidden h-screen flex-1 p-6 lg:block">
        <div className="h-full w-full overflow-hidden rounded-[40px] bg-zinc-950">
           <DecorativeGrid />
        </div>
      </div>

    </div>
  );
}