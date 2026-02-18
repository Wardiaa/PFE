
import React from 'react';

const steps = [
  {
    title: "1. The Creative",
    subtitle: "Define Your Session.",
    desc: "Build timed quizzes, word clouds, or open-ended polls in our intuitive host dashboard. Sub-100ms latency ensures your audience sees changes instantly.",
    accent: "text-indigo-600",
    img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop"
  },
  {
    title: "2. The Connection",
    subtitle: "No Friction, Just Entry.",
    desc: "A unique code or a QR scan is all it takes. No apps to download, no accounts to create. Your audience joins the conversation in two seconds flat.",
    accent: "text-rose-500",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop"
  },
  {
    title: "3. The Interaction",
    subtitle: "Live Action, Live Results.",
    desc: "Watch insights evolve as your audience votes. Results are beautifully visualized in real-time on your screen and theirs.",
    accent: "text-emerald-500",
    img: "https://images.unsplash.com/photo-1551288049-bbbda536339a?q=80&w=2070&auto=format&fit=crop"
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-48 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-8">
          <div className="max-w-3xl">
            <h2 className="text-6xl md:text-8xl font-display text-slate-950 mb-8 leading-[0.9]">Turn Silence <br /> <span className="text-indigo-600 italic">Into Energy.</span></h2>
            <p className="text-2xl text-slate-500 font-light leading-relaxed">The three-step flow to complete engagement.</p>
          </div>
          <div className="hidden lg:flex space-x-2">
             <div className="w-20 h-20 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-200 font-black text-2xl">01</div>
             <div className="w-20 h-20 rounded-full border-2 border-slate-100 flex items-center justify-center text-slate-200 font-black text-2xl">02</div>
             <div className="w-20 h-20 rounded-full border-2 border-slate-950 flex items-center justify-center text-slate-950 font-black text-2xl">03</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          <div className="hidden md:block absolute top-10 left-0 w-full h-[1px] bg-slate-100 -z-10"></div>
          
          {steps.map((step, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden mb-12 shadow-2xl border border-slate-100 group-hover:shadow-indigo-500/20 transition-all duration-700">
                <img src={step.img} alt={step.title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute bottom-8 left-8 right-8 text-white translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">{step.subtitle}</p>
                   <p className="text-sm font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
              <h4 className={`text-[11px] font-black uppercase tracking-[0.5em] mb-4 ${step.accent}`}>Phase 0{idx + 1}</h4>
              <h3 className="text-4xl font-display text-slate-950 mb-6 leading-none tracking-tighter">{step.title}</h3>
              <p className="text-lg text-slate-500 leading-relaxed font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-48 text-center border-t border-slate-100 pt-32">
          <p className="text-5xl md:text-7xl font-display text-slate-200 italic max-w-5xl mx-auto leading-tight selection:text-indigo-600">
            "Your presentation is no longer a <span className="text-slate-950">monologue</span>. It's a <span className="text-indigo-600">shared discovery</span>."
          </p>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
