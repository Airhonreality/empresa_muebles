// ============================================================================
// vdo_erp_sync/src/cad_params_mapping.ts
// Matriz de mapeo: SKUs reales de la DB (tabla productos_catalogo) <-> esquemas
// de parámetros técnicos CAD formalizados en vdo_hardware_catalog.json.
//
// Este archivo es la fuente de verdad de qué SKU recibe qué bloque de
// parámetros CAD. Todos los SKUs listados fueron verificados como existentes
// en la auditoría Fase 2 (298 productos, 0 duplicados, campos_personalizados
// al 100% vacío).
//
// Reglas:
//   - Cada entrada asocia un SKU real de la DB con un bloque de parámetros.
//   - Los parámetros se validan con el esquema Zod de su categoría antes de
//     cualquier intento de escritura (incluso en dry-run).
//   - Los campos sagrados del cotizador (precio, nombre, stock, proveedor_id)
//     NUNCA aparecen aquí; solo se escriben en campos_personalizados (JSONB).
// ============================================================================

import { z } from 'zod';

/*────────────────────────────────────────────────────────────────────────────
  ESQUEMAS ZOD POR CATEGORÍA DE HERRASAJE
────────────────────────────────────────────────────────────────────────────*/

// Bisagras (Blum Clip, Bisagras ocultas, cuadradas, etc.)
export const BisagraSchema = z.object({
  cota_k: z.number().nonnegative().describe('Cota K de montaje (mm)'),
  diametro_cazoleta: z.number().nonnegative().describe('Diámetro de cazoleta (mm)'),
  profundidad_cazoleta: z.number().nonnegative().describe('Profundidad de cazoleta (mm)'),
  tipo_montaje: z.enum(['parche', 'semiparche', 'embebida']).describe('Tipo de montaje de la bisagra'),
});
export type BisagraParams = z.infer<typeof BisagraSchema>;

// Correderas telescópicas (TOIN, Unihoper y otras de cajón)
export const CorrederaTelescopicaSchema = z.object({
  holgura_lateral: z.number().nonnegative().describe('Holgura lateral por lado (mm)'),
  ranura_fondo: z.number().nonnegative().describe('Fondo ranurado (mm)'),
  cota_ranura_z: z.number().nonnegative().describe('Cota de ranura Z (mm)'),
  carga_kg: z.number().nonnegative().describe('Capacidad de carga (kg)'),
});
export type CorrederaTelescopicaParams = z.infer<typeof CorrederaTelescopicaSchema>;

// Correderas ocultas (Blum Tandem y homólogas)
export const CorrederaOcultaSchema = z.object({
  delta_ancho: z.number().nonnegative().describe('Delta de ancho (mm)'),
  cota_z: z.number().nonnegative().describe('Cota Z (mm)'),
  pin_diametro: z.number().nonnegative().describe('Diámetro del pin trasero (mm)'),
  notch_ancho: z.number().nonnegative().describe('Ancho de muesca (mm)'),
  notch_alto: z.number().nonnegative().describe('Alto de muesca (mm)'),
});
export type CorrederaOcultaParams = z.infer<typeof CorrederaOcultaSchema>;

// Sistemas corredizos (Ducasse D-52, AL-1535)
export const SistemaCorredizoSchema = z.object({
  descuento_altura: z.number().nonnegative().describe('Descuento de altura de hoja (mm)'),
  traslape: z.number().nonnegative().describe('Traslape mínimo (mm)'),
  riel_ancho: z.number().nonnegative().describe('Ancho de piso del riel doble (mm)'),
});
export type SistemaCorredizoParams = z.infer<typeof SistemaCorredizoSchema>;

// Elevables (Blum Aventos HK, HF, HK-XS)
export const ElevableSchema = z.object({
  sistema: z.literal('aventos').describe('Sistema de elevación'),
  tipo: z.enum(['HK', 'HF', 'HK-XS']).describe('Modelo Aventos'),
  factor_potencia: z.number().nonnegative().describe('Factor de potencia'),
  angulo_apertura: z.number().nonnegative().max(180).describe('Ángulo de apertura (grados)'),
});
export type ElevableParams = z.infer<typeof ElevableSchema>;

/*────────────────────────────────────────────────────────────────────────────
  TIPO DE ENTRADA DE MAPEO
────────────────────────────────────────────────────────────────────────────*/

export type CategoriaCad =
  | 'bisagra'
  | 'corredera_telescopica'
  | 'corredera_oculta'
  | 'sistema_corredizo'
  | 'elevable';

export interface CadParamEntry {
  sku: string;                    // SKU real existente en productos_catalogo
  categoria: CategoriaCad;        // Categoría técnica CAD
  descripcion_esperada: string;   // Nombre comercial esperado (verificado en DB)
  parametros: z.ZodTypeAny;       // Esquema Zod de validación
  valores: Record<string, unknown>; // Valores CAD a inyectar (campos_personalizados)
}

/*────────────────────────────────────────────────────────────────────────────
  MATRIZ DE MAPEO (SKU real DB -> parámetros CAD)
────────────────────────────────────────────────────────────────────────────*/

export const CAD_PARAMS_MAPPING: CadParamEntry[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BISAGRAS (Blum Clip, ocultas, cuadradas, batiente)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    sku: 'AUTO-000229',
    categoria: 'bisagra',
    descripcion_esperada: 'Bisagra clip Blum',
    parametros: BisagraSchema,
    valores: { cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: 'parche' },
  },
  {
    sku: 'AUTO-000109',
    categoria: 'bisagra',
    descripcion_esperada: 'Bisagra oculta',
    parametros: BisagraSchema,
    valores: { cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: 'semiparche' },
  },
  {
    sku: 'AUTO-000165',
    categoria: 'bisagra',
    descripcion_esperada: 'Bisagra cuadrada',
    parametros: BisagraSchema,
    valores: { cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: 'embebida' },
  },
  {
    sku: 'AUTO-000002',
    categoria: 'bisagra',
    descripcion_esperada: 'Bisagras puerta batiente plus cierre lento',
    parametros: BisagraSchema,
    valores: { cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: 'parche' },
  },
  {
    sku: 'AUTO-000016',
    categoria: 'bisagra',
    descripcion_esperada: 'bisagaras cierrelento plus',
    parametros: BisagraSchema,
    valores: { cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: 'semiparche' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CORREDERAS TELESCÓPICAS (TOIN, Unihoper, cajón)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    sku: 'AUTO-000259',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera Cajón cierre suave oculto | Unihoper',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 45.0 },
  },
  {
    sku: 'AUTO-000261',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera cierre suave oculto TOIN',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 45.0 },
  },
  {
    sku: 'AUTO-000140',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera cajón de aluminio Toin',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.5, carga_kg: 30.0 },
  },
  {
    sku: 'AUTO-000047',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera cajón cierre suave aluminio',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.5, carga_kg: 30.0 },
  },
  {
    sku: 'vidrio caj',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera cajón lateral de vidrio cierre suave',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 25.0 },
  },
  {
    sku: 'AUTO-000135',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'Corredera cajón push',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 11.0, carga_kg: 35.0 },
  },
  {
    sku: 'AUTO-000139',
    categoria: 'corredera_telescopica',
    descripcion_esperada: 'RB-01(S) 550mm CORREDERA EXT. 1.0 PLATEADA 55 75 Lbs',
    parametros: CorrederaTelescopicaSchema,
    valores: { holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 34.0 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CORREDERAS OCULTAS (Blum Tandem y homólogas)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    sku: 'AUTO-000259',
    categoria: 'corredera_oculta',
    descripcion_esperada: 'Corredera Cajón cierre suave oculto | Unihoper',
    parametros: CorrederaOcultaSchema,
    valores: { delta_ancho: 49.0, cota_z: 10.0, pin_diametro: 6.0, notch_ancho: 25.0, notch_alto: 20.0 },
  },
  {
    sku: 'AUTO-000261',
    categoria: 'corredera_oculta',
    descripcion_esperada: 'Corredera cierre suave oculto TOIN',
    parametros: CorrederaOcultaSchema,
    valores: { delta_ancho: 45.0, cota_z: 10.5, pin_diametro: 6.0, notch_ancho: 25.0, notch_alto: 20.0 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SISTEMAS CORREDIZOS (Ducasse D-52, AL-1535)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    sku: 'SIS-PEU-ACO-261014',
    categoria: 'sistema_corredizo',
    descripcion_esperada: 'Sistema de peurta acordeon plegaduc 2 y 4 H - Ducase',
    parametros: SistemaCorredizoSchema,
    valores: { descuento_altura: 10.0, traslape: 25.0, riel_ancho: 26.0 },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ELEVABLES (Blum Aventos HK, HF, HK-XS)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    sku: 'AUTO-000153',
    categoria: 'elevable',
    descripcion_esperada: 'Blum Aventos HK top',
    parametros: ElevableSchema,
    valores: { sistema: 'aventos', tipo: 'HK', factor_potencia: 1.0, angulo_apertura: 107 },
  },
  {
    sku: 'AUTO-000155',
    categoria: 'elevable',
    descripcion_esperada: 'Blum Aventos HF',
    parametros: ElevableSchema,
    valores: { sistema: 'aventos', tipo: 'HF', factor_potencia: 1.0, angulo_apertura: 107 },
  },
  {
    sku: 'AUTO-000156',
    categoria: 'elevable',
    descripcion_esperada: 'Blum Aventos HK-XS',
    parametros: ElevableSchema,
    valores: { sistema: 'aventos', tipo: 'HK-XS', factor_potencia: 1.0, angulo_apertura: 107 },
  },
];

/*────────────────────────────────────────────────────────────────────────────
  VALIDACIÓN DE TODA LA MATRIZ (fail-fast si algún esquema falla)
────────────────────────────────────────────────────────────────────────────*/

export function validarMatrizCompleta(): { ok: true; total: number } | { ok: false; errores: Array<{ sku: string; razon: string }> } {
  const errores: Array<{ sku: string; razon: string }> = [];

  for (const entrada of CAD_PARAMS_MAPPING) {
    const resultado = entrada.parametros.safeParse(entrada.valores);
    if (!resultado.success) {
      errores.push({
        sku: entrada.sku,
        razon: `validación CAD falló: ${resultado.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
      });
    }
  }

  if (errores.length > 0) {
    return { ok: false, errores };
  }

  return { ok: true, total: CAD_PARAMS_MAPPING.length };
}
