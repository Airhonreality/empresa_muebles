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

  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  // Calcular costo ejemplo para visualización
  const costoEjemplo = useMemo(() => {
    const valorHoraDev = parseFloat(form.jornadas.valorHoraPorRol.desarrollador) || 0;
    const valorHoraCar = parseFloat(form.jornadas.valorHoraPorRol.carpintero) || 0;
    const valorHoraAux = parseFloat(form.jornadas.valorHoraPorRol.auxiliar) || 0;
    const arriendo = parseFloat(form.jornadas.arriendoTallerPorDia) || 0;
    const diasHabiles = form.jornadas.diasHabilesPorMes || 25;
    
    // Ejemplo: 8 horas de desarrollo, 4 horas de carpintería, 2 horas de auxiliar
    const horasDev = 8;
    const horasCar = 4;
    const horasAux = 2;
    const horasTotales = horasDev + horasCar + horasAux;
    
    const costoManodeObra = 
      (valorHoraDev * horasDev) + 
      (valorHoraCar * horasCar) + 
      (valorHoraAux * horasAux);
    
    const costoArriendoProrrateado = (arriendo / diasHabiles) * horasTotales;
    
    return {
      manodeObra: costoManodeObra,
      arriendo: costoArriendoProrrateado,
      total: costoManodeObra + costoArriendoProrrateado,
    };
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
      ];
      
      updates.forEach(update => {
        store.parametros.actualizar(update.clave, update);
      });
      
      setMensaje({ tipo: "exito", texto: "Parámetros guardados correctamente" });
     } catch {
       setMensaje({ tipo: "error", texto: "Error al guardar parámetros" });
    } finally {
      setGuardando(false);
    }
  }, [form, store]);

  const handleReset = useCallback(() => {
    setForm(PARAMETROS_DEFAULT);
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
            Tarifas por Rol (Valor Hora / Hombre)
          </h2>
        </div>
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

      {/* Ejemplo de cálculo */}
      <div className="border border-border-subtle rounded-lg bg-bg-alt/40 p-6 mb-6">
        <h2 className="text-lg font-semibold text-text-heading mb-4">
          Ejemplo de Cálculo (8h Dev + 4h Car + 2h Aux)
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Costo Mano de Obra:</span>
            <span className="font-mono text-text-heading">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(costoEjemplo.manodeObra)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Arriendo Taller (prorrateado):</span>
            <span className="font-mono text-text-heading">
              {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(costoEjemplo.arriendo)}
            </span>
          </div>
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
