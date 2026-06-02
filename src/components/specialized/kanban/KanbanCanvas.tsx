'use client'
import type React from 'react'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

// ─── Stage color tokens — full Tailwind class strings (no dynamic fragments) ──

export const STAGE_COLORS: Record<string, {
  column: string
  header: string
  dot: string
  badge: string
}> = {
  amber:  { column: 'border-amber-200',  header: 'bg-amber-50',   dot: 'bg-amber-400',  badge: 'border-amber-300 text-amber-700 bg-amber-50'   },
  blue:   { column: 'border-blue-200',   header: 'bg-blue-50',    dot: 'bg-blue-400',   badge: 'border-blue-300 text-blue-700 bg-blue-50'      },
  violet: { column: 'border-violet-200', header: 'bg-violet-50',  dot: 'bg-violet-400', badge: 'border-violet-300 text-violet-700 bg-violet-50' },
  orange: { column: 'border-orange-200', header: 'bg-orange-50',  dot: 'bg-orange-400', badge: 'border-orange-300 text-orange-700 bg-orange-50' },
  green:  { column: 'border-green-200',  header: 'bg-green-50',   dot: 'bg-green-400',  badge: 'border-green-300 text-green-700 bg-green-50'   },
  slate:  { column: 'border-slate-200',  header: 'bg-slate-50',   dot: 'bg-slate-400',  badge: 'border-slate-300 text-slate-600 bg-slate-50'   },
  rose:   { column: 'border-rose-200',   header: 'bg-rose-50',    dot: 'bg-rose-400',   badge: 'border-rose-300 text-rose-700 bg-rose-50'      },
  muted:  { column: 'border-border',     header: 'bg-muted/30',   dot: 'bg-muted-foreground', badge: 'border-border text-muted-foreground bg-muted/30' },
}

// ─── Public types ─────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function KanbanCanvas({
  records,
  stages,
  stageKey,
  defaultStage,
  onMoveCard,
  renderCard,
}: KanbanCanvasProps) {
  const fallback = defaultStage ?? stages[0]?.value

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
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-3 pb-4" style={{ minWidth: `${stages.length * 284}px` }}>
        {stages.map((stage, idx) => {
          const nextStage    = stages[idx + 1] ?? null
          const stageRecords = grouped[stage.value] ?? []
          const colors       = STAGE_COLORS[stage.color] ?? STAGE_COLORS.slate

          return (
            <div
              key={stage.value}
              className={`flex flex-col w-[272px] shrink-0 rounded-xl border ${colors.column}`}
            >
              {/* Column header */}
              <div className={`flex items-center justify-between px-3 py-2.5 rounded-t-xl ${colors.header} border-b ${colors.column}`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
                  <span className="text-xs font-semibold tracking-wide uppercase whitespace-normal">
                    {stage.label}
                  </span>
                </div>
                <Badge variant="outline" className={`text-xs px-1.5 ${colors.badge}`}>
                  {stageRecords.length}
                </Badge>
              </div>

              {/* Card list */}
              <div className="flex flex-col gap-2 p-2 flex-1 min-h-[120px]">
                {stageRecords.map(record => (
                  <div key={record.id}>
                    {renderCard(
                      record,
                      stage,
                      (newStage) => onMoveCard(record, newStage),
                      nextStage,
                    )}
                  </div>
                ))}
                {stageRecords.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center pt-6 pb-4 select-none">
                    Sin proyectos
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
