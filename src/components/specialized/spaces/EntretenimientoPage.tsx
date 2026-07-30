'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, Music, Zap, Volume2 } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useScrollAnimation } from './shared/useScrollAnimation';
import type { EntretenimientoPageProps } from './types';

export default function EntretenimientoPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: EntretenimientoPageProps) {
  const [selectedModule, setSelectedModule] = useState(0);
  const { ref: modulesRef, isVisible: modulesVisible } = useScrollAnimation();

  const entertainmentModules = [
    {
      name: 'Sistema de Audio',
      description: 'Sonido profesional integrado discretamente',
      icon: '🎵',
      specs: [
        'Conexión Bluetooth multipunto',
        'Subwoofer integrado',
        'Control remoto inalámbrico',
      ],
    },
    {
      name: 'Iluminación Inteligente',
      description: 'Ambientes que adaptan su luz según el momento',
      icon: '💡',
      specs: [
        'Luces LED regulables',
        'Sincronización con música',
        'Control por app móvil',
      ],
    },
    {
      name: 'Almacenamiento Media',
      description: 'Espacio organizado para equipos y accesorios',
      icon: '📺',
      specs: [
        'Gestión de cables profesional',
        'Ventilación para electrónica',
        'Puertas amortiguadas soft-close',
      ],
    },
    {
      name: 'Asientos Funcionales',
      description: 'Mobiliario que invita a quedarse',
      icon: '🪑',
      specs: [
        'Tapicería premium',
        'Portavasos integrados',
        'Espacio de almacenaje disimulado',
      ],
    },
  ];

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Entretenimiento' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Centros de Entretenimiento',
    description: 'Diseño, fabricación e instalación de centros de entretenimiento a medida en Bogotá',
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    image: images[0]?.imagen_url,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <Script
        id="local-business-schema-entretenimiento"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero: Dynamic Energy */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900" />

          {/* Animated Gradient Orbs */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

          {/* Background Image with Overlay */}
          <div className="absolute inset-0 opacity-20">
            <Image
              src={images[0]?.imagen_url || '/vetadeoro/entretenimiento-hero.jpg'}
              alt="Hero entretenimiento"
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
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-400/50 bg-pink-400/10 backdrop-blur-md px-4 py-2 animate-in fade-in zoom-in">
                <Music className="h-4 w-4 text-pink-300 animate-bounce" />
                <span className="text-xs font-semibold uppercase tracking-wider text-pink-200">
                  Centro de Conexión
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                Donde la {' '}
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-pink-300 bg-clip-text text-transparent animate-pulse">
                  diversión vive
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
                  message="Quiero diseñar mi centro de entretenimiento"
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

        {/* Gallery - Mixed Media */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">Proyectos en Acción</h2>
          <ImageGallery images={images} variant="grid" />
        </section>

        {/* Entertainment Modules - Interactive Card Stack */}
        <section
          ref={modulesRef}
          className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-purple-500/20"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Módulos de Entretenimiento
          </h2>
          <p className="text-white/70 mb-12">
            Cada módulo está diseñado para máximo impacto y disfrute
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entertainmentModules.map((module, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedModule(idx)}
                className={`cursor-pointer group relative rounded-2xl border-2 p-8 transition-all duration-300 overflow-hidden ${
                  selectedModule === idx
                    ? 'border-pink-400 bg-gradient-to-br from-pink-400/20 to-purple-500/20 shadow-2xl scale-105'
                    : 'border-purple-500/30 bg-purple-900/20 hover:border-purple-500/50'
                }`}
              >
                {/* Background Animated Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-500 opacity-0 transition-opacity duration-300 ${
                    selectedModule === idx ? 'opacity-10' : 'group-hover:opacity-5'
                  }`}
                />

                <div className="relative z-10">
                  <div className="text-5xl mb-4">{module.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-pink-300 transition">
                    {module.name}
                  </h3>
                  <p className="text-white/70 mb-6">{module.description}</p>

                  {selectedModule === idx && (
                    <div className="pt-6 border-t border-white/20 space-y-2 animate-in fade-in slide-in-from-bottom">
                      {module.specs.map((spec, sidx) => (
                        <div key={sidx} className="flex items-center gap-2 text-white/90">
                          <span className="text-pink-400">→</span>
                          <span className="text-sm">{spec}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Glowing Border on Hover */}
                <div className="absolute inset-0 border-2 border-transparent rounded-2xl group-hover:border-pink-400/30 transition-all duration-300" />
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        {benefits && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-purple-500/20">
            <h2 className="text-4xl font-bold text-white mb-12">
              Diseño Pensado en Diversión
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className={`rounded-xl p-6 border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 transition-all duration-300 ${
                    modulesVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                  }`}
                  style={{ transitionDelay: `${idx * 50}ms` }}
                >
                  <div className="flex gap-3">
                    <span className="text-pink-400 text-xl flex-shrink-0">★</span>
                    <p className="text-white/90">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        {socialProofStats && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-purple-500/20">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {socialProofStats.projectsCompleted || 200}+
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Fiestas Diseñadas
                </p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  {socialProofStats.yearsExperience || 15}+
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Años Animando Espacios
                </p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                  100%
                </p>
                <p className="mt-2 text-sm uppercase tracking-wider text-white/60">
                  Fiesta Legendaria
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-purple-500/20">
          <h2 className="text-4xl font-bold text-white mb-12">
            Las Historias de Nuestros Clientes
          </h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-2xl border border-purple-500/20">
            <h3 className="font-bold text-lg text-pink-300 mb-3">Nuestro Proceso</h3>
            <p className="text-white/80 leading-relaxed">{processNote}</p>
          </section>
        )}

        {/* Final CTA */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Diseña Tu Centro de Conexión
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            La próxima fiesta épica comienza en tu casa. Hagámosla inolvidable.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Diseñar Fiesta Perfecta"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero información sobre centros de entretenimiento"
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
