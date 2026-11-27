'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/veta/button';
import { ClavesProveedor, type ClaveVista } from './ClavesProveedor';
import { llamarAsistente } from './api';
import { ParametrosModelo, type HerramientaHabilitable } from './ParametrosModelo';
import { SelectorModelo } from './SelectorModelo';
import {
  aCuerpo,
  erroresFormulario,
  FORMULARIO_VACIO,
  type FormularioConfiguracion,
  type ModeloLista,
} from './configuracion-formulario';

/** Forma de GET /api/asistente/configuracion (solo lo que el panel usa). */
interface ConfiguracionVista {
  modelo: { proveedor: string; modelo: string } | null;
  temperatura: number | null;
  maxTokensRespuesta: number | null;
  pasosMaximos: number | null;
  herramientasHabilitadas: string[];
  topes: { usuarioDiaUsd: number; globalDiaUsd: number; alertaFraccion: number } | null;
  claves: ClaveVista[];
  herramientasDisponibles: HerramientaHabilitable[];
}

/** Solo se monta para admin. Las claves nunca vuelven: solo se ven los últimos 4 caracteres. */
export function PanelConfiguracion() {
  const [claves, setClaves] = useState<ClaveVista[]>([]);
  const [herramientas, setHerramientas] = useState<HerramientaHabilitable[]>([]);
  const [sinTopes, setSinTopes] = useState(false);
  const [formulario, setFormulario] = useState<FormularioConfiguracion>(FORMULARIO_VACIO);
  const [modelos, setModelos] = useState<ModeloLista[] | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    const r = await llamarAsistente<{ configuracion: ConfiguracionVista }>('/api/asistente/configuracion');
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo cargar la configuración.');
      return;
    }
    const c = r.data.configuracion;
    setClaves(c.claves);
    setHerramientas(c.herramientasDisponibles);
    setSinTopes(c.topes === null);
    setFormulario({
      proveedor: c.modelo?.proveedor ?? 'openrouter',
      modelo: c.modelo?.modelo ?? '',
      temperatura: c.temperatura === null ? '' : String(c.temperatura),
      maxTokensRespuesta: c.maxTokensRespuesta === null ? '' : String(c.maxTokensRespuesta),
      pasosMaximos: c.pasosMaximos === null ? '' : String(c.pasosMaximos),
      topeDiarioUsuarioUsd: c.topes ? String(c.topes.usuarioDiaUsd) : '',
      topeDiarioGlobalUsd: c.topes ? String(c.topes.globalDiaUsd) : '',
      alertaFraccion: c.topes ? String(c.topes.alertaFraccion) : '',
      herramientasHabilitadas: c.herramientasHabilitadas,
    });
  }

  useEffect(() => {
    void cargar();
  }, []);

  function cambiar(cambios: Partial<FormularioConfiguracion>) {
    setFormulario((previo) => ({ ...previo, ...cambios }));
    setAviso(null);
    setError(null);
  }

  async function guardar() {
    setError(null);
    setAviso(null);
    setGuardando(true);
    const r = await llamarAsistente<{ ok: boolean }>('/api/asistente/configuracion', {
      method: 'PUT',
      body: JSON.stringify(aCuerpo(formulario)),
    });
    setGuardando(false);
    if (!r.ok) {
      setError(r.data.error ?? 'No se pudo guardar la configuración.');
      return;
    }
    setAviso('Configuración guardada.');
    await cargar();
  }

  const errores = erroresFormulario(formulario, modelos);
  const puedeGuardar = errores.length === 0 && !guardando;

  return (
    <div className="flex flex-col gap-8">
      {sinTopes && (
        <p role="status" className="rounded-sm border border-border-subtle px-3 py-2 text-sm text-text-primary">
          Configura los topes de gasto antes de usar el chat. Sin topes, el asistente no llama al modelo.
        </p>
      )}
      {aviso && <p role="status" className="text-sm text-text-primary">{aviso}</p>}
      {error && <p role="alert" className="text-sm text-error-stroke">{error}</p>}

      <ClavesProveedor claves={claves} onCambio={cargar} />

      <section className="flex flex-col gap-6" aria-labelledby="modelo-titulo">
        <h3 id="modelo-titulo" className="font-semibold text-text-heading">Modelo y parámetros</h3>
        <SelectorModelo formulario={formulario} modelos={modelos} onCambio={cambiar} onModelos={setModelos} />
        <ParametrosModelo formulario={formulario} herramientas={herramientas} onCambio={cambiar} />

        {errores.length > 0 && (
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-text-heading">Antes de guardar:</p>
            <ul className="list-disc pl-5 text-sm text-text-muted">
              {errores.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}
        <Button size="md" className="self-start" onClick={() => void guardar()} disabled={!puedeGuardar}>
          {guardando ? 'Guardando…' : 'Guardar configuración'}
        </Button>
      </section>
    </div>
  );
}
