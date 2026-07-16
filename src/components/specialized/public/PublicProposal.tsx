'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { ChevronDown, Expand, FileText, List } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PublicProposalSnapshot } from '@/server/public-proposal'

type GalleryImage = { url: string; description?: string }

const publicProposalLightTheme = {
  '--veta-bg': '40 30% 98%', '--veta-bg-alt': '38 26% 93%', '--veta-text-main': '0 0% 17%', '--veta-text-muted': '43 4% 34%', '--veta-gold-muted': '39 32% 47%', '--veta-gold-hover': '39 50% 40%', '--veta-divider-soft': 'rgba(94, 76, 42, 0.20)',
} as CSSProperties

export default function PublicProposal({ proposal }: { proposal: PublicProposalSnapshot }) {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({})
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<Record<string, number>>({})
  const [focusedImage, setFocusedImage] = useState<GalleryImage | null>(null)
  const [activeSpaceId, setActiveSpaceId] = useState(proposal.spaces[0]?.id ?? '')

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSpaceId(visible.target.id)
      },
      { rootMargin: '-28% 0px -58% 0px', threshold: [0.1, 0.3, 0.6] },
    )
    proposal.spaces.forEach(space => {
      const element = document.getElementById(space.id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [proposal.spaces])

  const goToSpace = (spaceId: string) => {
    setActiveSpaceId(spaceId)
    document.getElementById(spaceId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return <main style={publicProposalLightTheme} className="veta-font-body min-h-screen bg-[hsl(var(--veta-bg))] text-[hsl(var(--veta-text-main))]">
    <header className="sticky top-0 z-20 border-b border-[var(--veta-divider-soft)] bg-white/55 shadow-[0_10px_32px_-24px_rgba(55,42,20,.45),inset_0_1px_0_rgba(255,255,255,.8)] backdrop-blur-2xl">
      <div className="mx-auto grid max-w-6xl lg:grid-cols-[minmax(13rem,0.382fr)_minmax(0,0.618fr)]">
        <div className="flex items-center border-b border-[var(--veta-divider-soft)] px-4 py-3 lg:border-b-0 lg:border-r sm:px-6"><div><strong className="veta-heading text-sm font-semibold tracking-wide">VETA DE ORO</strong><p className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-[hsl(var(--veta-gold-muted))]">Carpintería e interiores</p></div></div>
        <div className="min-w-0 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2"><div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1"><p className="veta-quote-section-label shrink-0">Propuesta de diseño</p><h1 className="veta-heading min-w-0 text-[clamp(1.2rem,1rem+0.8vw,1.65rem)] font-semibold leading-tight tracking-[-0.03em]">{proposal.title}</h1></div><button onClick={() => window.print()} className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full border border-[var(--veta-divider-soft)] bg-white/40 px-3.5 text-xs font-medium text-[hsl(var(--veta-text-muted))] transition hover:border-[hsl(var(--veta-gold-muted))] hover:bg-white/70"><FileText size={14} /> Guardar como PDF</button></div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[var(--veta-divider-soft)] pt-2"><dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] leading-4 text-[hsl(var(--veta-text-muted))]">{proposal.client?.name && <div><dt className="sr-only">Cliente</dt><dd>{proposal.client.name}</dd></div>}{proposal.client?.location && <div><dt className="sr-only">Ubicación</dt><dd>{proposal.client.location}</dd></div>}<div><dt className="sr-only">Emisión</dt><dd>{proposal.issued_at}</dd></div></dl><Popover><PopoverTrigger asChild><button type="button" className="hidden min-h-9 items-center gap-1.5 rounded-full border border-[var(--veta-divider-soft)] bg-white/35 px-3 text-xs text-[hsl(var(--veta-text-muted))] transition hover:bg-white/70 sm:inline-flex"><List size={14} /> Espacios · {proposal.spaces.length}<ChevronDown size={13} /></button></PopoverTrigger><PopoverContent align="end" className="w-72 border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))/0.96] p-2 backdrop-blur-xl"><p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[hsl(var(--veta-gold-hover))]">Índice de espacios</p><div className="max-h-[min(60dvh,28rem)] overflow-y-auto">{proposal.spaces.map((space, index) => <button key={space.id} type="button" onClick={() => goToSpace(space.id)} className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm transition ${activeSpaceId === space.id ? 'bg-[hsl(var(--veta-bg-alt))] text-[hsl(var(--veta-text-main))]' : 'text-[hsl(var(--veta-text-muted))] hover:bg-white/70'}`}><span className="w-6 text-[10px] tabular-nums text-[hsl(var(--veta-gold-hover))]">{String(index + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1 truncate">{space.name}</span>{activeSpaceId === space.id && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--veta-gold-hover))]" />}</button>)}</div></PopoverContent></Popover><Sheet><SheetTrigger asChild><button type="button" className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--veta-divider-soft)] bg-white/35 px-3 text-xs text-[hsl(var(--veta-text-muted))] sm:hidden"><List size={14} /> Espacios · {proposal.spaces.length}</button></SheetTrigger><SheetContent side="bottom" className="max-h-[78dvh] rounded-t-2xl border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))] px-4 pb-6"><SheetHeader><SheetTitle className="veta-heading text-left text-lg">Índice de espacios</SheetTitle></SheetHeader><div className="mt-4 max-h-[58dvh] overflow-y-auto">{proposal.spaces.map((space, index) => <SheetClose asChild key={space.id}><button type="button" onClick={() => goToSpace(space.id)} className={`flex min-h-12 w-full items-center gap-3 border-b border-[var(--veta-divider-soft)] px-2 text-left text-sm ${activeSpaceId === space.id ? 'text-[hsl(var(--veta-gold-hover))]' : 'text-[hsl(var(--veta-text-muted))]'}`}><span className="w-7 text-xs tabular-nums">{String(index + 1).padStart(2, '0')}</span><span>{space.name}</span></button></SheetClose>)}</div></SheetContent></Sheet></div>
        </div>
      </div>
    </header>

    <section className="mx-auto max-w-6xl space-y-[clamp(3rem,7vw,6rem)] px-4 py-[clamp(2rem,5vw,4rem)] sm:px-6">
      {proposal.spaces.map((space, spaceIndex) => {
        const selectedIndex = selectedVariants[space.id] ?? Math.max(0, space.variants.findIndex(variant => variant.selected))
        const activeVariant = space.variants[selectedIndex]
        const gallery = activeVariant?.images ?? []
        const selectedGalleryImage = gallery[selectedGalleryImages[space.id] ?? 0] ?? gallery[0]
        return <article id={space.id} key={space.id} className="scroll-mt-28 border-b border-[var(--veta-divider-soft)] pb-[clamp(3rem,7vw,6rem)] last:border-0"><div className="grid gap-[clamp(1.5rem,4vw,3rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,.9fr)] lg:items-start">
          <div className="order-2 lg:order-1">{selectedGalleryImage ? <div className="space-y-2.5"><button type="button" onClick={() => setFocusedImage(selectedGalleryImage)} className="group relative block w-full overflow-hidden rounded-2xl bg-[hsl(var(--veta-bg-alt))] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--veta-gold-muted))]"><img src={selectedGalleryImage.url} alt={selectedGalleryImage.description || `Diseño de ${space.name}`} className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-[1.02]" /><span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100"><Expand size={24} /></span></button>{gallery.length > 1 && <div className="flex gap-2 overflow-x-auto pb-1" aria-label={`Galería de ${space.name}`}>{gallery.map((image, imageIndex) => <button key={`${image.url}-${imageIndex}`} type="button" onClick={() => setSelectedGalleryImages(current => ({ ...current, [space.id]: imageIndex }))} aria-label={`Ver imagen ${imageIndex + 1}`} aria-pressed={image.url === selectedGalleryImage.url} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition sm:h-20 sm:w-28 ${image.url === selectedGalleryImage.url ? 'border-[hsl(var(--veta-gold-muted))]' : 'border-transparent opacity-70 hover:opacity-100'}`}><img src={image.url} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}</div>}</div> : <div className="grid aspect-[16/10] place-items-center rounded-xl border border-dashed border-[var(--veta-divider-soft)] text-sm text-[hsl(var(--veta-text-muted))]">Sin imágenes de referencia</div>}</div>
          <div className="order-1 lg:order-2"><p className="veta-quote-section-label">{String(spaceIndex + 1).padStart(2, '0')}</p><h2 className="veta-heading mt-2 text-[clamp(1.8rem,1.25rem+2vw,3rem)]">{space.name}</h2>{space.description && <p className="mt-3 max-w-prose leading-relaxed text-[hsl(var(--veta-text-muted))]">{space.description}</p>}{space.variants.length > 1 && <div className="mt-6"><p className="veta-quote-section-label mb-2">Variantes cotizadas de este espacio</p><div className="flex flex-wrap gap-2" role="tablist" aria-label={`Variantes de ${space.name}`}>{space.variants.map((variant, index) => <button key={variant.name} type="button" onClick={() => { setSelectedVariants(current => ({ ...current, [space.id]: index })); setSelectedGalleryImages(current => ({ ...current, [space.id]: 0 })) }} aria-selected={index === selectedIndex} className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${index === selectedIndex ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-gold-muted))] text-[hsl(var(--veta-bg))]' : 'border-[var(--veta-divider-soft)] text-[hsl(var(--veta-text-muted))] hover:border-[hsl(var(--veta-gold-muted))]'}`}>{variant.name}</button>)}</div></div>}{activeVariant?.colors?.length ? <div className="mt-6 flex flex-wrap gap-3" aria-label="Materiales y colores seleccionados">{activeVariant.colors.map(color => <span key={color.name} className="inline-flex items-center gap-2 text-sm text-[hsl(var(--veta-text-muted))]">{color.image_url ? <img src={color.image_url} alt="" className="h-7 w-7 rounded-full border border-[var(--veta-divider-soft)] object-cover" /> : <span className="h-7 w-7 rounded-full border border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg-alt))]" />}{color.name}</span>)}</div> : null}<div className="mt-7 divide-y divide-[var(--veta-divider-soft)]">{activeVariant?.items.map((item, itemIndex) => <div key={`${item.name}-${itemIndex}`} className="flex min-h-12 items-center gap-3 py-3"><div className="grid h-10 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-[hsl(var(--veta-bg-alt))]">{item.image_url && <img src={item.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />}</div><span className="min-w-0 flex-1 text-sm sm:text-base">{item.name}</span><span className="shrink-0 text-right text-sm text-[hsl(var(--veta-text-muted))]">{item.quantity} {item.unit}</span></div>)}</div></div>
        </div></article>
      })}
    </section>
    <Dialog open={Boolean(focusedImage)} onOpenChange={open => !open && setFocusedImage(null)}><DialogContent className="max-h-[92dvh] max-w-5xl overflow-auto border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))] p-3 sm:rounded-2xl sm:p-5"><DialogTitle className="sr-only">Imagen de diseño ampliada</DialogTitle>{focusedImage && <img src={focusedImage.url} alt={focusedImage.description || 'Imagen de diseño'} className="max-h-[82dvh] w-full rounded-lg object-contain" />}</DialogContent></Dialog>
  </main>
}
