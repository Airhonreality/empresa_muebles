'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, MessageCircle } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useScrollAnimation, useCountUp } from './shared/useScrollAnimation';
import type { CochinasPageProps } from './types';

export default function CochinasPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: CochinasPageProps) {
  const [selectedPersonalization, setSelectedPersonalization] = useState(0);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  const projectsCount = useCountUp(
    socialProofStats?.projectsCompleted || 500,
    2000,
    statsVisible
  );

  const personalizationLevels = [
    {
      level: 'Esencial',
      description: 'Solución funcional optimizada para tu espacio',
      features: ['Distribución a medida', 'Materiales estándar', 'Diseño limpio'],
      icon: '✓',
    },
    {
      level: 'Premium',
      description: 'Diseño refinado con detalles personalizados',
      features: ['Arquitectura personalizada', 'Materiales seleccionados', 'Detalles premium'],
      icon: '✦',
    },
    {
      level: 'Lujo',
      description: 'Cocina única, expresión de tu identidad',
      features: ['Diseño bespoke', 'Materiales exclusivos', 'Tecnología integrada'],
      icon: '◆',
    },
  ];

  const materialsHighlight = [
    { name: 'Maderas Nobles', desc: 'Roble, nogal, cerezo seleccionado' },
    { name: 'Laminados Premium', desc: 'Formica, Dekton, porcelánicos' },
    { name: 'Herrajes Alemanes', desc: 'Blum, Hettich, bisagras soft-close' },
    { name: 'Mesones Contínuos', desc: 'Cuarzo, granito, superficies sólidas' },
  ];

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Cocinas' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Cocinas Integrales',
    description: 'Diseño, fabricación e instalación de cocinas integrales a medida en Bogotá',
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Carrera 72A',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    image: images[0]?.imagen_url,
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))]">
      <Script
        id="local-business-schema-cocinas"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero Section: Luxury Minimalist */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 opacity-30">
            <Image
              src={images[0]?.imagen_url || '/vetadeoro/cocinas-hero.jpg'}
              alt="Hero cocinas"
              fill
              className="object-cover"
              priority
            />
          </div>

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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
                  Precisión del Lujo
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Cocinas que {' '}
                <span className="bg-gradient-to-r from-yellow-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent">
                  expresan tu esencia
                </span>
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
                  message="Hola Veta Dorada, me interesa diseñar mi cocina"
                  label={ctaConfig.secondaryLabel}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Extended Description */}
        {descriptionExtended && (
          <section className="px-6 py-16 sm:px-8 sm:py-20 max-w-7xl mx-auto">
            <p className="text-lg text-[hsl(var(--veta-text-stone))] leading-relaxed max-w-3xl">
              {descriptionExtended}
            </p>
          </section>
        )}

        {/* Image Gallery */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <ImageGallery images={images} variant="carousel" className="w-full" />
        </section>

        {/* 3 Levels of Personalization - Card Flip Effect */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-[hsl(var(--veta-text-carbon))] mb-4">
            Tres Niveles de Personalización
          </h2>
          <p className="text-[hsl(var(--veta-text-stone))] mb-12">
            Desde soluciones funcionales hasta cocinas completamente bespoke
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personalizationLevels.map((level, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedPersonalization(idx)}
                className={`cursor-pointer rounded-2xl p-8 transition-all duration-300 ${
                  selectedPersonalization === idx
                    ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-2xl scale-105'
                    : 'bg-[hsl(var(--veta-bg-linen))] text-[hsl(var(--veta-text-carbon))] hover:shadow-lg'
                }`}
              >
                <div className="text-4xl mb-4">{level.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{level.level}</h3>
                <p
                  className={`mb-6 ${
                    selectedPersonalization === idx
                      ? 'text-white/80'
                      : 'text-[hsl(var(--veta-text-stone))]'
                  }`}
                >
                  {level.description}
                </p>
                <ul className="space-y-2">
                  {level.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center gap-2 text-sm">
                      <span className="text-yellow-400">→</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Materials Deep Dive */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[hsl(var(--veta-glass-light-border))]">
          <h2 className="text-4xl font-bold text-[hsl(var(--veta-text-carbon))] mb-4">
            Materiales Premium Seleccionados
          </h2>
          <p className="text-[hsl(var(--veta-text-stone))] mb-12 max-w-2xl">
            Cada proyecto merece una selección cuidadosa de materiales que combinen durabilidad, estética y funcionalidad.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materialsHighlight.map((material, idx) => (
              <div
                key={idx}
                className="group rounded-xl border border-[hsl(var(--veta-glass-light-border))] p-6 hover:shadow-lg hover:bg-[hsl(var(--veta-bg-linen))] transition-all duration-300"
              >
                <h3 className="font-bold text-lg text-[hsl(var(--veta-text-carbon))] mb-2 group-hover:text-[hsl(var(--veta-gold-hover))]">
                  {material.name}
                </h3>
                <p className="text-sm text-[hsl(var(--veta-text-stone))]">
                  {material.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Social Proof Stats */}
        <section
          ref={statsRef}
          className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[hsl(var(--veta-glass-light-border))]"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-[hsl(var(--veta-gold-hover))]">
                {projectsCount}+
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))]">
                Proyectos completados
              </p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-[hsl(var(--veta-gold-hover))]">
                {socialProofStats?.yearsExperience || 15}+
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))]">
                Años de experiencia
              </p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-[hsl(var(--veta-gold-hover))]">
                100%
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[hsl(var(--veta-text-stone))]">
                Satisfacción clientes
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-[hsl(var(--veta-glass-light-border))]">
          <h2 className="text-4xl font-bold text-[hsl(var(--veta-text-carbon))] mb-12">
            Lo que Dicen Nuestros Clientes
          </h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-[hsl(var(--veta-bg-linen))] rounded-2xl">
            <h3 className="font-bold text-[hsl(var(--veta-text-carbon))] mb-3">Nuestro Proceso</h3>
            <p className="text-[hsl(var(--veta-text-stone))]">{processNote}</p>
          </section>
        )}

        {/* Final CTA */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-[hsl(var(--veta-text-carbon))] mb-6">
            Cocina Única, Para Ti Único
          </h2>
          <p className="text-lg text-[hsl(var(--veta-text-stone))] mb-8 max-w-2xl mx-auto">
            Comencemos una conversación sobre tu espacio, tus sueños, y cómo podemos convertirlos en realidad.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Agendar Consulta de Diseño"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero conocer más sobre los servicios de cocinas de Veta Dorada"
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
