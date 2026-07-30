'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import BeforeAfterSlider from './shared/BeforeAfterSlider';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useScrollAnimation } from './shared/useScrollAnimation';
import type { ClosetsPageProps } from './types';

export default function ClosetsPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: ClosetsPageProps) {
  const [selectedStyle, setSelectedStyle] = useState(0);
  const { ref: benefitsRef, isVisible: benefitsVisible } = useScrollAnimation();

  const lifestyleStyles = [
    {
      name: 'Minimalista',
      description: 'Líneas limpias, funcionalidad pura, máxima claridad visual',
      colors: ['Blanco', 'Gris', 'Negro'],
      emoji: '◻',
    },
    {
      name: 'Cálido Natural',
      description: 'Maderas y tonos naturales que abrazan el espacio',
      colors: ['Roble', 'Caramelo', 'Crema'],
      emoji: '🌳',
    },
    {
      name: 'Elegancia Oscura',
      description: 'Misterio y sofisticación con contrastes profundos',
      colors: ['Grafito', 'Espresso', 'Dorado'],
      emoji: '◆',
    },
    {
      name: 'Frescura Contemporánea',
      description: 'Modernidad con toques de color y luz',
      colors: ['Blanco', 'Menta', 'Cemento'],
      emoji: '✨',
    },
  ];

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Closets' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Closets y Vestidores',
    description: 'Diseño, fabricación e instalación de closets a medida en Bogotá',
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
    <div className="min-h-screen bg-gradient-to-b from-[#fef5e7] via-[#fef8f0] to-white text-[hsl(var(--veta-text-carbon))]">
      <Script
        id="local-business-schema-closets"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero: Warm Welcome */}
        <section className="relative min-h-[85vh] flex items-center pt-20">
          {/* Decorative Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-amber-200/30 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-orange-100/20 to-transparent rounded-full blur-3xl" />
          </div>

          {/* Breadcrumbs */}
          <div className="absolute top-8 left-6 z-10">
            <nav className="flex items-center gap-2 text-xs text-gray-600">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3" />}
                  {crumb.path ? (
                    <Link href={crumb.path} className="hover:text-gray-800 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-gray-800">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="relative z-5 mx-auto max-w-7xl px-6 py-20 sm:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-300/50 bg-orange-50 px-4 py-2">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <span className="text-xs font-semibold uppercase tracking-wider text-orange-700">
                  Orden que Transforma
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1]">
                Tu closet, tu {' '}
                <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  mejor versión
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-700 mb-8 max-w-2xl leading-relaxed">
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
                  message="Hola Veta Dorada, quiero diseñar mi closet"
                  label={ctaConfig.secondaryLabel}
                  variant="secondary"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Before/After Slider - Interactive */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              La Transformación es Real
            </h2>
            <p className="text-gray-600">
              Arrastra el control para ver el antes y después
            </p>
          </div>
          <BeforeAfterSlider
            beforeImage={images[0]?.imagen_url || '/vetadeoro/closet-antes.jpg'}
            afterImage={images[1]?.imagen_url || '/vetadeoro/closet-despues.jpg'}
            beforeAlt="Closet desorganizado"
            afterAlt="Closet organizado y diseñado"
            beforeLabel="Desorden"
            afterLabel="Orden"
            containerClassName="w-full"
          />
        </section>

        {/* Extended Description */}
        {descriptionExtended && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto">
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
              {descriptionExtended}
            </p>
          </section>
        )}

        {/* 4 Lifestyle Styles Grid - Unique Interactive Cards */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cuatro Estilos de Vida
          </h2>
          <p className="text-gray-600 mb-12 max-w-2xl">
            Cada persona organiza su vida de forma diferente. Encuentra tu estilo.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lifestyleStyles.map((style, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedStyle(idx)}
                className={`cursor-pointer group relative rounded-2xl overflow-hidden p-8 transition-all duration-500 ${
                  selectedStyle === idx
                    ? 'bg-gradient-to-br from-orange-500 to-amber-400 text-white shadow-2xl scale-105'
                    : 'bg-white border-2 border-orange-100 hover:border-orange-300'
                }`}
              >
                {/* Animated Gradient Background */}
                <div
                  className={`absolute inset-0 ${
                    selectedStyle === idx ? 'opacity-20' : 'opacity-0'
                  } bg-gradient-to-r from-white to-transparent transition-opacity duration-300`}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{style.emoji}</div>
                  <h3 className="text-2xl font-bold mb-2">{style.name}</h3>
                  <p
                    className={`mb-6 ${
                      selectedStyle === idx ? 'text-white/90' : 'text-gray-600'
                    }`}
                  >
                    {style.description}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {style.colors.map((color, cidx) => (
                      <span
                        key={cidx}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedStyle === idx
                            ? 'bg-white/20 text-white'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {color}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Hover Animation Line */}
                <div
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-amber-300 transition-all duration-300 ${
                    selectedStyle === idx ? 'h-2' : 'h-0 group-hover:h-1'
                  }`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Image Gallery */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Nuestros Proyectos</h2>
          <ImageGallery images={images} variant="grid" />
        </section>

        {/* Benefits Section */}
        {benefits && (
          <section ref={benefitsRef} className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-orange-100">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">
              ¿Por Qué Elegir Veta Dorada?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-6 transition-all duration-300 ${
                    benefitsVisible
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-4'
                  } ${idx % 2 === 0 ? 'bg-orange-50' : 'bg-amber-50'}`}
                  style={{
                    transitionDelay: benefitsVisible ? `${idx * 100}ms` : '0ms',
                  }}
                >
                  <div className="flex gap-4">
                    <div className="text-3xl flex-shrink-0">
                      {idx === 0 && '✓'}
                      {idx === 1 && '✦'}
                      {idx === 2 && '◆'}
                      {idx === 3 && '→'}
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-orange-100">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Historias de Transformación
          </h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-100">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Cómo Trabajamos</h3>
            <p className="text-gray-700 leading-relaxed">{processNote}</p>
          </section>
        )}

        {/* Final CTA Section */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Comenzamos Hoy
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Transforma tu closet, transforma tu rutina, transforma tu vida.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Agendar Visita"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero transformar mi closet"
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
