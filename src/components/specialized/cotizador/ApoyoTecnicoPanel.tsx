'use client'

import { useState, useEffect, useCallback } from 'react'
import type { DataItem } from '@agnostic/core'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  ChevronDown, ChevronUp, Plus, Trash2,
  Calendar, Camera, FileText, Paperclip,
  X, Save, Loader2, ClipboardList,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

const TIPOS = [
  'Visita Técnica',
  'Foto de Retoma',
  'Diagrama / Croquis',
  'Lista de Requisitos',
  'Otro',
] as const

type TipoRecurso = typeof TIPOS[number]

const TIPO_CONFIG: Record<TipoRecurso, { Icon: React.ElementType; badge: string }> = {
  'Visita Técnica':      { Icon: Calendar,     badge: 'bg-blue-50   text-blue-700   border-blue-200'   },
  'Foto de Retoma':      { Icon: Camera,       badge: 'bg-green-50  text-green-700  border-green-200'  },
  'Diagrama / Croquis':  { Icon: FileText,     badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  'Lista de Requisitos': { Icon: ClipboardList, badge: 'bg-amber-50  text-amber-700  border-amber-200'  },
  'Otro':                { Icon: Paperclip,    badge: 'bg-stone-100 text-stone-600  border-stone-200'  },
}

interface ApoyoItem extends DataItem {
  data: {
    cotizacion_id:     string
    tipo_recurso:      string
    fecha_visita?:     string
    notas?:            string
    imagen_url?:       string
    lista_requisitos?: string
  }
}

const EMPTY_FORM = {
  tipo_recurso:      'Visita Técnica' as TipoRecurso,
  fecha_visita:      '',
  notas:             '',
  imagen_url:        '',
  lista_requisitos:  '',
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ApoyoTecnicoPanel({ cotizacionId }: { cotizacionId: string }) {
  const [registros,   setRegistros]   = useState<ApoyoItem[]>([])
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [expanded,    setExpanded]    = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [activeId,    setActiveId]    = useState<string | null>(null)
  const [form,        setForm]        = useState(EMPTY_FORM)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!cotizacionId) return
    setLoading(true)
    try {
      const res  = await fetch('/api/vault?namespace=apoyo_tecnico')
      const json = await res.json()
      const all  = (json.records ?? []) as ApoyoItem[]
      setRegistros(all.filter(r => r.data.cotizacion_id === cotizacionId))
    } finally {
      setLoading(false)
    }
  }, [cotizacionId])

  useEffect(() => { load() }, [load])

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res  = await fetch('/api/vault', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          action:    'WRITE',
          namespace: 'apoyo_tecnico',
          record:    { data: { cotizacion_id: cotizacionId, ...form } },
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRegistros(prev => [...prev, json.record as ApoyoItem])
      setForm(EMPTY_FORM)
      setShowForm(false)
      toast.success('Registro guardado')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res  = await fetch('/api/vault', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ action: 'REMOVE', namespace: 'apoyo_tecnico', id }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      setRegistros(prev => prev.filter(r => r.id !== id))
      if (activeId === id) setActiveId(null)
      toast.success('Registro eliminado')
    } catch (err: any) {
      toast.error('Error: ' + err.message)
    }
  }

  const count = registros.length

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-sm">

      {/* ── Panel header ────────────────────────────────────────────── */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setExpanded(o => !o)}
        className="flex items-center gap-3 px-4 py-3 bg-stone-50 cursor-pointer select-none hover:bg-stone-100/70 transition-colors"
        aria-expanded={expanded}
      >
        <Paperclip size={14} className="text-stone-400 shrink-0" />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-stone-700 leading-snug">
            Apoyo Técnico — Retoma y Requisitos
          </p>
          <p className="text-[10px] text-stone-400 font-medium mt-0.5 hidden sm:block">
            Fotografías de obra, diagramas, visitas técnicas y listas de requisitos del cliente
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Counter badge */}
          {count > 0 && (
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200 tabular-nums">
              {count}
            </span>
          )}

          {/* Add button — only when panel is open */}
          {expanded && (
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setShowForm(o => !o); setActiveId(null) }}
              className={cn(
                'flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl border transition-colors',
                showForm
                  ? 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                  : 'bg-white text-stone-500 border-stone-200 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50/50'
              )}
            >
              {showForm
                ? <><X size={10} /> <span className="hidden sm:inline">Cancelar</span></>
                : <><Plus size={10} /> <span className="hidden sm:inline">Agregar</span></>
              }
            </button>
          )}

          {expanded
            ? <ChevronUp   size={14} className="text-stone-400" />
            : <ChevronDown size={14} className="text-stone-400" />
          }
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────── */}
      {expanded && (
        <div className="divide-y divide-stone-100">

          {/* ── Formulario de creación ─────────────────────────────── */}
          {showForm && (
            <form
              onSubmit={handleSave}
              className="p-4 sm:p-5 bg-amber-50/40 border-b border-amber-100 space-y-4"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 flex items-center gap-1.5">
                <Plus size={10} /> Nuevo registro de apoyo técnico
              </p>

              {/* Tipo + Fecha — 2 cols en sm+ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    Tipo de recurso *
                  </label>
                  <select
                    required
                    value={form.tipo_recurso}
                    onChange={e => setForm(p => ({ ...p, tipo_recurso: e.target.value as TipoRecurso }))}
                    className="text-xs border border-stone-200 rounded-xl px-3 h-9 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  >
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    Fecha de visita
                  </label>
                  <input
                    type="date"
                    value={form.fecha_visita}
                    onChange={e => setForm(p => ({ ...p, fecha_visita: e.target.value }))}
                    className="text-xs border border-stone-200 rounded-xl px-3 h-9 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                  />
                </div>
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                  Notas de visita / descripción
                </label>
                <textarea
                  value={form.notas}
                  onChange={e => setForm(p => ({ ...p, notas: e.target.value }))}
                  placeholder="Condiciones del espacio, acuerdos con el cliente, medidas tomadas…"
                  rows={3}
                  className="text-xs border border-stone-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 resize-none leading-relaxed"
                />
              </div>

              {/* URL imagen */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                  URL de imagen / croquis / diagrama
                </label>
                <input
                  type="url"
                  value={form.imagen_url}
                  onChange={e => setForm(p => ({ ...p, imagen_url: e.target.value }))}
                  placeholder="https://drive.google.com/… o cualquier URL pública"
                  className="text-xs border border-stone-200 rounded-xl px-3 h-9 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700"
                />
              </div>

              {/* Requisitos */}
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
                  Lista de requisitos del cliente
                </label>
                <textarea
                  value={form.lista_requisitos}
                  onChange={e => setForm(p => ({ ...p, lista_requisitos: e.target.value }))}
                  placeholder={"- Entrega antes del 15 de agosto\n- Incluir mesón en piedra sinterizada\n- Cajones con cierre suave Blum"}
                  rows={4}
                  className="text-xs border border-stone-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-amber-300 text-stone-700 resize-none leading-relaxed font-mono"
                />
              </div>

              {/* Botones */}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_FORM) }}
                  className="text-xs text-stone-400 hover:text-stone-600 px-3 py-2 rounded-xl hover:bg-stone-100 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl transition-colors shadow-sm"
                >
                  {saving
                    ? <Loader2 size={11} className="animate-spin" />
                    : <Save size={11} />
                  }
                  Guardar registro
                </button>
              </div>
            </form>
          )}

          {/* ── Lista de registros ────────────────────────────────── */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-stone-300">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-xs">Cargando…</span>
            </div>

          ) : registros.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-xs text-stone-300 italic">
                Sin registros de visitas o apoyo técnico para este proyecto.
              </p>
              {!showForm && (
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 border border-dashed border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Plus size={11} /> Añadir primer registro
                </button>
              )}
            </div>

          ) : (
            <div className="divide-y divide-stone-100">
              {registros.map(r => {
                const isOpen = activeId === r.id
                const tipoKey = (r.data.tipo_recurso || 'Otro') as TipoRecurso
                const conf    = TIPO_CONFIG[tipoKey] ?? TIPO_CONFIG['Otro']
                const { Icon } = conf

                return (
                  <div key={r.id} className="group">

                    {/* ── Row ─────────────────────────────────────── */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setActiveId(isOpen ? null : r.id)}
                      onKeyDown={e => e.key === 'Enter' && setActiveId(isOpen ? null : r.id)}
                      className="flex items-center gap-2.5 px-4 py-3 hover:bg-stone-50/70 transition-colors cursor-pointer"
                    >
                      {/* Tipo badge */}
                      <span className={cn(
                        'inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0',
                        conf.badge
                      )}>
                        <Icon size={9} />
                        <span className="hidden xs:inline sm:inline">{r.data.tipo_recurso}</span>
                      </span>

                      {/* Fecha */}
                      {r.data.fecha_visita && (
                        <span className="flex items-center gap-1 text-[10px] text-stone-400 font-medium shrink-0">
                          <Calendar size={9} />
                          {r.data.fecha_visita}
                        </span>
                      )}

                      {/* Notas preview */}
                      {r.data.notas && !isOpen && (
                        <p className="flex-1 text-xs text-stone-400 truncate hidden sm:block">
                          {r.data.notas}
                        </p>
                      )}

                      {/* Acciones */}
                      <div className="flex items-center gap-1 ml-auto shrink-0">
                        {r.data.imagen_url && !isOpen && (
                          <span className="text-[9px] text-stone-300 font-mono hidden md:block">IMG</span>
                        )}
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); handleDelete(r.id) }}
                          title="Eliminar"
                          className="p-1.5 rounded-lg text-stone-200 hover:text-red-400 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 size={12} />
                        </button>
                        {isOpen
                          ? <ChevronUp   size={12} className="text-stone-300" />
                          : <ChevronDown size={12} className="text-stone-300" />
                        }
                      </div>
                    </div>

                    {/* ── Detail expandido ─────────────────────────── */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 bg-stone-50/50">

                        {r.data.notas && (
                          <div className="bg-white border border-stone-100 rounded-xl p-3 shadow-sm">
                            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">
                              Notas
                            </p>
                            <p className="text-xs text-stone-600 leading-relaxed whitespace-pre-line">
                              {r.data.notas}
                            </p>
                          </div>
                        )}

                        {r.data.lista_requisitos && (
                          <div className="bg-white border border-stone-100 rounded-xl p-3 shadow-sm">
                            <p className="text-[9px] uppercase tracking-widest text-stone-400 font-bold mb-1.5">
                              Requisitos del cliente
                            </p>
                            <pre className="text-[11px] font-mono text-stone-600 leading-relaxed whitespace-pre-wrap">
                              {r.data.lista_requisitos}
                            </pre>
                          </div>
                        )}

                        {r.data.imagen_url && (
                          <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm">
                            <img
                              src={r.data.imagen_url}
                              alt={r.data.tipo_recurso}
                              className="w-full max-h-72 object-contain bg-stone-50"
                              loading="lazy"
                              onError={e => {
                                const el = e.currentTarget.parentElement
                                if (el) el.style.display = 'none'
                              }}
                            />
                          </div>
                        )}

                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
