"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { useDataStore, type Cliente } from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";

export interface EditarClienteModalProps {
  cliente: Cliente;
  onClose: () => void;
  onSaved: () => void;
}

export function EditarClienteModal({ cliente, onClose, onSaved }: EditarClienteModalProps) {
  const store = useDataStore();
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard();

  const [form, setForm] = useState({
    nombre: cliente.nombre,
    documento: cliente.documento ?? '',
    telefono: cliente.telefono ?? '',
    email: cliente.email ?? '',
    domicilio: cliente.domicilio ?? '',
  });

  const guardar = async () => {
    const nombre = form.nombre.trim()
    if (!nombre) return
    await store.clientes.actualizar(cliente.id, {
      nombre,
      documento: form.documento.trim() || null,
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      domicilio: form.domicilio.trim() || null,
    })
    onSaved()
  }

  const set = (campo: keyof typeof form, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="editar-cliente-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border-subtle bg-bg-paper p-6 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="editar-cliente-title" className="font-display text-lg font-semibold text-text-heading">
            Editar cliente
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">✕</Button>
        </div>

        <div className="space-y-4">
          <InputField
            label="Nombre *"
            value={form.nombre}
            onChange={(e) => set('nombre', e.target.value)}
            required
          />
          <InputField
            label="Documento"
            value={form.documento}
            onChange={(e) => set('documento', e.target.value)}
            placeholder="Ej: CC-1234567890"
          />
          <InputField
            label="Teléfono"
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
            placeholder="Ej: 3001234567"
          />
          <InputField
            label="Correo electrónico"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="Ej: cliente@correo.co"
          />
          <InputField
            label="Domicilio"
            value={form.domicilio}
            onChange={(e) => set('domicilio', e.target.value)}
            placeholder="Ej: Calle 1 #2-3, Bogotá"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => guardGuardar(guardar)}
            disabled={!form.nombre.trim() || guardando}
            loading={guardando}
          >
            Guardar cambios
          </Button>
        </div>
      </div>
    </div>
  );
}