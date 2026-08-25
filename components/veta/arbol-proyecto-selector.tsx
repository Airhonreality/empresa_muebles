'use client';

import { useMemo } from 'react';
import type { Modulo } from '@/lib/data';

interface ArbolProyectoSelectorProps {
  modulos: Modulo[];
  onSelect: (moduloId: string | null) => void;
  selectedId: string | null;
  disabled?: boolean;
}

/**
 * Componente de selección de módulo del proyecto para garantía.
 * Muestra el árbol de módulos recursivo (padreId) y permite seleccionar uno.
 * Solo muestra módulos en estado 'en_instalacion' o 'aprobado' (R3 F-07).
 */
export function ArbolProyectoSelector({
  modulos,
  onSelect,
  selectedId,
  disabled = false,
}: ArbolProyectoSelectorProps) {
  // Filtrar módulos elegibles para garantía (R3: solo en_instalacion o aprobado)
  const modulosGarantia = useMemo(
    () => modulos.filter((m) => m.estado === 'en_instalacion' || m.estado === 'aprobado'),
    [modulos]
  );

  // Construir árbol: root modules (padreId === null) y sus hijos
  const rootModules = useMemo(
    () => modulosGarantia.filter((m) => m.padreId === null),
    [modulosGarantia]
  );

  const childModules = useMemo(
    () => modulosGarantia.filter((m) => m.padreId !== null),
    [modulosGarantia]
  );

  // Obtener hijos de un módulo
  const getHijos = (padreId: string): Modulo[] => {
    return childModules.filter((m) => m.padreId === padreId);
  };

  // Renderizar árbol recursivo
  function renderModulo(modulo: Modulo, depth = 0) {
    const hijos = getHijos(modulo.id);
    const hasHijos = hijos.length > 0;
    const isSelected = selectedId === modulo.id;

    return (
      <div key={modulo.id} className="ml-4">
        <div
          className={`
            flex items-center gap-2 p-1 rounded cursor-pointer transition-colors
            ${isSelected
              ? 'bg-brand/10 border border-brand/20'
              : 'hover:bg-bg-alt'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onClick={() => !disabled && onSelect(isSelected ? null : modulo.id)}
        >
          <span className="text-sm text-text-heading">{modulo.nombre}</span>
          {modulo.tipoModulo && (
            <span className="text-xs text-text-muted">({modulo.tipoModulo})</span>
          )}
        </div>
        {hasHijos && (
          <div className="ml-4 border-l border-border-subtle pl-2">
            {hijos.map((hijo) => renderModulo(hijo, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  if (modulosGarantia.length === 0) {
    return (
      <div className="text-sm text-text-muted p-2">
        No hay módulos elegibles para garantía.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {rootModules.map((modulo) => renderModulo(modulo))}
    </div>
  );
}
