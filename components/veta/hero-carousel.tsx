'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

interface HeroCarouselProps {
  images: { src: string; alt: string }[];
  fallbackImage: { src: string; alt: string };
  priority?: boolean;
  imageClassName?: string;
  sizes?: string;
}

export function HeroCarousel({ 
  images, 
  fallbackImage, 
  priority = false, 
  imageClassName = "object-cover",
  sizes = "100vw"
}: HeroCarouselProps) {
  // Garantizar que siempre haya al menos una imagen (la fallback si viene vacío de la DB)
  const carouselImages = images.length > 0 ? images : [fallbackImage];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (carouselImages.length <= 1) return;
    
    // Cambiar de imagen cada 7 segundos (tiempo suficiente para apreciar el Ken Burns)
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselImages.length);
    }, 7000);
    
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  return (
    <>
      {carouselImages.map((img, index) => (
        <Image
          key={`${img.src}-${index}`}
          src={img.src}
          alt={img.alt}
          fill
          priority={priority && index === 0}
          quality={100}
          className={`${imageClassName} animate-ken-burns transition-opacity duration-[1500ms] ease-in-out absolute inset-0 ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
          sizes={sizes}
        />
      ))}
    </>
  );
}
