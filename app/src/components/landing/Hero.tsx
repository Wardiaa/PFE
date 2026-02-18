
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';

const Hero: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });

      tl.fromTo('.reveal-hero', 
        { y: 150, opacity: 0, rotate: 2 }, 
        { y: 0, opacity: 1, rotate: 0, duration: 2, stagger: 0.1, delay: 0.3 }
      )
      .fromTo('.hero-fade', 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 1.2 }, 
        '-=1.5'
      )
      .fromTo('.host-device', 
        { x: -100, opacity: 0, rotateY: 15 }, 
        { x: 0, opacity: 1, rotateY: 0, duration: 2.5 }, 
        '-=1.8'
      )
      .fromTo('.phone-device', 
        { x: 100, opacity: 0, scale: 0.8, rotateY: -15 }, 
        { x: 0, opacity: 1, scale: 1, rotateY: 0, duration: 2.5 }, 
        '-=2.2'
      );

      gsap.to('.float-ui', {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        stagger: 0.4
      });
    }, containerRef);

    return () => ctx.revert();
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
        
        <div className="hero-fade flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link to="/create">
            <button className="magnetic-btn w-full sm:w-auto px-12 py-6 bg-slate-950 text-white rounded-full font-bold text-lg hover:bg-indigo-600 transition-all shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-indigo-500/40">
              Host a Session
            </button>
          </Link>
          <Link to="/audience-participation">
            <button className="magnetic-btn w-full sm:w-auto px-12 py-6 bg-white text-slate-950 border-2 border-slate-100 rounded-full font-bold text-lg hover:border-slate-300 transition-all">
              Join with Code
            </button>
          </Link>
        </div>
      </div>

      <div className="relative w-full max-w-7xl mx-auto mt-10 flex justify-center perspective-[2000px]">
        {/* Host Mockup (Laptop View) */}
        <div className="host-device relative z-10 w-full max-w-5xl rounded-[3rem] p-4 bg-slate-100/40 backdrop-blur border border-slate-200/50 shadow-2xl">
          <div className="bg-white rounded-[2.2rem] overflow-hidden border border-slate-200 aspect-[16/9] relative">
            <img 
              src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop" 
              className="w-full h-full object-cover opacity-90" 
              alt="Host Dashboard"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 to-transparent"></div>
            
            {/* Conceptual UI Overlay */}
            <div className="absolute top-8 left-8 flex space-x-3">
              <div className="bg-indigo-600 px-5 py-2 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-xl">Live Session: A1-9B</div>
              <div className="bg-white/95 px-5 py-2 rounded-xl text-[10px] font-black text-slate-950 uppercase tracking-widest border border-slate-200 shadow-xl">1,429 Participants</div>
            </div>
          </div>
        </div>

        {/* Participant Mockup (Phone View) */}
        <div className="phone-device absolute -bottom-12 right-4 md:right-20 w-56 md:w-80 aspect-[9/19] bg-slate-950 rounded-[4rem] p-4 border-[10px] border-slate-900 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.5)] z-20">
          <div className="w-full h-full bg-slate-50 rounded-[3rem] overflow-hidden flex flex-col relative">
            <div className="h-16 bg-white flex items-center justify-between px-8 border-b border-slate-100">
               <div className="w-6 h-6 rounded-lg bg-indigo-600"></div>
               <div className="w-12 h-2 bg-slate-100 rounded-full"></div>
            </div>
            
            <div className="flex-1 p-8 flex flex-col justify-center">
               <div className="float-ui bg-white p-6 rounded-3xl shadow-xl border border-slate-100 mb-6">
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Active Poll</p>
                  <p className="text-sm font-bold text-slate-950 mb-4 text-balance leading-tight">What should our main focus be this quarter?</p>
                  <div className="space-y-2">
                     <div className="w-full h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center px-4">
                        <span className="text-xs font-bold text-indigo-700">Scaling Infrastructure</span>
                     </div>
                     <div className="w-full h-10 rounded-xl bg-slate-100 flex items-center px-4">
                        <span className="text-xs font-bold text-slate-400">User Experience</span>
                     </div>
                  </div>
               </div>
               
               <div className="float-ui bg-indigo-600 py-4 rounded-2xl text-center text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-200">
                  Submit Vote
               </div>
            </div>
            
            <div className="h-12 bg-white border-t border-slate-100 flex items-center justify-center">
               <div className="w-16 h-1.5 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
