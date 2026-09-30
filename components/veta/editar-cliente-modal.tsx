"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { EntityFields } from "@/components/veta/entity-fields";
import { useDataStore, type Cliente } from "@/lib/data";
import { usePendingGuard } from "@/lib/hooks/usePendingGuard";
import { clienteFormFields, datosClienteParaGuardar, valoresClienteDesde } from "@/lib/forms/cliente-form-spec";

export interface EditarClienteModalProps {
  cliente: Cliente;
  onClose: () => void;
  onSaved: () => void;
}

export function EditarClienteModal({ cliente, onClose, onSaved }: EditarClienteModalProps) {
  const store = useDataStore();
  const { guard: guardGuardar, isPending: guardando } = usePendingGuard();

  const [form, setForm] = useState(() => valoresClienteDesde(cliente));

  const guardar = async () => {
    const datos = datosClienteParaGuardar(form)
    if (!datos.nombre) return
    await store.clientes.actualizar(cliente.id, datos)
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

        <EntityFields
          className="space-y-4"
          fields={clienteFormFields}
          values={form}
          onChange={(campo, valor) => set(campo, valor)}
        />

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