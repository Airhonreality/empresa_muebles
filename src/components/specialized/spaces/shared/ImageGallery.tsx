'use client';

import Image from 'next/image';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { SeoImageData } from '../types';

interface ImageGalleryProps {
  images: SeoImageData[];
  variant?: 'masonry' | 'carousel' | 'grid';
  className?: string;
}

export default function ImageGallery({
  images,
  variant = 'carousel',
  className = '',
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const handleNext = () => {
    setCarouselIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (variant === 'carousel') {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl ${className}`}>
        {/* Carousel Container */}
        <div className="relative aspect-video bg-slate-200">
          <Image
            src={images[carouselIndex].imagen_url}
            alt={images[carouselIndex].alt_text}
            fill
            className="object-cover"
            priority
          />

          {/* Navigation Buttons */}
          <button
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white p-2 rounded-full transition-all hover:scale-110 active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>

          {/* Caption */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
            <p className="font-semibold text-lg">
              {images[carouselIndex].image_title}
            </p>
            <p className="text-sm text-gray-200 mt-1">
              {images[carouselIndex].descripcion}
            </p>
          </div>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCarouselIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === carouselIndex
                    ? 'bg-white w-6'
                    : 'bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={className}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image, idx) => (
            <div
              key={idx}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedIndex(idx)}
            >
              <Image
                src={image.imagen_url}
                alt={image.alt_text}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-center px-4">
                  <p className="font-semibold text-sm">{image.image_title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {selectedIndex !== null && (
          <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedIndex(null)}
              className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative w-full max-w-4xl aspect-video">
              <Image
                src={images[selectedIndex].imagen_url}
                alt={images[selectedIndex].alt_text}
                fill
                className="object-contain"
              />
            </div>

            <button
              onClick={() =>
                setSelectedIndex((prev) => (prev! - 1 + images.length) % images.length)
              }
              className="absolute left-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() =>
                setSelectedIndex((prev) => (prev! + 1) % images.length)
              }
              className="absolute right-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // Masonry variant
  return (
    <div className={className}>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
        {images.map((image, idx) => (
          <div
            key={idx}
            className="break-inside-avoid mb-4 cursor-pointer rounded-lg overflow-hidden group"
            onClick={() => setSelectedIndex(idx)}
          >
            <div className="relative h-64 overflow-hidden rounded-lg">
              <Image
                src={image.imagen_url}
                alt={image.alt_text}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-4xl w-full">
            <Image
              src={images[selectedIndex].imagen_url}
              alt={images[selectedIndex].alt_text}
              width={1200}
              height={800}
              className="w-full h-auto rounded-lg"
            />
          </div>

          <button
            onClick={() =>
              setSelectedIndex((prev) => (prev! - 1 + images.length) % images.length)
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() =>
              setSelectedIndex((prev) => (prev! + 1) % images.length)
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}
