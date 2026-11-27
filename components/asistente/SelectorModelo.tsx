'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { llamarAsistente } from './api';
import { CLASE_CONTROL, coincide, type FormularioConfiguracion, type ModeloLista, textoPrecio } from './configuracion-formulario';

const PENDIENTE = 'Listado pendiente de verificación';

interface Props {
  formulario: FormularioConfiguracion;
  modelos: ModeloLista[] | null;
  onCambio: (cambios: Partial<FormularioConfiguracion>) => void;
  onModelos: (modelos: ModeloLista[] | null) => void;
}

/**
 * Proveedor y modelo. El modelo solo se elige de la lista que devuelve el servidor (S1): no hay
 * entrada libre. El cuadro de búsqueda solo filtra la lista; no guarda nada.
 */
export function SelectorModelo({ formulario, modelos, onCambio, onModelos }: Props) {
  const idProveedor = useId();
  const idBusqueda = useId();
  const idModelo = useId();
  const idAviso = useId();
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (formulario.proveedor !== 'openrouter') return;
    let vigente = true;
    setCargando(true);
    void (async () => {
      const r = await llamarAsistente<{ modelos: ModeloLista[] }>(`/api/asistente/proveedores/${formulario.proveedor}/modelos`);
      if (!vigente) return;
      setCargando(false);
      const lista = r.data.modelos ?? [];
      if (r.ok) {
        onModelos(lista);
        setAviso(null);
      } else {
        // Con caché previa el servidor devuelve la última lista; la mostramos marcada como no actualizada.
        onModelos(lista.length > 0 ? lista : null);
        setAviso(r.data.error ?? 'No se pudo cargar el catálogo de modelos.');
      }
    })();
    return () => {
      vigente = false;
    };
    // El catálogo se pide una vez por proveedor; onModelos lo mantiene el padre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formulario.proveedor]);

  const visibles = useMemo(() => {
    const lista = modelos ?? [];
    const filtrada = lista.filter((m) => coincide(m, busqueda) || m.id === formulario.modelo);
    return {
      gratis: filtrada.filter((m) => m.gratis),
      pago: filtrada.filter((m) => !m.gratis),
    };
  }, [modelos, busqueda, formulario.modelo]);

  const seleccionado = modelos?.find((m) => m.id === formulario.modelo) ?? null;
  const sinCoincidencias = modelos !== null && visibles.gratis.length + visibles.pago.length === 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor={idProveedor} className="text-sm font-medium text-text-muted">
          Proveedor del modelo
        </label>
        <select
          id={idProveedor}
          value={formulario.proveedor}
          onChange={(e) => onCambio({ proveedor: e.target.value, modelo: '' })}
          className={CLASE_CONTROL}
        >
          <option value="openrouter">OpenRouter</option>
          <option value="anthropic" disabled>Anthropic ({PENDIENTE})</option>
          <option value="google" disabled>Google ({PENDIENTE})</option>
        </select>
      </div>

      {formulario.proveedor === 'openrouter' ? (
        <>
          <div className="flex flex-col gap-2">
            <label htmlFor={idBusqueda} className="text-sm font-medium text-text-muted">
              Buscar modelo (filtra la lista, no escribe el modelo)
            </label>
            <input
              id={idBusqueda}
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              disabled={modelos === null}
              className={CLASE_CONTROL}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={idModelo} className="text-sm font-medium text-text-muted">
              Modelo
            </label>
            <select
              id={idModelo}
              value={formulario.modelo}
              onChange={(e) => onCambio({ modelo: e.target.value })}
              disabled={modelos === null || cargando}
              aria-describedby={aviso ? idAviso : undefined}
              className={CLASE_CONTROL}
            >
              <option value="">{cargando ? 'Cargando modelos…' : 'Elige un modelo'}</option>
              {visibles.gratis.length > 0 && (
                <optgroup label="Gratis">
                  {visibles.gratis.map((m) => (
                    <option key={m.id} value={m.id}>{`${m.nombre} — ${textoPrecio(m)} · contexto ${m.contexto.toLocaleString('es')}`}</option>
                  ))}
                </optgroup>
              )}
              {visibles.pago.length > 0 && (
                <optgroup label="De pago">
                  {visibles.pago.map((m) => (
                    <option key={m.id} value={m.id}>{`${m.nombre} — ${textoPrecio(m)} · contexto ${m.contexto.toLocaleString('es')}`}</option>
                  ))}
                </optgroup>
              )}
            </select>
            {sinCoincidencias && <p className="text-sm text-text-muted">Ningún modelo coincide con la búsqueda.</p>}
            {seleccionado && (
              <p className="text-sm text-text-muted">
                Precio del modelo elegido: {textoPrecio(seleccionado)}. Los precios se toman del catálogo y no se pueden editar.
              </p>
            )}
            {aviso && (
              <p id={idAviso} role="status" className="text-sm text-text-muted">
                {aviso}
              </p>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-text-muted">{PENDIENTE}.</p>
      )}
    </div>
  );
}
