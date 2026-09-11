"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { NumberInput } from "@/components/veta/number-input";
import { MoneyInput } from "@/components/veta/money-input";
import { useDataStore, type Proyecto } from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";

export interface ParametrosFinancierosModalProps {
  proyecto: Proyecto;
  onClose: () => void;
  onSaved: () => void;
}

function aDigitos(val: string | null | undefined): string {
  return (val ?? '').replace(/[^\d]/g, '')
}

/**
 * Módulo consolidado de parametrización final del costo de la cotización (2026-09-11,
 * pedido explícito del Supervisor: "un módulo que controle impuestos, costos operativos,
 * descuentos, etc."). Antes estos campos vivían repartidos entre inputs sueltos en el
 * header (Garantía/IVA) y el modal genérico "Editar datos" (los 5 costos) — sin ningún
 * lugar único, discoverable, dedicado a la parametrización financiera. Todo pasa ahora por
 * `store.proyectos.actualizarParametrosFinancieros` (única puerta de escritura para estos
 * campos, ver lib/data/contracts.ts).
 */
export function ParametrosFinancierosModal({ proyecto, onClose, onSaved }: ParametrosFinancierosModalProps) {
  const store = useDataStore();
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard();

  const [form, setForm] = useState({
    aplicaIva: proyecto.aplicaIva,
    porcentajeIva: aDigitos(proyecto.porcentajeIva) || '19',
    garantiaAnios: String(proyecto.garantiaAnios ?? 2),
    costosOperativos: aDigitos(proyecto.costosOperativos),
    costosLogisticos: aDigitos(proyecto.costosLogisticos),
    imprevistosInstalacion: aDigitos(proyecto.imprevistosInstalacion),
    descuentoComercial: aDigitos(proyecto.descuentoComercial),
    ajusteArbitrario: aDigitos(proyecto.ajusteArbitrario),
  });

  const guardar = async () => {
    await store.proyectos.actualizarParametrosFinancieros(proyecto.id, {
      aplicaIva: form.aplicaIva,
      porcentajeIva: form.porcentajeIva || '19',
      garantiaAnios: Number(form.garantiaAnios) || 0,
      costosOperativos: form.costosOperativos || '0',
      costosLogisticos: form.costosLogisticos || '0',
      imprevistosInstalacion: form.imprevistosInstalacion || '0',
      descuentoComercial: form.descuentoComercial || '0',
      ajusteArbitrario: form.ajusteArbitrario || '0',
    })
    onSaved()
  }

  const set = <K extends keyof typeof form>(campo: K, valor: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="parametros-financieros-title">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border-subtle bg-bg-paper p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="parametros-financieros-title" className="font-display text-lg font-semibold text-text-heading">
            Parámetros financieros de la cotización
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">✕</Button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Impuestos y garantía</p>
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="flex items-center gap-2 sm:col-span-1">
                <input
                  type="checkbox"
                  checked={form.aplicaIva}
                  onChange={(e) => set('aplicaIva', e.target.checked)}
                  className="rounded border border-border-subtle cursor-pointer"
                />
                <span className="text-sm font-medium text-text-heading">Aplica IVA</span>
              </label>
              <NumberInput
                label="% IVA"
                value={form.porcentajeIva}
                onChange={(v) => set('porcentajeIva', v)}
                min={0}
                step={0.5}
              />
              <NumberInput
                label="Garantía (años)"
                value={form.garantiaAnios}
                onChange={(v) => set('garantiaAnios', v)}
                min={0}
                step={1}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-text-muted mb-2">Costos operativos, descuentos y ajustes</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <MoneyInput
                label="Costos operativos"
                value={form.costosOperativos}
                onChange={(v) => set('costosOperativos', v)}
              />
              <MoneyInput
                label="Costos logísticos (transporte)"
                value={form.costosLogisticos}
                onChange={(v) => set('costosLogisticos', v)}
              />
              <MoneyInput
                label="Imprevistos de instalación"
                value={form.imprevistosInstalacion}
                onChange={(v) => set('imprevistosInstalacion', v)}
              />
              <MoneyInput
                label="Descuento comercial"
                value={form.descuentoComercial}
                onChange={(v) => set('descuentoComercial', v)}
              />
              <MoneyInput
                label="Ajuste arbitrario"
                value={form.ajusteArbitrario}
                onChange={(v) => set('ajusteArbitrario', v)}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => guardGuardar(guardar)}
            disabled={guardando}
            loading={guardando}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
