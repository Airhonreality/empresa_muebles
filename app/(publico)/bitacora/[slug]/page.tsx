import { obtenerBitacoraPorSlugAction } from '@/lib/data/actions/portafolio'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { SITE_URL } from '@/lib/seo/jsonld'
import { socialMeta } from '@/lib/seo/social'

// force-dynamic (bug real en Vercel, 2026-08-16, mismo motivo que app/sitemap.ts): sin esto,
// Next prerenderiza esta página en build time con el DATA_IMPL del entorno de build — en Vercel
// no está seteada (cae a 'mock'), y getDataStore() rechaza mock bajo VERCEL=1, tumbando el build.
export const dynamic = 'force-dynamic'

type RouteParams = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: RouteParams) {
  const { slug } = await params
  const articulo = await obtenerBitacoraPorSlugAction(slug)
  if (!articulo) return { title: 'No encontrado' }
  return {
    title: `${articulo.titulo} — Bitácora Veta Dorada`,
    description: articulo.extracto,
    alternates: { canonical: `${SITE_URL}/bitacora/${slug}` },
    ...socialMeta({
      title: articulo.titulo,
      description: articulo.extracto,
      path: `/bitacora/${slug}`,
      image: articulo.imagenPortada,
    }),
  }
}

// Simple parser to render basic markdown elements for our seeded text
function renderSimpleMarkdown(text: string) {
  const blocks = text.split('\n\n')
  return blocks.map((block, i) => {
    if (block.startsWith('## ')) {
      return <h2 key={i} className="text-2xl font-serif text-[var(--color-primary)] mt-12 mb-6 border-b border-[var(--color-border)] pb-2">{block.replace('## ', '')}</h2>
    }
    if (block.startsWith('1. ') || block.startsWith('2. ') || block.startsWith('3. ')) {
      const items = block.split('\n')
      return (
        <ol key={i} className="list-decimal list-outside ml-6 mb-6 space-y-3 text-[var(--color-text)]">
          {items.map((item, j) => {
            const clean = item.replace(/^\d+\.\s*/, '')
            // parse bold ** text **
            const parts = clean.split(/(\*\*.*?\*\*)/g)
            return (
              <li key={j} className="pl-2">
                {parts.map((p, k) => p.startsWith('**') ? <strong key={k} className="font-semibold">{p.slice(2, -2)}</strong> : p)}
              </li>
            )
          })}
        </ol>
      )
    }
    if (block.startsWith('* ')) {
      const items = block.split('\n')
      return (
        <ul key={i} className="list-disc list-outside ml-6 mb-6 space-y-3 text-[var(--color-text)]">
          {items.map((item, j) => {
            const clean = item.replace(/^\*\s*/, '')
            const parts = clean.split(/(\*\*.*?\*\*)/g)
            return (
              <li key={j} className="pl-2">
                {parts.map((p, k) => p.startsWith('**') ? <strong key={k} className="font-semibold">{p.slice(2, -2)}</strong> : p)}
              </li>
            )
          })}
        </ul>
      )
    }
    if (block.startsWith('> ')) {
      const content = block.replace(/^>\s*/, '')
      // Check if it has a markdown link
      const linkMatch = content.match(/\[(.*?)\]\((.*?)\)/)
      
      return (
        <blockquote key={i} className="my-10 p-6 bg-[var(--color-bg-linen)] border-l-4 border-[var(--color-accent)] italic text-lg text-[var(--color-primary)] rounded-r-lg">
          {linkMatch ? (
            <>
              {content.substring(0, linkMatch.index)}
              <Link href={linkMatch[2]} className="font-bold underline decoration-[var(--color-accent)] underline-offset-4 hover:text-[var(--color-accent)] transition-colors">
                {linkMatch[1]}
              </Link>
              {content.substring((linkMatch.index || 0) + linkMatch[0].length)}
            </>
          ) : (
            content
          )}
        </blockquote>
      )
    }
    
    // Default paragraph with bold support
    const parts = block.split(/(\*\*.*?\*\*)/g)
    return (
      <p key={i} className="mb-6 leading-relaxed text-lg text-[var(--color-text)]">
        {parts.map((p, k) => p.startsWith('**') ? <strong key={k} className="font-semibold text-[var(--color-primary)]">{p.slice(2, -2)}</strong> : p)}
      </p>
    )
  })
}

export default async function BitacoraArticlePage({ params }: RouteParams) {
  const { slug } = await params
  const articulo = await obtenerBitacoraPorSlugAction(slug)
  if (!articulo) notFound()

  // JSON-LD Article/BlogPosting (plan_seo_2026.md §2, auditoría SEO 2026-08-19 checklist #6):
  // la única página tipo blog del sitio no tenía datos estructurados. Sin aggregateRating
  // fabricado (regla anti-invención).
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: articulo.titulo,
    description: articulo.extracto,
    image: articulo.imagenPortada ?? undefined,
    datePublished: articulo.fechaPublicacion,
    dateModified: articulo.updatedAt,
    inLanguage: 'es-CO',
    mainEntityOfPage: `${SITE_URL}/bitacora/${slug}`,
    url: `${SITE_URL}/bitacora/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'Veta Dorada',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Veta Dorada',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-veta-positive.svg`,
    },
  }

  return (
    <article className="container mx-auto px-4 py-16 max-w-4xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mb-12 text-center">
        <div className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)] mb-4 flex items-center justify-center gap-2">
          <Link href="/bitacora" className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">BITÁCORA</Link>
          <span className="text-[var(--color-border)]">•</span>
          <span>{articulo.categoria.replace('_', ' ')}</span>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-[var(--color-primary)] mb-8 leading-tight tracking-tight">
          {articulo.titulo}
        </h1>
        <div className="text-[var(--color-text-muted)] font-light">
          Publicado el {new Date(articulo.fechaPublicacion).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {articulo.imagenPortada && (
        <div className="relative aspect-video w-full mb-16 rounded-xl overflow-hidden shadow-sm bg-[var(--color-bg-linen)]">
          <Image 
            src={articulo.imagenPortada} 
            alt={articulo.titulo} 
            fill 
            className="object-cover" 
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />
        </div>
      )}

      <div className="prose prose-lg prose-headings:font-serif prose-headings:text-[var(--color-primary)] max-w-3xl mx-auto">
        {renderSimpleMarkdown(articulo.contenidoLargo)}
      </div>

      {/* CTA Final (Artículo) */}
      <div className="max-w-3xl mx-auto mt-20 pt-16 border-t border-[var(--color-border)] text-center">
        <h2 className="text-3xl font-serif text-[var(--color-primary)] mb-4">¿Quiere un proyecto así?</h2>
        <p className="text-lg text-[var(--color-text-muted)] mb-8 max-w-xl mx-auto">
          Agende su asesoría de diseño: un diseñador visita su espacio, lo mide y le presenta una cotización sin compromiso.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
          {/* B6 (auditoría 2026-08-15): apuntaba a /asesoria, ruta inexistente (F-12 sin
              construir, diferida en TAREAS_DIFERIDAS.md) — ambos CTA a WhatsApp mientras F-12
              no exista, mismo criterio que el resto del sitio. */}
          <a href="https://wa.me/573025922101" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-[var(--color-primary)] text-white font-medium rounded hover:bg-[var(--color-primary-hover)] transition-colors">
            Agendar asesoría de diseño
          </a>
          
        </div>
      </div>
    </article>
  )
}
