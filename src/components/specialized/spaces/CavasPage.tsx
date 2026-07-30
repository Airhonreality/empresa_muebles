'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, Wine } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useParallax } from './shared/useParallax';
import type { CavasPageProps } from './types';

export default function CavasPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: CavasPageProps) {
  const [selectedCapacity, setSelectedCapacity] = useState(0);
  const heroParallax = useParallax({ speed: 0.5 });

  const capacityOptions = [
    { bottles: 50, description: 'Colección Pequeña', details: 'Perfecta para sumiller casual' },
    { bottles: 150, description: 'Colección Mediana', details: 'Para coleccionista entusiasta' },
    { bottles: 300, description: 'Colección Premium', details: 'Arquitectura completa de almacenamiento' },
    { bottles: 500, description: 'Arquitectura Bespoke', details: 'Sistema customizado de temperatura' },
  ];

  const storageArchitecture = [
    { feature: 'Temperatura Perfecta', desc: '12-15°C controlado automáticamente' },
    { feature: 'Humedad Óptima', desc: '50-80% para corchos y etiquetas' },
    { feature: 'Vibración Cero', desc: 'Aislamiento acústico y de movimiento' },
    { feature: 'Iluminación LED', desc: 'Espectro seleccionado, sin daño UV' },
  ];

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Cavas' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Cavas y Bares',
    description: 'Diseño, fabricación e instalación de cavas a medida en Bogotá',
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    image: images[0]?.imagen_url,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-red-950 to-slate-900 text-white">
      <Script
        id="local-business-schema-cavas"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero: Immersive Parallax */}
        <section
          ref={heroParallax.ref}
          className="relative min-h-screen flex items-center overflow-hidden"
          style={{ transform: heroParallax.transform }}
        >
          {/* Background Image with Wine Color Overlay */}
          <div className="absolute inset-0 opacity-60">
            <Image
              src={images[0]?.imagen_url || '/vetadeoro/cavas-hero.jpg'}
              alt="Hero cavas"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Dark Overlay for Text Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-red-900/50 to-black/70" />

          {/* Breadcrumbs */}
          <div className="absolute top-8 left-6 z-10">
            <nav className="flex items-center gap-2 text-xs text-white/60">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3" />}
                  {crumb.path ? (
                    <Link href={crumb.path} className="hover:text-white/80 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-white/80">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="relative z-5 mx-auto max-w-7xl px-6 py-20 sm:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-md px-4 py-2">
                <Wine className="h-4 w-4 text-amber-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-200">
                  Preservar Experiencias
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Tu colección, {' '}
                <span className="text-amber-300">preservada perfectamente</span>
              </h1>

              <p className="text-lg sm:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                {description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <CTAButton
                  href={ctaConfig.calendarLink}
                  label={ctaConfig.primaryLabel}
                  variant="primary"
                  external
                />
                <WhatsAppCTA
                  phoneNumber="573017604530"
                  message="Quiero diseñar mi cava de vinos"
                  label={ctaConfig.secondaryLabel}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Extended Description */}
        {descriptionExtended && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto">
            <p className="text-lg text-white/80 leading-relaxed max-w-3xl">
              {descriptionExtended}
            </p>
          </section>
        )}

        {/* Image Gallery - Masonry */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Galería de Proyectos</h2>
          <ImageGallery images={images} variant="masonry" />
        </section>

        {/* Storage Architecture - Infographic Style */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-amber-400/20">
          <h2 className="text-4xl font-bold text-white mb-4">
            Arquitectura Perfecta de Almacenamiento
          </h2>
          <p className="text-white/70 mb-12">
            Cada elemento está pensado para preservar tu colección en condiciones ideales
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {storageArchitecture.map((item, idx) => (
              <div
                key={idx}
                className="group rounded-xl border border-amber-400/30 bg-amber-400/5 backdrop-blur-sm p-6 hover:bg-amber-400/10 hover:border-amber-400/50 transition-all duration-300"
              >
                <h3 className="font-bold text-lg text-amber-300 mb-2 group-hover:text-amber-200">
                  {item.feature}
                </h3>
                <p className="text-white/70 group-hover:text-white/90">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capacity Selector - Interactive Cards */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-amber-400/20">
          <h2 className="text-4xl font-bold text-white mb-12">
            Elige tu Capacidad
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {capacityOptions.map((option, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCapacity(idx)}
                className={`cursor-pointer group rounded-2xl p-8 border-2 transition-all duration-300 ${
                  selectedCapacity === idx
                    ? 'border-amber-300 bg-gradient-to-br from-amber-400/20 to-amber-600/10 shadow-2xl scale-105'
                    : 'border-amber-400/20 bg-amber-400/5 hover:border-amber-400/50'
                }`}
              >
                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-5xl font-bold text-amber-300">{option.bottles}</p>
                  <p className="text-white/60">botellas</p>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{option.description}</h3>
                <p
                  className={`${
                    selectedCapacity === idx ? 'text-white' : 'text-white/60'
                  } group-hover:text-white transition-colors`}
                >
                  {option.details}
                </p>
                {selectedCapacity === idx && (
                  <div className="mt-4 pt-4 border-t border-amber-300/30">
                    <p className="text-sm text-amber-200">Sistema optimizado para esta colección</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        {benefits && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-amber-400/20">
            <h2 className="text-3xl font-bold text-white mb-8">Por Qué Veta Dorada</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="flex gap-4 text-white/80">
                  <span className="text-amber-300 font-bold flex-shrink-0">→</span>
                  <p>{benefit}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-amber-400/20">
          <h2 className="text-4xl font-bold text-white mb-12">Historias de Coleccionistas</h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-gradient-to-r from-amber-400/10 to-amber-600/10 rounded-2xl border border-amber-400/20">
            <h3 className="font-bold text-lg text-amber-300 mb-3">Nuestro Proceso</h3>
            <p className="text-white/80 leading-relaxed">{processNote}</p>
          </section>
        )}

        {/* Social Proof */}
        {socialProofStats && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-amber-400/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl font-bold text-amber-300">
                  {socialProofStats.projectsCompleted || 0}+
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Cavas Diseñadas
                </p>
              </div>
              <div>
                <p className="text-5xl font-bold text-amber-300">
                  {socialProofStats.yearsExperience || 15}+
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Años de Experiencia
                </p>
              </div>
              <div>
                <p className="text-5xl font-bold text-amber-300">100%</p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Colecciones Preservadas
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Simula Tu Cava Ideal
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Comencemos a diseñar el espacio perfecto para tu colección de vinos.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Reservar Demostración"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero más información sobre las cavas de Veta Dorada"
              label="Escribir por WhatsApp"
              variant="secondary"
            />
          </div>
        </section>
      </main>

      <VetaFooter />
    </div>
  );
}
