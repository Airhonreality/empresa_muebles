import { Metadata } from 'next';
import Link from 'next/link';
import { listarTestimoniosPublicadosAction, listarPortafolioPublicadosAction } from '@/lib/data/actions/public';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Testimonios de clientes — Veta Dorada',
  description: 'Lee lo que dicen nuestros clientes sobre sus proyectos de carpintería arquitectónica en Bogotá. Testimonios reales con nombre, barrio y tipo de espacio.',
};

// Componente para pintar estrellas
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex text-gold-500 mb-4" aria-label={`Calificación de ${rating} estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} className={`w-5 h-5 ${i < rating ? 'fill-current' : 'text-border-subtle fill-current'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function TestimoniosPage() {
  const [testimonios, portafolio] = await Promise.all([
    listarTestimoniosPublicadosAction(),
    listarPortafolioPublicadosAction()
  ]);

  // Cruzar testimonios con portafolio (Degradación Graciosa)
  const testimoniosEnriquecidos = testimonios.map(t => {
    const proyectoRelacionado = portafolio.find(p => p.proyectoId === t.proyectoId);
    return {
      ...t,
      slugPortafolio: proyectoRelacionado ? proyectoRelacionado.slug : null
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Testimonios de clientes de Veta Dorada",
            "description": "Historias reales de proyectos entregados en Bogotá y la sabana."
          })
        }}
      />

      {/* Hero */}
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-6 tracking-tight">
            Lo que dicen nuestros clientes
          </h1>
          <p className="text-lg text-text-primary mb-10">
            Historias reales de proyectos entregados en Bogotá y la sabana.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agenda-tu-asesoria" className="px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors w-full sm:w-auto">
              Agenda tu asesoría gratuita
            </Link>
            
          </div>
        </div>
      </section>

      {/* Grid de Testimonios */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-6xl px-6">
          {testimoniosEnriquecidos.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {testimoniosEnriquecidos.map(t => (
                <div key={t.id} className="bg-bg-raised border border-border-subtle p-8 rounded-md shadow-sm flex flex-col h-full">
                  <StarRating rating={t.rating || 5} />
                  <blockquote className="text-text-heading text-lg mb-6 flex-1">
                    "{t.contenido}"
                  </blockquote>
                  <div className="mt-auto border-t border-border-subtle pt-4">
                    <p className="font-bold text-text-heading">{t.nombreAutor}</p>
                    <p className="text-sm text-text-muted">
                      {t.tipoProyecto || 'Proyecto a medida'} {t.barrio && `en ${t.barrio}`}
                    </p>
                    {t.fuente && (
                      <p className="text-xs text-text-muted mt-1 opacity-70">
                        Vía {t.fuente}
                      </p>
                    )}
                    
                    {/* Botón de Enlace a Portafolio (Regla R3: Cruce Testimonio <-> Portafolio) */}
                    {t.slugPortafolio && (
                      <div className="mt-4">
                        <Link href={`/portafolio/${t.slugPortafolio}`} className="text-sm font-medium text-gold-600 hover:text-gold-700 inline-flex items-center gap-1 transition-colors">
                          Ver fotos del proyecto
                          <span aria-hidden="true">→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              Próximamente publicaremos más historias de nuestros clientes.
            </div>
          )}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-bg-surface border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">¿Listo para ser nuestro próximo cliente satisfecho?</h2>
          <p className="text-lg text-text-primary mb-10">
            Agenda una asesoría gratuita y descubre por qué nuestros clientes nos recomiendan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agenda-tu-asesoria" className="px-8 py-4 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors w-full sm:w-auto">
              Agenda tu asesoría gratuita
            </Link>
            
          </div>
        </div>
      </section>
    </>
  );
}
