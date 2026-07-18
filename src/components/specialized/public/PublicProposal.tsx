'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import { ArrowDown, ChevronDown, ChevronLeft, ChevronRight, Expand, FileText, List, X } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { PublicProposalSnapshot } from '@/server/public-proposal'

type GalleryImage = { url: string; description?: string }
type FocusedImageState = { url: string; description?: string; spaceId: string; imageIndex: number }

const formatCop = (value: number) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(value || 0)

const formatQuantity = (value: number) => new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 2,
}).format(value || 0)

const publicProposalLightTheme = {
  '--veta-bg': '40 30% 98%',
  '--veta-bg-alt': '38 26% 93%',
  '--veta-surface': '40 38% 99%',
  '--veta-text-main': '24 12% 15%',
  '--veta-text-muted': '31 6% 38%',
  '--veta-gold-muted': '35 33% 42%',
  '--veta-gold-hover': '31 41% 31%',
  '--veta-divider-soft': 'rgba(94, 76, 42, 0.18)',
} as CSSProperties

export default function PublicProposal({ proposal }: { proposal: PublicProposalSnapshot }) {
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<Record<string, number>>({})
  const [focusedImage, setFocusedImage] = useState<FocusedImageState | null>(null)
  const [activeSpaceId, setActiveSpaceId] = useState(proposal.spaces[0]?.id ?? '')
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<Record<string, number>>({})

  const carpentryTotal = proposal.financial?.carpentry_total ?? 0
  const civilEstimateTotal = proposal.financial?.civil_estimate_total ?? 0
  const hasCarpentryTotal = carpentryTotal > 0
  const hasCivilEstimate = civilEstimateTotal > 0

  const getTotalForVariant = (spaceId: string, variantIndex: number) => {
    const space = proposal.spaces.find(s => s.id === spaceId)
    return space?.variants[variantIndex]?.total ?? 0
  }

  const getCurrentTotalForSpace = (spaceId: string) => {
    const variantIdx = selectedVariantIndex[spaceId] ?? 0
    return getTotalForVariant(spaceId, variantIdx)
  }

  const getProposalTotal = () => {
    return proposal.spaces.reduce((sum, space) => sum + getCurrentTotalForSpace(space.id), 0)
  }

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSpaceId(visible.target.id)
    }, { rootMargin: '-24% 0px -62% 0px', threshold: [0.1, 0.3, 0.6] })

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

  const spaceIndex = (
    <div className="max-h-[min(60dvh,28rem)] overflow-y-auto">
      {proposal.spaces.map((space, index) => (
        <button
          key={space.id}
          type="button"
          onClick={() => goToSpace(space.id)}
          className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 text-left text-sm transition ${activeSpaceId === space.id ? 'bg-[hsl(var(--veta-bg-alt))] text-[hsl(var(--veta-text-main))]' : 'text-[hsl(var(--veta-text-muted))] hover:bg-white/70'}`}
        >
          <span className="w-6 text-[10px] tabular-nums text-[hsl(var(--veta-gold-hover))]">{String(index + 1).padStart(2, '0')}</span>
          <span className="min-w-0 flex-1 truncate">{space.name}</span>
          {activeSpaceId === space.id && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--veta-gold-hover))]" />}
        </button>
      ))}
    </div>
  )

  return (
    <main
      style={publicProposalLightTheme}
      className="veta-font-body min-h-screen bg-[radial-gradient(circle_at_top_left,_hsl(var(--veta-bg-alt))_0,_hsl(var(--veta-bg))_38%,_hsl(var(--veta-bg))_100%)] pb-24 text-[hsl(var(--veta-text-main))] sm:pb-0"
    >
      <header className="sticky top-0 z-30 border-b border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))/0.9] backdrop-blur-xl print:static print:bg-transparent">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <strong className="veta-heading text-sm font-semibold tracking-wide">VETA DE ORO</strong>
            <p className="mt-0.5 text-[9px] uppercase tracking-[.2em] text-[hsl(var(--veta-gold-muted))]">Carpinteria e interiores</p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="hidden min-h-10 items-center gap-1.5 rounded-full border border-[var(--veta-divider-soft)] bg-white/55 px-3 text-xs text-[hsl(var(--veta-text-muted))] transition hover:bg-white sm:inline-flex">
                  <List size={14} /> Ambientes <ChevronDown size={13} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))/0.98] p-2 backdrop-blur-xl">
                <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[.16em] text-[hsl(var(--veta-gold-hover))]">Indice de ambientes</p>
                {spaceIndex}
              </PopoverContent>
            </Popover>
            <Sheet>
              <SheetTrigger asChild>
                <button type="button" className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--veta-divider-soft)] bg-white/55 px-3 text-xs text-[hsl(var(--veta-text-muted))] sm:hidden">
                  <List size={14} /> Ambientes
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="max-h-[78dvh] rounded-t-2xl border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-bg))] px-4 pb-6">
                <SheetHeader><SheetTitle className="veta-heading text-left text-lg">Indice de ambientes</SheetTitle></SheetHeader>
                <div className="mt-4">
                  {proposal.spaces.map((space, index) => (
                    <SheetClose asChild key={space.id}>
                      <button type="button" onClick={() => goToSpace(space.id)} className="flex min-h-12 w-full items-center gap-3 border-b border-[var(--veta-divider-soft)] px-2 text-left text-sm">
                        <span className="w-7 text-xs tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                        <span>{space.name}</span>
                      </button>
                    </SheetClose>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
            <button onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--veta-divider-soft)] bg-white/55 px-3.5 text-xs font-medium text-[hsl(var(--veta-text-muted))] transition hover:border-[hsl(var(--veta-gold-muted))] hover:bg-white">
              <FileText size={14} /> <span className="hidden sm:inline">Guardar como PDF</span><span className="sm:hidden">PDF</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-10 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,.42fr)] lg:gap-16 lg:px-8 lg:pb-16 lg:pt-20">
        <div className="max-w-3xl">
          <p className="veta-quote-section-label">Propuesta comercial</p>
          <h1 className="veta-heading mt-3 text-[clamp(2.35rem,1.5rem+3vw,4.75rem)] leading-[0.95] tracking-[-0.045em]">{proposal.title}</h1>
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[hsl(var(--veta-text-muted))]">
            {proposal.issued_at && <span>Emitida el {proposal.issued_at}</span>}
            <span>{proposal.spaces.length} {proposal.spaces.length === 1 ? 'ambiente incluido' : 'ambientes incluidos'}</span>
          </div>
          <p className="mt-8 max-w-2xl text-base leading-7 text-[hsl(var(--veta-text-muted))]">
            Revisa el alcance por ambiente, las alternativas seleccionadas y las referencias visuales. Los detalles tecnicos se presentan solo cuando ayudan a tomar una decision.
          </p>
          {proposal.spaces.length > 0 && <button type="button" onClick={() => goToSpace(proposal.spaces[0].id)} className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-[hsl(var(--veta-gold-muted))] px-4 text-sm font-medium text-[hsl(var(--veta-gold-hover))] transition hover:bg-[hsl(var(--veta-gold-muted))] hover:text-white">
            Ver propuesta <ArrowDown size={16} />
          </button>}
        </div>

        <aside className="self-end rounded-2xl border border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-surface))/0.82] p-5 shadow-[0_20px_46px_-38px_rgba(55,42,20,.6)] sm:p-6">
          <p className="veta-quote-section-label">Resumen comercial</p>
          {hasCarpentryTotal ? <>
            <p className="mt-3 text-xs uppercase tracking-[.14em] text-[hsl(var(--veta-text-muted))]">Inversion total del proyecto</p>
            <p className="veta-heading mt-2 text-[clamp(2rem,1.2rem+2vw,3.1rem)] tracking-[-0.035em]">{formatCop(getProposalTotal())}</p>
            <p className="mt-4 text-xs leading-5 text-[hsl(var(--veta-text-muted))]">Esta cifra incluye los costos de carpintería, materiales de obra civil, y mano de obra estimada. <strong>Son valores promedio</strong> que pueden variar según los materiales seleccionados y especificaciones finales. Revisa{' '}
              <a href="#resumen" className="font-medium underline hover:text-[hsl(var(--veta-gold-hover))] transition">
                el desglose por ambiente
              </a>
              {' '}para conocer qué contempla cada estimativo.
            </p>
          </> : <p className="mt-3 text-lg leading-7 text-[hsl(var(--veta-text-muted))]">La inversión de carpintería se confirmará con el equipo comercial.</p>}
          {hasCivilEstimate && <div className="mt-4 border-t border-[var(--veta-divider-soft)] pt-4 text-sm text-[hsl(var(--veta-text-muted))]">
            <p className="text-xs uppercase tracking-[.14em]">Referencial independiente</p>
            <div className="mt-2 flex justify-between gap-4"><span>Obra civil estimada</span><strong className="font-medium text-[hsl(var(--veta-text-main))]">{formatCop(civilEstimateTotal)}</strong></div>
          </div>}
          <p className="mt-4 border-t border-[var(--veta-divider-soft)] pt-4 text-xs leading-5 text-[hsl(var(--veta-text-muted))]">Los valores de obra civil son referenciales y se gestionan independientemente del contrato de carpintería.</p>
        </aside>
      </section>

      {proposal.spaces.length > 1 && <nav aria-label="Navegacion de ambientes" className="border-y border-[var(--veta-divider-soft)] bg-white/35">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {proposal.spaces.map((space, index) => <button key={space.id} type="button" onClick={() => goToSpace(space.id)} className={`min-h-10 shrink-0 rounded-full border px-3 text-xs transition ${activeSpaceId === space.id ? 'border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-gold-muted))] text-white' : 'border-[var(--veta-divider-soft)] bg-white/55 text-[hsl(var(--veta-text-muted))] hover:border-[hsl(var(--veta-gold-muted))]'}`}><span className="mr-1.5 opacity-70">{String(index + 1).padStart(2, '0')}</span>{space.name}</button>)}
        </div>
      </nav>}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
        {proposal.spaces.map((space, spacePosition) => {
          const variantIdx = selectedVariantIndex[space.id] ?? 0
          const activeVariant = space.variants[variantIdx]
          const gallery = activeVariant?.images ?? []
          const selectedGalleryImage = gallery[selectedGalleryImages[space.id] ?? 0] ?? gallery[0]
          const civilItems = activeVariant?.civil_estimate ?? []
          const hasMultipleVariants = space.variants.length > 1

          return <article id={space.id} key={space.id} className="scroll-mt-24 border-b border-[var(--veta-divider-soft)] py-12 first:pt-0 last:border-0 last:pb-0 lg:py-20 lg:first:pt-0">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,.95fr)_minmax(20rem,1.05fr)] lg:gap-16">
              <div className="lg:order-2">
                <p className="veta-quote-section-label">Ambiente {String(spacePosition + 1).padStart(2, '0')}</p>
                <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                  <h2 className="veta-heading text-[clamp(2rem,1.25rem+2vw,3.35rem)] leading-none tracking-[-0.04em]">{space.name}</h2>
                  {activeVariant && activeVariant.total > 0 && <p className="text-right"><span className="block text-[10px] uppercase tracking-[.14em] text-[hsl(var(--veta-text-muted))]">Inversion del ambiente</span><strong className="veta-heading mt-1 block text-xl">{formatCop(activeVariant.total)}</strong></p>}
                </div>
                {space.description && <p className="mt-5 max-w-prose text-base leading-7 text-[hsl(var(--veta-text-muted))]">{space.description}</p>}

                {hasMultipleVariants && <div className="mt-7 flex flex-wrap gap-2 border-b border-[var(--veta-divider-soft)] pb-5">
                  {space.variants.map((variant, idx) => <button key={idx} type="button" onClick={() => setSelectedVariantIndex(current => ({ ...current, [space.id]: idx }))} className={`rounded-full px-3 py-1.5 text-sm transition ${variantIdx === idx ? 'bg-[hsl(var(--veta-gold-muted))] text-white' : 'border border-[var(--veta-divider-soft)] bg-white/55 text-[hsl(var(--veta-text-muted))] hover:border-[hsl(var(--veta-gold-muted))]'}`}>{variant.name}</button>)}
                </div>}

                {activeVariant?.colors?.length ? <div className="mt-7 border-y border-[var(--veta-divider-soft)] py-5">
                  <p className="veta-quote-section-label mb-3">Materiales y acabados</p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-3" aria-label="Materiales y acabados seleccionados">
                    {activeVariant.colors.map(color => <li key={color.name} className="inline-flex items-center gap-2 text-sm text-[hsl(var(--veta-text-muted))]">{color.image_url ? <img src={color.image_url} alt="" loading="lazy" decoding="async" className="h-8 w-8 rounded-full border border-[var(--veta-divider-soft)] object-cover" /> : <span className="h-2 w-2 rounded-full bg-[hsl(var(--veta-gold-muted))]" />}{color.name}</li>)}
                  </ul>
                </div> : null}

                <section className="mt-8" aria-labelledby={`${space.id}-scope`}>
                  <div className="flex items-baseline justify-between gap-4"><h3 id={`${space.id}-scope`} className="veta-heading text-xl">Que incluye</h3><span className="text-xs text-[hsl(var(--veta-text-muted))]">{activeVariant?.items.length ?? 0} partidas</span></div>
                  {activeVariant?.items.length ? <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {activeVariant.items.map((item, itemIndex) => <li key={`${item.name}-${itemIndex}`} className="flex min-h-20 items-center gap-3 rounded-xl border border-[var(--veta-divider-soft)] bg-white/45 p-3"><div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[hsl(var(--veta-bg-alt))]">{item.image_url ? <img src={item.image_url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /> : <span className="h-2 w-2 rounded-full bg-[hsl(var(--veta-gold-muted))]" />}</div><div><p className="text-sm font-medium leading-5">{item.name}</p><p className="mt-0.5 text-xs text-[hsl(var(--veta-text-muted))]">{formatQuantity(item.quantity)} {item.unit || 'unidad'}</p></div></li>)}
                  </ul> : <p className="mt-3 text-sm text-[hsl(var(--veta-text-muted))]">El alcance detallado se confirmara con el equipo comercial.</p>}
                </section>

                {(activeVariant?.notes?.length || civilItems.length > 0) && <Accordion type="single" collapsible className="mt-8 border-t border-[var(--veta-divider-soft)]">
                  {activeVariant.notes?.length ? <AccordionItem value="notes" className="border-[var(--veta-divider-soft)]"><AccordionTrigger className="text-left text-sm hover:no-underline">Notas del ambiente</AccordionTrigger><AccordionContent><ul className="space-y-2 text-sm leading-6 text-[hsl(var(--veta-text-muted))]">{activeVariant.notes.map(note => <li key={note}>{note}</li>)}</ul></AccordionContent></AccordionItem> : null}
                  {civilItems.length > 0 ? <AccordionItem value="civil" className="border-[var(--veta-divider-soft)]"><AccordionTrigger className="text-left text-sm hover:no-underline">Alcance referencial de obra civil</AccordionTrigger><AccordionContent><p className="mb-3 text-xs leading-5 text-[hsl(var(--veta-text-muted))]">Estas partidas son informativas y se gestionan por fuera del contrato de carpinteria.</p><ul className="space-y-2 text-sm text-[hsl(var(--veta-text-muted))]">{civilItems.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4"><span>{item.name}{item.notes ? ` - ${item.notes}` : ''}</span><span className="shrink-0">{formatQuantity(item.quantity)} {item.unit || 'ud'}</span></li>)}</ul></AccordionContent></AccordionItem> : null}
                </Accordion>}
              </div>

              <div className="lg:order-1">
                {selectedGalleryImage ? <div className="space-y-3">
                  <button type="button" onClick={() => setFocusedImage({ ...selectedGalleryImage, spaceId: space.id, imageIndex: selectedGalleryImages[space.id] ?? 0 })} className="group relative block w-full overflow-hidden rounded-2xl bg-[hsl(var(--veta-bg-alt))] text-left shadow-[0_24px_52px_-42px_rgba(55,42,20,.7)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--veta-gold-muted))]">
                    <div className="max-h-[min(70vh,600px)] w-full flex items-center justify-center"><img src={selectedGalleryImage.url} alt={selectedGalleryImage.description || `Referencia visual de ${space.name}`} decoding="async" fetchPriority={spacePosition === 0 ? 'high' : 'auto'} className="max-h-full w-full object-contain transition duration-500 motion-safe:group-hover:scale-[1.025]" /></div>
                    <span className="absolute inset-0 grid place-items-center bg-black/0 text-white opacity-0 transition motion-safe:group-hover:bg-black/20 motion-safe:group-hover:opacity-100"><Expand size={24} /></span>
                  </button>
                  {selectedGalleryImage.description && <p className="text-xs leading-5 text-[hsl(var(--veta-text-muted))]">{selectedGalleryImage.description}</p>}
                  {gallery.length > 1 && <div className="grid grid-cols-4 gap-2 sm:grid-cols-5" aria-label={`Galeria de ${space.name}`}>{gallery.slice(0, 5).map((image, imageIndex) => <button key={`${image.url}-${imageIndex}`} type="button" onClick={() => setSelectedGalleryImages(current => ({ ...current, [space.id]: imageIndex }))} aria-label={`Ver imagen ${imageIndex + 1}`} aria-pressed={image.url === selectedGalleryImage.url} className={`h-16 overflow-hidden rounded-lg border-2 transition ${image.url === selectedGalleryImage.url ? 'border-[hsl(var(--veta-gold-muted))]' : 'border-transparent opacity-70 hover:opacity-100'}`}><img src={image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" /></button>)}</div>}
                </div> : <div className="grid max-h-[min(70vh,600px)] place-items-center rounded-2xl border border-dashed border-[var(--veta-divider-soft)] bg-white/35 p-8 text-center text-sm text-[hsl(var(--veta-text-muted))]">Referencia visual pendiente</div>}
              </div>
            </div>
          </article>
        })}
      </section>

      <section id="resumen" className="mx-auto max-w-7xl scroll-mt-24 px-4 pb-12 sm:px-6 lg:px-8 lg:pb-20">
        <div className="rounded-2xl border border-[var(--veta-divider-soft)] bg-[hsl(var(--veta-surface))/0.84] p-5 shadow-[0_20px_46px_-38px_rgba(55,42,20,.6)] sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_minmax(18rem,.7fr)] lg:items-end">
            <div>
              <p className="veta-quote-section-label">Resumen de propuesta</p>
              <h2 className="veta-heading mt-2 text-[clamp(1.9rem,1.3rem+1.6vw,3rem)] tracking-[-0.035em]">Una lectura clara antes de decidir.</h2>
              <div className="mt-7 space-y-1 border-y border-[var(--veta-divider-soft)]">
                {proposal.spaces.map((space, index) => {
                  const hasMultipleVariants = space.variants.length > 1
                  const variantIdx = selectedVariantIndex[space.id] ?? 0
                  const currentTotal = getCurrentTotalForSpace(space.id)

                  return (
                    <div key={space.id}>
                      <div className="flex min-h-12 items-center justify-between gap-4 py-3 text-sm">
                        <span><span className="mr-3 text-[10px] tabular-nums text-[hsl(var(--veta-gold-hover))]">{String(index + 1).padStart(2, '0')}</span>{space.name}</span>
                        {currentTotal > 0 && <strong className="font-medium tabular-nums">{formatCop(currentTotal)}</strong>}
                      </div>
                      {hasMultipleVariants && (
                        <div className="ml-5 mb-2 flex flex-wrap gap-1.5">
                          {space.variants.map((variant, vidx) => (
                            <button key={vidx} type="button" onClick={() => setSelectedVariantIndex(current => ({ ...current, [space.id]: vidx }))} className={`text-xs px-2.5 py-1 rounded-full border transition ${variantIdx === vidx ? 'bg-[hsl(var(--veta-gold-muted))] text-white border-[hsl(var(--veta-gold-muted))]' : 'border-[var(--veta-divider-soft)] bg-white/30 text-[hsl(var(--veta-text-muted))] hover:bg-white/50'}`}>
                              {variant.name}
                              {variant.total > 0 && <span className="ml-1 opacity-70">{formatCop(variant.total)}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="border-l-2 border-[hsl(var(--veta-gold-muted))] pl-5">
              <p className="veta-quote-section-label">Total de carpinteria</p>
              <p className="veta-heading mt-2 text-[clamp(2rem,1.3rem+2.2vw,3.4rem)] tracking-[-0.04em]">{formatCop(getProposalTotal())}</p>
              <p className="mt-4 text-sm leading-6 text-[hsl(var(--veta-text-muted))]">La propuesta se revisa por ambiente para que alcance, referencias y presupuesto se entiendan sin depender de una tabla extensa.</p>
            </div>
          </div>
        </div>
      </section>

      {hasCarpentryTotal && <a href="#resumen" className="fixed inset-x-3 bottom-3 z-30 flex min-h-14 items-center justify-between rounded-2xl border border-[hsl(var(--veta-gold-muted))] bg-[hsl(var(--veta-gold-hover))] px-4 text-white shadow-[0_18px_34px_-18px_rgba(55,42,20,.65)] sm:hidden"><span><span className="block text-[10px] uppercase tracking-[.14em] text-white/70">Carpinteria</span><strong className="text-sm">{formatCop(getProposalTotal())}</strong></span><span className="text-sm font-medium">Ver resumen</span></a>}

      <Dialog open={Boolean(focusedImage)} onOpenChange={open => !open && setFocusedImage(null)}>
        <DialogContent className="max-h-screen w-screen border-0 bg-black p-0 rounded-none overflow-hidden [&>button]:hidden flex flex-row">
          <DialogTitle className="sr-only">Galería de imágenes - Modo presentación</DialogTitle>
          {focusedImage && (() => {
            const space = proposal.spaces.find(s => s.id === focusedImage.spaceId)
            const gallery = space?.variants[selectedVariantIndex[focusedImage.spaceId] ?? 0]?.images ?? []
            const currentIndex = focusedImage.imageIndex ?? 0

            const goToImage = (index: number) => {
              const normalized = Math.max(0, Math.min(index, gallery.length - 1))
              setFocusedImage({ ...gallery[normalized], spaceId: focusedImage.spaceId, imageIndex: normalized })
            }

            const handleKeyDown = (e: React.KeyboardEvent) => {
              if (e.key === 'ArrowLeft') goToImage(currentIndex - 1)
              if (e.key === 'ArrowRight') goToImage(currentIndex + 1)
            }

            return (
              <div className="flex w-screen h-screen flex-row bg-black" onKeyDown={handleKeyDown} tabIndex={0}>
                {/* Main image - ~90% */}
                <div className="relative flex-1 flex items-center justify-center bg-black overflow-hidden">
                  <img src={focusedImage.url} alt={focusedImage.description || 'Imagen de diseño'} className="max-h-full max-w-full object-contain" />
                  <button type="button" onClick={() => setFocusedImage(null)} className="absolute top-4 left-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition z-10 backdrop-blur-sm">
                    <X size={24} className="text-white" />
                  </button>

                  {/* Navigation arrows overlay */}
                  <button type="button" onClick={() => goToImage(currentIndex - 1)} disabled={currentIndex === 0} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition backdrop-blur-sm">
                    <ChevronLeft size={28} className="text-white" />
                  </button>
                  <button type="button" onClick={() => goToImage(currentIndex + 1)} disabled={currentIndex === gallery.length - 1} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/40 disabled:opacity-20 disabled:cursor-not-allowed transition backdrop-blur-sm">
                    <ChevronRight size={28} className="text-white" />
                  </button>

                  {/* Counter overlay */}
                  <div className="absolute bottom-4 left-4 text-white text-sm backdrop-blur-sm bg-black/40 px-3 py-1.5 rounded-full">
                    <span className="font-medium">{currentIndex + 1}</span> / <span className="font-medium">{gallery.length}</span>
                  </div>
                </div>

                {/* Vertical carousel - ~10% */}
                {gallery.length > 1 && (
                  <div className="w-20 bg-black/90 border-l border-white/10 flex flex-col gap-1 p-2 overflow-y-auto">
                    {gallery.map((image, index) => (
                      <button key={`${image.url}-${index}`} type="button" onClick={() => goToImage(index)} className={`shrink-0 aspect-square overflow-hidden rounded-lg border-2 transition hover:opacity-100 ${currentIndex === index ? 'border-[hsl(var(--veta-gold-muted))] shadow-lg' : 'border-white/20 opacity-50'}`}>
                        <img src={image.url} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </main>
  )
}
