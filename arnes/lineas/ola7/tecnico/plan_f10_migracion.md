# Plan F10 — Migración de Datos (Legacy JSON → V3 Relacional)

**Fuente única de verdad para F10.** Consolida estrategia, diagnóstico, scripts y criterios de aceptación.

**Fecha:** 2026-08-13 · **Estado:** en_planificación · **Fase:** F10 · **Riesgo:** crítico
**Rol:** Iniciador. **Plantilla:** `PLANTILLA_HARDENING.md` (adaptada para migración).

> ⚠️ **ORDEN CORREGIDO (2026-08-13).** El orden original (diagnóstico → migrar → preview) estaba invertido. Nuevo orden, validado con el Supervisor:
> 1. **PRIMERO** construir y probar el schema V3 con Drizzle (tipado, migraciones, adapter, tests) — **sin datos legacy**.
> 2. **LUEGO** desplegar preview de Vercel con el schema limpio (validar infraestructura).
> 3. **SOLO AL FINAL**, decidir y ejecutar el clone campo-a-campo legacy → V3.

> 🔴 **DEUDA TÉCNICA Y BLOQUEOS DOCUMENTADOS (2026-08-13).** Ver §3.1c, §3.5 y la sección **Bloqueos y Checkpoints**. Toda acción marcada 🔴 requiere decisión explícita del Supervisor antes de ejecutarse.
>
> ✅ **B-1 RESUELTO (2026-08-13, checkpoint Supervisor).** Persistencia de escrituras + reactividad multi-usuario decididas. Requisito explícito del Supervisor: **cero recarga manual, cero pasos intermedios, despliegue robusto para todo el equipo, no negociable.** Ver §3.1b (decisión) y §3.1d (arquitectura). Reemplaza el marco (A)/(B) original — las auditorías previas subestimaban el alcance real (ver §3.1b "Corrección de cifras").

---

## 1. Contexto
### 1.1 Estado actual
- **Prototipo F10**: Pantallas auditadas (D-01 a D-17), verificación mecánica (`tsc` 0, `eslint` 0, tests mock-store OK).
- **Schema V3**: `lib/db/schema.ts` define **28 tablas relacionales tipadas** (Drizzle).
- **Datos legacy**: Neon `main` (producción real) usa el modelo **Agnostic Seed** = **UNA tabla `agnostic_records`** con `{id, namespace, data: jsonb, updated_at}`. NO hay tablas relacionales; todo el negocio es un blob JSON por `namespace`.

### 1.2 Conteos reales de producción LIVE (verificados 2026-08-13, read-only)
| namespace | registros | destino V3 |
|-----------|-----------|------------|
| clientes | 33 | clientes |
| proyectos | 49 | proyectos |
| cotizaciones | 18 | proyectos (estado `enviada`) |
| productos_catalogo | 278 | productosCatalogo |
| espacio_variantes | 124 | espacioVariantes |
| items_variante | 626 | itemsVariante |
| contratos | 7 | contratos + hitosPago |
| propuestas_publicas | 23 | portfolioPublico |
| imagenes_espacio | 2 | espacioVariantes.fotosEspacio |

> Nota: `portfolio_publico` / `imagenes_portfolio` **NO existen** en producción LIVE. `cotizaciones` **NO tiene** tabla V3 propia → va a `proyectos`.

### 1.3 Objetivo (ORDEN CORREGIDO)
Llevar los datos reales de producción al preview de Vercel **en este orden**:
1. Construir y probar el schema V3 con Drizzle de forma elegante (tipado, migraciones versionadas, adapter, tests). Sin datos legacy.
2. Desplegar preview de Vercel con el schema limpio; validar que el cotizador y las pantallas funcionan.
3. Solo al final, clonar legacy → V3 campo-a-campo (mapeo ya documentado en `mapeo_campos.md`, sección LIVE PRODUCTION MAPPING).

### 1.4 Restricciones
- **No se escribe en `main`**: el clone lee `agnostic_records` de `main` en modo read-only; escribe en `v3-preview`.
- **Scripts idempotentes**: re-ejecutables sin duplicar.
- **AGENTS.md**: sin nuevo proyecto Neon; se usa rama del proyecto actual.

---

## 2. Diagnóstico Pre-Mapeo (COMPLETADO 2026-08-13 — t-125)
- `arnes/lineas/ola7/migracion/schema_legacy.json` (snapshot congelado `legacy-agnostic-backup`, **OBSOLETO** — los conteos del snapshot no coinciden con LIVE).
- `arnes/lineas/ola7/migracion/mapeo_campos.md`: sección **LIVE PRODUCTION MAPPING** con conteos reales + unión de campos por namespace + mapeo propuesto. Las secciones viejas están marcadas OBSOLETO.
- **Modelo**: legacy = JSON (`agnostic_records`); V3 = relacional (`schema.ts`). El clone traduce JSON → columnas tipadas.
- **Decisiones de mapeo**: `cotizaciones` → `proyectos` (estado `enviada`); `propuestas_publicas` → `portfolioPublico` (slug, publicado, snapshot_json→descripcionComercial); `imagenes_espacio` → `espacioVariantes.fotosEspacio`.

---

## 3. Estrategia de Migración — ORDEN CORREGIDO (4 Fases + validaciones)

### 3.1 Fase 0: Construir schema V3 con Drizzle (lo "pro") + testear TODO
**Sin datos legacy todavía.**
- Afinar/confirmar `lib/db/schema.ts` (28 tablas tipadas, camelCase).
- Generar migraciones V3 **desde cero** en `drizzle/v3/` (evita el prompt interactivo de `fotosEspacio` al no haber migración previa).
- Aplicar a una DB limpia (rama `v3-preview`): `drizzle-kit migrate`.
- Implementar `createDrizzleStore()` (lib/data/drizzle-impl.ts) cumpliendo `DataStore` — **ver decisión de persistencia en §3.1b**.
- **Tests**: `tsc --noEmit`, `eslint .`, `next build`, tests del módulo (con `DATABASE_URL` placeholder).
- Validar localmente que la app corre con `DATA_IMPL=drizzle` sobre el schema vacío (o fixtures). **Cero datos legacy.**

### 3.1b ✅ Decisión tomada (2026-08-13): persistencia de escrituras + reactividad total

**Corrección de cifras (auditoría de código real, 2026-08-13, previa a esta decisión).** Una primera pasada de análisis subestimó el alcance del problema en dos ejes — la decisión de abajo ya está tomada sobre las cifras corregidas, no sobre las originales:
- **Lecturas:** 305 usos de `store.` confirmados, mapeados sin ambigüedad a **43 archivos** en `app/` (no 23).
- **Escrituras:** contar solo los verbos genéricos (`crear/actualizar/eliminar/guardar/publicar/despublicar/anular`) da 44 sitios — pero eso ignora los verbos de dominio del contrato que también mutan estado (`actualizarEstado`, `emitirVeredicto`, `marcarInstalada`, `firmar`, `registrarPago`, `autorizarPago`, `confirmar`, `aplicar`, `marcarActiva`, `enganchar`, etc.). Contando **todos** los métodos mutadores de `DataStore`: **96 call sites en 25 archivos**, repartidos por compras, finanzas, equipo, garantía, catálogo, herramientas, cronograma, desarrollo y portafolio — no concentrados en 2–3 pantallas del cotizador.
- **Hallazgo no visto en el análisis previo — restricción cliente/servidor:** los 45 componentes que consumen `useDataStore()` (`lib/data/index.ts`) son **todos `'use client'`**. `getDataStore()` (y por tanto cualquier store real) se ejecuta **en el navegador**. El driver de este proyecto es `postgres` (postgres.js, ver `package.json`), un cliente TCP de Node — **no puede correr en el navegador**, y aunque pudiera, expondría credenciales de Neon al cliente. Consecuencia: **ningún** `createDrizzleStore()` puede ser "un objeto que habla con Postgres, llamado directo desde el componente cliente" — hace falta un salto de red (Server Actions) entre el store del navegador y la base de datos, sin importar qué política de escritura se elija. Esta restricción es la que define la arquitectura de §3.1d, no una preferencia de estilo.

**Requisito no negociable del Supervisor (2026-08-13):** reactividad total para todo el equipo — sin recargar la página, sin pasos intermedios manuales, para N empleados trabajando simultáneamente sobre datos reales. Esto descarta explícitamente:
- **(A) Write-behind puro (fire-and-forget):** pierde escrituras si el lambda serverless muere antes del flush. Inaceptable para producción real del equipo — descartado.
- **(B) Refactor async total del contrato (305 call sites):** técnicamente correcto pero innecesario — la restricción cliente/servidor de arriba obliga a un salto de red en las escrituras de todos modos; forzar `await` en las 209 lecturas puras no resuelve nada que la arquitectura de §3.1d no resuelva ya, y sí obliga a rediseñar el modelo de render (loading states/Suspense) de 43 pantallas sin necesidad — descartado.
- **"Recargar para ver cambios de otro empleado":** descartado explícitamente por mandato del Supervisor, aunque técnicamente fuera la opción más barata.

**Decisión:** arquitectura híbrida — escrituras síncronas-confirmadas vía Server Actions (sin pérdida de datos) + lecturas propias instantáneas (caché en memoria, sin tocar las 43 pantallas de lectura) + reactividad multi-usuario vía **polling corto con verificación liviana** (sin websockets, sin infraestructura nueva, dentro de Vercel + Neon ya aprobados). Detalle completo en §3.1d. Reemplaza el bloqueo B-1.

### 3.1c Fase 0.5: 🔴 Validación de VALORES reales contra el schema (dry-run)
No basta validar la *estructura* (unión de campos); hay que validar los *valores* antes de Fase 2:
- Correr un dry-run que mapee **5–10 registros reales** de cada namespace core (clientes, proyectos, cotizaciones, productos_catalogo, espacio_variantes, items_variante, contratos, propuestas_publicas) y verifique:
  - Todo `estado` legacy cae en el enum V3 (`estado_proyecto`, `estado_contrato`…); listar valores fuera de enum.
  - Nulos donde V3 exige `NOT NULL` (ej: `clientes.nombre`, `proyectos.nombreProyecto`).
  - Formatos de fecha válidos (`YYYY-MM-DD` / ISO).
  - Tamaños/longitudes y tipos numéricos.
- Reportar discrepancias en `arnes/lineas/ola7/migracion/validacion_valores.md`.
- **🔴 BLOQUEANTE:** debe pasar (o tener remediation documentada) **antes de Fase 2 (clone)**.

### 3.1d ✅ Arquitectura decidida: Server Actions + hidratación SSR + polling corto

> ⚠️ **Revisión 2026-08-14 (`m07b_reactividad_multiusuario.md`):** la pieza 4 de abajo ("polling corto 2-4s") queda **superada** — no por el plan externo `arnes/plan cambio f10 reactividad por eventos` (rechazado, ver [`archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md`](../archivo/MAL_PLAN_reactividad_broadcastchannel_DEPRECADO.md): `BroadcastChannel` no cruza máquinas y su alternativa de respaldo degradaba el SLA de ≤4s sin checkpoint), sino por **long-polling acotado + `LISTEN`/`NOTIFY` de Postgres**, que resuelve el mismo requisito (cross-usuario, ≤4s, sin recarga) con muchas menos invocaciones de Vercel. Detalle completo, opciones descartadas y regla técnica normativa en [`m07b_reactividad_multiusuario.md`](m07b_reactividad_multiusuario.md). El resto de esta sección (piezas 1-3 y 5) sigue vigente sin cambios — la revisión es puntual al mecanismo de detección de cambios cross-usuario.

Cuatro piezas. Las tres primeras no tocan las 43 pantallas existentes; la cuarta toca únicamente los ~96 call sites de escritura (25 archivos).

**1. Capa de Server Actions (`lib/data/actions/*.ts`, `'use server'`).**
Un wrapper por cada método mutador del contrato `DataStore` (~96 métodos: `crear`, `actualizar*`, `eliminar`, `emitirVeredicto`, `registrarPago`, `firmar`, etc.). Cada wrapper corre en el servidor, usa Drizzle contra Neon, confirma la escritura (transaccional donde el contrato ya lo exige — ej. `registrarPago`, `actualizarChecks`) y **solo entonces** retorna. Reemplaza tanto a (A) como a (B): no hay fire-and-forget (dato perdido) ni hace falta tocar las 209 lecturas.

**2. Hidratación inicial sin loading flicker.**
El layout raíz (Server Component) hace un fetch inicial completo vía Drizzle y pasa el snapshot como prop a un `Provider` cliente (`'use client'`) que construye el store en memoria **ya poblado** con datos reales — no hay pantalla de carga porque el primer HTML ya viene con los datos (SSR clásico de Next.js). Esto reemplaza la idea de "cache hidratada al arranque" del análisis original: la hidratación es un solo punto (el Provider raíz), no 43.

**3. Lecturas: sin cambios.**
Las 209 llamadas de lectura puras siguen síncronas contra la caché en memoria del store, exactamente como hoy con el mock. Cero pantallas tocadas para lecturas.

**4. Reactividad multi-usuario: polling corto + verificación liviana (resuelve "cero recarga, no negociable").**
El `Provider` raíz (un solo punto, no cada pantalla) hace polling cada **2–4s** contra un Server Action de verificación liviano — ej. `SELECT MAX(updated_at)` o un contador monotónico — que devuelve un valor comparable en una sola query barata. Si cambió respecto a lo que ya tiene el cliente, **recién ahí** trae el snapshot completo, hace merge en la caché en memoria y llama al mecanismo de reactividad que **ya existe** (`subscribe()` / `getVersion()`, M-07, `lib/data/index.ts`) — todas las pantallas suscritas se re-renderizan solas, sin que el usuario haga nada. Si nadie escribió nada, el poll cuesta una query mínima cada 2–4s, no una descarga completa. A la escala actual de datos (cientos de filas, no millones) el snapshot completo tampoco sería un problema, pero el chequeo liviano evita el gasto innecesario cuando no hay cambios (caso común).

**5. Escrituras: los ~96 call sites (25 archivos).**
Cada sitio de escritura (hoy `store.x.crear(...)` síncrono) pasa a llamar al Server Action correspondiente y `await`earlo. Al confirmar, actualiza la caché local + notifica vía el `subscribe()` existente → la pestaña propia refleja el cambio al instante (no hace falta esperar al próximo poll para verse a uno mismo). Las demás pestañas/usuarios lo ven dentro del siguiente ciclo de poll (peor caso ≤4s) — cumple "sin recargar, sin pasos intermedios" tal como lo pidió el Supervisor.

**Cambio de contrato que esto implica:** las firmas de los ~96 métodos mutadores de `DataStore` (`lib/data/contracts.ts`) pasan de `(...) => T | null` a `(...) => Promise<T | null>`. `mock-store.ts` (modo dev sin Neon) envuelve sus escrituras ya-síncronas en `Promise.resolve(...)` para seguir cumpliendo el contrato sin cambiar su lógica interna. Los 209 métodos de lectura **no cambian de firma**.

**No incluido a propósito (evita sobre-ingeniería):** WebSockets/SSE/pub-sub de terceros — evaluados y descartados por el Supervisor (requieren infraestructura nueva, checkpoint propio, costo recurrente o un proceso siempre-activo fuera del modelo serverless de Vercel) frente a una ganancia marginal (≤4s de latencia percibida vs. sub-segundo) que no es necesaria para un equipo interno.

### 3.2 Fase 1: Desplegar preview Vercel (schema vacío / fixtures)
- Push `dev` → Vercel genera preview.
- Vercel Preview env: `DATABASE_URL` = rama `v3-preview`; `DATA_IMPL=drizzle`; `ALLOW_MOCK_PREVIEW` unset.
- Verificar que el cotizador y las pantallas renderizan y funcionan sobre el schema limpio.
- **Checkpoint**: la infraestructura V3 está viva y correcta. **Aún sin datos reales.**

### 3.3 Fase 2: Clonar legacy → campos tipados (SOLO AQUÍ, decisión final)
- Una vez la página está en preview y testeada (y superada la validación §3.1c), entonces sí: leer `agnostic_records` de Neon `main` (read-only) y mapear **campo-a-campo** a las tablas V3 tipadas (`scripts/migrate-core.ts`), usando `mapeo_campos.md` (LIVE PRODUCTION MAPPING).
- Remapeo de IDs legacy→uuid (v5 estable + mapa para FKs), conversión de fechas/tipos, orden por FK, idempotente (DELETE inverso antes de INSERT).
- Cargar en `v3-preview` (el mismo preview ya vivo) — el schema ya está estable y probado.
- **Backup CA-7** justo antes de esta fase (snapshot de `v3-preview` y dump read-only de los namespaces core de `main`).
- Scope core: clientes(33), proyectos(49)+cotizaciones(18), productos_catalogo(278), espacio_variantes(124), items_variante(626), contratos(7)+hitos, propuestas_publicas(23)→portfolioPublico, imagenes_espacio(2)→fotosEspacio.

### 3.4 Fase 3: Verificación final
- Confirmar conteos (33/67/278/124/626/7/23) visibles en preview.
- Crear un proyecto de prueba en preview desde una pestaña/usuario → confirmar que aparece **sin recargar** en una segunda pestaña/usuario dentro de ≤4s (arquitectura de §3.1d: polling + Server Actions), y que persiste tras un reinicio real del navegador.

### 3.5 ✅ Infraestructura Neon aclarada (2026-08-13) + 🔴 plan de rollback pendiente
- **✅ Confusión de proyectos RESUELTA.** Había dos proyectos Neon candidatos: `empresa_muebles_database` (sa-east-1, cuenta/org distinta) y `veta_dorada_db` (us-east-1, cuenta `vetadeoro.co@gmail.com`, org `veta_dorada`). El primero era un **proyecto equivocado** — nunca fue la infraestructura real, quedó como resto de una configuración anterior. El Supervisor confirmó explícitamente: **única fuente válida = `veta_dorada_db`** (`noisy-morning-11774832`, us-east-1). Su branch `production` (`br-twilight-mountain-atj7nwx6`, host `ep-round-queen-at3nzf87`) es la base real de datos de clientes/proyectos/cotizaciones vigente. Todas las referencias a `empresa_muebles_database`/`ep-silent-field-ac8slpbc` quedan purgadas de `.env.local` y marcadas obsoletas acá.
- **Branches creadas (2026-08-13, copy-on-write de `production`, no tocan los datos reales):**
  - `dev-local` (`br-holy-cake-at61tar9`) — uso diario local, `DATABASE_URL` en `.env.local`.
  - `v3-preview` (`br-royal-hat-at8d8aab`) — para Fase 1 (Vercel Preview), aún no aplicada como env var de Vercel.
- **🔴 Pendiente de verificar (no bloqueante para Fase 0, sí antes de Fase 1):** confirmar a qué host apunta hoy el `DATABASE_URL` real configurado en Vercel (`empresa-muebles-vl37`, compartido entre Preview y Production según `vercel env ls`) — no se pudo leer el valor real por bloqueo intencional del sandbox de seguridad (evita volcar secretos de producción a disco). Pedirle al Supervisor que lo confirme desde el dashboard de Vercel, o resolverlo en el momento de Fase 1 sobrescribiendo directamente el env var de Preview con la connection string de `v3-preview`.
- **Rollback / corte duro:** apuntar al equipo al preview como "producción" es un cutover único sobre datos reales de clientes. Además del backup CA-7 se requiere: (a) plan de rollback explícito (cómo volver el tráfico a producción legacy si algo falla), y (b) considerar corrida en paralelo old+new un tiempo antes del corte definitivo.
- **🔴 BLOQUEANTE (parcial, B-4 sigue abierto):** aprobar el plan de rollback **antes de Fase 1** (despliegue) y **antes de Fase 2** (carga de datos reales). El proyecto Neon ya no es ambiguo (B-3 resuelto).

---

## 4. Scripts de Migración (Fase 2)
### 4.1 `scripts/migrate-core.ts` (concepto)
```typescript
// Lee agnostic_records por namespace y escribe a tablas V3 tipadas.
import { db } from '@/lib/db/client';
import { clientes, proyectos, productosCatalogo, espacioVariantes, itemsVariante, contratos, hitosPago, portfolioPublico } from '@/lib/db/schema';
import { postgres } from 'postgres';

const legacy = postgres(process.env.DATABASE_URL_LEGACY!); // main, read-only

async function migrateCore() {
  // 1. clientes
  const cls = await legacy`SELECT data FROM agnostic_records WHERE namespace='clientes'`;
  for (const { data } of cls) {
    await db.insert(clientes).values({
      id: uuidFromLegacy('clientes', data.id),
      nombre: data.nombre, documento: data.documento ?? null,
      telefono: data.telefono ?? null, email: data.email ?? null, domicilio: data.domicilio ?? null,
    }).onConflictDoNothing();
  }
  // 2. proyectos (+ cotizaciones) → proyectos
  // 3. productos_catalogo → productosCatalogo
  // 4. espacio_variantes (+ imagenes_espacio → fotosEspacio) → espacioVariantes
  // 5. items_variante → itemsVariante
  // 6. contratos (+ hitos_pago) → contratos + hitosPago
  // 7. propuestas_publicas → portfolioPublico
}
```
> Orden por FK: clientes → proyectos → espacios → items → contratos/hitos → portafolio.

---

## 5. Verificación Post-Migración (aplica Fase 2/3)
| # | Verificación | Comando/Procedimiento | Output Esperado |
|---|--------------|-----------------------|-----------------|
| V-1 | Schema sin drift | `npm run db:generate` | Sin cambios pendientes |
| V-2 | Conteo de registros | `SELECT COUNT(*) FROM clientes` etc. | 33 / 67 / 278 / 124 / 626 / 7 / 23 |
| V-3 | FKs válidas | `SELECT COUNT(*) FROM proyectos WHERE cliente_id NOT IN (SELECT id FROM clientes)` | 0 |
| V-4 | Estados enums | `SELECT DISTINCT estado FROM proyectos` | Valores en `estado_proyecto` enum |
| V-5 | Preview Vercel con datos reales | URL generada por Vercel | Datos reales visibles, sin errores 500 |
| V-5b | Reactividad sin recarga (§3.1d) | Crear/editar en pestaña A (o usuario A); observar pestaña B (o usuario B) sin recargar | Cambio visible en B en ≤4s, sin acción manual |

---

## 6. Criterios de Aceptación
| # | Criterio | Verificación |
|---|----------|--------------|
| CA-0 | Schema V3 construido y testeado SIN datos legacy | Fase 0: tsc/eslint/build 0 errores; app corre con DATA_IMPL=drizzle sobre schema vacío |
| CA-1 | Mapeo de campos (LIVE) aprobado por Supervisor | `mapeo_campos.md` (LIVE PRODUCTION MAPPING) revisado |
| CA-2 | Schema V3 sin drift | `npm run db:generate` (sin cambios) |
| CA-3 | Datos maestros + transaccionales migrados | V-2 (conteo) + V-3 (FKs) |
| CA-4 | Estados recalculados con enums nuevos | V-4 |
| CA-5 | Preview Vercel con datos reales | V-5 |
| CA-6 | Scripts idempotentes | Re-ejecución sin duplicados |
| CA-7 | Backup antes del clone | snapshot `v3-preview` + dump read-only de `main` (Fase 2) |
| CA-8 | 🔴 Validación de VALORES reales contra schema | §3.1c: dry-run 5–10 reg/namespace sin discrepancias críticas |
| CA-9 | ✅ Arquitectura de persistencia + reactividad decidida | §3.1b/§3.1d: Server Actions + hidratación SSR + polling corto, documentada 2026-08-13 |
| CA-10 | Reactividad multi-usuario sin recarga | V-5b: escritura en pestaña A visible en pestaña B en ≤4s sin acción del usuario (§3.1d) |

---

## 7. Riesgos y Mitigaciones
| Riesgo | Mitigación |
|--------|------------|
| Drift de schema | `drizzle-kit generate` post-Fase 0 |
| Datos inconsistentes | Validaciones post-migración (V-2 a V-4) + dry-run de valores (§3.1c) |
| Pérdida de datos en `main` | Nunca se escribe en `main`; clone read-only |
| Prompt interactivo de `drizzle-kit generate` | Migraciones frescas en `drizzle/v3/` (sin migración previa) |
| Mezclar construcción + migración | **Orden corregido**: schema estable y probado (Fase 0) ANTES del clone (Fase 2) |
| Escritura perdida en serverless | ✅ Resuelto: Server Actions confirman en Neon antes de retornar (§3.1d) — sin fire-and-forget |
| Usuario ve datos desactualizados de otro usuario | ✅ Resuelto: polling corto (2-4s) + verificación liviana antes de traer snapshot completo (§3.1d) |
| 🔴 Valores legacy no caben en columnas V3 | Dry-run §3.1c antes de Fase 2 |
| 🔴 Corte duro sin rollback | Plan de rollback + posible paralelo old+new (§3.5) |
| 🔴 Proyecto Neon equivocado en Vercel | Aclarar east-1 vs sa-east-1 antes de Fase 1 (§3.5) |

---

## Bloqueos y Checkpoints (acciones que requieren decisión del Supervisor)
| # | Bloqueo | Fase afectada | Decisión requerida |
|---|---------|---------------|--------------------|
| B-1 | ✅ RESUELTO (2026-08-13): persistencia de escrituras + reactividad total | Fase 0 (t-119, t-130, t-131) | Server Actions + hidratación SSR + polling corto (§3.1b/§3.1d) |
| B-2 | 🔴 Validación de valores reales contra schema | Antes Fase 2 | Aprobar dry-run sin discrepancias críticas |
| B-3 | ✅ RESUELTO (2026-08-13): único proyecto Neon válido = `veta_dorada_db` | Fase 1 | `empresa_muebles_database` (sa-east-1) era un proyecto equivocado, purgado. Branches `dev-local`/`v3-preview` creadas en `veta_dorada_db`. Pendiente menor: confirmar qué host tiene hoy el `DATABASE_URL` de Vercel (no bloqueante para Fase 0). |
| B-4 | 🔴 Plan de rollback / corte | Fase 1–2 | Aprobar rollback y (opcional) paralelo old+new |
| B-5 | Mapeo LIVE aprobado | Fase 2 | Checkpoint CA-1 del Supervisor |

---

## 8. Tareas Registradas en Ledger
| ID | Descripción | Tipo | Riesgo | Fase |
|----|-------------|------|--------|------|
| t-125 | F10-D: Regenerar mapeo desde producción LIVE | `analisis` | alto | Diagnóstico (✅) |
| t-126 | F10: Reordenar plan (build-first / clone-last) y documentar | `documentacion` | bajo | Plan (✅) |
| t-127 | ✅ F10: Decisión de persistencia de escrituras + reactividad total (RESUELTO 2026-08-13) | `checkpoint` | crítico | Fase 0 (B-1) |
| t-128 | 🔴 F10: Aclarar proyecto Neon de Vercel + plan de rollback | `checkpoint` | crítico | Fase 1 (B-3/B-4) |
| t-129 | F10: Validación de valores reales contra schema (dry-run) | `verificacion` | alto | Fase 0.5 (B-2) |
| t-119 | F10-E: Implementar createDrizzleStore() real (lecturas sobre snapshot inicial, sin escrituras directas — ver t-130) | `codigo` | crítico | Fase 0 |
| t-130 | F10-F: Capa de Server Actions para las ~96 escrituras del contrato (`lib/data/actions/*.ts`) | `codigo` | crítico | Fase 0 |
| t-131 | F10-G: Provider de hidratación SSR + polling corto (2-4s) para reactividad multi-usuario (M-07 extendido) — mecanismo de reactividad **superado** por t-132, ver `m07b_reactividad_multiusuario.md` | `codigo` | crítico | Fase 0 |
| t-132 | F10-H: Revisión de reactividad multi-usuario — long-polling + `LISTEN`/`NOTIFY` reemplaza el polling corto fijo (decisión en `m07b_reactividad_multiusuario.md`; código pendiente) | `checkpoint`/`codigo` | crítico | Fase 0 |
| t-115 | F10: Migración de datos maestros | `mutacion_datos` | crítico | Fase 2 |
| t-116 | F10: Migración de datos transaccionales | `mutacion_datos` | crítico | Fase 2 |
| t-117 | F10: Verificación post-migración | `verificacion` | alto | Fase 3 |
| t-118 | F10: Preview Vercel y aprobación del Supervisor | `checkpoint` | crítico | Fase 1/3 |

---

## 9. Próximos Pasos (ORDEN CORREGIDO + bloqueos)
1. **Fase 0 (Construir schema V3 + tests, t-119/t-130/t-131):** afinar `schema.ts`, generar migraciones `drizzle/v3/`, migrar a `v3-preview`. Implementar en paralelo: `createDrizzleStore()` para lecturas + hidratación inicial (t-119), la capa de Server Actions para las ~96 escrituras (t-130), y el Provider de polling corto (t-131). **✅ B-1 (t-127) resuelto 2026-08-13 — arquitectura en §3.1b/§3.1d, ya no bloquea.**
2. **Fase 0.5 (Validación de valores, t-129):** dry-run de 5–10 reg/namespace. **🔴 B-2: aprobar sin discrepancias antes de Fase 2.**
3. **Fase 1 (Preview Vercel vacío):** 🔴 **B-3/B-4 (t-128): confirmar proyecto Neon de Vercel y aprobar plan de rollback ANTES de desplegar.** Push `dev` → preview; `DATABASE_URL=v3-preview`, `DATA_IMPL=drizzle`; validar infraestructura.
4. **Fase 2 (Clone legacy, t-115/116):** backup CA-7; `scripts/migrate-core.ts` lee `main` (read-only) y escribe `v3-preview` campo-a-campo usando `mapeo_campos.md` LIVE. Requiere B-2 y B-5 resueltos.
5. **Fase 3 (Verificación, t-117):** conteos + persistencia de escritura en preview.
6. **Corte (t-118):** si Javier aprueba, merge `dev` → `main` (checkpoint final).

---

## 10. Verificación de Integridad (Pre-Entrega)
- [x] `mapeo_campos.md` incluye LIVE PRODUCTION MAPPING (conteos reales + campos).
- [x] Scripts de migración idempotentes.
- [x] Validaciones post-migración cubren conteo, FKs y tipos.
- [x] Backup antes del clone (CA-7).
- [x] Preview Vercel como paso obligatorio antes del merge.
- [x] Orden corregido: construir/testear schema ANTES del clone.
- [x] Deuda técnica (validación de valores, rollback, proyecto Neon) documentada y marcada como BLOQUEANTE.
- [x] ✅ B-1 resuelto (2026-08-13): arquitectura de persistencia + reactividad total (Server Actions + hidratación SSR + polling corto, §3.1b/§3.1d), sobre cifras corregidas (305/43 lecturas, 96/25 escrituras) y la restricción cliente/servidor (`'use client'` + `postgres.js` no corre en navegador).
