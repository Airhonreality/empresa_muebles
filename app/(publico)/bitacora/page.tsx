import { listarBitacoraAction } from '@/lib/data/actions/portafolio'
import Link from 'next/link'
import Image from 'next/image'
import { SITE_URL } from '@/lib/seo/jsonld'

// force-dynamic (bug real en Vercel, 2026-08-16, mismo motivo que app/sitemap.ts): sin esto,
// Next prerenderiza esta página en build time con el DATA_IMPL del entorno de build — en Vercel
// no está seteada (cae a 'mock'), y getDataStore() rechaza mock bajo VERCEL=1, tumbando el build.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Bitácora de Diseño — Veta Dorada',
  description: 'Casos de estudio reales, materiales y técnica de carpintería arquitectónica a la medida en Bogotá. El cuaderno de obra de Veta Dorada.',
  alternates: { canonical: `${SITE_URL}/bitacora` },
}

export default async function BitacoraIndexPage() {
  const articulos = await listarBitacoraAction()
  const WHATSAPP_URL = 'https://wa.me/573025922101?text=Hola%2C%20vengo%20del%20sitio%20web%20de%20Veta%20Dorada%20y%20quiero%20m%C3%A1s%20informaci%C3%B3n%20sobre%20sus%20espacios%20de%20dise%C3%B1o%20a%20la%20medida.';

  return (
    <div className="bg-bg-paper min-h-screen">
      {/* Hero Editorial */}
      <section className="border-b border-border-subtle bg-bg-alt">
        <div className="mx-auto max-w-6xl px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8">
              <h1 className="font-display text-5xl lg:text-7xl font-semibold text-text-heading leading-tight tracking-tight mb-8">
                Bitácora de Diseño
              </h1>
              <p className="text-xl text-text-muted max-w-2xl font-light leading-relaxed mb-10">
                El cuaderno de obra de Veta Dorada: proyectos reales, materiales y decisiones de diseño. Historias de espacios que se fabricaron, no imágenes de catálogo.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <a 
                  href={WHATSAPP_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center rounded-sm bg-charcoal-900 px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-charcoal-800"
                >
                  Agendar asesoría de diseño
                </a>
                <a 
                  href={WHATSAPP_URL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-sm border border-border-strong px-8 py-4 text-sm font-medium text-text-heading transition-colors hover:bg-surface-100"
                >
                  Hablamos por WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid de Artículos (Estilo Portafolio / Masonry Limpio) */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {articulos.map((art) => (
            <Link 
              href={`/bitacora/${art.slug}`} 
              key={art.id} 
              className="group flex flex-col cursor-pointer"
            >
              {/* Contenedor de Imagen Limpio (Sin bordes falsos) */}
              <div className="relative aspect-[4/3] w-full bg-bg-alt overflow-hidden mb-6 rounded-sm">
                {art.imagenPortada ? (
                  <Image 
                    src={art.imagenPortada} 
                    alt={art.titulo} 
                    fill 
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105 saturate-50 group-hover:saturate-100" 
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-charcoal-900/20 bg-surface-100">
                    <svg className="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="font-display text-sm tracking-widest uppercase">En Obra</span>
                  </div>
                )}
                {/* Overlay ahumado unificador */}
                <div className="absolute inset-0 bg-charcoal-900/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
              </div>

              {/* Caption Editorial */}
              <div className="flex flex-col flex-grow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gold-600">
                    {art.categoria.replace('_', ' ')}
                  </span>
                  <span className="w-4 h-[1px] bg-border-strong"></span>
                  <span className="text-xs text-text-muted font-light tracking-wide">
                    {new Date(art.fechaPublicacion).toLocaleDateString('es-CO')}
                  </span>
                </div>
                
                <h2 className="text-2xl font-display font-medium text-text-heading mb-4 leading-snug group-hover:text-gold-700 transition-colors">
                  {art.titulo}
                </h2>
                
                <p className="text-text-muted text-sm leading-relaxed mb-6 flex-grow font-light">
                  {art.extracto}
                </p>
                
                <div className="mt-auto flex items-center text-charcoal-900 text-sm font-semibold tracking-wide">
                  <span className="border-b border-charcoal-900/30 group-hover:border-charcoal-900 transition-colors pb-0.5">
                    Leer artículo
                  </span>
                  <span className="ml-2 transform group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
