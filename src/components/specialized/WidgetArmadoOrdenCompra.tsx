"use client"

import React, { useState, useEffect, useMemo } from "react"
import { toast } from "sonner"
import type { BlockProps } from "@agnostic/core"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  PlusCircle, 
  ShoppingCart, 
  Search, 
  PackageOpen, 
  Truck, 
  ShieldCheck, 
  Folder, 
  Store, 
  X, 
  ChevronRight,
  Plus
} from "lucide-react"
import RadarPedidosTaller from "./taller/RadarPedidosTaller"

interface CartItem {
  id?: string // items_variante id si proviene del diseño
  proyecto_id?: string
  proyecto_nombre?: string
  catalogo_id?: string
  nombre: string
  sku: string
  cantidad: number
  precio_unitario: number
  proveedor_id?: string
  origen: string
}

export default function CentralAbastecimientoGlobal({ context, schema }: BlockProps) {
  const [activeTab, setActiveTab] = useState("formular")
  const [abastTab, setAbastTab] = useState("proveedor") // "proveedor" o "proyecto"

  // Base de datos local cargada dinámicamente
  const [proyectos, setProyectos] = useState<any[]>([])
  const [ordenesTrabajo, setOrdenesTrabajo] = useState<any[]>([])
  const [espacios, setEspacios] = useState<any[]>([])
  const [itemsVariante, setItemsVariante] = useState<any[]>([])
  const [catalogo, setCatalogo] = useState<any[]>([])
  const [loadingDb, setLoadingDb] = useState(true)

  // Carrito de compras
  const [cart, setCart] = useState<CartItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Estados para búsqueda manual
  const [manualName, setManualName] = useState("")
  const [manualCant, setManualCant] = useState("1")
  const [manualPrecio, setManualPrecio] = useState("0")
  const [manualCatalogoId, setManualCatalogoId] = useState("")

  // Carga de base de datos maestra
  const loadDatabase = async () => {
    setLoadingDb(true)
    try {
      const [resP, resO, resE, resI, resC] = await Promise.all([
        fetch('/api/vault?namespace=proyectos').then(r => r.json()),
        fetch('/api/vault?namespace=ordenes_trabajo').then(r => r.json()),
        fetch('/api/vault?namespace=espacio_variantes').then(r => r.json()),
        fetch('/api/vault?namespace=items_variante').then(r => r.json()),
        fetch('/api/vault?namespace=productos_catalogo').then(r => r.json())
      ])
      
      setProyectos(resP.records || [])
      setOrdenesTrabajo(resO.records || [])
      setEspacios(resE.records || [])
      setItemsVariante(resI.records || [])
      setCatalogo(resC.records || [])
    } catch {
      toast.error("Error al cargar la base de datos de abastecimiento.")
    } finally {
      setLoadingDb(false)
    }
  }

  useEffect(() => {
    loadDatabase()
  }, [])

  // 1. Identificar proyectos activos en taller (órdenes de trabajo en pendiente, en_proceso o instalacion)
  const activeProjectsMap = useMemo(() => {
    const activeProjectIds = new Set<string>()
    for (const ot of ordenesTrabajo) {
      const estado = ot.data?.estado
      if (estado === 'pendiente' || estado === 'en_proceso' || estado === 'instalacion' || estado === 'taller') {
        const pid = ot.data?.proyecto_id
        if (pid) activeProjectIds.add(pid)
      }
    }
    
    const map = new Map<string, string>()
    // Inicializar fallback con los IDs de proyectos activos por si proyectos está vacío
    for (const pid of activeProjectIds) {
      map.set(pid, `Proyecto #${pid.slice(0, 5)}`)
    }
    
    // Si tenemos el listado real, sobreescribimos con el nombre del proyecto
    for (const p of proyectos) {
      if (activeProjectIds.has(p.id)) {
        map.set(p.id, p.data?.nombre_proyecto || `Proyecto #${p.id.slice(0, 5)}`)
      }
    }
    return map
  }, [ordenesTrabajo, proyectos])

  // 2. Extraer y filtrar todos los insumos pendientes de compra de los proyectos activos en taller
  const pendingInsumos = useMemo(() => {
    const projIds = Array.from(activeProjectsMap.keys())
    if (!projIds.length) return []

    // Obtener los espacio_variantes de estos proyectos (flexibilizando activa)
    const projectEspacios = espacios.filter(ev => projIds.includes(ev.data?.proyecto_id))
    const activeEspacios = projectEspacios.filter(ev => ev.data?.activa === true || String(ev.data?.activa) === 'true')
    const finalEspacioIds = (activeEspacios.length > 0 ? activeEspacios : projectEspacios).map(ev => ev.id)

    // Filtrar los items_variante correspondientes que no estén anulados ni comprados
    const items = itemsVariante.filter(
      iv => finalEspacioIds.includes(iv.data?.variante_id) && 
            iv.data?.anulado !== true && 
            iv.data?.compra_generada !== true
    )

    // Cruzar con productos_catalogo para SKU y nombre de proveedor
    return items.map(item => {
      const prod = catalogo.find(c => c.id === item.data?.catalogo_id)
      const esp = espacios.find(e => e.id === item.data?.variante_id)
      const projNombre = activeProjectsMap.get(esp?.data?.proyecto_id) || "Taller"
      
      return {
        id: item.id,
        proyecto_id: esp?.data?.proyecto_id,
        proyecto_nombre: projNombre,
        catalogo_id: item.data?.catalogo_id,
        nombre: prod?.data?.descripcion || item.data?.nombre || "Material Genérico",
        sku: prod?.data?.sku || "GENÉRICO",
        cantidad: Number(item.data?.cantidad) || 1,
        precio_unitario: Number(item.data?.precio_unitario) || (prod ? Number(prod.data?.precio_directo) : 0),
        proveedor_id: prod?.data?.proveedor_id || "Por Asignar",
        origen: `Proyecto: ${projNombre}`
      }
    })
  }, [activeProjectsMap, espacios, itemsVariante, catalogo])

  // 3. Agrupaciones
  // A. Agrupación por Proveedor
  const insumosByProveedor = useMemo(() => {
    const groups: Record<string, typeof pendingInsumos> = {}
    for (const item of pendingInsumos) {
      const prov = item.proveedor_id || "Por Asignar"
      if (!groups[prov]) groups[prov] = []
      groups[prov].push(item)
    }
    return groups
  }, [pendingInsumos])

  // B. Agrupación por Proyecto
  const insumosByProyecto = useMemo(() => {
    const groups: Record<string, typeof pendingInsumos> = {}
    for (const item of pendingInsumos) {
      const proj = item.proyecto_nombre || "Taller"
      if (!groups[proj]) groups[proj] = []
      groups[proj].push(item)
    }
    return groups
  }, [pendingInsumos])

  // Lógica del carrito
  const totalCart = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0)
  }, [cart])

  const handleAddAllFromGroup = (itemsGroup: typeof pendingInsumos) => {
    setCart(prev => {
      let updated = [...prev]
      for (const item of itemsGroup) {
        // Evitar duplicados por id del diseño
        if (item.id && updated.some(i => i.id === item.id)) continue
        
        // Si no tiene id (manual) pero coincide nombre y precio, sumar cantidad
        const matchIndex = updated.findIndex(i => i.nombre === item.nombre && i.precio_unitario === item.precio_unitario && i.proyecto_id === item.proyecto_id)
        if (matchIndex >= 0) {
          updated[matchIndex] = {
            ...updated[matchIndex],
            cantidad: updated[matchIndex].cantidad + item.cantidad
          }
        } else {
          updated.push({ ...item })
        }
      }
      return updated
    })
    toast.success("Grupo de insumos agregado al carrito.")
  }

  const handleAddItemToCart = (item: typeof pendingInsumos[0]) => {
    setCart(prev => {
      if (item.id && prev.some(i => i.id === item.id)) {
        toast.info("Este material ya está en el carrito.")
        return prev
      }
      
      const matchIndex = prev.findIndex(i => i.nombre === item.nombre && i.precio_unitario === item.precio_unitario && i.proyecto_id === item.proyecto_id)
      if (matchIndex >= 0) {
        let updated = [...prev]
        updated[matchIndex] = {
          ...updated[matchIndex],
          cantidad: updated[matchIndex].cantidad + item.cantidad
        }
        return updated
      }
      
      return [...prev, { ...item }]
    })
    toast.success("Material sumado al carrito.")
  }

  const handleRemoveFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  // Agregar manual
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualName.trim() || Number(manualCant) <= 0) return

    const prod = catalogo.find(c => c.id === manualCatalogoId)
    const finalName = prod ? prod.data.descripcion : manualName.trim()
    const finalSku = prod ? prod.data.sku : "MANUAL"

    const newItem: CartItem = {
      nombre: finalName,
      sku: finalSku,
      cantidad: Number(manualCant),
      precio_unitario: Number(manualPrecio) || 0,
      origen: "Stock / Taller Manual",
      proveedor_id: prod?.data?.proveedor_id || "Por Asignar"
    }

    setCart(prev => [...prev, newItem])
    toast.success("Material manual añadido al carrito.")
    
    // Resetear form
    setManualName("")
    setManualCant("1")
    setManualPrecio("0")
    setManualCatalogoId("")
  }

  const handleSelectCatalogoManual = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value
    setManualCatalogoId(cid)
    const prod = catalogo.find(c => c.id === cid)
    if (prod) {
      setManualName(prod.data.descripcion)
      setManualPrecio(prod.data.precio_directo || prod.data.precio_publico || "0")
    }
  }

  // Procesamiento global y disparo de Zaps
  const handleProcessPurchase = async () => {
    if (!cart.length) return toast.error("El carrito está vacío.")
    
    setIsProcessing(true)
    try {
      // 1. Agrupar ítems del carrito por proyecto_id para invocar el zap_generar_orden_compra
      const designItems = cart.filter(i => i.id && i.proyecto_id)
      const manualItems = cart.filter(i => !i.id)

      const uniqueProjectIds = Array.from(new Set(designItems.map(i => i.proyecto_id as string)))

      // Ejecutar zap de compras del diseño para cada proyecto
      for (const pid of uniqueProjectIds) {
        const res = await fetch('/api/engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zap: 'zap_generar_orden_compra',
            payload: { proyecto_id: pid }
          })
        })
        if (!res.ok) throw new Error(`Fallo en el procesamiento de compras para el proyecto: ${pid}`)
      }

      // 2. Si hay ítems manuales sin proyecto o agregados en taller, enviarlos al zap de obligaciones general
      if (manualItems.length > 0) {
        const resEng = await fetch('/api/engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            zap: "zap_convertir_orden_en_obligacion",
            payload: { 
              items: manualItems.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio_unitario: i.precio_unitario })), 
              projectName: "Consolidado Taller Manual" 
            }
          })
        })
        
        if (!resEng.ok) throw new Error("Fallo al registrar obligación de materiales manuales.")

        // Grabar manualmente compras_materiales en la base de datos para Harold
        for (const item of manualItems) {
          await fetch('/api/vault', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'WRITE',
              namespace: 'compras_materiales',
              record: {
                id: crypto.randomUUID(),
                data: {
                  descripcion: item.nombre,
                  cantidad: item.cantidad,
                  costo_real_compra: item.precio_unitario * item.cantidad,
                  estado: 'solicitado',
                  origen_proyecto: item.origen,
                  fecha_compra: new Date().toISOString().slice(0, 10)
                }
              }
            })
          })
        }
      }

      toast.success("✅ Pedido consolidado procesado y transmitido a Compras y Finanzas")
      setCart([])
      loadDatabase() // Recargar datos locales
    } catch (err: any) {
      toast.error(err.message || "Error al procesar el pedido.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        
        {/* Banner de Cabecera Premium */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-900 text-white p-5 rounded-2xl shadow-xl border border-stone-850">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 tracking-tight text-amber-400">
              <PackageOpen className="w-6 h-6 shrink-0" /> Central de Abastecimiento
            </h2>
            <p className="text-xs text-stone-400 font-medium">Gestión de insumos en caliente, diffing de proyectos y radar logístico.</p>
          </div>
          <TabsList className="bg-stone-800 p-1 rounded-xl self-stretch sm:self-auto grid grid-cols-2">
            <TabsTrigger value="formular" className="font-bold text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 px-4 py-2">
              🛒 Formular Pedido ({cart.length})
            </TabsTrigger>
            <TabsTrigger value="radar" className="font-bold text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950 px-4 py-2">
              📡 Radar en Tránsito
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CONTENIDO FORMULAR PEDIDO */}
        <TabsContent value="formular" className="space-y-6 outline-none m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Insumos por Diseños / Proyectos Activos */}
            <div className="lg:col-span-8 space-y-6">
              
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-stone-800 flex items-center gap-2">
                      <Search className="w-4 h-4 text-amber-500" /> Insumos Faltantes de Taller
                    </h3>
                    <p className="text-2xs text-stone-400 font-medium mt-0.5">Calculados automáticamente de proyectos activos en taller</p>
                  </div>

                  {/* Selector organizativo */}
                  <div className="flex bg-stone-100 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant={abastTab === 'proveedor' ? 'secondary' : 'ghost'}
                      onClick={() => setAbastTab('proveedor')}
                      className="text-2xs font-bold px-3 h-7 rounded-md"
                    >
                      <Store className="h-3 w-3 mr-1" /> Por Proveedor
                    </Button>
                    <Button
                      size="sm"
                      variant={abastTab === 'proyecto' ? 'secondary' : 'ghost'}
                      onClick={() => setAbastTab('proyecto')}
                      className="text-2xs font-bold px-3 h-7 rounded-md"
                    >
                      <Folder className="h-3 w-3 mr-1" /> Por Proyecto
                    </Button>
                  </div>
                </div>

                {loadingDb ? (
                  <div className="text-xs py-10 text-center text-stone-400 animate-pulse font-medium">
                    Calculando deltas y cargando existencias...
                  </div>
                ) : pendingInsumos.length === 0 ? (
                  <div className="text-xs py-10 text-center text-green-700 font-bold flex flex-col items-center gap-2 bg-green-50/20 rounded-xl border border-green-100">
                    <ShieldCheck className="w-8 h-8 text-green-600" />
                    Todo abastecido. No hay proyectos en taller con materiales pendientes de orden.
                  </div>
                ) : (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-1">
                    
                    {/* Renderización Por Proveedor */}
                    {abastTab === 'proveedor' && (
                      Object.entries(insumosByProveedor).map(([proveedor, items]) => (
                        <div key={proveedor} className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                          <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-stone-850">Proveedor: <strong className="text-amber-600">{proveedor}</strong></span>
                              <p className="text-[10px] text-stone-400 font-medium">{items.length} insumos requeridos</p>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddAllFromGroup(items)}
                              className="h-8 text-2xs font-bold border-stone-200 hover:bg-stone-100"
                            >
                              Sumar Todo
                            </Button>
                          </div>
                          
                          <div className="divide-y divide-stone-100">
                            {items.map((it: any) => (
                              <div key={it.id} className="p-3 flex justify-between items-center gap-4 hover:bg-stone-50/40">
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-stone-800">{it.nombre}</span>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-450 font-medium">
                                    <span className="bg-stone-100 px-1.5 py-0.2 rounded font-mono text-[9px]">{it.sku}</span>
                                    <span>{it.proyecto_nombre}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs font-bold font-mono text-stone-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    {it.cantidad} ud
                                  </span>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleAddItemToCart(it)}
                                    className="h-8 w-8 text-stone-450 hover:text-stone-800 hover:bg-stone-100"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                    {/* Renderización Por Proyecto */}
                    {abastTab === 'proyecto' && (
                      Object.entries(insumosByProyecto).map(([proyectoNombre, items]) => (
                        <div key={proyectoNombre} className="border border-stone-200 rounded-xl overflow-hidden bg-white shadow-3xs">
                          <div className="bg-stone-50 border-b border-stone-200 px-4 py-3 flex justify-between items-center">
                            <div>
                              <span className="text-xs font-bold text-stone-850">Proyecto: <strong className="text-stone-700">{proyectoNombre}</strong></span>
                              <p className="text-[10px] text-stone-400 font-medium">{items.length} insumos requeridos</p>
                            </div>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddAllFromGroup(items)}
                              className="h-8 text-2xs font-bold border-stone-200 hover:bg-stone-100"
                            >
                              Sumar Todo
                            </Button>
                          </div>
                          
                          <div className="divide-y divide-stone-100">
                            {items.map((it: any) => (
                              <div key={it.id} className="p-3 flex justify-between items-center gap-4 hover:bg-stone-50/40">
                                <div className="min-w-0">
                                  <span className="text-xs font-semibold text-stone-800">{it.nombre}</span>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-stone-450 font-medium">
                                    <span className="bg-stone-100 px-1.5 py-0.2 rounded font-mono text-[9px]">{it.sku}</span>
                                    <span>Proveedor: {it.proveedor_id}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                  <span className="text-xs font-bold font-mono text-stone-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                                    {it.cantidad} ud
                                  </span>
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    onClick={() => handleAddItemToCart(it)}
                                    className="h-8 w-8 text-stone-450 hover:text-stone-800 hover:bg-stone-100"
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}

                  </div>
                )}
              </div>

              {/* Búsqueda Manual / Insumos Imprevistos */}
              <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <h4 className="font-bold text-sm text-stone-850 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" /> Cargar Material Manual / Imprevisto
                </h4>
                <form onSubmit={handleAddManual} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Catálogo Maestro</label>
                    <select
                      value={manualCatalogoId}
                      onChange={handleSelectCatalogoManual}
                      className="w-full h-10 px-3 rounded-lg border border-stone-250 bg-white text-xs outline-none focus:border-amber-500"
                    >
                      <option value="">-- Buscar en catálogo --</option>
                      {catalogo.map(c => (
                        <option key={c.id} value={c.id}>{c.data.sku} - {c.data.descripcion}</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Nombre Libre</label>
                    <input
                      type="text"
                      placeholder="Pegante, tornillos, etc."
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-stone-250 text-xs focus:border-amber-500 outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase">Cant.</label>
                    <input
                      type="number"
                      min="1"
                      value={manualCant}
                      onChange={(e) => setManualCant(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-stone-250 text-xs text-center font-bold outline-none"
                      required
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button 
                      type="submit" 
                      className="w-full h-10 bg-stone-900 hover:bg-stone-850 text-white font-bold text-xs"
                    >
                      Añadir
                    </Button>
                  </div>
                </form>
              </div>

            </div>

            {/* Columna Derecha: Carrito Consolidado */}
            <div className="lg:col-span-4">
              <div className="border border-stone-200 rounded-2xl bg-white shadow-sm overflow-hidden flex flex-col min-h-[460px]">
                
                {/* Header Carrito */}
                <div className="bg-stone-900 border-b border-stone-800 p-4 text-white">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" /> Carrito Consolidado
                  </h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">Materiales listos para ordenar compra</p>
                </div>

                {/* Listado de ítems en carrito */}
                <div className="flex-1 overflow-y-auto p-4 bg-stone-50/40 space-y-3">
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-stone-400 italic py-16 space-y-2">
                      <ShoppingCart className="w-10 h-10 text-stone-200" />
                      <p className="text-xs">El carrito está vacío</p>
                    </div>
                  ) : (
                    cart.map((item, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-stone-200 shadow-3xs flex items-center justify-between gap-3 group">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-stone-800 block truncate">{item.nombre}</span>
                          <span className="text-[9px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100/50 mt-1 inline-block">
                            {item.cantidad} ud
                          </span>
                          <span className="text-[9px] text-stone-450 block truncate mt-0.5">{item.origen}</span>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="h-8 w-8 text-stone-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Carrito */}
                <div className="p-4 border-t border-stone-200 bg-white">
                  <Button
                    onClick={handleProcessPurchase}
                    disabled={cart.length === 0 || isProcessing}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold h-12 text-sm rounded-xl shadow-md"
                  >
                    {isProcessing ? 'Procesando Compra...' : '⚡ Procesar Obligaciones y Compra'}
                  </Button>
                </div>

              </div>
            </div>

          </div>
        </TabsContent>

        {/* CONTENIDO RADAR EN TRÁNSITO */}
        <TabsContent value="radar" className="outline-none m-0">
          <RadarPedidosTaller />
        </TabsContent>

      </Tabs>
    </div>
  )
}
