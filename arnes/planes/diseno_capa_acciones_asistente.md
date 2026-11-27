# Diseño — Capa de acciones del asistente (jerarquía de herramientas)

**Relacionado con:** `plan_t-198_asistente_erp.md` (registro de herramientas), `plan_t-199_inteligencia_asistente.md` (acciones compuestas), y el MCP futuro.
**Estado:** borrador para aprobación del Supervisor.

---

## 1. Problema

El proyecto tiene 184 exports en `lib/data/actions/`. Muchos son internos: snapshots, lecturas para hidratar pantallas, mapeadores, funciones de plantillas. No son operaciones de negocio. Exponer todo al modelo tiene tres efectos:

- **Costo:** cada herramienta ocupa tokens en cada llamada, aunque no se use.
- **Precisión:** con cientos de herramientas parecidas, el modelo elige mal o inventa nombres.
- **Seguridad:** cada herramienta expuesta es una superficie. Una acción interna mal expuesta puede escribir donde no debía.

La respuesta no es mejorar la descripción de 184 herramientas. Es **exponer menos, por niveles, y solo lo que el permiso del usuario permite**.

---

## 2. Tres niveles

```
Nivel 0 — Mapa de dominios          (siempre en el prompt, ~8 líneas)
   cotizacion: crear y consultar cotizaciones
   proyecto: estado y espacios de un proyecto
   finanzas: cuentas y movimientos
   ...solo los dominios donde el usuario tiene permiso

Nivel 1 — Operaciones de un dominio  (el modelo las pide cuando las necesita)
   dominio_operaciones({ dominio: "cotizacion" })
   → [{ operacion: "buscar", descripcion, esquema }, { operacion: "crear_completa", ... }]

Nivel 2 — Ejecución                 (la única herramienta que escribe o lee datos)
   ejecutar({ dominio, operacion, argumentos })
   → valida argumentos contra el esquema de la operación
   → si es lectura: ejecuta y devuelve resultado truncado
   → si es escritura: crea propuesta (t-198 bloque F), no ejecuta
```

El modelo ve al inicio solo el mapa de dominios. Para usar una operación pide sus detalles, y después ejecuta. Son 2 o 3 llamadas más por tarea, a cambio de un contexto pequeño y estable.

### Por qué no 184 herramientas planas
Algunos proveedores permiten cargar herramientas bajo demanda (búsqueda de herramientas), y el entorno de este proyecto ya lo usa. Sin embargo, depende de que el proveedor y el SDK lo soporten, y eso no está verificado para el stack elegido. Los niveles 0–2 funcionan con cualquier proveedor, porque son herramientas normales.

---

## 3. Qué entra en el catálogo y qué no

**Regla de inclusión:** una acción entra como operación solo si cumple **las cuatro**:

1. Corresponde a una operación de negocio que un empleado pediría en lenguaje natural.
2. Tiene validación de entrada explícita (Zod o equivalente). Si no la tiene, no entra; primero se valida.
3. Tiene permiso definido en `lib/auth/permisos.ts` (o en la rama de seguridad, cuando se mergee).
4. Un humano escribió su descripción en español, dirigida al modelo.

**Regla de exclusión:** nunca entran como operación:
- Snapshots y lecturas de hidratación (`obtenerSnapshot*`, `lecturas-*`): son detalles de la interfaz.
- Funciones de sincronización, colas, longpoll.
- Acciones de administración de usuarios, invitaciones, claves, permisos.
- Generación de archivos (PDF, R2).
- Cualquier acción sin validación de entrada.

**Resultado esperado:** entre 25 y 40 operaciones en total para toda la empresa en la primera versión. Cada una es una decisión escrita, no una exportación automática.

---

## 4. Estructura de datos

```ts
interface Operacion<I> {
  dominio: string               // "cotizacion"
  operacion: string             // "crear_completa"
  descripcion: string           // en español, dirigida al modelo
  permiso: Permiso              // de permisos.ts
  esEscritura: boolean
  esquema: z.ZodType<I>
  ejecutar: (entrada: I, sesion: SesionEmpleado) => Promise<unknown>
}

interface Dominio {
  nombre: string                // "cotizacion"
  descripcion: string           // una línea
  operaciones: Operacion<any>[]
}
```

El registro es una lista de dominios. Agregar una operación es agregar una entrada en un dominio, no tocar el bucle.

---

## 5. Reglas de seguridad

1. **Filtro antes de enviar:** `catalogoDominios(sesion)` y `dominio_operaciones` solo devuelven lo que el permiso permite. Un usuario sin permiso de finanzas no ve el dominio `finanzas`, ni por nombre.
2. **Doble verificación:** `ejecutar` vuelve a comprobar el permiso de la operación. El modelo no puede saltarse el filtro pidiendo un nombre que no le ofrecieron.
3. **Validación antes de ejecutar:** argumentos que no cumplen el esquema → error al modelo, no ejecución.
4. **Escrituras nunca directas:** `ejecutar` con `esEscritura: true` crea una propuesta (t-198 F). El empleado confirma.
5. **La identidad sale de la sesión:** `ejecutar` nunca acepta `usuarioId`, `rol` ni `personaId` en los argumentos.
6. **Registro:** cada llamada de nivel 2 queda en `llamadas_herramienta_asistente` con dominio, operación y resultado resumido.

---

## 6. Límite de pasos

Con los niveles, una tarea simple usa 3 pasos: mapa ya está, pedir operaciones, ejecutar. Una cotización completa puede usar 4 o 5. El tope actual de 8 pasos (t-198 D) queda justo. Se propone:

- Mantener 8 como tope por defecto.
- Contar los pasos de nivel 1 como pasos normales, para no esconder el costo.
- Revisar con las pruebas de evaluación (t-199 §4) si 8 basta.

---

## 7. Relación con el MCP

El MCP expone **los mismos niveles** a clientes externos (claude.ai, Claude Code):

- `dominios()` → nivel 0
- `dominio_operaciones(dominio)` → nivel 1
- `ejecutar(dominio, operacion, argumentos)` → nivel 2

El servidor MCP autentica al cliente con un token por usuario, y aplica exactamente el mismo filtro de permisos. No hay una segunda lista de operaciones: una sola fuente (el registro) alimenta el chat interno y el MCP.

---

## 8. Plan de implementación

| Paso | Qué | Depende de |
|---|---|---|
| 1 | Campo `dominio` en herramientas actuales y `catalogoDominios` | t-198 bloque B |
| 2 | Operaciones de dominio `cotizacion` (buscar, consultar) | paso 1 |
| 3 | Herramienta `dominio_operaciones` y `ejecutar` | paso 2 |
| 4 | Migrar las 3 herramientas actuales a operaciones | paso 3 |
| 5 | Dominios restantes, una operación a la vez, cada una con prueba de permiso | t-199 para acciones compuestas |
| 6 | Conjunto de evaluación con casos por dominio (t-199 §4) | paso 5 |

Cada paso es una tarea de sub-agente con criterios verificables: permiso denegado no ejecuta, esquema inválido no ejecuta, escritura crea propuesta y no escribe.

---

## 9. Decisiones que necesito

| # | Decisión | Recomendación |
|---|---|---|
| L-1 | ¿Aprobar la jerarquía de tres niveles? | Sí |
| L-2 | ¿Quién aprueba la inclusión de cada operación en el catálogo? | Tú, en una lista explícita, operación por operación |
| L-3 | ¿Tope de pasos? | 8, revisable con la evaluación |
| L-4 | ¿Primeros dominios? | cotizacion, proyecto, finanzas |
