import React, { useEffect, useState } from 'react'
import type { DataItem } from '@agnostic/core'
import { Briefcase, Copy, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COP } from './utils'
import { EspacioTabs } from './EspacioTabs'
import { ItemRow } from './ItemRow'
import { DayCounter } from './DayCounter'
import { CollapseStrip } from './CollapseStrip'
import type { EspacioVariantes, ItemsVariante } from '@/generated/agnostic-schemas'

export function EspacioCard({ nombre, variants, items, catalogo, tarifas,
  activeVarId, onSelectVarId,
  onRename, onAddVariante, onUpdateVariante, onDuplicateVariante, onDeleteVariante, onAddItem, onUpdateItem, onDeleteItem, onDelete, onDuplicate,
}: {
  nombre: string; variants: DataItem[]; items: DataItem[]
  catalogo: DataItem[]; tarifas: { dev: number; assembly: number; install: number }
  activeVarId: string; onSelectVarId: (id: string) => void
  onRename: (n: string) => void
  onAddVariante: () => void
  onUpdateVariante: (id: string, p: Partial<EspacioVariantes>) => void
  onDuplicateVariante: (id: string) => void
  onDeleteVariante: (id: string) => void
  onAddItem: (varId: string) => void
  onUpdateItem: (id: string, p: Partial<ItemsVariante>) => void
  onDeleteItem: (id: string) => void
  onDelete: () => void
  onDuplicate: () => void
}) {
  const [moOpen, setMoOpen] = useState(false)
  const [totOpen, setTotOpen] = useState(false)
  const [editName, setEditName] = useState(false)
  const [nameLocal, setNameLocal] = useState(nombre)

  useEffect(() => {
    setNameLocal(nombre)
  }, [nombre])

  const activeVar = variants.find(v => v.id === activeVarId) || variants[0]
  const vd = (activeVar?.data ?? {}) as any as EspacioVariantes
  const activeVarIdResolved = activeVar?.id || activeVarId
  const activeItems = items.filter(it => (it.data as any as ItemsVariante).variante_id === activeVarIdResolved)

  const totalMat = activeItems.reduce((s, it) => s + (Number((it.data as any as ItemsVariante).total_linea) || 0), 0)
  
  const totalMO = (Number(vd.jornadas_desarrollo_tecnico) || 0) * tarifas.dev
                + (Number(vd.jornadas_ensamblaje_taller) || 0) * tarifas.assembly
                + (Number(vd.jornadas_instalacion_obra) || 0) * tarifas.install

  const jorns = (Number(vd.jornadas_desarrollo_tecnico) || 0)
    + (Number(vd.jornadas_ensamblaje_taller) || 0)
    + (Number(vd.jornadas_instalacion_obra) || 0)

  const totalEsp = totalMat + totalMO

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-0">
        {editName ? (
          <input autoFocus value={nameLocal}
            onChange={e => setNameLocal(e.target.value)}
            onBlur={() => { onRename(nameLocal); setEditName(false) }}
            onKeyDown={e => { if (e.key === 'Enter') { onRename(nameLocal); setEditName(false) } }}
            className="flex-1 text-base font-semibold text-stone-800 bg-transparent border-b-2 border-amber-400 focus:outline-none pb-0.5"
          />
        ) : (
          <h3 onClick={() => setEditName(true)}
            className="flex-1 text-base font-semibold text-stone-800 cursor-text hover:text-amber-700 transition-colors select-none">
            {nombre}
          </h3>
        )}
        <span className="text-[10px] tabular-nums text-stone-300 font-medium">{COP(totalEsp)}</span>
        <button onClick={onDuplicate} title="Duplicar espacio"
          className="text-stone-200 hover:text-amber-600 transition-colors p-1">
          <Copy size={13} />
        </button>
        <button onClick={onDelete} title="Eliminar espacio"
          className="text-stone-200 hover:text-red-400 transition-colors p-1">
          <Trash2 size={13} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pt-2">
        <EspacioTabs
          variants={variants}
          activeId={activeVarIdResolved}
          onSelect={onSelectVarId}
          onAdd={onAddVariante}
          onDuplicate={() => onDuplicateVariante(activeVarIdResolved)}
          onDelete={onDeleteVariante}
        />
      </div>

      {/* Item sheet */}
      <div className="px-2 py-3">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100">
              <th className="text-left pb-2 pl-3 text-[9px] font-bold uppercase tracking-widest text-stone-300">Descripción</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-16">Und</th>
              <th className="pb-2 text-center text-[9px] font-bold uppercase tracking-widest text-stone-300 w-14">Cant</th>
              <th className="pb-2 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">P. Unit</th>
              <th className="pb-2 pr-3 text-right text-[9px] font-bold uppercase tracking-widest text-stone-300 w-28">Total</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {activeItems.map(it => (
              <ItemRow key={it.id} item={it} catalogo={catalogo}
                onUpdate={p => onUpdateItem(it.id, p)}
                onDelete={() => onDeleteItem(it.id)}
              />
            ))}
          </tbody>
        </table>
        <button onClick={() => onAddItem(activeVarId)}
          className="mt-1 ml-3 flex items-center gap-1.5 text-xs text-stone-300 hover:text-amber-600 transition-colors py-1">
          <Plus size={11} /><span>Agregar ítem</span>
        </button>
      </div>

      {/* Mano de obra */}
      <CollapseStrip open={moOpen} onToggle={() => setMoOpen(o => !o)}
        label="Mano de obra" icon={Briefcase}
        summary={jorns > 0 && (
          <span className="ml-2 text-amber-600 font-medium tabular-nums">
            {jorns}j · {COP(totalMO)}
          </span>
        )}
      >
        <div className="px-5 pb-5 flex items-start gap-5 flex-wrap">
          <DayCounter label="Desarrollo" value={Number(vd.jornadas_desarrollo_tecnico) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_desarrollo_tecnico: n })} />
          <DayCounter label="Ensamblaje" value={Number(vd.jornadas_ensamblaje_taller) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_ensamblaje_taller: n })} />
          <DayCounter label="Instalación" value={Number(vd.jornadas_instalacion_obra) || 0}
            onChange={n => onUpdateVariante(activeVarId, { jornadas_instalacion_obra: n })} />
          <div className="ml-auto text-right flex flex-col justify-end gap-0.5">
            <span className="text-[9px] uppercase tracking-widest text-stone-300">Tarifa/jornada (des/ens/ins)</span>
            <span className="text-xs font-semibold text-stone-500 tabular-nums">{COP(tarifas.dev)} / {COP(tarifas.assembly)} / {COP(tarifas.install)}</span>
            <span className="text-sm font-bold text-amber-700 tabular-nums">{COP(totalMO)}</span>
          </div>
        </div>
      </CollapseStrip>

      {/* Totals */}
      <CollapseStrip open={totOpen} onToggle={() => setTotOpen(o => !o)}
        label="Subtotal" icon={({ size }: { size: number }) => (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
        )}
        summary={<span className="ml-2 text-stone-600 font-semibold tabular-nums">{COP(totalEsp)}</span>}
      >
        <div className="px-5 pb-5 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'Materiales', val: totalMat },
            { label: 'Mano de obra', val: totalMO },
            { label: 'Total espacio', val: totalEsp, highlight: true },
          ].map(({ label, val, highlight }) => (
            <div key={label}>
              <div className={cn('text-[9px] uppercase tracking-widest mb-1', highlight ? 'text-amber-500' : 'text-stone-400')}>{label}</div>
              <div className={cn('font-bold tabular-nums', highlight ? 'text-lg text-amber-700' : 'text-sm text-stone-700')}>{COP(val)}</div>
            </div>
          ))}
        </div>
      </CollapseStrip>
    </div>
  )
}
