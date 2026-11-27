'use client';

import { useId } from 'react';
import { CLASE_CONTROL, OPCIONES, type FormularioConfiguracion } from './configuracion-formulario';

export interface HerramientaHabilitable {
  nombre: string;
  dominio: string;
  operacion: string;
  descripcion: string;
  esEscritura: boolean;
}

interface Props {
  formulario: FormularioConfiguracion;
  herramientas: HerramientaHabilitable[];
  onCambio: (cambios: Partial<FormularioConfiguracion>) => void;
}

type CampoSelect = keyof typeof OPCIONES;

const ETIQUETAS: Record<CampoSelect, { label: string; texto: (v: number) => string }> = {
  temperatura: { label: 'Temperatura (creatividad)', texto: (v) => (v === 0 ? '0 (más precisa)' : String(v)) },
  maxTokensRespuesta: { label: 'Máximo de tokens por respuesta', texto: (v) => v.toLocaleString('es') },
  pasosMaximos: { label: 'Pasos máximos de herramientas por turno', texto: (v) => String(v) },
  topeDiarioUsuarioUsd: { label: 'Tope diario por usuario (USD)', texto: (v) => `USD ${v}` },
  topeDiarioGlobalUsd: { label: 'Tope diario global (USD)', texto: (v) => `USD ${v}` },
  alertaFraccion: { label: 'Avisar al llegar al', texto: (v) => `${Math.round(v * 100)} % del tope` },
};

/** Parámetros cerrados (selectores) y lista de herramientas (checkboxes). Ningún campo es texto libre. */
export function ParametrosModelo({ formulario, herramientas, onCambio }: Props) {
  const campos = Object.keys(ETIQUETAS) as CampoSelect[];
  const grupos = agrupar(herramientas);
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {campos.map((campo) => (
          <CampoOpcion
            key={campo}
            campo={campo}
            valor={formulario[campo]}
            etiqueta={ETIQUETAS[campo].label}
            texto={ETIQUETAS[campo].texto}
            onCambio={(valor) => onCambio({ [campo]: valor })}
          />
        ))}
      </div>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-sm font-medium text-text-muted">Herramientas que el asistente puede usar</legend>
        {herramientas.length === 0 && <p className="text-sm text-text-muted">No hay herramientas disponibles para tu rol.</p>}
        {grupos.map(([dominio, lista]) => (
          <div key={dominio} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-text-heading">{dominio}</p>
            {lista.map((h) => (
              <CasillaHerramienta
                key={h.nombre}
                herramienta={h}
                marcada={formulario.herramientasHabilitadas.includes(h.nombre)}
                onCambio={(marcada) =>
                  onCambio({
                    herramientasHabilitadas: marcada
                      ? [...formulario.herramientasHabilitadas, h.nombre]
                      : formulario.herramientasHabilitadas.filter((n) => n !== h.nombre),
                  })
                }
              />
            ))}
          </div>
        ))}
      </fieldset>
    </div>
  );
}

function CampoOpcion({
  campo,
  valor,
  etiqueta,
  texto,
  onCambio,
}: {
  campo: CampoSelect;
  valor: string;
  etiqueta: string;
  texto: (v: number) => string;
  onCambio: (valor: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-text-muted">
        {etiqueta}
      </label>
      <select id={id} name={campo} value={valor} onChange={(e) => onCambio(e.target.value)} className={CLASE_CONTROL}>
        <option value="">Elige una opción</option>
        {OPCIONES[campo].map((v) => (
          <option key={v} value={String(v)}>
            {texto(v)}
          </option>
        ))}
      </select>
    </div>
  );
}

function CasillaHerramienta({
  herramienta,
  marcada,
  onCambio,
}: {
  herramienta: HerramientaHabilitable;
  marcada: boolean;
  onCambio: (marcada: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={marcada}
        onChange={(e) => onCambio(e.target.checked)}
        className="mt-1 h-5 w-5 accent-brand focus:shadow-ring-focus"
      />
      <label htmlFor={id} className="text-sm text-text-primary">
        {herramienta.descripcion}
        {herramienta.esEscritura && <span className="text-text-muted"> (requiere confirmación del empleado)</span>}
      </label>
    </div>
  );
}

function agrupar(herramientas: HerramientaHabilitable[]): Array<[string, HerramientaHabilitable[]]> {
  const mapa = new Map<string, HerramientaHabilitable[]>();
  for (const h of herramientas) {
    mapa.set(h.dominio, [...(mapa.get(h.dominio) ?? []), h]);
  }
  return [...mapa.entries()];
}
