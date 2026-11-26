'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/veta/button';
import { InputField } from '@/components/veta/input-field';
import { llamarAsistente } from './api';

type Proveedor = 'openrouter' | 'anthropic' | 'google';
interface ClaveVista { id: string; proveedor: Proveedor; etiqueta: string; ultimos4: string; estado: string; orden: number }
interface Config {
  modelo: { proveedor: Proveedor; modelo: string } | null;
  topes: { usuarioDiaUsd: number; globalDiaUsd: number; alertaFraccion: number } | null;
  precios: { entradaPorMillon: number; salidaPorMillon: number } | null;
  claves: ClaveVista[];
}

const PROVEEDORES: Proveedor[] = ['openrouter', 'anthropic', 'google'];

/** Solo se monta para admin. Las claves nunca vuelven: solo se ven los últimos 4 caracteres. */
export function PanelConfiguracion() {
  const [config, setConfig] = useState<Config | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nuevaClave, setNuevaClave] = useState({ proveedor: 'openrouter' as Proveedor, etiqueta: '', clave: '' });
  const [modelo, setModelo] = useState({ proveedor: 'openrouter' as Proveedor, modelo: '' });
  const [topes, setTopes] = useState({ usuarioDiaUsd: '', globalDiaUsd: '', alertaFraccion: '0.8' });
  const [precios, setPrecios] = useState({ entradaPorMillon: '', salidaPorMillon: '' });

  async function cargar() {
    const r = await llamarAsistente<{ configuracion: Config }>('/api/asistente/configuracion');
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo cargar la configuración.');
      return;
    }
    const c = r.data.configuracion;
    setConfig(c);
    if (c.modelo) setModelo({ proveedor: c.modelo.proveedor, modelo: c.modelo.modelo });
    if (c.topes) setTopes({ usuarioDiaUsd: String(c.topes.usuarioDiaUsd), globalDiaUsd: String(c.topes.globalDiaUsd), alertaFraccion: String(c.topes.alertaFraccion) });
    if (c.precios) setPrecios({ entradaPorMillon: String(c.precios.entradaPorMillon), salidaPorMillon: String(c.precios.salidaPorMillon) });
  }

  useEffect(() => {
    void cargar();
  }, []);

  async function agregarClave() {
    setError(null);
    setAviso(null);
    const r = await llamarAsistente<{ clave: ClaveVista }>('/api/asistente/claves', { method: 'POST', body: JSON.stringify(nuevaClave) });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo guardar la clave.');
      return;
    }
    setNuevaClave({ proveedor: nuevaClave.proveedor, etiqueta: '', clave: '' });
    setAviso('Clave guardada. Solo se muestran los últimos 4 caracteres.');
    await cargar();
  }

  async function eliminarClave(id: string) {
    setError(null);
    const r = await llamarAsistente<{ ok: boolean }>(`/api/asistente/claves?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo eliminar la clave.');
      return;
    }
    await cargar();
  }

  async function guardarParametros() {
    setError(null);
    setAviso(null);
    const cuerpo: Record<string, unknown> = {};
    if (modelo.modelo.trim()) cuerpo.modelo = { proveedor: modelo.proveedor, modelo: modelo.modelo.trim() };
    if (topes.usuarioDiaUsd !== '' && topes.globalDiaUsd !== '') {
      cuerpo.topes = { usuarioDiaUsd: Number(topes.usuarioDiaUsd), globalDiaUsd: Number(topes.globalDiaUsd), alertaFraccion: Number(topes.alertaFraccion) };
    }
    if (precios.entradaPorMillon !== '' && precios.salidaPorMillon !== '') {
      cuerpo.precios = { entradaPorMillon: Number(precios.entradaPorMillon), salidaPorMillon: Number(precios.salidaPorMillon) };
    }
    const r = await llamarAsistente<{ ok: boolean }>('/api/asistente/configuracion', { method: 'PUT', body: JSON.stringify(cuerpo) });
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo guardar la configuración.');
      return;
    }
    setAviso('Configuración guardada.');
    await cargar();
  }

  const sinTopes = config !== null && config.topes === null;

  return (
    <div className="flex flex-col gap-6">
      {sinTopes && (
        <p role="status" className="rounded-sm border border-border-subtle px-3 py-2 text-sm text-text-primary">
          Configura los topes de gasto antes de usar el chat. Sin topes, el asistente no llama al modelo.
        </p>
      )}
      {aviso && <p role="status" className="text-sm text-text-primary">{aviso}</p>}
      {error && <p role="alert" className="text-sm text-error-stroke">{error}</p>}

      <section className="flex flex-col gap-3" aria-labelledby="claves-titulo">
        <h3 id="claves-titulo" className="font-semibold text-text-heading">Claves de proveedor</h3>
        <ul className="flex flex-col gap-2">
          {config?.claves.length === 0 && <li className="text-sm text-text-muted">No hay claves configuradas.</li>}
          {config?.claves.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-sm border border-border-subtle p-3 text-sm">
              <span className="font-medium">{c.etiqueta}</span>
              <span className="text-text-muted">{c.proveedor}</span>
              <span className="text-text-muted">••••{c.ultimos4}</span>
              <span className="text-text-muted">{c.estado}</span>
              <Button variant="destructive" size="md" className="ml-auto" onClick={() => void eliminarClave(c.id)}>Eliminar</Button>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-text-muted">
            Proveedor
            <select
              value={nuevaClave.proveedor}
              onChange={(e) => setNuevaClave({ ...nuevaClave, proveedor: e.target.value as Proveedor })}
              className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-text-primary"
            >
              {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <InputField label="Etiqueta" value={nuevaClave.etiqueta} onChange={(e) => setNuevaClave({ ...nuevaClave, etiqueta: e.target.value })} />
          <InputField label="Clave (no se volverá a mostrar)" type="password" autoComplete="off" value={nuevaClave.clave} onChange={(e) => setNuevaClave({ ...nuevaClave, clave: e.target.value })} />
        </div>
        <Button size="md" className="self-start" onClick={() => void agregarClave()} disabled={!nuevaClave.etiqueta || nuevaClave.clave.length < 10}>
          Agregar clave
        </Button>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="modelo-titulo">
        <h3 id="modelo-titulo" className="font-semibold text-text-heading">Modelo y topes de gasto (USD)</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-text-muted">
            Proveedor del modelo
            <select value={modelo.proveedor} onChange={(e) => setModelo({ ...modelo, proveedor: e.target.value as Proveedor })} className="min-h-[44px] rounded-sm border border-border-subtle bg-bg-paper px-3 text-text-primary">
              {PROVEEDORES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <InputField label="Identificador del modelo" value={modelo.modelo} onChange={(e) => setModelo({ ...modelo, modelo: e.target.value })} />
          <InputField label="Tope diario por usuario" type="number" min="0" step="0.01" value={topes.usuarioDiaUsd} onChange={(e) => setTopes({ ...topes, usuarioDiaUsd: e.target.value })} />
          <InputField label="Tope diario global" type="number" min="0" step="0.01" value={topes.globalDiaUsd} onChange={(e) => setTopes({ ...topes, globalDiaUsd: e.target.value })} />
          <InputField label="Alerta (fracción: 0.8 = 80%)" type="number" min="0" max="1" step="0.05" value={topes.alertaFraccion} onChange={(e) => setTopes({ ...topes, alertaFraccion: e.target.value })} />
          <InputField label="Precio entrada por millón de tokens" type="number" min="0" step="0.0001" value={precios.entradaPorMillon} onChange={(e) => setPrecios({ ...precios, entradaPorMillon: e.target.value })} />
          <InputField label="Precio salida por millón de tokens" type="number" min="0" step="0.0001" value={precios.salidaPorMillon} onChange={(e) => setPrecios({ ...precios, salidaPorMillon: e.target.value })} />
        </div>
        <Button size="md" className="self-start" onClick={() => void guardarParametros()}>Guardar configuración</Button>
      </section>
    </div>
  );
}
