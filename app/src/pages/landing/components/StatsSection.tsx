
import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { STATS } from './constants';

const StatsSection: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.stat-box', {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        y: 40,
        opacity: 0,
        stagger: 0.1,
        duration: 1,
        ease: 'power3.out'
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-20">
          <div className="max-w-md">
            <h2 className="text-4xl md:text-5xl font-display text-slate-950 mb-6 leading-tight">Built for scale, tuned for performance.</h2>
            <p className="text-lg text-slate-500 font-light">
              We leverage modern WebSockets and a global edge network to ensure your audience experiences zero lag, whether there are 10 or 10,000 of them.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
            {STATS.map((stat, idx) => (
              <div key={idx} className="stat-box bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 transition-all duration-500">
                <div className="text-5xl font-display font-bold text-slate-950 mb-2">
                  {stat.value}<span className="text-indigo-600 text-3xl ml-0.5">{stat.suffix}</span>
                </div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
