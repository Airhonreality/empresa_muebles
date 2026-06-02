'use client'
import type { BlockProps } from '@agnostic/core'
import { useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useRelationData } from '@/lib/agnostic/hooks/useRelationData'
import { useMateriaStore } from '@/lib/agnostic/store'
import { Skeleton } from '@/components/ui/skeleton'
import KanbanCanvas, { type KanbanStage, type KanbanRecord } from './KanbanCanvas'
import ComercialCard from './ComercialCard'
import type {
  CotizacionesRecord, ClientesRecord, ContratosRecord,
  AbonosContratoRecord, EspacioVariantesRecord,
} from '@/generated/agnostic-schemas'

const STAGES: KanbanStage[] = [
  { value: 'activa',         label: 'Lead',          color: 'amber'  },
  { value: 'enviada',        label: 'Propuesta',      color: 'blue'   },
  { value: 'en_contrato',    label: 'En contrato',    color: 'violet' },
  { value: 'pre_produccion', label: 'Pre-producción', color: 'orange' },
  { value: 'produccion',     label: 'Producción',     color: 'green'  },
]

async function vaultWrite(namespace: string, id: string, data: Record<string, unknown>) {
  const res = await fetch('/api/vault', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'WRITE', namespace, record: { id, data } }),
  })
  if (!res.ok) throw new Error(await res.text())
  const body = await res.json()
  return body.record ?? body
}

export default function ComercialKanban({ records }: BlockProps) {
  const [localCotizaciones, setLocalCotizaciones] = useState<KanbanRecord[]>(
    () => (records ?? []) as KanbanRecord[]
  )

  const { data: allClientes,  isLoading: loadingCli  } = useRelationData('clientes')
  const { data: allContratos, isLoading: loadingCon  } = useRelationData('contratos')
  const { data: allAbonos,    isLoading: loadingAbo  } = useRelationData('abonos_contrato')
  const { data: allEspacios,  isLoading: loadingEsp  } = useRelationData('espacio_variantes')

  const isLoading = loadingCli || loadingCon || loadingAbo || loadingEsp

  const clientMap = useMemo(() => {
    const map: Record<string, ClientesRecord> = {}
    for (const c of allClientes as ClientesRecord[]) map[c.id] = c
    return map
  }, [allClientes])

  const contratoMap = useMemo(() => {
    const map: Record<string, ContratosRecord | undefined> = {}
    for (const cot of localCotizaciones) {
      map[cot.id] = (allContratos as ContratosRecord[]).find(
        c => c.data.cotizacion_id === cot.id
      )
    }
    return map
  }, [localCotizaciones, allContratos])

  const abonosMap = useMemo(() => {
    const map: Record<string, AbonosContratoRecord[]> = {}
    for (const a of allAbonos as AbonosContratoRecord[]) {
      const cid = a.data.contrato_id as string
      map[cid] = [...(map[cid] ?? []), a]
    }
    return map
  }, [allAbonos])

  const espaciosByCot = useMemo(() => {
    const map: Record<string, EspacioVariantesRecord[]> = {}
    for (const s of allEspacios as EspacioVariantesRecord[]) {
      const cid = s.data.cotizacion_id as string
      map[cid] = [...(map[cid] ?? []), s]
    }
    return map
  }, [allEspacios])

  const handleMove = async (record: KanbanRecord, newStage: string) => {
    const previous = localCotizaciones
    setLocalCotizaciones(prev =>
      prev.map(c => c.id === record.id ? { ...c, data: { ...c.data, estado: newStage } } : c)
    )
    try {
      const saved = await vaultWrite('cotizaciones', record.id, { ...record.data, estado: newStage })
      useMateriaStore.getState().updateItem('cotizaciones', saved)
      const stageLabel = STAGES.find(s => s.value === newStage)?.label ?? newStage
      toast.success(`Proyecto movido a "${stageLabel}"`)
    } catch {
      setLocalCotizaciones(previous)
      toast.error('Error al mover el proyecto.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex gap-3">
        {STAGES.map(s => (
          <div key={s.value} className="w-[272px] shrink-0">
            <Skeleton className="h-10 w-full rounded-t-xl" />
            <div className="flex flex-col gap-2 p-2 mt-0.5">
              <Skeleton className="h-24 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <KanbanCanvas
      records={localCotizaciones}
      stages={STAGES}
      stageKey="estado"
      defaultStage="activa"
      onMoveCard={handleMove}
      renderCard={(record, stage, onMove, nextStage) => {
        const cot     = record as unknown as CotizacionesRecord
        const client  = clientMap[(cot.data.cliente_id ?? '') as string]
        const contrato = contratoMap[cot.id]
        const abonos  = contrato ? (abonosMap[contrato.id] ?? []) : []
        const espacios = espaciosByCot[cot.id] ?? []
        return (
          <ComercialCard
            record={record}
            stage={stage}
            onMove={onMove}
            nextStage={nextStage}
            allStages={STAGES}
            client={client}
            contrato={contrato}
            abonos={abonos}
            espacios={espacios}
          />
        )
      }}
    />
  )
}
