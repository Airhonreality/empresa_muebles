'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Check, ArrowRight, MessageCircle, MapPin, Award, ShieldCheck } from 'lucide-react';
import VetaHeader from '../VetaHeader';
import VetaFooter from '../VetaFooter';
import SpaceShowcaseHero from './SpaceShowcaseHero';
import SpaceGallery from './SpaceGallery';
import VetaTestimonials from '../VetaTestimonials';
import type { SpaceShowcaseProps } from '@/types/space-showcase';
import Script from 'next/script';

export default function SpaceShowcasePage({
  categoryId,
  title,
  subtitle,
  description,
  descriptionExtended,
  images,
  benefits,
  testimonials,
  ctaConfig,
  processNote,
  socialProofStats,
}: SpaceShowcaseProps) {
  const [embudoOpen, setEmbudoOpen] = useState(false);

  const categoryLabels: Record<string, string> = {
    cocinas: 'Cocinas',
    closets: 'Closets y vestidores',
    cavas: 'Cavas y bares',
    recibidores: 'Consolas y recibidores',
    entretenimiento: 'Centros de entretenimiento',
    estudios: 'Estudios y home office',
  };

  const categoryLabel = categoryLabels[categoryId];

  // Breadcrumbs
  const breadcrumbs = useMemo(
    () => [
      { label: 'Inicio', path: '/' },
      { label: 'Espacios', path: '/espacios' },
      { label: categoryLabel },
    ],
    [categoryLabel]
  );

  // whatsapp link
  const whatsappLink =
    ctaConfig?.whatsappLink || 'https://wa.me/573017604530?text=Hola+Veta+Dorada';

  // JSON-LD Schema: LocalBusiness
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'Veta Dorada',
    description: `Diseño, fabricación e instalación de ${categoryLabel.toLowerCase()} a medida en Bogotá`,
    url: 'https://vetadeoro.co',
    telephone: '+573017604530',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Carrera 72A',
      addressLocality: 'Bogotá',
      addressRegion: 'Cundinamarca',
      addressCountry: 'CO',
    },
    areaServed: {
      '@type': 'City',
      name: 'Bogotá',
    },
    image: images[0]?.imagen_url || '/vetadeoro/hero.jpg',
  };

  // JSON-LD Schema: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: crumb.label,
      item: crumb.path ? `https://vetadeoro.co${crumb.path}` : undefined,
    })),
  };

  // JSON-LD Schema: ImageGallery
  const imageGallerySchema = {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    associatedMedia: images.map((img) => ({
      '@type': 'ImageObject',
      name: img.image_title,
      description: img.descripcion,
      url: img.imagen_url,
      keywords: img.keywords.join(', '),
    })),
  };

  return (
    <div className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg-warm-paper))] text-[hsl(var(--veta-text-carbon))] selection:bg-[hsl(var(--veta-gold-muted))]/30 selection:text-[hsl(var(--veta-text-carbon))]">
      {/* JSON-LD Scripts */}
      <Script
        id="local-business-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <Script
        id="breadcrumb-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Script
        id="image-gallery-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(imageGallerySchema) }}
      />

      <VetaHeader />

      <main>
        {/* Hero Section */}
        <SpaceShowcaseHero
          title={title}
          subtitle={subtitle}
          description={description}
          images={images}
          breadcrumbs={breadcrumbs}
          ctaConfig={ctaConfig}
        />

        {/* Social Proof Stats */}
        {socialProofStats && (
          <section className="border-b border-[hsl(var(--veta-glass-light-border))] bg-[hsl(var(--veta-bg-linen))] px-4 py-12 sm:px-6 lg:py-16">
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-8 sm:grid-cols-3">
                {socialProofStats.projectsCompleted && (
                  <div className="text-center">
                    <p className="text-4xl font-bold tracking-tight text-[hsl(var(--veta-text-carbon))] md:text-5xl">
                      {socialProofStats.projectsCompleted}+
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">
                      Proyectos completados
                    </p>
                  </div>
                )}
                {socialProofStats.clientsSatisfied && (
                  <div className="text-center">
                    <p className="text-4xl font-bold tracking-tight text-[hsl(var(--veta-text-carbon))] md:text-5xl">
                      {socialProofStats.clientsSatisfied}+
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">
                      Clientes satisfechos
                    </p>
                  </div>
                )}
                {socialProofStats.yearsExperience && (
                  <div className="text-center">
                    <p className="text-4xl font-bold tracking-tight text-[hsl(var(--veta-text-carbon))] md:text-5xl">
                      {socialProofStats.yearsExperience}+
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">
                      Años de experiencia
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Description + Benefits */}
        <section className="border-b border-[hsl(var(--veta-glass-light-border))] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div className="max-w-3xl">
              <h2 className="veta-heading text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.92] tracking-[-0.04em]">
                {descriptionExtended ? title : 'Diseño a tu medida'}
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-[hsl(var(--veta-text-stone))] sm:text-lg">
                {descriptionExtended || description}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-6 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] hover:bg-[hsl(var(--veta-gold-hover))] transition-colors"
                >
                  Consultar <ArrowRight className="h-4 w-4" />
                </a>
                <Link
                  href={`/portafolio?categoria=${categoryId}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] px-6 text-xs font-semibold uppercase tracking-[0.16em] hover:border-[hsl(var(--veta-gold-muted))] transition-colors"
                >
                  Ver proyectos <MessageCircle className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Benefits Card */}
            {benefits && benefits.length > 0 && (
              <div className="veta-surface-stone rounded-[2rem] p-7 sm:p-9">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[hsl(var(--veta-text-stone))]">
                  Lo que resolvemos
                </p>
                <ul className="mt-5 space-y-4">
                  {benefits.map((benefit) => (
                    <li
                      key={benefit}
                      className="flex gap-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--veta-gold-hover))]" />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Process Steps */}
        <section className="px-4 py-16 sm:px-6 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            {[
              [
                '01',
                'Conversamos',
                'Entendemos el uso, las medidas, el estilo y las prioridades de tu espacio.',
              ],
              [
                '02',
                'Diseñamos',
                'Preparamos una propuesta visual y técnica para que puedas decidir con claridad.',
              ],
              [
                '03',
                'Fabricamos e instalamos',
                processNote ||
                  'Fabricamos la solución aprobada en nuestro taller y coordinamos una instalación cuidada en tu espacio.',
              ],
            ].map(([number, step, copy]) => (
              <article
                key={number}
                className="border-t border-[hsl(var(--veta-glass-light-border))] pt-5"
              >
                <p className="text-xs font-bold tracking-[0.2em] text-[hsl(var(--veta-gold-hover))]">
                  {number}
                </p>
                <h3 className="veta-heading mt-4 text-2xl font-semibold">{step}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[hsl(var(--veta-text-stone))]">
                  {copy}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <SpaceGallery images={images} columns={3} showCaptions={true} />

        {/* Testimonials */}
        {testimonials && testimonials.length > 0 && (
          <VetaTestimonials
            testimonios={testimonials.map((t) => ({
              data: {
                nombre_cliente: t.nombre_cliente,
                barrio: t.barrio,
                texto_resena: t.texto_resena,
                calificacion: t.calificacion,
              },
            }))}
          />
        )}

        {/* Final CTA Section */}
        <section className="border-t border-[hsl(var(--veta-glass-light-border))] bg-[hsl(var(--veta-bg-linen))] px-4 py-20 sm:px-6 lg:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="veta-heading text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-[1] tracking-[-0.04em]">
              ¿Listo para transformar tu espacio?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[hsl(var(--veta-text-stone))] lg:text-lg">
              Agendar una consulta es gratis. Nos encantaría conocer tu proyecto y mostrate cómo podemos ayudarte.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[hsl(var(--veta-gold-muted))] px-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#0A0A0A] hover:bg-[hsl(var(--veta-gold-hover))] transition-all"
              >
                Contactar por WhatsApp <ArrowRight className="h-4 w-4" />
              </a>

              {ctaConfig?.calendarLink && (
                <Link
                  href={ctaConfig.calendarLink}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[hsl(var(--veta-glass-light-border))] px-8 text-xs font-semibold uppercase tracking-[0.16em] hover:border-[hsl(var(--veta-gold-muted))] transition-colors"
                >
                  Agendar cita
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <VetaFooter />
    </div>
  );
}
