# Plan t-198 — Asistente de chat dentro del ERP (bucle con herramientas)

**Estado:** borrador para revisión del Supervisor. No autoriza código hasta aprobación.
**Ledger:** `arnes/tareas/t-198.json` (solo estado y referencia a este plan).
**Depende de:** t-197 (protocolo `protegerAccion` en `dev`). Hoy vive en la rama `fix/guard-acciones-protegidas`, sin mergear. Sin t-197 mergeada, ninguna herramienta puede ejecutarse.

---

## 0. Objetivo y límites

**Objetivo:** que un empleado logueado pueda pedirle al ERP, en lenguaje natural, consultas (fase 1) y acciones con confirmación (fase 2). Ejemplos: "busca la cotización de Juan", "crea una cotización para el cliente X con dos mesas", "registra un ingreso de 500.000 en caja".

**Fuera de alcance de este plan:**
- Acceso del modelo a la terminal, al sistema de archivos o a código fuente.
- Clientes del portal. Solo empleados.
- Servidor MCP. Es una segunda salida del mismo registro de herramientas y se planea aparte.
- Cambios en las acciones existentes, salvo los que t-197 ya haya dejado.

**Principio de diseño:** el modelo nunca tiene un camino a la base de datos. Solo puede pedir herramientas, y cada herramienta llama a una acción ya protegida con `protegerAccion`. Si la sesión no tiene permiso, la herramienta ni se envía al modelo.

---

## 1. Decisiones que tomo el Supervisor (no el agente)

| # | Decisión | Recomendación | Por qué |
|---|---|---|---|
| D1 | Proveedor de modelo inicial | Uno solo, detrás de un adaptador. Elegir el más barato que pase las pruebas de la fase 1 | Cambiar de proveedor debe tocar una línea |
| D2 | Tope de gasto | Límite diario por usuario y global, con alerta al 80% | Sin tope, un bucle mal diseñado cuesta sin control |
| D3 | Historial | En la base de datos (tablas nuevas) | Sobrevive recargas y queda auditado. Requiere checkpoint de schema |
| D4 | Hosting de la ruta | Confirmar si el límite de tiempo de la función serverless basta para bucles de hasta 8 pasos | Si no basta, la ruta va a un servidor sin ese límite |
| D5 | Lista de herramientas de fase 1 y 2 | Ver §4 | Son las acciones de mayor valor. Requiere validación de negocio |
| D6 | Quién confirma escrituras | El mismo empleado que pidió la acción, en la misma sesión | Evita que una propuesta quede esperando a otro |

Ningún sub-agente elige D1–D6. Si la implementación necesita otra decisión, se detiene y reporta.

---

## 2. Las siete piezas

Cada pieza tiene: archivo(s), contrato, criterios de aceptación. Un sub-agente recibe **una pieza y su contrato**, no el plan completo.

### Pieza 1 — Ruta HTTP del asistente
- **Archivo:** `app/api/asistente/route.ts`
- **Entrada:** `POST` con `{ conversacionId?: string, mensaje: string }`.
- **Contrato:**
  1. Lee la sesión ERP con la función existente de `lib/auth/session.ts`. Si no hay sesión de empleado → `401`. Nunca responde con datos de otro usuario.
  2. Valida el cuerpo con Zod. `mensaje` máx. 4.000 caracteres.
  3. Delega en la pieza 2 y devuelve la respuesta en streaming o JSON según D4.
- **Criterios:**
  - Sin cookie → `401`, sin llamar al modelo (test con mock del modelo que cuenta llamadas = 0).
  - Cuerpo inválido → `400`.
  - Respuesta nunca incluye la API key ni el prompt de sistema.

### Pieza 2 — Orquestador del bucle
- **Archivo:** `lib/asistente/bucle.ts`
- **Contrato:** `ejecutarTurno({ usuario: SesionEmpleado, historial: Mensaje[], mensaje: string }) → { respuesta: string, mensajesNuevos: Mensaje[] }`
- **Implementación:** `generateText` del SDK `ai` (versión fijada exacta), con:
  - `tools`: solo las herramientas que el permiso de `usuario` permite (filtro antes de enviar; pieza 3).
  - `stopWhen`: `stepCountIs(8)` o `hasToolCall('finalizar')`. No usar `maxSteps`.
  - `system`: texto fijo que nombra las herramientas disponibles y dice explícitamente que debe usarlas antes de decir que no puede.
- **Criterios:**
  - Con modelo mock que pide una herramienta y luego responde texto: el bucle ejecuta la herramienta, agrega el resultado al historial y termina.
  - Con modelo mock que pide herramientas sin parar: se detiene en el paso 8 y devuelve un resumen, no un error.
  - Un usuario sin permiso no recibe la herramienta en la lista enviada (test que inspecciona el argumento `tools` del mock).

### Pieza 3 — Registro de herramientas
- **Archivo:** `lib/asistente/herramientas.ts`
- **Contrato por herramienta:**
  ```ts
  interface DefinicionHerramienta<I> {
    nombre: string            // ej. "cotizacion_buscar"
    descripcion: string       // en español, dirigida al modelo
    permiso: Permiso          // de lib/auth/permisos.ts
    esEscritura: boolean
    esquema: z.ZodType<I>     // Zod
    ejecutar: (entrada: I, usuario: SesionEmpleado) => Promise<unknown>
  }
  ```
- **Reglas:**
  - `ejecutar` llama a una acción de `lib/data/actions/` envuelta con `protegerAccion`. No accede a Drizzle directamente.
  - Las herramientas de escritura (`esEscritura: true`) no ejecutan en la pieza 2. Devuelven una propuesta (pieza 5).
  - Los resultados se recortan a un tamaño máximo fijo (constante, p. ej. 8.000 caracteres) con aviso de truncado.
- **Criterios:**
  - Test por herramienta: entrada inválida según el esquema → error de validación, la acción no se llama.
  - Test: usuario sin permiso → `ejecutar` lanza `NoAutorizadoError`.
  - `tsc` y lint sin errores.

### Pieza 4 — Adaptador de proveedor
- **Archivo:** `lib/asistente/modelo.ts`
- **Contrato:** `obtenerModelo(): LanguageModel`. Lee la clave y el identificador de modelo de variables de entorno del servidor (`ASISTENTE_API_KEY`, `ASISTENTE_MODELO`). Ningún otro archivo importa un proveedor directamente.
- **Criterios:**
  - Sin variables → error explícito al arrancar, no un valor por defecto.
  - Grep del repo: el nombre de ningún proveedor aparece fuera de este archivo.
  - La clave nunca aparece en el bundle del navegador (verificar con `next build` y búsqueda en `.next/static`).

### Pieza 5 — Confirmación de escrituras
- **Archivos:** `lib/asistente/propuestas.ts`, tabla `propuestas_asistente` (pieza 6).
- **Flujo:**
  1. El modelo pide una herramienta de escritura → se guarda una fila `propuesta` con estado `pendiente`, el resumen legible y la entrada validada. El modelo recibe "propuesta creada, esperando confirmación del empleado".
  2. La UI muestra el resumen con botones Confirmar / Cancelar.
  3. Confirmar → `POST /api/asistente/propuestas/[id]/confirmar` ejecuta la herramienta real con la sesión actual, marca `ejecutada` o `fallida`.
- **Criterios:**
  - Confirmar con otra sesión → `403`.
  - Confirmar dos veces → la segunda es no-op (idempotencia por estado).
  - Propuesta vencida (48 h) → no se ejecuta.

### Pieza 6 — Persistencia
- **Archivos:** `lib/db/schema.ts` (**requiere checkpoint**), migración con `drizzle-kit`.
- **Tablas nuevas:**
  - `conversaciones_asistente`: id, usuario_id (FK usuarios), creada_en, actualizada_en.
  - `mensajes_asistente`: id, conversacion_id (FK), rol, contenido (jsonb), creado_en.
  - `propuestas_asistente`: id, conversacion_id, usuario_id, herramienta, entrada (jsonb), resumen, estado, creada_en, resuelta_en.
  - `llamadas_herramienta_asistente`: id, usuario_id, herramienta, entrada_resumen, resultado_resumen, duracion_ms, creada_en (auditoría).
- **Reglas:** nunca guardar la clave del modelo ni prompts de sistema. Los contenidos de mensajes sí se guardan (son del negocio).
- **Criterios:** migración corre en `dev-local` sin tocar datos existentes; rollback documentado.

### Pieza 7 — Interfaz del chat
- **Archivos:** `app/erp/(modern)/asistente/page.tsx` y componentes en `components/asistente/`.
- **Contrato:** lista de conversaciones del usuario, panel de mensajes, caja de entrada, tarjetas de propuesta con Confirmar / Cancelar.
- **Criterios:**
  - Un usuario no ve conversaciones de otro (test en servidor, no solo en UI).
  - Estado de carga y error visibles.
  - Revisión manual en navegador con un empleado de prueba (QA humano, ver §5).

---

## 3. Orden de ejecución y división

Cada bloque es una tarea independiente de sub-agente con su pieza y sus criterios. No se paralelizan los bloques que comparten archivos.

| Bloque | Piezas | Depende de | Checkpoint |
|---|---|---|---|
| A | 6 (schema y migración) | D3 aprobada | **Sí** (cambio de schema) |
| B | 3 (registro) + tests | t-197 mergeada | No |
| C | 4 (adaptador) | D1 | No |
| D | 2 (bucle) | B, C | No |
| E | 1 (ruta) | D | No |
| F | 5 (propuestas) | A, D | No |
| G | 7 (interfaz) | E, F | No |

---

## 4. Herramientas candidatas (para validar en D5)

**Fase 1 — solo lectura** (permiso de lectura según la matriz existente):
- `cotizacion_buscar` — por código o nombre de cliente.
- `proyecto_consultar` — estado, espacios y totales de un proyecto.
- `caja_saldo` — saldo de cuentas financieras.

**Fase 2 — escritura con confirmación:**
- `cotizacion_crear` → `crearProyectoAction` + `crearEspacioAction` + `crearItemAction`.
- `movimiento_registrar` → `crearMovimientoManualAction` (ya valida con su esquema).

Las acciones se verifican una por una antes de exponerlas. Una acción sin validación de entrada no entra como herramienta de escritura.

---

## 5. Verificación

**Mecánica (obligatoria por bloque):**
- `npx tsc --noEmit`, `npx eslint` sobre archivos tocados, tests del bloque con `DATABASE_URL` placeholder.
- `npx next build` al final de la tarea G.

**Pruebas de comportamiento del bucle:** con modelo mock, tres escenarios: respuesta directa, una herramienta, tope de pasos. Son tests automáticos, no pruebas manuales.

**QA humano (antes de cualquier uso real):**
- Empleado de prueba con permiso de lectura: pide una cotización existente, obtiene datos correctos.
- Empleado sin permiso de finanzas: pide un movimiento, el asistente no lo ofrece.
- Escritura: propone, cancela, y verifica que no se creó nada. Propone, confirma, y verifica una sola fila creada.
- Todo en `dev-local`. Nunca producción.

---

## 6. Qué no hacer

- No usar `maxSteps` (la API vigente es `stopWhen`).
- No dejar que el modelo elija el `usuarioId` ni el rol; siempre sale de la sesión.
- No poner la clave del proveedor en ningún archivo versionado ni en el cliente.
- No ejecutar escrituras directamente desde la pieza 2.
- No exponer herramientas cuya acción subyacente no tenga `protegerAccion`.
