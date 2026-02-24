import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, BarChart3, Users, Zap } from 'lucide-react';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      // Text and Button Animations
      tl.fromTo('.reveal-hero', 
        { y: 120, opacity: 0, rotateX: -20 }, 
        { y: 0, opacity: 1, rotateX: 0, duration: 1.8, stagger: 0.1, delay: 0.2 }
      )
      .fromTo('.hero-fade', 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 1 }, 
        '-=1.2'
      );

      // Device Entry Animations
      tl.fromTo('.host-device', 
        { y: 100, opacity: 0, scale: 0.95, rotateX: 10 }, 
        { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 2, ease: 'power3.out' }, 
        '-=1.5'
      )
      .fromTo('.phone-device', 
        { y: 150, opacity: 0, scale: 0.8, rotate: -5 }, 
        { y: 0, opacity: 1, scale: 1, rotate: 0, duration: 2.2, ease: 'elastic.out(1, 0.75)' }, 
        '-=1.8'
      );

      // UI Float Animations inside phone
      gsap.to('.float-ui', {
        y: -10,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        stagger: { amount: 1, from: 'random' }
      });
      
      // Live Reaction Bubbles
      gsap.to('.reaction-bubble', {
        y: -100,
        opacity: 0,
        duration: 2,
        stagger: { amount: 2, repeat: -1 },
        ease: 'power1.out'
      });

    }, containerRef);

    // Mouse Parallax Effect
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { clientX, clientY } = e;
      const xPos = (clientX / window.innerWidth - 0.5);
      const yPos = (clientY / window.innerHeight - 0.5);

      gsap.to('.host-device', {
        x: xPos * -30,
        y: yPos * -20,
        rotationY: xPos * -5,
        duration: 1,
        ease: 'power2.out'
      });

      gsap.to('.phone-device', {
        x: xPos * -60, // Moves faster for depth
        y: yPos * -40,
        rotationY: xPos * -10,
        duration: 1,
        ease: 'power2.out'
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      ctx.revert();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-[110vh] pt-48 pb-32 px-6 flex flex-col items-center overflow-hidden bg-white">
      {/* Abstract Background Accents */}
      <div className="absolute top-[10%] left-[20%] w-[50vw] h-[50vw] bg-indigo-50/50 rounded-full blur-[140px] -z-10"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-rose-50/40 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-6xl mx-auto text-center z-10 mb-20">
        <div className="hero-fade inline-flex items-center space-x-2 px-6 py-2 mb-12 rounded-full border border-slate-200 bg-white/50 backdrop-blur shadow-sm text-[10px] font-black uppercase tracking-[0.4em] text-slate-900">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Zero Friction • Sub-100ms Latency</span>
        </div>
        
        <h1 className="text-[clamp(3.5rem,10vw,8.5rem)] font-display text-slate-950 leading-[0.8] mb-14 tracking-tighter text-balance">
          <div className="overflow-hidden">
            <span className="reveal-hero inline-block">The New Standard</span>
          </div>
          <div className="overflow-hidden">
            <span className="reveal-hero inline-block text-indigo-600 italic">Of Participation.</span>
          </div>
        </h1>
        
        <p className="hero-fade text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto mb-14 leading-relaxed font-medium">
          Create, share, and engage. Present from your laptop while your audience joins on their phones instantly. No apps. No accounts. No lag.
        </p>
        
        <div className="hero-fade flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/create" className="group w-full sm:w-auto">
            <button className="w-full sm:w-auto px-10 py-5 bg-slate-950 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all shadow-[0_20px_40px_-15px_rgba(2,6,23,0.3)] hover:shadow-indigo-500/20 hover:-translate-y-1 flex items-center justify-center gap-2">
              Start Hosting
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </Link>
          <Link to="/audience-participation" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto px-10 py-5 bg-white text-slate-950 border border-slate-200 rounded-full font-bold text-lg hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500 fill-indigo-500" />
              Join Session
            </button>
          </Link>
        </div>
      </div>

      {/* 3D Scene Wrapper */}
      <div className="relative w-full max-w-[90rem] mx-auto mt-6 perspective-[2500px] group pointer-events-none">
        
        {/* HOST DEVICE (LAPTOP) */}
        <div className="host-device relative z-10 w-[85%] max-w-5xl mx-auto rounded-[2.5rem] bg-white p-2 md:p-4 shadow-2xl border border-slate-200/60 ring-1 ring-slate-950/5">
          {/* Laptop Screen */}
          <div className="bg-slate-900 rounded-[2rem] overflow-hidden aspect-[16/10] relative shadow-inner">
            <img 
              src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-60 mix-blend-overlay" 
              alt="Dashboard"
            />
            {/* Laptop UI Overlay */}
            <div className="absolute inset-0 p-8 md:p-12 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  <span className="text-white font-mono text-xs uppercase tracking-widest">Live: Q3 Strategy</span>
                </div>
                <div className="bg-indigo-600 px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                   <Users className="w-4 h-4 text-white" />
                   <span className="text-white font-bold text-sm">1,204</span>
                </div>
              </div>
              <div className="mt-auto">
                <h3 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">How do we prioritize?</h3>
                <div className="flex gap-4">
                  <div className="h-4 w-2/3 bg-indigo-500 rounded-full shadow-[0_0_20px_rgba(99,102,241,0.5)]"></div>
                  <div className="h-4 w-1/4 bg-white/20 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHONE DEVICE - The "Real" One */}
        <div className="phone-device absolute -bottom-16 right-[5%] md:right-[15%] w-[280px] md:w-[320px] z-30 pointer-events-auto">
          {/* 1. Outer Chassis with Depth Shadows */}
          <div className="relative rounded-[3.5rem] bg-[#1a1a1a] shadow-[0_0_0_4px_#333,0_0_0_8px_#1a1a1a,0_30px_60px_-10px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(0,0,0,0.8)] border border-slate-800">
            
            {/* 2. Hardware Buttons */}
            <div className="absolute -left-[9px] top-28 w-[9px] h-10 bg-[#2a2a2a] rounded-l-md shadow-sm border-l border-t border-b border-slate-700"></div> {/* Volume Up */}
            <div className="absolute -left-[9px] top-40 w-[9px] h-10 bg-[#2a2a2a] rounded-l-md shadow-sm border-l border-t border-b border-slate-700"></div> {/* Volume Down */}
            <div className="absolute -right-[9px] top-32 w-[9px] h-16 bg-[#2a2a2a] rounded-r-md shadow-sm border-r border-t border-b border-slate-700"></div> {/* Power */}

            {/* 3. Screen Bezel & Container */}
            <div className="relative m-[10px] rounded-[3rem] bg-black overflow-hidden border-[6px] border-black h-[620px]">
              
              {/* 4. Dynamic Island / Notch Area */}
              <div className="absolute top-0 left-0 right-0 h-8 z-50 flex justify-center pt-2">
                <div className="w-28 h-7 bg-black rounded-full flex items-center justify-end pr-2 gap-2">
                   <div className="w-2 h-2 rounded-full bg-[#1a1a1a] shadow-inner"></div>
                </div>
              </div>

              {/* 5. Glass Reflection Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent z-40 pointer-events-none rounded-[2.8rem]"></div>

              {/* 6. ACTUAL APP UI */}
              <div className="w-full h-full bg-slate-50 flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="pt-12 pb-4 px-6 bg-white border-b border-slate-100 flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">JD</div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Participant</span>
                        <span className="text-xs font-bold text-slate-900 leading-none">John Doe</span>
                      </div>
                   </div>
                   <div className="flex gap-1">
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                      <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                   </div>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 flex flex-col justify-center relative">
                   {/* Background floating particles */}
                   <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <div className="reaction-bubble absolute bottom-0 left-[20%] text-xl">❤️</div>
                      <div className="reaction-bubble absolute bottom-0 right-[20%] text-xl">👍</div>
                      <div className="reaction-bubble absolute bottom-0 left-[50%] text-xl">🔥</div>
                   </div>

                   <div className="float-ui mb-6">
                      <div className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full inline-block mb-3 shadow-lg shadow-indigo-500/30">
                        LIVE POLL
                      </div>
                      <h4 className="text-xl font-bold text-slate-900 leading-tight mb-6">
                        Which feature should we ship next?
                      </h4>

                      <div className="space-y-3">
                         {/* Option 1 (Selected) */}
                         <button className="w-full p-1 rounded-2xl bg-white border-2 border-indigo-500 shadow-xl shadow-indigo-100 transition-transform active:scale-95 group relative overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-0 bg-indigo-50 w-[72%] z-0"></div>
                            <div className="relative z-10 flex justify-between items-center p-3">
                               <span className="font-bold text-indigo-900 text-sm">Dark Mode</span>
                               <span className="font-bold text-indigo-600 text-sm">72%</span>
                            </div>
                         </button>

                         {/* Option 2 */}
                         <button className="w-full p-1 rounded-2xl bg-white border border-slate-200 transition-transform active:scale-95 group relative overflow-hidden">
                            <div className="absolute top-0 bottom-0 left-0 bg-slate-50 w-[28%] z-0"></div>
                            <div className="relative z-10 flex justify-between items-center p-3">
                               <span className="font-medium text-slate-600 text-sm">API Access</span>
                               <span className="font-medium text-slate-400 text-sm">28%</span>
                            </div>
                         </button>
                      </div>
                   </div>
                </div>

                {/* Floating Action / Footer */}
                <div className="px-6 pb-8 pt-4 bg-white/80 backdrop-blur border-t border-slate-100">
                   <button className="float-ui w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-sm shadow-lg shadow-slate-900/20 active:scale-95 transition-transform flex items-center justify-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Wait for Results...
                   </button>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-300 rounded-full z-50"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;