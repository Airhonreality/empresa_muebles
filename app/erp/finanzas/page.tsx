"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useDataStore,
  type OrigenObligacion,
  type EstadoObligacion,
  type EstadoCuentaCobro,
  type EstadoOrdenCompra,
  type MovimientoFinanciero,
} from "@/lib/data";
import { Badge } from "@/components/veta/badge";
import { Button } from "@/components/veta/button";
import { StatCard } from "@/components/veta/stat-card";
import { CuentaFinancieraModal } from "@/components/veta/cuenta-financiera-modal";
import { useToast } from "@/components/veta/toast-provider";
import {
  MovimientoFinancieroModal,
  type TipoMovimientoManual,
} from "@/components/veta/movimiento-financiero-modal";
import { formatCurrency } from "@/lib/utils/format";

const ORIGEN_OBLIGACION_LABELS: Record<OrigenObligacion, string> = {
  contrato_hito: "Cobro cliente",
  proveedor: "Pago proveedor",
  comision: "Comisión",
  nomina: "Nómina",
  diseno_3d: "Diseño 3D",
  arriendo: "Arriendo",
};

const ESTADO_OBLIGACION_LABELS: Record<EstadoObligacion, string> = {
  pendiente: "Pendiente",
  parcial: "Parcial",
  pagado: "Pagado",
  atrasada: "Atrasada",
};

const ESTADO_CUENTA_COBRO_LABELS: Record<EstadoCuentaCobro, string> = {
  emitida: "Emitida",
  vinculada: "Vinculada",
  pagada: "Pagada",
  anulada: "Anulada",
};

const ESTADO_OC_LABELS: Record<EstadoOrdenCompra, string> = {
  solicitada: "Solicitada",
  aprobada: "Aprobada",
  en_pago: "En pago",
  pagada: "Pagada",
  recibida_verificada: "Recibida verificada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("es-CO", { year: "numeric", month: "short", day: "numeric" });
}

function numDe(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function mesActual(): string {
  return new Date().toISOString().slice(0, 7);
}

export default function FinanzasPage() {
  const router = useRouter();
  const store = useDataStore();
  const { mostrarError, mostrarInfo } = useToast();
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoManual | null>(null);
  const [movimientoEditando, setMovimientoEditando] = useState<MovimientoFinanciero | null>(null);
  const [mostrarCuenta, setMostrarCuenta] = useState(false);

  const cuentas = store.cuentasFinancieras.listar();
  const movimientos = store.movimientosFinancieros.listar();
  const saldoDisponible = store.cuentasFinancieras.disponible();

  const mes = mesActual();
  const movimientosActivos = movimientos.filter((m) => m.estado !== "anulado");
  const movimientosMes = movimientosActivos.filter((m) => m.fecha.startsWith(mes));
  const entradasMes = movimientosMes
    .filter((m) => m.tipo === "credito")
    .reduce((sum, m) => sum + numDe(m.monto), 0);
  const salidasMes = movimientosMes
    .filter((m) => m.tipo === "debito")
    .reduce((sum, m) => sum + numDe(m.monto), 0);
  const resultadoMes = entradasMes - salidasMes;

  const obligacionesPendientes = store.obligacionesPendientes.listar();
  const obligacionesActivas = obligacionesPendientes.filter(
    (o) => o.estado === "pendiente" || o.estado === "parcial"
  );
  const totalObligacionesPendientes = obligacionesActivas.reduce(
    (sum, o) => sum + (numDe(o.montoTotal) - numDe(o.montoPagado)),
    0
  );

  const cuentasCobroProveedor = store.cuentasCobroProveedor.listar();
  const cuentasPendientes = cuentasCobroProveedor.filter(
    (c) => c.estado === "emitida" || c.estado === "vinculada"
  );
  const totalCuentasPendientes = cuentasPendientes.reduce(
    (sum, c) => sum + numDe(c.valor),
    0
  );

  const ordenesCompra = store.ordenesCompra.listar();
  const ordenesEnCurso = ordenesCompra.filter(
    (o) => o.estado === "en_pago" || o.estado === "aprobada"
  );
  const totalOrdenesEnCurso = ordenesEnCurso.reduce(
    (sum, o) => sum + numDe(o.montoTotal),
    0
  );

  const proyectoMap = new Map(store.proyectos.listar().map((p) => [p.id, p]));
  const proveedorMap = new Map(store.proveedores.listar().map((p) => [p.id, p]));
  const ultimosMovimientos = movimientosActivos.slice(0, 8);

  const handleAnular = async (mov: MovimientoFinanciero) => {
    if (!window.confirm(`¿Anular el movimiento "${mov.descripcion}"? Se revertirá el saldo y quedará en el libro como anulado.`)) return;
    try {
      await store.movimientosFinancieros.anular(mov.id);
      mostrarInfo("Movimiento anulado. El saldo fue revertido.");
    } catch (e) {
      mostrarError(e instanceof Error ? e.message : "No se pudo anular el movimiento.");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-text-heading">
            Módulo de Finanzas
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Libro de entradas y salidas, caja y resumen de situación financiera
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="md" onClick={() => { setMovimientoEditando(null); setTipoMovimiento("entrada"); }}>
            Registrar entrada
          </Button>
          <Button variant="primary" size="md" onClick={() => { setMovimientoEditando(null); setTipoMovimiento("salida"); }}>
            Registrar salida
          </Button>
          <Button variant="outline" size="md" onClick={() => setMostrarCuenta(true)}>
            Nueva cuenta
          </Button>
        </div>
      </header>

      {cuentas.length === 0 && (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-900">Todavía no hay una caja.</p>
            <p className="text-xs text-amber-800">
              Crea “Caja principal” para empezar a registrar entradas y salidas.
            </p>
          </div>
          <Button variant="primary" size="md" onClick={() => setMostrarCuenta(true)}>
            Crear caja principal
          </Button>
        </section>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-heading mb-4">Resumen del mes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <StatCard
              label="Saldo disponible"
              value={formatCurrency(saldoDisponible, 0)}
              tone="brand"
            />
            <details className="mt-2 text-sm cursor-pointer">
              <summary className="text-text-muted hover:text-text-heading transition-colors">
                Ver cuentas ({cuentas.length})
              </summary>
              <div className="mt-2 p-3 bg-bg-raised rounded border border-border-subtle">
                {cuentas.length === 0 ? (
                  <p className="text-text-muted text-xs">Sin cuentas registradas</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {cuentas.map((cuenta) => (
                      <li key={cuenta.id} className="flex justify-between gap-2">
                        <span className="text-text-muted">{cuenta.nombre}</span>
                        <span className="font-semibold text-text-heading">
                          {formatCurrency(numDe(cuenta.saldoActual), 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>

          <StatCard
            label="Entradas del mes"
            value={formatCurrency(entradasMes, 0)}
            tone="brand"
          />
          <StatCard
            label="Salidas del mes"
            value={formatCurrency(salidasMes, 0)}
            tone={salidasMes > 0 ? "danger" : "neutral"}
          />
          <StatCard
            label="Resultado del mes"
            value={formatCurrency(resultadoMes, 0)}
            tone={resultadoMes < 0 ? "danger" : "brand"}
          />
        </div>
      </section>

      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <h2 className="font-semibold text-text-heading">Últimos movimientos</h2>
          <Button variant="ghost" size="sm" onClick={() => router.push("/erp/finanzas/caja")}>
            Ver libro completo
          </Button>
        </div>

        {ultimosMovimientos.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-text-muted">
              Sin movimientos registrados. Usa “Registrar entrada” o “Registrar salida”.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="border-b border-border-subtle text-left px-3 py-2 font-semibold text-text-heading">Fecha</th>
                  <th className="border-b border-border-subtle text-left px-3 py-2 font-semibold text-text-heading">Descripción</th>
                  <th className="border-b border-border-subtle text-left px-3 py-2 font-semibold text-text-heading">Proyecto / proveedor</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Tipo</th>
                  <th className="border-b border-border-subtle text-right px-3 py-2 font-semibold text-text-heading">Monto</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Comprobante</th>
                  <th className="border-b border-border-subtle text-center px-3 py-2 font-semibold text-text-heading">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ultimosMovimientos.map((mov: MovimientoFinanciero) => {
                  const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : null;
                  const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : null;
                  return (
                    <tr key={mov.id} className="border-b border-border-subtle/50">
                      <td className="px-3 py-2 text-xs font-mono text-text-muted">{formatDate(mov.fecha)}</td>
                      <td className="px-3 py-2 text-text-heading">{mov.descripcion}</td>
                      <td className="px-3 py-2 text-xs text-text-muted">
                        {proyecto ? proyecto.nombreProyecto : "—"}
                        {proveedor ? ` · ${proveedor.nombre}` : ""}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge tone={mov.tipo === "debito" ? "danger" : "info"} dot>
                          {mov.tipo === "debito" ? "Salida" : "Entrada"}
                        </Badge>
                      </td>
                      <td className={`px-3 py-2 text-right font-mono ${mov.tipo === "debito" ? "text-red-600" : "text-emerald-600"}`}>
                        {mov.tipo === "debito" ? "−" : "+"}{formatCurrency(numDe(mov.monto), 0)}
                      </td>
                      <td className="px-3 py-2 text-center text-xs">
                        {mov.comprobanteUrl ? (
                          <a
                            href={mov.comprobanteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gold-700 underline hover:text-gold-800"
                          >
                            Ver
                          </a>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setMovimientoEditando(mov)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { void handleAnular(mov); }}>
                            Anular
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-heading mb-4">Pendientes</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <StatCard
              label="Obligaciones pendientes"
              value={formatCurrency(totalObligacionesPendientes, 0)}
              tone={totalObligacionesPendientes > 0 ? "danger" : "neutral"}
            />
            <details className="mt-2 text-sm cursor-pointer">
              <summary className="text-text-muted hover:text-text-heading transition-colors">
                Ver detalle ({obligacionesActivas.length})
              </summary>
              <div className="mt-2 p-3 bg-bg-raised rounded border border-border-subtle max-h-64 overflow-y-auto">
                {obligacionesActivas.length === 0 ? (
                  <p className="text-text-muted text-xs">Sin obligaciones pendientes</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {obligacionesActivas.map((obligacion) => (
                      <li key={obligacion.id} className="pb-2 border-b border-border-subtle last:border-b-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-text-heading max-w-xs truncate">
                            {obligacion.descripcion}
                          </span>
                          <span className="text-error-text font-semibold">
                            {formatCurrency(numDe(obligacion.montoTotal) - numDe(obligacion.montoPagado), 0)}
                          </span>
                        </div>
                        <div className="text-text-muted mt-1">
                          {ORIGEN_OBLIGACION_LABELS[obligacion.origen]} — {ESTADO_OBLIGACION_LABELS[obligacion.estado]}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>

          <div>
            <StatCard
              label="Cuentas de cobro pendientes"
              value={formatCurrency(totalCuentasPendientes, 0)}
              tone={totalCuentasPendientes > 0 ? "danger" : "neutral"}
            />
            <details className="mt-2 text-sm cursor-pointer">
              <summary className="text-text-muted hover:text-text-heading transition-colors">
                Ver detalle ({cuentasPendientes.length})
              </summary>
              <div className="mt-2 p-3 bg-bg-raised rounded border border-border-subtle max-h-64 overflow-y-auto">
                {cuentasPendientes.length === 0 ? (
                  <p className="text-text-muted text-xs">Sin cuentas pendientes</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {cuentasPendientes.map((cuenta) => (
                      <li key={cuenta.id} className="pb-2 border-b border-border-subtle last:border-b-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-text-heading max-w-xs truncate">
                            {cuenta.concepto}
                          </span>
                          <span className="text-error-text font-semibold">
                            {formatCurrency(numDe(cuenta.valor), 0)}
                          </span>
                        </div>
                        <div className="text-text-muted mt-1">
                          {ESTADO_CUENTA_COBRO_LABELS[cuenta.estado]}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>

          <div>
            <StatCard
              label="Órdenes de compra en curso"
              value={formatCurrency(totalOrdenesEnCurso, 0)}
              tone="neutral"
            />
            <details className="mt-2 text-sm cursor-pointer">
              <summary className="text-text-muted hover:text-text-heading transition-colors">
                Ver detalle ({ordenesEnCurso.length})
              </summary>
              <div className="mt-2 p-3 bg-bg-raised rounded border border-border-subtle max-h-64 overflow-y-auto">
                {ordenesEnCurso.length === 0 ? (
                  <p className="text-text-muted text-xs">Sin órdenes en curso</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {ordenesEnCurso.map((orden) => (
                      <li key={orden.id} className="pb-2 border-b border-border-subtle last:border-b-0">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-text-heading max-w-xs truncate">
                            {orden.codigoOrden}
                          </span>
                          <span className="font-semibold text-text-heading">
                            {formatCurrency(numDe(orden.montoTotal), 0)}
                          </span>
                        </div>
                        <div className="text-text-muted mt-1">
                          {ESTADO_OC_LABELS[orden.estado]}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-heading mb-4">Accesos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              titulo: "Caja",
              descripcion: "Libro mayor, cola de pagos y bloqueos de caja.",
              href: "/erp/finanzas/caja",
            },
            {
              titulo: "Obligaciones",
              descripcion: "Cobros, pagos, comisiones y nómina pendientes.",
              href: "/erp/finanzas/obligaciones",
            },
            {
              titulo: "Cuentas de cobro",
              descripcion: "Facturas y cuentas de cobro a proveedores.",
              href: "/erp/finanzas/cuentas-cobro",
            },
            {
              titulo: "Parámetros",
              descripcion: "Tarifas por rol, arriendo de taller y días hábiles.",
              href: "/erp/finanzas/parametros",
            },
          ].map((item) => (
            <button
              key={item.href}
              type="button"
              onClick={() => router.push(item.href)}
              className="rounded-lg border border-border-subtle bg-bg-alt/60 p-4 text-left transition-colors duration-soft hover:border-gold-400"
            >
              <p className="font-semibold text-text-heading">{item.titulo}</p>
              <p className="mt-1 text-xs text-text-muted">{item.descripcion}</p>
            </button>
          ))}
        </div>
      </section>

      <MovimientoFinancieroModal
        open={tipoMovimiento !== null || movimientoEditando !== null}
        onClose={() => { setTipoMovimiento(null); setMovimientoEditando(null); }}
        tipoInicial={movimientoEditando ? (movimientoEditando.tipo === "credito" ? "entrada" : "salida") : (tipoMovimiento ?? "salida")}
        movimiento={movimientoEditando}
      />
      <CuentaFinancieraModal open={mostrarCuenta} onClose={() => setMostrarCuenta(false)} />
    </div>
  );
}
