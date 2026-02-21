import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- Types & Data ---
const steps = [
  {
    id: "01",
    title: "The Creative",
    subtitle: "Define Your Session",
    desc: "Build timed quizzes, word clouds, or open-ended polls in our intuitive host dashboard. Sub-100ms latency ensures your audience sees changes instantly.",
    color: "#6366f1", // Indigo
    gradient: "from-indigo-500 via-purple-500 to-indigo-500",
    img: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: "02",
    title: "The Connection",
    subtitle: "No Friction, Just Entry",
    desc: "A unique code or a QR scan is all it takes. No apps to download, no accounts to create. Your audience joins the conversation in two seconds flat.",
    color: "#f43f5e", // Rose
    gradient: "from-rose-500 via-orange-500 to-rose-500",
    img: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=2032&auto=format&fit=crop"
  },
  {
    id: "03",
    title: "The Interaction",
    subtitle: "Live Action, Live Results",
    desc: "Watch insights evolve as your audience votes. Results are beautifully visualized in real-time on your screen and theirs.",
    color: "#10b981", // Emerald
    gradient: "from-emerald-400 via-teal-500 to-emerald-400",
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
  }
];

// --- Sub-Components ---

const StepCard = ({ step, index }: { step: typeof steps[0], index: number }) => {
  const isEven = index % 2 === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 100 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-12 lg:gap-20 relative z-10 mb-32 last:mb-0`}
    >
      {/* --- Image Section --- */}
      <div className="w-full lg:w-1/2 group perspective-1000">
        <div className="relative">
            {/* Glow Behind */}
            <div 
              className="absolute -inset-4 rounded-full opacity-20 blur-3xl transition-all duration-1000 group-hover:opacity-40"
              style={{ background: step.color }}
            ></div>

            {/* Main Card */}
            <motion.div 
              whileHover={{ rotateY: isEven ? 5 : -5, scale: 1.02 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-slate-900 aspect-[4/3]"
            >
              {/* Image with overlay */}
              <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
              <img 
                src={step.img} 
                alt={step.title} 
                className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-1000 ease-out"
              />
              
              {/* Glass UI Badge */}
              <div className="absolute bottom-6 left-6 z-20 overflow-hidden rounded-lg border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2">
                 <p className="text-xs font-mono text-white/90 uppercase tracking-widest">
                   Phase {step.id}
                 </p>
              </div>
            </motion.div>
        </div>
      </div>

      {/* --- Text Section --- */}
      <div className="w-full lg:w-1/2 relative">
        {/* Decorative Number */}
        <motion.span 
          initial={{ opacity: 0, x: isEven ? -50 : 50 }}
          whileInView={{ opacity: 0.1, x: 0 }}
          transition={{ duration: 1 }}
          className="absolute -top-20 left-0 text-[10rem] font-black text-white pointer-events-none select-none -z-10 leading-none"
        >
          {step.id}
        </motion.span>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="h-[1px] w-12 bg-slate-500"></span>
            <span 
              className="text-sm font-bold uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r"
              style={{ backgroundImage: `linear-gradient(to right, ${step.color}, white)` }}
            >
              {step.subtitle}
            </span>
          </div>

          <h3 className="text-4xl md:text-5xl font-bold text-white leading-[1.1]">
            {step.title}
          </h3>

          <p className="text-lg text-slate-400 leading-relaxed max-w-lg">
            {step.desc}
          </p>

          <motion.button 
            whileHover={{ x: 10 }}
            className="group flex items-center gap-2 text-white font-medium mt-4"
          >
            <span style={{ color: step.color }}>Explore features</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

const HowItWorksAnimated: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  return (
    <section ref={containerRef}  id="how-it-works" className="py-32 bg-slate-950 relative overflow-hidden">
      
      {/* Moving Background Elements (Parallax) */}
      <motion.div style={{ y, opacity }} className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/3 -right-20 w-[600px] h-[600px] bg-rose-600/10 rounded-full blur-[128px]" />
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-40">
          <motion.div 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="inline-block mb-4 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm"
          >
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">The Workflow</span>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
          >
            Turn Silence <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Into Energy.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-slate-400 max-w-2xl mx-auto"
          >
            Engagement isn't magic. It's a system. Here is how we automated the crowd.
          </motion.p>
        </div>

        {/* The Connector Line (Draws as you scroll) */}
        <div className="absolute left-6 lg:left-1/2 top-40 bottom-40 w-px bg-slate-800 hidden lg:block">
            <motion.div 
                style={{ scaleY: scrollYProgress, transformOrigin: "top" }}
                className="w-full h-full bg-gradient-to-b from-indigo-500 via-rose-500 to-emerald-500"
            />
        </div>

        {/* Steps Loop */}
        <div className="flex flex-col">
          {steps.map((step, idx) => (
            <StepCard key={idx} step={step} index={idx} />
          ))}
        </div>

        {/* Footer Statement */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-32 text-center border-t border-white/10 pt-24"
        >
          <p className="text-2xl md:text-4xl font-light text-slate-300">
            Your audience is waiting to <span className="border-b border-indigo-500 text-white">join in.</span>
          </p>
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorksAnimated;