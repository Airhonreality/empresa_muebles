'use client'
import type React from 'react'
import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight } from 'lucide-react'

// ─── Stage color tokens — WCAG 2.1 Level AA compliant ────────────────────────
export const STAGE_COLORS: Record<string, {
  border: string
  bg: string
  text: string
  dot: string
  badge: string
}> = {
  slate:   { border: 'border-l-slate-400',   bg: 'bg-slate-50/50',   text: 'text-slate-700',   dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  blue:    { border: 'border-l-blue-500',    bg: 'bg-blue-50/30',    text: 'text-blue-700',    dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  orange:  { border: 'border-l-orange-500',  bg: 'bg-orange-50/30',  text: 'text-orange-700',  dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  green:   { border: 'border-l-emerald-500', bg: 'bg-emerald-50/30', text: 'text-emerald-700', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rose:    { border: 'border-l-rose-500',    bg: 'bg-rose-50/30',    text: 'text-rose-700',    dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  violet:  { border: 'border-l-violet-500',  bg: 'bg-violet-50/30',  text: 'text-violet-700',  dot: 'bg-violet-505',  badge: 'bg-violet-50 text-violet-700 border-violet-200' },
  amber:   { border: 'border-l-amber-500',   bg: 'bg-amber-50/30',   text: 'text-amber-700',   dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  muted:   { border: 'border-l-stone-300',   bg: 'bg-stone-50/50',   text: 'text-stone-600',   dot: 'bg-stone-400',   badge: 'bg-stone-100 text-stone-600 border-stone-200' },
}

export interface KanbanStage {
  value:   string
  label:   string
  color:   keyof typeof STAGE_COLORS
}

export type KanbanRecord = { id: string; context: string; data: Record<string, unknown> }

export interface KanbanCanvasProps {
  records:      KanbanRecord[]
  stages:       KanbanStage[]
  stageKey:     string
  defaultStage?: string
  onMoveCard:   (record: KanbanRecord, newStage: string) => Promise<void>
  renderCard: (
    record:    KanbanRecord,
    stage:     KanbanStage,
    onMove:    (newStage: string) => void,
    nextStage: KanbanStage | null
  ) => React.ReactNode
}

export default function KanbanCanvas({
  records,
  stages,
  stageKey,
  defaultStage,
  onMoveCard,
  renderCard,
}: KanbanCanvasProps) {
  const fallback = defaultStage ?? stages[0]?.value

  // Track expanded stages. Default expand 'pendiente' and 'en_proceso' / 'activa' and 'enviada'
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    stages.forEach((s, idx) => {
      // Expand first 2 stages by default
      initial[s.value] = idx < 2
    })
    return initial
  })

  const toggleStage = (val: string) => {
    setExpandedStages(prev => ({ ...prev, [val]: !prev[val] }))
  }

  const grouped = useMemo(() => {
    const map: Record<string, KanbanRecord[]> = {}
    for (const s of stages) map[s.value] = []
    for (const r of records) {
      const stage = (r.data[stageKey] as string | undefined) ?? fallback
      if (map[stage] !== undefined) map[stage].push(r)
      else map[fallback] = [...(map[fallback] ?? []), r]
    }
    return map
  }, [records, stages, stageKey, fallback])

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {stages.map((stage, idx) => {
        const nextStage    = stages[idx + 1] ?? null
        const stageRecords = grouped[stage.value] ?? []
        const colors       = STAGE_COLORS[stage.color] ?? STAGE_COLORS.muted
        const isExpanded   = !!expandedStages[stage.value]

        return (
          <div
            key={stage.value}
            className={`flex flex-col rounded-xl border border-stone-200/80 bg-white shadow-sm overflow-hidden transition-all duration-300`}
          >
            {/* Header Accordion Button (Large Target for Coarse Input) */}
            <button
              type="button"
              onClick={() => toggleStage(stage.value)}
              className={`flex items-center justify-between w-full px-5 py-4 bg-stone-50 hover:bg-stone-100/70 border-b border-stone-200/60 transition-colors text-left focus:outline-none`}
              style={{ minHeight: '52px' }}
            >
              <div className="flex items-center gap-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-stone-500 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-stone-500 transition-transform duration-200" />
                )}
                <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
                <span className="text-sm font-semibold tracking-wide uppercase text-stone-850">
                  {stage.label}
                </span>
              </div>
              <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-mono ${colors.badge}`}>
                {stageRecords.length}
              </Badge>
            </button>

            {/* Accordion Content */}
            {isExpanded && (
              <div className="p-4 flex flex-col gap-3 bg-stone-50/30 transition-all duration-300">
                {stageRecords.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {stageRecords.map(record => (
                      <div
                        key={record.id}
                        className={`border-l-4 ${colors.border} rounded-r-lg shadow-sm border-y border-r border-stone-200/60 bg-white transition-all duration-200 hover:shadow-md`}
                      >
                        {renderCard(
                          record,
                          stage,
                          (newStage) => onMoveCard(record, newStage),
                          nextStage
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 px-4 text-center">
                    <p className="text-xs font-medium text-stone-400 tracking-wide uppercase">
                      Sin proyectos en esta etapa
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

