"use client";

import { useRouter } from "next/navigation";
import { useDataStore, type OrigenObligacion, type EstadoObligacion, type EstadoCuentaCobro, type EstadoOrdenCompra } from "@/lib/data";
import { Button } from "@/components/veta/button";
import { StatCard } from "@/components/veta/stat-card";
import { formatCurrency } from "@/lib/utils/format";

// D-06 (re-auditoría 2026-08-10): antes se mostraba obligacion.origen/estado, cuenta.estado y
// orden.estado crudos ("en_pago", "contrato_hito") en el drill-down del dashboard, mientras que
// las pantallas de detalle de estos mismos datos (Obligaciones, Cuentas de cobro, Compras) ya
// tienen su propio mapa de etiquetas humanas -- mismo texto acá, para que no diverjan.
const ORIGEN_OBLIGACION_LABELS: Record<OrigenObligacion, string> = {
  contrato_hito: 'Cobro cliente',
  proveedor: 'Pago proveedor',
  comision: 'Comisión',
  nomina: 'Nómina',
  diseno_3d: 'Diseño 3D',
  arriendo: 'Arriendo',
};

const ESTADO_OBLIGACION_LABELS: Record<EstadoObligacion, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  atrasada: 'Atrasada',
};

const ESTADO_CUENTA_COBRO_LABELS: Record<EstadoCuentaCobro, string> = {
  emitida: 'Emitida',
  vinculada: 'Vinculada',
  pagada: 'Pagada',
  anulada: 'Anulada',
};

const ESTADO_OC_LABELS: Record<EstadoOrdenCompra, string> = {
  solicitada: 'Solicitada',
  aprobada: 'Aprobada',
  en_pago: 'En pago',
  pagada: 'Pagada',
  recibida_verificada: 'Recibida verificada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
};

export default function FinanzasPage() {
  const router = useRouter();
  const store = useDataStore();

  // Datos para KPIs
  const saldoDisponible = store.cuentasFinancieras.disponible();

  // Total obligaciones pendientes (estado: pendiente + parcial)
  const obligacionesPendientes = store.obligacionesPendientes.listar();
  const obligacionesActivas = obligacionesPendientes.filter(
    (o) => o.estado === 'pendiente' || o.estado === 'parcial'
  );
  const totalObligacionesPendientes = obligacionesActivas.reduce(
    (sum, o) => sum + (parseFloat(o.montoTotal) - parseFloat(o.montoPagado)),
    0
  );

  // Total cuentas de cobro pendientes (estado: emitida o vinculada)
  const cuentasCobroProveedor = store.cuentasCobroProveedor.listar();
  const cuentasPendientes = cuentasCobroProveedor.filter(
    (c) => c.estado === 'emitida' || c.estado === 'vinculada'
  );
  const totalCuentasPendientes = cuentasPendientes.reduce(
    (sum, c) => sum + parseFloat(c.valor),
    0
  );

  // Total en órdenes de compra en curso (estado: en_pago o aprobada)
  const ordenesCompra = store.ordenesCompra.listar();
  const ordenesEnCurso = ordenesCompra.filter(
    (o) => o.estado === 'en_pago' || o.estado === 'aprobada'
  );
  const totalOrdenesEnCurso = ordenesEnCurso.reduce(
    (sum, o) => sum + parseFloat(o.montoTotal),
    0
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-heading">
          Módulo de Finanzas
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Gestión de parámetros, tarifas y resumen de situación financiera
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 hover:border-gold-400 transition-colors duration-soft">
          <h2 className="text-lg font-semibold text-text-heading mb-2">
            Parámetros de Costos
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Configurar tarifas por rol, arriendo de taller y días hábiles para cálculos de costos por tiempo.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push("/erp/finanzas/parametros")}
          >
            Ir a Parámetros
          </Button>
        </div>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-heading mb-4">
          KPIs Financieros
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Saldo Disponible */}
          <div>
            <StatCard
              label="Saldo Disponible"
              value={formatCurrency(saldoDisponible, 0)}
              tone="brand"
            />
            <details className="mt-2 text-sm cursor-pointer">
              <summary className="text-text-muted hover:text-text-heading transition-colors">
                Ver cuentas ({store.cuentasFinancieras.listar().length})
              </summary>
              <div className="mt-2 p-3 bg-bg-raised rounded border border-border-subtle">
                {store.cuentasFinancieras.listar().length === 0 ? (
                  <p className="text-text-muted text-xs">Sin cuentas registradas</p>
                ) : (
                  <ul className="space-y-1 text-xs">
                    {store.cuentasFinancieras.listar().map((cuenta) => (
                      <li key={cuenta.id} className="flex justify-between">
                        <span className="text-text-muted">{cuenta.nombre}</span>
                        <span className="font-semibold text-text-heading">
                          {formatCurrency(parseFloat(cuenta.saldoActual), 0)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </details>
          </div>

          {/* Obligaciones Pendientes */}
          <div>
            <StatCard
              label="Obligaciones Pendientes"
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
                    {obligacionesActivas.map((obligacion) => {
                      const pendiente = parseFloat(obligacion.montoTotal) - parseFloat(obligacion.montoPagado);
                      return (
                        <li key={obligacion.id} className="pb-2 border-b border-border-subtle last:border-b-0">
                          <div className="flex justify-between">
                            <span className="font-medium text-text-heading max-w-xs truncate">
                              {obligacion.descripcion}
                            </span>
                            <span className="text-error-text font-semibold">
                              {formatCurrency(pendiente, 0)}
                            </span>
                          </div>
                          <div className="text-text-muted mt-1">
                            {ORIGEN_OBLIGACION_LABELS[obligacion.origen]} — {ESTADO_OBLIGACION_LABELS[obligacion.estado]}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </details>
          </div>

          {/* Cuentas de Cobro Pendientes */}
          <div>
            <StatCard
              label="Cuentas de Cobro Pendientes"
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
                        <div className="flex justify-between">
                          <span className="font-medium text-text-heading max-w-xs truncate">
                            {cuenta.concepto}
                          </span>
                          <span className="text-error-text font-semibold">
                            {formatCurrency(parseFloat(cuenta.valor), 0)}
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

          {/* Órdenes de Compra en Curso */}
          <div>
            <StatCard
              label="Órdenes de Compra en Curso"
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
                        <div className="flex justify-between">
                          <span className="font-medium text-text-heading max-w-xs truncate">
                            {orden.codigoOrden}
                          </span>
                          <span className="font-semibold text-text-heading">
                            {formatCurrency(parseFloat(orden.montoTotal), 0)}
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
    </div>
  );
}
