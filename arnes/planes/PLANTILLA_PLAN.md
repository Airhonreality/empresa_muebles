# Plan de Tarea: <ID-TAREA>

**Título:** <Título breve y específico de la tarea>

**Fecha de creación:** <YYYY-MM-DD>

---

## Objetivo

<Una sola frase en lenguaje de negocio que explique qué se logrará.>

> **Nota importante:** Si no se puede explicar el objetivo en una frase que entienda quien pidió el trabajo, la tarea es demasiado grande. Devolver al Orquestador para partirla.

**Ejemplo de objetivo bien escrito:** "Permitir que el usuario cargue imágenes de muebles directamente desde su cámara sin pasos intermedios."

---

## Zona

**Zona afectada:** <Nombre de una sola zona definida en `AGENTS.md`>

> **Nota:** Si esta tarea afecta dos zonas diferentes, el plan se devuelve al Orquestador. Una zona por tarea.

---

## Tipo y Riesgo

**Tipo de tarea:** <Uno de: `andamiaje`, `ui`, `logica_negocio`, `datos_contrato`, `integracion_externa`, `mutacion_arnes`>

**Riesgo calculado:** <Uno de: `bajo`, `alto`, `maximo`>

> **Nota:** El riesgo no se elige; se deriva automáticamente de la zona + tipo. Ver tabla de clasificación en `ESQUEMA_TAREA.md`.

---

## Archivos Afectados

**Lista de archivos que se modificarán:**

- `<ruta/archivo1.ts>`
- `<ruta/archivo2.tsx>`
- `<ruta/archivo3.json>`
- `<ruta/...>`

> **Nota crítica:** Sin esta lista explícita, el arnés no puede detectar si dos tareas chocan. Un plan sin archivos afectados es **inválido** y se rechaza antes de ejecutar.

---

## Criterios de Aceptación

Cada criterio **debe poder responderse ejecutando un comando o probando un flujo concreto**. No son opiniones.

### Criterios mal escritos (EVITAR):

- ❌ "El código debe quedar prolijo"
- ❌ "Mejorar el rendimiento del listado"
- ❌ "La interfaz debe verse moderna"

### Criterios bien escritos (USAR):

- ✓ "Ejecutar `npm run test` y obtener 100% de tests en verde"
- ✓ "Consultar un listado de 1000 items via API y verificar que responde en menos de 500ms"
- ✓ "Abrir la URL `/muebles` en el navegador y verificar que los elementos tienen color de fondo azul (#2563EB)"

---

### Criterios de esta tarea:

1. <Criterio 1: comando/prueba que demuestre que se cumple>
2. <Criterio 2: comando/prueba que demuestre que se cumple>
3. <Criterio 3: comando/prueba que demuestre que se cumple>
4. <Criterio N: ...>

> **Cada criterio debe ser verificable de forma objetiva.** Si dice "el código debe ser limpio" o "debe mejorar", no es verificable. Devolver al Orquestador.

---

## Comandos de Verificación que Aplican

Estos son los comandos que usa el rol QA para validar que la tarea se completó correctamente. Se toman de la declaración de `AGENTS.md` del proyecto en la sección de verificación:

```bash
<Comando de test / lint / build / integración que declara el proyecto>
```

**Ejemplo (en un proyecto Node):**

```bash
npm run test
npm run lint
npm run build
npm run type-check
```

> **Nota:** El arnés es agnóstico de lenguaje. Estos comandos los declara cada proyecto en `AGENTS.md` bajo `comandos_verificacion` o similar. No asumir cuál es el sistema de tests.

---

## Qué NO Incluye Este Plan

Declarar explícitamente lo que queda afuera impide que la tarea se expanda sola mientras se ejecuta.

- No incluye: <Funcionalidad / archivo / cambio que queda excluido>
- No incluye: <...>
- No incluye: <...>

**Ejemplo:**

- No incluye: migración de datos de muebles antiguos (eso es otra tarea)
- No incluye: autenticación de usuarios (está fuera del alcance de esta zona)
- No incluye: integración con proveedor de pagos (eso viene después)

---

## Preguntas Abiertas

Si hay ambigüedades sin resolver, listan aquí. **El plan no se aprueba hasta que se contesten.**

- **Pregunta 1:** <Pregunta específica que el Orquestador o PM debe responder>
- **Pregunta 2:** <...>

**Si no hay preguntas, escribir:** No hay preguntas abiertas.

> **Nota:** Un plan con ambigüedades sin resolver produce trabajo que hay que rehacer. Si el Iniciador tiene dudas sobre qué se espera, es mejor parar ahora.

---

## Aprobación del Plan

- **Revisor:** <Identidad de quien revisa el plan>
- **Fecha de aprobación:** <YYYY-MM-DD>
- **Estado:** <`aprobado`, `rechazado`, `pendiente_cambios`>

**Observaciones del revisor (si aplica):**

<Comentarios sobre cambios solicitados o aclaraciones>

---

## Referencias

- Esquema de tarea: [ESQUEMA_TAREA.md](../tareas/ESQUEMA_TAREA.md)
- Ledger de tareas: [Ledger](../tareas/)
- Declaración de zonas: [AGENTS.md](../../AGENTS.md)
