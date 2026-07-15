'use client'

import { useState } from 'react'
import { Expand, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { PublicProposalSnapshot } from '@/server/public-proposal'

type GalleryImage = { url: string; description?: string }

export default function PublicProposal({ proposal }: { proposal: PublicProposalSnapshot }) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [focusedImage, setFocusedImage] = useState<GalleryImage | null>(null)

  return (
    <main className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg))] text-[hsl(var(--veta-text-main))]">
      <header className="sticky top-0 z-20 border-b border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))/0.94] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-8 gap-y-3 px-4 py-3 sm:px-6">
          <div className="min-w-[10rem]">
            <strong className="veta-heading tracking-wide">VETA DE ORO</strong>
            <p className="text-[9px] uppercase tracking-[.2em] text-[hsl(var(--veta-gold-muted))]">Carpintería e interiores</p>
          </div>
          <nav className="order-3 flex w-full gap-4 overflow-x-auto pb-1 text-sm text-[hsl(var(--veta-text-muted))] sm:order-none sm:w-auto sm:flex-1 sm:justify-center sm:pb-0" aria-label="Espacios de la propuesta">
            {proposal.spaces.map(space => <a key={space.id} href={`#${space.id}`} className="shrink-0 hover:text-[hsl(var(--veta-gold-muted))]">{space.name}</a>)}
          </nav>
          <button onClick={() => window.print()} className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--veta-divider-soft)] px-4 text-xs font-medium text-[hsl(var(--veta-text-muted))] hover:border-[hsl(var(--veta-gold-muted))]">
            <FileText size={14} /> Guardar como PDF
          </button>
        </div>
      </header>

      <section className="border-b border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-alt))]">
        <div className="mx-auto grid max-w-6xl gap-3 px-4 py-7 sm:px-6 sm:py-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="veta-quote-section-label">Propuesta de diseño</p>
            <h1 className="veta-heading mt-2 text-[clamp(2rem,1.35rem+2.7vw,3.8rem)] leading-tight">{proposal.title}</h1>
          </div>
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[hsl(var(--veta-text-muted))] md:justify-end">
            {proposal.client?.name && <div><dt className="sr-only">Cliente</dt><dd>Cliente: {proposal.client.name}</dd></div>}
            {proposal.client?.location && <div><dt className="sr-only">Ubicación</dt><dd>{proposal.client.location}</dd></div>}
            <div><dt className="sr-only">Emisión</dt><dd>Emitida {proposal.issued_at}</dd></div>
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-[clamp(3rem,7vw,6rem)] px-4 py-[clamp(2rem,5vw,4rem)] sm:px-6">
        {proposal.spaces.map((space, spaceIndex) => {
          const selectedIndex = selectedVariants[space.id] ?? Math.max(0, space.variants.findIndex(variant => variant.selected))
          const activeVariant = space.variants[selectedIndex]
          const gallery = activeVariant?.images ?? []
          return (
            <article id={space.id} key={space.id} className="scroll-mt-28 border-b border-[var(--veta-divider-soft)] pb-[clamp(3rem,7vw,6rem)] last:border-0">
              <div className="grid gap-[clamp(1.5rem,4vw,3rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)] lg:items-start">
                <div className="order-2 lg:order-1">
                  {gallery.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" style={{ containerType: 'inline-size' }}>
                      {gallery.map((image, imageIndex) => (
                        <button key={`${image.url}-${imageIndex}`} type="button" onClick={() => setFocusedImage(image)} className="group relative min-h-11 overflow-hidden rounded-xl bg-[hsl(var(--veta-bg-alt))] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--veta-gold-muted))]">
                          <img src={image.url} alt={image.description || `Diseño de ${space.name}`} loading="lazy" className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
                          <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100"><Expand size={22} /></span>
                        </button>
                      ))}
                    </div>
                  ) : <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed border-[var(--veta-divider-soft)] text-sm text-[hsl(var(--veta-text-muted))]">Sin imágenes de referencia</div>}
                </div>
                <div className="order-1 lg:order-2">
                  <p className="veta-quote-section-label">{String(spaceIndex + 1).padStart(2, '0')}</p>
                  <h2 className="veta-heading mt-2 text-[clamp(1.8rem,1.25rem+2vw,3rem)]">{space.name}</h2>
                  {space.description && <p className="mt-3 max-w-prose leading-relaxed text-[hsl(var(--veta-text-muted))]">{space.description}</p>}
                  {space.variants.length > 1 && <div className="mt-6"><p className="veta-quote-section-label mb-2">Variantes cotizadas de este espacio</p><div className="flex flex-wrap gap-2" role="tablist" aria-label={`Variantes de ${space.name}`}>{space.variants.map((variant, index) => <button key={variant.name} type="button" onClick={() => setSelectedVariants(current => ({ ...current, [space.id]: index }))} aria-selected={index === selectedIndex} className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${index === selectedIndex ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-gold-muted))] text-[hsl(var(--veta-bg))]' : 'border-[var(--veta-divider-soft)] text-[hsl(var(--veta-text-muted))] hover:border-[hsl(var(--veta-gold-muted))]'}`}>{variant.name}</button>)}</div></div>}
                  {activeVariant?.colors?.length ? <div className="mt-6 flex flex-wrap gap-3" aria-label="Materiales y colores seleccionados">{activeVariant.colors.map(color => <span key={color.name} className="inline-flex items-center gap-2 text-sm text-[hsl(var(--veta-text-muted))]">{color.image_url ? <img src={color.image_url} alt="" className="h-7 w-7 rounded-full border border-[var(--veta-divider-soft)] object-cover" /> : <span className="h-7 w-7 rounded-full border border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-alt))]" />}{color.name}</span>)}</div> : null}
                  <div className="mt-7 divide-y divide-[var(--veta-divider-soft)]">{activeVariant?.items.map((item, itemIndex) => <div key={`${item.name}-${itemIndex}`} className="flex min-h-12 items-center gap-3 py-3"><div className="grid h-10 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--veta-bg-alt))]">{item.image_url && <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div><span className="min-w-0 flex-1 text-sm sm:text-base">{item.name}</span><span className="shrink-0 text-right text-sm text-[hsl(var(--veta-text-muted))]">{item.quantity} {item.unit}</span></div>)}</div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      <Dialog open={Boolean(focusedImage)} onOpenChange={open => !open && setFocusedImage(null)}>
        <DialogContent className="max-h-[92dvh] max-w-5xl overflow-auto border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))] p-3 sm:rounded-2xl sm:p-5">
          <DialogTitle className="sr-only">Imagen de diseño ampliada</DialogTitle>
          {focusedImage && <img src={focusedImage.url} alt={focusedImage.description || 'Imagen de diseño'} className="max-h-[82dvh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
    </main>
  )
}
