import Link from 'next/link';
import Image from 'next/image';
import { HOME_IMAGES_SEO } from '@/lib/seo/home-images';
import { SITE_URL } from '@/lib/seo/jsonld';
import { obtenerHeroCarouselImagesAction, obtenerPrecioAsesoria3dAction, obtenerAtributosTecnicosAction } from '@/lib/data/actions/public';
import { HeroCarousel } from '@/components/veta/hero-carousel';
import { AsesoriaBoton } from '@/components/veta/asesoria-boton';
import { ValidacionTecnicaSlider } from '@/components/veta/validacion-tecnica-slider';

const WHATSAPP_URL =
  'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.';

// Reutilizado de app/(publico)/page.tsx (VALIDACION_TECNICA/PASOS), copy idéntico en las 6
// landings F-09 por diseño — contenido_F09_landings.md §3.8. No se refactoriza el home para
// compartir el módulo: son 2 arreglos chicos, duplicarlos acá es más simple que una abstracción
// cross-page para algo que no vuelve a cambiar independientemente.
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
  materiales?: { titulo: string; cuerpo: string; imageSrc?: string; imageAlt?: string }[];
  faqs?: { pregunta: string; respuesta: string }[];
}

function CtaPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  const externa = href.startsWith('http');
  const className =
    'inline-flex items-center justify-center rounded-sm bg-gold-600 px-6 py-3 text-sm font-bold text-white transition-colors duration-300 hover:bg-gold-700';
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



export interface FotoGaleriaEspacio {
  url: string;
  alt: string;
  esRender: boolean;
}

export async function EspacioLanding({ config, galeria = [], tipoEspacio }: { config: EspacioLandingConfig; galeria?: FotoGaleriaEspacio[]; tipoEspacio?: string }) {
  const { slug, nombreCategoria, h1, subtitulo, parrafoDescriptor, imageKey } = config;
  const heroImageFallback = HOME_IMAGES_SEO[imageKey];
  const heroImages = await obtenerHeroCarouselImagesAction(tipoEspacio || slug);
  const atributosTecnicos = await obtenerAtributosTecnicosAction(tipoEspacio || slug);
  const precio3d = (await obtenerPrecioAsesoria3dAction()) || 130000;
  
  const formattedPrice = precio3d !== null 
    ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(precio3d || 130000)
    : 'tarifa vigente';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Espacios', item: `${SITE_URL}/espacios` },
      { '@type': 'ListItem', position: 3, name: nombreCategoria, item: `${SITE_URL}/espacios/${slug}` },
    ],
  };

  const displayGaleria = galeria.length > 0 
    ? galeria 
    : (process.env.NODE_ENV === 'development' 
        ? [
            { url: HOME_IMAGES_SEO.espaciosClosets.src, alt: 'Mock', esRender: false },
            { url: HOME_IMAGES_SEO.espaciosCocinas.src, alt: 'Mock', esRender: true },
            { url: HOME_IMAGES_SEO.espaciosCavas.src, alt: 'Mock', esRender: false },
            { url: HOME_IMAGES_SEO.espaciosEstudios.src, alt: 'Mock', esRender: false },
            { url: HOME_IMAGES_SEO.espaciosCentrosEnt.src, alt: 'Mock', esRender: true },
            { url: HOME_IMAGES_SEO.espaciosConsolas.src, alt: 'Mock', esRender: false },
            { url: HOME_IMAGES_SEO.espaciosPisos.src, alt: 'Mock', esRender: false },
            { url: HOME_IMAGES_SEO.validacion3d.src, alt: 'Mock', esRender: true },
          ]
        : []);

  return (
    <div>
      {/* 1. Hero */}
      <section className="relative flex flex-col lg:flex-row min-h-[85vh] overflow-hidden border-b border-border-subtle bg-charcoal-950">
        
        {/* Left Column: Typography Block */}
        <div className="relative z-10 flex flex-col justify-center w-full lg:w-5/12 px-8 lg:px-16 py-24 lg:py-0 bg-charcoal-950 lg:shadow-[20px_0_40px_-15px_rgba(0,0,0,0.6)]">
          <div className="max-w-xl mx-auto lg:mx-0">
            <div className="flex items-center gap-4 mb-8">
              <div className="h-[1px] w-8 bg-gold-500"></div>
              <p className="text-gold-400 text-xs md:text-sm font-bold tracking-[0.3em] uppercase">
                Somos fabricantes directos
              </p>
            </div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-[1.1] tracking-tight">
              {h1}
            </h1>
            
            <p className="mt-8 text-gold-100/80 text-lg lg:text-xl font-light leading-relaxed">
              {subtitulo}
            </p>

            <p className="mt-4 text-gold-100/60 text-sm lg:text-base font-light leading-relaxed">
              {parrafoDescriptor}
            </p>

            <div className="mt-12 flex items-center gap-6">
              <CtaPrimary href={WHATSAPP_URL}>Agenda tu asesoría gratuita</CtaPrimary>
            </div>
          </div>
        </div>

        {/* Right Column: Imagery */}
        <div className="relative w-full lg:w-7/12 h-[50vh] lg:h-auto bg-charcoal-900">
          <HeroCarousel
            images={heroImages}
            fallbackImage={{ src: heroImageFallback.src, alt: heroImageFallback.alt }}
            priority={true}
            imageClassName="object-cover"
            sizes="(max-width: 1024px) 100vw, 60vw"
          />
        </div>
      </section>

      {/* 1.5. CTA Temprano (¿Ya tienes medidas?) */}
      <section className="bg-bg-paper py-16 border-b border-border-subtle">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold text-text-heading mb-4">¿Ya tienes medidas?</h2>
          <p className="text-text-primary mb-8 font-light max-w-2xl mx-auto">
            Recibe una cotización sin costo enviando las dimensiones de tu espacio. Saltamos directo a los números.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <CtaPrimary href={WHATSAPP_URL}>Enviar medidas</CtaPrimary>
            <Link href="/blog/como-medir-tu-espacio" className="text-sm text-gold-600 hover:text-gold-700 underline underline-offset-4 font-medium transition-colors">
              ¿No sabes cómo? Aprende a tomar tus medidas aquí
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Galería del espacio (F09, 2026-08-17) */}
      {displayGaleria.length > 0 && (
        <section className="bg-bg-alt py-24 border-b border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            {/* Header Editorial de Lujo */}
            <div className="mb-12 md:mb-16">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-[1px] w-8 bg-gold-600" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold">Portafolio</span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl font-medium text-text-heading tracking-tight">
                Espacios que <span className="font-serif italic text-gold-700 font-light">creamos</span>
              </h2>
            </div>
            
            {/* Destruimos la grilla asfixiante. Añadimos gap generoso y redondeo sutil. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {displayGaleria.map((foto, i) => (
                <div 
                  key={`${foto.url}-${i}`} 
                  className="group relative aspect-[4/5] overflow-hidden bg-charcoal-950 rounded-sm shadow-sm"
                >
                  <Image
                    src={foto.url}
                    alt={foto.alt}
                    fill
                    className="object-cover opacity-90 saturate-75 group-hover:opacity-100 group-hover:saturate-100 group-hover:scale-105 transition-all duration-700"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-charcoal-900/10 group-hover:bg-transparent transition-colors duration-500" />
                  
                  {/* Distinción elegante para Renders 3D */}
                  {foto.esRender && (
                    <div className="absolute bottom-4 left-4 bg-bg-paper/90 backdrop-blur-md text-gold-700 text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-xs border border-gold-500/20 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                      Render 3D
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Materiales que garantizan durabilidad (Módulo educativo F-09C, cocina-específico) */}
      {config.materiales && config.materiales.length > 0 && (
        <section className="bg-bg-paper py-32 border-b border-border-subtle">
          <div className="mx-auto max-w-6xl px-6">
            {/* Header Editorial */}
            <div className="mb-16 md:mb-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-[1px] w-12 bg-gold-600" />
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-gold-600 font-semibold">
                  M A T E R I A L E S
                </span>
              </div>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-normal text-text-heading tracking-tight max-w-3xl">
                Materiales que <span className="font-serif italic text-gold-700 font-light">garantizan durabilidad</span>
              </h2>
            </div>
            
            {/* Grid Editorial Tipo Paspartú */}
            <div className="grid gap-12 md:gap-8 lg:gap-12 md:grid-cols-3">
              {config.materiales.map((m, i) => (
                <div key={m.titulo} className="flex flex-col group relative pt-6 border-t border-border-subtle">
                  {/* Numeración de Catálogo */}
                  <div className="absolute top-0 left-0 -mt-3 bg-bg-paper pr-3">
                    <span className="font-mono text-xs font-medium text-gold-600 tracking-widest">
                      0{i + 1}
                    </span>
                  </div>

                  {m.imageSrc && (
                    <div className="relative aspect-[4/5] w-full overflow-hidden mb-8 rounded-none bg-charcoal-900">
                      <Image
                        src={m.imageSrc}
                        alt={m.imageAlt || m.titulo}
                        fill
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 saturate-75 group-hover:saturate-100"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-charcoal-900/5 group-hover:bg-transparent transition-colors duration-700" />
                    </div>
                  )}
                  
                  <h3 className="font-display text-2xl font-medium text-text-heading mb-4 tracking-tight">{m.titulo}</h3>
                  <p className="text-[13px] text-text-primary leading-loose font-light">{m.cuerpo}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Cómo trabajamos (Alineación corregida y contraste mejorado) */}
      <section className="bg-bg-alt py-24">
        <div className="mx-auto max-w-6xl px-6">
          {/* Header Editorial de Lujo */}
          <div className="mb-16 md:mb-20">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-[1px] w-8 bg-gold-600" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-600 font-semibold">Metodología</span>
            </div>
            <h2 className="font-display text-4xl md:text-5xl font-medium text-text-heading tracking-tight">
              Cómo <span className="font-serif italic text-gold-700 font-light">trabajamos</span>
            </h2>
          </div>
          <div className="relative">
            {/* Línea de tiempo sutil en lugar de un borde de Excel */}
            <div className="hidden lg:block absolute top-4 left-0 w-full h-[1px] bg-border-subtle" />
            
            <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {PASOS.map((paso, i) => (
                <div key={paso.titulo} className="relative group pt-4">
                  {/* Hilo conductor de la línea de tiempo */}
                  <div className="hidden lg:block absolute top-4 left-0 w-0 h-[1px] bg-gold-600 transition-all duration-700 group-hover:w-full z-10" />
                  
                  {/* Punto de anclaje (Timeline node) */}
                  <div className="hidden lg:block absolute top-[13.5px] left-0 w-1.5 h-1.5 rounded-full bg-gold-600 z-20 shadow-[0_0_0_4px_var(--color-bg-alt)]" />
                  
                  {/* Número elegante visible */}
                  <div className="absolute -top-6 right-4 lg:right-0 font-display text-8xl font-bold text-gold-600/5 select-none -z-10 transition-transform duration-500 group-hover:-translate-y-2">
                    0{i + 1}
                  </div>
                  
                  <span className="inline-block font-display text-lg font-semibold text-gold-600 mb-3 mt-6 lg:mt-8">Paso {i + 1}</span>
                  <h3 className="font-display text-xl font-bold text-text-heading mb-3">{paso.titulo}</h3>
                  {/* Contraste incrementado para accesibilidad (text-text-primary) */}
                  <p className="text-text-primary leading-relaxed relative z-10 font-light">{paso.cuerpo}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Validación Técnica Especializada (Slider Editorial Estilo Revista) */}
      {atributosTecnicos.length > 0 ? (
        <ValidacionTecnicaSlider atributos={atributosTecnicos} />
      ) : (
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
      )}

      {/* 6. Preguntas Frecuentes */}
      {config.faqs && config.faqs.length > 0 && (
        <section className="bg-bg-paper py-24 border-b border-border-subtle">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="font-display text-3xl md:text-4xl font-medium text-text-heading tracking-tight mb-12 text-center">
              Preguntas Frecuentes
            </h2>
            <div className="space-y-12">
              {config.faqs.map((faq, i) => (
                <div key={i} className="border-b border-border-subtle pb-8 last:border-0 last:pb-0">
                  <h3 className="font-display text-xl font-semibold text-text-heading mb-4">{faq.pregunta}</h3>
                  <p className="text-text-primary font-light leading-relaxed">{faq.respuesta}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. CTA final */}
      <section className="relative py-32 px-6 flex items-center justify-center bg-charcoal-900 border-t border-charcoal-900">
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
              Agendar asesoría
            </AsesoriaBoton>
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
