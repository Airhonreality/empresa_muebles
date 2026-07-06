'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRightLeft, CheckCircle2, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { processEvents } from '@/lib/agnostic/eventProcessor';
import { useMateriaStore } from '@/lib/agnostic/store';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type MovimientoRecord = {
  fecha?: string;
  descripcion?: string;
  tipo?: string;
  monto?: number;
  estado?: string;
  cuenta_origen_id?: string;
  cuenta_destino_id?: string;
  obligacion_id?: string;
  proyecto_id?: string;
  comprobante_ref?: string;
  descripcion_semantica?: string;
};

type ObligacionRecord = {
  descripcion?: string;
  tipo?: 'por_pagar' | 'por_cobrar';
  monto_total?: number;
  monto_pagado?: number;
  estado?: string;
  proveedor_id?: string;
  usuario_id?: string;
  proyecto_id?: string;
  contrato_id?: string;
  fecha_vencimiento?: string;
};

type CuentaRecord = {
  nombre?: string;
  saldo_actual?: number;
  saldo_inicial?: number;
};

const currency = (value: unknown) =>
  Number(value || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  });

const normalizeRecords = <T,>(payload: unknown): RecordItem<T>[] => {
  const source = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as { records?: unknown[] })?.records)
      ? (payload as { records: unknown[] }).records
      : [];

  return source.map((item) => {
    const record = item as RecordItem<T>;
    return { ...record, ...(record.data || {}), id: record.id };
  });
};

async function zapCall(zap: string, payload: Record<string, unknown>) {
  const res = await fetch('/api/engine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zap, payload })
  });
  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || 'No se pudo conciliar.');
  }
  if (Array.isArray(data.events)) {
    await processEvents(data.events, useMateriaStore.getState().updateItem);
  }
}

export default function ConciliacionBancaria({ onRefresh }: { onRefresh?: () => Promise<void> | void }) {
  const [movimientos, setMovimientos] = useState<RecordItem<MovimientoRecord>[]>([]);
  const [obligaciones, setObligaciones] = useState<RecordItem<ObligacionRecord>[]>([]);
  const [cuentas, setCuentas] = useState<RecordItem<CuentaRecord>[]>([]);
  const [search, setSearch] = useState('');
  const [selectedMovimientoId, setSelectedMovimientoId] = useState('');
  const [selectedObligacionId, setSelectedObligacionId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [movimientosRes, obligacionesRes, cuentasRes] = await Promise.all([
        fetch('/api/vault?namespace=movimientos_financieros', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=obligaciones_pendientes', { cache: 'no-store' }).then((r) => r.json()),
        fetch('/api/vault?namespace=cuentas_financieras', { cache: 'no-store' }).then((r) => r.json())
      ]);

      setMovimientos(normalizeRecords<MovimientoRecord>(movimientosRes));
      setObligaciones(normalizeRecords<ObligacionRecord>(obligacionesRes));
      setCuentas(normalizeRecords<CuentaRecord>(cuentasRes));
    } catch {
      toast.error('No se pudo cargar la conciliacion.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cuentasById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const cuenta of cuentas) {
      map[cuenta.id] = cuenta.nombre || 'Cuenta';
    }
    return map;
  }, [cuentas]);

  const filteredMovimientos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...movimientos]
      .filter((movimiento) => movimiento.estado !== 'anulado')
      .filter((movimiento) => movimiento.tipo !== 'transferencia')
      .filter((movimiento) => {
        if (!term) return true;
        return [movimiento.descripcion, movimiento.comprobante_ref, movimiento.proyecto_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  }, [movimientos, search]);

  const filteredObligaciones = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...obligaciones]
      .filter((obligacion) => obligacion.tipo === 'por_pagar')
      .filter((obligacion) => obligacion.estado !== 'pagado' && obligacion.estado !== 'anulado')
      .filter((obligacion) => {
        if (!term) return true;
        return [obligacion.descripcion, obligacion.proyecto_id, obligacion.contrato_id]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(term));
      })
      .sort((a, b) => String(b.fecha_vencimiento || '').localeCompare(String(a.fecha_vencimiento || '')));
  }, [obligaciones, search]);

  const selectedMovimiento = movimientos.find((item) => item.id === selectedMovimientoId) || null;
  const selectedObligacion = obligaciones.find((item) => item.id === selectedObligacionId) || null;

  const handleConciliar = async () => {
    if (!selectedMovimientoId || !selectedObligacionId) {
      toast.error('Selecciona un movimiento y una obligacion.');
      return;
    }

    setIsProcessing(true);
    try {
      await zapCall('zap_conciliar_movimiento', {
        movimiento_id: selectedMovimientoId,
        obligacion_id: selectedObligacionId
      });
      toast.success('Conciliacion ejecutada.');
      setSelectedMovimientoId('');
      setSelectedObligacionId('');
      await loadData();
      await onRefresh?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo conciliar.');
    } finally {
      setIsProcessing(false);
    }
  };

  const totalMovimientos = useMemo(
    () => filteredMovimientos.reduce((sum, movimiento) => sum + Number(movimiento.monto || 0), 0),
    [filteredMovimientos]
  );

  const totalObligaciones = useMemo(
    () =>
      filteredObligaciones.reduce(
        (sum, obligacion) => sum + Math.max(0, Number(obligacion.monto_total || 0) - Number(obligacion.monto_pagado || 0)),
        0
      ),
    [filteredObligaciones]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-stone-500">Conciliacion bancaria</p>
          <h3 className="mt-1 text-lg font-black text-stone-950">Movimientos vs obligaciones</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </Button>
          <Button
            onClick={handleConciliar}
            disabled={isProcessing || !selectedMovimientoId || !selectedObligacionId}
            className="gap-2"
          >
            <ArrowRightLeft className="h-4 w-4" />
            {isProcessing ? 'Conciliando...' : 'Conciliar seleccionados'}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Movimientos" value={filteredMovimientos.length.toLocaleString('es-CO')} detail={currency(totalMovimientos)} />
        <MetricCard title="Obligaciones" value={filteredObligaciones.length.toLocaleString('es-CO')} detail={currency(totalObligaciones)} />
        <MetricCard title="Seleccion movimiento" value={selectedMovimiento ? '1' : '0'} detail={selectedMovimiento?.descripcion || 'Sin seleccion'} />
        <MetricCard title="Seleccion obligacion" value={selectedObligacion ? '1' : '0'} detail={selectedObligacion?.descripcion || 'Sin seleccion'} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base">Movimientos bancarios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-3 py-2">
              <Search className="h-4 w-4 text-stone-500" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar movimiento"
                className="border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <EmptyState text="Cargando movimientos..." />
              ) : filteredMovimientos.length === 0 ? (
                <EmptyState text="No hay movimientos para conciliar." />
              ) : (
                filteredMovimientos.map((movimiento) => {
                  const isSelected = selectedMovimientoId === movimiento.id;
                  const accountName =
                    cuentasById[movimiento.cuenta_origen_id || ''] || cuentasById[movimiento.cuenta_destino_id || ''] || 'Cuenta';
                  return (
                    <button
                      key={movimiento.id}
                      type="button"
                      onClick={() => setSelectedMovimientoId(movimiento.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-stone-950">{movimiento.descripcion || 'Movimiento'}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {movimiento.fecha || 'sin fecha'} · {accountName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-black text-stone-950">{currency(movimiento.monto)}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-500">
                            {movimiento.tipo || 'movimiento'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-stone-200">
          <CardHeader>
            <CardTitle className="text-base">Obligaciones pendientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {isLoading ? (
                <EmptyState text="Cargando obligaciones..." />
              ) : filteredObligaciones.length === 0 ? (
                <EmptyState text="No hay obligaciones por pagar pendientes." />
              ) : (
                filteredObligaciones.map((obligacion) => {
                  const isSelected = selectedObligacionId === obligacion.id;
                  const saldo = Math.max(0, Number(obligacion.monto_total || 0) - Number(obligacion.monto_pagado || 0));
                  return (
                    <button
                      key={obligacion.id}
                      type="button"
                      onClick={() => setSelectedObligacionId(obligacion.id)}
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected ? 'border-sky-500 bg-sky-50' : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-stone-950">{obligacion.descripcion || 'Obligacion'}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            Vence {obligacion.fecha_vencimiento || 'sin fecha'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono text-sm font-black text-rose-700">{currency(saldo)}</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-stone-500">
                            {obligacion.estado || 'pendiente'}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-stone-500">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Seleccion actual
              </div>
              <div className="mt-3 grid gap-2 text-sm">
                <SelectionLine label="Movimiento" value={selectedMovimiento?.descripcion || 'Sin seleccionar'} />
                <SelectionLine label="Obligacion" value={selectedObligacion?.descripcion || 'Sin seleccionar'} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <Card className="border-stone-200">
      <CardContent className="p-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">{title}</p>
        <p className="mt-2 font-mono text-2xl font-black text-stone-950">{value}</p>
        <p className="mt-1 text-xs text-stone-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function SelectionLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">{label}</span>
      <span className="truncate text-right font-semibold text-stone-950">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-sm text-stone-500">{text}</div>;
}
