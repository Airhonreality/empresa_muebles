import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';
import { SITE_URL } from '@/lib/seo/jsonld';

export const metadata: Metadata = {
  title: 'Espacios a la medida en Bogotá — Veta Dorada',
  description:
    'Cocinas integrales, closets, cavas y bares, consolas, centros de entretenimiento, estudios y restauración de pisos a la medida en Bogotá. Diseño, fabricación e instalación con taller propio.',
  alternates: { canonical: `${SITE_URL}/espacios` },
};

const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.';

const ESPACIOS = [
  { 
    nombre: 'Cocinas Integrales', 
    imageKey: 'espaciosCocinas', 
    href: '/espacios/cocinas-integrales-bogota', 
    description: 'Cocinas a la medida que aprovechan cada centímetro y responden a cómo cocinas y vives.' 
  },
  { 
    nombre: 'Closets y Vestidores', 
    imageKey: 'espaciosClosets', 
    href: '/espacios/closets-vestidores-bogota', 
    description: 'Soluciones de almacenamiento diseñadas para tu espacio y tu estilo de vida.' 
  },
  { 
    nombre: 'Cavas y Bares', 
    imageKey: 'espaciosCavas', 
    href: '/espacios/cavas-y-bares', 
    description: 'Espacios para disfrutar, diseñados con elegancia y funcionalidad.' 
  },
  { 
    nombre: 'Consolas y Recibidores', 
    imageKey: 'espaciosConsolas', 
    href: '/espacios/consolas-recibidores', 
    description: 'La primera impresión de tu hogar, diseñada a tu estilo.' 
  },
  { 
    nombre: 'Centros de Entretenimiento', 
    imageKey: 'espaciosCentrosEnt', 
    href: '/espacios/centros-de-entretenimiento', 
    description: 'Tecnología y diseño integrados en un mueble a la medida de tu espacio.' 
  },
  { 
    nombre: 'Estudios y Home Office', 
    imageKey: 'espaciosEstudios', 
    href: '/espacios/estudios-home-office', 
    description: 'Espacios de trabajo diseñados para tu productividad y orden.' 
  },
  { 
    nombre: 'Pisos de Madera', 
    imageKey: 'espaciosPisos', 
    href: '/espacios/pisos-de-madera', 
    description: 'Restauración de pisos de madera: pulido, reparación y sellado de casonas.' 
  },
];

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
  const externa = href.startsWith('http');
  const className =
    'inline-flex items-center justify-center rounded-sm border border-gold-400 px-6 py-3 text-sm font-medium text-gold-700 transition-colors duration-300 hover:bg-gold-100/40';
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

export default function EspaciosPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Inicio',
            item: `${SITE_URL}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Espacios',
            item: `${SITE_URL}/espacios`,
          },
        ],
      },
      {
        '@type': 'ItemList',
        itemListElement: ESPACIOS.map((espacio, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${SITE_URL}${espacio.href}`,
          name: espacio.nombre,
          description: espacio.description,
        })),
      },
    ],
  };

  return (
    <div>
      {/* 1. Hero Editorial */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-charcoal-900">
        <div className="absolute inset-0 z-0">
          {/* Se usa la imagen de hero para dar contexto visual de madera */}
          <Image
            src={HOME_IMAGES_SEO.hero.src}
            alt="Textura y diseño en madera"
            fill
            className="object-cover saturate-0 opacity-30 mix-blend-luminosity scale-105"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-charcoal-900/60 to-charcoal-900" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-6 py-32 lg:py-40 max-w-6xl mx-auto text-center">
          <h1 className="font-display text-4xl lg:text-6xl font-semibold text-white leading-tight mx-auto max-w-4xl">
            Espacios que diseñamos, fabricamos e instalamos
          </h1>
          <p className="mt-8 text-gold-100/80 text-lg lg:text-xl font-light max-w-3xl mx-auto leading-relaxed">
            Cada espacio de tu hogar merece una solución a la medida: la medida de tu cocina, de tu closet, de tu forma de vivir. Tres generaciones de oficio en la construcción, un estudio de diseño al frente y la fábrica en el mismo lugar.
          </p>
          <div className="mt-10 flex flex-wrap justify-center items-center gap-4">
            <CtaPrimary href={WHATSAPP_URL}>Agenda tu asesoría gratuita</CtaPrimary>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-1 text-sm font-medium text-white border-b border-white/30 transition-all duration-300 hover:border-gold-500 hover:text-gold-400 pb-1"
            >
              Hablamos por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* 2. Respuesta Atómica */}
      <section className="bg-bg-paper py-20 border-b border-border-subtle">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-5">
              <h2 className="font-display text-3xl font-semibold text-text-heading leading-tight">
                ¿Qué tipos de muebles a la medida fabrica Veta Dorada en Bogotá?
              </h2>
            </div>
            <div className="lg:col-span-7">
              <p className="text-text-muted text-lg leading-relaxed font-light">
                Diseñamos, fabricamos e instalamos cocinas integrales, closets y vestidores, cavas y bares, consolas y recibidores, centros de entretenimiento, estudios y home office, y restauramos pisos de madera. Todo a la medida, con taller propio y diseño contemporáneo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Bento Grid de Categorías */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="font-display text-3xl font-semibold text-text-heading mb-10">Espacios que creamos</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[300px]">
          {ESPACIOS.map((espacio, i) => {
            const imgData = HOME_IMAGES_SEO[espacio.imageKey as keyof typeof HOME_IMAGES_SEO];
            const isFeatured = i === 0;
            return (
              <Link
                key={espacio.nombre}
                href={espacio.href}
                className={`group flex flex-col ${isFeatured ? 'lg:col-span-2' : ''}`}
              >
                <div className="relative flex-1 overflow-hidden rounded-sm bg-bg-alt mb-4 shadow-sm transition-shadow duration-300 group-hover:shadow-md">
                  <Image
                    src={imgData.src}
                    alt={imgData.alt}
                    fill
                    className="object-cover saturate-50 contrast-[1.1] transition-all duration-[1000ms] ease-out group-hover:scale-105 group-hover:saturate-100"
                    sizes={isFeatured ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
                  />
                  <div className="absolute inset-0 bg-charcoal-900/10 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                  
                  {/* Etiqueta flotante inferior para SEO/UX en Hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-charcoal-900/80 to-transparent opacity-0 translate-y-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                    <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                      {espacio.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pr-2">
                  <h3 className="font-display text-lg font-medium text-text-heading group-hover:text-gold-600 transition-colors">
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
      </section>

      {/* 4. CTA Final */}
      <section className="bg-bg-surface py-24 border-t border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-text-heading mb-6">
            ¿No sabes por dónde empezar?
          </h2>
          <p className="text-text-muted text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            Cuéntanos qué espacio tienes en mente. Un diseñador te escucha, visita tu espacio y te entrega una cotización detallada sin compromiso.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
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
