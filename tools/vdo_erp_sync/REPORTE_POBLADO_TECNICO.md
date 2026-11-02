# REPORTE_POBLADO_TECNICO.md — Manifiesto de Aprobación para Push Real

> **Estado:** PENDIENTE DE APROBACIÓN DEL SUPERVISOR.
> **Regla invariable:** Ningún `UPDATE` con `mutated: true` se ejecuta en Neon hasta que este reporte sea revisado y aprobado explícitamente.
> **Prerrequisito:** El dry-run en lote (`src/sync_push_batch_dryrun.ts`) debe ejecutarse sin errores y certificar `mutated: false` y `dry_run: true` para todas las entradas.

---

## 1. Resumen ejecutivo

- **Tabla objetivo:** `productos_catalogo` (Neon PostgreSQL, ORM Drizzle)
- **Columna a poblar:** `campos_personalizados` (JSONB) — único campo autoría técnica CAD
- **Campos protegidos (intocables):** `sku`, `descripcion`, `precio_publico`, `precio_directo`, `stock_actual`, `unidad_medida`, `categoria_comercial`, `proveedor_id`, `anulado`, `publicado_web`
- **Estado actual de `campos_personalizados`:** 100 % vacío (`[]`) en los 298 productos vivos
- **SKUs mapeados para enriquecimiento técnico:** 16 (ver sección 3)

---

## 2. Origen de los parámetros

Los valores provienen de `src/cad_params_mapping.ts`, matriz validada con esquemas Zod por categoría:

| Categoría | Esquema Zod | Ejemplo de valores |
|---|---|---|
| bisagra | `BisagraSchema` | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "parche" }` |
| corredera_telescopica | `CorrederaTelescopicaSchema` | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 45.0 }` |
| corredera_oculta | `CorrederaOcultaSchema` | `{ delta_ancho: 49.0, cota_z: 10.0, pin_diametro: 6.0, notch_ancho: 25.0, notch_alto: 20.0 }` |
| sistema_corredizo | `SistemaCorredizoSchema` | `{ descuento_altura: 10.0, traslape: 25.0, riel_ancho: 26.0 }` |
| elevable | `ElevableSchema` | `{ sistema: "aventos", tipo: "HK", factor_potencia: 1.0, angulo_apertura: 107 }` |

---

## 3. SKUs reales de la DB identificados y mapeados

| # | SKU (DB) | Nombre comercial (DB) | Categoría CAD | Parámetros propuestos (campos_personalizados) |
|---|---|---|---|---|
| 1 | `AUTO-000229` | Bisagra clip Blum | bisagra | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "parche" }` |
| 2 | `AUTO-000109` | Bisagra oculta | bisagra | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "semiparche" }` |
| 3 | `AUTO-000165` | Bisagra cuadrada | bisagra | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "embebida" }` |
| 4 | `AUTO-000002` | Bisagras puerta batiente plus cierre lento | bisagra | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "parche" }` |
| 5 | `AUTO-000016` | bisagaras cierrelento plus | bisagra | `{ cota_k: 4.0, diametro_cazoleta: 35.0, profundidad_cazoleta: 11.5, tipo_montaje: "semiparche" }` |
| 6 | `AUTO-000259` | Corredera Cajón cierre suave oculto \| Unihoper | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 45.0 }` |
| 7 | `AUTO-000261` | Corredera cierre suave oculto TOIN | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 45.0 }` |
| 8 | `AUTO-000140` | Corredera cajón de aluminio Toin | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.5, carga_kg: 30.0 }` |
| 9 | `AUTO-000047` | Corredera cajón cierre suave aluminio | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.5, carga_kg: 30.0 }` |
| 10 | `vidrio caj` | Corredera cajón lateral de vidrio cierre suave | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 25.0 }` |
| 11 | `AUTO-000135` | Corredera cajón push | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 11.0, carga_kg: 35.0 }` |
| 12 | `AUTO-000139` | RB-01(S) 550mm CORREDERA EXT. 1.0 PLATEADA 55 75 Lbs | corredera_telescopica | `{ holgura_lateral: 12.7, ranura_fondo: 5.5, cota_ranura_z: 10.0, carga_kg: 34.0 }` |
| 13 | `AUTO-000259` | Corredera Cajón cierre suave oculto \| Unihoper | corredera_oculta | `{ delta_ancho: 49.0, cota_z: 10.0, pin_diametro: 6.0, notch_ancho: 25.0, notch_alto: 20.0 }` |
| 14 | `AUTO-000261` | Corredera cierre suave oculto TOIN | corredera_oculta | `{ delta_ancho: 45.0, cota_z: 10.5, pin_diametro: 6.0, notch_ancho: 25.0, notch_alto: 20.0 }` |
| 15 | `SIS-PEU-ACO-261014` | Sistema de peurta acordeon plegaduc 2 y 4 H - Ducase | sistema_corredizo | `{ descuento_altura: 10.0, traslape: 25.0, riel_ancho: 26.0 }` |
| 16 | `AUTO-000153` | Blum Aventos HK top | elevable | `{ sistema: "aventos", tipo: "HK", factor_potencia: 1.0, angulo_apertura: 107 }` |
| 17 | `AUTO-000155` | Blum Aventos HF | elevable | `{ sistema: "aventos", tipo: "HF", factor_potencia: 1.0, angulo_apertura: 107 }` |
| 18 | `AUTO-000156` | Blum Aventos HK-XS | elevable | `{ sistema: "aventos", tipo: "HK-XS", factor_potencia: 1.0, angulo_apertura: 107 }` |

> **Nota:** `AUTO-000259` y `AUTO-000261` aparecen dos veces (corredera_telescopica y corredera_oculta) porque el producto combina ambas especificaciones técnicas. El push real escribirá un solo bloque por SKU; la categoría segunda se considera referencia cruzada.

---

## 4. SQL de rollback preventivo (por SKU)

Antes de cualquier push real, ejecutar este bloque para capturar el estado previo (vacío `[]`) y tener un punto de retorno inmediato:

```sql
-- ─── SNAPSHOT PRE-PUSH (ejecutar ANTES del push real) ───
-- Captura el estado actual de campos_personalizados para todos los SKUs mapeados.
SELECT sku, descripcion, precio_publico, stock_actual, proveedor_id, campos_personalizados, updated_at
FROM productos_catalogo
WHERE sku IN (
  'AUTO-000229','AUTO-000109','AUTO-000165','AUTO-000002','AUTO-000016',
  'AUTO-000259','AUTO-000261','AUTO-000140','AUTO-000047','vidrio caj',
  'AUTO-000135','AUTO-000139','SIS-PEU-ACO-261014','AUTO-000153','AUTO-000155','AUTO-000156'
)
ORDER BY sku;

-- ─── ROLLBACK: restaurar campos_personalizados a [] (estado previo) ───
-- Ejecutar SOLO si el push real produce inconsistencias y se requiere revertir.
UPDATE productos_catalogo
SET campos_personalizados = '[]'::jsonb,
    updated_at = now()
WHERE sku = '<SKU>';

-- Ejemplo rollback individual:
-- UPDATE productos_catalogo SET campos_personalizados = '[]'::jsonb, updated_at = now() WHERE sku = 'AUTO-000229';
```

**Rollback masivo (todos los SKUs mapeados de una vez):**

```sql
UPDATE productos_catalogo
SET campos_personalizados = '[]'::jsonb,
    updated_at = now()
WHERE sku IN (
  'AUTO-000229','AUTO-000109','AUTO-000165','AUTO-000002','AUTO-000016',
  'AUTO-000259','AUTO-000261','AUTO-000140','AUTO-000047','vidrio caj',
  'AUTO-000135','AUTO-000139','SIS-PEU-ACO-261014','AUTO-000153','AUTO-000155','AUTO-000156'
);
```

---

## 5. Forma del push real (una vez aprobado)

Cada SKU se actualiza mediante `sync_push_cad_params` **sin `--dry-run`**:

```bash
infisical run --env dev -- npx tsx src/sync_push_cad_params.ts \
  AUTO-000229 '{ "cota_k": 4.0, "diametro_cazoleta": 35.0, "profundidad_cazoleta": 11.5, "tipo_montaje": "parche" }'
```

El script:
1. Valida `parametros_tecnicos` contra el esquema Zod de la categoría.
2. Ejecuta `UPDATE productos_catalogo SET campos_personalizados = $1::jsonb, updated_at = now() WHERE sku = $2`.
3. **Nunca** toca `precio_publico`, `descripcion`, `stock_actual`, `proveedor_id`.

---

## 6. Checklist de aprobación

- [ ] Dry-run en lote ejecutado: `mutated: false` y `dry_run: true` para todas las entradas.
- [ ] Matriz validada con Zod (0 errores de esquema).
- [ ] SKUs verificados como existentes en `productos_catalogo` (0 SKUs faltantes).
- [ ] Campos comerciales (precio, nombre, stock, proveedor_id) confirmados intactos en lectura previa.
- [ ] Snapshot pre-push capturado (sección 4).
- [ ] Aprobación explícita del Supervisor para proceder al push real.

---

## 7. Firma de aprobación

| Rol | Nombre | Fecha | Firma / Validación |
|---|---|---|---|
| Supervisor (Javier) | | | |
| Data Engineer | | | |

> Sin la casilla "Supervisor" firmada, el push real queda **bloqueado**.
