'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Loader2, X, FileText, Mail, Info } from 'lucide-react'
import { toast } from 'sonner'
import { COP } from './utils'
import { processEvents } from '@/lib/agnostic/eventProcessor'
import { useMateriaStore } from '@/lib/agnostic/store'
import { toContractZapRecord } from './contrato-payload'

interface ContratoModalProps {
  isOpen: boolean
  onClose: () => void
  cotizacion: any
  cliente: any
  espacios: any[]
  activeVarMap: Record<string, string>
  items: any[]
  catalogo: any[]
  calculatedTotal: number
  onSaveSuccess: (contratoId: string, emailData: { email: string; subject: string; body: string }) => void
}

function compileSpecifications(
  espacios: any[],
  activeVarMap: Record<string, string>,
  items: any[],
  catalogo: any[]
) {
  const activeVarIds = new Set<string>()
  for (const { nombre, vars } of espacios) {
    const activeId = activeVarMap[nombre] || vars[0]?.id
    const av = vars.find((v: any) => v.id === activeId) || vars[0]
    if (av && av.data?.visible_pdf !== false) {
      activeVarIds.add(av.id)
    }
  }

  const activeItems = items.filter((it: any) => {
    const varId = it.data?.variante_id || it.variante_id
    return activeVarIds.has(varId)
  })

  const resolved = activeItems.map((it: any) => {
    const catId = it.data?.catalogo_id || it.catalogo_id
    const catItem = catalogo.find((c: any) => c.id === catId)
    return {
      descripcion: catItem?.data?.descripcion || catItem?.descripcion || '',
      tipo: catItem?.data?.tipo || catItem?.tipo || ''
    }
  }).filter(x => x.descripcion)

  const getUniqueForType = (tipo: string) => {
    const descripciones = resolved
      .filter(x => x.tipo === tipo)
      .map(x => x.descripcion.trim())
    return Array.from(new Set(descripciones))
  }

  const tableros = getUniqueForType('Tableros / Maderas')
  const herrajes = getUniqueForType('Herrajes / Accesorios')
  const mesones = getUniqueForType('Piedras / Mesones')
  const servicios = getUniqueForType('Servicio')

  return {
    estructura: tableros.length > 0 ? `Estructura modular y frentes fabricados en: ${tableros.join(', ')}.` : '',
    herrajes: herrajes.length > 0 ? `Sistema de herrajes incluyendo: ${herrajes.join(', ')}.` : '',
    mesones: mesones.length > 0 ? `Suministro e instalación de mesón en: ${mesones.join(', ')}.` : '',
    desmonte: servicios.length > 0 ? `Condiciones de desmonte y obra civil: ${servicios.join(', ')}.` : ''
  }
}

export function ContratoModal({
  isOpen,
  onClose,
  cotizacion,
  cliente,
  espacios,
  activeVarMap,
  items,
  catalogo,
  calculatedTotal,
  onSaveSuccess
}: ContratoModalProps) {
  // ── States for Cliente ───────────────────────────────────────────
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteDoc, setClienteDoc] = useState('')
  const [clienteDom, setClienteDom] = useState('')
  const [clienteEmail, setClienteEmail] = useState('')
  const [clienteTel, setClienteTel] = useState('')

  // ── States for Contrato ──────────────────────────────────────────
  const [plazoSemanas, setPlazoSemanas] = useState('4 a 5')
  const [holguraDias, setHolguraDias] = useState(8)
  const [garantiaAnios, setGarantiaAnios] = useState(2)
  const [objetoItems, setObjetoItems] = useState('')
  const [especEstructura, setEspecEstructura] = useState('')
  const [especHerrajes, setEspecHerrajes] = useState('')
  const [especMesones, setEspecMesones] = useState('')
  const [condDesmonte, setCondDesmonte] = useState('')
  const [valorTotal, setValorTotal] = useState(0)

  const [isSaving, setIsSaving] = useState(false)

  const [totalFocused, setTotalFocused] = useState(false)
  const [totalVal, setTotalVal] = useState('')

  useEffect(() => {
    if (!totalFocused) {
      setTotalVal(valorTotal !== undefined && valorTotal !== 0 ? COP(valorTotal) : '')
    }
  }, [valorTotal, totalFocused])

  const handleTotalBlur = () => {
    setTotalFocused(false)
    const v = parseFloat(totalVal.replace(/[^0-9.-]/g, '')) || 0
    setValorTotal(v)
  }

  const handleTotalFocus = () => {
    setTotalFocused(true)
    setTotalVal(valorTotal !== undefined && valorTotal !== 0 ? String(valorTotal) : '')
  }

  // Pre-cargar valores al abrir el modal
  useEffect(() => {
    if (!isOpen) return

    // Pre-cargar datos del cliente
    if (cliente) {
      setClienteNombre(cliente.nombre || '')
      setClienteDoc(cliente.documento || '')
      setClienteDom(cliente.domicilio || cotizacion?.direccion_obra || cotizacion?.data?.direccion_obra || '')
      setClienteEmail(cliente.email || '')
      setClienteTel(cliente.telefono || '')
    } else {
      setClienteNombre('')
      setClienteDoc('')
      setClienteDom('')
      setClienteEmail('')
      setClienteTel('')
    }

    // Pre-cargar total calculado
    setValorTotal(calculatedTotal)
    setGarantiaAnios(Number(cotizacion?.data?.garantia_anios || cotizacion?.garantia_anios || 2))

    // Compilar Objeto de Contrato solo con espacios visibles y sin nombre de variante
    const defaultItemsText = espacios
      .map(({ nombre, vars }) => {
        const activeId = activeVarMap[nombre] || vars[0]?.id
        const av = vars.find((v: any) => v.id === activeId) || vars[0]
        if (av?.data?.visible_pdf === false) return ''
        return av?.data?.nombre_espacio || av?.nombre_espacio || nombre
      })
      .filter(Boolean)
      .map((spaceName, idx) => `${idx + 1}. ${spaceName}`)
      .join('\n')

    const loadOrCreateContrato = async () => {
      try {
        const res = await fetch('/api/vault?namespace=contratos')
        const json = await res.json()
        const allContratos = json.records || []
        const existing = allContratos.find((c: any) => (c.data?.proyecto_id || c.proyecto_id) === cotizacion.id)

        if (existing) {
          const d = existing.data || {}
          setPlazoSemanas(d.plazo_ejecucion_texto || '4 a 5')
          setHolguraDias(d.holgura_dias ?? 8)
          setGarantiaAnios(d.garantia_anios ?? 2)
          setEspecEstructura(d.especificaciones_estructura || '')
          setEspecHerrajes(d.especificaciones_herrajes || '')
          setEspecMesones(d.especificaciones_mesones || '')
          setCondDesmonte(d.condiciones_desmonte || '')
          setValorTotal(Number(d.valor_total) || calculatedTotal)
          setObjetoItems(d.objeto_items || defaultItemsText)
        } else {
          // Compilar especificaciones dinámicamente si no existe contrato previo
          const specs = compileSpecifications(espacios, activeVarMap, items, catalogo)
          setEspecEstructura(specs.estructura)
          setEspecHerrajes(specs.herrajes)
          setEspecMesones(specs.mesones)
          setCondDesmonte(specs.desmonte)
          setPlazoSemanas('4 a 5')
          setHolguraDias(8)
          setObjetoItems(defaultItemsText)
        }
      } catch (e) {
        console.error('Error al inicializar contrato:', e)
      }
    }

    loadOrCreateContrato()
  }, [isOpen])

  // ── Derived: abonos calculations ────────────────────────────────
  const abono1 = Math.round(valorTotal * 0.50)
  const abono2 = Math.round(valorTotal * 0.25)
  const abono3 = valorTotal - abono1 - abono2

  const performSave = async (isBorradorOnly: boolean) => {
    if (!clienteNombre.trim()) {
      toast.error('El nombre del contratante es requerido.')
      return
    }
    if (valorTotal <= 0) {
      toast.error('El valor total del contrato debe ser mayor a cero.')
      return
    }

    const contractRecord = toContractZapRecord(cotizacion)
    if (!contractRecord?.id) {
      toast.error('No hay una cotización válida seleccionada.')
      return
    }

    setIsSaving(true)
    const actionMsg = isBorradorOnly 
      ? 'Guardando borrador de contrato...' 
      : 'Creando contrato legal y sincronizando datos de cliente...'
    const toastId = toast.loading(actionMsg)

    try {
      // Despacho axiomático al Zap canónico en el servidor
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: 'generar_contrato',
          payload: {
            record: contractRecord,
            cliente: {
              nombre: clienteNombre,
              documento: clienteDoc,
              domicilio: clienteDom,
              email: clienteEmail,
              telefono: clienteTel
            },
            contrato: {
              plazo_ejecucion_texto: plazoSemanas,
              holgura_dias: holguraDias,
              garantia_anios: garantiaAnios,
              objeto_items: objetoItems,
              especificaciones_estructura: especEstructura,
              especificaciones_herrajes: especHerrajes,
              especificaciones_mesones: especMesones,
              condiciones_desmonte: condDesmonte,
              valor_total: valorTotal
            }
          }
        })
      })

      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()

      toast.dismiss(toastId)
      const store = useMateriaStore.getState()
      let contratoIdGenerated = ''
      let emailSub = ''
      let emailBod = ''
      let engineError = ''

      for (const event of result.events || []) {
        if (event.action === 'materia_sync') {
          store.updateItem(event.context, event.item)
          if (event.context === 'contratos') {
            contratoIdGenerated = event.item.id
            emailSub = event.item.data?.email_asunto || ''
            emailBod = event.item.data?.email_cuerpo || ''
          }
        }
        if (event.action === 'notify') {
          if (event.type === 'success') toast.success(event.message)
          else {
            engineError = event.message
            toast.error(event.message)
          }
        }
      }

      if (engineError) throw new Error(engineError)
      if (!contratoIdGenerated) {
        throw new Error('El motor no devolvió el contrato generado.')
      }

      if (isBorradorOnly) {
        onClose()
      } else {
        if (contratoIdGenerated) {
          onSaveSuccess(contratoIdGenerated, {
            email: clienteEmail,
            subject: emailSub,
            body: emailBod
          })
        } else {
          onClose()
        }
      }

    } catch (err: any) {
      console.error(err)
      toast.error('Ocurrió un error al procesar el contrato: ' + err.message, { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await performSave(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-stone-50 w-full max-w-3xl rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-150 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-sm">
                Generar Contrato de Fabricación e Instalación
              </h3>
              <p className="text-[10px] text-stone-500 font-medium">
                Complete las variables legales y comerciales para compilar el documento legal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-stone-700">
          
          {/* Sección 1: Datos del Contratante */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
            <h4 className="font-bold text-stone-900 text-[10px] uppercase tracking-widest text-amber-700 border-b border-stone-100 pb-1.5">
              1. Datos del Contratante (Cliente)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={clienteNombre}
                  onChange={e => setClienteNombre(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 font-medium text-stone-800"
                  placeholder="Nombre completo del cliente..."
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Identificación (C.C. o NIT)</label>
                <input
                  type="text"
                  value={clienteDoc}
                  onChange={e => setClienteDoc(e.target.value.replace(/[\s.]/g, ''))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="Número de Cédula o NIT..."
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Domicilio de Instalación (Dirección de Obra)</label>
                <input
                  type="text"
                  value={clienteDom}
                  onChange={e => setClienteDom(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="Dirección exacta donde se instalarán los muebles..."
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Correo Electrónico</label>
                <input
                  type="email"
                  value={clienteEmail}
                  onChange={e => setClienteEmail(e.target.value.replace(/\s+/g, '').toLowerCase())}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-2 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={clienteTel}
                  onChange={e => setClienteTel(e.target.value.replace(/[\s-]/g, ''))}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="Eje: 3025922101"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Cláusulas y Plazos */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
            <h4 className="font-bold text-stone-900 text-[10px] uppercase tracking-widest text-amber-700 border-b border-stone-100 pb-1.5">
              2. Plazos, Holgura y Garantías
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 col-span-3 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Plazo de Ejecución (Semanas)</label>
                <input
                  type="text"
                  value={plazoSemanas}
                  onChange={e => setPlazoSemanas(e.target.value)}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="Eje: 4 a 5"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-3 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Holgura Operativa (Días hábiles)</label>
                <input
                  type="number"
                  value={holguraDias}
                  onChange={e => setHolguraDias(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="8"
                />
              </div>
              <div className="flex flex-col gap-1 col-span-3 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Garantía Estructura (Años)</label>
                <input
                  type="number"
                  value={garantiaAnios}
                  onChange={e => setGarantiaAnios(parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  placeholder="2"
                />
              </div>
            </div>
          </div>

          {/* Sección 3: Especificaciones de Carpintería */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
            <h4 className="font-bold text-stone-900 text-[10px] uppercase tracking-widest text-amber-700 border-b border-stone-100 pb-1.5">
              3. Especificaciones Técnicas y Alcance
            </h4>
            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Estructura Modular (Materiales)</label>
                <textarea
                  value={especEstructura}
                  onChange={e => setEspecEstructura(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Herrajes y Accesorios Internos</label>
                <textarea
                  value={especHerrajes}
                  onChange={e => setEspecHerrajes(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Mesones y Encimeras</label>
                <textarea
                  value={especMesones}
                  onChange={e => setEspecMesones(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Condiciones de Desmonte de Mobiliario Anterior</label>
                <textarea
                  value={condDesmonte}
                  onChange={e => setCondDesmonte(e.target.value)}
                  rows={2}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Sección 4: Objeto del Contrato (Muebles) */}
          <div className="space-y-3 bg-white p-4 rounded-xl border border-stone-200/60 shadow-sm">
            <h4 className="font-bold text-stone-900 text-[10px] uppercase tracking-widest text-amber-700 border-b border-stone-100 pb-1.5">
              4. Objeto del Contrato (Muebles a Fabricar)
            </h4>
            <div className="flex flex-col gap-1">
              <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Detalle de Ítems (Un ítem por línea)</label>
              <textarea
                value={objetoItems}
                onChange={e => setObjetoItems(e.target.value)}
                rows={4}
                required
                className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 font-mono text-[11px]"
                placeholder="1. Muebles de cocina superior e inferior..."
              />
            </div>
          </div>

          {/* Sección 5: Hitos de Pago */}
          <div className="space-y-4 bg-amber-50/40 border border-amber-200/60 p-4 rounded-xl shadow-sm">
            <h4 className="font-bold text-stone-900 text-[10px] uppercase tracking-widest text-amber-800 border-b border-amber-200/40 pb-1.5">
              5. Condiciones Económicas y Plan de Pagos
            </h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 col-span-3 md:col-span-1">
                <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Valor Total Pactado (COP) *</label>
                <input
                  type="text"
                  required
                  value={totalVal}
                  onFocus={handleTotalFocus}
                  onBlur={handleTotalBlur}
                  onChange={e => setTotalVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  className="w-full border border-stone-200 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-amber-300 font-semibold text-amber-700 bg-white"
                  placeholder="$ 0"
                />
              </div>

              <div className="col-span-3 md:col-span-2 bg-white rounded-lg border border-stone-200/60 p-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                <div>
                  <span className="block text-stone-400 font-bold uppercase tracking-widest text-[8px]">50% Anticipo</span>
                  <span className="block font-bold text-stone-700 mt-0.5">{COP(abono1)}</span>
                </div>
                <div className="border-l border-stone-100">
                  <span className="block text-stone-400 font-bold uppercase tracking-widest text-[8px]">25% Instalación</span>
                  <span className="block font-bold text-stone-700 mt-0.5">{COP(abono2)}</span>
                </div>
                <div className="border-l border-stone-100">
                  <span className="block text-stone-400 font-bold uppercase tracking-widest text-[8px]">25% Final</span>
                  <span className="block font-bold text-stone-700 mt-0.5">{COP(abono3)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 text-[10px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p className="margin-0 leading-relaxed font-medium">
                El valor total se inicializa con el total neto de la cotización actual, pero es editable si decide pactar un monto cerrado diferente. Los abonos del 50-25-25 se recalculan al instante.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-stone-150 flex items-center justify-end gap-3 bg-white -mx-6 -mb-6 p-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-stone-250 hover:bg-stone-50 text-stone-600 rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => performSave(true)}
              disabled={isSaving}
              className="px-4 py-2 border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar Borrador
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileText size={14} />
                  Generar Contrato y PDF
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
