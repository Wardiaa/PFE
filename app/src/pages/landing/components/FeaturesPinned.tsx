import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

interface Feature {
  id: number;
  title: string;
  description: string;
  gradient: string;
}

const features: Feature[] = [
  {
    id: 1,
    title: "Interactive Polls",
    description: "Create engaging real-time polls that capture audience opinions instantly",
    gradient: "gradient-primary",
  },
  {
    id: 2,
    title: "Live Q&A",
    description: "Let your audience ask questions and vote on the best ones",
    gradient: "gradient-accent",
  },
  {
    id: 3,
    title: "Word Clouds",
    description: "Visualize audience responses in beautiful, animated word clouds",
    gradient: "gradient-success",
  },
  {
    id: 4,
    title: "Quiz Games",
    description: "Host competitive quizzes with leaderboards and instant feedback",
    gradient: "gradient-info",
  },
  {
    id: 5,
    title: "Analytics Dashboard",
    description: "Get deep insights into audience engagement and participation",
    gradient: "gradient-warning",
  },
];

export default function FeaturesPinned() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsWrapperRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Create a context for this component
    const ctx = gsap.context(() => {
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];
      
      cards.forEach((card, i) => {
        // Skip the last card or handle it differently if needed
        if (i === cards.length - 1) return;
        
        const wrapper = card.parentElement;
        if (!wrapper) return;
        
        // Calculate scale based on position (smaller for earlier cards)
        const scale = 0.9 + 0.025 * i;
        const rotation = -5; // Slight rotation
        
        // Create the scroll-triggered animation
        gsap.to(card, {
          scale: scale,
          rotationX: rotation,
          transformOrigin: "top center",
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: `top ${60 + 10 * i}`,
            end: "bottom 550",
            endTrigger: cardsWrapperRef.current,
            scrub: true,
            pin: wrapper,
            pinSpacing: false,
            invalidateOnRefresh: true,
            id: `card-${i + 1}`,
          }
        });
      });
    }, sectionRef); // Scope everything to this component

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
    <section ref={sectionRef} className="relative bg-background">
      {/* Minimal header - just enough to create scroll space */}
      <div className="h-32" />
      
      {/* Cards wrapper - contains all cards */}
      <div ref={cardsWrapperRef} className="cards-wrapper">
        <div className="cards-container">
          {features.map((feature, index) => (
            <div 
              key={feature.id} 
              className="card-wrapper"
            >
              <div
                ref={setCardRef(index)}
                className={`feature-card ${feature.gradient}`}
              >
                <div className="card-content">
                  <h3 className="card-title">{feature.title}</h3>
                  <p className="card-description">{feature.description}</p>
                </div>
                <div className="card-overlay" />
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Minimal footer - just enough to create scroll space */}
      <div className="h-32" />
    </section>
  );
}