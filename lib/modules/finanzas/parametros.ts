// Tipos de roles para jornadas (parametrizables desde Finanzas)
export type RolJornada = 'desarrollador' | 'carpintero' | 'auxiliar';

// Tipos de costeo (parametrizables)
export type TipoCosto = 'por_modulos' | 'por_tiempo';

// Parámetros de jornadas para cálculo de costos (Tipo 2: por tiempo)
export interface ParametrosJornadas {
  // Valor por JORNADA (día) para cada rol — compatibilidad 1:1 con el legacy (hallazgo
  // 2026-08-20: el nombre del campo dice "hora" pero el valor siempre fue por jornada,
  // nunca se multiplica por horas).
  valorHoraPorRol: Record<RolJornada, string>;
  // Horas estimadas por tarea (clave: tareaId o nombreTarea)
  horasPorTarea: Record<string, number>;
  // Costo fijo de arriendo de taller por día
  arriendoTallerPorDia: string;
  // Días hábiles por mes (parámetro para prorratear arriendo)
  diasHabilesPorMes: number;
}

// Parámetros para Tipo 1: Por módulos y costos fijos
export interface ParametrosModulos {
  // Costo fijo por tipo de módulo
  costoPorModulo: Record<string, string>;
  // Módulos que componen cada tipo
  modulosPorTipo: Record<string, string[]>;
}

// Parámetros globales de Finanzas
export interface ParametrosFinanzas {
  tipoCostoDefault: TipoCosto;
  jornadas: ParametrosJornadas;
  modulos: ParametrosModulos;
}

// Valores default (NO hardcodeados, solo estructura)
// Estos valores deben ser configurados desde el panel de Finanzas
export const PARAMETROS_DEFAULT: ParametrosFinanzas = {
  tipoCostoDefault: 'por_tiempo',
  jornadas: {
    valorHoraPorRol: {
      desarrollador: '0',
      carpintero: '0',
      auxiliar: '0',
    },
    horasPorTarea: {},
    arriendoTallerPorDia: '0',
    diasHabilesPorMes: 25,
  },
  modulos: {
    costoPorModulo: {},
    modulosPorTipo: {},
  },
};

// Fórmulas de cálculo (NO hardcodeadas)

/**
 * Calcula costo de ensamblaje por tiempo
 * Fórmula: Σ (valorHoraPorRol[rol] × horasPorTarea[tarea] × cantidad) + (arriendoTallerPorDia / diasHabilesPorMes) × horasTotales
 */
export function calcularCostoEnsamblaje(
  params: ParametrosJornadas,
  tareas: { rol: RolJornada; horas: number; cantidad: number }[]
): number {
  const horasTotales = tareas.reduce((sum, t) => sum + t.horas * t.cantidad, 0);
  
  const costoManodeObra = tareas.reduce((sum, t) => {
    const valorHora = parseFloat(params.valorHoraPorRol[t.rol] || '0');
    return sum + valorHora * t.horas * t.cantidad;
  }, 0);
  
  const costoArriendoProrrateado = (parseFloat(params.arriendoTallerPorDia || '0') / params.diasHabilesPorMes) * horasTotales;
  
  return costoManodeObra + costoArriendoProrrateado;
}

/**
 * Calcula costo por módulos
 */
export function calcularCostoPorModulos(
  params: ParametrosModulos,
  modulosSeleccionados: string[]
): number {
  return modulosSeleccionados.reduce((sum, modulo) => {
    const costo = parseFloat(params.costoPorModulo[modulo] || '0');
    return sum + costo;
  }, 0);
}

/**
 * Calcula costo total según tipo de costeo
 */
export function calcularCostoTotal(
  params: ParametrosFinanzas,
  tipo: TipoCosto,
  datos: {
    tareas?: { rol: RolJornada; horas: number; cantidad: number }[];
    modulos?: string[];
  }
): number {
  switch (tipo) {
    case 'por_tiempo':
      if (!datos.tareas) return 0;
      return calcularCostoEnsamblaje(params.jornadas, datos.tareas);
    case 'por_modulos':
      if (!datos.modulos) return 0;
      return calcularCostoPorModulos(params.modulos, datos.modulos);
    default:
      return 0;
  }
}
