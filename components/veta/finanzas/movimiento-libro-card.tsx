'use client';

import type { MovimientoFinanciero, CuentaFinanciera } from '@/lib/data';
import { Badge } from '@/components/veta/badge';
import { Button } from '@/components/veta/button';
import Link from 'next/link';

interface MovimientoLibroCardProps {
  mov: MovimientoFinanciero;
  cuentas: CuentaFinanciera[];
  proyectoMap: Map<string, { nombreProyecto: string }>;
  proveedorMap: Map<string, { nombre: string }>;
  onEditar: (mov: MovimientoFinanciero) => void;
  onAnular: (mov: MovimientoFinanciero) => void;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function numDe(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number, decimals: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function MovimientoLibroCard({
  mov,
  cuentas,
  proyectoMap,
  proveedorMap,
  onEditar,
  onAnular,
}: MovimientoLibroCardProps) {
  const monto = numDe(mov.monto);
  const esDebito = mov.tipo === "debito";
  const esAnulado = mov.estado === "anulado";
  const cuentaId = mov.cuentaDestinoId ?? mov.cuentaOrigenId;
  const cuenta = cuentaId ? cuentas.find((c) => c.id === cuentaId) : undefined;
  const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : undefined;
  const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : undefined;
  const origenDestino = proyecto?.nombreProyecto ?? proveedor?.nombre ?? "—";

  return (
    <article className="rounded-lg border bg-bg-raised p-3 space-y-2">
      {/* Fila 1: descripción + monto */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span className="text-sm text-text-heading truncate">
          {mov.descripcion}
        </span>
        <span
          className={`font-mono text-sm font-semibold ${esAnulado ? "line-through" : ""} ${
            esDebito ? "text-red-600" : "text-emerald-600"
          }`}
        >
          {esDebito ? "−" : "+"}{formatCurrency(monto, 0)}
        </span>
      </div>

      {/* Fila 2: estado anulado + fecha */}
      <div className="flex flex-wrap items-center gap-2">
        {esAnulado && <Badge tone="neutral" dot>Anulado</Badge>}
        <span className="ml-auto text-xs text-text-muted">{formatDate(mov.fecha)}</span>
      </div>

      {/* Fila 3: proyecto/proveedor · cuenta */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-text-muted truncate">{origenDestino}</span>
        {cuenta && (
          <>
            <span className="text-text-muted/50">·</span>
            <span className="text-xs text-text-muted truncate">{cuenta.nombre}</span>
          </>
        )}
      </div>

      {/* Fila 4: comprobante + acciones */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border-subtle/40">
        {mov.comprobanteUrl ? (
          <Link
            href={mov.comprobanteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-gold-700 underline hover:text-gold-800"
          >
            Ver comprobante
          </Link>
        ) : (
          <span className="text-xs text-text-muted">—</span>
        )}
        <div className="ml-auto flex items-center gap-1">
          {!esAnulado && (
            <Button variant="ghost" size="md" onClick={() => onEditar(mov)}>
              Editar
            </Button>
          )}
          {!esAnulado && (
            <Button variant="ghost" size="md" onClick={() => onAnular(mov)}>
              Anular
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
