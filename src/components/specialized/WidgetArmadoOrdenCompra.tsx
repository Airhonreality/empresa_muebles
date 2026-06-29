"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import type { BlockProps } from "@agnostic/core";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, ShoppingCart, Search, PackageOpen, Truck, ShieldCheck } from "lucide-react";
import RadarPedidosTaller from "./taller/RadarPedidosTaller";

interface CartItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  origen?: string;
  catalogo_id?: string;
}

export default function CentralAbastecimientoGlobal({ context, schema }: BlockProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  
  const [proyectos, setProyectos] = useState<any[]>([]);
  const [catalogoMaestro, setCatalogoMaestro] = useState<any[]>([]);
  const [comprasExistentes, setComprasExistentes] = useState<any[]>([]);
  const [selectedProyectoId, setSelectedProyectoId] = useState<string>('');
  const [suggestedItems, setSuggestedItems] = useState<CartItem[]>([]);
  const [isLoadingSugs, setIsLoadingSugs] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/vault?namespace=proyectos').then(r => r.json()),
      fetch('/api/vault?namespace=productos_catalogo').then(r => r.json()),
      fetch('/api/vault?namespace=compras_materiales').then(r => r.json())
    ])
    .then(([dataProyectos, dataCat, dataComp]) => {
      setProyectos(dataProyectos.records || []);
      setCatalogoMaestro(dataCat.records || []);
      setComprasExistentes(dataComp.records || []);
    })
    .catch(() => toast.error("Error cargando base de datos maestra"));
  }, []);

  // Motor de Diffing inteligente
  useEffect(() => {
    if (!selectedProyectoId) {
      setSuggestedItems([]);
      return;
    }
    
    setIsLoadingSugs(true);
    async function loadProjectData() {
      try {
        const [resV, resI] = await Promise.all([
          fetch('/api/vault?namespace=espacio_variantes'),
          fetch('/api/vault?namespace=items_variante')
        ]);
        
        const dataV = await resV.json();
        const dataI = await resI.json();
        
        const projName = proyectos.find(c => c.id === selectedProyectoId)?.data?.nombre_proyecto || selectedProyectoId;

        const variants = (dataV.records || []).filter((v: any) => v.data.proyecto_id === selectedProyectoId && v.data.activa === true);
        const variantIds = variants.map((v: any) => v.id);
        const projItems = (dataI.records || []).filter((i: any) => variantIds.includes(i.data.variante_id));

        // Filtrar qué ítems ya se pidieron en compras_materiales para este proyecto
        const pedidosPrevios = comprasExistentes.filter(c => c.data?.origen_proyecto && c.data.origen_proyecto.includes(projName));

        const enriched: CartItem[] = [];
        
        projItems.forEach((item: any) => {
          const cat = catalogoMaestro.find((c: any) => c.id === item.data.catalogo_id);
          const nombre = cat ? cat.data.descripcion : 'Ítem Genérico';
          const cantReq = Number(item.data.cantidad) || 1;

          // Restar cantidad ya pedida
          const pedExist = pedidosPrevios.find(p => p.data?.descripcion === nombre);
          const cantYaPedida = pedExist ? Number(pedExist.data.cantidad || 0) : 0;
          const delta = Math.max(0, cantReq - cantYaPedida);

          if (delta > 0) {
            enriched.push({
              nombre,
              cantidad: delta,
              precio_unitario: Number(item.data.precio_unitario) || (cat ? Number(cat.data.precio_directo) : 0),
              origen: `Proyecto: ${projName}`,
              catalogo_id: cat?.id
            });
          }
        });

        const groupedMap = new Map<string, CartItem>();
        enriched.forEach(item => {
           if (groupedMap.has(item.nombre)) {
             const existing = groupedMap.get(item.nombre)!;
             existing.cantidad += item.cantidad;
           } else {
             groupedMap.set(item.nombre, item);
           }
        });

        setSuggestedItems(Array.from(groupedMap.values()));
      } catch (e) {
        toast.error("Error cruzando catálogo maestro");
      } finally {
        setIsLoadingSugs(false);
      }
    }
    loadProjectData();
  }, [selectedProyectoId, catalogoMaestro, proyectos, comprasExistentes]);

  const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  const agregarItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const cantidad = Number(formData.get("cantidad"));
    const precio_unitario = Number(formData.get("precio_unitario"));

    if (!nombre || cantidad <= 0 || precio_unitario <= 0) return;

    const exist = items.find(i => i.nombre === nombre);
    if (exist) {
      setItems(items.map(i => i.nombre === nombre ? { ...i, cantidad: i.cantidad + cantidad, origen: 'Mixto (Consolidado)' } : i));
    } else {
      setItems([...items, { nombre, cantidad, precio_unitario, origen: 'Inventario General / Manual' }]);
    }
    
    e.currentTarget.reset();
  };

  const autocompletarPrecio = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const match = catalogoMaestro.find(c => c.data.descripcion === val);
    if (match) {
      const priceInput = e.target.form?.elements.namedItem("precio_unitario") as HTMLInputElement;
      if (priceInput) priceInput.value = match.data.precio_directo || 0;
    }
  };

  const agregarSugerido = (item: CartItem) => {
    const exist = items.find(i => i.nombre === item.nombre);
    if (exist) {
      setItems(items.map(i => i.nombre === item.nombre ? { ...i, cantidad: i.cantidad + item.cantidad, origen: 'Mixto (Consolidado)' } : i));
    } else {
      setItems([...items, item]);
    }
    setSuggestedItems(suggestedItems.filter(i => i.nombre !== item.nombre));
  };

  const dispararZap = async () => {
    if (items.length === 0) return toast.error("El carrito maestro está vacío");

    setIsDeploying(true);
    try {
      const orígenes = Array.from(new Set(items.map(i => i.origen)));
      const projName = orígenes.length > 1 ? "Consolidado de Múltiples Orígenes" : orígenes[0] || "Stock Taller";

      // 1. Enviar Zap para procesar obligación en Finanzas
      const resEngine = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: "zap_convertir_orden_en_obligacion",
          payload: { items, projectName: projName, context: context || 'obligaciones_pendientes', schema }
        })
      });

      if (!resEngine.ok) throw new Error("Fallo al disparar Zap financiero");

      // 2. Grabar los registros en compras_materiales para el Radar Logístico de Harold
      for (const item of items) {
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
                origen_proyecto: item.origen || 'Stock Taller',
                fecha_compra: new Date().toISOString().slice(0, 10)
              }
            }
          })
        });
      }

      setItems([]);
      setSelectedProyectoId('');
      toast.success("✅ Pedido consolidado transmitido a Compras y Finanzas");
      
      // Refrescar compras existentes
      fetch('/api/vault?namespace=compras_materiales').then(r => r.json()).then(d => setComprasExistentes(d.records || []));
    } catch (err: any) {
      toast.error(err.message || "Falla de red al conectar con el Motor");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <Tabs defaultValue="formular" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-900 text-white p-4 rounded-xl shadow-lg">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <PackageOpen className="w-6 h-6 text-amber-500" /> Central de Abastecimiento
            </h2>
            <p className="text-xs text-stone-400">Consolida inventario móvil y monitorea despachos.</p>
          </div>
          <TabsList className="bg-stone-800 p-1 rounded-lg self-stretch sm:self-auto grid grid-cols-2">
            <TabsTrigger value="formular" className="font-bold text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950">
              🛒 Formular Pedido ({items.length})
            </TabsTrigger>
            <TabsTrigger value="radar" className="font-bold text-xs data-[state=active]:bg-amber-500 data-[state=active]:text-stone-950">
              📡 Radar en Tránsito
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="formular" className="space-y-6 outline-none m-0">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7 space-y-6">
              
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <div>
                  <label className="text-sm font-bold text-stone-700 flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-amber-500" /> Extraer Insumos Faltantes (Diffing)
                  </label>
                  <select 
                    className="w-full h-11 px-4 rounded-lg border-2 border-stone-200 bg-stone-50 text-stone-800 text-sm font-semibold outline-none focus:border-amber-500"
                    value={selectedProyectoId}
                    onChange={(e) => setSelectedProyectoId(e.target.value)}
                  >
                    <option value="">-- Seleccionar proyecto en producción --</option>
                    {proyectos.map(c => (
                      <option key={c.id} value={c.id}>{c.data.nombre_proyecto || `Proyecto ${c.id.slice(0, 8)}`}</option>
                    ))}
                  </select>
                </div>

                {selectedProyectoId && (
                  <div className="border border-stone-200 rounded-lg bg-stone-50/50 p-2 max-h-60 overflow-y-auto">
                    {isLoadingSugs ? (
                      <div className="text-sm p-6 text-center text-stone-500 font-semibold animate-pulse">Calculando deltas de inventario...</div>
                    ) : suggestedItems.length === 0 ? (
                      <div className="text-sm p-6 text-center text-green-700 font-bold flex flex-col items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-green-600" />
                        Abastecimiento 100% completo para este diseño. No faltan ítems por pedir.
                      </div>
                    ) : (
                      <ul className="space-y-1.5">
                        {suggestedItems.map((it, idx) => (
                          <li key={idx} className="flex justify-between items-center p-2.5 bg-white rounded-md border border-stone-100 shadow-sm hover:border-amber-300">
                            <div className="truncate pr-2 text-sm text-stone-700 font-medium">
                              <span className="font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded mr-2">{it.cantidad}x</span>{it.nombre}
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-xs font-bold hover:bg-amber-50" onClick={() => agregarSugerido(it)}>
                              <PlusCircle className="w-3.5 h-3.5 mr-1" /> Sumar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-3">
                <label className="text-sm font-bold text-stone-700 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" /> Búsqueda Manual en Catálogo
                </label>
                <form onSubmit={agregarItem} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    name="nombre" 
                    type="text" 
                    list="catalogo-maestro-list"
                    onChange={autocompletarPrecio}
                    placeholder="Buscar insumo, pegante, tornillo..." 
                    className="flex-1 h-10 px-3 rounded-lg border-2 border-stone-200 text-sm focus:border-amber-500 outline-none" 
                    required 
                  />
                  <datalist id="catalogo-maestro-list">
                    {catalogoMaestro.map(c => (
                      <option key={c.id} value={c.data.descripcion} />
                    ))}
                  </datalist>
                  
                  <input name="cantidad" type="number" min="1" defaultValue="1" className="w-full sm:w-20 h-10 px-2 rounded-lg border-2 border-stone-200 text-sm text-center font-bold" required />
                  <input name="precio_unitario" type="number" min="0" placeholder="Costo Unit." className="w-full sm:w-28 h-10 px-2 rounded-lg border-2 border-stone-200 text-sm font-mono" required />
                  <Button type="submit" variant="secondary" className="h-10 font-bold border-2 border-stone-200">Añadir</Button>
                </form>
              </div>

            </div>

            <div className="md:col-span-5 border-2 border-stone-200 rounded-xl bg-white flex flex-col shadow-sm overflow-hidden min-h-[300px]">
              <div className="bg-stone-50 border-b-2 border-stone-200 p-4">
                <h3 className="font-black text-stone-800 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-amber-600" /> Carrito Consolidado
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-stone-50/30">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-sm text-stone-400 italic space-y-2 py-12">
                    <ShoppingCart className="w-10 h-10 text-stone-200" />
                    <p>Orden vacía</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {items.map((it, idx) => (
                      <li key={idx} className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center group">
                        <div className="text-sm text-stone-800">
                          <span className="font-black text-amber-600 mr-2">{it.cantidad}x</span>
                          {it.nombre}
                          <span className="block text-[10px] text-stone-400 uppercase mt-0.5">{it.origen}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm">${(it.cantidad * it.precio_unitario).toLocaleString()}</span>
                          <button type="button" className="text-red-400 hover:text-red-600 font-bold" onClick={() => setItems(items.filter((_, i) => i !== idx))}>×</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Botón Desktop */}
              <div className="hidden md:block p-4 bg-white border-t-2 border-stone-200">
                <div className="flex items-end justify-between mb-4">
                  <span className="text-sm font-bold text-stone-500 uppercase">Total Estimado</span>
                  <span className="text-2xl font-black text-amber-600">${total.toLocaleString()}</span>
                </div>
                <Button onClick={dispararZap} disabled={items.length === 0 || isDeploying} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black h-12 text-base">
                  {isDeploying ? '⏳ Transmitiendo...' : '⚡ Procesar Obligación'}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="radar" className="outline-none m-0">
          <RadarPedidosTaller />
        </TabsContent>
      </Tabs>

      {/* Sticky Bottom Bar (Exclusiva Mobile First) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-stone-900 border-t border-stone-800 p-4 z-50 flex items-center justify-between shadow-2xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-stone-400 block">Consolidado ({items.length})</span>
          <span className="text-xl font-black font-mono text-amber-400">${total.toLocaleString()}</span>
        </div>
        <Button onClick={dispararZap} disabled={items.length === 0 || isDeploying} className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-black h-11 px-6 shadow-lg">
          {isDeploying ? '⏳...' : '⚡ Procesar Compra'}
        </Button>
      </div>
    </div>
  );
}
