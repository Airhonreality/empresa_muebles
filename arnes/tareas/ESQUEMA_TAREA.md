# Esquema de Registro del Ledger de Tareas

## Introducción: Por qué existe el Ledger

El ledger es el registro auditable de todas las tareas ejecutadas en el arnés. Su propósito no es administrativo: es **preservar la memoria del proyecto más allá de una conversación**.

Sin un ledger, la respuesta a "¿quién ejecutó esto?", "¿quién verificó que funciona?", "¿por qué se rechazó?" depende de la memoria de un chat, que desaparece cuando termina la sesión. El ledger es el único artefacto permanente que responde esas preguntas.

Por eso un registro nunca se borra ni se reescribe para ocultar un error. Si algo salió mal, queda registrado: ese registro es la trazabilidad que da confianza al proyecto.

---

## Campos del Registro

| Campo | Tipo | Obligatorio | Para qué sirve |
|-------|------|-------------|----------------|
| `id` | texto | sí | Identificador único y estable del registro, ej. `t-014`. Generado cuando se crea la tarea. |
| `titulo` | texto | sí | Una frase que resume qué se hizo. Ej. "Implementar cálculo de costo real en modelo Mueble". |
| `intencion_negocio` | texto | sí | La intención del humano que pidió la tarea, en sus propias palabras. Es la fuente de verdad para auditar después si lo construido era lo pedido. |
| `zona` | texto | sí | Una sola zona del repositorio (definida en `AGENTS.md`). Si afecta dos zonas, la tarea se divide en dos. Ej. "logica_negocio". |
| `tipo` | enum | sí | Clasificador de riesgo: `andamiaje`, `ui`, `logica_negocio`, `datos_contrato`, `integracion_externa`, `mutacion_arnes`. |
| `riesgo` | enum | sí | Nivel calculado (nunca declarado por el agente): `bajo`, `alto`, `maximo`. Se deriva de `zona` + `tipo`. |
| `archivos_afectados` | lista de rutas | sí | Archivos que la tarea modificará. Se declara antes de ejecutar. Permite detectar colisiones entre tareas en paralelo. |
| `criterios_aceptacion` | lista de textos | sí | Condiciones verificables ejecutando algo. Cada una debe poder responderse corriendo un comando o probando un flujo. |
| `plan_ref` | ruta a archivo | sí, antes de ejecutar | Referencia al archivo de plan generado por el Iniciador, dentro de la carpeta de su línea de trabajo. Ej. `arnes/lineas/ola7/p-014-costo-real.md`. |
| `ejecutor` | identidad | sí, al ejecutar | Quién ejecutó la tarea. Determina quién puede verificarla: no puede ser el verificador. |
| `verificador` | identidad | sí, al verificar | Quién verificó que la tarea cumple criterios. Debe ser distinto de `ejecutor`. |
| `qa` | objeto | sí, al verificar | Contiene: `intentos` (número de intentos de QA), `comandos` (lista de comandos ejecutados en la verificación), `salida_cruda` (texto de la salida), `veredicto` (uno de: `aprobado`, `rechazado`, `no_verificable`). |
| `checkpoint` | objeto | sí, al cerrar o escalar | Contiene: `requerido` (booleano, derivado del `tipo`), `veredicto_humano` (uno de: `aprobado`, `rechazado`, `pendiente`), `fecha` (cuándo se verificó). |
| `estado` | enum | sí | Ciclo de vida: `creada`, `planificada`, `en_ejecucion`, `en_verificacion`, `esperando_humano`, `cerrada`, `escalada`. |
| `creada_en` | timestamp ISO 8601 | sí | Fecha y hora absoluta de creación. |
| `cerrada_en` | timestamp ISO 8601 | no (a menos que esté cerrada) | Fecha y hora absoluta de cierre o escalada. |

---

## Ejemplo Completo: Cálculo de Costo Real en Taller de Muebles

```json
{
  "id": "t-042",
  "titulo": "Implementar cálculo de costo real en modelo Mueble",
  "intencion_negocio": "El gerente del taller necesita saber el costo real de fabricación de cada mueble (materiales + mano de obra) para poder fijar precios competitivos sin regalar el producto.",
  "zona": "logica_negocio",
  "tipo": "logica_negocio",
  "riesgo": "alto",
  "archivos_afectados": [
    "src/models/mueble.ts",
    "src/services/costo.ts",
    "storage/db/mueble.json",
    "tests/costo.test.ts"
  ],
  "criterios_aceptacion": [
    "Ejecutar `npm run test -- costo.test.ts` y obtener 5 tests verdes (casos: mueble simple, con aglomerado+tapizado, con herrajes importados, sin materiales registrados, con mano de obra en horas)",
    "Consultar un mueble existente en la base de datos vía `npm run dev` y verificar que aparece el campo `costo_real` con un número positivo",
    "Ejecutar `npm run lint` sin errores en archivos modificados",
    "Escribir una venta de prueba con ese mueble y verificar que el margen sugerido (venta/costo) es correcto según la fórmula: margen = (precio_venta - costo_real) / costo_real * 100"
  ],
  "plan_ref": "arnes/lineas/ola7/p-042-costo-real.md",
  "ejecutor": "code-agent-v2",
  "verificador": "qa-agent-v1",
  "qa": {
    "intentos": 2,
    "comandos": [
      "npm run test -- costo.test.ts",
      "npm run lint",
      "npm run dev (manual test: crear venta con margen)"
    ],
    "salida_cruda": "✓ 5 tests passed in 1.2s\n✓ No lint errors\n✓ Margen calculado: 45% (fórmula correcta)\n✓ Campo costo_real visible en UI",
    "veredicto": "aprobado"
  },
  "checkpoint": {
    "requerido": true,
    "veredicto_humano": "pendiente",
    "fecha": "2026-07-31T14:32:00Z"
  },
  "estado": "esperando_humano",
  "creada_en": "2026-07-30T09:15:00Z",
  "cerrada_en": null
}
```

---

## Reglas del Ledger

### 1. Trazabilidad sobre prolijidad
Un registro nunca se borra ni se reescribe para ocultar un error. Si algo salió mal, se cierra como `escalada` y se abre una tarea nueva referenciando la anterior. La historia completa de fracasos y reintentos queda visible. Esta es la única forma de que el proyecto sepa qué se probó, qué falló y por qué.

### 2. Separación ejecutor-verificador
`ejecutor` y `verificador` nunca pueden ser la misma identidad. Esto impide que un agente se auto-valide. El punto es evidente: quien escribió el código tiene sesgo a decir que funciona.

### 3. Plan obligatorio antes de ejecutar
Sin `plan_ref` válido, la tarea no puede transicionar a `en_ejecucion`. El plan es la última oportunidad de detectar que la tarea es demasiado grande, tiene criterios no verificables, o falta información. Tareas sin plan producen trabajo desdeñado.

### 4. Checkpoint bloqueante para tipos de riesgo alto
Si `tipo` es `logica_negocio`, `datos_contrato`, `integracion_externa` o `mutacion_arnes`, entonces `checkpoint.requerido` es verdadero. Una tarea con `checkpoint.requerido = true` no puede llegar a `cerrada` si `veredicto_humano` está en `pendiente`. El humano debe decidir explícitamente.

### 5. Escalada al segundo rechazo de QA
Si QA rechaza una vez (`qa.veredicto = "rechazado"`), el agente ejecutor abre una tarea nueva con las correcciones. Si la tarea nueva también es rechazada (segundo rechazo en serie), la tarea se escala a `escalada` y se llama al humano. No hay tercer intento automático: a ese punto, hay un problema que requiere supervisión humana.

### 6. Campo `qa` siempre presente en verificación
Toda tarea que pase a `en_verificacion` debe llenar el objeto `qa` completamente. Si `qa.veredicto` es `no_verificable`, se deja una nota clara en `qa.salida_cruda` explicando por qué no se pudo verificar (p. ej., "el ambiente de test no tiene acceso a la BD de integración"). Eso bloquea el cierre pero no escala automáticamente; queda a decisión del supervisor.

---

## Notas de Implementación

- Todos los timestamps deben estar en formato ISO 8601 con zona horaria (ej. `2026-07-31T14:32:00Z`).
- El `id` es generado por el sistema y es inmutable.
- Los cambios de `estado` son auditables: cada transición debe ser explícita en el registro (se puede agregar un campo `historial_estados` con timestamp de cada cambio si se quiere).
- Si un registro tiene `estado = "escalada"`, el humano debe revisar y decidir: reabrir como nueva tarea, cerrar como inválida, o cambiar la estrategia.
