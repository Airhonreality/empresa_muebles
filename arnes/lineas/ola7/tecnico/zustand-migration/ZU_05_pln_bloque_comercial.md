# ZU_05: Plan de Arquitectura y Migración — Bloque Comercial (Kanban P-01 + P-02)

**Fecha:** 2026-09-03  
**Estado:** PROPUESTA DE ARQUITECTURA (Preparado para ejecución tras la Fase 2 del Cotizador)  
**Línea de trabajo:** `arnes/lineas/ola7/tecnico/zustand-migration/`  
**Rol responsable:** Orquestador / Iniciador  
**Dependencias:** ZN-001 (Fase 0), ZN-002 (Fase 1 mergeada en `dev`), ZN-003 (Fase 2 Cotizador)  
**Alcance:**  
1. `app/erp/comercial/page.tsx` (P-01 Kanban Comercial)  
2. `app/erp/cotizador/page.tsx` (Lista de Cotizaciones en Pipeline)  
3. `app/erp/cotizador/new/page.tsx` (P-02 Nueva Cotización / Alta Rápida)  

---

## 1. Justificación y Análisis de Escala (100 Vendedores en Tablero)

El Kanban Comercial es la pantalla de mayor concurrencia operativa del ERP junto con el Cotizador. Si 10 a 50 comerciales mueven tarjetas o cargan cotizaciones en simultáneo:

### El Diagnóstico en el Código Real (`app/erp/comercial/page.tsx`)
1. **Cuello de botella O(P × E × I) en cada render:**  
   En las líneas 376–386, `projectStats` calcula el conteo de ítems y espacios activos iterando en cada cambio de `version`:
   ```typescript
   proyectos.forEach((p) => {
     const esp = espaciosTodos.porProyecto(p.id);
     const itCnt = esp.reduce((sum, e) => sum + itemsTodos.porVariante(e.id).length, 0);
     // ...
   });
   ```
   Con 50 proyectos, 150 espacios y 800 ítems, este cálculo ejecuta miles de iteraciones en el hilo de render del navegador cada vez que ocurre un `notify()` en cualquier parte del ERP.
2. **Re-render masivo de las 9 columnas:**  
   Al arrastrar o mover una tarjeta de "Lead" (`activa`) a "Propuesta" (`enviada`), se actualiza `store.getVersion()`. Como la pantalla entera escucha ese único version-string, **todas las 9 columnas y todas las tarjetas del tablero se re-renderizan**.
3. **`ProjectCard` sin `React.memo`:**  
   Las tarjetas se recalculan completas, recalculando fechas, días en estado y validaciones de transiciones en cada tick.
4. **Transición bloqueante (sin optimismo):**  
   `handleTransition` hace un `await store.proyectos.actualizarEstado(...)` que congela la tarjeta hasta que el round-trip de red confirma con Postgres.

---

## 2. Decisiones de Diseño y Contraste con el Arnés

| Elemento | Decisión canónica del Arnés (`disenio_p01_kanban_comercial.md`) | Implementación real verificada | Decisión para `useComercialStore` |
|---|---|---|---|
| **Columnas** | 8 columnas legacy agrupando `perdida+cancelada` en "Archivo" + estado `retoma` (POC-13). | 9 columnas en `COLUMNAS_KANBAN` (incluye `retoma` y `entregado` separadas). | Se preservan exactamente las 9 columnas actuales sin alterar contratos de UI. |
| **Transiciones** | Matriz configurable en `parametros.transiciones_proyecto` con bidireccionalidad. | Implementada en `ACCIONES_POR_ESTADO` + `CANONICO_AVANZAR` / `CANONICO_RETORNAR`. | El store Zustand cachea la matriz de transiciones y valida localmente antes de disparar la acción. |
| **Buscador** | Resiliente con `useSmartSearch`, contexto `comercial-kanban`, búsqueda fuzzy. | Presente en líneas 355–367. | Se mantiene idéntico; se conecta al selector de proyectos filtrados. |
| **Propuesta Pública (F-08)** | "Propuesta que ve el cliente". | `app/(publico)/propuesta/[proyectoId]/page.tsx` **ya es Server Component** vía `obtenerPropuestaPublicaAction`. | **Excluida del store Zustand:** no usa `useDataStore()`, ya está optimizada y aislada en SSR. |

---

## 3. Arquitectura del `useComercialStore`

### 3.1. Estado Canónico (`lib/data/stores/comercial/types.ts`)
```typescript
export interface ComercialState {
  proyectos: Proyecto[];
  clientes: Cliente[];
  transiciones: TransicionesProyecto;
  // Stats pre-computadas en la hidratación, NO en el render
  projectStats: Record<string, { items: number; espacios: number; espaciosActivos: number }>;
  filtros: {
    query: string;
    tipoProyecto: string;
  };
  version: number;
}

export interface ComercialActions {
  hidratar: (parcial: Partial<ComercialState>) => void;
  setFiltros: (filtros: Partial<ComercialState['filtros']>) => void;
  
  // Mutación optimista de tarjeta
  moverProyectoOptimistic: (
    proyectoId: string,
    nuevoEstado: EstadoProyecto,
    persistir: () => Promise<Proyecto | null>
  ) => Promise<boolean>;
  
  crearProyectoOptimistic: (
    nuevo: Proyecto,
    persistir: () => Promise<Proyecto>
  ) => Promise<Proyecto>;
}
```

### 3.2. Selectores Granulares (`lib/data/stores/comercial/selectors.ts`)
Para romper el re-render global:
1. **`useSelectProyectosColumna(columnaKey: string)`:**  
   Retorna **únicamente los proyectos que pertenecen a esa columna específica**, aplicando filtros de búsqueda.  
   *Efecto de escala:* Si un proyecto pasa de `activa` a `enviada`, **solo las columnas "Activa" y "Enviada" re-renderizan**. Las otras 7 columnas permanecen inertes.
2. **`useSelectCliente(clienteId: string | null)`:**  
   Retorna el cliente memoizado desde el Map interno.
3. **`useSelectStats(proyectoId: string)`:**  
   Retorna `{ items, espacios, espaciosActivos }` directamente por O(1) desde el diccionario precomputado.
4. **`useSelectTotalProyectos()`:**  
   Retorna el conteo total para la cabecera sin iterar colecciones completas.

---

## 4. El Puente de Sincronización (`ComercialSincronizador.tsx`)

Mismo patrón exitoso de la Fase 1 del Cotizador:
1. Se monta en `app/erp/comercial/layout.tsx` (o en la raíz del módulo comercial).
2. Se suscribe a `store.subscribe()` del `DataStore` (preservando el long-polling y `BroadcastChannel` de M-07b).
3. En cada notificación:
   - Extrae `proyectos = store.proyectos.listar()`.
   - Extrae `clientes = store.clientes.listar()`.
   - Pre-computa el diccionario `projectStats` en una sola pasada limpia.
   - Invoca `useComercialStore.getState().hidratar({ proyectos, clientes, projectStats, transiciones })`.

---

## 5. Refactorización de Componentes UI

### A) `ProjectCard` Memoizada
```typescript
export const ProjectCard = React.memo(ProjectCardComponent, (prev, next) => {
  return (
    prev.proyecto.id === next.proyecto.id &&
    prev.proyecto.estado === next.proyecto.estado &&
    prev.proyecto.updatedAt === next.proyecto.updatedAt &&
    prev.cliente?.nombre === next.cliente?.nombre &&
    prev.totalItems === next.totalItems &&
    prev.espaciosActivos === next.espaciosActivos &&
    prev.columnEditable === next.columnEditable
  );
});
```

### B) `KanbanColumna` como Componente Aislado
Actualmente las columnas se pintan en un `.map()` dentro de la página principal. Se extrae a un componente `KanbanColumna` que consume `useSelectProyectosColumna(col.key)`. Así, cada columna se suscribe a su propia rebanada de datos.

### C) Optimismo en `handleTransition`
```typescript
const handleTransition = async (proyectoId: string, nuevoEstado: EstadoProyecto) => {
  await store.moverProyectoOptimistic(
    proyectoId,
    nuevoEstado,
    async () => await dataStore.proyectos.actualizarEstado(proyectoId, nuevoEstado)
  );
};
```
La tarjeta salta inmediatamente a la columna destino. Si la red falla, vuelve a su columna de origen y emite un toast de error.

---

## 6. Plan de Implementación Paso a Paso (Fase ZN-004)

1. **Paso 1 (Estructura y Types):**  
   Crear `lib/data/stores/comercial/types.ts` y `useComercialStore.ts`.
2. **Paso 2 (Hidratador y Puente):**  
   Crear `hidratadorComercial.ts` con precomputación de stats y `ComercialSincronizador.tsx`.
3. **Paso 3 (Selectores y Tests):**  
   Escribir `selectors.ts` y suite unitaria en `useComercialStore.test.ts` verificando filtrado por columna, optimismo y rollback.
4. **Paso 4 (Conexión UI):**  
   - Montar `ComercialSincronizador` en layout comercial.
   - Migrar `app/erp/comercial/page.tsx` a los selectores granulares.
   - Migrar `app/erp/cotizador/page.tsx` para leer proyectos desde `useComercialStore`.
5. **Paso 5 (QA Mecánico y Runtime):**  
   `npx tsc --noEmit` exit 0, tests OK, verificación en navegador arrastrando/transicionando tarjetas.
