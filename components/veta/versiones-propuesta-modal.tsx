"use client";

import { useState } from "react";
import { Button } from "@/components/veta/button";
import { InputField } from "@/components/veta/input-field";
import { formatRelativeDate } from "@/lib/utils/format";
import {
  useVersionesPropuesta,
  usePublicarPropuestaMutation,
  useEliminarVersionPropuestaMutation,
} from "@/lib/data/queries/useCotizadorQueries";

export interface VersionesPropuestaModalProps {
  proyectoId: string;
  onClose: () => void;
}

/**
 * Control de versiones de la propuesta pública (2026-09-11, pedido de Javier tras el
 * lanzamiento del versionado insert-only: "necesitamos preview y control de versiones más
 * amigable con el empleado"). Consolida en un solo lugar lo que antes era un único botón
 * "Publicar/Crear nueva versión" sin contexto:
 * - Preview sin guardar (previsualizarPropuestaPublicaAction, vía ?preview=1) — ver cómo
 *   quedaría antes de decidir si vale la pena congelar una versión nueva.
 * - Histórico con nombre libre por versión (evita depender solo de "v3", "v7"...).
 * - Eliminar una versión puntual — limpia versiones de prueba que podrían contaminar el
 *   histórico que ve el cliente final (insert-only sigue intacto para las que quedan).
 */
export function VersionesPropuestaModal({ proyectoId, onClose }: VersionesPropuestaModalProps) {
  const { data: versiones, isLoading } = useVersionesPropuesta(proyectoId);
  const publicar = usePublicarPropuestaMutation(proyectoId);
  const eliminar = useEliminarVersionPropuestaMutation(proyectoId);
  const [nombreNueva, setNombreNueva] = useState("");
  const [eliminandoId, setEliminandoId] = useState<string | null>(null);

  const versionesDesc = [...(versiones ?? [])].sort((a, b) => b.version - a.version);
  const hayVersiones = versionesDesc.length > 0;

  const crearVersion = async () => {
    await publicar.mutateAsync(nombreNueva.trim() || undefined);
    setNombreNueva("");
  };

  const eliminarVersion = async (id: string, version: number) => {
    if (!window.confirm(`¿Eliminar la versión ${version}? El cliente ya no podrá verla en su histórico. Esta acción no se puede deshacer.`)) return;
    setEliminandoId(id);
    try {
      await eliminar.mutateAsync(id);
    } finally {
      setEliminandoId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="versiones-propuesta-title">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-border-subtle bg-bg-paper p-6 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <h2 id="versiones-propuesta-title" className="font-display text-lg font-semibold text-text-heading">
            Versiones de la propuesta pública
          </h2>
          <Button variant="ghost" size="md" onClick={onClose} aria-label="Cerrar">✕</Button>
        </div>
        <p className="mb-4 text-xs text-text-muted">
          El cliente siempre ve la última versión publicada — editar la cotización no cambia lo que ya vio hasta que se cree una versión nueva.
        </p>

        <Button
          variant="secondary"
          size="md"
          className="mb-4 w-full justify-center"
          onClick={() => window.open(`/propuesta/${proyectoId}?preview=1`, '_blank')}
        >
          👁 Preview sin guardar
        </Button>

        <div className="rounded-md border border-border-subtle">
          <p className="border-b border-border-subtle bg-bg-alt/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
            Histórico ({versionesDesc.length})
          </p>
          {isLoading ? (
            <p className="px-3 py-3 text-sm text-text-muted">Cargando…</p>
          ) : !hayVersiones ? (
            <p className="px-3 py-3 text-sm text-text-muted italic">Todavía no se ha publicado ninguna versión.</p>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {versionesDesc.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text-heading">
                      v{v.version}{v.nombre ? ` · ${v.nombre}` : ''}
                    </p>
                    <p className="text-xs text-text-muted">publicada {formatRelativeDate(v.publicadaEn)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="md"
                      className="h-7 px-2 text-xs"
                      onClick={() => window.open(`/propuesta/${proyectoId}?version=${v.version}`, '_blank')}
                    >
                      Ver
                    </Button>
                    <Button
                      variant="ghost"
                      size="md"
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600"
                      onClick={() => eliminarVersion(v.id, v.version)}
                      loading={eliminandoId === v.id}
                      aria-label={`Eliminar versión ${v.version}`}
                    >
                      🗑
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <InputField
            label="Nombre de la nueva versión (opcional)"
            value={nombreNueva}
            onChange={(e) => setNombreNueva(e.target.value)}
            placeholder="Ej: Ajuste post-reunión con cliente"
          />
          <Button
            variant="primary"
            size="md"
            className="w-full justify-center"
            onClick={() => void crearVersion()}
            loading={publicar.isPending}
          >
            {hayVersiones ? 'Crear nueva versión' : 'Publicar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
