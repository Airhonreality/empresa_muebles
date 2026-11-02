'use client';

import type { CuentaFinanciera } from '@/lib/data';

interface FiltrosLibroProps {
  cuentas: CuentaFinanciera[];
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtroMes: string;
  setFiltroMes: (v: string) => void;
  filtroTipo: 'todos' | 'debito' | 'credito';
  setFiltroTipo: (v: 'todos' | 'debito' | 'credito') => void;
  filtroEstado: 'todos' | 'asentado' | 'anulado';
  setFiltroEstado: (v: 'todos' | 'asentado' | 'anulado') => void;
  filtroCuenta: string;
  setFiltroCuenta: (v: string) => void;
}

const inputBase =
  "min-h-[44px] px-3 rounded-md border border-border-subtle bg-bg-paper text-text-heading text-sm focus:border-gold-400 focus:outline-none";

export function FiltrosLibro({
  cuentas,
  busqueda,
  setBusqueda,
  filtroMes,
  setFiltroMes,
  filtroTipo,
  setFiltroTipo,
  filtroEstado,
  setFiltroEstado,
  filtroCuenta,
  setFiltroCuenta,
}: FiltrosLibroProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-3">
      <label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-xs text-text-muted lg:shrink-0">Buscar:</span>
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Descripción, proyecto o proveedor"
          className={`w-full sm:w-64 ${inputBase}`}
        />
      </label>
      <label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-xs text-text-muted lg:shrink-0">Mes:</span>
        <input
          type="month"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          className={`w-full sm:w-auto ${inputBase}`}
        />
      </label>
      <label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-xs text-text-muted lg:shrink-0">Tipo:</span>
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value as typeof filtroTipo)}
          className={`w-full sm:w-auto ${inputBase}`}
        >
          <option value="todos">Todos</option>
          <option value="debito">Egresos</option>
          <option value="credito">Ingresos</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-xs text-text-muted lg:shrink-0">Estado:</span>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
          className={`w-full sm:w-auto ${inputBase}`}
        >
          <option value="todos">Todos</option>
          <option value="asentado">Asentados</option>
          <option value="anulado">Anulados</option>
        </select>
      </label>
      <label className="flex flex-col gap-1 lg:flex-row lg:items-center lg:gap-2">
        <span className="text-xs text-text-muted lg:shrink-0">Cuenta:</span>
        <select
          value={filtroCuenta}
          onChange={(e) => setFiltroCuenta(e.target.value)}
          className={`w-full sm:w-auto ${inputBase}`}
        >
          <option value="todos">Todas</option>
          {cuentas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
