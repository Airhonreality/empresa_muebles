import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cómo trabajamos con muebles a la medida en Bogotá — Veta Dorada',
  description: 'Conoce el proceso de Veta Dorada: visita, medición, cotización línea por línea, fabricación en taller propio e instalación con garantía. Sin costos ocultos.',
};

export default function ComoTrabajamosPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            "name": "Diseño y fabricación de muebles a la medida",
            "provider": {
              "@type": "LocalBusiness",
              "name": "Veta Dorada"
            },
            "areaServed": {
              "@type": "City",
              "name": "Bogotá"
            },
            "hasOfferCatalog": {
              "@type": "OfferCatalog",
              "name": "Proceso de trabajo",
              "itemListElement": [
                {
                  "@type": "HowToStep",
                  "position": 1,
                  "name": "Visita y diseño",
                  "text": "Visitamos tu espacio, lo medimos con precisión y conversamos sobre materiales, acabados y necesidades. Sin compromiso, sin costo."
                },
                {
                  "@type": "HowToStep",
                  "position": 2,
                  "name": "Cotización detallada",
                  "text": "Recibes un presupuesto línea por línea con materiales, tiempos y alcance. Sin sorpresas, sin costos ocultos."
                },
                {
                  "@type": "HowToStep",
                  "position": 3,
                  "name": "Producción en taller",
                  "text": "Fabricamos cada pieza en nuestro taller con los materiales y acabados que elegiste. Tú puedes corroborar acabados en físico durante la etapa de negociación."
                },
                {
                  "@type": "HowToStep",
                  "position": 4,
                  "name": "Entrega e instalación",
                  "text": "Llevamos cada pieza a tu espacio, la instalamos y dejamos todo funcionando. Con garantía y acompañamiento."
                }
              ]
            }
          })
        }}
      />
      
      {/* Hero */}
      <section className="bg-bg-alt py-16 md:py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-serif text-text-heading mb-6 tracking-tight">
            Cómo trabajamos
          </h1>
          <p className="text-lg text-text-primary max-w-3xl mx-auto mb-10">
            Un proceso claro y sin sorpresas: te visitamos, te cotizamos línea por línea, fabricamos en nuestro taller y te lo dejamos instalado. Así de directo. Tres generaciones de oficio respaldan cada paso.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/agenda-tu-asesoria" className="px-6 py-3 bg-gold-600 hover:bg-gold-700 text-white font-medium rounded-sm transition-colors w-full sm:w-auto">
              Agenda tu asesoría gratuita
            </Link>
            
          </div>
        </div>
      </section>

      {/* Los 4 pasos */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-bg-raised border border-border-subtle p-6 rounded-md shadow-sm">
              <div className="text-3xl font-bold text-gold-600 mb-4">01</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Visita y diseño</h3>
              <p className="text-text-primary text-sm">
                Visitamos tu espacio, lo medimos con precisión y conversamos sobre materiales, acabados y necesidades. Sin compromiso, sin costo.
              </p>
            </div>
            <div className="bg-bg-raised border border-border-subtle p-6 rounded-md shadow-sm">
              <div className="text-3xl font-bold text-gold-600 mb-4">02</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Cotización detallada</h3>
              <p className="text-text-primary text-sm">
                Recibes un presupuesto línea por línea con materiales, tiempos y alcance. Sin sorpresas, sin costos ocultos.
              </p>
            </div>
            <div className="bg-bg-raised border border-border-subtle p-6 rounded-md shadow-sm">
              <div className="text-3xl font-bold text-gold-600 mb-4">03</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Producción en taller</h3>
              <p className="text-text-primary text-sm">
                Fabricamos cada pieza en nuestro taller con los materiales y acabados que elegiste. Tú puedes corroborar acabados en físico durante la etapa de negociación.
              </p>
            </div>
            <div className="bg-bg-raised border border-border-subtle p-6 rounded-md shadow-sm">
              <div className="text-3xl font-bold text-gold-600 mb-4">04</div>
              <h3 className="text-xl font-bold text-text-heading mb-3">Entrega e instalación</h3>
              <p className="text-text-primary text-sm">
                Llevamos cada pieza a tu espacio, la instalamos y dejamos todo funcionando. Con garantía y acompañamiento.
              </p>
            </div>
          </div>
          <div className="mt-8 p-4 bg-bg-surface rounded-md border border-border-subtle text-sm text-text-primary text-center">
            El diseño 3D está incluido en la asesoría por un valor definido, deducible del anticipo de tu proyecto. Más detalles al agendar.
          </div>
        </div>
      </section>

      {/* Nota de acabados */}
      <section className="py-16 bg-bg-alt border-t border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">Corrobora los acabados en físico</h2>
          <p className="text-lg text-text-primary mb-4">
            Antes de aprobar tu proyecto, siempre puedes corroborar los acabados en físico. No se envían muestras a domicilio como oferta pública: es un servicio que ocurre durante la negociación con tus asesores.
          </p>
          <p className="text-sm text-text-muted">
            El material se ve distinto en una foto. Por eso, el acabado se verifica con la mano en el taller antes de que lo apruebes.
          </p>
        </div>
      </section>

      {/* Garantía */}
      <section className="py-16 md:py-24 bg-bg-paper">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">Garantía y acompañamiento</h2>
          <p className="text-lg text-text-primary mb-8">
            Cada proyecto entrega se recibe con garantía y acompañamiento. Si algo necesita atención después de la instalación, estamos a un mensaje.
          </p>
          
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 md:py-24 bg-bg-surface border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-serif text-text-heading mb-6">¿Empezamos con tu espacio?</h2>
          <p className="text-lg text-text-primary mb-10">
            El primer paso es una visita sin costo y sin compromiso. Cuéntanos qué tienes en mente y un diseñador te acompaña desde la primera medición.
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
