"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { NumberInput } from "@/components/veta/number-input";
import type { Proyecto } from "@/lib/data";
import { useToast } from "@/components/veta/toast-provider";

export type ParametrosFinancieros = Partial<
  Pick<Proyecto, 'aplicaIva' | 'porcentajeIva' | 'garantiaAnios' | 'costosOperativos' | 'imprevistosInstalacion' | 'descuentoComercial' | 'ajusteArbitrario'>
>;

// Tipo acotado de lo que este modal de verdad guarda (ver nota 2026-09-30 más abajo):
// costosOperativos/imprevistosInstalacion/descuentoComercial/ajusteArbitrario se mudaron
// a inputs in-situ en el footer del cotizador. onGuardar sigue aceptando el tipo completo
// (Partial) porque el caller lo comparte con esos otros call sites, pero este componente
// solo envía las 3 claves de IVA/garantía -- una actualización real (PATCH), no resetea las demás.

export interface ParametrosFinancierosModalProps {
  proyecto: Proyecto;
  /** Inyectado por el caller (2026-09-11, corrección de bug real): este modal vive DENTRO del
   * cotizador, cuya pantalla lee `proyecto` de un snapshot TanStack Query escopado
   * (`useCotizadorCompat`), no del `useDataStore()` global. Escribir por el store equivocado
   * guardaba el dato en Neon correctamente pero la pantalla no se enteraba hasta que el
   * long-poll (hasta 4s) alcanzara a invalidar — se veía como "el costo no se está sumando".
   * Recibir la función de escritura por prop deja que cada pantalla inyecte el store correcto
   * en vez de que el modal adivine cuál usar. */
  onGuardar: (partial: ParametrosFinancieros) => Promise<unknown>;
  onClose: () => void;
  onSaved: () => void;
}

function aDigitos(val: string | null | undefined): string {
  return (val ?? '').replace(/[^\d]/g, '')
}

/**
 * Módulo de parametrización de impuestos y garantía (2026-09-11, pedido explícito del
 * Supervisor; recortado 2026-09-30 -- diagnóstico UX encontró que los 4 campos de
 * costos/imprevistos/descuento/ajuste vivían escondidos detrás de este modal, causa real
 * de "siempre se me olvida meter costo operativo" (feedback directo de Javier): son datos
 * que cambian por cotización, no parámetros raros de tocar una vez. Se movieron a inputs
 * in-situ con autosave en el footer del cotizador (app/erp/cotizador/[proyectoId]/page.tsx).
 * Este modal queda solo para IVA/garantía, que sí casi no cambian entre cotizaciones.
 *
 * Nota (2026-09-11, mismo día): "Costos logísticos" existió unas horas como campo separado
 * de "Costos operativos" — Javier señaló que eran conceptualmente el mismo balde (un solo
 * número de costo operativo, que YA cubre logística/transporte) y que dos campos casi
 * idénticos en el formulario era redundante y confuso, no una necesidad real de negocio.
 */
export function ParametrosFinancierosModal({ proyecto, onGuardar, onClose, onSaved }: ParametrosFinancierosModalProps) {
  const { mostrarError } = useToast();

  const [form, setForm] = useState({
    aplicaIva: proyecto.aplicaIva,
    porcentajeIva: aDigitos(proyecto.porcentajeIva) || '19',
    garantiaAnios: String(proyecto.garantiaAnios ?? 2),
  });

  // t-177: la mutación ya es optimista (el header del cotizador cambia al instante). Antes el
  // modal esperaba el roundtrip completo del servidor para cerrarse; ahora cierra en cuanto
  // dispara el guardado, y si falla después lo avisa por toast (ya no hay dónde mostrarlo
  // inline, porque el modal ya no existe en pantalla).
  const guardar = () => {
    // porcentaje_iva es numeric(5,2) en el schema: el valor absoluto debe quedar bajo 1000
    // (2026-09-11: incidente real en producción — "numeric field overflow" al guardar sin
    // este tope, el input no bloqueaba escribir un valor fuera de rango).
    const ivaClamp = Math.min(Math.max(Number(form.porcentajeIva) || 0, 0), 100)
    // Partial real (PATCH, no overwrite -- confirmado contra lib/data/actions/core.ts): omitir
    // costosOperativos/imprevistosInstalacion/descuentoComercial/ajusteArbitrario NO los resetea,
    // siguen viviendo en el footer del cotizador.
    onGuardar({
      aplicaIva: form.aplicaIva,
      porcentajeIva: String(ivaClamp || 19),
      garantiaAnios: Number(form.garantiaAnios) || 0,
    }).catch((err) => {
      mostrarError(err instanceof Error ? err.message : 'No se pudo guardar los parámetros financieros. Revisa tu conexión e intenta de nuevo.')
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
            IVA y garantía
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">✕</Button>
        </div>

        <div className="space-y-5">
          <div>
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
                max={100}
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
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={guardar}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}
