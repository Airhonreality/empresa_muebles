"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/veta/button";
import { MoneyInput } from "@/components/veta/money-input";
import { NumberInput } from "@/components/veta/number-input";
import { useDataStore } from "@/lib/data";
import { PARAMETROS_DEFAULT, type ParametrosFinanzas, type RolJornada, type TipoCosto } from "@/lib/modules/finanzas";

// Claves de parámetros en la base de datos (mock)
const PARAM_KEYS = {
  valorHoraDesarrollador: "valor_hora_desarrollador",
  valorHoraCarpintero: "valor_hora_carpintero",
  valorHoraAuxiliar: "valor_hora_auxiliar",
  arriendoTallerPorDia: "arriendo_taller_por_dia",
  diasHabilesPorMes: "dias_habiles_por_mes",
  tipoCostoDefault: "tipo_costo_default",
  // A-01: compensación diseño 3D / hora extra (plan_ola7_maestro.md §4)
  netoDiseno3dPct: "neto_diseno_3d_pct",
  ivaDiseno3dPct: "iva_diseno_3d_pct",
  recargoHoraExtraPct: "recargo_hora_extra_pct",
  // A-02: umbrales de check_produccion / comisión (nucleo/mini_diamante_check_produccion.md)
  umbralTodoBienPct: "umbral_todo_bien_pct",
  umbralExtremoPct: "umbral_extremo_pct",
  reduccionComisionNovedadPct: "reduccion_comision_novedad_pct",
  reduccionComisionExtremoPct: "reduccion_comision_extremo_pct",
} as const;

export default function FinanzasParametrosPage() {
  const store = useDataStore();
  
  // Cargar parámetros actuales desde el store (mock)
  const parametros = store.parametros.listar();
  
  // Estado local para el formulario
  const [form, setForm] = useState<ParametrosFinanzas>(() => {
    // Intentar cargar desde parametros o usar defaults
    const getParam = (key: string) => {
      const param = parametros.find(p => p.clave === key);
      return param?.valorNumeric ?? param?.valorTexto ?? null;
    };
    
    return {
      tipoCostoDefault: (getParam(PARAM_KEYS.tipoCostoDefault) as "por_modulos" | "por_tiempo") ?? PARAMETROS_DEFAULT.tipoCostoDefault,
      jornadas: {
        valorHoraPorRol: {
          desarrollador: getParam(PARAM_KEYS.valorHoraDesarrollador) ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.desarrollador,
          carpintero: getParam(PARAM_KEYS.valorHoraCarpintero) ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.carpintero,
          auxiliar: getParam(PARAM_KEYS.valorHoraAuxiliar) ?? PARAMETROS_DEFAULT.jornadas.valorHoraPorRol.auxiliar,
        },
        horasPorTarea: PARAMETROS_DEFAULT.jornadas.horasPorTarea,
        arriendoTallerPorDia: getParam(PARAM_KEYS.arriendoTallerPorDia) ?? PARAMETROS_DEFAULT.jornadas.arriendoTallerPorDia,
        diasHabilesPorMes: parseInt(getParam(PARAM_KEYS.diasHabilesPorMes) ?? String(PARAMETROS_DEFAULT.jornadas.diasHabilesPorMes)),
      },
      modulos: PARAMETROS_DEFAULT.modulos,
    };
  });

  // A-01/A-02: parámetros de compensación y umbrales de producción, pendientes de
  // confirmación (Supervisor/contador) — plan_ola7_maestro.md §4. Editables acá para
  // que la confirmación sea una edición en UI, no una decisión puntual fuera de código.
  const [gates, setGates] = useState(() => {
    const getParam = (key: string, fallback: string) => {
      const param = parametros.find(p => p.clave === key);
      return param?.valorNumeric ?? param?.valorTexto ?? fallback;
    };
    return {
      netoDiseno3dPct: getParam(PARAM_KEYS.netoDiseno3dPct, "97.50"),
      ivaDiseno3dPct: getParam(PARAM_KEYS.ivaDiseno3dPct, "19"),
      recargoHoraExtraPct: getParam(PARAM_KEYS.recargoHoraExtraPct, "25"),
      umbralTodoBienPct: getParam(PARAM_KEYS.umbralTodoBienPct, "0.95"),
      umbralExtremoPct: getParam(PARAM_KEYS.umbralExtremoPct, "0.70"),
      reduccionComisionNovedadPct: getParam(PARAM_KEYS.reduccionComisionNovedadPct, "0.50"),
      reduccionComisionExtremoPct: getParam(PARAM_KEYS.reduccionComisionExtremoPct, "1.00"),
    };
  });

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // Calcular costo ejemplo para visualización — misma fórmula que usa el cotizador real
  // (app/erp/cotizador/[proyectoId]/page.tsx: derivarTarifas): tarifa por jornada × jornadas,
  // sin conversión a horas ni arriendo (el cotizador real no suma arriendo al total).
  const costoEjemplo = useMemo(() => {
    const valorJornadaDev = parseFloat(form.jornadas.valorHoraPorRol.desarrollador) || 0;
    const valorJornadaCar = parseFloat(form.jornadas.valorHoraPorRol.carpintero) || 0;
    const valorJornadaAux = parseFloat(form.jornadas.valorHoraPorRol.auxiliar) || 0;

    // Ejemplo: 1 jornada de desarrollo, 1 de carpintería, 1 de auxiliar
    return { total: valorJornadaDev + valorJornadaCar + valorJornadaAux };
  }, [form]);

  const handleSubmit = useCallback(async () => {
    setGuardando(true);
    setMensaje(null);
    
    try {
      // Guardar cada parámetro individualmente en el store (mock)
      const updates = [
        { clave: PARAM_KEYS.valorHoraDesarrollador, valorTexto: form.jornadas.valorHoraPorRol.desarrollador },
        { clave: PARAM_KEYS.valorHoraCarpintero, valorTexto: form.jornadas.valorHoraPorRol.carpintero },
        { clave: PARAM_KEYS.valorHoraAuxiliar, valorTexto: form.jornadas.valorHoraPorRol.auxiliar },
        { clave: PARAM_KEYS.arriendoTallerPorDia, valorTexto: form.jornadas.arriendoTallerPorDia },
        { clave: PARAM_KEYS.diasHabilesPorMes, valorNumeric: String(form.jornadas.diasHabilesPorMes) },
        { clave: PARAM_KEYS.tipoCostoDefault, valorTexto: form.tipoCostoDefault },
        { clave: PARAM_KEYS.netoDiseno3dPct, valorNumeric: gates.netoDiseno3dPct },
        { clave: PARAM_KEYS.ivaDiseno3dPct, valorNumeric: gates.ivaDiseno3dPct },
        { clave: PARAM_KEYS.recargoHoraExtraPct, valorNumeric: gates.recargoHoraExtraPct },
        { clave: PARAM_KEYS.umbralTodoBienPct, valorNumeric: gates.umbralTodoBienPct },
        { clave: PARAM_KEYS.umbralExtremoPct, valorNumeric: gates.umbralExtremoPct },
        { clave: PARAM_KEYS.reduccionComisionNovedadPct, valorNumeric: gates.reduccionComisionNovedadPct },
        { clave: PARAM_KEYS.reduccionComisionExtremoPct, valorNumeric: gates.reduccionComisionExtremoPct },
      ];
      
      await Promise.all(updates.map(update => store.parametros.actualizar(update.clave, update)));
      
      setMensaje({ tipo: "exito", texto: "Parámetros guardados correctamente" });
     } catch {
       setMensaje({ tipo: "error", texto: "Error al guardar parámetros" });
    } finally {
      setGuardando(false);
    }
  }, [form, gates, store]);

  const handleReset = useCallback(() => {
    setForm(PARAMETROS_DEFAULT);
    setGates({
      netoDiseno3dPct: "97.50",
      ivaDiseno3dPct: "19",
      recargoHoraExtraPct: "25",
      umbralTodoBienPct: "0.95",
      umbralExtremoPct: "0.70",
      reduccionComisionNovedadPct: "0.50",
      reduccionComisionExtremoPct: "1.00",
    });
    setMensaje({ tipo: "exito", texto: "Parámetros restablecidos a valores por defecto" });
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-text-heading">
          Parámetros de Finanzas
        </h1>
        <p className="text-sm text-text-muted mt-1">
          Configuración de tarifas para cálculo de costos (Tipo 2: por tiempo)
        </p>
      </header>

      {mensaje && (
        <div className={`mb-4 p-3 rounded-md text-sm ${mensaje.tipo === "exito" ? "bg-emerald-50/80 text-emerald-700 border border-emerald-200" : "bg-red-50/80 text-red-700 border border-red-200"}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">Tipo de Costeo</h2>
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipoCosto"
              value="por_modulos"
              checked={form.tipoCostoDefault === "por_modulos"}
               onChange={() => setForm({ ...form, tipoCostoDefault: "por_modulos" as TipoCosto })}
              className="w-4 h-4 rounded border border-border-subtle text-brand focus:ring-brand focus:border-brand"
            />
            <span className="text-sm text-text-primary">Por Módulos y Costos Fijos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="tipoCosto"
              value="por_tiempo"
              checked={form.tipoCostoDefault === "por_tiempo"}
               onChange={() => setForm({ ...form, tipoCostoDefault: "por_tiempo" as TipoCosto })}
              className="w-4 h-4 rounded border border-border-subtle text-brand focus:ring-brand focus:border-brand"
            />
            <span className="text-sm text-text-primary">Por Tiempo (Ensamblaje, Taller, Instalación)</span>
          </label>
        </div>
      </div>

      <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">
            Tarifas por Rol (Valor por Jornada)
          </h2>
        </div>
        <p className="text-xs text-text-muted mb-4">
          Valor por jornada (día), no por hora — mismo valor que se manejaba en el sistema anterior.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {([
            { rol: "desarrollador" as RolJornada, label: "Desarrollador" },
            { rol: "carpintero" as RolJornada, label: "Carpintero" },
            { rol: "auxiliar" as RolJornada, label: "Auxiliar" },
          ] as const).map(({ rol, label }) => (
            <div key={rol}>
              <label className="block text-sm font-medium text-text-muted mb-1">
                {label}
              </label>
              <MoneyInput
                value={form.jornadas.valorHoraPorRol[rol]}
                onChange={(v) => setForm({
                  ...form,
                  jornadas: {
                    ...form.jornadas,
                    valorHoraPorRol: {
                      ...form.jornadas.valorHoraPorRol,
                      [rol]: v,
                    },
                  },
                })}
                label=""
                placeholder="0"
                className="w-full"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-heading">
            Costos Fijos
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Arriendo Taller por Día
            </label>
            <MoneyInput
              value={form.jornadas.arriendoTallerPorDia}
              onChange={(v) => setForm({
                ...form,
                jornadas: { ...form.jornadas, arriendoTallerPorDia: v },
              })}
              label=""
              placeholder="0"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Días Hábiles por Mes
            </label>
            <NumberInput
              value={String(form.jornadas.diasHabilesPorMes)}
              onChange={(v) => setForm({
                ...form,
                jornadas: { ...form.jornadas, diasHabilesPorMes: parseInt(v) || 25 },
              })}
              label=""
              min={1}
              max={31}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-text-heading">
            Comisiones y Diseño 3D
          </h2>
        </div>
        <p className="text-xs text-text-muted mb-4">
          A-01: valores estimados v1, pendientes de confirmación del contador (plan_ola7_maestro.md §4).
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Neto diseñador diseño 3D (%)
            </label>
            <NumberInput
              value={gates.netoDiseno3dPct}
              onChange={(v) => setGates({ ...gates, netoDiseno3dPct: v })}
              step={0.01}
              min={0}
              max={100}
              label=""
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              IVA diseño 3D (%)
            </label>
            <NumberInput
              value={gates.ivaDiseno3dPct}
              onChange={(v) => setGates({ ...gates, ivaDiseno3dPct: v })}
              step={0.01}
              min={0}
              max={100}
              label=""
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Recargo hora extra diurna (%)
            </label>
            <NumberInput
              value={gates.recargoHoraExtraPct}
              onChange={(v) => setGates({ ...gates, recargoHoraExtraPct: v })}
              step={0.01}
              min={0}
              max={100}
              label=""
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="border border-border-subtle rounded-lg bg-bg-alt/60 p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-text-heading">
            Umbrales de Check de Producción (15 días)
          </h2>
        </div>
        <p className="text-xs text-text-muted mb-4">
          A-02: valores estimados v1, pendientes de confirmación del Supervisor (nucleo/mini_diamante_check_produccion.md).
        </p>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Umbral &quot;todo bien&quot; (ratio 0–1)
            </label>
            <NumberInput
              value={gates.umbralTodoBienPct}
              onChange={(v) => setGates({ ...gates, umbralTodoBienPct: v })}
              step={0.01}
              min={0}
              max={1}
              label=""
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Umbral &quot;extremo&quot; (ratio 0–1)
            </label>
            <NumberInput
              value={gates.umbralExtremoPct}
              onChange={(v) => setGates({ ...gates, umbralExtremoPct: v })}
              step={0.01}
              min={0}
              max={1}
              label=""
              className="w-full"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Reducción comisión en novedad (%)
            </label>
            <NumberInput
              value={gates.reduccionComisionNovedadPct}
              onChange={(v) => setGates({ ...gates, reduccionComisionNovedadPct: v })}
              step={0.01}
              min={0}
              max={1}
              label=""
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-muted mb-1">
              Reducción comisión en extremo (%)
            </label>
            <NumberInput
              value={gates.reduccionComisionExtremoPct}
              onChange={(v) => setGates({ ...gates, reduccionComisionExtremoPct: v })}
              step={0.01}
              min={0}
              max={1}
              label=""
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Ejemplo de cálculo */}
      <div className="border border-border-subtle rounded-lg bg-bg-alt/40 p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-heading mb-4">
          Ejemplo de Cálculo (1 jornada de Dev + 1 de Car + 1 de Aux)
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-t border-border-subtle pt-2 mt-2">
            <span className="text-text-heading font-medium">Total Estimado:</span>
            <span className="font-mono text-lg font-semibold text-brand">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(costoEjemplo.total)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={guardando}
        >
          {guardando ? "Guardando..." : "Guardar Parámetros"}
        </Button>
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={guardando}
        >
          Restablecer a Default
        </Button>
      </div>
    </div>
  );
}
