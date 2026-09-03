# Plan ZN-003: Fase 2 Zustand — Acciones Optimistas, Revert en Error, P3/P4 y Memoización (P6/P7)

**ID de tarea:** ZN-003  
**Zona:** `lib/data/stores/`, `lib/data/actions/`, `lib/data/contracts.ts`, `lib/data/drizzle-impl.ts`, `lib/data/mock-store.ts`, `app/erp/cotizador/[proyectoId]/page.tsx`  
**Tipo:** Arquitectura de datos (Mutaciones atómicas reactivas + Ergonomía de estado + Optimización de renders)  
**Riesgo:** Medio-Alto (agrega mutaciones directas y optimismo al flujo comercial)  
**Depende de:** ZN-002 (Fase 1 cerrada en commits `5a26843` / `cd56d18`, merge a `dev` pendiente de este ciclo)  
**Estado:** Propuesta formal para ejecución del Agente Código  

---

## 0. PREREQUISITO HARD: Server Action `eliminarEspacioAction` (NO existente)

**El contrato `DataStore` en `contracts.ts:955-969` NO tiene `espacios.eliminar`.** Tampoco existe `core.eliminarEspacioAction` en `lib/data/actions/core.ts`, ni su implementación en `drizzle-impl.ts` ni `mock-store.ts`. **P3 (`eliminarVariante`) está bloqueado sin esto.**

### Archivos a crear/modificar (en orden):

1. **`lib/data/actions/core.ts`** — crear:
   ```typescript
   export async function eliminarEspacioAction(id: string): Promise<boolean> {
     return db.transaction(async (tx) => {
       await tx.delete(s.espaciosArtefactos).where(eq(s.espaciosArtefactos.espacioVarianteId, id));
       await tx.delete(s.itemsVariante).where(eq(s.itemsVariante.varianteId, id));
       const [eliminado] = await tx.delete(s.espacioVariantes).where(eq(s.espacioVariantes.id, id)).returning();
       return Boolean(eliminado);
     });
   }
   ```
2. **`lib/data/contracts.ts:969`** — agregar al bloque `espacios`:
   ```typescript
   eliminar(id: string): Promise<boolean>
   ```
3. **`lib/data/drizzle-impl.ts`** — agregar bloque `eliminar` en `espacios`:
   ```typescript
   eliminar: async (id) => {
     const ok = await core.eliminarEspacioAction(id);
     if (ok) {
       data = {
         ...data,
         espacios: data.espacios.filter((e) => e.id !== id),
         items: data.items.filter((i) => i.varianteId !== id),
       };
       notify();
     }
     return ok;
   },
   ```
4. **`lib/data/mock-store.ts`** — agregar bloque `eliminar` en `espacios`:
   ```typescript
   eliminar: async (id) => {
     const idx = espacios.findIndex((e) => e.id === id);
     if (idx === -1) return false;
     espacios.splice(idx, 1);
     items.splice(0, items.length, ...items.filter((i) => i.varianteId !== id));
     return true;
   },
   ```
5. **Verificar** que `mock-store.test.ts` cubre el nuevo método (agregar test de round-trip: crear espacio → eliminar → porProyecto no lo incluye).

**Criterio de desbloqueo:** `npx tsc --noEmit` exit 0 + test de mock-store pasa + test nuevo de eliminar espacio pasa. **Sin esto, NO se toca P3.**

---

## 1. Objetivo

Completar la **Fase 2 de la arquitectura Zustand** en el cotizador (`[proyectoId]/page.tsx`) resolviendo los 5 requerimientos clave del roadmap `ZU_03`:
1. **Acciones Optimistas con Revert Real:** Feedback instantáneo en UI (< 16ms) al añadir o mutar ítems, llamando la Server Action en background con rollback automático si la red o el servidor fallan.
2. **P3 (`eliminarVariante`):** Acción concreta en el store y Server Action para eliminar una variante y sus ítems en cascada.
3. **P4 (`renombrarVariante`):** Acción concreta en el store para cambiar el nombre de una variante accesible directamente desde las tabs.
4. **P6 (`productMap` memoizado):** Evitar la reconstrucción de `new Map()` de catálogo en cada render de la página.
5. **P7 (`React.memo`):** Envolver `EspacioGroup` y `VarianteContenido` en `React.memo` para que modificar un espacio NO re-renderice los demás espacios de la cotización.

---

## 2. Especificación Técnica por Componente

### 2.1. Store Zustand (`lib/data/stores/`)

#### En `lib/data/stores/types.ts`:
Extender la interfaz `CotizadorActions` (o el estado de acciones) con las firmas tipadas sin `any`:
```typescript
export interface CotizadorActions {
  hidratar: (parcial: Partial<CotizadorState>) => void;
  avisarCambio: () => void;
  resetear: () => void;
  
  // Acciones Fase 2
  crearItemOptimistic: (
    itemData: Omit<ItemVariante, 'id' | 'createdAt' | 'updatedAt'>,
    persistir: () => Promise<ItemVariante>
  ) => Promise<ItemVariante>;
  
  actualizarItemOptimistic: (
    id: string,
    cambios: Partial<ItemVariante>,
    persistir: () => Promise<ItemVariante | null>
  ) => Promise<boolean>;
  
  eliminarVariante: (
    id: string,
    persistir: () => Promise<boolean>
  ) => Promise<boolean>;
  
  renombrarVariante: (
    id: string,
    nuevoNombre: string,
    persistir: () => Promise<EspacioVariante | null>
  ) => Promise<boolean>;
}
```

#### En `lib/data/stores/useCotizadorStore.ts`:
Implementar la mecánica de snapshot y rollback:
1. **`crearItemOptimistic`:**
   - Genera ID temporal prefijado (ej. `temp-${Date.now()}`).
   - Guarda snapshot de `items`.
   - Inserta el ítem en `state.items` e incrementa `version`.
   - Ejecuta `await persistir()`.
   - Al resolver: reemplaza el ítem temporal por el confirmado del servidor.
   - En `catch`: restaura el snapshot previo de `items`, incrementa `version` y relanza el error para que la UI notifique al usuario.
2. **`eliminarVariante`:**
   - Guarda snapshot de `espacios` e `items`.
   - Filtra localmente el espacio con `id` y los items pertenecientes a esa variante.
   - Ejecuta `await persistir()`.
   - En `catch`: restaura snapshots y notifica.
3. **`renombrarVariante`:**
   - Muta localmente `nombreVariante` en el espacio correspondiente.
   - Ejecuta `await persistir()` — que internamente llama `store.espacios.actualizar(id, { nombreVariante: nuevoNombre })` (el contrato `espacios.actualizar` en `contracts.ts:959` ya soporta `nombreVariante` en su `Pick`, **no requiere Server Action nueva**).
   - En `catch`: restaura snapshot.

---

### 2.2. Capa de Servidor (`lib/data/actions/core.ts`)

**Ya creado en el prerequisito §0:** `eliminarEspacioAction(id)` con transacción (artefactos → items → espacio). No hay que crear nada nuevo aquí — solo verificar que el método existe y está expuesto en `drizzle-impl.ts` y `mock-store.ts` antes de proceder a P3.

---

### 2.3. Cotizador UI (`app/erp/cotizador/[proyectoId]/page.tsx`)

1. **P6 (`productMap` memoizado):**
   ```typescript
   const productMap = useMemo(() => {
     return new Map(catalogo.map((p) => [p.id, p]));
   }, [catalogo]);
   ```
2. **P7 (`React.memo`):**
   - Envolver `EspacioGroup` con `React.memo(EspacioGroupComponent)`.
   - Envolver `VarianteContenido` con `React.memo(VarianteContenidoComponent)`.
   - Asegurar que `onToggle`, `onUpdateJornadas`, etc., utilicen `useCallback` estables para que `memo` no se invalide en cada render.
3. **P3 (`eliminarVariante` en tabs):**
   - En la lista de tabs de `EspacioGroup`, si `variantes.length > 1`, agregar botón sutil de eliminar `×` en las tabs inactivas.
   - Conectar a `store.eliminarVariante(v.id)`.
4. **P4 (Rename inline en tabs):**
   - Permitir activar modo edición de nombre en la pestaña seleccionada con un ícono de lápiz o doble clic, guardando con `store.renombrarVariante(v.id, nuevoNombre)` al presionar `Enter`.

---

## 3. Pruebas Unitarias (`lib/data/stores/useCotizadorStore.test.ts`)

Añadir bloques de prueba para cada nueva capacidad:
1. `test: crearItemOptimistic agrega de inmediato y confirma con el valor del servidor`
2. `test: crearItemOptimistic revierte el estado si la promesa de persistencia es rechazada`
3. `test: eliminarVariante remueve el espacio del store Zustand`
4. `test: renombrarVariante actualiza el nombre en el store Zustand`

---

## 4. Criterios de Aceptación (Verificación Mecánica Obligatoria)

### Pre-P3 (prerequisito §0):
- [ ] `eliminarEspacioAction` existe en `core.ts` y usa transacción (artefactos → items → espacio).
- [ ] `espacios.eliminar` existe en `contracts.ts`, `drizzle-impl.ts` y `mock-store.ts`.
- [ ] Test nuevo en `mock-store.test.ts`: crear espacio → eliminar → `porProyecto` no lo incluye.
- [ ] `npx tsc --noEmit` exit 0 tras agregar el prerequisito.

### Post-implementación completa:
- [ ] `npx tsc --noEmit` exit 0 (cero errores de compilación).
- [ ] `useCotizadorStore.test.ts` ejecutado con éxito:  
      `$env:DATABASE_URL='postgres://test:test@localhost:5432/no_connect_placeholder'; npx tsx lib/data/stores/useCotizadorStore.test.ts`
- [ ] `npx eslint lib/data/stores/` exit 0 (sin warnings ni errores).
- [ ] Cero uso de `any` en los nuevos tipos.
- [ ] Verificación runtime en navegador:
  - Crear un ítem responde instantáneamente en UI sin bloqueo de red.
  - Eliminar una variante inactiva remueve la pestaña y limpia sus subtotales.
  - Renombrar una pestaña de variante actualiza el tab con `Enter`.
  - Los espacios ajenos al que se está editando no sufren re-render (confirmable en React DevTools o Profiler).
