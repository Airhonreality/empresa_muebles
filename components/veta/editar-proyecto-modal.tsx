"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { MoneyInput } from "@/components/veta/money-input";
import { useDataStore, type Proyecto, type Cliente } from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";

const TIPOS_PROYECTO: { codigo: string; label: string }[] = [
  { codigo: 'personalizado', label: 'Proyecto a medida' },
  { codigo: 'producto_fijo', label: 'Producto fijo' },
]

export interface EditarProyectoModalProps {
  proyecto: Proyecto;
  clientes: Cliente[];
  onClose: () => void;
  onSaved: () => void;
}

function aDigitos(val: string | null | undefined): string {
  return (val ?? '').replace(/[^\d]/g, '')
}

export function EditarProyectoModal({ proyecto, clientes, onClose, onSaved }: EditarProyectoModalProps) {
  const store = useDataStore();
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard();

  const [form, setForm] = useState({
    nombreProyecto: proyecto.nombreProyecto,
    clienteId: proyecto.clienteId ?? '',
    tipoProyecto: proyecto.tipoProyecto,
    direccionObra: proyecto.direccionObra ?? '',
    descripcionSemantica: proyecto.descripcionSemantica ?? '',
    diasEntregaEstimados: proyecto.diasEntregaEstimados ?? '',
    costosOperativos: aDigitos(proyecto.costosOperativos),
    imprevistosInstalacion: aDigitos(proyecto.imprevistosInstalacion),
    descuentoComercial: aDigitos(proyecto.descuentoComercial),
    ajusteArbitrario: aDigitos(proyecto.ajusteArbitrario),
  });

  const guardar = async () => {
    const nombre = form.nombreProyecto.trim()
    if (!nombre) return
    await store.proyectos.actualizar(proyecto.id, {
      nombreProyecto: nombre,
      clienteId: form.clienteId ? form.clienteId : null,
      tipoProyecto: form.tipoProyecto,
      direccionObra: form.direccionObra.trim() || null,
      descripcionSemantica: form.descripcionSemantica.trim() || null,
      diasEntregaEstimados: form.diasEntregaEstimados ? Number(form.diasEntregaEstimados) : null,
      costosOperativos: form.costosOperativos || '0',
      imprevistosInstalacion: form.imprevistosInstalacion || '0',
      descuentoComercial: form.descuentoComercial || '0',
      ajusteArbitrario: form.ajusteArbitrario || '0',
    })
    onSaved()
  }

  const set = (campo: keyof typeof form, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="editar-proyecto-title">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg border border-border-subtle bg-bg-paper p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="editar-proyecto-title" className="font-display text-lg font-semibold text-text-heading">
            Editar datos del proyecto
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">✕</Button>
        </div>

        <div className="space-y-4">
          <InputField
            label="Nombre del proyecto *"
            value={form.nombreProyecto}
            onChange={(e) => set('nombreProyecto', e.target.value)}
            placeholder="Ej: Cocina Integral Roble"
            required
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="editar-proyecto-cliente" className="text-sm font-medium text-text-muted">
              Cliente
            </label>
            <select
              id="editar-proyecto-cliente"
              value={form.clienteId}
              onChange={(e) => set('clienteId', e.target.value)}
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            >
              <option value="">Sin cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="editar-proyecto-tipo" className="text-sm font-medium text-text-muted">
              Tipo de proyecto
            </label>
            <select
              id="editar-proyecto-tipo"
              value={form.tipoProyecto}
              onChange={(e) => set('tipoProyecto', e.target.value)}
              className="w-full min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            >
              {TIPOS_PROYECTO.map((t) => (
                <option key={t.codigo} value={t.codigo}>{t.label}</option>
              ))}
            </select>
          </div>

          <InputField
            label="Dirección de obra"
            value={form.direccionObra}
            onChange={(e) => set('direccionObra', e.target.value)}
            placeholder="Ej: Cra 15 #123-45, Bogotá"
          />

          <div className="flex flex-col gap-2">
            <label htmlFor="editar-proyecto-descripcion" className="text-sm font-medium text-text-muted">
              Descripción semántica
            </label>
            <textarea
              id="editar-proyecto-descripcion"
              value={form.descripcionSemantica}
              onChange={(e) => set('descripcionSemantica', e.target.value)}
              placeholder="Ej: Cocina integral con isla central y muebles altos"
              rows={3}
              className="w-full rounded-sm border border-border-subtle bg-bg-paper px-3 py-2 text-base text-text-primary outline-none focus:border-brand focus:shadow-ring-focus"
            />
          </div>

          <InputField
            label="Días de entrega estimados"
            type="number"
            min={0}
            value={form.diasEntregaEstimados}
            onChange={(e) => set('diasEntregaEstimados', e.target.value)}
            placeholder="Ej: 45"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <MoneyInput
              label="Costos operativos"
              value={form.costosOperativos}
              onChange={(v) => set('costosOperativos', v)}
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

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => guardGuardar(guardar)}
            disabled={!form.nombreProyecto.trim() || guardando}
            loading={guardando}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}