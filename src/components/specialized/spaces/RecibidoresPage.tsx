'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, Home } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useScrollAnimation, useCountUp } from './shared/useScrollAnimation';
import type { RecibidoresPageProps } from './types';

export default function RecibidoresPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: RecibidoresPageProps) {
  const [selectedMoment, setSelectedMoment] = useState(0);
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();

  const momentos = [
    {
      moment: 'La Llegada',
      description: 'El primer segundo: luz, orden, bienvenida.',
      icon: '🚪',
      details: 'Tu recibidor cuenta la historia de tu hogar antes de que se vea una habitación.',
    },
    {
      moment: 'Preparación',
      description: 'Dejar las llaves, el abrigo, la carga del día.',
      icon: '🎒',
      details: 'Cada elemento tiene su lugar. Sin ruido visual. Funcionalidad discreta.',
    },
    {
      moment: 'Transición',
      description: 'De afuera hacia adentro. De público a privado.',
      icon: '↗',
      details: 'Un umbral psicológico que marca el cambio de espacio y de ánimo.',
    },
    {
      moment: 'Partida',
      description: 'Un último espejo, un último toque, perfección en salida.',
      icon: '👋',
      details: 'El recibidor es tu firma. Debe reflejar calidad y cuidado.',
    },
    {
      moment: 'Encuentro',
      description: 'Recibir visitas con elegancia contenida.',
      icon: '🤝',
      details: 'Primera impresión que dura. Espacio que habla de gustos y valores.',
    },
  ];

  const statsCounter = useCountUp(
    socialProofStats?.projectsCompleted || 300,
    2000,
    statsVisible
  );

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Recibidores' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Recibidores',
    description: 'Diseño, fabricación e instalación de recibidores a medida en Bogotá',
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    image: images[0]?.imagen_url,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Script
        id="local-business-schema-recibidores"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero: Animated Door Opening Concept */}
        <section className="relative min-h-screen flex items-center pt-20">
          {/* Subtle Gradient Background */}
          <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-50" />

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100 to-transparent rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-green-100 to-transparent rounded-full blur-3xl opacity-30" />

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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-4 py-2">
                <Home className="h-4 w-4 text-slate-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Primera Impresión Perfecta
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.1]">
                Tu entrada, {' '}
                <span className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-clip-text text-transparent">
                  tu firma personal
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
                  message="Quiero diseñar mi recibidor"
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
            <p className="text-lg text-gray-700 leading-relaxed max-w-3xl">
              {descriptionExtended}
            </p>
          </section>
        )}

        {/* Image Gallery */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Nuestros Proyectos</h2>
          <ImageGallery images={images} variant="carousel" className="w-full" />
        </section>

        {/* 5 Moments - Horizontal Storytelling */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-gray-200">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Cinco Momentos en tu Recibidor
          </h2>
          <p className="text-gray-600 mb-12">
            Cada momento cuenta una historia. Cada detalle marca una diferencia.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {momentos.map((m, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedMoment(idx)}
                className={`cursor-pointer group relative rounded-xl border transition-all duration-300 p-6 ${
                  selectedMoment === idx
                    ? 'border-slate-400 bg-slate-50 shadow-lg'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="text-5xl mb-3">{m.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{m.moment}</h3>
                <p className="text-sm text-gray-600 mb-3">{m.description}</p>

                {selectedMoment === idx && (
                  <div className="pt-3 border-t border-gray-200 text-sm text-gray-700 animate-in fade-in duration-300">
                    {m.details}
                  </div>
                )}

                {/* Hover underline */}
                <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-slate-400 to-transparent group-hover:h-1 transition-all duration-300" />
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        {benefits && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-gray-200">
            <h2 className="text-4xl font-bold text-gray-900 mb-12">
              Por Qué Confiar en Veta Dorada
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="text-2xl flex-shrink-0">
                      {idx === 0 && '✓'}
                      {idx === 1 && '◆'}
                      {idx === 2 && '→'}
                      {idx === 3 && '✦'}
                    </div>
                    <p className="text-gray-700">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Social Proof Stats */}
        <section
          ref={statsRef}
          className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-gray-200"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-slate-700">
                {statsCounter}+
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Recibidores Diseñados
              </p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-slate-700">
                {socialProofStats?.yearsExperience || 15}+
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Años de Experiencia
              </p>
            </div>
            <div>
              <p className="text-5xl sm:text-6xl font-bold text-slate-700">100%</p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-600">
                Clientes Satisfechos
              </p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-gray-200">
          <h2 className="text-4xl font-bold text-gray-900 mb-12">
            Lo que Dicen de Nosotros
          </h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border border-gray-200">
            <h3 className="font-bold text-lg text-gray-900 mb-3">Cómo Trabajamos</h3>
            <p className="text-gray-700 leading-relaxed">{processNote}</p>
          </section>
        )}

        {/* Final CTA */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Inspiremos Tu Entrada
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Diseñemos un recibidor que sea reflejo de tu personalidad y puerta a tu hogar.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Diseño Personal"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero consultar sobre recibidores"
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
