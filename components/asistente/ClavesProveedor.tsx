'use client';

import { useState } from 'react';
import { Button } from '@/components/veta/button';
import { InputField } from '@/components/veta/input-field';
import { CLAVE_MIN_CARACTERES, ETIQUETA_MAX_CARACTERES } from '@/lib/asistente/opciones-configuracion';
import { llamarAsistente } from './api';

export interface ClaveVista {
  id: string;
  proveedor: string;
  etiqueta: string;
  ultimos4: string;
  estado: string;
  orden: number;
}

interface Props {
  claves: ClaveVista[];
  onCambio: () => Promise<void>;
}

/** Único campo de texto del panel: la clave del proveedor (secreto). La etiqueta es opcional y corta. */
export function ClavesProveedor({ claves, onCambio }: Props) {
  const [etiqueta, setEtiqueta] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const claveCorta = clave.length > 0 && clave.length < CLAVE_MIN_CARACTERES;

  async function agregar() {
    setError(null);
    setAviso(null);
    const r = await llamarAsistente<{ clave: ClaveVista }>('/api/asistente/claves', {
      method: 'POST',
      body: JSON.stringify({ proveedor: 'openrouter', etiqueta, clave }),
    });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo guardar la clave.');
      return;
    }
    setEtiqueta('');
    setClave('');
    setAviso('Clave guardada. Solo se muestran los últimos 4 caracteres.');
    await onCambio();
  }

  async function eliminar(id: string) {
    setError(null);
    setAviso(null);
    const r = await llamarAsistente<{ ok: boolean }>(`/api/asistente/claves?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo eliminar la clave.');
      return;
    }
    await onCambio();
  }

  return (
    <section className="flex flex-col gap-3" aria-labelledby="claves-titulo">
      <h3 id="claves-titulo" className="font-semibold text-text-heading">Claves de proveedor</h3>
      {aviso && <p role="status" className="text-sm text-text-primary">{aviso}</p>}
      {error && <p role="alert" className="text-sm text-error-stroke">{error}</p>}
      <ul className="flex flex-col gap-2">
        {claves.length === 0 && <li className="text-sm text-text-muted">No hay claves configuradas.</li>}
        {claves.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-border-subtle p-3 text-sm">
            <span className="font-medium">{c.etiqueta || c.proveedor}</span>
            <span className="text-text-muted">{c.proveedor}</span>
            <span className="text-text-muted">••••{c.ultimos4}</span>
            <span className="text-text-muted">{c.estado}</span>
            <Button variant="destructive" size="md" className="ml-auto" onClick={() => void eliminar(c.id)}>
              Eliminar clave {c.etiqueta || c.proveedor}
            </Button>
          </li>
        ))}
      </ul>
      <div className="grid gap-3 sm:grid-cols-2">
        <InputField
          label="Etiqueta (opcional)"
          maxLength={ETIQUETA_MAX_CARACTERES}
          autoComplete="off"
          value={etiqueta}
          onChange={(e) => setEtiqueta(e.target.value)}
        />
        <InputField
          label="Clave del proveedor (no se volverá a mostrar)"
          type="password"
          autoComplete="new-password"
          minLength={CLAVE_MIN_CARACTERES}
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          error={claveCorta ? `Mínimo ${CLAVE_MIN_CARACTERES} caracteres` : undefined}
        />
      </div>
      <Button
        size="md"
        className="self-start"
        onClick={() => void agregar()}
        disabled={clave.length < CLAVE_MIN_CARACTERES}
      >
        Agregar clave
      </Button>
    </section>
  );
}
