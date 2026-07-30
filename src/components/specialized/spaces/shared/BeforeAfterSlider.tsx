'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeAlt: string;
  afterAlt: string;
  beforeLabel?: string;
  afterLabel?: string;
  containerClassName?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeAlt,
  afterAlt,
  beforeLabel = 'Antes',
  afterLabel = 'Después',
  containerClassName = '',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const position = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  useEffect(() => {
    if (isDragging.current) {
      document.addEventListener('mousemove', handleMouseMove as EventListener);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener(
          'mousemove',
          handleMouseMove as EventListener
        );
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, []);

  const handleTouchStart = () => {
    isDragging.current = true;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const position = (x / rect.width) * 100;

    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-slate-200 ${containerClassName}`}
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      style={{ aspectRatio: '16 / 10', cursor: 'col-resize' }}
    >
      {/* Before Image (background) */}
      <div className="absolute inset-0">
        <Image
          src={beforeImage}
          alt={beforeAlt}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* After Image (overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <Image
          src={afterImage}
          alt={afterAlt}
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-col-resize transition-shadow hover:shadow-[0_0_20px_rgba(255,255,255,0.8)]"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
        }}
      >
        {/* Handle Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <svg
              className="w-4 h-4 text-gray-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
            </svg>
            <svg
              className="w-4 h-4 text-gray-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold">
        {beforeLabel}
      </div>
      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold">
        {afterLabel}
      </div>
    </div>
  );
}
