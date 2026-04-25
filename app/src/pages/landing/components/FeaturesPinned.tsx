import React, { useRef, useEffect } from 'react';
import { BarChart3, HelpCircle, Users, Zap, ArrowRight } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface Feature {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  image: string;
  tag: string;
  accent: string;
}

const FEATURES: Feature[] = [
  {
    id: 1,
    title: "Live polls & word clouds, instantly.",
    description: "Create multiple‑choice polls or word clouds in seconds. Watch responses transform into beautiful visualisations as your audience participates.",
    icon: <BarChart3 className="w-5 h-5" />,
    color: "bg-[#111111]",
    accent: "text-blue-500",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    tag: "Real‑time"
  },
  {
    id: 2,
    title: "Gamified quizzes & leaderboards.",
    description: "Timed questions, point scoring, and live leaderboards. Boost engagement and turn passive viewers into active competitors.",
    icon: <HelpCircle className="w-5 h-5" />,
    color: "bg-[#161617]",
    accent: "text-purple-500",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200",
    tag: "Gamification"
  },
  {
    id: 3,
    title: "Open‑text responses & Q&A.",
    description: "Let your audience submit free‑form answers or ask live questions. Moderate, highlight, and share the best contributions with everyone.",
    icon: <Users className="w-5 h-5" />,
    color: "bg-[#1c1c1e]",
    accent: "text-emerald-500",
    image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200",
    tag: "Interaction"
  },
  {
    id: 4,
    title: "Complete host control.",
    description: "Pause sessions, skip questions, hide participant names, and control results visibility. Everything you need to run a smooth, professional event.",
    icon: <Zap className="w-5 h-5" />,
    color: "bg-[#252529]",
    accent: "text-orange-500",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    tag: "Moderation"
  }
];

const FeaturesPinned: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Create a context for this component
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      
      cards.forEach((card, i) => {
        // Skip the last card (it stays normal)
        if (i === cards.length - 1) return;
        
        const wrapper = card.parentElement;
        if (!wrapper) return;
        
        // Calculate scale based on position (smaller for earlier cards)
        // This creates the stacked effect
        const scale = 0.9 + 0.025 * i;
        const rotation = -3; // Slight rotation for depth
        
        // Create the scroll-triggered animation
        gsap.to(card, {
          scale: scale,
          rotationX: rotation,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: `top ${70 + 5 * i}`,
            end: "bottom 600",
            endTrigger: cardsWrapperRef.current,
            scrub: true,
            pin: wrapper,
            pinSpacing: false,
            invalidateOnRefresh: true,
            id: `card-${i + 1}`,
          }
        });
      });
    }, sectionRef);

    // Refresh ScrollTrigger after setup
    setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    // Cleanup
    return () => ctx.revert();
  }, []);

  // Function to set card refs
  const setCardRef = (index: number) => (el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  };

  return (
    <div id="features" className="bg-black text-white antialiased">
       {/* Intro section - Your original with faster, smoother animation */}
      <section className="h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5,
            ease: [0.25, 0.1, 0.25, 1], // Cubic bezier for smoother easing
            delay: 0.1
          }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <motion.h2 
            className="text-zinc-500 font-medium text-xl md:text-2xl mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Designed for creators
          </motion.h2>
          
          <motion.h1 
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.85]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Powerfully simple. <br />
            <span className="text-zinc-600">Deeply interactive.</span>
          </motion.h1>
          
          <motion.p 
            className="text-zinc-500 text-xl max-w-xl mx-auto font-medium tracking-tight"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            The complete toolkit for quizzes, polls, and live engagement.
          </motion.p>
        </motion.div>
      </section>

      {/* GSAP Sticky Stack Section */}
      <section ref={sectionRef} className="relative bg-black">
        {/* Top spacer for scroll room */}
        <div className="h-48" />
        
        {/* Cards wrapper */}
        <div ref={cardsWrapperRef} className="cards-wrapper">
          <div className="cards-container">
            {FEATURES.map((feature, index) => (
              <div 
                key={feature.id} 
                className="card-wrapper"
              >
                <div
                  ref={setCardRef(index)}
                  className={`feature-card ${feature.color}`}
                >
                  <div className="flex w-full h-full flex-col md:flex-row overflow-hidden">
                    {/* Left Side: Content */}
                    <div className="flex-[1.3] p-10 md:p-16 flex flex-col justify-between">
                      <div>
                        <div className={`flex items-center gap-2 mb-8 ${feature.accent}`}>
                          <span className="p-2 rounded-lg bg-white/5 border border-white/10">
                            {feature.icon}
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                            {feature.tag}
                          </span>
                        </div>
                        
                        <h3 className="text-4xl md:text-5xl font-semibold text-white tracking-tight leading-tight mb-6">
                          {feature.title}
                        </h3>
                        
                        <p className="text-lg text-zinc-400 leading-relaxed max-w-sm">
                          {feature.description}
                        </p>
                      </div>

                      <button className="group flex items-center gap-2 text-white font-medium text-sm hover:text-zinc-300 transition-colors">
                        Get an interactive demo
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                    {/* Right Side: Image */}
                    <div className="flex-1 relative overflow-hidden bg-zinc-900 border-l border-white/5">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        className="w-full h-full object-cover brightness-100"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Bottom spacer for scroll room */}
        <div className="h-48" />
      </section>


    </div>
  );
};

export default FeaturesPinned;