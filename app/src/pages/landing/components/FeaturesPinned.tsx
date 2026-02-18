
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { FEATURES } from './constants';

const FeatureUI: React.FC<{ type: string; color: string }> = ({ type, color }) => {
  const renderContent = () => {
    switch (type) {
      case 'quizzes':
        return (
          <div className="w-full h-full flex flex-col p-6 text-slate-900">
            <div className="text-center mb-8">
               <div className={`inline-block px-4 py-1 rounded-full ${color} text-white text-[9px] font-black uppercase tracking-widest mb-4`}>Question 4 of 10</div>
               <h4 className="text-lg font-bold leading-tight">Which layer handles sub-100ms real-time delivery?</h4>
            </div>
            <div className="space-y-3 mb-8">
              {['HTTP/2 Push', 'WebSockets', 'REST Polling', 'Long Polling'].map((opt, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${i === 1 ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200' : 'bg-white border-slate-100'} flex justify-between items-center transition-all`}>
                  <span className={`text-xs font-bold ${i === 1 ? 'text-indigo-700' : 'text-slate-500'}`}>{opt}</span>
                  {i === 1 && <span className="text-indigo-600">✓</span>}
                </div>
              ))}
            </div>
            <div className="mt-auto bg-slate-900 text-white py-4 rounded-2xl text-center font-black text-xs uppercase tracking-[0.2em]">Next Question</div>
          </div>
        );
      case 'polls':
        return (
          <div className="w-full h-full flex flex-col p-6 text-slate-900">
             <div className="text-center mb-10">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Live Results</p>
                <h4 className="text-lg font-bold">Your Preferred Working Model?</h4>
             </div>
             <div className="space-y-6">
                {[
                  { label: 'Fully Remote', val: 74, color: 'bg-emerald-500' },
                  { label: 'Hybrid', val: 42, color: 'bg-slate-200' },
                  { label: 'Office First', val: 12, color: 'bg-slate-200' }
                ].map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase">
                      <span>{item.label}</span>
                      <span className={i === 0 ? 'text-emerald-600' : 'text-slate-400'}>{item.val}%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${item.val}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        );
      case 'qa':
        return (
          <div className="w-full h-full flex flex-col p-6 text-slate-900">
            <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
               <h4 className="text-lg font-bold italic">Q&A Queue</h4>
               <span className="text-[10px] font-black bg-slate-100 px-3 py-1 rounded-full uppercase">12 Pending</span>
            </div>
            <div className="space-y-4">
              {[
                { q: "How do you handle high-traffic spikes?", up: 84 },
                { q: "Can we export data to Salesforce?", up: 32 },
                { q: "Is anonymous voting enabled by default?", up: 18 }
              ].map((item, i) => (
                <div key={i} className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-sm">
                   <div className="flex flex-col items-center">
                      <span className="text-indigo-600">▲</span>
                      <span className="text-xs font-black">{item.up}</span>
                   </div>
                   <p className="text-xs font-medium text-slate-600 leading-snug">{item.q}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Ask a question...
            </div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full flex flex-col p-10 items-center justify-center text-center">
            <div className={`w-20 h-20 rounded-[2rem] ${color} mb-6 flex items-center justify-center shadow-xl shadow-rose-500/20 animate-pulse`}>
               <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h4 className="text-2xl font-display font-bold mb-4">AI Insight Engine</h4>
            <p className="text-sm text-slate-400 font-medium">Summarizing sentiment across 4,200 unique responses...</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full h-full bg-white relative flex flex-col">
      <div className="h-10 border-b border-slate-100 flex items-center justify-center">
         <div className="w-12 h-1 bg-slate-100 rounded-full"></div>
      </div>
      <div className="flex-1 bg-slate-50/30">
        {renderContent()}
      </div>
    </div>
  );
};

const FeaturesPinned: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray('.feature-stack-item');
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: triggerRef.current,
          start: 'top top',
          end: `+=${items.length * 150}%`,
          pin: true,
          scrub: 0.5,
          snap: 1 / (items.length - 1)
        }
      });

      items.forEach((item: any, i) => {
        if (i > 0) {
          tl.from(item, {
            yPercent: 110,
            rotation: 2,
            opacity: 0,
            duration: 1.2,
          }, `f-${i}`)
          .to(items[i - 1] as any, {
            scale: 0.85,
            opacity: 0.2,
            filter: 'blur(10px)',
            duration: 1.2,
          }, `f-${i}`);
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="features" className="bg-slate-950 py-0 relative">
      <div ref={triggerRef} className="h-screen relative overflow-hidden flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,_rgba(99,102,241,0.15),transparent_60%)]"></div>
        
        <div className="max-w-7xl mx-auto w-full h-[85vh] relative perspective-[2000px]">
          {FEATURES.map((feature, index) => (
            <div 
              key={feature.id} 
              className="feature-stack-item absolute inset-0 bg-slate-900/60 backdrop-blur-3xl rounded-[4rem] p-8 md:p-20 flex flex-col md:flex-row items-center gap-16 overflow-hidden border border-white/10 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.8)]"
            >
              <div className="w-full md:w-1/2 z-10 text-left">
                <div className="flex items-center space-x-6 mb-12">
                  <span className="text-indigo-400 font-black text-2xl tracking-tighter">0{index + 1}</span>
                  <div className="h-[2px] w-16 bg-gradient-to-r from-indigo-500 to-transparent"></div>
                  <span className="text-slate-500 font-bold text-xs uppercase tracking-[0.4em]">Interactive Core</span>
                </div>
                
                <h3 className="text-6xl md:text-8xl font-display text-white mb-10 leading-[0.85] tracking-tighter">{feature.title}</h3>
                <p className="text-xl md:text-2xl text-slate-400 mb-14 leading-relaxed font-light max-w-lg">
                  {feature.description}
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feature.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center space-x-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all hover:translate-x-2 group cursor-default">
                      <div className={`w-2.5 h-2.5 rounded-full ${feature.color} shadow-[0_0_15px_rgba(255,255,255,0.4)]`}></div>
                      <span className="text-xs font-black tracking-widest uppercase text-white/80">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="w-full md:w-1/2 h-full flex items-center justify-center relative">
                {/* Conceptual Interaction Phone Frame */}
                <div className="w-64 md:w-80 aspect-[9/19] bg-slate-950 rounded-[4rem] p-3 border-[8px] border-slate-800/50 shadow-3xl overflow-hidden transform rotate-2">
                   <div className="w-full h-full rounded-[3rem] overflow-hidden">
                      <FeatureUI type={feature.id} color={feature.color} />
                   </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute -z-10 w-[120%] h-[120%] bg-indigo-500/10 blur-[100px] rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesPinned;
