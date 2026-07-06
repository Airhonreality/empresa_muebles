'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Landmark,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { processEvents } from '@/lib/agnostic/eventProcessor';
import { Combobox } from '@/components/ui/combobox';
import { SmartImageInput } from '@/components/ui/SmartImageInput';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import ConciliacionBancaria from './ConciliacionBancaria';

type RecordItem<T = Record<string, unknown>> = {
  id: string;
  context?: string;
  data?: T;
  updated_at?: string;
} & T;

type CuentaFinanciera = {
  nombre?: string;
  tipo?: string;
  saldo_inicial?: number;
  saldo_actual?: number;
  estado?: string;
};

type ObligacionPendiente = {
  descripcion?: string;
  tipo?: 'por_pagar' | 'por_cobrar';
  monto_total?: number;
  monto_pagado?: number;
  fecha_vencimiento?: string;
  estado?: 'pendiente' | 'parcial' | 'pagado' | 'anulado';
  proveedor_id?: string;
  cliente_id?: string;
  usuario_id?: string;
  proyecto_id?: string;
  contrato_id?: string;
  producto_id?: string;
  categoria_id?: string;
  descripcion_semantica?: string;
};

type MovimientoFinanciero = {
  fecha?: string;
  descripcion?: string;
  tipo?: 'ingreso' | 'egreso' | 'transferencia';
  monto?: number;
  estado?: string;
  cuenta_origen_id?: string;
  cuenta_destino_id?: string;
  obligacion_id?: string;
  proyecto_id?: string;
  contrato_id?: string;
};

type Contrato = {
  codigo_contrato?: string;
  proyecto_id?: string;
  valor_total?: number;
  estado?: string;
};

type AbonoContrato = {
  contrato_id?: string;
  numero_abono?: string;
  valor_abono?: number;
  fecha_recibido?: string;
  verificado?: boolean;
};

type NamedEntity = {
  nombre?: string;
  nombre_proyecto?: string;
  descripcion?: string;
  codigo_contrato?: string;
  email?: string;
};

type FormMode = 'ingreso_banco' | 'crear_por_pagar' | 'cobrar_saldo' | 'liquidar_obligacion';
type ThirdPartyKind = 'proveedor' | 'usuario';
type ThirdPartyFilter = 'all' | ThirdPartyKind;
type ThirdPartyOption = {
  value: string;
  label: string;
  kind: ThirdPartyKind;
  id: string;
};

const today = () => new Date().toISOString().slice(0, 10);

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
    return {
      ...record,
      ...(record.data || {}),
      id: record.id
    };
  });
};

const entityLabel = (item?: RecordItem<NamedEntity>) =>
  item?.nombre || item?.nombre_proyecto || item?.descripcion || item?.codigo_contrato || item?.email || 'Sin nombre';

type FinanzasShellStyleVars = React.CSSProperties & Record<`--finanzas-shell-${string}`, string>;

const finanzasShellStyleVars: FinanzasShellStyleVars = {
  '--finanzas-shell-field-radius': '8px',
  '--finanzas-shell-field-border': 'rgb(214 211 209)',
  '--finanzas-shell-field-bg': 'white',
  '--finanzas-shell-field-fg': 'rgb(28 25 23)',
  '--finanzas-shell-field-focus-border': 'rgb(245 158 11)',
  '--finanzas-shell-field-focus-shadow': '0 0 0 3px rgb(245 158 11 / 0.16)',
  '--finanzas-shell-markdown-fg': 'rgb(68 64 60)',
  '--finanzas-shell-markdown-heading-fg': 'rgb(28 25 23)',
  '--finanzas-shell-markdown-heading-border': 'rgb(231 229 228)',
  '--finanzas-shell-markdown-table-bg': 'white',
  '--finanzas-shell-markdown-table-border': 'rgb(231 229 228)',
  '--finanzas-shell-markdown-table-radius': '6px',
  '--finanzas-shell-markdown-muted-bg': 'rgb(245 245 244)'
};

export default function FinanzasShell() {
  const [cuentas, setCuentas] = useState<RecordItem<CuentaFinanciera>[]>([]);
  const [obligaciones, setObligaciones] = useState<RecordItem<ObligacionPendiente>[]>([]);
  const [movimientos, setMovimientos] = useState<RecordItem<MovimientoFinanciero>[]>([]);
  const [contratos, setContratos] = useState<RecordItem<Contrato>[]>([]);
  const [abonos, setAbonos] = useState<RecordItem<AbonoContrato>[]>([]);
  const [proyectos, setProyectos] = useState<RecordItem<NamedEntity>[]>([]);
  const [proveedores, setProveedores] = useState<RecordItem<NamedEntity>[]>([]);
  const [clientes, setClientes] = useState<RecordItem<NamedEntity>[]>([]);
  const [usuarios, setUsuarios] = useState<RecordItem<NamedEntity>[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [mode, setMode] = useState<FormMode | null>(null);
  const [search, setSearch] = useState('');
  const [activeCuentaId, setActiveCuentaId] = useState('all');
  const [activeObligacion, setActiveObligacion] = useState<RecordItem<ObligacionPendiente> | null>(null);
  const [activeContratoId, setActiveContratoId] = useState('');
  const [expandedObligations, setExpandedObligations] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string) => {
    setExpandedObligations((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const [form, setForm] = useState({
    cuenta_id: '',
    monto: '',
    descripcion: '',
    fecha: today(),
    proyecto_id: '',
    proveedor_id: '',
    usuario_id: '',
    cliente_id: '',
    contrato_id: '',
    producto_id: '',
    categoria_id: '',
    comprobante_ref: '',
    fecha_vencimiento: today()
  });

  const patchForm = (patch: Partial<typeof form>) => setForm((current) => ({ ...current, ...patch }));

  const readNamespace = useCallback(async <T,>(namespace: string) => {
    const res = await fetch(`/api/vault?namespace=${namespace}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return normalizeRecords<T>(await res.json());
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        nextCuentas,
        nextObligaciones,
        nextMovimientos,
        nextContratos,
        nextAbonos,
        nextProyectos,
        nextProveedores,
        nextClientes,
        nextUsuarios
      ] = await Promise.all([
        readNamespace<CuentaFinanciera>('cuentas_financieras'),
        readNamespace<ObligacionPendiente>('obligaciones_pendientes'),
        readNamespace<MovimientoFinanciero>('movimientos_financieros'),
        readNamespace<Contrato>('contratos'),
        readNamespace<AbonoContrato>('abonos_contrato'),
        readNamespace<NamedEntity>('proyectos'),
        readNamespace<NamedEntity>('proveedores'),
        readNamespace<NamedEntity>('clientes'),
        readNamespace<NamedEntity>('usuarios_equipo')
      ]);

      setCuentas(nextCuentas);
      setObligaciones(nextObligaciones);
      setMovimientos(nextMovimientos);
      setContratos(nextContratos);
      setAbonos(nextAbonos);
      setProyectos(nextProyectos);
      setProveedores(nextProveedores);
      setClientes(nextClientes);
      setUsuarios(nextUsuarios);

      const defaultCuenta = nextCuentas.find((cuenta) => cuenta.estado !== 'inactiva')?.id || '';
      setForm((current) => ({ ...current, cuenta_id: current.cuenta_id || defaultCuenta }));
    } catch {
      toast.error('No se pudo sincronizar el modulo financiero.');
    } finally {
      setIsLoading(false);
    }
  }, [readNamespace]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const executeZap = async (zap: string, payload: Record<string, unknown>) => {
    setIsExecuting(true);
    try {
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zap, payload })
      });
      const result = await res.json();
      if (!res.ok || result.success === false) {
        toast.error(result.error || 'La transaccion no pudo completarse.');
      }
      if (Array.isArray(result.events)) {
        await processEvents(result.events);
      }
      await fetchData();
      return result.success !== false;
    } catch {
      toast.error('Fallo de comunicacion con el motor financiero.');
      return false;
    } finally {
      setIsExecuting(false);
    }
  };

  const resetTransactionFields = () => {
    patchForm({
      monto: '',
      descripcion: '',
      comprobante_ref: '',
      fecha: today(),
      fecha_vencimiento: today(),
      proyecto_id: '',
      proveedor_id: '',
      usuario_id: '',
      cliente_id: '',
      contrato_id: '',
      producto_id: ''
    });
    setActiveObligacion(null);
    setActiveContratoId('');
  };

  const openMode = (nextMode: FormMode, defaults: Partial<typeof form> = {}) => {
    resetTransactionFields();
    setMode(nextMode);
    setTimeout(() => patchForm(defaults), 0);
  };

  const totalBancos = useMemo(
    () => cuentas.reduce((sum, cuenta) => sum + Number(cuenta.saldo_actual ?? cuenta.saldo_inicial ?? 0), 0),
    [cuentas]
  );

  const porPagar = useMemo(
    () =>
      obligaciones.filter(
        (obligacion) =>
          obligacion.tipo === 'por_pagar' &&
          obligacion.estado !== 'pagado' &&
          obligacion.estado !== 'anulado'
      ),
    [obligaciones]
  );

  const totalPorPagar = useMemo(
    () =>
      porPagar.reduce(
        (sum, obligacion) => sum + Math.max(0, Number(obligacion.monto_total || 0) - Number(obligacion.monto_pagado || 0)),
        0
      ),
    [porPagar]
  );

  const saldosContrato = useMemo(() => {
    const manualCobros = obligaciones.filter(
      (obligacion) =>
        obligacion.tipo === 'por_cobrar' &&
        obligacion.estado !== 'pagado' &&
        obligacion.estado !== 'anulado'
    );

    const derived = contratos
      .filter((c) => c.estado === 'firmado')
      .map((contrato) => {
        const recibido = abonos
          .filter((abono) => abono.contrato_id === contrato.id && abono.verificado !== false)
          .reduce((sum, abono) => sum + Number(abono.valor_abono || 0), 0);

        const pendiente = Math.max(0, Number(contrato.valor_total || 0) - recibido);
        
        const proyecto = proyectos.find((p) => p.id === contrato.proyecto_id);
        const proyectoNombre = proyecto?.nombre_proyecto || proyecto?.nombre || '';
        
        const clienteId = (proyecto as any)?.cliente_id || (contrato as any)?.cliente_id;
        const cliente = clientes.find((c) => c.id === clienteId);
        const clienteNombre = cliente?.nombre || cliente?.nombre_proyecto || '';

        const abonosFiltrados = abonos.filter((a) => a.contrato_id === contrato.id && a.verificado !== false);
        const abonosListMarkdown = abonosFiltrados.length > 0
          ? abonosFiltrados.map((a, idx) => `* **Anticipo ${idx + 1}:** ${currency(a.valor_abono)} recibido el ${a.fecha_recibido || 'sin fecha'}`).join('\n')
          : '* *No se registran cobros validados todavía.*';

        const descSemantica = `### Detalle de Cobros Contrato ${contrato.codigo_contrato || 'CT'}\n\n* **Cliente:** ${clienteNombre || 'No especificado'}\n* **Proyecto:** ${proyectoNombre || 'No especificado'}\n* **Monto total contrato:** ${currency(contrato.valor_total)}\n* **Total cobrado:** ${currency(recibido)}\n* **Saldo pendiente:** ${currency(pendiente)}\n\n**Abonos recibidos:**\n${abonosListMarkdown}`;

        return {
          id: contrato.id,
          descripcion: contrato.codigo_contrato || 'Contrato',
          contrato_id: contrato.id,
          proyecto_id: contrato.proyecto_id,
          monto_total: Number(contrato.valor_total || 0),
          monto_pagado: recibido,
          estado: recibido >= Number(contrato.valor_total || 0) ? 'pagado' : 'pendiente',
          tipo: 'por_cobrar' as const,
          descripcion_semantica: descSemantica,
          cliente_nombre: clienteNombre,
          proyecto_nombre: proyectoNombre,
          codigo_contrato: contrato.codigo_contrato
        };
      });

    return [...derived, ...manualCobros].filter(
      (saldo) => Math.max(0, Number(saldo.monto_total || 0) - Number(saldo.monto_pagado || 0)) > 0
    );
  }, [abonos, contratos, obligaciones, proyectos, clientes]);

  const totalSaldosPorCobrar = useMemo(
    () =>
      saldosContrato.reduce(
        (sum, saldo) => sum + Math.max(0, Number(saldo.monto_total || 0) - Number(saldo.monto_pagado || 0)),
        0
      ),
    [saldosContrato]
  );

  const thirdPartyOptions = useMemo<ThirdPartyOption[]>(
    () => [
      ...proveedores.map((item) => ({
        value: `proveedor:${item.id}`,
        label: `${entityLabel(item)} · Proveedor`,
        kind: 'proveedor' as const,
        id: item.id
      })),
      ...usuarios.map((item) => ({
        value: `usuario:${item.id}`,
        label: `${entityLabel(item)} · Equipo`,
        kind: 'usuario' as const,
        id: item.id
      }))
    ],
    [proveedores, usuarios]
  );

  const thirdPartyValue = form.proveedor_id
    ? `proveedor:${form.proveedor_id}`
    : form.usuario_id
      ? `usuario:${form.usuario_id}`
      : '';

  const handleThirdPartyChange = (value: string) => {
    const [kind, id] = value.split(':') as [ThirdPartyKind | undefined, string | undefined];
    if (!kind || !id) {
      patchForm({ proveedor_id: '', usuario_id: '' });
      return;
    }
    patchForm({
      proveedor_id: kind === 'proveedor' ? id : '',
      usuario_id: kind === 'usuario' ? id : ''
    });
  };

  const filteredMovimientos = useMemo(() => {
    const term = search.trim().toLowerCase();
    return movimientos
      .filter((movimiento) => movimiento.estado !== 'anulado')
      .filter((movimiento) => activeCuentaId === 'all' || movimiento.cuenta_origen_id === activeCuentaId || movimiento.cuenta_destino_id === activeCuentaId)
      .filter((movimiento) => !term || (movimiento.descripcion || '').toLowerCase().includes(term))
      .slice()
      .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')));
  }, [activeCuentaId, movimientos, search]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const monto = Number(form.monto);
    if (!mode || !monto || monto <= 0) {
      toast.error('Ingresa un monto mayor a cero.');
      return;
    }

    const commonPayload = {
      monto,
      descripcion: form.descripcion,
      fecha: form.fecha || today(),
      cuenta_id: form.cuenta_id,
      proyecto_id: form.proyecto_id,
      proveedor_id: form.proveedor_id,
      usuario_id: form.usuario_id,
      cliente_id: form.cliente_id,
      contrato_id: form.contrato_id,
      producto_id: form.producto_id,
      categoria_id: form.categoria_id,
      comprobante_ref: form.comprobante_ref
    };

    let ok = false;
    if (mode === 'ingreso_banco') {
      ok = await executeZap('zap_registrar_ingreso_banco', commonPayload);
    }
    if (mode === 'crear_por_pagar') {
      ok = await executeZap('zap_crear_obligacion_pendiente', {
        ...commonPayload,
        fecha_vencimiento: form.fecha_vencimiento || today()
      });
    }
    if (mode === 'liquidar_obligacion') {
      if (!activeObligacion?.id) {
        toast.error('Selecciona una obligacion por pagar.');
        return;
      }
      ok = await executeZap('zap_liquidar_obligacion', {
        ...commonPayload,
        obligacion_id: activeObligacion.id
      });
    }
    if (mode === 'cobrar_saldo') {
      ok = await executeZap('zap_registrar_cobro_contrato', commonPayload);
    }

    if (ok) {
      setMode(null);
      resetTransactionFields();
    }
  };

  const selectedCuenta = cuentas.find((cuenta) => cuenta.id === form.cuenta_id);
  const sheetTitle = {
    ingreso_banco: 'Entrada a banco',
    crear_por_pagar: 'Cuenta por pagar',
    cobrar_saldo: 'Cobrar saldo',
    liquidar_obligacion: 'Liquidar obligacion'
  }[mode || 'ingreso_banco'];

  return (
    <div className="min-h-[100dvh] w-full bg-stone-50 text-stone-950" style={finanzasShellStyleVars}>
      <style jsx global>{`
        .field {
          min-height: 44px;
          width: 100%;
          border-radius: var(--finanzas-shell-field-radius);
          border: 1px solid var(--finanzas-shell-field-border);
          background: var(--finanzas-shell-field-bg);
          padding: 0 12px;
          font-size: 14px;
          font-weight: 600;
          color: var(--finanzas-shell-field-fg);
          outline: none;
        }
        .field:focus {
          border-color: var(--finanzas-shell-field-focus-border);
          box-shadow: var(--finanzas-shell-field-focus-shadow);
        }
        .markdown-detail {
          font-size: 13px;
          color: var(--finanzas-shell-markdown-fg);
          line-height: 1.6;
        }
        .markdown-detail h3 {
          font-weight: 800;
          font-size: 14px;
          margin-bottom: 8px;
          color: var(--finanzas-shell-markdown-heading-fg);
          border-bottom: 1px solid var(--finanzas-shell-markdown-heading-border);
          padding-bottom: 4px;
        }
        .markdown-detail p {
          margin-bottom: 8px;
        }
        .markdown-detail table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          background: var(--finanzas-shell-markdown-table-bg);
          border-radius: var(--finanzas-shell-markdown-table-radius);
          overflow: hidden;
        }
        .markdown-detail th, .markdown-detail td {
          border: 1px solid var(--finanzas-shell-markdown-table-border);
          padding: 8px 10px;
          text-align: left;
        }
        .markdown-detail th {
          background-color: var(--finanzas-shell-markdown-muted-bg);
          font-weight: 700;
          color: var(--finanzas-shell-markdown-heading-fg);
        }
        .markdown-detail ul, .markdown-detail ol {
          margin-left: 20px;
          margin-bottom: 8px;
          list-style-type: disc;
        }
        .markdown-detail li {
          margin-bottom: 4px;
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-amber-300 bg-amber-50 text-amber-700">
              <Landmark className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase text-amber-700">ERP Veta Dorada</p>
              <h1 className="text-2xl font-black leading-tight text-stone-950 sm:text-3xl">Finanzas operativas</h1>
            </div>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading || isExecuting}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-stone-800 shadow-sm transition hover:bg-stone-100 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 text-amber-700 ${isLoading || isExecuting ? 'animate-spin' : ''}`} />
            Sincronizar
          </button>
        </header>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FinanceCard
            title="Liquidez bancos"
            amount={totalBancos}
            detail={`${cuentas.filter((cuenta) => cuenta.estado !== 'inactiva' && cuenta.nombre).length} cuentas activas`}
            icon={<Banknote className="h-5 w-5" />}
            tone="emerald"
            actionLabel="Anadir entrada"
            onAction={() => openMode('ingreso_banco')}
            compact
          />
          <FinanceCard
            title="Por pagar"
            amount={totalPorPagar}
            detail={`${porPagar.length} compromisos abiertos`}
            icon={<ReceiptText className="h-5 w-5" />}
            tone="rose"
            actionLabel="Anadir cuenta"
            onAction={() => openMode('crear_por_pagar')}
            compact
          >
            <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs">
              {porPagar.map((obligacion) => {
                const saldo = Math.max(0, Number(obligacion.monto_total || 0) - Number(obligacion.monto_pagado || 0));
                const proveedor = proveedores.find((item) => item.id === obligacion.proveedor_id);
                const usuario = usuarios.find((item) => item.id === obligacion.usuario_id);
                const label = proveedor || usuario ? entityLabel(proveedor || usuario) : 'Sin proveedor/empleado';
                return (
                  <div key={obligacion.id} className="flex justify-between text-stone-600">
                    <span className="truncate pr-2 font-medium" title={obligacion.descripcion}>
                      {obligacion.descripcion || 'Obligación'} ({label})
                    </span>
                    <span className="font-mono font-bold">{currency(saldo)}</span>
                  </div>
                );
              })}
            </div>
          </FinanceCard>
          <FinanceCard
            title="Saldos por cobrar"
            amount={totalSaldosPorCobrar}
            detail={`${saldosContrato.length} saldos abiertos`}
            icon={<HandCoins className="h-5 w-5" />}
            tone="sky"
            actionLabel="Registrar cobro"
            onAction={() => openMode('cobrar_saldo')}
            compact
          >
            <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs">
              {saldosContrato.map((saldo) => {
                const pendiente = Math.max(0, Number(saldo.monto_total || 0) - Number(saldo.monto_pagado || 0));
                const label = (saldo as any).codigo_contrato || saldo.descripcion || 'Contrato';
                const subLabel = (saldo as any).proyecto_nombre ? `${(saldo as any).proyecto_nombre} (${(saldo as any).cliente_nombre || ''})` : '';
                return (
                  <div key={`${saldo.id}-${saldo.contrato_id || 'manual'}`} className="flex flex-col gap-0.5 border-b border-stone-100/50 pb-1.5 last:border-0 last:pb-0 text-stone-600">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-stone-850 truncate pr-2">{label}</span>
                      <span className="font-mono font-bold text-stone-900">{currency(pendiente)}</span>
                    </div>
                    {subLabel && <span className="text-[10px] text-stone-500 font-medium truncate">{subLabel}</span>}
                  </div>
                );
              })}
            </div>
          </FinanceCard>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <Panel
            title="Cuentas bancarias"
            icon={<Landmark className="h-4 w-4" />}
            description={`${cuentas.filter((cuenta) => cuenta.estado !== 'inactiva' && cuenta.nombre).length} cuentas activas`}
            actionLabel="Anadir entrada"
            onAction={() => openMode('ingreso_banco')}
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {cuentas.length === 0 ? (
                <EmptyState text="No hay cuentas financieras cargadas." />
              ) : (
                cuentas.map((cuenta) => (
                  <button
                    key={cuenta.id}
                    onClick={() => setActiveCuentaId(cuenta.id)}
                    className={`rounded-lg border bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 ${
                      activeCuentaId === cuenta.id ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-stone-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-stone-950">{cuenta.nombre || 'Cuenta sin nombre'}</p>
                        <p className="mt-1 text-xs uppercase text-stone-500">{cuenta.tipo || 'sin tipo'}</p>
                      </div>
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    <p className="mt-4 font-mono text-xl font-black">{currency(cuenta.saldo_actual ?? cuenta.saldo_inicial)}</p>
                  </button>
                ))
              )}
            </div>
          </Panel>

          <Panel
            title="Compromisos por pagar"
            icon={<AlertCircle className="h-4 w-4" />}
            description={`${porPagar.length} compromisos abiertos`}
            actionLabel="Anadir cuenta"
            onAction={() => openMode('crear_por_pagar')}
          >
            <div className="flex flex-col gap-3">
              {porPagar.length === 0 ? (
                <EmptyState text="No hay cuentas pendientes por pagar." />
              ) : (
                porPagar.map((obligacion) => {
                  const saldo = Math.max(0, Number(obligacion.monto_total || 0) - Number(obligacion.monto_pagado || 0));
                  const proveedor = proveedores.find((item) => item.id === obligacion.proveedor_id);
                  const usuario = usuarios.find((item) => item.id === obligacion.usuario_id);
                  return (
                    <div key={obligacion.id} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-stone-950">{obligacion.descripcion || 'Obligación'}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {proveedor || usuario ? entityLabel(proveedor || usuario) : 'Sin proveedor/empleado asignado'} · vence {obligacion.fecha_vencimiento || 'sin fecha'}
                          </p>
                          {obligacion.descripcion_semantica && (
                            <button
                              onClick={() => toggleExpanded(obligacion.id)}
                              className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-600 transition flex items-center gap-1 min-h-11 px-2 -ml-2 rounded-md hover:bg-amber-50"
                            >
                              {expandedObligations[obligacion.id] === false ? 'Ver desglose ↓' : 'Ocultar desglose ↑'}
                            </button>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-mono text-lg font-black text-rose-700">{currency(saldo)}</p>
                          <button
                            onClick={() => {
                              openMode('liquidar_obligacion', {
                                monto: String(saldo),
                                descripcion: obligacion.descripcion || '',
                                proveedor_id: obligacion.proveedor_id || '',
                                usuario_id: obligacion.usuario_id || '',
                                proyecto_id: obligacion.proyecto_id || '',
                                contrato_id: obligacion.contrato_id || ''
                              });
                              setActiveObligacion(obligacion);
                            }}
                            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 text-xs font-black text-white transition hover:bg-rose-500"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Pagar
                          </button>
                        </div>
                      </div>
                      {expandedObligations[obligacion.id] !== false && obligacion.descripcion_semantica && (
                        <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-stone-50 p-3 rounded-lg overflow-x-auto leading-relaxed markdown-detail">
                          <ReactMarkdown>
                            {obligacion.descripcion_semantica}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <Panel
            title="Saldos por cobrar"
            icon={<CircleDollarSign className="h-4 w-4" />}
            description={`${saldosContrato.length} saldos abiertos`}
            actionLabel="Registrar cobro"
            onAction={() => openMode('cobrar_saldo')}
          >
            <div className="flex flex-col gap-3">
              {saldosContrato.length === 0 ? (
                <EmptyState text="No hay saldos por cobrar abiertos." />
              ) : (
                saldosContrato.map((saldo) => {
                  const pendiente = Math.max(0, Number(saldo.monto_total || 0) - Number(saldo.monto_pagado || 0));
                  const proyecto = proyectos.find((item) => item.id === saldo.proyecto_id);
                  return (
                    <div key={`${saldo.id}-${saldo.contrato_id || 'manual'}`} className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-bold text-stone-950">{saldo.descripcion || 'Saldo por cobrar'}</p>
                          <p className="mt-1 text-xs text-stone-500">
                            {entityLabel(proyecto)} · cobrado {currency(saldo.monto_pagado)}
                          </p>
                          {saldo.descripcion_semantica && (
                            <button
                              onClick={() => toggleExpanded(saldo.id)}
                              className="mt-2 text-xs font-bold text-amber-700 hover:text-amber-600 transition flex items-center gap-1 min-h-11 px-2 -ml-2 rounded-md hover:bg-amber-50"
                            >
                              {expandedObligations[saldo.id] === false ? 'Ver desglose ↓' : 'Ocultar desglose ↑'}
                            </button>
                          )}
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="font-mono text-lg font-black text-sky-700">{currency(pendiente)}</p>
                          <button
                            onClick={() => {
                              setActiveContratoId(saldo.contrato_id || '');
                              openMode('cobrar_saldo', {
                                monto: String(pendiente),
                                descripcion: saldo.descripcion || '',
                                contrato_id: saldo.contrato_id || '',
                                proyecto_id: saldo.proyecto_id || ''
                              });
                            }}
                            className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-lg bg-sky-600 px-4 text-xs font-black text-white transition hover:bg-sky-500"
                          >
                            <ArrowUpRight className="h-4 w-4" />
                            Cobrar
                          </button>
                        </div>
                      </div>
                      {expandedObligations[saldo.id] !== false && saldo.descripcion_semantica && (
                        <div className="mt-4 pt-4 border-t border-stone-100 text-xs text-stone-700 bg-stone-50 p-3 rounded-lg overflow-x-auto leading-relaxed markdown-detail">
                          <ReactMarkdown>
                            {saldo.descripcion_semantica}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Panel>

          <Panel title="Ledger reciente" icon={<Search className="h-4 w-4" />}>
            <div className="mb-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={activeCuentaId}
                onChange={(event) => setActiveCuentaId(event.target.value)}
                className="min-h-10 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold outline-none focus:border-amber-500"
              >
                <option value="all">Todas las cuentas</option>
                {cuentas.map((cuenta) => (
                  <option key={cuenta.id} value={cuenta.id}>
                    {cuenta.nombre || 'Cuenta'}
                  </option>
                ))}
              </select>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar movimiento"
                className="min-h-10 flex-1 rounded-lg border border-stone-300 bg-white px-3 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div className="overflow-hidden rounded-lg border border-stone-200">
              {filteredMovimientos.length === 0 ? (
                <EmptyState text="No hay movimientos asentados." />
              ) : (
                filteredMovimientos.slice(0, 12).map((movimiento) => {
                  const isIngreso = movimiento.tipo === 'ingreso';
                  const cuenta = cuentas.find((item) => item.id === movimiento.cuenta_origen_id || item.id === movimiento.cuenta_destino_id);
                  return (
                    <div key={movimiento.id} className="flex items-center justify-between gap-4 border-b border-stone-100 bg-white px-4 py-3 last:border-b-0">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-stone-950">{movimiento.descripcion || 'Movimiento'}</p>
                        <p className="mt-1 text-xs text-stone-500">{movimiento.fecha || 'sin fecha'} · {cuenta?.nombre || 'sin cuenta'}</p>
                      </div>
                      <p className={`shrink-0 font-mono text-sm font-black ${isIngreso ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isIngreso ? '+' : '-'} {currency(movimiento.monto)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Panel>
        </section>

        <section className="grid grid-cols-1 gap-4">
          <Panel title="Conciliacion bancaria" icon={<CheckCircle2 className="h-4 w-4" />}>
            <ConciliacionBancaria onRefresh={fetchData} />
          </Panel>
        </section>
      </div>

      <Sheet open={!!mode} onOpenChange={(open) => !open && setMode(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto bg-white p-6 text-stone-950 sm:w-[50vw] sm:max-w-[50vw] lg:w-[50vw] lg:max-w-[50vw]">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl font-black">
              <Plus className="h-5 w-5 text-amber-600" />
              {sheetTitle}
            </SheetTitle>
          </SheetHeader>

          <form onSubmit={submit} className="space-y-5">
            {mode === 'liquidar_obligacion' && activeObligacion && (
              <section className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">Obligación seleccionada</p>
                    <h3 className="mt-1 truncate text-sm font-bold text-stone-950">{activeObligacion.descripcion || 'Cuenta por pagar'}</h3>
                    <p className="mt-1 text-xs text-stone-600">
                      {selectedCuenta ? `Salida desde ${selectedCuenta.nombre || 'cuenta'} · saldo ${currency(selectedCuenta.saldo_actual ?? selectedCuenta.saldo_inicial)}` : 'Selecciona la cuenta de salida para registrar el pago.'}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white px-3 py-2 text-right shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">Saldo abierto</p>
                    <p className="font-mono text-lg font-black text-rose-700">
                      {currency(Math.max(0, Number(activeObligacion.monto_total || 0) - Number(activeObligacion.monto_pagado || 0)))}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {(mode === 'ingreso_banco' || mode === 'liquidar_obligacion' || mode === 'cobrar_saldo' || mode === 'crear_por_pagar') && (
              <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Caja y movimiento</p>
                    <h3 className="text-sm font-bold text-stone-950">
                      {mode === 'crear_por_pagar' ? 'Monto y fecha de vencimiento' : 'Origen, monto y fecha'}
                    </h3>
                  </div>
                  <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                    Paso 1
                  </span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="space-y-4">
                    {mode === 'crear_por_pagar' ? (
                      <div className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-4">
                        <p className="text-xs font-bold text-stone-500">Cuenta</p>
                        <p className="mt-2 text-xs leading-relaxed text-stone-500">
                          La cuenta bancaria se asignará cuando esta obligación se liquide.
                        </p>
                      </div>
                    ) : (
                      <Field label={mode === 'liquidar_obligacion' ? 'Cuenta de salida' : 'Cuenta destino'}>
                        <select
                          value={form.cuenta_id}
                          onChange={(event) => patchForm({ cuenta_id: event.target.value })}
                          required
                          className="field"
                        >
                          <option value="">Seleccionar cuenta</option>
                          {cuentas.map((cuenta) => (
                            <option key={cuenta.id} value={cuenta.id}>
                              {cuenta.nombre || 'Cuenta'} ({currency(cuenta.saldo_actual ?? cuenta.saldo_inicial)})
                            </option>
                          ))}
                        </select>
                        {selectedCuenta && <p className="mt-1 text-xs text-stone-500">Saldo actual: {currency(selectedCuenta.saldo_actual ?? selectedCuenta.saldo_inicial)}</p>}
                      </Field>
                    )}

                    <Field label="Monto">
                      <input
                        value={form.monto}
                        onChange={(event) => patchForm({ monto: event.target.value })}
                        required
                        min="1"
                        type="number"
                        className="field font-mono text-lg font-black"
                        placeholder="0"
                      />
                    </Field>
                  </div>

                  <div className="space-y-4">
                    {mode === 'crear_por_pagar' ? (
                      <Field label="Fecha de vencimiento">
                        <input
                          value={form.fecha_vencimiento}
                          onChange={(event) => patchForm({ fecha_vencimiento: event.target.value })}
                          type="date"
                          className="field"
                        />
                      </Field>
                    ) : (
                      <Field label="Fecha">
                        <input value={form.fecha} onChange={(event) => patchForm({ fecha: event.target.value })} type="date" className="field" />
                      </Field>
                    )}

                    <Field label="Descripción">
                      <input
                        value={form.descripcion}
                        onChange={(event) => patchForm({ descripcion: event.target.value })}
                        required
                        className="field"
                        placeholder="Concepto operativo"
                      />
                    </Field>
                  </div>
                </div>
              </section>
            )}

            <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Vínculo operativo</p>
                  <h3 className="text-sm font-bold text-stone-950">Proyecto y tercero</h3>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                  Paso 2
                </span>
              </div>
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <RelationSelect label="Proyecto" value={form.proyecto_id} items={proyectos} onChange={(value) => patchForm({ proyecto_id: value })} />
                {(mode === 'crear_por_pagar' || mode === 'liquidar_obligacion') ? (
                  <ThirdPartySelector
                    value={thirdPartyValue}
                    options={thirdPartyOptions}
                    onChange={handleThirdPartyChange}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-white/70 p-4">
                    <p className="text-xs font-bold text-stone-500">Tercero</p>
                    <p className="mt-2 text-xs text-stone-500">
                      Este flujo no requiere seleccionar tercero.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">Soporte documental</p>
                  <h3 className="text-sm font-bold text-stone-950">Comprobante o evidencia</h3>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-500">
                  Paso 3
                </span>
              </div>
              <Field label="Comprobante / referencia">
                <SmartImageInput
                  value={form.comprobante_ref}
                  onChange={(value) => patchForm({ comprobante_ref: value })}
                  accept="image/*,video/*,application/pdf"
                  placeholder="Pega una URL, sube una foto o un PDF de soporte"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
                  Este campo admite enlace, imagen, video o PDF. Si solo tienes un número de soporte, puedes escribirlo aquí como texto.
                </p>
              </Field>
            </section>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMode(null)}
                className="min-h-11 flex-1 rounded-lg border border-stone-300 bg-white px-4 text-sm font-bold text-stone-700 hover:bg-stone-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isExecuting}
                className="min-h-11 flex-1 rounded-lg bg-stone-950 px-4 text-sm font-black text-white hover:bg-stone-800 disabled:opacity-60"
              >
                {isExecuting ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function FinanceCard({
  title,
  amount,
  detail,
  icon,
  tone,
  actionLabel,
  onAction,
  children,
  compact = false
}: {
  title: string;
  amount: number;
  detail: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'rose' | 'sky';
  actionLabel: string;
  onAction: () => void;
  children?: React.ReactNode;
  compact?: boolean;
}) {
  const toneClass = {
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
    sky: 'text-sky-700 bg-sky-50 border-sky-200'
  }[tone];

  return (
    <article className="flex min-h-[220px] flex-col justify-between rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase text-stone-500">{title}</p>
          <p className="mt-4 font-mono text-3xl font-black tracking-tight text-stone-950">{currency(amount)}</p>
          <p className="mt-2 text-sm font-semibold text-stone-500">{detail}</p>
          {!compact && children}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${toneClass}`}>{icon}</div>
      </div>
      {!compact && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 text-sm font-black text-stone-950 transition hover:bg-amber-400"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      )}
    </article>
  );
}

function Panel({
  title,
  icon,
  description,
  actionLabel,
  onAction,
  children
}: {
  title: string;
  icon: React.ReactNode;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-stone-200 bg-stone-100/40 p-3">
      <div className="mb-3 flex items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-black uppercase text-stone-600">
            {icon}
            {title}
          </div>
          {description && <p className="mt-1 text-xs font-semibold text-stone-500">{description}</p>}
        </div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-stone-950 px-3 text-xs font-black text-white transition hover:bg-stone-800"
          >
            <Plus className="h-3.5 w-3.5" />
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-stone-300 bg-white p-6 text-center text-sm font-semibold text-stone-500">{text}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase text-stone-600">{label}</span>
      {children}
    </label>
  );
}

function RelationSelect({
  label,
  value,
  items,
  onChange
}: {
  label: string;
  value: string;
  items: RecordItem<NamedEntity>[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field">
        <option value="">Sin relacion</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {entityLabel(item)}
          </option>
        ))}
      </select>
    </Field>
  );
}

function ThirdPartySelector({
  value,
  options,
  onChange
}: {
  value: string;
  options: ThirdPartyOption[];
  onChange: (value: string) => void;
}) {
  const [filter, setFilter] = useState<ThirdPartyFilter>('all');
  const filteredOptions = filter === 'all' ? options : options.filter((option) => option.kind === filter);

  return (
    <Field label="Tercero">
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-stone-200 bg-stone-100 p-1">
          {[
            { value: 'all' as const, label: 'Todos' },
            { value: 'proveedor' as const, label: 'Proveedores' },
            { value: 'usuario' as const, label: 'Equipo' }
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={`min-h-9 rounded-md px-2 text-xs font-black transition ${
                filter === item.value ? 'bg-white text-stone-950 shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Combobox
          value={value}
          options={filteredOptions}
          onValueChange={onChange}
          placeholder="Buscar tercero"
          searchPlaceholder="Nombre, empresa o equipo"
          emptyMessage="No hay terceros para este filtro."
          className="min-h-11 rounded-lg border-stone-300 bg-white text-sm font-semibold"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 text-xs font-bold text-stone-600 transition hover:bg-stone-100"
          >
            <X className="h-3.5 w-3.5" />
            Quitar tercero
          </button>
        )}
      </div>
    </Field>
  );
}
