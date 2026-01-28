import { useEffect, useRef } from 'react';

export function Floating3DShape() {
  const shapeRef = useRef<HTMLDivElement>(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | null>(null);
  const isActiveRef = useRef(true);

  useEffect(() => {
    const shape = shapeRef.current;
    if (!shape) return;

    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (!isActiveRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      // Throttle to ~30fps for performance
      if (currentTime - lastTime < 33) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = currentTime;

      rotationRef.current.y += 0.3;
      rotationRef.current.x = Math.sin(currentTime * 0.0005) * 5;

      shape.style.transform = `
        perspective(1000px)
        rotateX(${rotationRef.current.x}deg)
        rotateY(${rotationRef.current.y}deg)
        translateZ(0)
      `;

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    // Visibility handling
    const handleVisibility = () => {
      isActiveRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={shapeRef}
      className="absolute right-[10%] top-[20%] w-64 h-64 md:w-96 md:h-96 pointer-events-none opacity-30 dark:opacity-20"
      style={{
        transformStyle: 'preserve-3d',
        willChange: 'transform',
      }}
      aria-hidden="true"
    >
      {/* Main blob shape */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.8), transparent 50%),
            radial-gradient(circle at 70% 70%, rgba(236, 72, 153, 0.6), transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.4), transparent 60%)
          `,
          filter: 'blur(40px)',
          transform: 'translateZ(-50px)',
        }}
      />
      
      {/* Orbiting dots */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full bg-primary/60"
          style={{
            top: '50%',
            left: '50%',
            transform: `
              rotateY(${i * 60}deg)
              rotateX(${i * 30}deg)
              translateZ(120px)
              translate(-50%, -50%)
            `,
            animation: `orbit${i % 2 === 0 ? '1' : '2'} ${8 + i}s linear infinite`,
          }}
        />
      ))}

      {/* Inner glow rings */}
      <div
        className="absolute inset-8 rounded-full border border-primary/20"
        style={{
          transform: 'translateZ(20px) rotateX(60deg)',
        }}
      />
      <div
        className="absolute inset-16 rounded-full border border-accent/20"
        style={{
          transform: 'translateZ(40px) rotateY(45deg)',
        }}
      />

      <style>{`
        @keyframes orbit1 {
          from { transform: rotateY(0deg) rotateX(30deg) translateZ(100px) translate(-50%, -50%); }
          to { transform: rotateY(360deg) rotateX(30deg) translateZ(100px) translate(-50%, -50%); }
        }
        @keyframes orbit2 {
          from { transform: rotateY(180deg) rotateX(-30deg) translateZ(80px) translate(-50%, -50%); }
          to { transform: rotateY(540deg) rotateX(-30deg) translateZ(80px) translate(-50%, -50%); }
        }
      `}</style>
    </div>
  );
}