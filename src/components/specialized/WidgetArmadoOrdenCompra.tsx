"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { AgnosticBlockProps } from "@/lib/agnostic/blocks/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CartItem {
  nombre: string;
  cantidad: number;
  precio_unitario: number;
}

export default function WidgetArmadoOrdenCompra({ context, record, schema }: AgnosticBlockProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);

  // Escuchar evento para limpiar el carrito después de que el Zap fue exitoso
  useEffect(() => {
    const handleClear = () => setItems([]);
    window.addEventListener('clear_cart', handleClear);
    return () => window.removeEventListener('clear_cart', handleClear);
  }, []);

  const total = items.reduce((acc, item) => acc + (item.cantidad * item.precio_unitario), 0);

  const agregarItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const nombre = formData.get("nombre") as string;
    const cantidad = Number(formData.get("cantidad"));
    const precio_unitario = Number(formData.get("precio_unitario"));

    if (!nombre || cantidad <= 0 || precio_unitario <= 0) return;

    setItems([...items, { nombre, cantidad, precio_unitario }]);
    e.currentTarget.reset();
  };

  const dispararZap = async () => {
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    setIsDeploying(true);
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zap: "zap_convertir_orden_en_obligacion",
          payload: { items, record, context, schema }
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Fallo al ejecutar Zap");

      // El Zap enviará api.notify.success que se procesará automáticamente por el layout
    } catch (err: any) {
      toast.error(err.message || "Falla de red al conectar con el Motor");
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Card className="border-t-4 border-t-amber-500 shadow-md">
      <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20">
        <CardTitle className="text-xl font-heading text-amber-900 dark:text-amber-100 flex justify-between items-center">
          <span>🛒 Armado de Orden de Compra</span>
          <span className="text-sm bg-amber-200 dark:bg-amber-800 px-3 py-1 rounded-full">{items.length} ítems</span>
        </CardTitle>
        <CardDescription>Verifica y añade insumos antes de disparar la obligación financiera.</CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Formulario rápido de ingreso */}
        <form onSubmit={agregarItem} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insumo / Herraje</label>
            <input name="nombre" type="text" placeholder="Ej: Bisagra cierre lento" className="w-full h-9 px-3 rounded-md border bg-transparent text-sm" required />
          </div>
          <div className="w-20 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cant.</label>
            <input name="cantidad" type="number" min="1" defaultValue="1" className="w-full h-9 px-3 rounded-md border bg-transparent text-sm text-center" required />
          </div>
          <div className="w-32 space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Val. Unitario</label>
            <input name="precio_unitario" type="number" min="1" placeholder="$" className="w-full h-9 px-3 rounded-md border bg-transparent text-sm" required />
          </div>
          <Button type="submit" variant="secondary" className="h-9">+</Button>
        </form>

        {/* Lista de Items */}
        <div className="rounded-md border bg-muted/20 min-h-32 p-1">
          {items.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic py-8">
              Aún no has agregado insumos a la orden.
            </div>
          ) : (
            <ul className="divide-y text-sm">
              {items.map((it, idx) => (
                <li key={idx} className="flex justify-between items-center py-2 px-3 hover:bg-muted/50 transition-colors">
                  <div>
                    <span className="font-bold mr-2">{it.cantidad}x</span>
                    <span>{it.nombre}</span>
                  </div>
                  <div className="font-mono text-muted-foreground">
                    ${(it.cantidad * it.precio_unitario).toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer & Acciones */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-lg font-bold">
            Total: <span className="font-mono text-amber-600 dark:text-amber-400">${total.toLocaleString()}</span>
          </div>
          <Button
            onClick={dispararZap}
            disabled={items.length === 0 || isDeploying}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold transition-all shadow-sm"
          >
            {isDeploying ? '⏳ Computando Zap...' : '⚡ Disparar Orden a Finanzas'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
