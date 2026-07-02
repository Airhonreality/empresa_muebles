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
  ProyectosRecord, ClientesRecord, ContratosRecord,
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
  const [localProyectos, setLocalProyectos] = useState<KanbanRecord[]>(
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
    for (const cot of localProyectos) {
      map[cot.id] = (allContratos as ContratosRecord[]).find(
        c => c.data.proyecto_id === cot.id
      )
    }
    return map
  }, [localProyectos, allContratos])

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
      const cid = s.data.proyecto_id as string
      map[cid] = [...(map[cid] ?? []), s]
    }
    return map
  }, [allEspacios])

  const handleMove = async (record: KanbanRecord, newStage: string) => {
    const previous = localProyectos
    setLocalProyectos(prev =>
      prev.map(c => c.id === record.id ? { ...c, data: { ...c.data, estado: newStage } } : c)
    )
    try {
      const saved = await vaultWrite('proyectos', record.id, { ...record.data, estado: newStage })
      useMateriaStore.getState().updateItem('proyectos', saved)
      const stageLabel = STAGES.find(s => s.value === newStage)?.label ?? newStage
      toast.success(`Proyecto movido a "${stageLabel}"`)
    } catch {
      setLocalProyectos(previous)
      toast.error('Error al mover el proyecto.')
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-6 bg-stone-50/50">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full h-full bg-stone-50/20 p-6 rounded-xl border border-stone-200/40">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-850 tracking-tight">Centro Comercial CRM</h2>
        <p className="text-xs text-stone-400 mt-0.5">Seguimiento de leads, propuestas, firma de contratos y abonos del cliente.</p>
      </div>

      <KanbanCanvas
        records={localProyectos}
        stages={STAGES}
        stageKey="estado"
        defaultStage="activa"
        onMoveCard={handleMove}
        renderCard={(record, stage, onMove, nextStage) => {
          const cot     = record as unknown as ProyectosRecord
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
    </div>
  )
}

