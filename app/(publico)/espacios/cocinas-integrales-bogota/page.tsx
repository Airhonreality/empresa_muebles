import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { SITE_URL } from '@/lib/seo/jsonld';
import { socialMeta } from '@/lib/seo/social';
import { obtenerGaleriaEspacioAction, obtenerHeroCarouselImagesAction } from '@/lib/data/actions/public';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';
import { HeroCarousel } from '@/components/veta/hero-carousel';

export const dynamic = 'force-dynamic';

const SLUG = 'cocinas-integrales-bogota';
const NOMBRE_CATEGORIA = 'Cocinas Integrales';

const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20cotizar%20una%20cocina%20integral.';

export const metadata: Metadata = {
  title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
  description:
    'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
  alternates: { canonical: `${SITE_URL}/espacios/${SLUG}` },
  ...socialMeta({
    title: 'Cocinas Integrales en Bogotá | Diseño a Medida',
    description:
      'Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.',
    path: `/espacios/${SLUG}`,
    image: HOME_IMAGES_SEO.espaciosCocinas.src,
  }),
};

function CtaPrimary({ href, children, className = '' }: { href: string; children: React.ReactNode; className?: string }) {
  const baseClassName =
    'inline-flex items-center justify-center rounded-sm bg-gold-600 px-8 py-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-gold-700 shadow-md hover:shadow-lg ' + className;
  return (
    <Link href={href} className={baseClassName}>
      {children}
    </Link>
  );
}

function CtaDark({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center justify-center rounded-sm bg-charcoal-900 px-8 py-4 text-sm font-medium text-white transition-colors duration-300 hover:bg-charcoal-800 shadow-md hover:shadow-lg">
      {children}
    </Link>
  );
}

const VALIDACION_TECNICA = [
  {
    imageKey: 'validacionTaller',
    titulo: 'Asesoría Integral',
    cuerpo:
      'Te guiamos en cada paso: distribución, materiales y diseño funcional. Sin intermediarios, fabricamos en nuestro propio taller para cuidar cada eslabón.',
  },
  {
    imageKey: 'validacion3d',
    titulo: 'Modelado 3D y Optimización',
    cuerpo:
      'Visualizas tu proyecto antes de que empiece, asegurando una ejecución sin sorpresas. Ves exactamente cómo quedará en 3D antes de cortar la primera pieza.',
  },
  {
    imageKey: 'validacionDiseñador',
    titulo: 'Garantía y Satisfacción',
    cuerpo:
      'Aseguramos la calidad y durabilidad de cada proyecto, respaldados por nuestra experiencia técnica y un equipo de diseñadores industriales a tu lado.',
  },
] as const;

export default async function CocinasIntegralesPage() {
  const galeria = await obtenerGaleriaEspacioAction('cocinas-integrales');
  const heroImages = await obtenerHeroCarouselImagesAction('cocinas-integrales');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    areaServed: 'Bogotá',
    name: 'Cocinas Integrales a Medida',
    provider: {
      '@type': 'LocalBusiness',
      name: 'Veta Dorada',
    },
    url: `${SITE_URL}/espacios/${SLUG}`,
  };

  return (
    <div>
      {/* 1. Hero: Tranquilidad y Alto Contraste (Arquetipo: Creador Experto) */}
      <section className="relative overflow-hidden border-b border-border-subtle bg-bg-paper">
        <div className="grid lg:grid-cols-2 lg:min-h-[85vh]">
          <div className="relative z-10 flex flex-col justify-center px-8 py-20 lg:px-16 lg:pt-32 lg:pb-24">
            <h1 className="sr-only">Cocinas integrales a medida en Bogotá</h1>
            <h2 className="font-display text-4xl lg:text-6xl font-semibold text-text-heading leading-tight tracking-tight font-serif">
              Nuestros clientes no solo estrenan cocina,<br />
              <span className="text-gold-600 italic font-light">estrenan tranquilidad.</span>
            </h2>
            <p className="mt-8 text-text-muted text-lg lg:text-xl font-light leading-relaxed max-w-xl">
              Cocinas integrales diseñadas para aprovechar cada centímetro. Te libramos del estrés de las remodelaciones con cumplimiento estricto, diseño 3D milimétrico y taller propio.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <CtaPrimary href={WHATSAPP_URL}>Quiero cotizar</CtaPrimary>
            </div>
          </div>
          <div className="relative h-[50vh] lg:h-auto overflow-hidden bg-charcoal-900">
            <HeroCarousel 
              images={heroImages} 
              fallbackImage={{ src: HOME_IMAGES_SEO.espaciosCocinas.src, alt: HOME_IMAGES_SEO.espaciosCocinas.alt }}
              priority={true}
              imageClassName="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-charcoal-900/10 mix-blend-multiply pointer-events-none z-20" />
          </div>
        </div>
      </section>

      {/* 2. Embudo Acelerado (Fast-Track) */}
      <section className="bg-bg-alt py-16 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-2xl lg:text-3xl font-semibold text-text-heading mb-4">
            ¿Ya tienes medidas?
          </h2>
          <p className="text-text-muted text-lg mb-8">
            Recibe una cotización sin costo enviando las dimensiones de tu cocina. Saltamos directo a los números.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <CtaDark href={WHATSAPP_URL}>Envía medidas</CtaDark>
            <Link href="/bitacora/como-tomar-medidas-cocina" className="text-sm font-medium text-gold-600 hover:text-gold-700 underline decoration-gold-300 underline-offset-4 transition-colors">
              ¿No sabes cómo? Aprende cómo tomar tus medidas aquí
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Módulo Educativo de Materiales (Dog Whistle SEO) */}
      <section className="bg-bg-paper py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-3xl lg:text-4xl font-semibold text-text-heading mb-16 text-center">
            Materiales que garantizan durabilidad
          </h2>
          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8">
            <div className="flex flex-col">
              <div className="relative w-full aspect-video rounded-sm overflow-hidden mb-6 bg-charcoal-900">
                <Image src="/images/home/fachadas.jpg" alt="Acabado de fachadas y estructura en Madecor RH" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <h3 className="text-xl font-display font-semibold text-text-heading mb-4">Fachadas y Estructura</h3>
              <p className="text-text-muted leading-relaxed font-light">
                Usamos exclusivamente aglomerado <strong className="text-text-heading font-medium">Madecor RH (Resistente a la Humedad)</strong> para los interiores, garantizando que tu cocina no se sople. Para las fachadas puedes elegir entre melaminas texturizadas de alta gama o acabados en <strong className="text-text-heading font-medium">Poliuretano</strong> para un brillo inmaculado.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="relative w-full aspect-video rounded-sm overflow-hidden mb-6 bg-charcoal-900">
                <Image src="/images/home/herrajes.jpg" alt="Herrajes europeos para cocinas a medida" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <h3 className="text-xl font-display font-semibold text-text-heading mb-4">Funciones y Herrajes</h3>
              <p className="text-text-muted leading-relaxed font-light">
                La calidad se siente al tacto. Integramos <strong className="text-text-heading font-medium">Herrajes Europeos</strong> (Blum, Hettich o Ducasse) con cierre lento, brazos neumáticos y rieles de carga pesada. Además, diseñamos la perfilería oculta con iluminación LED y sensores de movimiento integrados.
              </p>
            </div>
            <div className="flex flex-col">
              <div className="relative w-full aspect-video rounded-sm overflow-hidden mb-6 bg-charcoal-900">
                <Image src="/images/home/mesones.jpg" alt="Mesones en Quarztone y Piedra Sinterizada" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 33vw" />
              </div>
              <h3 className="text-xl font-display font-semibold text-text-heading mb-4">Mesones</h3>
              <p className="text-text-muted leading-relaxed font-light">
                Asesoramos la elección de la superficie ideal según el uso que le des a tu cocina. Trabajamos con <strong className="text-text-heading font-medium">Quarztone</strong> para resistencia al impacto, Granito natural para durabilidad clásica, y <strong className="text-text-heading font-medium">Piedra Sinterizada</strong> (Neolith/Dekton) para resistencia total al calor y rayones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Galería Dinámica (Integración ERP) */}
      {galeria.length > 0 && (
        <section className="bg-bg-alt py-24 border-b border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-display text-3xl font-semibold text-text-heading mb-10">Proyectos y Renders</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {galeria.map((foto, i) => (
                <div key={`${foto.url}-${i}`} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-bg-paper shadow-sm">
                  <Image
                    src={foto.url}
                    alt={foto.alt}
                    fill
                    className="object-cover transition-transform duration-700 hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  {foto.esRender && (
                    <div className="absolute top-2 right-2 bg-charcoal-900/80 text-white text-xs font-medium px-2 py-1 rounded-sm backdrop-blur-sm">
                      Render 3D
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Validación Técnica */}
      <section className="bg-charcoal-900 py-24 border-b border-charcoal-900">
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

      {/* 7. Respuestas Atómicas (SEO de Cola Larga) */}
      <section className="bg-bg-paper py-24 border-b border-border-subtle">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="font-display text-3xl font-semibold text-text-heading mb-12 text-center">Preguntas Frecuentes</h2>
          <div className="space-y-12">
            <div>
              <h3 className="text-xl font-display font-semibold text-text-heading mb-4">
                ¿Cuánto cuesta una cocina integral a la medida en Bogotá?
              </h3>
              <p className="text-text-muted leading-relaxed font-light">
                El precio depende del tamaño, los materiales y los acabados. Una cocina en Madecor RH (estructuras resistentes a la humedad) con acabados estándar parte de un presupuesto base, mientras que fachadas en poliuretano o mesones en piedra sinterizada ajustan el valor hacia arriba. Lo mejor es agendar una visita técnica para obtener un presupuesto exacto línea por línea sin sorpresas.
              </p>
            </div>
            <div className="w-16 h-[1px] bg-border-strong"></div>
            <div>
              <h3 className="text-xl font-display font-semibold text-text-heading mb-4">
                ¿Qué materiales usan para las cocinas integrales?
              </h3>
              <p className="text-text-muted leading-relaxed font-light">
                Usamos interiores exclusivamente en Madecor RH (Resistente a la Humedad) para garantizar la durabilidad a largo plazo. Para las fachadas, ofrecemos desde melaminas texturizadas hasta pintura en poliuretano o chapillas de madera maciza. Los mesones los trabajamos en Granito natural, Quarztone, o Piedra Sinterizada según la resistencia requerida.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Final (Anclaje de Valor) */}
      <section className="relative py-32 px-6 overflow-hidden flex flex-col items-center justify-center bg-charcoal-900">
        <div className="absolute inset-0 z-0">
          <Image
            src={HOME_IMAGES_SEO.validacionTaller.src}
            alt={HOME_IMAGES_SEO.validacionTaller.alt}
            fill
            className="object-cover saturate-0 opacity-20 mix-blend-luminosity scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-charcoal-900/90" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900 via-transparent to-charcoal-900" />
        </div>
        
        <div className="relative z-10 w-full max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl lg:text-6xl font-semibold text-white tracking-tight">
            ¿Listo para comenzar tu proyecto?
          </h2>
          <div className="mt-8 mb-12 py-4 px-6 bg-white/5 border border-white/10 rounded-sm inline-block backdrop-blur-sm">
            <p className="text-gold-400 text-lg font-medium">
              Asesoría completa: incluye plano, modelado 3D y propuesta personalizada.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <CtaPrimary href={WHATSAPP_URL}>Agendar ahora</CtaPrimary>
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
