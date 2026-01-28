import { useEffect, useRef, useState, useCallback } from 'react';

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
  maxOffset?: number;
}

export function useScrollParallax<T extends HTMLElement>(
  options: ParallaxOptions = {}
) {
  const { speed = 0.5, direction = 'up', maxOffset = 100 } = options;
  const elementRef = useRef<T>(null);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number | null>(null);
  const targetOffsetRef = useRef(0);

  const updateOffset = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportCenter = windowHeight / 2;
    
    // Calculate distance from center of viewport
    const distanceFromCenter = elementCenter - viewportCenter;
    const parallaxFactor = distanceFromCenter * speed;
    
    const newOffset = direction === 'up' 
      ? -Math.min(Math.max(parallaxFactor, -maxOffset), maxOffset)
      : Math.min(Math.max(parallaxFactor, -maxOffset), maxOffset);
    
    targetOffsetRef.current = newOffset;
  }, [speed, direction, maxOffset]);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const smoothUpdate = () => {
      const currentOffset = offset;
      const targetOffset = targetOffsetRef.current;
      const diff = targetOffset - currentOffset;
      
      if (Math.abs(diff) > 0.1) {
        setOffset(currentOffset + diff * 0.1);
        rafRef.current = requestAnimationFrame(smoothUpdate);
      } else {
        setOffset(targetOffset);
        ticking = false;
      }
    };

    const handleScroll = () => {
      if (Math.abs(window.scrollY - lastScrollY) < 5) return;
      lastScrollY = window.scrollY;
      
      updateOffset();
      
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(smoothUpdate);
      }
    };

    // Initial calculation
    updateOffset();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateOffset, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateOffset);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [updateOffset, offset]);

  return { ref: elementRef, offset };
}

// Hook for multiple elements with staggered parallax
export function useStaggeredParallax(
  count: number,
  baseSpeed: number = 0.3,
  staggerAmount: number = 0.1
) {
  const [offsets, setOffsets] = useState<number[]>(new Array(count).fill(0));
  const refs = useRef<(HTMLElement | null)[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    let ticking = false;

    const updateOffsets = () => {
      const newOffsets = refs.current.map((ref, i) => {
        if (!ref) return 0;
        
        const rect = ref.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        
        const distanceFromCenter = elementCenter - viewportCenter;
        const speed = baseSpeed + i * staggerAmount;
        
        return -distanceFromCenter * speed * 0.1;
      });

      setOffsets(newOffsets);
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafRef.current = requestAnimationFrame(() => {
          updateOffsets();
          ticking = false;
        });
      }
    };

    updateOffsets();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [count, baseSpeed, staggerAmount]);

  const setRef = useCallback((index: number) => (el: HTMLElement | null) => {
    refs.current[index] = el;
  }, []);

  return { offsets, setRef };
}