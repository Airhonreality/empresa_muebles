'use client';

import VetaTestimonials from '../../VetaTestimonials';
import type { TestimonialItem } from '../types';
import type { PublicTestimonial } from '@/lib/veta/public-content';

/**
 * Adaptador que convierte TestimonialItem al formato PublicTestimonial
 * para usar con VetaTestimonials
 */
export default function TestimonialsAdapter({
  testimonials,
}: {
  testimonials: TestimonialItem[];
}) {
  // Convertir al formato que VetaTestimonials espera
  const adaptedTestimonials: PublicTestimonial[] = testimonials.map((t) => ({
    id: `${t.nombre_cliente}-${t.barrio}`,
    context: 'testimonios_publicos',
    data: {
      nombre_cliente: t.nombre_cliente,
      barrio: t.barrio,
      texto_resena: t.texto_resena,
      calificacion: t.calificacion,
      proyecto_relacionado: t.proyecto_relacionado,
    },
  }));

  return <VetaTestimonials testimonios={adaptedTestimonials} />;
}
