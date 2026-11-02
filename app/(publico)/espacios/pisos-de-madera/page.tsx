import Image from 'next/image'
import { SITE_URL } from '@/lib/seo/jsonld'
import { socialMeta } from '@/lib/seo/social'
import { obtenerGaleriaEspacioAction } from '@/lib/data/actions/public'
import { obtenerCanal } from '@/lib/contacto'
import { CtaConversionPisos } from '@/components/veta/cta-conversion-pisos'

const TIPO_ESPACIO_CODIGO = 'pisos_madera'
const canal = obtenerCanal('pisos')

export const metadata = {
  robots: { index: true, follow: true },
  title: 'Restauración y mantenimiento de pisos de madera en Bogotá — Veta Dorada',
  description:
    'Restauramos y mantenemos pisos de madera originales de casonas en Bogotá: pulido, reparación de piezas sueltas, sellado con acabado natural y cuidado periódico. Diagnóstico y visita sin costo con el experto en pisos.',
  alternates: { canonical: `${SITE_URL}/espacios/pisos-de-madera` },
  ...socialMeta({
    title: 'Restauración y mantenimiento de pisos de madera en Bogotá — Veta Dorada',
    description:
      'Restauramos y mantenemos pisos de madera originales de casonas en Bogotá: pulido, reparación de piezas sueltas, sellado con acabado natural y cuidado periódico. Diagnóstico y visita sin costo con el experto en pisos.',
    path: '/espacios/pisos-de-madera',
    image: '/images/home/pisos-madera-restauracion-bogota-1.webp',
  }),
}

// Renderizado dinámico en cada petición: sin caché ISR, siempre muestra el código actual.
export const dynamic = 'force-dynamic'

const HERO_IMG = '/images/home/pisos-madera-restauracion-bogota-1.webp'

export default async function PisosDeMaderaLanding() {
  let galeria: { url: string; alt: string }[] = []
  try {
    galeria = (await obtenerGaleriaEspacioAction(TIPO_ESPACIO_CODIGO)) || []
  } catch {
    galeria = []
  }

  const pasos = [
    { step: '01', title: 'Diagnóstico', desc: 'Visitamos tu casona, evaluamos el estado del piso y te entregamos un diagnóstico con el alcance del trabajo y el costo.' },
    { step: '02', title: 'Pulido', desc: 'Lijamos el piso para retirar el acabado viejo y la capa dañada, dejando la madera lista para el sellado.' },
    { step: '03', title: 'Reparación de piezas sueltas', desc: 'Revisamos y fijamos las piezas sueltas o quebrantadas antes de sellar — el piso queda sólido, no solo brillante.' },
    { step: '04', title: 'Sellado natural', desc: 'Aplicamos el acabado (barniz al agua o poliuretano bajo VOC) para proteger la madera y devolverle su color natural.' },
  ]

  const faqs = [
    {
      q: '¿Cada cuánto debo darle mantenimiento a mi piso de madera?',
      a: 'Cada 5 a 7 años, según el tráfico y la humedad de Bogotá. Un mantenimiento periódico (lija ligera, re-sellado y revisión de piezas sueltas) alarga décadas la vida del piso y evita una restauración mayor.',
    },
    {
      q: '¿Es seguro pulir un piso de madera original de casona?',
      a: 'Sí. Se retira solo la capa del acabado dañado, se reparan las piezas sueltas y se sella con barniz al agua o poliuretano bajo VOC. El piso conserva su carácter y gana solidez y brillo.',
    },
    {
      q: '¿Incluye visita y diagnóstico?',
      a: 'Sí. La visita para ver el piso y el diagnóstico son sin costo. El experto en pisos te dirá con honestidad qué necesita tu piso antes de presupuestar.',
    },
    {
      q: '¿Qué acabados usan?',
      a: 'Barnices al agua y poliuretano de bajo VOC. Protegen la madera, devuelven el brillo natural y cuidan el aire que respira tu familia.',
    },
  ]

  return (
    <div className="bg-white">
      {/* 1. Hero Landing */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-alt)]">
        <Image
          src={HERO_IMG}
          alt="Piso de madera restaurado en Bogotá"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        {/* Overlay de contraste usando token real */}
        <div className="absolute inset-0 bg-[var(--color-text-heading)]/60" />

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center py-20">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            El piso de madera de su casona merece volver a vivir
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto font-light drop-shadow">
            Restauración y mantenimiento de pisos de madera originales: pulido, reparación de piezas sueltas, sellado con acabado natural y cuidado periódico.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <CtaConversionPisos tipo="whatsapp" className="px-8 py-4" size="lg" />
          </div>
        </div>
      </section>

      {/* Respuesta Atómica: seguridad del pulido */}
      <section className="py-16 bg-[var(--color-bg-linen-100)]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--color-brand)] mb-4">
            ¿Es seguro pulir un piso de madera original?
          </h2>
          <p className="text-lg text-[var(--color-text-primary)] max-w-3xl mx-auto leading-relaxed">
            Sí. La restauración respeta la madera original: se retira solo la capa del acabado dañado, se reparan las piezas sueltas y se sella con barniz al agua o poliuretano bajo VOC. El piso conserva su carácter y gana en solidez y brillo.
          </p>
        </div>
      </section>

      {/* Respuesta Atómica: frecuencia de mantenimiento */}
      <section className="py-16 bg-white border-y border-[var(--color-border-default)]">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-serif text-[var(--color-brand)] mb-4">
            ¿Cada cuánto se debe hacer mantenimiento a un piso de madera en Bogotá?
          </h2>
          <p className="text-lg text-[var(--color-text-primary)] max-w-3xl mx-auto leading-relaxed">
            Cada 5 a 7 años, según el tráfico y la humedad de la ciudad. El mantenimiento periódico (lija ligera, re-sellado y revisión de piezas sueltas) alarga décadas la vida del piso y evita una restauración mayor. Un piso bien cuidado no se reemplaza; se conserva.
          </p>
        </div>
      </section>

      {/* 2. Proceso de Restauración (4 pasos) */}
      <section className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-4">
            El proceso de restauración maestro
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg">
            Un método paso a paso diseñado para cuidar el patrimonio de su hogar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {pasos.map((feature, i) => (
            <div
              key={i}
              className="flex flex-col p-6 border border-[var(--color-border-default)] rounded-xl hover:shadow-lg transition-shadow bg-[var(--color-bg-alt)]/30 relative overflow-hidden group"
            >
              <div className="text-6xl font-serif font-bold text-[var(--color-gold-600)]/10 absolute -top-4 -right-2 group-hover:scale-110 transition-transform">
                {feature.step}
              </div>
              <h3 className="text-xl font-serif text-[var(--color-brand)] mb-3 z-10">{feature.title}</h3>
              <p className="text-[var(--color-text-primary)] leading-relaxed z-10">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Galería de pisos */}
      {galeria.length > 0 && (
        <section className="py-20 bg-[var(--color-bg-linen-100)] border-y border-[var(--color-border-default)]">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-serif text-[var(--color-brand)] mb-10 text-center">
              Pisos que hemos restaurado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {galeria.map((foto, i) => (
                <div
                  key={`${foto.url}-${i}`}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]"
                >
                  <Image
                    src={foto.url}
                    alt={foto.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Materiales */}
      <section className="py-20 container mx-auto px-4 max-w-4xl text-center">
        <h2 className="text-3xl font-serif text-[var(--color-brand)] mb-6">
          Acabados que respetan tu hogar
        </h2>
        <p className="text-xl text-[var(--color-text-primary)] max-w-2xl mx-auto font-light leading-relaxed">
          Usamos barnices al agua y poliuretano de bajo VOC (compuestos orgánicos volátiles). Protegen la madera, devuelven el brillo natural y cuidan el aire que respira su familia.
        </p>
      </section>

      {/* 5. Preguntas frecuentes */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif text-[var(--color-brand)] mb-6">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <details
              key={i}
              className="border border-[var(--color-border-default)] rounded-xl p-4 group"
            >
              <summary
                className="flex items-center justify-between font-serif font-medium text-[var(--color-brand)] cursor-pointer list-none"
              >
                {q}
                <span className="text-[var(--color-gold-600)]">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-text-primary)] leading-relaxed font-light">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 6. CTA Final */}
      <section className="py-24 bg-[var(--color-bg-linen-100)] border-t border-[var(--color-border-default)] text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif text-[var(--color-brand)] mb-6">
            ¿Tu piso necesita una segunda vida?
          </h2>
          <p className="text-xl text-[var(--color-text-muted)] mb-10 font-light">
            Contáctanos para un diagnóstico gratuito. Evaluamos el estado de tu piso y te decimos con honestidad qué necesita.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <CtaConversionPisos tipo="whatsapp" className="px-8 py-4" size="lg" />
          </div>
          <div className="mt-8">
            <CtaConversionPisos tipo="telefono" className="px-8 py-4" size="md" />
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'Service',
                serviceType: 'Restauración y mantenimiento de pisos de madera',
                provider: {
                  '@type': 'Organization',
                  name: 'Veta Dorada',
                  url: SITE_URL,
                  telephone: canal.telefono,
                  address: {
                    '@type': 'PostalAddress',
                    streetAddress: 'Cra 72a #71a-57',
                    addressLocality: 'Bogotá',
                    addressRegion: 'Bogotá',
                    addressCountry: 'CO',
                  },
                },
                areaServed: {
                  '@type': 'City',
                  name: 'Bogotá',
                },
                description:
                  'Restauración y mantenimiento de pisos de madera originales: pulido, reparación de piezas sueltas, sellado con acabado natural y cuidado periódico.',
                url: `${SITE_URL}/espacios/pisos-de-madera`,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
                  { '@type': 'ListItem', position: 2, name: 'Espacios', item: `${SITE_URL}/espacios` },
                  { '@type': 'ListItem', position: 3, name: 'Pisos de Madera', item: `${SITE_URL}/espacios/pisos-de-madera` },
                ],
              },
              {
                '@type': 'FAQPage',
                mainEntity: faqs.map((f) => ({
                  '@type': 'Question',
                  name: f.q,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.a,
                  },
                })),
              },
            ],
          }),
        }}
      />
    </div>
  )
}
