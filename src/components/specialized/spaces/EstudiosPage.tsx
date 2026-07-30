'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ChevronRight, Lightbulb, Check } from 'lucide-react';
import Script from 'next/script';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import TestimonialsAdapter from './shared/TestimonialsAdapter';
import ImageGallery from './shared/ImageGallery';
import CTAButton, { WhatsAppCTA } from './shared/CTAButton';
import { useScrollAnimation } from './shared/useScrollAnimation';
import type { EstudiosPageProps } from './types';

export default function EstudiosPage({
  title,
  description,
  images,
  testimonials,
  ctaConfig,
  socialProofStats,
  descriptionExtended,
  benefits,
  processNote,
}: EstudiosPageProps) {
  const [selectedChecklist, setSelectedChecklist] = useState<number[]>([]);
  const { ref: checklistRef, isVisible: checklistVisible } = useScrollAnimation();

  const ergonomicChecklist = [
    {
      category: 'Altura y Distancia',
      items: [
        { label: 'Escritorio a altura de codo', desc: 'Evita tensión en hombros' },
        { label: 'Monitor a distancia de brazo', desc: '50-60 cm de los ojos' },
        { label: 'Pantalla a altura de ojos', desc: 'Evita cuello hacia adelante' },
      ],
    },
    {
      category: 'Iluminación',
      items: [
        { label: 'Luz natural preferente', desc: 'Lado izquierdo para diestros' },
        { label: 'Luz de apoyo sin reflejos', desc: 'LED 4000K recomendado' },
        { label: 'Control de brillo', desc: 'Regulable según hora del día' },
      ],
    },
    {
      category: 'Postura y Apoyo',
      items: [
        { label: 'Silla con soporte lumbar', desc: 'Ajuste ergonómico completo' },
        { label: 'Reposapiés opcional', desc: 'Para descanso de piernas' },
        { label: 'Reposamuñecas', desc: 'Para teclado y mouse' },
      ],
    },
  ];

  const productivityStories = [
    {
      metric: '4 horas',
      description: 'de enfoque continuo sin distracciones',
      emoji: '⏰',
    },
    {
      metric: '90% menos',
      description: 'dolor de espalda después del cambio',
      emoji: '✓',
    },
    {
      metric: '+2 horas',
      description: 'productividad diaria ganadas',
      emoji: '📈',
    },
  ];

  const toggleChecklist = (idx: number) => {
    setSelectedChecklist((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: 'Estudios' },
    ],
    []
  );

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada - Estudios y Home Office',
    description: 'Diseño, fabricación e instalación de estudios a medida en Bogotá',
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    image: images[0]?.imagen_url,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-slate-50 text-slate-900">
      <Script
        id="local-business-schema-estudios"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />

      <VetaHeader />

      <main className="space-y-0">
        {/* Hero: Meditative Calm */}
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
          {/* Subtle Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-slate-50 to-green-100" />

          {/* Zen Circles */}
          <div className="absolute top-40 right-20 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-40 left-20 w-80 h-80 bg-green-200/20 rounded-full blur-3xl" />

          {/* Background Image */}
          <div className="absolute inset-0 opacity-15">
            <Image
              src={images[0]?.imagen_url || '/vetadeoro/estudios-hero.jpg'}
              alt="Hero estudios"
              fill
              className="object-cover"
              priority
            />
          </div>

          {/* Breadcrumbs */}
          <div className="absolute top-8 left-6 z-10">
            <nav className="flex items-center gap-2 text-xs text-slate-600">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <ChevronRight className="w-3 h-3" />}
                  {crumb.path ? (
                    <Link href={crumb.path} className="hover:text-slate-800 transition">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-800">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          <div className="relative z-5 mx-auto max-w-7xl px-6 py-20 sm:px-8">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300 bg-blue-50 px-4 py-2">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Productividad + Serenidad
                </span>
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-[1.1]">
                Espacio que inspira, {' '}
                <span className="bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-clip-text text-transparent">
                  enfoca y calma
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-700 mb-8 max-w-2xl leading-relaxed">
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
                  message="Quiero diseñar mi estudio home office"
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
            <p className="text-lg text-slate-700 leading-relaxed max-w-3xl">
              {descriptionExtended}
            </p>
          </section>
        )}

        {/* Image Gallery */}
        <section className="px-6 sm:px-8 py-12 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Espacios de Inspiración</h2>
          <ImageGallery images={images} variant="carousel" className="w-full" />
        </section>

        {/* Ergonomic Checklist - Interactive */}
        <section
          ref={checklistRef}
          className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-blue-200"
        >
          <h2 className="text-4xl font-bold text-slate-900 mb-4">Ergonomía Perfecta</h2>
          <p className="text-slate-600 mb-12">
            Revisa cada punto. Tu cuerpo te lo agradecerá.
          </p>

          <div className="space-y-8">
            {ergonomicChecklist.map((section, sidx) => (
              <div
                key={sidx}
                className={`rounded-xl border transition-all duration-300 ${
                  checklistVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                } ${
                  selectedChecklist.length > sidx
                    ? 'border-green-300 bg-green-50'
                    : 'border-blue-200 bg-white'
                }`}
                style={{ transitionDelay: `${sidx * 100}ms` }}
              >
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4">
                    {section.category}
                  </h3>
                  <div className="space-y-3">
                    {section.items.map((item, iidx) => (
                      <div
                        key={iidx}
                        onClick={() =>
                          toggleChecklist(sidx * 3 + iidx)
                        }
                        className="cursor-pointer flex gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        <div
                          className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                            selectedChecklist.includes(sidx * 3 + iidx)
                              ? 'bg-green-500 border-green-500'
                              : 'border-slate-300'
                          }`}
                        >
                          {selectedChecklist.includes(sidx * 3 + iidx) && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {item.label}
                          </p>
                          <p className="text-sm text-slate-600">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Productivity Metrics */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-blue-200">
          <h2 className="text-4xl font-bold text-slate-900 mb-12">
            Impacto Real en Productividad
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {productivityStories.map((story, idx) => (
              <div
                key={idx}
                className="rounded-xl bg-gradient-to-br from-blue-50 to-green-50 border border-blue-200 p-8 text-center hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-5xl mb-4">{story.emoji}</div>
                <p className="text-4xl font-bold text-slate-900 mb-2">
                  {story.metric}
                </p>
                <p className="text-slate-600">{story.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        {benefits && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-blue-200">
            <h2 className="text-4xl font-bold text-slate-900 mb-12">
              Diseño Pensado en Ti
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-blue-200 bg-white p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="text-2xl flex-shrink-0">
                      {idx === 0 && '✓'}
                      {idx === 1 && '✦'}
                      {idx === 2 && '→'}
                      {idx === 3 && '◆'}
                    </div>
                    <p className="text-slate-700">{benefit}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Testimonials */}
        <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-blue-200">
          <h2 className="text-4xl font-bold text-slate-900 mb-12">
            Historias de Productividad
          </h2>
          <TestimonialsAdapter testimonials={testimonials} />
        </section>

        {/* Process Note */}
        {processNote && (
          <section className="px-6 sm:px-8 py-16 max-w-7xl mx-auto bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl border border-blue-200">
            <h3 className="font-bold text-lg text-slate-900 mb-3">Cómo Trabajamos</h3>
            <p className="text-slate-700 leading-relaxed">{processNote}</p>
          </section>
        )}

        {/* Stats */}
        {socialProofStats && (
          <section className="px-6 sm:px-8 py-20 max-w-7xl mx-auto border-t border-blue-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {socialProofStats.projectsCompleted || 250}+
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Espacios Productivos
                </p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  {socialProofStats.yearsExperience || 15}+
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Años Diseñando Enfoque
                </p>
              </div>
              <div>
                <p className="text-5xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  100%
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-slate-600">
                  Satisfacción
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="px-6 sm:px-8 py-20 max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-slate-900 mb-6">
            Diseña Tu Espacio de Enfoque
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
            Que tu ambiente sea tan productivo como tus ambiciones.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <CTAButton
              href={ctaConfig.calendarLink}
              label="Diseño Funcional"
              variant="primary"
              external
            />
            <WhatsAppCTA
              phoneNumber="573017604530"
              message="Quiero transformar mi espacio de trabajo"
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
