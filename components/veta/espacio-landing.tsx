import Link from 'next/link';
import Image from 'next/image';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';
import { SITE_URL } from '@/lib/seo/jsonld';

const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.';

// Reutilizado de app/(publico)/page.tsx (VALIDACION_TECNICA/PASOS), copy idéntico en las 6
// landings F-09 por diseño — contenido_F09_landings.md §3.8. No se refactoriza el home para
// compartir el módulo: son 2 arreglos chicos, duplicarlos acá es más simple que una abstracción
// cross-page para algo que no vuelve a cambiar independientemente.
const VALIDACION_TECNICA = [
  {
    imageKey: 'validacion3d',
    titulo: 'Disminuye la incertidumbre',
    cuerpo:
      'Visualizas tu espacio en 3D antes de cortar la primera pieza. Así ves exactamente cómo quedará y tomas decisiones con toda la información.',
  },
  {
    imageKey: 'validacionTaller',
    titulo: 'Punto de Fábrica Directo',
    cuerpo:
      'Diseñamos y fabricamos en nuestro propio taller. Sin intermediarios, sin sobrecostos, sin perder calidad en cada eslabón de la cadena.',
  },
  {
    imageKey: 'validacionDiseñador',
    titulo: 'Asesoría con diseñadores',
    cuerpo:
      'Tu proyecto lo acompaña un diseñador industrial de la Universidad Nacional de principio a fin. No vendemos catálogos: diseñamos contigo cada espacio para que responda a cómo vives.',
  },
] as const;

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
] as const;

export interface EspacioLandingConfig {
  slug: string;
  nombreCategoria: string;
  h1: string;
  subtitulo: string;
  parrafoDescriptor: string;
  imageKey: keyof typeof HOME_IMAGES_SEO;
}

function CtaPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  const externa = href.startsWith('http');
  const className =
    'inline-flex items-center justify-center rounded-sm bg-gold-600 px-6 py-3 text-sm font-medium text-white transition-colors duration-300 hover:bg-gold-700';
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

function CtaSecondary({ href, children }: { href: string; children: React.ReactNode }) {
  const className =
    'inline-flex items-center justify-center px-1 text-sm font-medium text-white border-b border-white/30 transition-all duration-300 hover:border-gold-500 hover:text-gold-400 pb-1';
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export interface FotoGaleriaEspacio {
  url: string;
  alt: string;
  esRender: boolean;
}

export function EspacioLanding({ config, galeria = [] }: { config: EspacioLandingConfig; galeria?: FotoGaleriaEspacio[] }) {
  const { slug, nombreCategoria, h1, subtitulo, parrafoDescriptor, imageKey } = config;
  const heroImage = HOME_IMAGES_SEO[imageKey];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Espacios', item: `${SITE_URL}/espacios` },
      { '@type': 'ListItem', position: 3, name: nombreCategoria, item: `${SITE_URL}/espacios/${slug}` },
    ],
  };

  return (
    <div>
      {/* 1. Hero */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-charcoal-900">
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage.src}
            alt={heroImage.alt}
            fill
            priority
            className="object-cover opacity-60"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/50 to-charcoal-900/70" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-6 py-32 lg:py-40 max-w-6xl mx-auto text-center">
          <h1 className="font-display text-4xl lg:text-6xl font-semibold text-white leading-tight mx-auto max-w-4xl">
            {h1}
          </h1>
          <p className="mt-6 text-gold-100/90 text-lg lg:text-xl font-light max-w-2xl mx-auto">
            {subtitulo}
          </p>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <CtaPrimary href={WHATSAPP_URL}>Agenda tu asesoría gratuita</CtaPrimary>
            <CtaSecondary href={WHATSAPP_URL}>Hablamos por WhatsApp</CtaSecondary>
          </div>
        </div>
      </section>

      {/* 2. Descripción técnica */}
      <section className="bg-bg-paper py-20 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-text-muted text-lg lg:text-xl leading-relaxed font-light">
            {parrafoDescriptor}
          </p>
        </div>
      </section>

      {/* 2.5. Galería del espacio (F09, 2026-08-17) — junta fotos publicadas de Portafolio con
          las cargadas en /erp/portafolio/renders, sin distinción visible entre ellas. */}
      {galeria.length > 0 && (
        <section className="bg-bg-alt py-24 border-b border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold text-text-heading mb-10">Espacios que creamos</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galeria.map((foto, i) => (
                <div key={`${foto.url}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-bg-paper">
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

      {/* 3. Validación Técnica */}
      <section className="bg-charcoal-900 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-6 md:grid-cols-3">
            {VALIDACION_TECNICA.map((card) => {
              const imgData = HOME_IMAGES_SEO[card.imageKey as keyof typeof HOME_IMAGES_SEO];
              return (
                <div key={card.titulo} className="group relative h-[450px] w-full overflow-hidden rounded-sm cursor-default">
                  <Image
                    src={imgData.src}
                    alt={imgData.alt}
                    fill
                    className="object-cover transition-transform duration-[800ms] ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/95 via-charcoal-900/60 to-transparent" />
                  <div className="absolute inset-0 bg-charcoal-900/30" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 z-10">
                    <h3 className="font-display text-2xl font-semibold text-white relative mb-3">
                      {card.titulo}
                    </h3>
                    <p className="text-sm text-gold-100/90 leading-relaxed">{card.cuerpo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Cómo trabajamos */}
      <section className="bg-bg-alt py-24">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-heading mb-16 text-center">Cómo trabajamos</h2>
          <div className="relative">
            <div className="hidden lg:block absolute top-0 left-0 w-full h-[1px] bg-border-strong" />
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {PASOS.map((paso, i) => (
                <div key={paso.titulo} className="relative group pt-6 lg:pt-8">
                  <div className="hidden lg:block absolute top-0 left-0 w-0 h-[2px] bg-gold-500 transition-all duration-500 group-hover:w-full" />
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
        </div>
      </section>

      {/* 5. CTA final */}
      <section className="relative py-32 px-6 flex items-center justify-center bg-charcoal-900 border-t border-charcoal-900">
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl lg:text-6xl font-semibold text-white tracking-tight">
            ¿Hablamos de tu espacio?
          </h2>
          <p className="mt-8 text-gold-100/70 text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Cuéntanos qué tienes en mente. Un diseñador te escucha, visita tu espacio y te entrega una cotización
            detallada sin compromiso.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <CtaPrimary href={WHATSAPP_URL}>Agenda tu asesoría gratuita</CtaPrimary>
            <CtaSecondary href={WHATSAPP_URL}>Escríbenos por WhatsApp</CtaSecondary>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
