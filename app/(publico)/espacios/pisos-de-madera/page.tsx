import Image from 'next/image'
import { SITE_URL } from '@/lib/seo/jsonld'

export const metadata = {
  title: 'Restauración de pisos de madera en Bogotá — Veta Dorada',
  description: 'Restauramos pisos de madera originales de casonas en Bogotá: pulido, reparación de piezas sueltas y sellado con acabado natural. Solicita tu diagnóstico gratuito.',
  alternates: { canonical: `${SITE_URL}/espacios/pisos-de-madera` },
}

const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20un%20diagn%C3%B3stico%20gratuito%20para%20restaurar%20mi%20piso%20de%20madera.'

export default function PisosDeMaderaLanding() {
  return (
    <div className="bg-white">
      {/* 1. Hero Landing */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden">
        {/* Auditoría 2026-08-15 (B5): hero apuntaba a /images/portafolio/reales/hero_piso_madera_*.png,
            que no existe en public/ — fotos reales pendientes de recuperar del sitio legacy (I-016).
            Se usa temporalmente la foto real de pisos ya disponible en public/images/home/. */}
        <Image
          src="/images/home/pisos-madera-restauracion-bogota-1.webp"
          alt="Piso de madera restaurado en Bogotá"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" /> {/* Overlay para contraste de texto */}

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            El piso de madera de su casona merece volver a vivir
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-light drop-shadow">
            Restauramos pisos de madera originales: pulido, reparación de piezas sueltas y sellado con acabado natural. Sin perder el carácter del piso que guarda la historia de tu casa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {/* B6 (auditoría 2026-08-15): apuntaba a /asesoria, ruta inexistente (F-12 sin
                construir, diferida en TAREAS_DIFERIDAS.md) — mismo criterio que el resto del
                sitio, CTA a WhatsApp mientras F-12 no exista. */}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded hover:bg-[var(--color-primary-hover)] transition-colors shadow-lg hover:shadow-xl">
              Solicitar diagnóstico gratuito
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-4 border-2 border-white/80 bg-black/20 backdrop-blur-sm text-white font-medium rounded hover:bg-white hover:text-black transition-colors">
              Hablamos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Respuesta Atómica */}
      <section className="py-12 bg-[var(--color-bg-linen)]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--color-primary)] mb-4">
            ¿Es seguro pulir un piso de madera original?
          </h2>
          <p className="text-lg text-[var(--color-text)] max-w-3xl mx-auto leading-relaxed">
            Sí. La restauración respeta la madera original: se retira solo la capa del acabado dañado, se reparan las piezas sueltas y se sella con barniz al agua o poliuretano bajo VOC. El piso conserva su carácter y gana en solidez y brillo.
          </p>
        </div>
      </section>

      {/* 2. Proceso de Restauración (Feature Grid 4 steps) */}
      <section className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-primary)] mb-4">El proceso de restauración maestro</h2>
          <p className="text-[var(--color-text-muted)] text-lg">Un método paso a paso diseñado para cuidar el patrimonio de su hogar.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { step: '01', title: 'Diagnóstico', desc: 'Visitamos tu casona, evaluamos el estado del piso y te entregamos un diagnóstico con el alcance del trabajo y el costo.' },
            { step: '02', title: 'Pulido', desc: 'Lijamos el piso para retirar el acabado viejo y la capa dañada, dejando la madera lista para el sellado.' },
            { step: '03', title: 'Reparación de piezas sueltas', desc: 'Revisamos y fijamos las piezas sueltas o quebrantadas antes de sellar — el piso queda sólido, no solo brillante.' },
            { step: '04', title: 'Sellado natural', desc: 'Aplicamos el acabado (barniz al agua o poliuretano bajo VOC) para proteger la madera y devolverle su color natural.' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col p-6 border border-[var(--color-border)] rounded-xl hover:shadow-lg transition-shadow bg-[var(--color-bg-linen)]/30 relative overflow-hidden group">
              <div className="text-6xl font-serif font-bold text-[var(--color-accent)]/10 absolute -top-4 -right-2 group-hover:scale-110 transition-transform">
                {feature.step}
              </div>
              <h3 className="text-xl font-serif text-[var(--color-primary)] mb-3 z-10">{feature.title}</h3>
              <p className="text-[var(--color-text)] leading-relaxed z-10">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Galería Antes/Después — oculta a propósito (auditoría 2026-08-15, B5): las 2 fotos
          (piso_madera_antes/despues_*.png) no existen en public/, son fotos reales pendientes de
          recuperar del sitio legacy (I-016). Se restaura esta sección cuando existan. */}

      {/* 4. Materiales */}
      <section className="py-20 container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-serif text-[var(--color-primary)] mb-6">Acabados que respetan tu hogar</h2>
        <p className="text-xl text-[var(--color-text)] max-w-2xl mx-auto font-light leading-relaxed">
          Usamos barnices al agua y poliuretano de bajo VOC (compuestos orgánicos volátiles). Protegen la madera, devuelven el brillo natural y cuidan el aire que respira su familia.
        </p>
      </section>

      {/* 5. CTA Final */}
      <section className="py-24 bg-[var(--color-bg-linen)] border-t border-[var(--color-border)] text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif text-[var(--color-primary)] mb-6">¿Tu piso necesita una segunda vida?</h2>
          <p className="text-xl text-[var(--color-text-muted)] mb-10 font-light">
            Contáctanos para un diagnóstico gratuito. Evaluamos el estado de tu piso y te decimos con honestidad qué necesita.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-[var(--color-primary)] text-white text-lg font-medium rounded hover:bg-[var(--color-primary-hover)] transition-colors shadow-md hover:shadow-lg">
              Solicitar diagnóstico gratuito
            </a>
          </div>
          <div className="mt-8">
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] font-medium hover:underline inline-flex items-center gap-2">
              O escríbenos por WhatsApp
              <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
