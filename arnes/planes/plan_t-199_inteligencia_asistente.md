# Plan t-199 — Capa de inteligencia del asistente: acciones complejas y base de conocimiento

**Estado:** borrador para revisión del Supervisor. No autoriza código hasta aprobación.
**Ledger:** `arnes/tareas/t-199.json`.
**Depende de:** t-198 (bloques A–F del backend del asistente). Este plan NO repite lo de t-198.
**Motivo de separarlo:** t-198 es infraestructura (bucle, claves, propuestas, UI). Esto es contenido y lógica de negocio que el asistente usa: qué puede hacer en un solo paso y qué debe saber para hacerlo bien.

---

## 1. Alcance

Dos piezas:

- **Pieza I — Acciones compuestas:** operaciones de negocio que crean varios registros en una sola confirmación, con atomicidad garantizada.
- **Pieza II — Base de conocimiento:** documentos curados que el modelo consulta para entender reglas y procedimientos de la empresa.

**Fuera de alcance:** servidor MCP, búsqueda vectorial, entrenamiento o ajuste fino de modelos, acceso del modelo a archivos de `arnes/`.

---

## 2. Pieza I — Acciones compuestas

### 2.1 Problema verificado

Las acciones de escritura actuales confirman cada una por separado. `crearProyectoAction` inserta directamente en la base sin transacción. Una cotización completa son varias llamadas. Si la tercera falla, quedan registros huérfanos. Esto **no se puede** dejar al modelo: el modelo no sabe de transacciones y reintentaría a ciegas.

### 2.2 Regla de diseño

Cada operación de negocio compuesta es **una sola función** en `lib/data/actions/compuestas/` que:

1. Valida la entrada completa con un esquema Zod.
2. Abre **una** transacción `db.transaction(async (tx) => …)`.
3. Escribe todas las filas usando `tx`, no `db`.
4. Si cualquier paso falla, la transacción revierte todo.
5. Devuelve un resumen con los identificadores creados.
6. Está envuelta con `protegerAccion` con su permiso propio.

**Requisito previo:** las funciones de escritura existentes que se reutilicen deben aceptar un `tx` opcional, o la lógica se duplica dentro de la compuesta. Preferir extraer la lógica a una función interna que reciba `tx`, y que la acción original la llame con `db`. Esto es un refactor: debe mantener el comportamiento de la acción original, probado.

### 2.3 Operaciones de la primera versión

| Operación | Qué crea | Acciones base que reemplaza | Permiso |
|---|---|---|---|
| `cotizacion_crear_completa` | cliente (existente o nuevo), proyecto, espacios, ítems, grupos | `crearProyectoAction`, `crearEspacioAction`, `crearItemAction`, `crearGrupoItemAction` | `cotizador:escribir` |
| `movimiento_registrar` | movimiento financiero asentado | `crearMovimientoManualAction` (ya usa transacción) | `finanzas:escribir` |

`movimiento_registrar` no necesita refactor: `crearMovimientoManualAction` ya abre transacción. Solo se envuelve como herramienta del asistente.

### 2.4 Entrada de `cotizacion_crear_completa`

```ts
{
  cliente: { id: string } | { nombre: string; documento?: string; telefono?: string; email?: string; domicilio?: string },
  nombreProyecto: string,
  direccionObra?: string,
  espacios: Array<{
    nombre: string,
    items: Array<{ catalogoId: string | null; nombrePersonalizado?: string; cantidad: string; precioUnitario?: string }>
  }>,
  descuentoComercial?: string,   // ver regla de montos abajo
  aplicaIva?: boolean
}
```

**Reglas de negocio que la acción debe imponer, no el modelo:**
- El código de cotización (`COT-AAAA-MM-DD-NN`) se genera en el servidor, igual que hoy.
- Los precios unitarios de ítems de catálogo se toman del catálogo, no de la entrada, salvo que el permiso `cotizador:precio_libre` esté presente.
- Descuentos y ajustes requieren permiso `cotizador:descuento`. Sin permiso, la entrada se rechaza.
- Los totales los calcula la función de cálculo único existente (`calcularTotalesCotizacion`, commit `f89029a`). **Nunca** se suma en la acción compuesta ni en el modelo.

### 2.5 Flujo con confirmación

La herramienta de escritura de t-198 (bloque F) crea una propuesta con esta entrada. El empleado ve el resumen completo: cliente, espacios, ítems, totales calculados. Solo al confirmar se ejecuta la compuesta. Si la compuesta falla, la propuesta queda `fallida` con el motivo, y no hay filas parciales.

### 2.6 Criterios de aceptación

- **Atomicidad:** test que fuerza un error en el último ítem y verifica que no queda ni proyecto ni espacio ni ítem en la base (con base de prueba o con `tx` simulado que lanza).
- **Permisos:** usuario sin `cotizador:descuento` que envía `descuentoComercial` → rechazo, no escritura.
- **Precios de catálogo:** precio enviado por el modelo distinto del catálogo → se usa el del catálogo.
- **Totales:** el total devuelto coincide con `calcularTotalesCotizacion` sobre los mismos datos.
- **Equivalencia:** la acción original (`crearProyectoAction`, etc.) sigue produciendo el mismo resultado tras el refactor (tests existentes en verde).

---

## 3. Pieza II — Base de conocimiento

### 3.1 Qué es y qué no es

Es una colección de documentos en markdown que explican **cómo se hacen las cosas en la empresa**: estados de un proyecto, cuándo aplica un descuento, qué campos son obligatorios para un contrato, qué significa cada estado de pago.

**No es** una copia del `arnes/`. El arnés tiene decisiones internas, riesgos, tareas y detalles de desarrollo que no corresponden al asistente. Los documentos del asistente se escriben aparte, para el modelo.

### 3.2 Ubicación y formato

```
conocimiento/asistente/
  INDICE.md                    lista de documentos con una línea cada uno
  cotizaciones/estados.md
  cotizaciones/descuentos.md
  cotizaciones/iva.md
  proyectos/ciclo-de-vida.md
  finanzas/cuentas-y-movimientos.md
  ...
```

Cada documento tiene encabezado obligatorio:

```markdown
---
titulo: Descuentos en cotizaciones
dueno: <rol responsable, no nombre personal>
revisado: 2026-MM-DD
aplica_a: [cotizacion_crear_completa]
---
```

Sin `dueno` y `revisado`, el documento no se carga (test automático).

### 3.3 Cómo lo usa el modelo

1. **Índice en el prompt del sistema:** el contenido de `INDICE.md` (título y línea de cada documento), no los documentos completos.
2. **Herramienta `procedimiento_consultar({ tema: string })`:** busca por nombre de archivo o por título en el índice y devuelve el documento completo, truncado a 12.000 caracteres si es más largo.
3. **Sin búsqueda vectorial.** Con decenas de documentos, un índice explícito es más predecible y más fácil de auditar. Se reevalúa si el corpus supera ~100 documentos.

### 3.4 Filtro por permiso

Un documento puede declarar `permiso: finanzas:leer`. La herramienta no lo devuelve a usuarios sin ese permiso, aunque lo pidan por nombre. El índice filtrado por permiso es lo que se incluye en el prompt de cada usuario.

### 3.5 Revisión y mantenimiento

- Cada documento tiene `dueno` (rol). Cambiar un documento requiere revisión del dueño, igual que un cambio de código: se hace por commit y pasa por el flujo normal de revisión.
- Un test verifica que todo documento listado en el índice existe y viceversa.
- Un test verifica que ningún documento contiene patrones de claves de API, correos personales o números de documento de identidad de ejemplo.
- Fecha `revisado` más de 180 días atrás → el índice lo marca "por revisar". No bloquea, pero es visible.

### 3.6 Criterios de aceptación

- El modelo, ante "¿cómo aplico un descuento?", llama a `procedimiento_consultar` y responde con datos del documento. Probado con modelo mock y con un caso real manual.
- Usuario sin permiso `finanzas:leer` no obtiene documentos de finanzas, ni por tema exacto.
- Documento sin encabezado válido no se incluye en el índice.

---

## 4. Evaluación del comportamiento del asistente

Sin esto, no sabemos si funciona. Es una pieza obligatoria, no opcional.

- **Conjunto de casos:** 30 preguntas y órdenes reales, en `tests/asistente/casos.json`, con resultado esperado (herramienta que debe llamarse, datos que deben aparecer, o rechazo).
- **Métricas:** porcentaje de casos que llaman la herramienta correcta; porcentaje de respuestas que dicen "no puedo" cuando sí podía (objetivo: 0 en el conjunto); porcentaje de escrituras que se ejecutan sin confirmación (objetivo: 0).
- **Ejecución:** script que corre el conjunto contra el modelo real con la clave configurada, en `dev-local`, y guarda el resultado con fecha. No corre en CI porque cuesta dinero; se corre manualmente antes de cada cambio de modelo o de prompt.
- **Regresión:** antes de cambiar el prompt del sistema o la lista de herramientas, se corre el conjunto y se compara con el anterior.

---

## 5. Orden y dependencias

| Paso | Qué | Depende de |
|---|---|---|
| 1 | Refactor de `crearProyectoAction`, `crearEspacioAction`, `crearItemAction`, `crearGrupoItemAction` para aceptar `tx` | t-198 bloque B |
| 2 | `cotizacion_crear_completa` con atomicidad y tests | paso 1 |
| 3 | `movimiento_registrar` como herramienta | t-198 bloque B |
| 4 | Estructura `conocimiento/asistente/` con 3 documentos piloto (estados, descuentos, IVA) | ninguna |
| 5 | Herramienta `procedimiento_consultar` con filtro por permiso | t-198 bloque B, paso 4 |
| 6 | Índice en el prompt del sistema | paso 5 |
| 7 | Conjunto de casos y script de evaluación | pasos 2, 3, 5 |

Pasos 1 y 4 pueden hacerse en paralelo.

---

## 6. Riesgos

- **Refactor de acciones existentes:** es el paso más delicado. Si una acción original cambia de comportamiento, afecta a la interfaz actual del cotizador. Mitigación: tests de equivalencia antes del cambio.
- **Documentos desactualizados:** el modelo los cree. Mitigación: fecha de revisión y dueño visible.
- **Costo de la evaluación:** cada corrida del conjunto gasta tokens reales. Mitigación: tope de gasto del bloque D de t-198 aplica también al script.
- **Montos:** un error de cálculo en una compuesta afecta dinero contractual. Mitigación: totales solo desde la función de cálculo único, nunca reimplementados.

---

## 7. Decisiones que necesito

| # | Decisión | Recomendación |
|---|---|---|
| I-1 | ¿Quién escribe y revisa los documentos de conocimiento? | Cada área (cotizaciones, finanzas) con su responsable; tú apruebas la primera versión de cada uno |
| I-2 | ¿Qué permiso tiene `cotizador:descuento`? | Solo admin y comercial senior, a definir |
| I-3 | ¿Se permite precio libre en ítems de catálogo (`cotizador:precio_libre`)? | No en la primera versión |
| I-4 | ¿Cuántos documentos piloto? | Tres: estados, descuentos, IVA |
