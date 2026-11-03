"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  type OrigenObligacion,
  type EstadoObligacion,
  type EstadoCuentaCobro,
  type EstadoOrdenCompra,
  type MovimientoFinanciero,
} from "@/lib/data";
import { useFinanzasCompat } from "@/lib/data/queries/finanzas-compat";
import { Button } from "@/components/veta/button";
import { StatCard } from "@/components/veta/stat-card";
import { CuentaFinancieraModal } from "@/components/veta/cuenta-financiera-modal";
import { DataTable, type DataTableColumn } from "@/components/veta/data-table";
import { FiltrosLibro } from "@/components/veta/finanzas/filtros-libro";
import { MovimientoLibroCard } from "@/components/veta/finanzas/movimiento-libro-card";
import { SkeletonKPI, SkeletonRow } from "@/components/veta/skeleton";
import { BarraFiltros } from "@/components/veta/filtros";
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
  const { store, cargando } = useFinanzasCompat();
  const { mostrarError, mostrarInfo } = useToast();
  const [tipoMovimiento, setTipoMovimiento] = useState<TipoMovimientoManual | null>(null);
  const [movimientoEditando, setMovimientoEditando] = useState<MovimientoFinanciero | null>(null);
  const [mostrarCuenta, setMostrarCuenta] = useState(false);
  const [openCuentas, setOpenCuentas] = useState(false);
  const [openObligaciones, setOpenObligaciones] = useState(false);
  const [openCuentasCobro, setOpenCuentasCobro] = useState(false);
  const [openOrdenes, setOpenOrdenes] = useState(false);

  const cuentas = store.cuentasFinancieras.listar();
  const movimientos = store.movimientosFinancieros.listar();
  const ordenesCompra = store.ordenesCompra.listar();
  const proveedores = store.proveedores.listar();
  const proyectos = store.proyectos.listar();

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

  const ordenesEnCurso = ordenesCompra.filter(
    (o) => o.estado === "en_pago" || o.estado === "aprobada"
  );
  const totalOrdenesEnCurso = ordenesEnCurso.reduce(
    (sum, o) => sum + numDe(o.montoTotal),
    0
  );

  const proveedorMap = new Map<string, { nombre: string }>();
  proveedores.forEach((p) => proveedorMap.set(p.id, p));

  const proyectoMap = new Map<string, { nombreProyecto: string }>();
  proyectos.forEach((p) => proyectoMap.set(p.id, p));

  // --- Libro mayor filters ---
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'debito' | 'credito'>('todos');
  const [filtroCuenta, setFiltroCuenta] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'asentado' | 'anulado'>('todos');
  const [filtroMes, setFiltroMes] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  let movimientosFiltrados = movimientos;
  if (filtroTipo !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.tipo === filtroTipo);
  if (filtroCuenta !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.cuentaOrigenId === filtroCuenta || m.cuentaDestinoId === filtroCuenta);
  if (filtroEstado !== 'todos') movimientosFiltrados = movimientosFiltrados.filter(m => m.estado === filtroEstado);
  if (filtroMes) movimientosFiltrados = movimientosFiltrados.filter(m => m.fecha.startsWith(filtroMes));
  if (busqueda.trim()) {
    const q = busqueda.trim().toLowerCase();
    movimientosFiltrados = movimientosFiltrados.filter(m => {
      const proyecto = m.proyectoId ? proyectoMap.get(m.proyectoId) : null;
      const proveedor = m.proveedorId ? proveedorMap.get(m.proveedorId) : null;
      return m.descripcion.toLowerCase().includes(q)
        || (proyecto?.nombreProyecto.toLowerCase().includes(q) ?? false)
        || (proveedor?.nombre.toLowerCase().includes(q) ?? false);
    });
  }

  const filtrosActivos =
    (filtroTipo !== 'todos' ? 1 : 0) +
    (filtroCuenta !== 'todos' ? 1 : 0) +
    (filtroEstado !== 'todos' ? 1 : 0) +
    (filtroMes ? 1 : 0) +
    (busqueda.trim() ? 1 : 0);

  const limpiarFiltros = () => {
    setFiltroTipo('todos');
    setFiltroCuenta('todos');
    setFiltroEstado('todos');
    setFiltroMes('');
    setBusqueda('');
  };

  const handleAnular = async (mov: MovimientoFinanciero) => {
    if (!window.confirm(`¿Anular el movimiento "${mov.descripcion}"? Se revertirá el saldo y quedará en el libro como anulado.`)) return;
    try {
      await store.movimientosFinancieros.anular(mov.id);
      mostrarInfo("Movimiento anulado. El saldo fue revertido.");
    } catch (e) {
      mostrarError(e instanceof Error ? e.message : "No se pudo anular el movimiento.");
    }
  };

  const columnasLibro: DataTableColumn<MovimientoFinanciero>[] = [
    {
      key: "descripcion",
      header: "Descripción",
      sortValue: (mov) => mov.descripcion,
      render: (mov) => <span className="text-sm text-text-heading max-w-xs truncate">{mov.descripcion}</span>,
    },
    {
      key: "monto",
      header: "Monto",
      align: "right",
      sortValue: (mov) => numDe(mov.monto),
      render: (mov) => (
        <span className={`font-mono ${mov.tipo === "debito" ? "text-red-600" : "text-emerald-600"} ${mov.estado === "anulado" ? "line-through" : ""}`}>
          {mov.tipo === "debito" ? "−" : "+"}{formatCurrency(numDe(mov.monto), 0)}
        </span>
      ),
    },
    {
      key: "fecha",
      header: "Fecha mov.",
      sortValue: (mov) => mov.fecha,
      render: (mov) => <span className="font-mono text-xs text-text-muted">{formatDate(mov.fecha)}</span>,
    },
    {
      key: "registro",
      header: "Registro",
      sortValue: (mov) => mov.createdAt,
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      render: (mov) => <span className="font-mono text-xs text-text-muted">{formatDate(mov.createdAt)}</span>,
    },
    {
      key: "proyecto",
      header: "Proyecto / proveedor",
      sortValue: (mov) => {
        const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : null;
        const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : null;
        return `${proyecto?.nombreProyecto ?? ""} ${proveedor?.nombre ?? ""}`.trim();
      },
      render: (mov) => {
        const proyecto = mov.proyectoId ? proyectoMap.get(mov.proyectoId) : null;
        const proveedor = mov.proveedorId ? proveedorMap.get(mov.proveedorId) : null;
        return (
          <span className="text-xs text-text-muted">
            {proyecto ? proyecto.nombreProyecto : "—"}
            {proveedor ? ` · ${proveedor.nombre}` : ""}
          </span>
        );
      },
    },
    {
      key: "cuenta",
      header: "Cuenta",
      align: "center",
      sortValue: (mov) => {
        const cuentaId = mov.cuentaDestinoId ?? mov.cuentaOrigenId;
        return cuentas.find((c) => c.id === cuentaId)?.nombre ?? "";
      },
      render: (mov) => {
        const cuentaId = mov.cuentaDestinoId ?? mov.cuentaOrigenId;
        const cuenta = cuentas.find((c) => c.id === cuentaId);
        return <span className="text-xs text-text-muted">{cuenta?.nombre ?? "—"}</span>;
      },
    },
    {
      key: "comprobante",
      header: "Comprobante",
      align: "center",
      headerClassName: "hidden lg:table-cell",
      cellClassName: "hidden lg:table-cell",
      render: (mov) => mov.comprobanteUrl ? (
        <a
          href={mov.comprobanteUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-gold-700 underline hover:text-gold-800"
        >
          Ver
        </a>
      ) : (
        <span className="text-xs text-text-muted">—</span>
      ),
    },
    {
      key: "acciones",
      header: "Acciones",
      align: "center",
      render: (mov) => mov.estado === "anulado" ? (
        <span className="text-xs text-text-muted">—</span>
      ) : (
        <div className="flex items-center justify-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setMovimientoEditando(mov)}>
            Editar
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { void handleAnular(mov); }}>
            Anular
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6">
      {/* Encabezado sticky en móvil, estático en desktop */}
      <div className="sticky top-0 z-10 bg-surface-100/95 backdrop-blur border-b border-border-subtle -mx-4 px-4 sm:static sm:m-0 sm:border-0 sm:bg-transparent">
        <header className="relative mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-text-heading">
              Módulo de Finanzas
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Libro de entradas y salidas, caja y resumen de situación financiera
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* Desktop (≥640px): los 3 botones como hoy */}
            <div className="hidden sm:flex flex-wrap gap-2">
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
          </div>
        </header>
      </div>

      {/* Barra inferior sticky de mandos al nivel del pulgar (solo móvil) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border-subtle bg-bg-raised/95 backdrop-blur-sm shadow-lg px-4 py-3">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="flex-1 h-12 min-w-[44px]"
            onClick={() => { setMovimientoEditando(null); setTipoMovimiento("entrada"); }}
          >
            Entrada
          </Button>
          <Button
            variant="primary"
            size="md"
            className="flex-1 h-12 min-w-[44px]"
            onClick={() => { setMovimientoEditando(null); setTipoMovimiento("salida"); }}
          >
            Salida
          </Button>
        </div>
      </div>

      {cargando && (
        <>
          <p role="status" className="sr-only">Cargando finanzas…</p>
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-text-heading mb-4">Resumen del mes</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => <SkeletonKPI key={i} />)}
            </div>
          </section>
          <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
            <div className="border-t border-border-subtle px-4 py-4 space-y-3">
              <div className="md:hidden space-y-2">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonRow key={i} />)}
              </div>
              <div className="hidden md:block">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <tr key={i}>
                        <td colSpan={8} className="p-3">
                          <SkeletonRow />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </>
      )}
      {!cargando && (
        <>
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
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <StatCard className="p-3 sm:p-4" label="Saldo disponible" value={formatCurrency(saldoDisponible, 0)} tone="brand" />
            <details open={openCuentas} onToggle={(e) => setOpenCuentas((e.target as HTMLDetailsElement).open)} className="mt-2 text-sm cursor-pointer">
              <summary className="group flex min-h-[44px] items-center gap-1 py-1 text-sm text-text-muted hover:text-text-heading">
                Ver cuentas ({cuentas.length})
                <span className={`ml-auto text-xs transition-transform duration-200 ${openCuentas ? 'rotate-180' : ''}`}>▾</span>
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

          <StatCard className="p-3 sm:p-4" label="Entradas del mes" value={formatCurrency(entradasMes, 0)} tone="brand" />
          <StatCard className="p-3 sm:p-4" label="Salidas del mes" value={formatCurrency(salidasMes, 0)} tone={salidasMes > 0 ? "danger" : "neutral"} />
          <StatCard className="p-3 sm:p-4" label="Resultado del mes" value={formatCurrency(resultadoMes, 0)} tone={resultadoMes < 0 ? "danger" : "brand"} />
        </div>
      </section>

      {/* --- Libro mayor --- */}
      <section className="mb-8 rounded-lg border border-border-subtle bg-bg-raised overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-3">
          <div>
            <h2 className="font-semibold text-text-heading">Libro mayor</h2>
            <p className="text-xs text-text-muted">
              Filtra por búsqueda, mes, tipo, estado y cuenta. Hacé clic en el encabezado de una columna para ordenar.
            </p>
          </div>
        </div>

        <div className="border-t border-border-subtle px-4 py-4 space-y-3">
          {/* Encabezado de filtros colapsable en móvil */}
          <div className="flex items-center justify-between md:hidden">
            <h3 className="font-semibold text-text-heading">Filtros</h3>
            <button
              type="button"
              onClick={() => setFiltrosAbiertos((v) => !v)}
              aria-expanded={filtrosAbiertos}
              aria-controls="filtros-libro-panel"
              className="text-sm text-text-heading flex items-center gap-1"
            >
              Filtros ({filtrosActivos}) {filtrosAbiertos ? '▲' : '▼'}
            </button>
          </div>

          {/* Panel de filtros */}
          <div
            id="filtros-libro-panel"
            className={`${filtrosAbiertos ? 'block' : 'hidden'} md:block px-4 py-4 space-y-3`}
          >
            <FiltrosLibro
              cuentas={cuentas}
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              filtroMes={filtroMes}
              setFiltroMes={setFiltroMes}
              filtroTipo={filtroTipo}
              setFiltroTipo={setFiltroTipo}
              filtroEstado={filtroEstado}
              setFiltroEstado={setFiltroEstado}
              filtroCuenta={filtroCuenta}
              setFiltroCuenta={setFiltroCuenta}
            />
          </div>

          {/* Barra de filtros activos + limpiar */}
          {filtrosActivos > 0 && (
            <BarraFiltros
              etiqueta="Filtros del libro mayor"
              activos={filtrosActivos}
              onLimpiar={limpiarFiltros}
            >
              <span className="text-sm text-text-muted">
                Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos
              </span>
            </BarraFiltros>
          )}

          <p className="text-xs text-text-muted">
            Hacé clic en el encabezado de una columna para ordenar ascendente o descendente.
          </p>

          {/* Vista tarjetas en móvil (<768px) */}
          <div className="md:hidden space-y-2">
            {movimientosFiltrados.length === 0 ? (
              <p className="text-sm text-text-muted text-center">Sin movimientos registrados.</p>
            ) : (
              movimientosFiltrados.map((mov) => (
                <MovimientoLibroCard
                  key={mov.id}
                  mov={mov}
                  cuentas={cuentas}
                  proyectoMap={proyectoMap}
                  proveedorMap={proveedorMap}
                  onEditar={setMovimientoEditando}
                  onAnular={handleAnular}
                />
              ))
            )}
          </div>

          {/* Tabla en desktop/tablet (≥768px) */}
          <div className="hidden md:block">
            <DataTable
              rows={movimientosFiltrados}
              columns={columnasLibro}
              rowKey={(mov) => mov.id}
              initialSort={{ key: "fecha", direction: "desc" }}
              density="compact"
              maxHeightClassName="max-h-[36rem]"
              caption="Libro mayor de movimientos financieros"
              rowClassName={(mov) => mov.estado === 'anulado' ? 'opacity-60' : ''}
              empty="Sin movimientos registrados."
              scrollHint
            />
          </div>
        </div>
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
            <details open={openObligaciones} onToggle={(e) => setOpenObligaciones((e.target as HTMLDetailsElement).open)} className="mt-2 text-sm cursor-pointer">
              <summary className="group flex min-h-[44px] items-center gap-1 py-1 text-sm text-text-muted hover:text-text-heading">
                Ver detalle ({obligacionesActivas.length})
                <span className={`ml-auto text-xs transition-transform duration-200 ${openObligaciones ? 'rotate-180' : ''}`}>▾</span>
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
            <details open={openCuentasCobro} onToggle={(e) => setOpenCuentasCobro((e.target as HTMLDetailsElement).open)} className="mt-2 text-sm cursor-pointer">
              <summary className="group flex min-h-[44px] items-center gap-1 py-1 text-sm text-text-muted hover:text-text-heading">
                Ver detalle ({cuentasPendientes.length})
                <span className={`ml-auto text-xs transition-transform duration-200 ${openCuentasCobro ? 'rotate-180' : ''}`}>▾</span>
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
            <details open={openOrdenes} onToggle={(e) => setOpenOrdenes((e.target as HTMLDetailsElement).open)} className="mt-2 text-sm cursor-pointer">
              <summary className="group flex min-h-[44px] items-center gap-1 py-1 text-sm text-text-muted hover:text-text-heading">
                Ver detalle ({ordenesEnCurso.length})
                <span className={`ml-auto text-xs transition-transform duration-200 ${openOrdenes ? 'rotate-180' : ''}`}>▾</span>
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

        </>
      )}

      <MovimientoFinancieroModal
        open={tipoMovimiento !== null || movimientoEditando !== null}
        onClose={() => { setTipoMovimiento(null); setMovimientoEditando(null); }}
        tipoInicial={movimientoEditando ? (movimientoEditando.tipo === "credito" ? "entrada" : "salida") : (tipoMovimiento ?? "salida")}
        movimiento={movimientoEditando}
      />
      <CuentaFinancieraModal open={mostrarCuenta} onClose={() => setMostrarCuenta(false)} crearCuenta={store.cuentasFinancieras.crear} />
    </div>
  );
}
