import Image from 'next/image'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/jsonld'
import { socialMeta } from '@/lib/seo/social'
import { obtenerCanal } from '@/lib/contacto'
import { CtaConversionPisos } from '@/components/veta/cta-conversion-pisos'

const canal = obtenerCanal('pisos')

const TITLE_SEO = 'Restauración de Pisos de Madera en Bogotá | Diagnóstico Gratuito'
const META_DESC = 'Pulido, reparación y sellado de pisos de madera para casas, apartamentos, oficinas y locales en Bogotá. Diagnóstico sin costo. Acabados de bajo VOC.'

export const metadata = {
  robots: { index: true, follow: true },
  title: TITLE_SEO,
  description: META_DESC,
  alternates: { canonical: `${SITE_URL}/espacios/pisos-de-madera` },
  openGraph: {
    title: TITLE_SEO,
    description: META_DESC,
    url: `${SITE_URL}/espacios/pisos-de-madera`,
    siteName: 'Veta Dorada',
    locale: 'es_CO',
    type: 'website',
    images: [
      {
        url: '/images/pisos-madera/piso-macarena.jpeg',
        width: 1200,
        height: 630,
        alt: 'Restauración de piso de madera en Bogotá',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE_SEO,
    description: META_DESC,
    images: ['/images/pisos-madera/piso-macarena.jpeg'],
  },
}

// Renderizado dinámico en cada petición: sin caché ISR, siempre muestra el código actual.
export const dynamic = 'force-dynamic'

const HERO_IMG = '/images/pisos-madera/piso-macarena.jpeg'

const espacios = [
  {
    titulo: 'Casas y apartamentos',
    frase: 'Restauración y cuidado de pisos de madera en el hogar, con acabados que protegen el aire de su familia.',
  },
  {
    titulo: 'Oficinas y espacios de trabajo',
    frase: 'Mantenimiento de pisos de alto tránsito sin interrumpir la operación.',
  },
  {
    titulo: 'Locales comerciales',
    frase: 'Recuperación estética para mejorar la experiencia del cliente.',
  },
  {
    titulo: 'Restaurantes, cafeterías y hoteles',
    frase: 'Pisos resistentes al uso constante, con secado rápido y mínimas molestias.',
  },
  {
    titulo: 'Espacios institucionales',
    frase: 'Conservación de superficies de madera en oficinas, sedes y centros públicos.',
  },
  {
    titulo: 'Casonas y propiedades patrimoniales',
    frase: 'Conservación de madera original y detalles patrimoniales.',
  },
]

const problemas = [
  'Opaco o rayado',
  'Piezas sueltas o ruidosas',
  'Hundimientos o desgaste',
  'Humedad o manchas',
  'Cambio de color',
  'Mantenimiento preventivo',
]

const servicios = [
  'Diagnóstico y visita técnica',
  'Reparación de piezas',
  'Pulido y lijado',
  'Sellado y barnizado',
  'Acabados al agua y poliuretano de bajo VOC',
  'Mantenimiento preventivo',
]

const pasosProceso = [
  { step: '01', title: 'Contacto', desc: 'Escríbanos por WhatsApp, llámenos o envíe un mensaje. Le respondemos en horario hábil.' },
  { step: '02', title: 'Diagnóstico', desc: 'Visita técnica para evaluar el estado del piso. Diagnóstico sin costo y sin compromiso.' },
  { step: '03', title: 'Propuesta', desc: 'Le entregamos el alcance y el precio según el estado real de su piso.' },
  { step: '04', title: 'Ejecución', desc: 'Reparación, pulido y sellado con protección de muebles y áreas durante el trabajo.' },
  { step: '05', title: 'Entrega', desc: 'Revisión final y recomendaciones de cuidado para que su piso dure más.' },
]

const diagnosticoRevisa = [
  'Estado de la madera',
  'Piezas sueltas o quebradas',
  'Humedad o manchas',
  'Nivel de desgaste',
  'Tipo de acabado actual',
]

const faqs = [
  {
    q: '¿Atienden apartamentos, oficinas y locales comerciales?',
    a: 'Sí. Trabajamos en casas, apartamentos, oficinas, locales comerciales, restaurantes, hoteles y espacios institucionales. También atendemos casonas y propiedades patrimoniales como uno más de los espacios que conservamos.',
  },
  {
    q: '¿Qué incluye el diagnóstico sin costo?',
    a: 'Una visita técnica donde revisamos el estado de la madera, piezas sueltas, humedad, desgaste y tipo de acabado. Le entregamos un diagnóstico con el alcance del trabajo y el costo, sin compromiso.',
  },
  {
    q: '¿Se puede restaurar un piso de madera sin reemplazarlo?',
    a: 'En la mayoría de los casos sí. Con pulido, reparación de piezas y sellado se recupera el piso sin necesidad de reemplazarlo. Si el daño es estructural grave, se lo avisamos con honestidad antes de presupuestar.',
  },
  {
    q: '¿Qué acabados usan y qué significa bajo VOC?',
    a: 'Usamos barnices al agua y poliuretano de bajo VOC (compuestos orgánicos volátiles). Protegen la madera, devuelven el brillo y cuidan el aire interior con menor olor y menos emisiones.',
  },
  {
    q: '¿Trabajan en espacios habitados u ocupados?',
    a: 'Sí. Protegemos muebles y áreas con plásticos y cintas, controlamos el polvo durante el lijado y usamos acabados de bajo olor para reducir las molestias.',
  },
  {
    q: '¿Cuánto tiempo dura el proceso?',
    a: 'Depende del tamaño del espacio y del estado del piso. Un diagnóstico define el alcance y le damos un cronograma concreto antes de comenzar.',
  },
  {
    q: '¿Cubren solo Bogotá o también alrededores?',
    a: 'Atendemos en Bogotá y alrededores. Contáctenos para confirmar cobertura en su localidad.',
  },
  {
    q: '¿Cómo se protegen muebles y áreas durante el trabajo?',
    a: 'Cubrimos muebles, pases y zonas aledañas con plásticos y cintas de protección. Controlamos el polvo al lijar y dejamos el espacio limpio al finalizar.',
  },
]

export default async function PisosDeMaderaLanding() {
  const waHref = `https://wa.me/${canal.whatsapp}?text=${encodeURIComponent(
    'Hola, vengo desde su página de pisos de madera y quiero consultar por el diagnóstico de mi piso.'
  )}`

  return (
    <div className="bg-white">
      {/* 1. Hero Landing */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden bg-[var(--color-bg-alt)]">
        <Image
          src={HERO_IMG}
          alt="Restauración de piso de madera en Bogotá"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-[var(--color-text-heading)]/60" />

        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center py-20">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
            Restauración y mantenimiento de pisos de madera en Bogotá
          </h1>
          <p className="text-lg md:text-2xl text-white/90 mb-6 max-w-2xl mx-auto font-light drop-shadow">
            Casas, apartamentos, oficinas, locales comerciales y espacios patrimoniales. Diagnóstico sin costo y acabados de bajo VOC.
          </p>
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto font-light drop-shadow">
            Conservamos y protegemos su piso de madera para que dure más y se vea mejor, sin necesidad de reemplazarlo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <CtaConversionPisos tipo="whatsapp" className="px-8 py-4" size="lg" />
          </div>
        </div>
      </section>

      {/* Botón fijo de WhatsApp en móvil */}
      <a
        href={waHref}
        className="fixed bottom-4 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 md:hidden"
        rel="noopener noreferrer"
        target="_blank"
        aria-label="Consultar por WhatsApp"
      >
        <span>💬</span>
        <span className="font-medium">WhatsApp</span>
      </a>

      {/* 2. ¿Qué espacios atendemos? */}
      <section className="py-20 bg-[var(--color-bg-linen-100)] border-y border-[var(--color-border-default)]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-4">
              ¿Qué espacios atendemos?
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Restauramos y mantenemos pisos de madera en cualquier tipo de espacio, no solo en casonas.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {espacios.map((espacio, i) => (
              <div
                key={i}
                className="p-6 border border-[var(--color-border-default)] rounded-xl bg-white hover:shadow-md transition-shadow"
              >
                <h3 className="text-xl font-serif text-[var(--color-brand)] mb-3">{espacio.titulo}</h3>
                <p className="text-[var(--color-text-primary)] leading-relaxed font-light">{espacio.frase}</p>
              </div>
            ))}
          </div>

          <p className="mt-12 text-center text-[var(--color-text-primary)] text-lg font-light leading-relaxed">
            Si su espacio tiene un piso de madera, lo evaluamos y le proponemos la mejor forma de conservarlo.
          </p>
        </div>
      </section>

      {/* 3. ¿Su piso de madera necesita…? + Servicios */}
      <section className="py-20 container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-6">
              ¿Su piso de madera necesita…?
            </h2>
            <p className="text-[var(--color-text-primary)] mb-8 leading-relaxed font-light">
              No todos los pisos requieren lo mismo. El diagnóstico define si su piso necesita mantenimiento,
              reparación, pulido o sellado. Estos son los problemas más comunes que atendemos:
            </p>
            <div className="space-y-4">
              {problemas.map((p, i) => (
                <div key={i} className="flex items-start gap-3 p-3 border border-[var(--color-border-default)] rounded-lg bg-[var(--color-bg-alt)]/30">
                  <span className="text-[var(--color-gold-600)] text-lg shrink-0">•</span>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">{p}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-6">
              Servicios para pisos de madera
            </h2>
            <p className="text-[var(--color-text-primary)] mb-8 leading-relaxed font-light">
              Ofrecemos restauración y mantenimiento según el estado del piso. No prometemos una
              'restauración integral' cuando no aplica; evaluamos primero y le decimos qué conviene.
            </p>
            <ul className="space-y-3">
              {servicios.map((s, i) => (
                <li key={i} className="flex items-start gap-3 p-3 border border-[var(--color-border-default)] rounded-lg bg-white">
                  <span className="text-[var(--color-gold-600)] text-lg shrink-0">•</span>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">{s}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Galería antes y después — fotos reales de trabajos */}
      <section className="py-20 bg-[var(--color-bg-linen-100)] border-y border-[var(--color-border-default)]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-4">
              Antes y después
            </h2>
            <p className="text-[var(--color-text-muted)] text-lg">
              Fotos reales de restauraciones de pisos de madera en Bogotá. Cada imagen es un trabajo
              real, no una foto de stock.
            </p>
          </div>

          {/* Antes / después destacado */}
          <div className="relative aspect-[4/3] mx-auto max-w-2xl mb-12 rounded-xl overflow-hidden border border-[var(--color-border-default)] shadow-lg">
            <Image
              src="/images/pisos-madera/comparativa-pisos.jpeg"
              alt="Antes y después de restauración de piso de madera en Bogotá"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30">
              <span className="text-white font-serif font-bold text-xl bg-black/60 px-3 py-1 rounded">
                Antes
              </span>
              <span className="text-[var(--color-gold-600)] text-2xl">→</span>
              <span className="text-white font-serif font-bold text-xl bg-black/60 px-3 py-1 rounded">
                Después
              </span>
            </div>
          </div>

          <p className="text-center text-[var(--color-text-muted)] mb-10 text-lg font-light">
            Detalle de reparación de piezas y acabado final por tipo de espacio.
          </p>

          {/* Galería por espacio y problema */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/detalle-piso-1.jpeg"
                alt="Detalle de reparación de piezas sueltas de piso de madera"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">Detalle: reparación de piezas</p>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/piso-chapinero.jpeg"
                alt="Pisos de madera restaurados en Chapinero, Bogotá"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">Chapinero — acabado final</p>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/piso-chapinero-2.jpeg"
                alt="Piso de madera restaurado en Chapinero, segundo proyecto"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">Chapinero — antes y después</p>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/piso-macarena.jpeg"
                alt="Restauración de piso de madera en La Macarena, Bogotá"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">La Macarena — vivienda</p>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/piso-rosales.jpeg"
                alt="Piso de madera restaurado en Rosales, Bogotá"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">Rosales — oficina o local</p>
              </div>
            </div>
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[var(--color-bg-surface-0)]">
              <Image
                src="/images/pisos-madera/piso-teusaquillo.jpeg"
                alt="Pisos de madera restaurados en Teusaquillo, Bogotá"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                <p className="text-white text-sm font-light">Teusaquillo — vivienda</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Proceso paso a paso (confianza y transparencia) */}
      <section className="py-24 container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-4">
            Cómo trabajamos, paso a paso
          </h2>
          <p className="text-[var(--color-text-muted)] text-lg">
            Transparencia total desde el primer contacto hasta la entrega del piso restaurado.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pasosProceso.map((paso, i) => (
            <div
              key={i}
              className="p-6 border border-[var(--color-border-default)] rounded-xl bg-[var(--color-bg-alt)]/30 flex flex-col h-full"
            >
              <div className="text-6xl font-serif font-bold text-[var(--color-gold-600)]/10 mb-4">
                {paso.step}
              </div>
              <h3 className="text-xl font-serif text-[var(--color-brand)] mb-3">{paso.title}</h3>
              <p className="text-[var(--color-text-primary)] leading-relaxed font-light">
                {paso.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl font-serif text-[var(--color-brand)] mb-4">Qué revisamos en el diagnóstico</h3>
            <ul className="space-y-3 text-[var(--color-text-primary)] leading-relaxed">
              {diagnosticoRevisa.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[var(--color-gold-600)]">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-2xl font-serif text-[var(--color-brand)] mb-4">Manejo de polvo, olores y protección</h3>
            <p className="text-[var(--color-text-primary)] leading-relaxed">
              Protegemos muebles y áreas con plásticos y cintas. Controlamos el polvo durante el lijado
              y usamos acabados al agua de bajo olor para reducir las molestias en espacios habitados.
            </p>
            <p className="mt-4 text-[var(--color-text-muted)] text-sm leading-relaxed">
              Si su piso tiene daño estructural grave o podredumbre extensa, puede requerir otra solución
              que no el pulido tradicional. Se lo comunicamos con claridad antes de presupuestar.
            </p>
          </div>
        </div>
      </section>

      {/* 6. CTA intermedio (después del proceso) */}
      <section className="py-20 bg-[var(--color-bg-linen-100)] border-y border-[var(--color-border-default)] text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif text-[var(--color-brand)] mb-6">
            ¿Listo para recuperar su piso de madera?
          </h2>
          <p className="text-xl text-[var(--color-text-muted)] mb-8 font-light">
            Diagnóstico sin costo y sin compromiso. Atención en Bogotá y alrededores.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <CtaConversionPisos tipo="whatsapp" className="px-8 py-4" size="lg" />
          </div>
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Le respondemos en horario hábil.
          </p>
        </div>
      </section>

      {/* 7. Preguntas frecuentes */}
      <section className="py-20 container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif text-[var(--color-brand)] mb-6">
            Preguntas frecuentes
          </h2>
        </div>
        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <details key={i} className="border border-[var(--color-border-default)] rounded-xl p-4 group">
              <summary className="flex items-center justify-between font-serif font-medium text-[var(--color-brand)] cursor-pointer list-none">
                {q}
                <span className="text-[var(--color-gold-600)]">+</span>
              </summary>
              <p className="mt-3 text-[var(--color-text-primary)] leading-relaxed font-light">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 8. CTA final */}
      <section className="py-24 bg-[var(--color-bg-linen-100)] border-t border-[var(--color-border-default)] text-center">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-5xl font-serif text-[var(--color-brand)] mb-6">
            Solicite su diagnóstico sin costo
          </h2>
          <p className="text-xl text-[var(--color-text-muted)] mb-10 font-light">
            Evaluamos el estado de su piso y le proponemos la mejor forma de conservarlo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <CtaConversionPisos tipo="whatsapp" className="px-8 py-4" size="lg" />
          </div>
          <div className="mt-8">
            <CtaConversionPisos tipo="telefono" className="px-8 py-4" size="md" />
          </div>
          <p className="mt-6 text-sm text-[var(--color-text-muted)]">
            Atención en Bogotá y alrededores · Le respondemos en horario hábil
          </p>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'LocalBusiness',
                '@id': `${SITE_URL}/#localbusiness`,
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
                areaServed: {
                  '@type': 'City',
                  name: 'Bogotá',
                },
                description:
                  'Restauración y mantenimiento de pisos de madera en Bogotá: diagnóstico, pulido, reparación de piezas, sellado y acabados de bajo VOC para casas, apartamentos, oficinas y locales.',
              },
              {
                '@type': 'Service',
                serviceType: 'Restauración y mantenimiento de pisos de madera',
                provider: {
                  '@type': 'Organization',
                  name: 'Veta Dorada',
                  url: SITE_URL,
                  telephone: canal.telefono,
                },
                areaServed: {
                  '@type': 'City',
                  name: 'Bogotá',
                },
                description:
                  'Pulido, reparación y sellado de pisos de madera para casas, apartamentos, oficinas y locales en Bogotá. Diagnóstico sin costo. Acabados de bajo VOC.',
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
