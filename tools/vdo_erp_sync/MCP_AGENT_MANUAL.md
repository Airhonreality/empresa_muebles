# MCP_AGENT_MANUAL — Manual de Operación del Ciclo de Herrajes (Sistema VDO / Neon)

> **Guía canónica de referencia para agentes de IA** que operen autónomamente el ciclo de vida de herrajes entre el sistema CAD paramétrico (VDO / FreeCAD) y la base de datos comercial del ERP (Neon PostgreSQL).
>
> **Objetivo:** Garantizar un enriquecimiento técnico tipado, indestructible y auditablesobre la columna JSONB `campos_personalizados` de la tabla `productos_catalogo`, sin tocar nunca los campos comerciales (precios, nombres, stock, proveedor).

---

## 0. Estructura del subsistema

```
tools/vdo_erp_sync/
├── src/
│   ├── db.ts                 # Cliente Postgres (DATABASE_URL solo por entorno)
│   ├── schemas.ts            # Esquemas Zod (validación estricta)
│   ├── types.ts              # Tipos TypeScript compartidos
│   ├── cad_params_mapping.ts # Matriz SKU DB <-> parámetros CAD
│   ├── sync_pull_catalog.ts  # Flujo A+B: ingesta ERP -> JSON (herramientas + FreeCAD)
│   ├── sync_push_cad_params.ts# Flujo D: push atómico de params CAD (--dry-run)
│   ├── sync_push_batch_dryrun.ts # Dry-run en lote (certificación sin mutación)
│   └── sync_create_product.ts# Creación de producto (validada)
├── MCP_AGENT_MANUAL.md       # Este documento
├── README_MCP_SYNC.md        # Norma de uso para agentes IA (herramientas MCP)
├── REPORTE_POBLADO_TECNICO.md# Manifiesto de aprobación + SQL rollback
├── INFISICAL_ENV.md          # Gestión de secretos (Infisical)
├── package.json
└── tsconfig.json
```

**Regla de aislamiento:** Este subsistema vive fuera de `Macro/`. La carpeta de macros de FreeCAD (`/home/javi/.local/share/FreeCAD/Macro/`) solo contiene código Python, macros e iconos SVG — ningún residuo de Node.js (`package.json`, `tsconfig.json`, `node_modules`, `*.ts`).

---

## 1. Autenticación y conexión a Neon (Infisical)

Toda operación que toque Neon requiere `DATABASE_URL` inyectada por el entorno, nunca hardcodeada.

```bash
# 1. Verificar sesión Infisical
infisical login status

# 2. (Si expiró) Volver a autenticar
infisical login

# 3. Exportar entorno (nada queda en disco)
infisical export --env dev --format dotenv > .env.local
set -a; . .env.local; set +a

# 4. Ejecutar cualquier script con secretos inyectados
infisical run --env dev -- npx tsx src/<script>.ts [...args]

# 5. Prueba de recuperación de secreto
infisical secrets get DATABASE_URL --env dev
```

> **Restricción invariable:** `DATABASE_URL` solo vía variable de entorno. Prohibido escribirla en archivos fuente.

---

## 2. Flujos de operación (ciclo de herrajes)

### Flujo A — Ingesta de Ficha Técnica (PDF / imagen / texto)

**Entrada:** archivo de ficha técnica (PDF, imagen DWG/DXF, o texto libre) con cotas del herraje.

**Pasos:**
1. Leer el documento fuente (PDF/imagen/texto).
2. Extraer las cotas críticas relevantes a la categoría del herraje:
   - **Bisagras:** Ø cazoleta, profundidad cazoleta, cota K, tipo montaje (parche/semiparche/embebida).
   - **Corredoreras telescópicas:** holgura lateral, fondo ranurado, cota ranura Z, carga kg.
   - **Corredoreras ocultas:** delta ancho, cota Z, diámetro pin, notch ancho, notch alto.
   - **Sistemas corredizos:** descuento altura hoja, traslape, ancho piso riel doble.
   - **Elevables (Blum Aventos):** sistema, tipo (HK/HF/HK-XS), factor potencia, ángulo apertura.
3. Normalizar valores a números (mm, kg, grados) y enum de tipo montaje.
4. Salida del Flujo A: un objeto JSON con los parámetros técnicos extraídos, listo para el Flujo B.

**Validación de entrada:** si falta una cota obligatoria para la categoría, el flujo se detiene y se solicita aclaración — no se rellena con valores inventados.

---

### Flujo B — Parametrización estricta validada con Zod

**Entrada:** objeto JSON de parámetros técnicos (salida del Flujo A) + SKU destino.

**Pasos:**
1. Seleccionar el esquema Zod según la categoría del herraje (`schemas.ts`):
   - `BisagraSchema`, `CorrederaTelescopicaSchema`, `CorrederaOcultaSchema`,
   - `SistemaCorredizoSchema`, `ElevableSchema`.
2. Ejecutar `esquema.safeParse(parametros)`.
3. Si falla: abortar y reportar los campos inválidos (no se intenta escritura).
4. Si pasa: los parámetros están tipados y listos para el gatekeeper CAD.

> **Regla:** Nada se envía a Neon sin pasar primero por `safeParse` del esquema Zod correspondiente.

---

### Flujo C — Gatekeeper CAD (prueba de corte 3D local en FreeCAD)

**Antes de tocar la nube**, el agente debe verificar que las cotas extraídas son físicamente coherentes con el modelo 3D del herraje en FreeCAD.

**Pasos:**
1. Abrir el modelo 3D del herraje en FreeCAD (workbench VDO).
2. Ejecutar una prueba de corte / medición local que confirme:
   - Ø cazoleta coincide con el modelo (ej. 35 mm).
   - Cota K y cota Z dentro de tolerancia.
   - Holguras y traslapes compatibles con el modelo.
3. Si la prueba de corte 3D falla: corregir las cotas en el Flujo A y repetir.
4. Si pasa: generar un "certificado de corte 3D" (booleano `gate_ok = true`) que acompañe los parámetros.

> **Regla de oro del gatekeeper:** `gate_ok = false` bloquea el paso al Flujo D. No se envían parámetros no verificados en 3D.

---

### Flujo D — Sincronización vía MCP a Neon DB

**Entrada:** SKU válido en `productos_catalogo`, parámetros CAD validados (Zod), `gate_ok = true`.

**Pasos:**
1. Ejecutar `sync_push_cad_params.ts` con `--dry-run` primero:
   ```bash
   infisical run --env dev -- npx tsx src/sync_push_cad_params.ts \
     <SKU> '{ "cota_k": 4.0, ... }' --dry-run
   ```
2. Certificar que la respuesta tenga `mutated: false` y `dry_run: true`.
3. Verificar que `campos_antes` sea `[]` (o el estado previo conocido) y `campos_despues` contenga los parámetros CAD.
4. **Solo tras verificación del dry-run**, y con aprobación explícita del Supervisor, ejecutar sin `--dry-run` para el push real:
   ```bash
   infisical run --env dev -- npx tsx src/sync_push_cad_params.ts \
     <SKU> '{ "cota_k": 4.0, ... }'
   ```
5. El script ejecuta `UPDATE productos_catalogo SET campos_personalizados = $1::jsonb, updated_at = now() WHERE sku = $2`.

**Restricciones invariables (regla de oro):**
- **Solo** se actualiza `campos_personalizados` (JSONB).
- **Prohibido total:** tocar `precio_publico`, `precio_directo`, `descripcion`, `stock_actual`, `unidad_medida`, `categoria_comercial`, `proveedor_id`, `sku`, `anulado`, `publicado_web`.
- **Dry-run obligatorio primero** antes de cualquier `mutated: true`.
- **Push real en HOLD** hasta que el Agente 6 concluya el Smoke Test de ensamblaje L3 en el 3D (decisión de Supervisión).

---

### Flujo E — Rollback de emergencia

Si tras un push real se detecta inconsistencia (parámetros erróneos, campo comercial afectado, etc.):

**Pasos:**
1. Ejecutar el SQL de rollback preventivo (capturado en `REPORTE_POBLADO_TECNICO.md`, sección 4):

```sql
-- Restaurar campos_personalizados a estado vacío (previo al push)
UPDATE productos_catalogo
SET campos_personalizados = '[]'::jsonb,
    updated_at = now()
WHERE sku = '<SKU_afectado>';
```

2. O rollback masivo de todos los SKUs mapeados:

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

3. Verificar con `SELECT` que `campos_personalizados = []` y que los campos comerciales estén intactos.
4. Reportar el incidente al Supervisor antes de reintentar.

---

## 3. Comandos CLI estándar (herramientas MCP)

Ejecutar desde `tools/vdo_erp_sync/` con `DATABASE_URL` inyectada por Infisical.

| Flujo | Comando | Efecto |
|-------|---------|--------|
| A+B | `infisical run --env dev -- npx tsx src/sync_pull_catalog.ts` | Lee Neon (solo lectura), valida con Zod, escribe `vdo_hardware_catalog.json` en `tools/vdo_erp_sync/` y en `Macro/` |
| B | `npx tsc --noEmit` | Valida tipado de todo el subsistema |
| D (dry-run) | `infisical run --env dev -- npx tsx src/sync_push_cad_params.ts <SKU> '<json>' --dry-run` | Simula push, `mutated: false`, sin tocar BD |
| D (real) | `infisical run --env dev -- npx tsx src/sync_push_cad_params.ts <SKU> '<json>'` | Push real (solo tras aprobación y HOLD levantado) |
| D (lote dry-run) | `infisical run --env dev -- npx tsx src/sync_push_batch_dryrun.ts` | Dry-run de los 18 SKUs mapeados |
| Creación | `infisical run --env dev -- npx tsx src/sync_create_product.ts <SKU> "<DESC>" [CAT]` | Inserta producto nuevo (categoría válida obligatoria) |

---

## 4. Campos protegidos vs. autoría técnica CAD

**SAGRADOS del cotizador (NUNCA tocar desde CAD):**
`sku`, `descripcion`, `precio_publico`, `precio_directo`, `stock_actual`, `unidad_medida`, `categoria_comercial`, `proveedor_id`, `anulado`, `publicado_web`.

**AUTORÍA TÉCNICA CAD (sí tocar, solo vía `campos_personalizados` JSONB):**
`parametros_tecnicos`, `ficha_tecnica_urls`, `modelo_3d_url`.

---

## 5. Verificación post-cambio

Tras cualquier modificación del subsistema, ejecutar:

```bash
cd tools/vdo_erp_sync
npx tsc --noEmit      # debe salir limpio (sin errores)
infisical run --env dev -- npx tsx src/sync_pull_catalog.ts  # debe leer 298 productos, 0 errores
```

---

## 6. Matriz de SKUs mapeados (referencia rápida)

| SKU | Nombre comercial | Categoría CAD |
|-----|------------------|---------------|
| AUTO-000229 | Bisagra clip Blum | bisagra |
| AUTO-000109 | Bisagra oculta | bisagra |
| AUTO-000165 | Bisagra cuadrada | bisagra |
| AUTO-000002 | Bisagras puerta batiente plus cierre lento | bisagra |
| AUTO-000016 | bisagaras cierrelento plus | bisagra |
| AUTO-000259 | Corredera Cajón cierre suave oculto \| Unihoper | corredera_telescopica / oculta |
| AUTO-000261 | Corredera cierre suave oculto TOIN | corredera_telescopica / oculta |
| AUTO-000140 | Corredera cajón de aluminio Toin | corredera_telescopica |
| AUTO-000047 | Corredera cajón cierre suave aluminio | corredera_telescopica |
| vidrio caj | Corredera cajón lateral de vidrio cierre suave | corredera_telescopica |
| AUTO-000135 | Corredera cajón push | corredera_telescopica |
| AUTO-000139 | RB-01(S) 550mm CORREDERA EXT. 1.0 PLATEADA | corredera_telescopica |
| SIS-PEU-ACO-261014 | Sistema de peurta acordeon plegaduc - Ducase | sistema_corredizo |
| AUTO-000153 | Blum Aventos HK top | elevable |
| AUTO-000155 | Blum Aventos HF | elevable |
| AUTO-000156 | Blum Aventos HK-XS | elevable |

---

## 7. Estatus de seguridad (HOLD)

- **Dry-run de los 18 SKUs:** aprobado (`mutated: false`, `dry_run: true`, 18/18 OK).
- **Push real con mutación:** EN HOLD hasta que el Agente 6 concluya el Smoke Test de ensamblaje L3 en el 3D.
- **Decisión de Supervisión:** no se autoriza `mutated: true` hasta levantar el HOLD.
