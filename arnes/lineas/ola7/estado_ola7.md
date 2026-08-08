# Estado — Línea Técnica (Ola 6/7: ERP + Sitio)

Progreso detallado de la línea técnica. Se lee al arrancar cualquier sesión de esta línea y se actualiza al cerrar cada tarea. Ver `plan_ola7_maestro.md` para el contrato maestro F0-F9.

---

## 🧭 PASE DE TRAZABILIDAD PUNTO-0 — CERRADO (2026-08-07)

**Resultado:** bucle completo de 3 bloques ejecutado y verificado.

| Bloque | Artefacto | Estado |
|---|---|---|
| Fase 1 | Auditoría de dispersión | `reporte_bloque1_fase1.md` — FRAGMENTADO |
| Fase 2 | Lotes y ruta (Orquestador) | 9 lotes, 5 ondas, matriz de modelos |
| Bloque 2 | 9 subagentes de trazabilidad | 48 tablas trazadas, 9 JSONs en `resultados/l0..l8.json` |
| Bloque 3 | Cruce trans-lote + decisiones | 6/6 negocio cerradas, 10/10 técnicas axiomatizadas |
| Ciclo H | Canon resultante | `REGISTRO_DE_ENTIDADES.md` promovido como fuente única |
| Cierre | Auditoría del bucle | `CIERRE_BUCLE_TRAZABILIDAD.md` |

**Output final pre-código documentado** en `ESTRUCTURA_OUTPUT_PRE_CODIGO.md`. Plantillas de diseño: `PLANTILLA_PANTALLA.md` (F2–F7), `PLANTILLA_HARDENING.md` (F8), `PLANTILLA_QA.md` (F9).

---

## PRÓXIMA ACCIÓN (F8 — Hardening / Integraciones)

Retomar el **bucle por fase**. Estado actual:

| Fase | Dominio | Estado |
|---|---|---|
| F0–F7 | Cimientos, catálogo, comercial, contratos, compras, taller, calidad, entrega, garantía, finanzas, sitio público | Planes/Diseños aprobados ✅ |
| **F8** | Hardening / integraciones | **SIGUIENTE** — sin plan |
| F9 | QA + corte final | Sin plan |

**Próxima acción permitida:**
> Abrir el **bucle de diseño F8 (hardening)**: enums aditivos + backfill de datos existentes, deprecación `rolEmpleado`→`personas_roles`, integraciones diferidas (Viewer 3D). Usa `PLANTILLA_HARDENING.md`. El Orquestador presenta determinantes → Supervisor decide → Iniciador diseña.

---

## Artefactos canónicos del arnés (leer al arrancar)

1. `AGENTS.md` — zonas, prohibiciones, comandos
2. `estado.md` — este archivo
3. `INDEX.md` — índice de contexto activo
4. `MODELOS.md` — stack de modelos free
5. `REGISTRO_DE_ENTIDADES.md` — schema canónico (~60 entidades)
6. `ESTRUCTURA_OUTPUT_PRE_CODIGO.md` — gate de salida a código
7. `PLANTILLA_PANTALLA.md` — template de diseño de pantallas (F2–F7)
8. `PLANTILLA_HARDENING.md` — template de fases de hardening (F8)
9. `PLANTILLA_QA.md` — template de fases de QA y corte (F9)

---

## ⚠️ ESTRATEGIA GENERAL V3 (Supervisor, 2026-08-07) — "PLANES PRIMERO, CÓDIGO DESPUÉS"

**Regla maestra del proyecto (decidida por Javier, no negociable):**

> **Entre F0 y F9 NO se escribe código.** Cada fase corre el bucle de aprobación por fase, y solo al salir de la banda F0–F9 (una vez que todos los planes de código de F4→F6→…están aprobados) se comienza a codificar.

**El bucle por fase (repetir para cada fase, arrancando en F4):**

```
aprobación → diseño → plan de código aprobado → (SIGUIENTE FASE, repetir)
```

- **F4** → arranca el bucle (aprobación del alcance F4 → diseño F4 → plan de código F4 aprobado).
- **F5** → repetir el bucle.
- **F6** → repetir.
- …así sucesivamente a lo largo de la banda F0–F9.

**Qué significa "IN=" a la codificación:** un documento de diseño aprobado + un plan de código aprobado + el checkpoint del Supervisor sobre ese plan. No basta el diseño.

**Reporte de warns (esperado, no error):**
- ⚠️ **No hay código F0–F2.** Esto es el estado buscado: F0 (lógica de identidad/auditoría), F1 (grafo de catálogos) y F2 (comercial + cotizador) tienen DISEÑO y PLANES aprobados (t-074, t-075, diseños P-01..P-05) pero **cero código** en `lib/modules/`, `app/erp/`. Ese **es el plan que el Supervisor necesita**: nada de eso se codifica aún.
- ⚠️ Los planes t-080/t-081/t-082 (F3) quedan **registrados como planes**, no como código a construir en esta banda.
- ⚠️ Las tareas t-080..t-082 y su schema (cronogramas/desfases) NO se ejecutan como código hasta salir de la banda F0–F9.

**Consecuencia para el bucle actual (en el momento de escribir esto, 2026-08-07):** la próxima fase del loop era **F4**. Todo lo anterior (F0–F3) se consideraba completado en su nivel de DISEÑO/PLAN, pendiente de codificación futura. **Nota de vigencia (2026-08-08):** superado — F4–F7 se completaron después (ver secciones siguientes de este archivo); la próxima fase real hoy es **F8**.

---

## ✅ BUCLE F4 COMPLETADO + F5 PREPARADO (2026-08-07)

**Cierre del bucle F4 (compras + proveedores):**
- `arnes/lineas/ola7/plan_f4.md` — hallazgos compilados (§6) + decisiones:
  - **D-2026-08-07** — lead time en OC (`fecha_recepcion_esperada` + `tiempo_entrega_dias`; timeline abono→tiempo→entrega→saldo en P-13; tercerizados como proveedores + OC `subcontratacion`).
  - **D-2026-08-07-B** — ampliación de `proveedores` (teléfono comercial, dirección despacho, ciudad, medio pago, `dias_entrega_default`, transportadora, `tarifa_flete`) + `proveedores_contactos` (múltiples) + puente `catalogo_proveedor` (multi-proveedor, resuelve la DECISION_PENDIENTE N:1) + `cuentas_cobro_proveedor` diferida a F6.
- t-084 (P-13), t-085 (P-14), t-086 (P-15) en `creada` (plan F4).

**F5 preparado:** `plan_f5.md` (P-16..P-19) + t-098..t-101 creadas. Aplica **D-2026-08-07-C**.

**Decisión estructural D-2026-08-07-C — módulo jerárquico por espacio** (`arnes/lineas/ola7/pantallas/disenio_modulo_espacio.md`):
- El módulo no es fila de taller: es la **unidad de trazabilidad del proyecto entero** (cotizador → contrato → desarrollo → compras → taller → calidad → despacho → instalación → garantía).
- Árbol recursivo `modulos` (padre_id self, `padre_linaje` para rastreo E-54). **Resuelve el despacho parcial** (gates por nodo, no por proyecto) y el caso de tercero pendiente no bloqueante.
- Tabla auxiliar `modulos_artefactos` (imagen/plano de armado/3D) con `fuente` = heredado_catálogo / dedicado_proyecto (sin duplicar binario).
- **Acabados reconciliados** con el grafo M-02 (`disenio_modulo_espacio.md` §5 Ref.3, Opción A): un solo master `catalogo_acabados` (familia, `precio_diferencial`, `parametros_extra` solo variación no homogénea) + `acabados_muestras` (disponible_web, compatibilidad_insumo) + vínculos `modulos_acabados` (instancia) y `catalogo_producto_acabados` (clase, es_default). **Clase↔instancia**: el catálogo define lo posible; el nodo elige. No hay duplicación con `productos_tienda` (ficha técnica/margen/imagen comercial vs. assets de producción).
- ⚠️ Este cambio **retrocede a F2/F3** (definir módulos en cotizador; cronograma por nodo) y condiciona el schema de F5.

**Cómo sigue:** con el arnés consolidado, el Orquestador diseña el **pase de trazabilidad de decisiones punto-0** (listar schemas → lotes relacionales → subagentes de trazabilidad con salida estándar → cruce y reporte final).

---

## TRANSICIÓN A LA V3 "VETA DORADA REAL" (2026-08-04) — EL ARNÉS VIVE ACÁ

**Decisión del Supervisor (2026-08-04):** el prototipo v2 se descarta por completo. Su código nunca se pusheó a producción, era prototipo sin uso y heredaba patrones viejos. Lo único valioso era el conocimiento en `arnes/`, que se conserva íntegro en esta carpeta.

**Qué pasó (checkpoint aprobado por el Supervisor):**
1. Se commiteó todo el arnés v2 sin commitear (entrada Ola 7, afinaciones OLA_6, plan maestro, ledger t-035..t-073) en la rama `dev` vieja.
2. La rama `dev` vieja se renombró a `backup/dev-v2-arquitectura-20260804` (congelada en 8526676) — respaldo puro, no se le hace push de código nuevo.
3. Se creó **esta carpeta** (`empresa_muebles_clone_v3`) como worktree de una **rama `dev` huérfana** (sin historia de código v2), con `arnes/` + config. Commit fundacional: `e2c765b`.
4. `main` y `legacy-agnostic-backup` intactos. No hubo push a `origin` todavía.

**Próxima acción permitida:**
- **Ola 7 — Bucle por fase F0→F9.** El setup de stack está COMPLETO (ver sección abajo). Siguiente: **bucle de retroalimentación F0** — el Orquestador presenta determinantes/requerimientos/decisiones/uso de pantallas de F0 (cimientos: `roles`, `personas`, `personas_roles`, `parametros`, `parametros_historial`, `eventos`, `audit_logs`, `procedencia`), el Supervisor decide y valida, el detalle final se registra en el arnés y recién ahí entra el agente Código.
- **Tercer input humano** (`arnes/lineas/ola7/archivo/Tercer input/flujo_automatizacion/`) → **ola futura** (no bloquea Ola 7, ya decidido).

**Regla nueva de esta carpeta:** nunca reutilizar código del prototipo v2; si un patrón resultara necesario, se discute con el Supervisor antes de copiarlo.

---

## ✅ Ola 7 — Setup de stack de base de datos COMPLETO (2026-08-05)

**Autorización del Supervisor:** "instala todo el stack, ejecuta todos los puntos tanto bloqueantes como no bloqueantes en un paso, y luego comenzamos la metodología de bucle por fase".

**Qué se instaló/configuró (todo en V3, contra dev-local):**
1. **Deps Drizzle:** `drizzle-orm@0.36.4`, `drizzle-kit@0.28.1` (dev), `postgres@3.4.9` (postgres-js, NO `@neondatabase/serverless`), `tsx@4.23.1` (dev), `dotenv` (dev).
2. **`.env.local` V3 creado** con `DATABASE_URL` + `SESSION_SECRET` + `NEON_API_KEY` de la rama dev-local (copiado de clone-dev, **nunca versionado** — `git check-ignore` OK).
3. **`neonctl` instalado global** (CLI de ramas Neon).
4. **Pipeline Drizzle:** `drizzle.config.ts` (dialect postgresql, carga `.env.local` vía dotenv), `lib/db/client.ts` (Pool postgres-js + `db` drizzle + export `client`), scripts `db:generate` / `db:migrate` / `db:studio` / `db:seed` en `package.json`.
5. **`lib/db/schema.ts` — 26 tablas:** las 18 reales de dev-local extraídas con `drizzle-kit pull` (contrato de la DB existente, NO código v2) + las 8 tablas nuevas de F0 (`roles`, `personas`, `personas_roles`, `parametros` con CHECK de exclusión de valores, `parametros_historial`, `eventos` append-only con context FKs y self-FK, `procedencia`, `audit_logs`).
6. **Migración `0001` aplicada contra dev-local** — 100% aditiva (8 `CREATE TABLE IF NOT EXISTS` + `usuarios.persona_id` + 11 FKs). El historial de migraciones del v2 se respetó: `drizzle.__drizzle_migrations` quedó con 3 entradas (2 del v2 + 0000 del pull marcada como aplicada), y `migrate` solo aplicó el diff.
7. **Seed `db:seed` OK contra dev-local:** 7 roles base (`admin`, `comercial`, `desarrollador`, `compras`, `taller`, `finanzas`, `supervisora_qa`) con guardia anti-producción de doble capa (allowlist de host dev + `NODE_ENV` no producción). Corregido 2026-08-06 (decía 6, faltaba `compras`; el seed real `scripts/seed-dev.ts` ya tenía los 7).

**Verificación mecánica:** `tsc --noEmit` 0 · `eslint .` 0 · 26 tablas confirmadas en dev-local (verificación `information_schema`) · dev server `:3215` intacto (no se corrió `next build` para no pisar `.next`).

**Decisiones/observaciones abiertas para el bucle F0 (no son decisiones cerradas):**
- `eventos.tipo_evento` materializado como **`text`**, no enum DB de 61 valores (los enums de 61 valores requieren `ALTER TYPE ... ADD VALUE` por fase). Validar con el Supervisor en el bucle F0.
- Seed de roles **sin `compras`** (la contradicción DP-02 "compras SÍ es rol tipado" vs. esquema sin él sigue abierta para el bucle F0).
- `audit_logs.actor_id` **nullable** (permite actor `'sistema'`, coherente con el ejemplo de insert del doc de logs).
- F0 no siembra parámetros del negocio A-01 (los valores v1 viven en el legacy; la confirmación cambia números, no schema).

## ✅ Ola 7 — Bucle F0 (determinantes) VALIDADO por el Supervisor (2026-08-05)

**Metodología activada (aprobada por el Supervisor):** bucle de retroalimentación por fase — el Orquestador presenta determinantes/requerimientos/decisiones/uso de pantallas → el Supervisor decide y valida → detalle final registrado en el arnés → input del agente Código.

**4 decisiones cerradas del Supervisor (2026-08-05):**
1. **Catálogo de roles canónico = 7:** `admin`, `comercial`, `desarrollador`, `compras`, `taller`, `finanzas`, `supervisora_qa`. Resuelve DP-02 a favor de la decisión de negocio (compras SÍ es rol tipado). Seed actualizado (7 roles, idempotente).
2. **`eventos.tipo_evento` = `text` con validación en la app** (catálogo de 61 eventos como constante tipada en código), NO enum DB. Justificación: aditivo por definición, sin `ALTER TYPE` por fase.
3. **F0 = base de datos + lógica, SIN UI.** La administración de identidad/parámetros entra en una fase posterior con sus determinantes.
4. **Sembrar los 4 parámetros A-01 con valores v1** (ajustables por `UPDATE`, no tocan schema): `neto_diseno_3d_pct`=97.5 (retención 2.5% servicios CO, validar contador), `iva_diseno_3d_pct`=19, `recargo_hora_extra_pct`=25 (legal estándar CO, revisar 2026), `umbral_novedad_check15`=3 días (E-59).

**Consecuencia técnica:** seed actualizado y verificado contra dev-local (7 roles + 4 parámetros, `onConflictDoNothing` idempotente). `tsc` 0 · `eslint` 0.

**Próxima acción F0:** el Iniciador escribe `arnes/lineas/ola7/tecnico/plan_t-074.md` (plan de detalle de F0 con base en estas decisiones) para que el agente Código ejecute la lógica de identidad/auditoría (helpers de roles, parámetros con historial append-only, registro de eventos).

---

## ✅ Diamante 4 — PoC 3 (C1–C6) EJECUTADA Y VERIFICADA (2026-08-04)

**Plan:** `arnes/lineas/ola7/archivo/pasadas/d4_prueba_concepto.md` §7 (aprobado por el Supervisor). Resultados detallados en §8 del mismo archivo.

| C | Item | Resultado |
|---|---|---|
| C1 | Fuente Teachers (next/font → `--font-sans`) | ✅ |
| C2 | Badges solar punk: 3 variantes (glass+glow / material+bevel / mist niebla) + preview `/badge-mockups` | ✅ pendiente elección Supervisor |
| C3 | Runtime viva: View Transitions + hover-elevate + stepper pulse + `active:scale` | ✅ |
| C4 | AppShell (header sticky z-nav + nav global NavItem + footer) + deshardcodear hub | ✅ |
| C5 | Radix incremental: `@radix-ui/react-dialog` 1.1.23 replace Modal (FocusScope, Escape, aria-hidden) + `lucide-react` | ✅ |
| C6 | WebGL hero raw WebGL2 (GLSL ES 3.00, 200 partículas, parallax, IntersectionObserver) + fallback CSS + reduce-motion | ✅ chunk **2KB gz** |

**Verificación mecánica:** `tsc` 0 · `eslint` 0 · `next build` 6 rutas · **Playwright 16/16 PASS** (AppShell en 5 rutas, nav activo, Teachers, View Transitions, hover, modal Radix focus+Escape, 3 badges, canvas webgl2, reduce-motion CSS, consola limpia).

**2 bugs reales encontrados solo en runtime (no en tsc/eslint/build) y corregidos:** (1) shader WebGL con sintaxis GLSL ES 1.00 en contexto WebGL2 + `loseContext()` en cleanup que rompía el remount de StrictMode → migrado a GLSL ES 3.00 + guard `isContextLost()` + try/catch → fallback CSS; (2) modal `<p>` (DialogDescription) conteniendo `<div>` → `asChild` con `<div>`.

**Capturas de evidencia (6 PNG):** hub, landing, cotizador, cronograma, badge-mockups, modal-open — ruta local `C:\Users\javir\AppData\Local\Temp\opencode\poc3_shots\`.

**Pendientes antes de Ola 7:** (a) checkpoint Supervisor PoC 3 (decidir badge direction); (b) revisar `Tercer input/flujo_automatizacion/` (flujo de automatización, sin registrar).

---

## ✅ Diamante 4 — PoC 3.1 (reauditoría) EJECUTADA Y VERIFICADA (2026-08-04)

**Contexto:** el Supervisor aprobó la PoC 3 CON CONDICIONES. Crítica principal: el runtime "funcionaba" en los checks automáticos pero **no mostraba interacción real** (no había dónde clicar). Decisión: PoC 3.1 mínima pero reauditada ("cumplamos completamente ese requerimiento para poder comenzar Ola 7"). Plan y resultados en `d4_prueba_concepto.md` §9–§10 (t-099).

**Qué se hizo (6 items):**
1. **Kanban clickeable** — tarjeta completa abre modal (cursor + hover ring + focus-within), botón Detalle con stopPropagation.
2. **Landing viva** — CTAs son `<Link>` reales (→ /cotizador, → /badge-mockups); tarjetas de obras abren modal Radix.
3. **Checklist interactivo** — checkbox real con toggle de estado.
4. **Fix WebGL** — `setupAttrib()` guard `loc<0` + sin `delete*` en cleanup (StrictMode remount).
5. **Fix scroll** — `data-scroll-behavior="smooth"` en `<html>`.
6. **Badges dirección aprobada** — `material` default en ERP, `mist` en web; dot pulse sutil neutro / acelerado danger; hover en material.

**Verificación:** tsc 0 · eslint 0 · build 6 rutas · **Playwright 13/13 interacciones REALES PASS** (clic tarjeta kanban abre modal, clic CTA navega, clic obra abre modal, checkbox toggle, badge directions) · **consola 0 errores** (sin WebGL, sin scroll warning). Capturas en `C:\Users\javir\AppData\Local\Temp\opencode\poc31_shots\`.

**Nota operativa:** el `next build` pisa `.next` y rompe el dev server; se reinició limpio en `:3215` (PID guardado).

---

## ✅ M-06 · Capa Técnica Transversal L1 — COMPLETADO (2026-08-05)

**Diamante:** M-06 (Reconstrucción del Cotizador y Módulos ERP)
**Capa ejecutada:** L1 — Infraestructura técnica transversal de patrones de interfaz
**Artefacto:** `arnes/lineas/ola7/tecnico/m06_capa_tecnica_transversal.md`

**Qué contiene:**
- 23 patrones de infraestructura identificados del legacy (autosave, smart search, debounce, parallel loading, vault CRUD, COP formatter, MoneyInput, Zustand, polling, Suspense, etc.)
- 14 patrones aprobados para el nuevo schema con ubicación propuesta (`lib/utils.ts`, `lib/hooks/`, `components/veta/`, `app/globals.css`)
- Contrato de no-rotura (7 áreas que no pueden cambiar sin afectar todas las F0-F9)
- Definición de la capa L1 como cruce técnico transversal que se aplica al final de F9

**Nota:** L2 (las 4 contradicciones legacy de negocio/pantallas) fue retirado de M-06 y se maneja en un diamante exclusivo separado (ver sección siguiente). M-06 L1 no afecta el flujo de F2-F9 — se aplica como prerequisito de cruce al final de F9.

---

## ✅ Destilación Cotizador + Contrato Legacy — COMPLETADA (2026-08-05)

**Artefacto:** `arnes/lineas/ola7/archivo/destilacion_cotizador_contrato.md` (399 líneas, archivada — absorbida por `pantallas/disenio_p01..p04*.md`)

**Qué contiene:**
- **Inventario completo** de 9 namespaces legacy mapeados a 26 tablas del nuevo schema
- **8 flujos de negocio** documentados: carga paralela, selección cliente/proyecto, configuración espacios/variantes/items, cálculo precios (materiales + 3 tarifas MO + costos operativos + IVA), auto-save race-safe, búsqueda fuzzy con historial localStorage, generación contrato via zap, propuesta pública con snapshot
- **Lógica de cálculo core:** precios por ítem (precio_publico default editable), mano de obra via 3 SKUs catálogo (SERV-DEV/ASSEMBLY/INSTALL), costos operativos/imprevistos/descuento/ajuste, IVA condicional
- **Patrones UI:** Kanban 8 estados (activa→entregado/perdida), EspacioCard con 11 collapse strips, ItemRow con Popover fuzzy search + MoneyInput, ContratoModal 5 secciones + PaymentScheduleCalculator 100% controlado
- **Contrato Legacy (P-05):** Estructura completa, hitos en tabla separada, especificaciones compiladas dinámicamente por tipo de catálogo
- **Mapeo detallado** legacy→nuevo schema con campos que cambian/eliminan/nuevos por tabla

---

## ✅ DIAMANTE EXCLUSIVO — Contradicciones Legacy vs. Diseño Actual — CERRADO (2026-08-05)

**Decisiones aprobadas por el Supervisor (corregidas tras auditoría axiomática):**

| # | Contradicción | Decisión Final (Axiomática) | Impacto en Schema / Pantallas |
|---|---|---|---|
| **C1** | Tarifas mano de obra | **5 parámetros físicos en `parametros`** (variables independientes): `arriendo_mensual_taller`, `horas_mes_taller`, `pct_mantenimiento_maquinas`, `factor_logistica_install`, `costo_hora_operario_base` (ya existe en F0). **3 tarifas calculadas en runtime** (función pura server-side): `tarifa_dev = costo_hora_taller`, `tarifa_assembly = costo_hora_taller + costo_hora_operario_base`, `tarifa_install = costo_hora_taller * factor_logistica_install`. Eliminar SKUs `SERV-*` de `productos_catalogo`. Respeta FLAG-4: costear al detalle → derivar costos precisos. | **Schema:** +4 filas en `parametros` (la 5ª ya existe). **Pantalla:** Cotizador lee base `costo_hora_taller` y coeficientes físicos, calcula 3 tarifas en server. Quita búsqueda de 3 SKUs mágicos. |
| **C2** | Ítems referenciales (ex Obra Civil) | **Sin tablas nuevas**. 3 campos en `items_variante` existente: `es_referencial` (boolean, default false), `fuente_referencial` (text: 'electrodomestico'\|'obra_civil'\|'servicio_tercero'\|'otro'), `grupo_referencial` (text libre: "Electrodomésticos", "Ventanas", etc.). **No va a contrato**. UI: toggle "Es referencial" en ItemRow, badge "Referencial", agrupación visual por `grupo_referencial`, botón "Anexar a catálogo" → crea producto catálogo completo. Axiomático: 1 tabla, 3 campos, reutiliza UI existente. | **Schema:** 3 campos nullable en `items_variante` (migración aditiva). **Pantalla:** ItemRow extendido con toggle + selector fuente + input grupo. Agrupación visual en EspacioCard. Cero nuevas entidades. |
| **C3** | Transiciones proyecto.estado | **Mover a `parametros` JSON** (clave `transiciones_proyecto`: `{ desde: [hacia, ...] }`). Configurable sin deploy. | **Schema:** +1 fila en `parametros`. **Pantalla:** Kanban comercial usa matriz desde `parametros` (no hardcoded). Botón "Gestionar transiciones" en admin (fase posterior). |
| **C4** | Semántica precios catálogo | **Mantener ambos en `productos_catalogo`**: `precio_directo` = costo base / lista sin margen; `precio_publico` = PVP sugerido (default en cotizador, editable). **`productos_tienda.valor_tienda`** = precio web fijo (independiente). Cotizador usa `precio_publico` como default; tienda usa `valor_tienda`. | **Schema:** Sin cambios (campos ya existen). **Pantalla:** ItemRow muestra `precio_publico` como default, editable. Margen visible = (precio_editado - precio_directo) / precio_editado. Tienda no toca catálogo. |

**Consecuencias técnicas (requieren reprocesar Ola 6):**
1. **Schema Drizzle (`lib/db/schema.ts`):** Añadir 3 campos en `items_variante` (`es_referencial`, `fuente_referencial`, `grupo_referencial`). Añadir 4 filas en `parametros` (`arriendo_mensual_taller`, `horas_mes_taller`, `pct_mantenimiento_maquinas`, `factor_logistica_install`, `transiciones_proyecto` — `costo_hora_operario_base` ya existe).
2. **Migración DB:** Nueva migración aditiva contra `dev-local` (3 campos + 4 params).
3. **Seed:** Valores por defecto para 4 params físicos + matriz de transiciones (8→8 legacy + nuevos estados F3).
4. **Cotizador (P-04):** Pantalla modificada — leer base tarifas de `parametros`, cálculo runtime, nueva UI referencial en ItemRow, semántica precios clarificada.

---

## ✅ DISEÑO P-04 COTIZADOR — APROBADO (2026-08-05)

**Artefacto:** `arnes/lineas/ola7/pantallas/disenio_p04_cotizador.md`

**Componentes aprobados:**
- Header Proyecto (nombre, cliente, estado, tipo, dirección, costos, IVA, garantía) — **C3: estado usa matriz `parametros.transiciones_proyecto`**
- Panel Configuración Taller (5 params físicos editables → 3 tarifas calculadas read-only) — **C1**
- Panel Transiciones (read-only matriz desde `parametros`) — **C3**
- EspacioCard (11 CollapseStrips: Header, Desc, Variantes, DescAlt, **Items**, Imágenes, Notas, Colores, **MO**, Subtotal, **Presupuesto Adic.**)
- ItemRow (SmartSearch catálogo, MoneyInput default `precio_publico`, **☑ Referencial**, **Fuente ▼**, **Grupo**) — **C4: default PVP, margen visible vs `precio_directo`** / **C2: toggle referencial + fuente + grupo**
- Mano de Obra por Variante (3 DayCounters + tarifas read-only + link config taller) — **C1**
- Presupuesto Adicional (agrupación visual por `grupo_referencial`, badge "Referencial", no suma a total) — **C2**
- Resumen Grand Totals (Materiales + MO + Costos + Imprev - Desc + Ajuste + IVA condicional) — **C1, C2**
- ContratoModal (5 secciones + PaymentScheduleCalculator controlado) — **C4: valor_total editable**
- Acciones (Guardar auto-save, Generar Contrato, PDF, Activar Producción)

**Sub-Diamante Pendiente:** Propuesta de Diseño Virtual (`/propuesta/{slug}` + `Viewer3DModal`) — **NO en F2**. Fase F7 o fase dedicada. Requiere destilar `PublicProposal.tsx` (454 líneas) + `Viewer3DModal.tsx` (221 líneas) + `public-proposal.ts`. Bloqueante: 3D real (SketchUp/OpenCutList → CVC → visor web).

---

## ✅ DISEÑO P-01 KANBAN COMERCIAL — APROBADO (2026-08-05)

**Artefacto:** `arnes/lineas/ola7/pantallas/disenio_p01_kanban_comercial.md`

**Componentes aprobados:**
- Header: Título, SmartSearch (fuzzy + historial + uso frecuente), [Nuevo +], Filtros colapsables
- 8 Columnas: Estados legacy (activa→entregado/perdida/cancelada) + colores + contadores
- Transiciones: Drag-drop + menú "Cambiar estado →" validados contra `parametros.transiciones_proyecto` — **C3**
- ComercialCard: Nombre, cliente, espacios, items, **total estimado server-side** (mat+MO+costos), fechas, días en estado — **C1, C2, C4**
- Columnas solo-lectura: `produccion`, `entregado`, `perdida`, `cancelada` (sin drag, sin +Añadir)
- Filtros: Comercial, Tipo proyecto, Fecha, Solo mis leads (persistidos localStorage)
- Nuevo Proyecto Modal (P-02 preview): Nombre, HybridClientSelector, Tipo, Estado (fijo si viene de columna), Dirección
- Acciones tarjeta: Abrir → P-04, Duplicar, Cambiar estado (solo válidos), Historial, Eliminar
- Accesibilidad: Drag-drop teclado (menú alternativo), ARIA, focus, reduced-motion — M-06 L1 tokens

---

## 📋 CHECKLIST F2 — COMERCIAL + COTIZADOR

**Fuente:** `plan_ola7_maestro.md` §1 — B3-1: P-01..P-05 + F-01/F-02/F-03/F-08

| Código | Pantalla | Descripción | Estado |
|---|---|---|---|
| **P-01** | **Kanban Comercial** | Embudo leads→cotizaciones→contratos (8 estados legacy + nuevos F3). SmartSearch, transiciones desde `parametros`. | ✅ **APROBADA** |
| **P-02** | **Nueva Cotización / Proyecto** | Crear proyecto draft (`activa`), HybridClientSelector, tipo proyecto, datos iniciales. | 🔄 **SIGUIENTE: DISEÑAR** |
| **P-03** | **Detalle Cotización (Solo Lectura)** | Vista read-only para taller/finanzas. Header + espacios + items + totales. | 🔄 Pendiente |
| **P-04** | **Cotizador (Editor Completo)** | **✅ APROBADA** — `disenio_p04_cotizador.md` | ✅ |
| **P-05** | **Contrato (Modal Integrado)** | **✅ INCLUIDA EN P-04** — 5 secciones + PaymentScheduleCalculator | ✅ |
| **F-01** | **Landing / Home Público** | Sin código real en V3. PoC 3 (`/landing`, `/`, `/cotizador`, `/cronograma`) es solo demo de tokens/estética D4 — no pantalla de negocio. `/proceso`, `/espacios` y las 6 landings SEO existieron en el prototipo v2 (descartado, `backup/dev-v2-arquitectura-20260804`), no en V3. Ver `plan_estructura_sitio_publico.md` para el inventario numerado (F-00, F-01, F-09..F-13). | 🔲 POR CONSTRUIR |
| **F-02** | **Tienda Web** | `/colecciones`, `/categoria/[slug]` — grid productos, filtros, solo `visible_en_tienda=true`. | 🔄 Parcial |
| **F-03** | **Portafolio de Proyectos** | `/portafolio`, `/proyecto/[id]` — casos reales, imágenes, sin precios. | 🔄 Parcial |
| **F-08** | **Propuesta Pública (Cliente)** | `/propuesta/{slug}` — **Sub-diamante F7/fase dedicada**. Legacy: `PublicProposal` + `Viewer3DModal`. | 🔻 NO EN F2 |

---

## 📌 Tercer input humano → OLAS FUTURAS (decidido 2026-08-04)

**Decisión del Supervisor:** el tercer input (`arnes/lineas/ola7/archivo/Tercer input/flujo_automatizacion/`) **NO bloquea la Ola 7**. Se difiere a una **ola futura distinta** (registrada como pendiente, no como tarea de Ola 7).

**Contenido del input (para la ola futura):**
- **Exportaciones de conversaciones de WhatsApp con clientes reales que han comprado** → material para **entrenar modelos** (asistente/chat, ver `marco_estrategia_mercado.md`). Esto es un activo de datos sensible: clientes reales + historial de compra → requiere política de privacidad/anonimización antes de usarlo en entrenamiento.
- Flujo de automatización completo (8 archivos XLSX + dashboard PNG + imágenes de productos): compras, inventario (retales/productos), proveedores, matriz de costos, sincronizador, formato de compra, marco lógico.

**Cuándo:** después de Ola 7 (corte), en la ola dedicada a automatización/ML. No tiene dependencia de schema — usa datos reales existentes.

**Ola 7 en curso:** nunca usa el corpus de WhatsApp ni el tercer input como fuente de decisiones de pantalla.

---

## ✅ Diamante 4 — Prueba de concepto (t-098) COMPLETADA (2026-08-04)

**Auditoría B1 (2026-08-04):** APROBADO 6/6 goals con 5 condiciones de consolidación, todas cerradas en `arnes/lineas/ola7/archivo/pasadas/d4_consolidado_diseño.md` (numeración CC-DD-01..25, tokens motion formales `--dur-*`/`--ease-*`, tokens componente promovidos, botón `sm` corregido vs R35, conteo ~143 tokens).

**PoC ejecutada (t-098) — 3 pantallas piloto con stack Next 15 + React 19 + Tailwind v4:**
- `app/globals.css` — `@theme` canónico (~143 tokens; color 54 / spacing 10 / radius 4 / sombra 7 / z 9 / motion 12). **Cero literales de color inline.**
- `app/layout.tsx` — `next/font/google` Fraunces (display) / Inter (cuerpo) / IBM Plex Mono (mono), subset `latin`/`latin-ext`.
- `components/veta/{button,badge,stat-card,stepper}.tsx` — primitivas UI de la PoC.
- `/landing` (F-01 landing público), `/cotizador` (P-04, ERP/comercial: kanban #32, stepper #33, tabla de caja #14) y `/cronograma` (P-09, ERP/operativo: timeline doble #34, checklist E-21 #35, tabla #14).

**Verificación (evidencia mecánica):**
| Herramienta | Comando | Resultado |
|---|---|---|
| Tipos | `npx tsc --noEmit` | 0 errores |
| Estilo | `npx eslint .` | 0 errores (FlatCompat por eslint-config-next@15) |
| Build | `npx next build` | ✓ 8 rutas estáticas, sin DB |
| Runtime | `next start` + `curl` | `/`, `/landing`, `/cotizador`, `/cronograma` → **200** |
| Tokens | `getComputedStyle` | `btn bg=#8B6914`, `btn color=#FFFFFF`, `hero color=#3E2A21`, fonts Fraunces/Inter ✓ |

**Conclusión t-098:** el D4 es implementable. Detalle técnico en `arnes/lineas/ola7/archivo/pasadas/d4_prueba_concepto.md`.

**Pendientes que la PoC no puede resolver (escalan al Supervisor con checkpoint Ola 6):** CC-DD-07 (éxito, A/B iconos), CC-DD-15 (librería de iconos → `lucide-react` recomendado), CC-DD-16 (toasts → `sonner`). **A-01 contador** (`umbral_novedad_check15`, `recargo_hora_extra_pct`, `neto/iva_diseno_3d`, marca) — no bloquea.

**Próxima acción:** con A-01 resuelta → **Ola 7 (Execute)** codifica las 34 pantallas + migración de schema en 4 fases con los tokens del D4 como fuente única de estilo. Mientras tanto, el trabajo de las tareas `esperando_humano` de Fase 2 (t-008/t-009/t-013/t-015/t-017, fase 2) sigue con checkpoint pendiente del Supervisor.

---

## Oleada de paridad con el legacy (2026-08-02) — 9 tareas, 21 archivos nuevos

Contexto: una auditoría comparativa (inventario de rutas legacy vs. nuevas) encontró 13 pantallas del sistema viejo sin equivalente todavía. El Supervisor delegó la planeación completa y autorizó ejecución en paralelo con subagentes mientras estaba fuera.

**Cerradas sin checkpoint (7, riesgo bajo, todas delegadas a opencode/deepseek-v4-flash-free, todas exactas al prompt en el primer intento):**
- t-024 `/app/erp/pedidos` — vista ERP de pedidos_web (contraparte del checkout de t-015).
- t-025 `/app/erp/perfil` — empleado edita su nombre y cambia su password (verificado en runtime: password actual incorrecta se rechaza).
- t-026 `/app/erp/portfolio` — gestión de casos de portafolio (crear, publicar/despublicar).
- t-027 `/app/ficha/:id` — ficha de producción imprimible para taller (sin precios a propósito).
- t-028 `/espacios` — landing de índice de categorías.
- t-029 `/proceso` — landing de proceso en 4 pasos, con copy real del legacy.
- t-030 — 6 landings SEO por categoría (cavas-y-bares, centros-de-entretenimiento, closets-vestidores-bogota, cocinas-integrales-bogota, consolas-recibidores, estudios-home-office), migradas como 1 componente compartido (`LandingEspacio.tsx`) + 6 configs de contenido real extraído del legacy — no 6 implementaciones sueltas ni contenido inventado. Nota: sin el Tailwind/VetaHeader del legacy (no existen en este repo) — estilo simple consistente con el resto de `app/(publico)/`, deliberado, no un descuido.

**t-023 `/app/prefabricados` (riesgo alto, schema aprobado explícitamente antes de escribir código):** un prefabricado dejó de ser un concepto separado — es un `proyecto` de un solo espacio (`tipo_proyecto='producto_fijo'`) cuyo resultado calculado se publica en `productos_catalogo` (`proyecto_origen_id`, columna única). Cero tablas nuevas. Circularidad publicar→editar→republicar verificada dos veces: test automatizado contra dev-local real (4/4 OK) y manualmente vía HTTP.

**t-031 `/propuesta/:proyectoId` (riesgo alto, construida directamente, no delegada):** reemplaza el snapshot público del legacy — el mismo tipo de dato (`unit_price`/`total` de la propuesta) que causó un incidente documentado por desincronización. La versión nueva no tiene snapshot: consulta el proyecto en vivo con el mismo motor de cálculo del ERP, así que no puede mostrar un total viejo por diseño. Verificado en runtime: total calculado ($1.800.000) coincide a mano con materiales+mano de obra+costos operativos, y el control de acceso por estado (`activa` = no visible) se probó creando un proyecto real y confirmando 404.

**t-032 (decisión, sin código):** `/share/:token` del legacy — un motor genérico para compartir cualquier registro con cualquier campo — se deja explícitamente FUERA de esta migración. Es exactamente el tipo de "herramienta para construir herramientas" que esta migración decidió dejar de construir. El único caso de uso real conocido (compartir una cotización) ya lo cubre t-031, construido directamente para eso. Si aparece un segundo caso real repetido, se reevalúa entonces — no antes.

**Balance de la oleada:** `tsc`/`eslint`/`next build` limpios en un solo pase para las 21 rutas/archivos nuevos (53 páginas generadas en el build, antes 38). 9 commits nuevos en `dev`. El inventario de 13 pantallas faltantes queda en 0 pendientes reales — 12 migradas, 1 (`/share/:token`) descartada a propósito con su razón documentada.

## ✅ HALLAZGO CRÍTICO — RESUELTO el 2026-08-01

**Actualización:** el Supervisor generó una API key de Neon (cuenta, alcance todo el proyecto) y la entregó en el chat. Con ella:
1. Se creó la rama `dev-local` en Neon vía `neonctl` (branch id `br-steep-hat-acbu7xiu`, desde `main`).
2. Se guardó su `DATABASE_URL` (pooled, rol `neondb_owner`) en `.env.local` del worktree `dev` — **nunca versionado**, cubierto por `.gitignore` (`.env*.local`), verificado con `git check-ignore`.
3. Se corrió `npm run db:migrate`: las 18 tablas se crearon sin errores (solo NOTICEs de Postgres truncando nombres de constraint >63 caracteres, no bloqueante).
4. Se corrió `npm run db:seed`: usuarios de prueba reales (`admin@dev.local`, `comercial@dev.local`, `cliente@dev.local`, password `dev12345`), 1 producto, 1 proyecto con contrato e hitos 50/25/25.
5. Se corrió `npm run dev` de verdad por primera vez en toda la sesión, y se probaron flujos reales con `curl` contra la base de datos real.

**Bug real encontrado y corregido en el camino:** faltaba `SESSION_SECRET` (requerido por `lib/auth/session.ts`, sin fallback a propósito) — nunca se había detectado porque nunca se había corrido el servidor. Se generó un secreto aleatorio de 32 bytes con `node -e "crypto.randomBytes(32)"` y se guardó en `.env.local` (dev-local, no reutilizable en producción).

**Resultados de las pruebas end-to-end (todas contra `dev-local`, datos reales, nunca contra producción):**
- Login admin/comercial/cliente: **OK** (200, cookie de sesión válida).
- `GET /api/erp/catalogo` con sesión admin: **OK**, devuelve el producto sembrado.
- Cliente intentando `GET /api/erp/catalogo` (ruta de ERP): **403 correcto**, aislamiento de superficie confirmado.
- Cotizador (`GET /api/erp/proyectos?id=...`): **OK**, devuelve proyecto + espacios + items reales.
- **Contrato con hitos NO estándar (40/35/25) — el bug original exacto que arrancó toda esta migración**: `POST /api/erp/contratos` con esa combinación, releído directo de la tabla `hitos_pago` después: **se guardó 40/35/25 exacto, sin revertir a 50/25/25.** Bug original confirmado corregido de punta a punta, no solo a nivel de código.
- Portal de cliente: proyecto propio → **200**; proyecto inexistente → **404** (no 403, como exige el diseño de t-013).
- **Checkout (t-015, el módulo de mayor riesgo por dinero)**: se intentó el ataque exacto que la lógica está diseñada para prevenir — el cliente mandó `precioUnitario: 1` en el body. El servidor lo ignoró y usó el precio real (`65000`) leído fresco de `productos_catalogo`. Pedido creado con `subtotal: 130000` (2 × 65000), no `2`. **Confirmado: un cliente no puede fijar su propio precio.**

**Lo que sigue sin probar end-to-end:** finanzas (t-017) — el seed no crea `cuentas_financieras` ni `obligaciones_pendientes`, así que `registrarMovimiento()` no se pudo ejercitar contra datos reales todavía (la página `/app/erp/finanzas` sí carga, 200). Sigue con QA de código completa (lectura manual + tsc + eslint) pero no runtime real. R2 (t-003) sigue sin tocar, aparte.

**Importante — esto NO es aprobación de producción:** haber corrido las pruebas de arriba con éxito es evidencia fuerte, pero el `checkpoint.veredicto_humano` de t-008/t-009/t-013/t-015 sigue en `"pendiente"` en el ledger — esa aprobación es exclusiva del Supervisor (`AGENTS.md`: "Tareas de riesgo alto... pasan por checkpoint humano explícito"). Lo que cambió es que ahora hay evidencia real que mostrarle, no solo lógica aislada.

## Cierre de la iteración del diamante del mapeo (2026-08-03) — Fase 2 abierta

**Contexto:** mapeo sistémico del negocio (Double Diamond) — Discover en 2 rondas de entrevista con Javier, Define convergido en `cierre_diamante.md`, loop metodológico ejecutado e integrado en `logica_de_negocio.md` (Parte I) con trazabilidad 1:1.

**Qué se integró en el mapa (`logica_de_negocio.md`, Parte I):**
- Corrección: diseño 3D $100k → **$130k + facturación DIAN** (4 lugares: diagrama, árbol de problemas, línea de tiempo, narrativa).
- Adiciones: modelo **socios-por-comisión** con tabla de compensación; contexto central **Control de cronograma** (inmutable, holgura máx 5 días, causa del desfase auditable, SLA 5-24h); **Capa 1 = control entre subsistemas** con los 4 gates (check de schema, triple verificación de recepción, citación de calidad push, cronograma con causa) + hallazgo B resuelto (Producción se disuelve en Desarrollo/Cronograma/Taller/Calidad); **Capacidad instalada** (4:1 demanda/fábrica); narrativas de política financiera, integraciones de producción (SketchUp/OpenCutList→CVC→Corte Cloud, Veta Designer), documentación (Drive VETA_ERP), micro cuentas de cobro.
- Diagrama Mermaid actualizado (gates de capa 1) en el mismo pase.
- Marcado Living Documentation: 7 secciones CONTRATO VIVO, 1 REGISTRO HISTÓRICO.

**Verificación:** tabla de trazabilidad 23 hallazgos → cambios en `loop2_y_retroalimentacion.md` PARTE C. Aprobado por el Supervisor.

**Diferido (registrado, no editado):** neto post-impuestos del diseñador (% y $130k→neto, pendiente de contador); % del carpintero "por tamaño" (sin número); diagnóstico de `G:\Mi unidad\VETA_ERP`; modelo de micro cuentas de cobro en detalle; capa 2 (taller/ISO); sesión estratégica §2.D.

**Fase 2 (diamante de solución) — recién abierta.** Candidatos a diseño de schema/UI/automatizaciones de capa 1: **Control de cronograma, Desarrollo capa 1, Calidad, Finanzas/Compensación**. Primera acción: diagnosticar `G:\Mi unidad\VETA_ERP` (flag mecánico, datos reales, sin preguntas al negocio). Criterio de reapertura vigente: si aparece una regla que cambia bounded contexts o gates → loop focalizado, no ronda completa.

## Resumen

Rama `dev` huérfana (worktree `../empresa_muebles_clone-dev`), sobre el MISMO repo/Neon/R2/Vercel de producción. Fase 0 y el plan de arquitectura aprobados. **Implementación en curso**, autorizada explícitamente por el Supervisor mientras está fuera 4 horas, con dos límites no negociables: nunca merge/push a `main`, nunca migrar datos reales de producción sin aprobación explícita.

## Última sesión (en curso)

**Fecha:** 2026-07-31

**Qué se hizo (28 commits en `dev`, todo verificado independientemente antes de commitear):**
- Fundación: Next.js + Drizzle (18 tablas relacionales) + auth completo (login/registro/sesión, `usuarios` separado de `clientes`) + middleware de seguridad (3 superficies, 403 explícito, bypass M2M acotado a `/api/admin`).
- **Módulos cerrados (`ui`/`andamiaje`, riesgo bajo):** catálogo (t-006+t-011: listado+detalle+CRUD+API REST), sitio público (t-007: home/colecciones/portafolio+SEO/JSON-LD, confirmado por grep que portafolio nunca menciona precio), shells de comercial/taller/finanzas/equipo/calendario (t-010), captura de leads `/agendar` (t-012), proveedores (t-014), detalle de orden de taller con tareas (t-016), crear empleado con password temporal server-side (t-018, solo `admin`).
- **Módulos de lógica de negocio o seguridad, código completo pero en `esperando_humano` (checkpoint requerido, riesgo alto):**
  - t-008 cotizador: cálculo puro con 5 tests, componentes controlados.
  - t-009 contratos: `PaymentScheduleEditor.tsx` con CERO `useState` real (verificado por grep + lectura manual completa), `hitos_pago` como tabla relacional, texto dinámico sin "undefined", 7 tests.
  - t-013 portal de cliente: cadena de aislamiento por `clienteId` verificada de punta a punta (la función que trae el proyecto filtra por cliente Y se llama antes que la que trae el contrato), `notFound()` en vez de 403, 2 tests.
  - **t-015 checkout (pedidos_web): la tarea de mayor riesgo real de la sesión (dinero).** `ItemPedidoInput` no tiene campo `precioUnitario` (estructuralmente imposible leer un precio del cliente), el precio se re-consulta FRESCO de `productos_catalogo.precio_publico` en cada POST filtrado por `publicado_web=true`, `clienteId` siempre de la sesión. 5 tests unitarios, verificado con lectura manual completa de los 3 archivos críticos.
  - **t-017 finanzas (registrar pago/cobro): integridad transaccional real.** Las 6 operaciones (leer obligación, leer cuenta, insertar movimiento, actualizar saldo, `SUM`, actualizar obligación) corren dentro de un único `db.transaction()` — verificado leyendo el archivo completo, confirmando que TODAS usan `tx`, ninguna `db` suelto. El estado se recalcula con un `SUM` real dentro de la misma transacción (ve la fila recién insertada), nunca un contador incrementado a ciegas. 6 tests unitarios.
- Script de seed para desarrollo local con guardia anti-producción (`scripts/seed-dev.ts` — pero nunca corrido de verdad, ver hallazgo crítico arriba).
- **Tooling de verificación completado:** `eslint.config.mjs` agregado. `npx next build` (con `DATABASE_URL` placeholder) encontró y permitió corregir **3 bugs reales** que `tsc` nunca hubiera visto (relación de Drizzle incompleta, `useSearchParams()` sin `<Suspense>` en `/agendar` y `/login`). Se repitió después de cada oleada nueva (incluida esta) — el build sigue avanzando limpio hasta `/portafolio` con el mismo `ECONNREFUSED` esperado, sin bugs nuevos en las últimas 2 oleadas.

**Anomalía de proceso documentada dos veces (t-011):** el proceso de `opencode` invocado para tareas de catálogo siguió escribiendo archivos SIN pedírselo, en dos rondas separadas, después de que la tarea original ya estaba cerrada. El código resultante pasó QA real y se aceptó, pero el orquestador no tiene visibilidad/control total del ciclo de vida de esos procesos una vez lanzados.

**Qué quedó pendiente:**
- **Prioridad real para cuando el Supervisor vuelva: resolver el hallazgo crítico de arriba antes de agregar más módulos sin probar.**
- t-003 (auditoría R2) sigue `[SOLO_HUMANO]`.
- Los 12 puntos grises del inventario original sin decisión del Supervisor.
- Merge `dev` → `main`: bloqueado hasta aprobación explícita.
- Migración de datos reales: NO ejecutada.
- Módulos aún no tocados: compras/abastecimiento, finanzas a fondo, taller a fondo, checkout/pedidos_web de la tienda.

## Oleada de auditoría (2026-07-31, posterior al resumen anterior)

Elegí auditoría/hardening sobre agregar módulos nuevos (instrucción del Supervisor: "usá tu criterio"), dado que ya hay 5 tareas de riesgo alto esperando checkpoint y el hallazgo crítico de runtime sigue sin resolver — más superficie sin probar no ayuda antes de eso.

**Barrido de autorización (script sobre `app/api/erp`, `app/api/pedidos`, `app/api/leads`, `app/app/erp/*/page.tsx`, `app/cuenta/*/page.tsx`):**
- `app/api/leads/route.ts` sin `requireEmpleado`/`requireCliente`: **correcto por diseño** (captura pública de leads, t-012).
- `app/app/erp/page.tsx` sin `requireEmpleado`: **correcto por diseño** (dashboard genérico, cualquier empleado autenticado por el layout).
- `app/app/erp/cotizador/[proyectoId]/page.tsx` sin `requireEmpleado`: investigado a fondo, **falsa alarma verificada, no gap real**. Es `'use client'` (no puede llamar una función server-only), y el layout padre (`app/app/erp/layout.tsx`) solo exige "ser empleado" (`requireEmpleado()` sin roles) — la restricción real (`['admin','comercial']`, declarada en `lib/erp-nav.ts`) vive en las 5 llamadas a `requireEmpleado(['admin','comercial'])` dentro de `app/api/erp/proyectos/route.ts` y `app/api/erp/proyectos/[id]/espacios/route.ts` (confirmado leyendo ambos archivos). Verifiqué además que la página maneja el 403 correctamente: `if (error && !proyecto) return <p role="alert">{error}</p>` y `if (!proyecto) return null` antes de renderizar el formulario — un empleado sin el rol correcto ve un mensaje de error, nunca datos ni el botón de guardar. Conclusión: dato protegido en la capa que importa (API), sin fix necesario.
- Páginas de `app/cuenta`: todas con `requireCliente`, sin hallazgos.

**Documentación cerrada:** `AGENTS.md`/`CLAUDE.md`, fila "Pruebas" de la tabla de verificación, ahora documenta que `lib/modules/*/queries.test.ts` (y cualquier test que importe `lib/db/client.ts`) exige `DATABASE_URL` seteada (aunque sea un placeholder que nunca conecta) para no fallar al importar — hallazgo real de esta sesión (`lib/modules/cuenta/queries.test.ts`), antes no documentado.

**Balance de la oleada:** sin bugs nuevos encontrados, dos hipótesis de riesgo cerradas con evidencia (no solo descartadas de palabra), un gap de documentación real cerrado. Refuerza la lectura de que la lógica de negocio construida hasta ahora es sólida a nivel estático; el techo de confianza sigue siendo el mismo hallazgo crítico de runtime, no la falta de revisión de código.

**t-019 (cerrada, `ui`/riesgo bajo):** la auditoría encontró un gap real (no una falsa alarma): `app/api/erp/tareas-produccion/route.ts` ya existía con auth y validación correctas, pero la página de detalle de orden de taller (t-016) era de solo lectura — nadie podía usar esa API desde el ERP. Delegado a `opencode/deepseek-v4-flash-free` con prompt prescriptivo (código casi completo, mismo patrón que t-018). Resultado: exacto a lo pedido en el primer intento, `tsc`/`eslint`/`next build` limpios, componente controlado con `useEffect` de resincronización y rollback optimista en caso de error del POST. Verificado con lectura manual completa de ambos archivos, no solo el reporte del ejecutor.

**t-020 (cerrada, `ui`/riesgo bajo):** mismo patrón de hallazgo que t-019, esta vez en proveedores: `crearProveedor` + `POST /api/erp/proveedores` ya existían con auth/validación correctas, `app/app/erp/proveedores/page.tsx` era de solo lectura. Delegado a `opencode/deepseek-v4-flash-free` con el mismo enfoque prescriptivo. Resultado: exacto en el primer intento, `tsc`/`eslint`/`next build` limpios, usa `router.refresh()` para reflejar el alta sin recargar toda la página. Verificado con lectura manual completa.

**Patrón detectado en esta oleada:** varias APIs de escritura (`crearX`) se construyeron completas (auth + zod) pero sus páginas correspondientes quedaron de solo lectura — probablemente porque los módulos se cerraron en oleadas separadas (t-014 proveedores fue solo el listado, t-016 taller fue solo el detalle). Vale la pena, en la próxima oleada, revisar sistemáticamente el resto de `app/api/erp/*/route.ts` con métodos POST/PUT contra sus páginas correspondientes antes de asumir que un módulo "cerrado" está completo end-to-end (a nivel de UI, no de runtime real — ese sigue bloqueado por el hallazgo crítico).

**Barrido sistemático completo (aplicado tras detectar el patrón):** se listaron TODAS las rutas de `app/api/erp/*/route.ts` con métodos POST/PUT/PATCH/DELETE y se verificó cuáles tenía UI real conectada (`grep` de la ruta en `app/` y `components/erp/`). Resultado:
- `catalogo` (POST/PATCH/DELETE): **sin UI, gap real y el más grande de los tres** — corregido con t-021 (crear) + t-022 (editar/eliminar), ambas lanzadas en paralelo en opencode por no compartir archivos, ambas cerradas con QA independiente completa (lectura manual + tsc + eslint + next build, todo limpio en el primer intento).
- `contratos` (POST): SÍ tiene UI (`components/erp/ContratoForm.tsx`, t-009). Sin hallazgo.
- `equipo` (POST): SÍ tiene UI (`components/erp/CrearEmpleadoForm.tsx`, t-018). Sin hallazgo.
- `movimientos` (POST): SÍ tiene UI (`components/erp/RegistrarMovimientoForm.tsx`, t-017). Sin hallazgo.
- `proyectos` / `proyectos/[id]/espacios` (POST/PUT): SÍ tienen UI (cotizador, t-008). Sin hallazgo.
- `proveedores` (POST): corregido en t-020 (ver arriba).
- `tareas-produccion` (POST): corregido en t-019 (ver arriba).

**Conclusión del barrido: cerrado.** Los 8 módulos de escritura de `app/api/erp` ahora tienen UI real conectada. No queda ningún endpoint de escritura huérfano de interfaz en el ERP.

**Checkout de la tienda pública, verificado (no es un gap):** `/api/pedidos` (t-015, el módulo de mayor riesgo real de la sesión por tocar dinero) SÍ tiene UI real conectada — `components/cuenta/PedidoCarritoForm.tsx`, usado en `app/cuenta/pedido/page.tsx`. Confirmado con `grep`, no se investigó más a fondo porque t-015 ya tiene QA exhaustiva registrada de la oleada anterior.

## Cierre de esta oleada de auditoría (2026-08-01, madrugada)

**Balance total de la oleada:** 4 tareas nuevas cerradas (t-019, t-020, t-021, t-022), todas `ui`/riesgo bajo, todas con el mismo hallazgo raíz (API de escritura completa sin UI que la use) encontrado por un barrido sistemático propio, no por instrucción externa. Todas delegadas a `opencode/deepseek-v4-flash-free` con prompts prescriptivos (código casi completo), todas correctas al primer intento, todas verificadas con lectura manual completa + `tsc`/`eslint`/`next build` independientes antes de cerrar. Cero bugs nuevos quedaron sin corregir. 4 commits nuevos en `dev` (`ac1c476`, `438fff4`, `5383828`, `1e497e2`).

**Estado del ledger tras esta oleada:** 15 tareas `cerrada`, 6 `esperando_humano` (t-003 R2 `[SOLO_HUMANO]`, t-008 cotizador, t-009 contratos, t-013 portal cliente, t-015 checkout, t-017 finanzas — todas de riesgo alto/lógica de negocio o dinero, checkpoint pendiente del Supervisor).

**Lectura honesta del estado real:** a nivel de UI/API/tipos, el ERP + sitio público ahora están funcionalmente completos para el conjunto de tablas existente — no hay endpoints huérfanos, no hay páginas de solo lectura donde debería haber escritura, auth revisada y confirmada correcta en las tres superficies (ERP por rol, cuenta por cliente, público sin auth). **Esto sigue siendo "compila y la lógica aislada es correcta", no "funciona"** — el hallazgo crítico del inicio de este archivo (ningún módulo corrió jamás contra una base de datos real) sigue exactamente igual de vigente y sigue siendo el único techo real de confianza. Ese hallazgo no se puede resolver con más agentes ni más tiempo autónomo: requiere el dashboard de Neon.

**Próxima acción recomendada para cuando el Supervisor vuelva, en orden:**
1. Leer el hallazgo crítico (arriba del todo de este archivo) y decidir sobre la rama `dev-local` de Neon.
2. Con esa base de datos, correr `npm run db:migrate` + `npm run db:seed` + `npm run dev` y probar de verdad los 6 flujos en `esperando_humano` (son los que más importan: dinero, contratos, aislamiento de datos de cliente).
3. Recién ahí dar checkpoint a t-008/t-009/t-013/t-015/t-017.
4. t-003 (R2) sigue bloqueada aparte, no depende de lo anterior.

**Decisión tomada / lecciones de proceso:**
- Modelos gratis de opencode: fallan con prompts abiertos, funcionan con prompts muy prescriptivos (código casi completo).
- Nunca se acepta el reporte de un ejecutor como prueba — el orquestador re-corre tsc/eslint/tests de forma independiente en cada integración, y en t-013 además releyó manualmente la cadena completa de llamadas para confirmar que la verificación de propiedad ocurre antes del acceso a datos, no solo que la función aislada esté bien escrita.
- Con varios agentes en paralelo en el mismo worktree, staging siempre explícito (`git add <rutas>`), nunca `-A` a ciegas.
- `npx next build` con una `DATABASE_URL` placeholder es una verificación real y barata que conviene correr periódicamente sobre código nuevo — encuentra bugs de framework (Suspense, relaciones) que `tsc` no ve, aunque no pueda completar sin una base de datos real.

## Ciclo de 6 pasadas sistémicas sobre el inventario del diamante 2 (2026-08-03) — esperando checkpoint

**Contexto:** el Supervisor ordenó NO abrir el Define del diamante 2 hasta agotar más loops metodológicos sobre el inventario de eventos (47). Ordenó además un cambio de rol: el Orquestador dejó de ejecutar las pasadas directamente y pasó a **orquestar 6 subagentes** (P2-P7), cada uno con un lente distinto y un **loop interno de 3 pasadas** (bruta → autocrítica → refinamiento), para obtener un panorama asegurado sin quemar el contexto del orquestador.

**Qué se hizo:**
- Metodología escrita: `arnes/lineas/ola7/archivo/pasadas/diamante2_metodologia_pasadas.md` (6 lentes: regla, dato, actor, secuencia, finalidad, causalidad; formato de output uniforme; reglas de anti-duplicación, trazabilidad y escepticismo).
- Ledger: t-035 a t-040 creadas (una por pasada), `esperando_humano`.
- 6 subagentes lanzados en paralelo, cada uno escribiendo SOLO su archivo (`pasadas/pasada2_invariantes.md` … `pasada7_arquetipos.md`). Serialización verificada con `git status` (nada compartido fue tocado).
- Auditoría del Orquestador sobre los 6 outputs: formato, trazabilidad `archivo:línea`, anti-duplicación contra el loop 1, y regla de escepticismo — todo cumplido.
- Deduplicación cruzada entre pasadas: **66 → 61 hallazgos únicos**, consolidados en `pasadas/diamante2_panorama_consolidado.md`, agrupados en 10 familias (A dinero, B cronograma, C schema, D cliente, E roles, F rol-vs-persona, G datos, H bucles, I límites, J fronteras).
- Contradicción entre pasadas resuelta: el vínculo E-16→cronograma (que P5/P3 pedían como adición) fue descartado por P6 por no estar documentado en el mapa; el Orquestador falló a favor de P6 → VACÍO.

**Lecturas transversales del ciclo:** (1) el inventario es fuerte en eventos de estado, débil en enforcement/negación; (2) el dinero es la cadena crítica oculta (6 hallazgos: gate de caja, nacimiento de obligación, arriendos, RED3); (3) el cuello humano es la cola del embudo, no la fábrica (comercial = 13 eventos, se satura primero); (4) el cliente queda en silencio ~4 semanas; (5) la promesa 15-20 días no reconcilia con 30 días ideal ni 6.5 reales (necesita dato de Javier); (6) la medición es precondición de la tesis de capacidad.

**Lo importante:** NINGÚN hallazgo cambia bounded contexts ni gates (verificado en las 6 pasadas). La única frontera que roza es el dueño del dinero del cliente Contratos↔Finanzas (P3-02) — se resuelve como frontera del Define, no reabre el esqueleto. **Nada se aplicó al inventario todavía.**

## 7ª pasada (P8, 2026-08-03) — Excepciones y fricción, completada

**Contexto:** el Supervisor aprobó una 7ª pasada con el lente del FALLO (qué pasa cuando un evento NO ocurre) y entregó 4 decisiones de negocio nuevas (I-024 a I-027 en `log_insights_fase2.md`): promesa contractual de 7 semanas + cuestionario de viajes al cliente (I-024), check de los 15 días con log de producción y 3 desenlaces (I-025), calidad revisable por el comercial vendedor o el gerente (I-026), y flow organizado de cambios de contrato con tercer origen de causa en E-33 (I-027).

**Qué se hizo:**
- I-024..I-027 registrados en el log de insights; lente P8 añadido a `diamante2_metodologia_pasadas.md`; t-041 creada.
- Subagente P8 lanzado, completado y **auditado por el Orquestador** (formato, trazabilidad `archivo:línea` al 100%, anti-duplicación, serialización limpia vía `git status`).
- Resultado: **12 hallazgos nuevos** (8 ADICIÓN, 2 REFUERZO, 1 ADICIÓN+VACÍO, 1 VACÍO) en `pasadas/pasada8_excepciones.md`, integrados al panorama consolidado. **4 de las 5 decisiones del Supervisor NO tienen evento en el inventario** — el inventario no materializa las reglas reales del negocio (promesa, viajes, check de 15 días, flow de cambios).

**⚠️ Dos decisiones del Supervisor que P8 destapó y quedaron pendientes de resolver ANTES de converger el Define — RESUELTAS el 2026-08-03 (I-034, I-035, I-043):**

1. **I-025 → cronograma doble (I-034 + I-043):** el Supervisor confirmó que SÍ hay dos calendarios, y precisó la lógica completa: cada proyecto tiene **predefinido un cambio de cronograma al cliente** — cuando el cronograma ideal de producción se cumple a los 15 días, se le notifica al cliente que **su proyecto se entrega antes** (cambio esperado y positivo, ya anticipado en el proyecto). Si ese cambio no se hace internamente, es un **mal indicador de producción**; externamente el cliente no se entera. **El único cambio visible al cliente es el positivo; los deslizamientos internos nunca llegan al cliente dentro de la promesa de 7 semanas.** Corrige la inmutabilidad de E-33/A-7 (una sola línea) y matiza P5-02.
2. **I-026 → verificador único + sin conflicto (I-035 + I-043):** la verificación la hace UNA sola persona designada por despacho (comercial o gerente), con misión única de verificar y aprobar. **NO hay conflicto de interés**: la comisión del comercial es por ventas, no por producción — si el cronograma se afecta, afecta al equipo de producción, no al comercial. La verificación por el comercial vendedor es limpia.

**Corrección a un hallazgo previo:** P5-02 (silencio del deslizamiento = defecto) queda acotado — I-025/I-043 aclaran que dentro de la promesa de 7 semanas el silencio deliberado es por diseño; la comunicación solo importa al salirse de la promesa.

## Aplicación al inventario + correcciones al mapa — COMPLETADA (2026-08-03)

**Contexto:** con las 2 decisiones cerradas, el Supervisor ordenó: *"ejecuta las aplicaciones al inventario, correcciones y destilación de info, y luego según tu auditoría tienes la decisión final sobre datos reales: si la metodología aprueba pasar a abrir el Define o requiere otra pasada."*

**Qué se aplicó al inventario (`diamante2_discover_eventos.md`):** de **47 a 61 eventos** (14 adiciones del ciclo P2-P8 + decisiones):
- **E-48** diseño 3D producido (rol diseñador, P4-F1) · **E-49** presupuesto no viable (Z1, F-8) · **E-50** SLA de primera respuesta (F-7) · **E-51** lead→cliente materialización (P3-01) · **E-52** estimación de duración (F-10) · **E-53** cuestionario de viajes (I-024/F-3) · **E-54** reproceso por calidad/schema rechazado (F-9) · **E-55** testimonio post-entrega (P6-06) · **E-56** nacimiento de la obligación de cobro (P3-02) · **E-57** pago de arriendos (P2-1) · **E-58** cuenta/saldo por socio (P2-7) · **E-59** check de los 15 días con 3 desenlaces (I-025/F-4) · **E-60** comunicación frontstage de progreso (P5-01/P5-02/P5-10) · **E-61** check de completitud de orden de garantía (F-11).
- **Refuerzos marcados en filas existentes** con su hallazgo de origen (P2-2, P2-3, P2-5, P2-7, P2-8, P3-03..P3-12, P4-F2..F8, P5-02/04/09/13, P6-01..07, H-03..H-11, P8 F-2, F-5, F-6, F-12).
- **Corrección de auditoría (2026-08-03):** la verificación mecánica detectó que E-49 y E-50 quedaron solo como referencias en prosa y que 9 refuerzos (P4-F3..F6, P5-09, P6-01, P6-04, H-04, H-11) no estaban anotados físicamente. Se crearon las filas faltantes (E-49, E-50) y se anotaron todos los refuerzos en sus filas objetivo. **Verificado: 61 filas, sin duplicados, sin faltantes; los 45 hallazgos trazables del panorama están en el inventario.**

**Qué se aplicó al mapa (`logica_de_negocio.md`, vía loop focalizado — contrato vivo):**
- Sección Control de cronograma: **promesa de 7 semanas + cuestionario de viajes (I-024)**, **cronograma doble (I-034)**, **check de los 15 días con 3 desenlaces (I-025)**, **tercer origen de causa "cambio de contrato" (I-027)**, **comisión del comercial por ventas (I-043)**.
- Diagrama N2: "ajuste en paralelo, no bloquea" → "cambio de contrato con flow organizado (I-027)".
- Sección separación ejecutor-verificador: **verificador único designado + sin conflicto de interés (I-035/I-043)**.
- Narrativa retoma de medidas: el cambio de contrato ya no es solo "corre en paralelo" — dispara E-33 con causa "cambio de contrato".
- KPI "15-20 días" reconciliado con la promesa de 7 semanas + check de 15 días.

**Destilación:** insights **I-024, I-025, I-026, I-027, I-034, I-035, I-043** marcados `integrado` en el log. Corrección de numeración: el insight de comisiones/cronograma pasó de I-036 (colisionaba con un I-036 SEO ya existente) a **I-043**.

## Decisión de auditoría del Orquestador — SE ABRE EL DEFINE

**Veredicto:** la metodología **aprueba abrir el Define** (`diamante2_define_eventos.md`). Los 61 eventos convergen en bounded contexts; las 2 decisiones estructurales ya quedaron resueltas por el Supervisor (cronograma doble, verificador único); los VACÍO que quedan son parámetros (SLA, consecuencia tras 12 días, presupuesto no viable) que se modelan "por definir" en el checklist del Define, no bloquean. Ningún hallazgo cambia bounded contexts ni gates (verificado en las 7 pasadas). Los criterios de reapertura (aparecer una regla que cambie bounded contexts o gates) no se dispararon.

**Lo que el Define lleva como decisiones ya tomadas:** cronograma doble (E-14/E-33/E-60), promesa 7 semanas (E-14/E-11/E-47), check de 15 días (E-59), verificador único (E-18/E-24), flow de cambios con tercer origen (E-16/E-33), comisión del comercial por ventas (E-31/E-35), sin conflicto verificador (I-043).

## Define convergido (2026-08-03, aprobado por el Supervisor)
**Qué se hizo:** el Supervisor aprobó abrir el Define; se creó `diamante2_define_eventos.md`. **Los 61 eventos convergen en 15 bounded contexts** (12 del cierre del diamante 1 + **3 nuevos** que resuelven los 5 eventos sin hogar que P6-03/P6-04 señalaron):

- **Marketing / Demanda** (nuevo): E-40 conversión Google Ads, E-42 medición de embudo, E-55 testimonio.
- **Tienda web** (nuevo): E-44 enganche pedido→producción.
- **Gobierno / Medición** (nuevo): E-47 KPIs operativos.
- **E-45 reposición** → Compras (resuelve P6-04).
- **E-08 pago de diseño 3D** → Finanzas (lo dispara Comercial pero el movimiento nace en Finanzas; frontera declarada).

**Decisiones del Define (ya tomadas, no son propuestas):**
1. **Enforcement = máquina de estados con guard** + rama negativa explícita (E-54 reproceso) — nunca "instrucción que se respeta si se quiere" (A3).
2. **Dueños de los gates:** E-18 → Compras (no crea pedido sin schema aprobado); E-21 → Compras→Taller (no transfiere control sin las 3 verificaciones); E-23 → Taller→Calidad (push); E-33 → Control de cronograma (no recalcula sin causa estructurada con tercer origen).
3. **Modelo rol-vs-persona** como precondición de todos los guards (P2-12/P4-F2/F4): roles tipados + asignación persona→rol explícita; los guards se evalúan contra el rol.
4. **Precedencia corregida (P5-09):** el cronograma pasa de "compras → aprobación → ensamblaje → instalación" a "**aprobación (check de schema) → compras → ensamblaje → instalación**". ⚠ **Toca contrato vivo (Parte I)** → se aplica vía loop focalizado con checkpoint del Supervisor al converger.
5. **Interfaces entre contextos** emergen de los gates (9 contratos listados en §5 del Define).

**VACÍO que entran al diseño como "por definir" (10, no bloquean):** SLA primera respuesta (E-50), consecuencia 12 días (E-29), presupuesto no viable (E-49), consecuencia SLA novedad (E-34), gate de caja (E-20), rama negativa E-21, rol de captura E-41, % carpintero, neto diseñador, actor de E-33.

**Decisiones de negocio que quedan para el Supervisor (definidas en §7 del Define):** actor del clasificador E-33, ¿gate de caja bloquea o advierte?, ventana SLA E-50, consecuencia SLA E-34, palanca de demanda H5-H8, pendientes financieros del cierre §9.

**Verificación mecánica:** 61/61 eventos asignados a contexto, sin faltantes ni doble conteo (script de parseo sobre la tabla §2).

## Ciclo de pasadas C1-C6 sobre la convergencia del Define — COMPLETADO y CONSOLIDADO (2026-08-03)

**Qué se hizo:** 6 subagentes (t-042..t-047) auditaron la convergencia del Define con lentes distintos, cada uno con loop interno de 3 iteraciones y trazabilidad `archivo:línea`. Outputs: `pasadas/define_c1_cohesion.md` … `define_c6_restriccion.md` (55 hallazgos brutos). Auditoría del Orquestador (formato, trazabilidad, anti-duplicación) y consolidación en `pasadas/diamante2_define_consolidado.md`.

**Veredicto del Orquestador — CONVERGENCIA ESTRUCTURALMENTE ESTABLE:**
- **0 `PARTIR_CONTEXTO`, 0 `MOVER_CONTEXTO`** — los 15 bounded contexts se sostienen (C1: Comercial 15 y Finanzas 12 no son cajón de sastre).
- **61/61 eventos con hogar** (re-verificado por C3); **7/7 decisiones I-024..I-043 materializadas**; **0 contradicciones silenciosas** (C5); los 9 contratos de §5 bien formados (C2); el grafo soporta la tesis de capacidad (C6).
- **3 correcciones documentales aplicadas al Define hoy (sin checkpoint, no mueven fronteras):** identidad compartida lead→cliente→proyecto (§2), fila E-24 en tabla de gates §4.1, filas de interfaz B3/B5/B7/B9 + nota de ramas negativas (§5), precondición rol-vs-persona (§8).

**Lo que el ciclo afloró y NO se aplicó en silencio (va al checkpoint del Supervisor):**
- **Bloque C — enforcement estructural (no parametrizable):** E-33 camino positivo (el adelanto de E-59 no tiene ruta por E-33; su rama negativa castigaría el éxito, C4-01), E-54 back-edges/granularidad módulo-vs-proyecto/recalc asimétrico (C4-02), E-21 estado de salida sin nombre (C4-03).
- **Bloque B2 — nueva frontera que cruza capas:** E-59 necesita la fila del Taller (capa 2) en capa 1 — cruza la división de capas aprobada (C2-03, C6-01).
- **Bloque D — 8 decisiones de negocio** (amplían §7 del Define): gate de caja bloquea/advierte + quién lo salta, rama negativa de E-21, identidad del verificador único, actor del clasificador E-33, rol de captura de E-41, KPI residual E-47 vs promesa 7 semanas, I-014/I-021 líneas de servicio reales, VACÍOs de apertura no formalizados.

**NO se abre el loop 2 todavía.** El enforcement (§4) es la máquina de estados que el loop 2 de schema/UI congela; diseñar sobre las ramas no deterministas de E-33/E-54/E-21 es deuda diferida. Próxima acción técnica: el Supervisor decide los puntos del Bloque C/B2/D (mismo paquete que la corrección P5-09 al mapa).

## Checkpoint de decisiones del Define — APROBADO (2026-08-03) → LOOP 2 ABIERTO

**El Supervisor respondió todas las decisiones del ciclo C1-C6 y el loop focalizado P5-09.** El paquete completo quedó aplicado al Define (`diamante2_define_eventos.md`, §§5/6/7/8) y al mapa (`logica_de_negocio.md`), y destilado como **I-053** en `log_insights_fase2.md`. Detalle completo en la sección 5 del consolidado (`pasadas/diamante2_define_consolidado.md`). Resumen:

- **B2:** la fila del taller (avance por módulo) es **capa 1** — input de E-59/E-34; sin pantallas de carpinteros (capa 2 diferida).
- **Enforcement:** adelanto = cambio sancionado (sin castigo de comisiones); granularidad de reproceso = **módulo/componente** con **rastreo de origen** (el culpable asume); E-21 sale con estado **`recibido_verificado`** (checklist de la lista de compra esperada); el control pasa al desarrollador sobre el proceso en taller.
- **Negocio:** gate de caja = **bloqueante** (lo resuelve el gerente moviendo cronogramas; el sistema es **guía + registrador de la realidad**); verificador único = **el comercial vendedor**; clasificador E-33 = interno/externo es atributo, no determinante (composición causal); E-41 = comercial define todo + desarrollador define en retoma; **KPIs por subsistema, ninguno residual** (4 semanas → 5% dev+carpintero · ventas → comisión comercial · 7 semanas → cliente recomienda); VACÍOs resueltos (V-1 no-show reagenda con límite, V-4 envío, V-5 horas automáticas, V-6 firma); I-014/I-021 → estrategia de mercado (t-034).
- **P5-09:** aplicado al mapa (cronograma corregido, verificador único, KPIs, gate de caja, guía+registrador, rastreo de origen, fila del taller, factores de tamaño).
- **Cronograma por factores de tamaño (C1):** base 4 semanas (1 dev + 1 compra + 1 ensamble + 1 instalación); un apto puede pedir 2 dev + 1.5 aprovisionamiento.

**Qué queda por definir — RESUELTO (2026-08-03):** los 6 valores numéricos configurables quedaron definidos por el Supervisor — SLA primera respuesta = **5 min** (excede → escala a LLM con registro; sin LLM → segundo comercial notifica); atraso 12 días = **aviso automático al gerente**; lead no viable = **se pierde, solo se registra el motivo**; SLA novedad crítica = **registro + visibilidad + escalación al gerente, sin multa**; % del carpintero = **5% por tamaño** + módulo instalado; neto del diseñador = **parámetro configurable** ($130k bruto − retención ± IVA, **validar con el contador** antes del corte). **El Define no tiene más decisiones de diseño pendientes.**

**Ledger:** t-042 a t-047 con `checkpoint.veredicto_humano = aprobado` (2026-08-03).

## Próxima acción permitida

**Fase 0 (decisiones) COMPLETADA (2026-08-04).** 14 de 16 decisiones cerradas, 2 pendientes de confirmación contable (retención diseñador, IVA diseño 3D). 5 mini-diamantes abiertos (no bloquean corte).

**Una línea viva: Execute (Ola 7).**

- **Técnica (Fase 3):** **Ola 7 Execute ABIERTA** — schema aprobado (65 tablas), pantallas aprobadas (34 core), decisiones de negocio resueltas. Iniciar codificación por zonas: transversal → comercial → cronograma → compras → taller → calidad → finanzas → cliente/docs. Schema migra en 4 fases paralelas a la codificación de pantallas.
- **Demanda/conversión (t-034):** bloqueada esperando al Supervisor. Faltan: aprobar alcance (§8 del marco), credenciales de solo lectura (`[SOLO_HUMANO]`), informe de sector, confirmar H1-H4 como tareas de código.
- **Ojo con H1-H3:** tocan el schema de datos, que `AGENTS.md` prohíbe modificar sin checkpoint.

## Diamante 3 — Fase B (schema y pantallas) COMPLETADA (2026-08-04) → checkpoint humano

**Contexto:** el loop 2 de diseño (schema/UI) corrió completo por el grafo de `diamante3_metodologia.md` (t-048 a t-073, 26 pases). Se cerraron la **Ola 4** (B3-1..B3-5: 34 pantallas core especificadas), la **Ola 5** (B4-1..B4-4: auditoría de 4 lentes, 0 hallazgos estructurales) y la **Ola 6** (B5 auditor final: veredicto **`APROBADO`** + consolidado UI).

**Entregables de la Fase A (schema):** `pasadas/d3_schema_consolidado.md` — **65 tablas** (18 existentes + 47 nuevas), **61/61 huella evento→tabla→columna**, **5/5 gates deterministas** (E-18/E-21/E-24/E-33/E-20), plan de migración en 4 fases, 9 DECISION_PENDIENTE (ninguna estructural). Correcciones A3-C1..C5 incorporadas.

**Entregables de la Fase B (pantallas):** `pasadas/d3_ui_b3_1..b3_5` (34 pantallas × 8 secciones del contrato de formato met:110-123), `pasadas/d3_ui_b4_1..b4_4` (auditorías), `pasadas/d3_ui_b5_auditor.md` (**APROBADO**: 100% pantallas · 100% gates con UI · roles×gates · 0 ambigüedad · UX destilado) y `pasadas/d3_ui_consolidado.md` (entregable final de Fase B).

**Verificación mecánica:** `git status --porcelain` confirma que **ningún pase tocó código vivo** (`app/`, `lib/`) — solo documentos en `arnes/`. La tarea de cada pase siguió el patrón de "solo escribe su archivo de salida".

**DECISION_PENDIENTE para el Supervisor — RESUELTO (2026-08-04):**
- DP-02 rol `compras` → **rol tipado dedicado**, gerente = suma de roles ✅
- DP-04 login del contador → **cuenta propia**, invitación con rol pre-asignado ✅
- H8 transparencia por rol → **permisos sumativos**, diseñador aislado, comercial ve sus proyectos + leads entrantes ✅
- H12 pedidos anónimos → **NO, cuenta obligatoria** para checkout; anónimo solo para agendamiento WP ✅
- DP-06 base de comisión → **subtotal sin IVA** ✅
- DP-09 alojador de docs → **Drive para SKP/SDK; R2 para imágenes exportadas** ✅
- DP-01 valores numéricos → **estimados dados** (comisión 5%, tarifa 15k/6.5k, reducción 0.5%/día, etc.); pendiente confirmación contador para retención e IVA diseño ✅
- Más las 9 del schema (sch_c §DP-01..09): 8 cerradas, 1 pendiente (DP-01 valores numéricos con estimados) ✅
- Validación del neto del diseñador con el contador → **pendiente** (retención diseñador + IVA diseño 3D) ✅

**Fronteras DIFERIDO que NO se construyen ahora (registradas, t-034/capa 2):** tienda (F-04/F-05/F-06), KPIs (P-32), testimonios (P-33), facturación DIAN (`facturas`), detalle interno del taller (`tareas_produccion`), subsistema de firma digital (wizard, no módulo).

**Próxima acción:** Confirmación de Supervisor sobre las 2 pendientes (A-01: `umbral_novedad_check15`, `recargo_hora_extra_pct`, `neto_diseno_3d_pct`, `iva_diseno_3d_pct`, marca) → Ola 7 (Execute) comienza con codificación de 34 pantallas + migración de schema en 4 fases.

## Fase 2, Ronda 3 — Decisiones respondidas (2026-08-04) → CHECKPOINT RESUELTO

**Contexto:** El Supervisor respondió las 16 DECISION_PENDIENTE de `d3_ui_consolidado.md` y `d3_schema_consolidado.md`. Respuestas sistematizadas en `diagnostico/pasadas/fase2_ronda3_decisiones_respondidas.md`.

**Veredicto:** 14 de 16 decisiones cerradas (2 pendientes de confirmación contable, no bloquean). 5 mini-diamantes abiertos (no bloquean corte).

**Decisiones cerradas (D-01 a D-14):**

| ID | Tema | Respuesta | Impacto |
|----|------|-----------|---------|
| D-01 | Rol `compras` | Rol tipado dedicado. Gerente = suma de roles (gerente + compras + otros). Personas se asignan roles; al cambiar de cargo, se reasignan. | `roles` tabla + fila `compras`, `personas_roles` N:N, `erp-nav.ts` módulo `compras`, gate E-20 |
| D-02 | Login contador | Cuenta propia con rol `contador`. Gerente (RRHH) crea invitación con rol pre-asignado; contador completa datos y crea password. | `usuarios` + `tokenInvitacion`, `/registro?token=`, `requireEmpleado` para P-23 |
| D-03 | Transparencia por rol (H8) | Permisos sumativos por rol asignado. Gerente ve todo. Comercial ve sus proyectos + leads entrantes (<5 min). Diseñador aislado solo a sus proyectos/clientes. | Nuevo rol `disenador`, `erp-nav.ts` filtrado por suma de roles, P-09/P-16/P-20 con aislamiento |
| D-04 | Checkout anónimo (H12) | No anónimo. Cuenta obligatoria para checkout. Anónimo solo para agendamiento WP (F-12). | F-06 requiere `requireCliente`, F-12 permanece público |
| D-05 | Base comisión (DP-06) | **Subtotal sin IVA**. La comisión es sobre el valor del trabajo, no sobre el impuesto. | Parámetro `base_comision_tamano = 'subtotal_sin_iva'`, P-22 muestra base de cálculo |
| D-06 | Alojador docs (DP-09) | Drive para SKP/SDK mobiliario. R2 para imágenes exportadas (JPG/espacio/módulo). Excel de herrajes eliminado → absorbido por pantalla del sistema con gate + catálogo. | `documentos_proyecto.alojador` enum, upload R2, pantalla definición de proyecto por espacios |
| D-07 | Valores numéricos compensación (DP-01) | Estimados dados como v1: comisión cierre 5%, módulo 5%, tarifa carpintero 15k COP/h, auxiliar 6.5k COP/h, reducción retraso 0.5%/día (máx 5%), etc. Pendiente confirmación contador para retención e IVA diseño. | `parametros` tabla con 10 claves, `parametros_historial` versionado, panel de administración |
| D-08 | Catálogo insumos vs producto (DP-05) | Metodología de grafos requerida. Entidades simples relacionadas: tabla de costos proveedores, catálogo productos/servicios, catálogo herrajes (compra + presentación), productos→colores→acabados, insumos→productos terminados. | Nuevas tablas: `catalogo_herrajes`, `productos_colores`, `productos_acabados`, `insumos_producto`. Mini-diamante M-02. |
| D-09 | Deprecación rolEmpleado (DP-03) | Migrar código existente al nuevo schema, no levantar de 0. Transición coordinada Fase 4. | `personas_roles` con backfill desde `usuarios.rolEmpleado`, deprecación gradual |
| **FLAG-4** | **Estructura catálogos: insumos vs producto vs herramienta** | **NO es columna `tipo` con enum.** Modelo axiomático: tabla base `productos_catalogo` (compartida) + 3 especializaciones 1:1 (`productos_tienda`, `materiales_insumos`, `herramientas_maquinaria`). Cada universo tiene campos/relaciones distintos: tienda = descripción_diseño + pedidos + margen; insumo = lote_mínimo + especificación técnica; herramienta = mantenimiento + marca + manual. | Todas las tablas en `d3_schema_consolidado.md` §5 (Compras) + `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` (especificación axiomática). t-075 las codifica en Ola 7. |
| D-10 | Determinismo causal E-33 (DP-04) | Metodología para determinismo con justificación humana natural. Verificador valida/rechaza composición causal con justificación textual. | `desfases_cronograma` + columnas `verificadoPor`, `verificadoEn`, `justificacion_rechazo`. Mini-diamante M-01. |
| D-11 | Grafos de composición (DP-05/schema) | Metodología de grafos para composición de entidades: insumo→producto→proyecto, herrajes como catálogo dual (compra + presentación). | Grafo implementado como relaciones FK en Drizzle. Mini-diamante M-02. |
| D-12 | Espejar parámetros en eventos (DP-07) | Logs robustos como sub-sistema de observabilidad. Cada cambio de parámetro, evaluación de gate, y acción de usuario → evento en `eventos`. KPIs derivan del log. | `eventos` tipos expandidos, sub-sistema KPIs, panel P-23 alimentado desde `eventos`. Mini-diamante M-04. |
| D-13 | Fuente SLA/holgura (DP-08) | Derivar del grafo de composición de proyecto. SLA y holgura no son valores sueltos sino consecuencia de módulos activos, dependencias, cantidad de espacios. | Mini-diamante M-03 (derivación de parámetros desde factores de proyecto). |
| D-14 | Marca/legal editable (DP-09/schema) | Panel de parametrización general en ERP, editable desde el logo. 6 claves de marca en `parametros`. | `/app/erp/configuracion` (nueva ruta), `parametros` con 6 claves de marca, `lib/seo/jsonld.ts` lee en tiempo real |

**Pendientes de confirmación (A-01 — no bloquean corte):**
- `umbral_novedad_check15`: unidad (días, horas, %). Estimado: ≥3 días.
- `recargo_hora_extra_pct`: revisar legal Colombia 2026.
- `neto_diseno_3d_pct`: ($130k − retención − IVA) → validar contador.
- `iva_diseno_3d_pct`: tasa IVA diseño (puede ser especial) → validar contador.
- Valores de marca (nombre, NIT, dirección, teléfono, horario): input del Supervisor.

**Mini-diamantes abiertos (no bloquean corte):**

| ID | Nombre | Sesión sugerida | Prepara | Bloquea |
|----|--------|-----------------|---------|---------|
| M-01 | Causalidad (E-33 determinismo) | Orquestador + Supervisor, 2h | Protocolo de auditoría de desfases | P-09 (cronograma doble) |
| M-02 | Grafos catálogo | Orquestador, 1h | Esbozo de modelo relacional insumo→producto→herraje | P-04 (cotizador), P-13 (compras) |
| M-03 | Derivación de parámetros | Supervisor + Orquestador, 1h | Tabla de factores que afectan comisiones | P-22 (compensación), gates E-31/E-35 |
| M-04 | Logging/KPIs | Orquestador, 2h | Diseño de `eventos` como observabilidad | P-23 (dashboard contador), gates E-18/E-21/E-24/E-33/E-20 |
| M-05 | Modularización | Supervisor + equipo producción, 3h | Inventario de procesos elementales del taller | P-16 (fila taller), P-18 (instalación) |

**Próxima acción:** Confirmación de Supervisor sobre A-01 → Ola 7 (Execute) comienza con codificación de 34 pantallas + migración de schema en 4 fases.

## Ola 6 — Cierre metodológico (2026-08-04) ✅ COMPLETA

**Qué se completó:**
- ✅ 16 decisiones del Supervisor sistematizadas + 9 cerradas
- ✅ 7 grafos relacionales diseñados y aprobados
- ✅ 5 gates validados contra schemas completos
- ✅ Subsistema de LOGS robusto (4 capas: core, agregación, KPIs, alertas)
- ✅ Documentación reorganizada: índice maestro + entrada única a Ola 7
- ✅ **Punto de entrada para Ola 7:** `arnes/lineas/ola7/archivo/OLA_7_ENTRADA.md` ← TODO COMIENZA AQUÍ

**Veredicto:** Ola 6 CERRADA sin bloqueadores. Ola 7 lista para ejecutar.

## Decisiones vigentes

- Stack: TypeScript en toda la pila. Next.js App Router. Drizzle ORM sobre la misma Neon.
- Sin motor schema-driven genérico.
- Tareas de riesgo alto o máximo pasan por checkpoint humano explícito antes de considerarse terminadas para producción real, aunque el commit en `dev` ya exista.
- Infraestructura de proveedores NO cambia.
- `main` no recibe push directo bajo ninguna circunstancia durante la migración.
- Ningún agente corre la app (`npm run dev`) ni prueba flujos de escritura mientras `DATABASE_URL` apunte a la Neon de producción compartida.
- **El código de las PoC del Diamante 4 (PoC 1/2/3/3.1, t-098/t-099) es prueba de concepto de estética/tokens/interacción únicamente.** Ninguna referencia puede citarlo como evidencia de que una pantalla de negocio "existe" o está aprobada — la única fuente de aprobación de pantalla es un `disenio_PXX.md`/`disenio_FXX.md` con checkpoint del Supervisor (decisión 2026-08-08, corrige el hallazgo F-01 de arriba).

## F2 = COMPLETADA (2026-08-05) — Checklist de Cierre (portado de v2, convergencia E2)

| Pantalla | Ruta | Estado | Artefacto |
|---|---|---|---|
| **P-01** | Kanban Comercial | ✅ Aprobado | `disenio_p01_kanban_comercial.md` |
| **P-02** | Nueva Cotización | ✅ Aprobado | `disenio_p02_nueva_cotizacion.md` |
| **P-03** | Detalle Solo Lectura | ✅ Aprobado | `disenio_p03_detalle_solo_lectura.md` |
| **P-04** | Cotizador (Editor) | ✅ Aprobado | `disenio_p04_cotizador.md` |
| **P-05** | Contrato Modal | ✅ Incluido en P-04 | `contrato_modal` sección P-04 |
| **F-01** | Landing/Home público | 🔲 Por construir — PoC 3 es solo demo de tokens D4, no pantalla de negocio real. Ver `plan_estructura_sitio_publico.md` | — |
| **F-02** | Tienda Web (`/colecciones`) | ✅ Destilado | `destilacion_f3_publico.md` §1 |
| **F-03** | Portafolio de Proyectos (`/portafolio`) | ✅ Destilado | `destilacion_f3_publico.md` §2 |
| **F-08** | Propuesta pública (`/propuesta/{slug}`) | ✅ Destilado | `destilacion_f3_publico.md` §3 (UI pendiente F7) |

**Contradicciones del diamante resueltas (C1-C4):**
- C1: Tarifas MO derivadas de params en `parametros` (runtime calc)
- C2: Items referenciales como 3 campos en `items_variante`
- C3: Transiciones `proyectos.estado` como JSON en `parametros`
- C4: Precios semántica clara (`precio_publico` vs `precio_directo` vs `tienda.valor_tienda`)

## ✅ F3 = COMPLETADA (2026-08-05) — Aprobada por Supervisor (portada v2, convergencia 2026-08-06)

**Schema F3 aprobado (con valores convergidos del diamante, NO los originales):**
- `cronogramas(id, proyecto_id, base_semanas=4, holgura_max_dias=5, promesa_semanas=4)` — `base_semanas` CONVERGIDO a 4 (chequeo E2-2); el `7` del diseño v2 queda fuera
- `cronograma_etapas(id, cronograma_id, linea ENUM['contractual','interna'], etapa, fecha_ideal, fecha_real, estado)` — I-034: línea contractual inmutable
- `desfases_cronograma` (+4 campos en `items_variante` para C2/C4)
- `proyectos` ampliada: `estado` (enum 8), `verificador_id`, `fecha_entrada_desarrollo`, `comercial_vendedor_id`

**Pantallas F3 (P-06..P-12) — Diseños aprobados:**
| Pantalla | Evento | Estado | Artefacto |
|----------|--------|--------|-----------|
| P-06 | Mapa de gates (sumidero) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` |
| P-07 | Retoma de medidas (E-15→E-16) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §3 |
| P-08 | Desarrollo técnico (E-18) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §4 |
| P-09 | Cronograma doble (E-33) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §5 |
| P-10 | Novedades críticas (E-34) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §6 |
| P-11 | Check 15 días (E-59) | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §7 |
| P-12 | Equipo/Verificador | ✅ Aprobado | `disenio_f3_cronograma_gates.md` §8 |

**Decisión de negocio aplicada a P-07:**
- P-07 expandida con checklist de definición de proyecto: `espacios_artefactos` (categoría, dimensiones, tipo_specifique, ubicación, foto_url, requiere_verificacion, validado_por) — **tabla ya añadida a `lib/db/schema.ts`**(FK→`espacio_variantes`) el 2026-08-06; NO toca `items_variante` (C2 intacta)
- Mapeo a `parametros` con prefijo `retoma_` para SLA de respuesta (C1 runtime)

**Integration F2↔F3:**
- P-04 consume `proyectos.estado`, `parametros.transiciones_proyecto`, `parametros.tarifa_*`, badges gates E-18
- Kanban P-01 lee estados + transiciones desde `parametros`

**Predicados verificables (§5):**
```sql
P18(p) = estado='desarrollo' ∧ ∃verificaciones: tipo_gate='schema' ∧ veredicto='aprobado' ∧ verificador_id=proyectos.verificador_id
P33(p) = ∃desfases_cronograma: aplicado=true ∧ causa∈{interna,externa,cambio_contrato} ∧ motivo>0 ∧ composicion_causal>0
```

**F3 = COMPLETADA.** Próxima: Ola 7 Execute (codificación schema + 34 pantallas).
