'use client';

import { useEffect, useRef, useState } from 'react';

interface ParallaxOptions {
  speed?: number; // 0.5 = half speed, 2 = double speed
  direction?: 'vertical' | 'horizontal';
}

/**
 * Hook para efecto parallax on scroll
 * Retorna el offset de transformación basado en scroll position
 */
export function useParallax(options: ParallaxOptions = {}) {
  const { speed = 0.5, direction = 'vertical' } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;

      const element = ref.current;
      const elementTop = element.getBoundingClientRect().top;
      const windowHeight = window.innerHeight;

      // Calculate how far the element is from the top of viewport
      const distanceFromTop = elementTop - windowHeight;

      // Calculate parallax offset
      const parallaxOffset = distanceFromTop * speed;

      setOffset(parallaxOffset);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const transform =
    direction === 'vertical'
      ? `translateY(${offset}px)`
      : `translateX(${offset}px)`;

  return { ref, transform };
}

/**
 * Hook para fade/scale on scroll
 */
export function useScrollReveal(triggerThreshold: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [opacity, setOpacity] = useState(0);
  const [scale, setScale] = useState(0.95);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const progress = entry.intersectionRatio;
          setOpacity(progress);
          setScale(0.95 + progress * 0.05);
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return {
    ref,
    style: {
      opacity,
      transform: `scale(${scale})`,
      transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
    },
  };
}
