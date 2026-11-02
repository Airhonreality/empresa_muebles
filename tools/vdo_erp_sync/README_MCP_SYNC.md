# README_MCP_SYNC — Protocolo de Sincronización VDO ↔ ERP (MCP)

> **Normativa obligatoria para todo agente de IA** que sincronice productos y parámetros técnicos entre el sistema CAD paramétrico (VDO / FreeCAD) y la base de datos comercial del ERP (Neon PostgreSQL).
>
> Objetivo: garantizar que **ningún agente rompa la integridad referencial ni los tipados del ERP**. Lectura y escritura son estrictamente tipadas (TypeScript + Zod). Ninguna escritura se hace a ciegas.

---

## 1. Alcance y arquitectura

- **Origen de datos (lectura):** Tabla `productos_catalogo` de Neon PostgreSQL (ORM Drizzle), esquema en `lib/db/schema.ts:777` del repo ERP (`empresa_muebles_clone_v3_NEW`).
- **Destino local:** `vdo_hardware_catalog.json` en la raíz de VDO (FreeCAD Macro).
- **Escritura hacia el ERP:** Únicamente la columna JSONB `campos_personalizados` (parámetros técnicos CAD) de la fila del SKU. **Nunca** `precio_publico`, `descripcion`, `sku`, `unidad_medida`, `categoria_comercial`, `proveedor_id`, `stock_actual`.
- **Capa de secretos:** Infisical CLI. La `DATABASE_URL` nunca se escribe en disco; se inyecta por el entorno.

---

## 2. Autenticación con Infisical

La sesión de Infisical debe estar activa antes de cualquier operación que toque Neon.

```bash
# 1. (Una sola vez) Verificar sesión activa
infisical login status

# 2. Si expiró, volver a autenticar (requiere navegador/OAuth)
infisical login

# 3. Asociar este proyecto local con el proyecto Infisical "empresa-muebles"
#    (ejecutar desde la raíz del ERP o de vdo_erp_sync según convenga)
infisical init

# 4. Importar variables del .env.local a Infisical (entorno dev)
#    Ejemplo por variable:
infisical secrets set DATABASE_URL --env dev
infisical secrets set NEON_API_KEY --env dev
infisical secrets set SESSION_SECRET --env dev
#    (repetir para cada variable del .env.local del ERP)

# 5. Exportar variables al entorno para ejecutar los scripts MCP
infisical export --env dev --format dotenv > .env.local
set -a; . .env.local; set +a

# 6. O directamente inyectar en la ejecución (recomendado, nada queda en disco)
infisical run --env dev -- npx tsx src/sync_pull_catalog.ts

# 7. Prueba de recuperación de un secreto
infisical secrets get DATABASE_URL --env dev
```

> **Nota de entorno:** En esta máquina la sesión de Infisical caducó (`infisical login status` → session expired). Es necesario ejecutar `infisical login` antes de cualquier operación de secretos. Los comandos arriba son la referencia reproducible de la Fase 1.

---

## 3. Estructura de tipos (TypeScript / Zod)

Todos los tipos viven en `src/types.ts` y los esquemas de validación en `src/schemas.ts`.

### Tabla ERP `productos_catalogo` (tipos detectados, Fase 2)

| Columna ERP | Tipo SQL | Tipo TS | Not-null | Observación |
|---|---|---|---|---|
| `id` | uuid | `string` | sí | PK |
| `sku` | text | `string` | sí | UNIQUE, identificador del herraje |
| `descripcion` | text | `string` | sí | Nombre comercial del herraje |
| `tipo` | text | `string \| null` | no | — |
| `unidad_medida` | text | `string` | sí | DEFAULT `'ud'` |
| `precio_directo` | numeric(14,2) | `number \| null` | no | Costo |
| `precio_publico` | numeric(14,2) | `number \| null` | no | **Sagrado del cotizador** |
| `stock_actual` | integer | `number` | sí | DEFAULT `0` |
| `proveedor_id` | uuid | `string \| null` | no | FK → `proveedores.id` |
| `imagen_url` | text | `string \| null` | no | — |
| `galeria_imagenes_url` | jsonb | `unknown[]` | sí | DEFAULT `[]` |
| `campos_personalizados` | jsonb | `unknown[]` | sí | **Parámetros técnicos CAD** (parche) |
| `ficha_tecnica_urls` | jsonb | `unknown[]` | sí | DEFAULT `[]` |
| `modelo_3d_url` | text | `string \| null` | no | — |
| `categoria_comercial` | text | `string \| null` | no | Dominio: Cocinas/Closets/Estudios/Comedores/Baños |
| `publicado_web` | boolean | `boolean` | sí | DEFAULT `false` |
| `anulado` | boolean | `boolean` | sí | DEFAULT `false` |
| `created_at`, `updated_at` | timestamp | `string` | sí | DEFAULT `now()` |
| `proyecto_origen_id` | uuid | `string \| null` | no | FK → `proyectos.id` |

### Validación de creación (sync_create_product)

```ts
CreateProductInputSchema = z.object({
  sku: z.string().min(1).regex(/^[A-Z0-9_-]+$/),
  descripcion: z.string().min(1),
  categoria_comercial: z.string().optional().refine(v => !v || ['Cocinas','Closets','Estudios','Comedores','Baños'].includes(v)),
  unidad_medida: z.string().default('ud'),
  precio_publico: z.number().nonnegative().nullable().optional(),
  proveedor_id: z.string().uuid().nullable().optional(),
  parametros_tecnicos: z.record(z.unknown()).default({}),
});
```

### Validación de push de parámetros CAD (sync_push_cad_params)

```ts
PushCadParamsInputSchema = z.object({
  sku: z.string().min(1),
  parametros_tecnicos: z.record(z.unknown()),
  dry_run: z.boolean().default(false),
});
```

---

## 4. Comandos CLI estándar (herramientas MCP)

Ejecutar desde la carpeta `vdo_erp_sync/` (requiere `npm install` una vez):

### 4.1 sync_pull_catalog — Pull del catálogo ERP → VDO (solo lectura)

```bash
# Con variables inyectadas por Infisical (nada en disco)
infisical run --env dev -- npx tsx src/sync_pull_catalog.ts

# O con .env.local ya exportado
npx tsx src/sync_pull_catalog.ts
```

**Efecto:** Lee todas las filas de `productos_catalogo`, valida cada una con `ErpProductoSchema`, mapea a formato VDO y sobregcribe `vdo_hardware_catalog.json`. Imprime un reporte: total_erp, insertados, actualizados, saltados, errores.

### 4.2 sync_push_cad_params — Push de parámetros técnicos CAD → ERP (atómico)

```bash
# Dry-run (simulación, SIN mutar la BD): recomendado siempre la primera vez
infisical run --env dev -- npx tsx src/sync_push_cad_params.ts \
  GEN-CAZ-35-PARCHE '{ "cota_k_default": 4.0, "diametro_cazoleta": 35.0 }' --dry-run

# Escritura real (solo toca campos_personalizados)
infisical run --env dev -- npx tsx src/sync_push_cad_params.ts \
  GEN-CAZ-35-PARCHE '{ "cota_k_default": 4.0, "diametro_cazoleta": 35.0 }'
```

**Efecto:** `UPDATE productos_catalogo SET campos_personalizados = $1::jsonb WHERE sku = $2`. No toca precios ni nombres.

### 4.3 sync_create_product — Crear herraje desde CAD → ERP

```bash
infisical run --env dev -- npx tsx src/sync_create_product.ts \
  "GEN-CAZ-35-PARCHE" "Bisagra Cazoleta 35mm Cierre Suave - Recta" Closets
```

**Efecto:** `INSERT` validando categoría, unidad de medida y SKU único. Falla si el SKU ya existe.

### 4.4 Typecheck

```bash
npx tsc --noEmit
```

---

## 5. Reglas inquebrantables de validación

| Regla | Descripción |
|---|---|
| **R1. Solo lectura primero** | Ninguna escritura a Neon sin haber ejecutado `sync_pull_catalog` y verificado el estado del SKU. |
| **R2. Campos sagrados intocables** | `sync_push_cad_params` NUNCA modifica: `sku`, `descripcion`, `precio_publico`, `precio_directo`, `unidad_medida`, `stock_actual`, `categoria_comercial`, `proveedor_id`, `anulado`, `publicado_web`. Solo `campos_personalizados` (JSONB). |
| **R3. Tipado obligatorio** | Toda fila leída del ERP pasa por `ErpProductoSchema` (Zod). Falle rápido si no calza. |
| **R4. SKU único** | `sync_create_product` rechaza SKUs duplicados. No sobreescribe nunca. |
| **R5. Dry-run obligatorio** | Cualquier `push` de parámetros debe ejecutarse primero con `--dry-run` para verificar el `antes`/`despues` sin mutar. |
| **R6. Categoría válida** | `categoria_comercial` debe estar en `['Cocinas','Closets','Estudios','Comedores','Baños']` (enum `shop_categoria` del ERP). |
| **R7. Secretos fuera del repo** | `DATABASE_URL` y demás secretos viven solo en Infisical. Nunca commitear `.env.local` ni valores reales. |
| **R8. Transacción atómica** | El `UPDATE` de `campos_personalizados` va con `updated_at = now()` en una sola sentencia. |

### Qué es sagrado del cotizador (NO tocar desde CAD)
`sku`, `descripcion`, `precio_publico`, `precio_directo`, `unidad_medida`, `stock_actual`, `categoria_comercial`, `proveedor_id`.

### Qué es autoría técnica de CAD (SÍ tocar desde CAD)
`parametros_tecnicos` (vía `campos_personalizados`), `ficha_tecnica_urls`, `modelo_3d_url`.

---

## 6. Diagnóstico de Fase 2 (resumen)

Ejecutado sobre Neon (rama `ep-muddy-cherry` / `v3-preview`), tabla `productos_catalogo`:

- **Total productos:** 298
- **SKUs nulos/vacíos:** 0
- **SKUs duplicados:** 0 (únicos)
- **Anulados:** 2 (`AUTO-000093` Puerta de paso, `AUTO-000219` luz led)
- **`campos_personalizados` (JSONB técnico):** 100 % vacíos `[]` — no hay parámetros técnicos cargados en el ERP todavía.
- **`proveedor_id`:** todos `null` (no hay enlace a `proveedores`).
- **Precios:** en COP (pesos colombianos), no USD.
- **SKUs:** mezcla de secuenciales `AUTO-000001…AUTO-000278` y algunos descriptivos (`BOT-POM-20M-261014`, `SIS-PEU-ACO-261014`, `cajled000`, `gola`, etc.).
- **Categorías:** mayoría `null`; algunas `consolas`, `mesas`, `camas`, `cavas`, `Herrajes`, `Accesorios`, `Tableros`, `paneles`.

Mapeo ERP ↔ VDO (tabla comparativa):

| Campo ERP / DB | ←→ | Propiedad VDO Hardware Hub |
|---|---|---|
| `productos_catalogo.sku` | ←→ | clave de entrada bajo cada categoría (ej. `GEN-CAZ-35-PARCHE`) |
| `productos_catalogo.descripcion` | ←→ | `nombre` |
| `productos_catalogo.categoria_comercial` | ←→ | clave de categoría (ej. `bisagra_cazoleta`, `sistema_corredizo`) |
| `productos_catalogo.campos_personalizados` (jsonb) | ←→ | `parametros_tecnicos` |
| `productos_catalogo.precio_publico` | ←→ | `precio_unitario` (moneda VDO `USD`; ERP en COP) |
| `proveedores.nombre` (vía FK) | ←→ | `proveedor` |
| `productos_catalogo.modelo_3d_url` | ←→ | (reservado para enlace al modelo FreeCAD) |

---

## 7. Plan de validación

1. **Prueba de lectura:** `sync_pull_catalog` → debe listar 298 productos y escribir `vdo_hardware_catalog.json` sin errores de validación.
2. **Dry-run de push:** `sync_push_cad_params --dry-run` sobre un SKU existente → debe devolver `mutated: false` y mostrar `campos_antes`/`campos_despues` sin tocar la BD.
3. **Push real (opcional, solo con aprobación del Supervisor):** ejecutar sin `--dry-run` y verificar que solo `campos_personalizados` cambió.
