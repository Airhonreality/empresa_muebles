# Plan F10 — Prototipo con mocks controlados (antes de migraciones)

**Fecha:** 2026-08-08 · **Estado:** aprobado (checkpoint Supervisor) · **Fase:** F10 · **Riesgo:** alto

**Rol:** Orquestador (plan) + Código (ejecución por bloques). **Decisión del Supervisor (2026-08-08):** invertir el orden — prototipo real con mocks ANTES de migraciones.

---

## 0. Principio rector

Las pantallas de negocio se levantan con datos reales del negocio sobre un **subsistema de mocks controlado** (`lib/data/`), sin tocar la base de datos ni ejecutar migraciones. Javier usa las pantallas de primera mano; de ahí salen **hallazgos** que pueden mutar diseños, gates, schema o lógica de negocio. Solo al final, con el paquete congelado de pantallas + schema, se ejecutan las migraciones reales y se cambia al adaptador Drizzle.

**Por qué invertir:** el prototipo ES la validación del diseño. Cambios de schema son esperados y deseados — es más barato descubrirlos contra mocks que contra migraciones ya aplicadas.

---

## 1. Arquitectura del subsistema de mocks

```
lib/data/
├── contracts.ts        ← Tipos de datos que consumen las pantallas (derivados de REGISTRO DE ENTIDADES)
├── mock-store.ts       ← Repositorio en memoria con factories de fixtures
├── drizzle-impl.ts     ← (Stub — no implementado aún) Adaptador Drizzle real
├── index.ts            ← getDataStore(): elige impl por DATA_IMPL=mock|drizzle (env)
└── fixtures/
    ├── clientes.ts     ← Datos reales del negocio (casos canónicos de la destilación)
    ├── productos.ts    ← Catálogo de productos (tablero roble, bisagra, etc.)
    ├── proyectos.ts    ← Proyecto canónico con espacios/variantes/items
    ├── parametros.ts   ← Parámetros A-01 + A-02 con valores v1
    └── usuarios.ts     ← Usuarios demo (admin, comercial)
```

### 1.1 Contratos (`contracts.ts`)

Tipos TypeScript que las pantallas consumen, derivados del `REGISTRO_DE_ENTIDADES.md` y de la §1 de cada `disenio_PXX.md`:

```typescript
interface Proyecto {
  id: string; nombreProyecto: string; estado: string; tipoProyecto: string;
  direccionObra: string | null; costosOperativos: string;
  imprevistosInstalacion: string; descuentoComercial: string;
  ajusteArbitrario: string; aplicaIva: boolean; porcentajeIva: string;
  garantiaAnios: number; diasEntregaEstimados: number | null;
  descripcionSemantica: string | null;
  clienteId: string | null; comercialId: string | null;
  createdAt: string; updatedAt: string;
}

interface Cliente { id: string; nombre: string; documento: string | null; telefono: string | null; email: string | null; }

interface EspacioVariante {
  id: string; proyectoId: string; nombreEspacio: string; nombreVariante: string;
  descripcion: string | null; activa: boolean; orden: number;
  jornadasDesarrolloTecnico: string; jornadasEnsamblajeTaller: string; jornadasInstalacionObra: string;
}

interface ItemVariante {
  id: string; varianteId: string; catalogoId: string | null; nombrePersonalizado: string | null;
  cantidad: string; precioUnitario: string; totalLinea: string | null; anulado: boolean;
}

interface ProductoCatalogo {
  id: string; sku: string; descripcion: string; tipo: string | null;
  unidadMedida: string; precioDirecto: string | null; precioPublico: string | null;
  stockActual: number; proveedorId: string | null; imagenUrl: string | null;
  categoriaComercial: string | null; publicadoWeb: boolean;
}

interface Parametro {
  id: string; clave: string; grupo: string | null; tipo: string;
  valorNumeric: string | null; valorTexto: string | null; valorBooleano: boolean | null;
  unidad: string | null; descripcion: string | null;
}

interface Contrato {
  id: string; proyectoId: string; codigoContrato: string;
  fechaContrato: string | null; valorTotal: string; estado: string;
  garantiaAnios: number; plazoEjecucionTexto: string;
  objetoItems: string | null; especificacionesEstructura: string | null;
  especificacionesHerrajes: string | null; especificacionesMesones: string | null;
}

interface HitoPago {
  id: string; contratoId: string; orden: number; tipo: string;
  montoOPorcentaje: string; razon: string | null;
}

interface TransicionesProyecto { [desde: string]: string[] }

type DataStore = {
  proyectos: {
    listar(): Proyecto[];
    obtenerPorId(id: string): Proyecto | undefined;
    actualizarEstado(id: string, estado: string): Proyecto;
    crear(data: Partial<Proyecto>): Proyecto;
  };
  clientes: { listar(): Cliente[]; obtenerPorId(id: string): Cliente | undefined };
  espacios: {
    porProyecto(proyectoId: string): EspacioVariante[];
    crear(data: Partial<EspacioVariante>): EspacioVariante;
  };
  items: { porVariante(varianteId: string): ItemVariante[] };
  catalogo: { listar(): ProductoCatalogo[]; buscar(query: string): ProductoCatalogo[] };
  parametros: { obtenerTodas(): Parametro[]; obtenerPorClave(clave: string): Parametro | undefined };
  contratos: { porProyecto(proyectoId: string): Contrato | undefined };
  hitos: { porContrato(contratoId: string): HitoPago[] };
};
```

### 1.2 Reglas del subsistema

1. `DATA_IMPL=mock` por defecto en desarrollo. Producción no tiene fallback a mock — si no se configuró Drizzle, la app falla fuerte.
2. Las fixtures viven en `lib/data/fixtures/` y modelan datos REALES del negocio (inventario legacy, destilación cotizador/contrato, parámetros v1).
3. El mock store es **append-mostly**: CRUD sobre el grafo en memoria, reset al reiniciar el servidor. Suficiente para la experiencia de prototipo.
4. **Prohibición:** ninguna escritura contra dev-local durante F10. Los mocks no tocan la DB.
5. El archivo `drizzle-impl.ts` es un stub que compila pero lanza "no implementado" — se reemplaza durante la migración real.
6. **Contrato de reactividad (M-07, 2026-08-09):** ninguna pantalla lee el store con `getDataStore()` directo — siempre vía `useDataStore()` (hook, `useSyncExternalStore`). Ver `m07_capa_reactividad.md` para el detalle completo y la regla para pantallas nuevas. Enforced por eslint (`no-restricted-imports`).
7. **Antes de arrancar cualquier bloque nuevo (B2 en adelante):** `checklist_progreso_pantallas.md` es la Definición de Hecho obligatoria — consolida el punto 6 (reactividad) más round-trip test por dominio, discoverability de controles de UI, y reglas de paralelización de lotes. El Iniciador cita sus criterios en el plan de cada tarea de pantalla/datos; no es opcional por bloque.

---

## 2. Bloques de prototipado

### Bloque 1 — Comercial + Cotizador + Contrato (OBJETIVO INMEDIATO)

| Pantalla | Ruta (`app/(erp)/`) | Diseño fuente |
|---|---|---|
| P-01 Kanban Comercial | `/comercial` | `disenio_p01_kanban_comercial.md` |
| P-02 Nueva Cotización | `/comercial/nuevo` | `disenio_p02_nueva_cotizacion.md` |
| P-03 Detalle Solo Lectura | `/cotizador/[id]/detalle` | `disenio_p03_detalle_solo_lectura.md` |
| P-04 Cotizador Editor | `/cotizador/[proyectoId]` | `disenio_p04_cotizador.md` |
| P-05 Contrato | (modal integrado en P-04) | Incluido en P-04 |
| P-27 Catálogo (D-Desarrollo) | `/catalogo` | `disenio_p27_catalogo_diseno_desarrollo.md` |

**Layout compartido:** `app/erp/layout.tsx` con ErpShell D4 (sin auth real — mock de sesión para prototipo). Las pantallas son `'use client'` y consumen `getDataStore()` del subsistema mock.

**Datos de seed mock (fixtures):**
- 3 clientes reales: Casa Río, Oficina Llanos, Cocina Márquez
- 9 proyectos en distintos estados (activa, enviada, negociacion, en_contrato, pre_produccion, producción, entregado, perdida, cancelada). La columna Archivo del kanban agrega UI perdida+cancelada; entregado no se muestra como columna kanban (POC-01).
- 1 proyecto canónico con espacios+variantes+items (el caso de la destilación: Cocina Márquez con 3 espacios)
- Catálogo: 8 productos (tablero roble 18mm, tablero nogal, bisagra blum, corredera, tirador, SERV-DEV, SERV-ASSEMBLY, SERV-INSTALL — estos últimos como referencia histórica, la lógica de tarifas C1 los reemplaza)
- Parámetros A-01 (neto_diseno_3d_pct, iva_diseno_3d_pct, recargo_hora_extra_pct) + A-02 (umbral_todo_bien_pct, umbral_extremo_pct, reduccion_comision_novedad_pct, reduccion_comision_extremo_pct) + transiciones_proyecto (JSON C3)
- 3 usuarios mock (admin, comercial, taller) con roles

**Verificación B1:**
- `npx tsc --noEmit` = 0 (el mock store y las pantallas tipan contra contracts.ts)
- `npx eslint .` = 0
- `npx next build` avanza (rutas estáticas si es posible; o falla controlado si DATA_IMPL no está configurado)
- `npm run dev` → Javier navega kanban → crea proyecto → cotiza → calcula totales → genera contrato con hitos 40/40/20 → verifica que se guardan exactos (no revierten a 50/25/25)

### Bloques 2–6 (esquema — se detallan al cerrar B1)

| Bloque | Pantallas | Fase |
|---|---|---|
| B2 | P-06..P-12 (cronograma + gates E-18/E-33) | F3 |
| B3 | P-13/P-14/P-15 (compras + gates E-20/E-21) | F4 |
| B4 | P-16..P-20 (taller/calidad/entrega + E-24) | F5 |
| B5 | P-21..P-23 (finanzas/compensación) | F6 |
| B6 | F-01..F-03, F-07, F-08 (sitio público + portal cliente) | F7 |

---

## 3. Registro de hallazgos

Cada hallazgo del prototipo se registra en `registro_hallazgos_poc4.md` con:

| Campo | Descripción |
|---|---|
| ID | POC-01, POC-02, … |
| Severidad | `bloqueante` / `alto` / `medio` / `bajo` |
| Pantalla | P-XX o F-XX afectada |
| Flujo | Qué estaba haciendo Javier cuando lo encontró |
| Diseño original | Qué dice el `disenio_PXX.md` actual |
| Realidad encontrada | Qué pasó en el prototipo |
| Tipo de mutación | `solo_ui` / `gate` / `schema` / `logica_negocio` |
| Decisión | Qué se cambia (diseño, REGISTRO, gate, contrato) |
| Trazabilidad | Referencia al artefacto modificado (REGISTRO §X, plan_ola7 §Y, glosario_h07) |

**Regla del hallazgo con mutación de schema:** si un hallazgo requiere nueva columna/tabla/enum, se anota en el REGISTRO con marca `[POC-NN]` y se acumula para la migración real en F10-E. No se ejecuta DDL durante el prototipo.

---

## 4. Output final relevante (el que dispara migraciones)

Al cerrar todos los bloques, se consolida:

1. **Pantallas congeladas:** cada bloque con checkboxes de "APROBADO-PRE-CODIGO" (el prototipo ES la pantalla aprobada; el diseño original queda como referencia histórica).
2. **REGISTRO DE ENTIDADES actualizado:** con todas las mutaciones de schema aprobadas vía hallazgos.
3. **Gates con predicados verificados:** en prototipo (contra mock) y listos para migración real.
4. **Plan de migración consolidado:** `plan_f10_migracion.md` — lista ordenada de migraciones Drizzle a ejecutar (incluye t-105/t-106 del hardening + las nuevas de hallazgos).
5. **Cambio de DATA_IMPL:** de `mock` a `drizzle` — el adaptador real se implementa, las pantallas no cambian.

---

## 5. Verificación

| # | Verificación | Comando |
|---|---|---|
| V-1 | Tipos compilan | `npx tsc --noEmit` = 0 |
| V-2 | Lint limpio | `npx eslint .` = 0 |
| V-3 | Build avanza con mock | `DATA_IMPL=mock npx next build` |
| V-4 | Runtime mock funcional | `npm run dev` → navegación manual de Javier por el flujo B1 |
| V-5 | Sin imports de DB en pantallas | `grep -r "from.*lib/db" app/erp/` = 0 resultados |
| V-6 | Hallazgos registrados | `grep -c "POC-" arnes/lineas/ola7/tecnico/registro_hallazgos_poc4.md` ≥ 0 (cero es válido si no hay hallazgos; el registro existe) |
| V-7 | Referencias alineadas (doble pasada) | Tras cada actualización de contrato vivo, verificar con grep que ningún documento activo en `arnes/lineas/ola7/{pantallas,tecnico}/*.md`, `arnes/nucleo/*.md`, `arnes/estado.md` mantenga referencias al modelo anterior. Si hay, corregirlas en el mismo commit. **Obligatorio — ningún agente cierra una actualización sin esta pasada.** |

---

## 6. Tareas registradas en ledger

| ID | Descripción | Tipo | Riesgo |
|---|---|---|---|
| t-110 | F10: Subsistema lib/data (contratos + mock store + fixtures) | `logica_negocio` | alto |
| t-111 | F10-B1: P-01 Kanban Comercial (mock) | `pantalla` | alto |
| t-112 | F10-B1: P-04 Cotizador + P-05 Contrato (mock) | `pantalla` | alto |
| t-113 | F10-B1: P-02 Nueva Cotización + P-03 Solo Lectura (mock) | `pantalla` | medio |
| t-114 | F10-B1: Verificación + checkpoint Supervisor | `verificacion` | alto |
| t-115 | F10: Registro de hallazgos (ledger POC-*) | `mutacion_arnes` | bajo |
| t-116 | F10-B1: P-27 Catálogo D-Desarrollo (mock, decisión POC-12) | `pantalla` | medio |

---

## 7. Verificación de integridad (pre-entrega)

- [x] La arquitectura de mocks (interfaz + doble impl) no contamina `lib/db/` ni `app/api/` — está en `lib/data/` con guard de entorno.
- [x] Los fixtures modelan datos reales del negocio (destilación, inventario legacy, parámetros v1).
- [x] Las pantallas del bloque 1 cubren el flujo comercial completo (kanban → crear → cotizar → contrato).
- [x] El registro de hallazgos tiene formato trazable (ID, severidad, tipo de mutación, artefacto afectado).
- [x] El output final (§4) define exactamente qué dispara las migraciones reales.
- [x] Prohibición explícita de tocar dev-local durante el prototipo (§1.2 regla 4).

---

**Registro:** 2026-08-08 · Orquestador · Plan F10 aprobado por Supervisor. Checkpoint de aprobación: 2026-08-08. **Próxima acción:** crear `lib/data/` + fixtures → prototipo B1.
