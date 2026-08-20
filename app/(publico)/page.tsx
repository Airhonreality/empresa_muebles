import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { 
  listarPortafolioPublicadosAction, 
  listarTestimoniosPublicadosAction,
  obtenerHeroCarouselImagesAction,
  obtenerPrecioAsesoria3dAction
} from '@/lib/data/actions/public';
import { getHomeJsonLd, SITE_URL } from '@/lib/seo/jsonld';
import { HeroCarousel } from '@/components/veta/hero-carousel';
import { AsesoriaBoton } from '@/components/veta/asesoria-boton';
import { socialMeta } from '@/lib/seo/social';
import { MetaItem } from '@/components/veta/meta-item';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';

// Server Component a propósito (auditoría 2026-08-15, P1-3): antes era 'use client', lo que
// impedía exportar metadata/generateMetadata — Home heredaba el title/description genérico del
// layout raíz, igual que otras 6 páginas sin metadata propia. También resuelve el hallazgo de
// arquitectura (A1-A3 del plan): ya no depende de useDataStore()/<DataStoreProvider> (que ya no
// hidrata el árbol público, ver app/layout.tsx), trae el portafolio publicado por Server Action
// escopada (lib/data/actions/public.ts).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Veta Dorada — Carpintería arquitectónica en Bogotá',
  description:
    'Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida. Tres generaciones de oficio.',
  alternates: { canonical: SITE_URL },
  ...socialMeta({
    title: 'Veta Dorada — Carpintería arquitectónica en Bogotá',
    description:
      'Estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas, closets, centros de entretenimiento y espacios integrales en madera a la medida.',
    path: '/',
    image: '/images/home/cocinas-integrales-diseno-fabricacion-bogota-1.webp',
  }),
};

// F-01 Home real (D-10). Copy textual de arnes/lineas/demanda/contenido/contenido_F01_home.md,
// aprobado por el Supervisor 2026-08-09. No se fabrica copy nuevo acá.
//
// F-09 (landing por categoría) y F-10 (índice /espacios) ya existen (2026-08-17) -- las cards de
// "Espacios que creamos" navegan a su landing real en vez de WhatsApp (fix de UX, antes las 7
// mandaban directo a WhatsApp por esta misma nota, que ya no aplica para esta sección).
//
// F-12 (agendar asesoría), F-11 (proceso), F-13 (testimonios), F-18 (historia) y F-19 (arquitectos) ya existen (Bloque B3 implementado).
// Los CTAs dirigen a su respectiva página para mantener al usuario en el circuito cerrado.
function CtaSecondary({ href, children }: { href: string; children: React.ReactNode }) {
  const externa = href.startsWith('http');
  const className =
    'inline-flex items-center justify-center rounded-sm border border-gold-400 px-6 py-3 text-sm text-gold-700 transition-colors duration-300 hover:bg-gold-100/40';
  if (externa) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function ImagenPlaceholder({ inicial, className }: { inicial: string; className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-bg-alt ${className ?? ''}`}>
      <span className="text-4xl font-display font-bold text-gold-300/40">{inicial}</span>
    </div>
  );
}

const VALIDACION_TECNICA = [
  {
    imageKey: 'validacionTaller',
    titulo: 'Asesoría Integral',
    cuerpo:
      'Te guiamos en cada paso: distribución, materiales y diseño funcional.',
  },
  {
    imageKey: 'validacion3d',
    titulo: 'Modelado 3D y Optimización',
    cuerpo:
      'Visualiza tu proyecto antes de que empiece, asegurando una ejecución sin sorpresas.',
  },
  {
    imageKey: 'validacionDiseñador',
    titulo: 'Garantía y Satisfacción',
    cuerpo:
      'Aseguramos la calidad y durabilidad de cada proyecto, respaldados por nuestra experiencia.',
  },
];

const ESPACIOS = [
  { nombre: 'Cocinas Integrales', imageKey: 'espaciosCocinas', href: '/espacios/cocinas-integrales-bogota' },
  { nombre: 'Closets y Vestidores', imageKey: 'espaciosClosets', href: '/espacios/closets-vestidores-bogota' },
  { nombre: 'Centros de Entretenimiento', imageKey: 'espaciosCentrosEnt', href: '/espacios/centros-de-entretenimiento' },
  { nombre: 'Estudios y Home Office', imageKey: 'espaciosEstudios', href: '/espacios/estudios-home-office' },
  { nombre: 'Cavas y Bares', imageKey: 'espaciosCavas', href: '/espacios/cavas-y-bares' },
  { nombre: 'Consolas y Recibidores', imageKey: 'espaciosConsolas', href: '/espacios/consolas-recibidores' },
  { nombre: 'Pisos de Madera', imageKey: 'espaciosPisos', href: '/espacios/pisos-de-madera' },
];

const PASOS = [
  {
    titulo: 'Visita y diseño',
    cuerpo: 'Visitamos tu espacio, lo medimos con precisión y conversamos sobre materiales, acabados y necesidades. Sin compromiso, sin costo.',
  },
  {
    titulo: 'Cotización detallada',
    cuerpo: 'Recibes un presupuesto línea por línea con materiales, tiempos y alcance. Sin sorpresas, sin costos ocultos.',
  },
  {
    titulo: 'Producción en taller',
    cuerpo: 'Fabricamos cada pieza en nuestro taller con los materiales y acabados que elegiste. Tú puedes corroborar acabados en físico durante la etapa de negociación.',
  },
  {
    titulo: 'Entrega e instalación',
    cuerpo: 'Llevamos cada pieza a tu espacio, la instalamos y dejamos todo funcionando. Con garantía y acompañamiento.',
  },
];

export default async function Home() {
  const [proyectosDestacados, heroImages, precio3d] = await Promise.all([
    listarPortafolioPublicadosAction().then(res => res.slice(0, 3)),
    obtenerHeroCarouselImagesAction(),
    obtenerPrecioAsesoria3dAction()
  ]);
  
  const formattedPrice = precio3d !== null 
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio3d || 130000)
    : 'tarifa vigente';
  // Testimonios reales curados (I-050, I-019 — reseñas de Google Business Profile) ya no se
  // hardcodean (D-01-9 T-03): vienen de store.testimonios.publicados() por Server Action escopada.
  // El seed de datos vive en lib/data/fixtures.ts TESTIMONIOS + DB (testimonios.nombre_autor).
  const testimonios = (await listarTestimoniosPublicadosAction()).map((t) => ({
    nombre: t.nombreAutor ?? 'Cliente de Veta Dorada',
    texto: t.contenido,
    barrio: t.barrio ?? undefined,
    tipoProyecto: t.tipoProyecto ?? undefined,
  }));

  // JSON-LD: HomeAndConstructionBusiness + Organization + WebSite
  // Fuente: contenido_F01_home.md §7, plan_seo_2026.md §2 — centralizado en lib/seo/jsonld.ts.
  const jsonLd = getHomeJsonLd(testimonios);

  return (
    <div>
      {/* 1. Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-bg-paper">
        <div className="grid lg:grid-cols-2 lg:min-h-[85vh]">
          {/* Lado Izquierdo: Manifiesto */}
          <div className="relative z-10 flex flex-col justify-center px-8 py-20 lg:px-16 lg:pt-32 lg:pb-24">
            <div className="absolute inset-0 z-[-1] opacity-5 pointer-events-none mix-blend-multiply" style={{ backgroundImage: "url('/vetas-decorativas.svg')", backgroundSize: "cover", backgroundPosition: "center" }} />
            <h1 className="font-display text-display-publico font-semibold text-text-heading leading-tight">
              Carpintería arquitectónica.<br />Diseñamos, fabricamos, instalamos.
            </h1>
            <p className="mt-6 text-text-lead text-gold-700 italic">Diseña tu espacio. Habita el bienestar.</p>
            {/* Copy intermedio oculto temporalmente por solicitud del usuario */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <AsesoriaBoton precio3dFormatted={formattedPrice}>
                Agenda tu asesoría
              </AsesoriaBoton>
            </div>
          </div>
          {/* Lado Derecho: Imagen de alta calidad */}
          <div className="relative h-[50vh] lg:h-auto overflow-hidden bg-bg-alt">
            <HeroCarousel
              images={heroImages}
              fallbackImage={{ src: HOME_IMAGES_SEO.hero.src, alt: HOME_IMAGES_SEO.hero.alt }}
              priority={true}
              sizes="100vw"
            />
          </div>
        </div>
      </section>

      {/* 1.5. RA-1: Respuesta Atómica primaria (D-01-3) reubicada */}
      <section className="bg-bg-paper py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl lg:text-5xl font-semibold text-text-heading leading-tight">
                ¿Qué es Veta Dorada?
              </h2>
              <div className="mt-6 w-16 h-1 bg-gold-400"></div>
            </div>
            <div className="lg:col-span-7">
              <p className="text-text-muted text-lg lg:text-xl leading-relaxed font-light">
                Somos un estudio de carpintería arquitectónica en Bogotá. Diseñamos, fabricamos e instalamos cocinas,
                closets, centros de entretenimiento y espacios integrales en madera — todo a la medida, con diseño
                contemporáneo y manufactura en taller propio. Tres generaciones de oficio en la construcción, desde
                1995.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Validación Técnica */}
      <section className="bg-charcoal-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-12 md:grid-cols-3">
            {VALIDACION_TECNICA.map((card) => {
              const imgData = HOME_IMAGES_SEO[card.imageKey as keyof typeof HOME_IMAGES_SEO];
              return (
                <div key={card.titulo} className="group relative flex flex-col w-full cursor-default">
                  {/* Image Container (Text is OUTSIDE below) */}
                  <div className="relative h-[450px] w-full overflow-hidden rounded-sm mb-6">
                    <Image
                      src={imgData.src}
                      alt={imgData.alt}
                      fill
                      className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>

                  {/* Content (Outside) */}
                  <div className="flex flex-col">
                    <h3 className="font-display text-xl font-semibold text-gold-500 mb-3 transition-colors duration-300 group-hover:text-gold-400">
                      {card.titulo}
                    </h3>
                    <p className="text-sm text-gold-100/90 leading-relaxed font-light">
                      {card.cuerpo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Conocemos Bogotá (Banner Técnico) */}
      <section className="bg-charcoal-900 border-y border-border-strong">
        <div className="mx-auto max-w-6xl px-6 py-20 lg:py-24">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <h2 className="font-display text-3xl lg:text-4xl font-semibold text-white leading-tight">
                Conocemos la arquitectura de Bogotá.
              </h2>
              <p className="mt-6 text-gold-100/80 text-lg leading-relaxed font-light">
                Entendemos la rigurosidad de los reglamentos de propiedad horizontal. Cumplimos con todos los protocolos de ingreso y horarios, y nuestro equipo técnico realiza mediciones milimétricas en sitio para adaptarse a los desniveles e irregularidades únicas de cada espacio.
              </p>
            </div>
            <div className="lg:col-span-5 flex lg:justify-end">
              <AsesoriaBoton precio3dFormatted={formattedPrice}>Agendar visita técnica a mi espacio</AsesoriaBoton>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Espacios que creamos (Bento Grid) */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-3xl font-semibold text-text-heading mb-10">Espacios que creamos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[300px]">
          {ESPACIOS.map((espacio, i) => {
            const imgData = HOME_IMAGES_SEO[espacio.imageKey as keyof typeof HOME_IMAGES_SEO];
            // La primera tarjeta ocupa 2 columnas en desktop para asimetría del bento box
            const isFeatured = i === 0;
            return (
              <Link
                key={espacio.nombre}
                href={espacio.href}
                className={`group flex flex-col cursor-pointer ${isFeatured ? 'lg:col-span-2' : ''}`}
              >
                <div className="relative flex-1 overflow-hidden rounded-sm bg-bg-alt mb-4">
                  <Image
                    src={imgData.src}
                    alt={imgData.alt}
                    fill
                    className="object-cover saturate-50 contrast-[1.1] transition-all duration-[1000ms] ease-out group-hover:scale-105 group-hover:saturate-100"
                    sizes={isFeatured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                  />
                  <div className="absolute inset-0 bg-charcoal-900/10 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                </div>
                <div className="flex items-center justify-between pr-2">
                  <h3 className="font-display text-lg font-medium text-text-heading">
                    {espacio.nombre}
                  </h3>
                  <span className="text-gold-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-12 text-center">
          <CtaSecondary href="/portafolio">Explorar portafolio completo</CtaSecondary>
        </div>
      </section>

      {/* 5. Cómo trabajamos (Timeline de Ingeniería) */}
      <section className="bg-bg-alt py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-heading mb-16 text-center">Cómo trabajamos</h2>
          {/* Línea conectora base en desktop */}
          <div className="relative">
            <div className="hidden lg:block absolute top-0 left-0 w-full h-[1px] bg-border-strong" />
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {PASOS.map((paso, i) => (
                <div key={paso.titulo} className="relative group pt-6 lg:pt-8">
                  {/* Indicador de timeline en desktop */}
                  <div className="hidden lg:block absolute top-0 left-0 w-0 h-[2px] bg-gold-500 transition-all duration-500 group-hover:w-full" />

                  {/* Marca de agua brutalista */}
                  <div className="absolute top-0 right-4 lg:right-0 font-display text-9xl font-bold text-charcoal-900/[0.03] select-none -z-10 transition-transform duration-500 group-hover:-translate-y-4">
                    0{i + 1}
                  </div>

                  <span className="inline-block font-display text-xl font-bold text-gold-600 mb-4">Paso {i + 1}</span>
                  <h3 className="font-display text-xl font-semibold text-text-heading mb-3">{paso.titulo}</h3>
                  <p className="text-text-muted leading-relaxed relative z-10">{paso.cuerpo}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-16 text-center">
            <CtaSecondary href="/como-trabajamos">Ver nuestro método completo</CtaSecondary>
          </div>
        </div>
      </section>

      {/* 6. Proyectos realizados */}
      {proyectosDestacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-text-heading mb-8">
            Proyectos que hablan por nosotros
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {proyectosDestacados.map((proyecto) => (
              <Link
                key={proyecto.id}
                href={`/portafolio/${proyecto.slug}`}
                className="group rounded-sm overflow-hidden border border-border-subtle/50 transition-shadow duration-300 hover:shadow-lg flex flex-col bg-bg-paper"
              >
                {proyecto.imagenPortafolioUrl ? (
                  <div className="relative aspect-[16/9] w-full overflow-hidden">
                    <Image
                      src={proyecto.imagenPortafolioUrl}
                      alt={`Proyecto ${proyecto.titulo}`}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ) : (
                  <ImagenPlaceholder inicial={proyecto.titulo.charAt(0)} className="aspect-[16/9]" />
                )}
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-display font-semibold text-text-heading line-clamp-1">{proyecto.titulo}</h3>
                  <MetaItem icon={MapPin}>{proyecto.categoriaEspacio}</MetaItem>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <CtaSecondary href="/portafolio">Ver portafolio completo</CtaSecondary>
          </div>
        </section>
      )}

      {/* 7. Conócenos (Teaser Editorial / Heritage) */}
      <section className="bg-bg-paper py-24 lg:py-32 border-y border-border-subtle">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            {/* Título gigante a la izquierda */}
            <div className="lg:col-span-6">
              <h2 className="font-display text-4xl lg:text-5xl font-semibold text-text-heading leading-tight">
                Tres generaciones construyendo.<br />
                <span className="text-gold-600 italic font-light">Un estudio diseñando.</span>
              </h2>
            </div>
            {/* Párrafo editorial con Letra Capitular a la derecha */}
            <div className="lg:col-span-6">
              <p className="text-text-primary text-lg leading-relaxed">
                <span className="float-left text-7xl leading-[0.8] font-display font-bold text-charcoal-900 pr-3 pt-2">D</span>
                el oficio en la obra al diseño contemporáneo. Hugo García conoce cada etapa de construcción como pocos.
                Airhon J. García traduce esa experiencia al lenguaje del diseño. Juntos, en Veta Dorada, entregan
                espacios que se habitan con gusto.
              </p>
              <div className="mt-8">
                <CtaSecondary href="/conocenos">Conoce a Hugo y Airhon</CtaSecondary>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Respuesta Atómica secundaria (precio) */}
      <section className="bg-bg-surface py-24 border-t border-border-subtle">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl lg:text-4xl font-semibold text-text-heading leading-tight">
                ¿Cuánto cuesta un mueble a la medida en Bogotá?
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-text-muted text-lg leading-relaxed">
                El precio de un espacio a la medida depende del tamaño, los materiales y la complejidad del diseño. Una
                cocina integral no cuesta lo mismo que un closet, y los acabados definen buena parte del presupuesto. La
                forma de saberlo con certeza es una visita a tu espacio: medimos, diseñamos y cotizamos sin compromiso.
              </p>
              <div className="mt-8">
                <AsesoriaBoton precio3dFormatted={formattedPrice}>Agendar una visita sin costo</AsesoriaBoton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Testimonios */}
      <section className="bg-bg-alt py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-center mb-16 text-center">
            <h2 className="font-display text-3xl font-semibold text-text-heading">
              Lo que dicen nuestros clientes
            </h2>
            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-gold-500">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {testimonios.map((t) => (
              <div key={t.nombre} className="group relative overflow-hidden rounded-md bg-bg-paper p-8 shadow-sm transition-shadow duration-300 hover:shadow-md">
                {/* Comilla de marca de agua */}
                <div className="absolute -top-4 -left-2 font-display text-9xl text-charcoal-900/[0.04] select-none pointer-events-none transition-transform duration-500 group-hover:-translate-y-2 group-hover:translate-x-2">
                  &ldquo;
                </div>

                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-gold-500">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>

                  <p className="flex-1 font-display text-lg text-text-heading italic leading-relaxed mb-8">
                    &ldquo;{t.texto}&rdquo;
                  </p>

                  <div className="border-t border-border-subtle pt-6">
                    <p className="font-medium text-text-heading">{t.nombre}</p>
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-1 text-sm text-text-muted">
                      {t.barrio && <span>{t.barrio}</span>}
                      {t.barrio && t.tipoProyecto && <span>·</span>}
                      {t.tipoProyecto && <span>{t.tipoProyecto}</span>}
                      {(t.barrio || t.tipoProyecto) && <span>·</span>}
                      <span className="font-medium text-charcoal-900">Google</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-16 text-center">
            <CtaSecondary href="/testimonios">Leer más historias de clientes</CtaSecondary>
          </div>
        </div>
      </section>

      {/* 10. CTA final (Banner Monolítico / Tesis 2027) */}
      <section className="relative py-32 lg:py-40 px-6 overflow-hidden flex items-center justify-center border-t border-charcoal-900">
        {/* Imagen de Fondo Full-Bleed */}
        <div className="absolute inset-0 z-0 bg-charcoal-900">
          <Image
            src="/cta-background.jpg"
            alt="Detalle de carpintería arquitectónica Veta Dorada"
            fill
            className="object-cover saturate-0 opacity-40 mix-blend-luminosity scale-105"
            sizes="100vw"
          />
          {/* Capa de inmersión ultra oscura (Tinta plana) */}
          <div className="absolute inset-0 bg-charcoal-900/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-charcoal-900" />
        </div>

        {/* Contenido desnudo (Sin cajas) */}
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl lg:text-6xl font-semibold text-white tracking-tight">
            ¿Hablamos de tu espacio?
          </h2>
          <p className="mt-8 text-gold-100/70 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Visita, asesoría técnica y cotización sin costo.<br />
            <span className="text-white/60 text-base mt-2 block">Diseño 3D opcional por {formattedPrice} (deducible del contrato).</span>
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <AsesoriaBoton precio3dFormatted={formattedPrice}>
              Agenda tu asesoría
            </AsesoriaBoton>
          </div>
        </div>
      </section>

      {/* JSON-LD: HomeAndConstructionBusiness + Organization + WebSite */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
