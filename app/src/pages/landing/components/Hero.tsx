import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowRight, BarChart3, Users, Zap } from 'lucide-react';
import { ContainerScroll } from '../../../components/ui/container-scroll-animation';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

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

      // UI Float Animations inside phone content
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

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen pt-48 pb-32 px-6 flex flex-col items-center overflow-hidden bg-white">
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

      {/* 3D Scroll Animation Wrapper - Phone content inside the scrollable device */}
      <div className="w-full">
        <ContainerScroll
          titleComponent={
            <>
              <h1 className="text-4xl font-semibold text-black dark:text-white">
                Experience the future of
                <br />
                <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none text-indigo-600">
                  Live Participation
                </span>
              </h1>
            </>
          }
        >
          {/* PHONE CONTENT UI - This is what appears inside the scrollable device */}
          <div className="w-full h-full bg-slate-50 flex flex-col relative overflow-hidden rounded-2xl">
            
            {/* Header - Phone style */}
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

            {/* Body - Poll UI */}
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
        </ContainerScroll>
      </div>
    </section>
  );
};

export default Hero;