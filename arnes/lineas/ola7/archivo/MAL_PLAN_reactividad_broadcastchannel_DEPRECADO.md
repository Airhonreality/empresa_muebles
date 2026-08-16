# ⛔ MAL PLAN — Reactividad por Eventos (BroadcastChannel) — DEPRECADO

> **NO USAR. Este documento se conserva solo como registro histórico de una propuesta rechazada.**
> La decisión vigente está en [`m07b_reactividad_multiusuario.md`](../tecnico/m07b_reactividad_multiusuario.md).

**Fecha de deprecación:** 2026-08-14 · **Deprecado por:** Supervisor (sesión de auditoría del 2026-08-14) · **Estado:** rechazado, no implementar

---

## Por qué este plan está mal (resumen ejecutivo)

Este documento llegó como recomendación externa para resolver un problema real: el polling corto (2-4s) implementado en `t-131` puede agotar la cuota de 100.000 invocaciones/mes de Vercel Hobby con solo ~5 usuarios de equipo trabajando un día completo. El diagnóstico del problema era correcto. **La solución propuesta acá no lo es**, por un error de arquitectura de fondo:

1. **`BroadcastChannel` no cruza máquinas.** Es una API que solo comunica pestañas del mismo navegador/origen. El requisito que este plan dice resolver — que el empleado A vea en su computadora los cambios que hizo el empleado B en la suya — es exactamente el caso que `BroadcastChannel` **no puede cubrir**. Presentarlo como "reactividad por eventos" que reemplaza el polling es un error de categoría: resuelve un problema secundario (sincronizar las pestañas propias de un mismo usuario) y lo hace pasar por la solución del problema principal (sincronizar usuarios distintos).

2. **Degrada silenciosamente el requisito no negociable del Supervisor.** `t-127` (2026-08-13) fijó como requisito crítico, ya verificado en `t-131`: un cambio de un empleado debe verse en la pantalla de otro en **≤4 segundos, sin recargar, sin pasos manuales** (`CA-10`, `V-5b`). Si `BroadcastChannel` no sirve para el caso cross-usuario, lo único que queda cargando ese requisito en este plan es "revalidar al hacer foco de ventana + polling pasivo de 30s". Un empleado que trabaja toda la jornada en una sola pestaña (el caso normal en captura de datos) nunca dispara el evento de foco — su única vía de enterarse pasa a ser el poll de 30s. Eso es una regresión de 8x sobre un criterio de aceptación ya firmado, presentada como si fuera una mejora de eficiencia.

3. **Reabre una decisión de arquitectura crítica ya cerrada sin pasar por el checkpoint que `AGENTS.md` exige.** Este archivo no está registrado como tarea en `arnes/tareas/`, no referencia `t-127`/`t-131`, y contradice sin decirlo una decisión que el Supervisor ya aprobó explícitamente.

## Qué reemplaza a este plan

[`arnes/lineas/ola7/tecnico/m07b_reactividad_multiusuario.md`](../tecnico/m07b_reactividad_multiusuario.md) — decide long-polling acotado por función + `LISTEN`/`NOTIFY` de Postgres (evento real, sin infraestructura nueva) como motor de detección cross-usuario, con `BroadcastChannel` reubicado en el rol donde sí aporta (fan-out entre pestañas propias de un mismo usuario, no como mecanismo cross-usuario) y pausa por inactividad real para no gastar nada cuando no hay nadie mirando la pantalla.

Lo único de este plan que sí sobrevive, en el lugar correcto: la idea de `BroadcastChannel` para sincronizar pestañas hermanas, y la idea de pausar el mecanismo cuando no hace falta (aunque no "polling pasivo de 30s ciego" sino apagado real por inactividad).

---

## Contenido original (preservado tal cual, sin editar, para trazabilidad)

# Plan de Implementación F10: Migración a Neon Postgres, Server Actions y Reactividad por Eventos

Este documento detalla el plan maestro para la reconstrucción e integración de la capa de persistencia real del ERP + Sitio Web (V3 "Veta Dorada Real"), migrando del `mock-store` en memoria a **Neon Postgres con Drizzle ORM**, incorporando una **capa de Server Actions seguras** y un sistema de **Reactividad por Eventos (`BroadcastChannel` + `Revalidate-on-Focus`)**.

---

## User Review Required

> [!IMPORTANT]
> **Ajuste Arquitectónico de Reactividad (Decisión de Eficiencia):**
> Se sustituye la propuesta inicial de "Polling corto ciego a 3 segundos" por un sistema de **Reactividad por Eventos (Push/Broadcast) + Revalidación al Foco (`focus`) + Polling pasivo largo (30s)**.
> - **Razonamiento:** Evita agotar la cuota de **100,000 invocaciones/mes de Vercel Free** y permite que el motor de Neon Postgres entre en suspensión automática cuando no haya actividad de usuario.

> [!WARNING]
> **Impacto en Firma Asíncrona (96 Escrituras):**
> Al migrar la interfaz `DataStore` de funciones síncronas a asíncronas (`Promise<T | null>`), aproximadamente **25 archivos de UI en `app/`** deben ser adaptados para usar `await` sobre las Server Actions. TypeScript (`npx tsc --noEmit`) garantizará que no quede ningún llamado síncrono sin actualizar.

---

## Glosario Técnico de Referencia

| Término | Definición Accesible | Ejemplo en el Proyecto |
| :--- | :--- | :--- |
| **Escritura / Mutación** | Acción de modificar la base de datos (insertar, editar, borrar o cambiar estado). | Crear una orden de compra o firmar un acta de entrega. |
| **`Promise<T \| null>` (Asincronía)** | Promesa de que un dato tardará un tiempo en ser devuelto desde el servidor/DB. | `await proyectos.crear(...)` espera a que Neon guarde el registro. |
| **Drizzle ORM** | Traductores de código TypeScript a consultas SQL puras para Postgres. | Define cómo se estructuran las 58 tablas en Neon (`lib/db/schema.ts`). |
| **Server Actions** | Funciones seguras de Next.js que se ejecutan exclusivamente en el servidor al hacer clic en la UI. | Un botón de "Aprobar Cotización" ejecuta una Server Action para mutar la DB. |
| **Hidratación SSR** | El servidor renderiza el HTML con los datos iniciales y React lo vuelve interactivo. | Cargar la página `/portafolio` instantáneamente desde el servidor. |
| **BroadcastChannel API** | Red interna del navegador que permite a pestañas hermanas avisarse cambios sin usar internet. | Pestaña A edita cotización $\rightarrow$ Pestaña B se actualiza en 0ms. |
| **Soft-Delete (`anulado=true`)** | Desactivación lógica de un registro sin borrarlo de la DB para preservar históricos. | Anular ítem de catálogo sin desarmar presupuestos históricos. |
| **Branch (`dev-local` / `v3-preview`)** | Copias de la base de datos Neon aisladas para pruebas de desarrollo y Vercel. | `dev-local` se usa localmente; `v3-preview` en las URLs de previsualización. |

---

## Matrices de Evaluación de Calidad (PROCESO vs RESULTADO)

### Matriz A: Evaluación del PROCESO de Desarrollo

| Criterio | Descripción & Regla | Indicador / Métrica de Éxito | Estado |
| :--- | :--- | :--- | :---: |
| **1. Diálogo e Iteración Previa** | No escribir código sin aprobación previa del Supervisor (`AGENTS.md`). | 0 commits prematuros; plan validado antes del comando `"IMPLEMENTAR"`. | Pendiente |
| **2. Aplicación de Diseño Axiomático** | Desacoplamiento estricto entre UI, Contratos (`contracts.ts`), ORM (`schema.ts`) y Server Actions. | Cero importaciones directas de `lib/db/` dentro de componentes de `app/`. | Pendiente |
| **3. Transparencia de Obstáculos** | Informar sobre dificultades y errores recurrentes para aprendizaje Dev. | Documentación explícita de breaking changes y fallos resueltos. | Pendiente |
| **4. Evidencia Mecánica** | Validación con herramientas estándar de verificación. | Paso limpio de `npx tsc --noEmit` y `npx eslint .` en cada hito. | Pendiente |
| **5. Ausencia de Parches Rápidos** | Soluciones duraderas y escalables sin "fixes de emergencia". | Cero `any` en TypeScript, cero fallbacks silenciosos sin tipado. | Pendiente |

### Matriz B: Evaluación del RESULTADO Técnico

| Criterio | Descripción & Regla | Meta Métrica / Evidencia | Estado |
| :--- | :--- | :--- | :---: |
| **1. Infraestructura Neon** | Conexión correcta a la rama `dev-local` y configuración de `v3-preview`. | Migraciones `drizzle/v3/` aplicadas exitosamente sobre Neon `dev-local`. | Pendiente |
| **2. Paridad Schema vs Contratos** | Alineación 1:1 entre las tablas de `schema.ts` y las interfaces de `contracts.ts`. | 58 tablas y sus columnas (clusters F3, F4, F5, F02, F03, F15) 100% mapeadas. | Pendiente |
| **3. Seguridad Asíncrona (96 Métodos)** | Transformación completa de los ~96 métodos de mutación a `Promise<T \| null>`. | 100% de los mutadores tipados como `Promise` en `contracts.ts` y `mock-store.ts`. | Pendiente |
| **4. Capa de Server Actions** | Creación de Server Actions puras (`lib/data/actions/*`) para escrituras en DB. | 0 escrituras directas desde componentes de React en cliente. | Pendiente |
| **5. Reactividad SSR + Broadcast** | Carga sin parpadeos y sincronización de estado entre pestañas. | Provider SSR implementado con `BroadcastChannel` + `Focus Listener`. | Pendiente |
| **6. Compilación de Aplicación** | Ausencia de breaking cambios en las ~25 pantallas de `app/`. | `npx next build` ejecutado exitosamente con conexión a `dev-local`. | Pendiente |

---

## Proposed Changes

El trabajo de implementación se desglosa en **4 Hitos Modulares secuenciales**:

### [Hito A] Infraestructura Neon y Alineación de Schema Drizzle

#### [MODIFY] [schema.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/db/schema.ts)
- Escribir las ~30 tablas faltantes (F3 cronogramas/gates, F4 compras, F5 taller/calidad/instalaciones/garantía, F-02 tienda, F-03 portafolio/testimonios, F-15 bitácora).
- Reconciliar columnas desalineadas (`visibleEnPropuestaPublica`, `verificadorId`, `comercialVendedorId`, `fechaEntradaDesarrollo`, etc.).

#### [NEW] [drizzle/v3/](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/drizzle/v3/)
- Generar carpeta de migraciones frescas con `npx drizzle-kit generate`.
- Aplicar migraciones sobre la rama `dev-local` de Neon (`npx drizzle-kit push` o `npx drizzle-kit migrate`).

---

### [Hito B] Firma Asíncrona de Contratos y Mock Store

#### [MODIFY] [contracts.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/contracts.ts)
- Transformar las firmas de los ~96 métodos mutadores de la interfaz `DataStore` para retornar `Promise<T | null>`.

#### [MODIFY] [mock-store.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/mock-store.ts)
- Envolver todas las respuestas de escritura en `Promise.resolve()` para mantener retrocompatibilidad síncrona/asíncrona en pruebas.

#### [MODIFY] [mock-store.test.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/mock-store.test.ts)
- Actualizar los tests unitarios manuales del mock store para soportar las llamadas asíncronas con `await`.

---

### [Hito C] Capa de Servidor, Adapter Drizzle y Reactividad por Eventos

#### [NEW] [drizzle-impl.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/drizzle-impl.ts)
- Implementar las consultas de lectura (`select`) e hidratación inicial desde Neon Postgres usando Drizzle ORM.

#### [NEW] [lib/data/actions/](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/actions/)
- Implementar la capa de Next.js Server Actions (`"use server"`) organizadas por dominios:
  - `proyectos.actions.ts`
  - `compras.actions.ts`
  - `produccion.actions.ts`
  - `tienda.actions.ts`
  - `portafolio.actions.ts`, etc.

#### [MODIFY] [lib/data/index.ts](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/lib/data/index.ts)
- Implementar en `useDataStore()` la capa de reactividad basada en eventos:
  - Emisión de mensajes en `BroadcastChannel('veta_erp')` tras cada mutación.
  - Revalidación por foco de ventana (`window.addEventListener('focus')`).
  - Polling pasivo con temporizador largo (30s) congelable vía `document.hidden`.

---

### [Hito D] Adaptación de UI y Verificación de Compilación

#### [MODIFY] [app/](file:///c:/Users/javir/Documents/DEVs/empresa_muebles_clone_v3/app/)
- Actualizar las ~25 pantallas y formularios que ejecutan mutaciones para invocar `await` sobre las Server Actions o métodos asíncronos de `dataStore`.

---

## Verification Plan

### Automated Tests & Type Checks
1. **Comprobación de Tipos TypeScript:**
   ```powershell
   npx tsc --noEmit
   ```
   *Criterio:* 0 errores en todo el árbol de TypeScript.

2. **Auditoría de Linter:**
   ```powershell
   npx eslint .
   ```
   *Criterio:* 0 advertencias o errores de ESLint.

3. **Pruebas Unitarias de Módulos de Datos:**
   ```powershell
   DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder' npx tsx lib/data/mock-store.test.ts
   ```
   *Criterio:* Todos los tests del mock store pasando correctamente.

4. **Compilación Completa de Producción:**
   ```powershell
   npm run build
   ```
   *Criterio:* Prerenderizado y compilación exitosa de Next.js conectando a la DB `dev-local`.

### Manual Verification
- **Prueba de Pestañas Hermanas (BroadcastChannel):** Abrir dos pestañas en el mismo navegador (`/erp/comercial` y `/erp/taller`). Realizar un cambio en la Pestaña A y verificar que la Pestaña B se actualice instantáneamente en pantalla sin recargar.
- **Prueba de Suspensión de Polling:** Minimizar el navegador y verificar en las DevTools de red que no hay peticiones HTTP disparándose cada 3 segundos.
