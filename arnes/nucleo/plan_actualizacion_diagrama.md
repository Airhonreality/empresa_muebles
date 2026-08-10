# Plan — actualización del diagrama mermaid de `logica_de_negocio.md`

**Fecha:** 2026-08-08 · **Estado:** ✅ EJECUTADO COMPLETO (2026-08-08) — el bloqueo del §2 se resolvió vía `nucleo/mini_diamante_check_produccion.md` (rediseño axiomático, no un typo a elegir), y con eso resuelto, el §3 de este plan se aplicó entero al diagrama de `logica_de_negocio.md`, incluidos los 3 opcionales (I-024 pregunta de viajes, SLA en R3, matiz ejecutor=verificador en P). Este documento es el registro de cómo se diseñó ese diagrama, no historia descartada. · **Tipo:** mutacion_arnes (contenido de núcleo) · **Riesgo:** medio (afecta el documento fuente de verdad del negocio)

**Contexto:** `nucleo/logica_de_negocio.md` tiene su prosa al día con las decisiones del 2026-08-03/07, pero el diagrama mermaid (líneas 33-70) no se actualizó nunca — no estaba clasificado como "contrato vivo" ni "registro histórico" (regla de `proceso/ARNES_AGENTICO.md` §2.C), así que nadie supo que estaba obligado a cambiar. Antes de tocarlo, se auditaron todas las decisiones del bloque "Correcciones del Supervisor" (líneas 205-294) contra el diagrama actual y contra los otros 2 archivos madre (`REGISTRO_DE_ENTIDADES.md`, `glosario_h07.md`).

---

## 1. Auditoría — inventario completo de decisiones del bloque 205-294

| Código | Decisión | ¿Cambia la forma del diagrama? | Estado |
|---|---|---|---|
| I-024 | Promesa 7 semanas + pregunta de viajes al firmar contrato | Parcial — anotación menor cerca de M/N | Propuesto como opcional, §3 |
| **I-034** | Cronograma doble (línea interna vs. contractual) | **Sí** | En el plan, nodo R1 |
| **I-025** | Check de los 15 días, 3 desenlaces | **Sí** | En el plan, nodo R1 + R2/R3/R4 |
| I-027 | Cambio de contrato, flow organizado, tercer origen causal | Sí | **Ya está en el diagrama actual** (nodo N2) — sin cambios |
| I-043 | Comisión comercial por ventas, no por producción | No — es regla de compensación, no de flujo | Se queda solo en prosa |
| P5-09 | Orden cronograma: aprobación→compras→ensamblaje→instalación | Sí | **Ya coincide** con el orden actual O→P→Q→R — verificado, sin cambios |
| D4 | Causa interna/externa es atributo, no determinante (composición causal) | No — refina cómo se decide la causa dentro del nodo N2, no agrega un nodo | Se queda en prosa |
| E-34 | Novedad crítica, SLA 5-24h | Parcial — enriquecería la etiqueta de R3 | Propuesto como opcional, §3 |
| D6 | KPIs por subsistema, ninguno residual | No — es lógica de reporte, no de flujo | Se queda en prosa |
| **D1** | Gate de caja bloqueante | **Sí** | En el plan, nodos Q1/RED5 |
| D1/C1 | "El sistema es guía + registrador de la realidad" | No — principio de diseño, no un paso nuevo | Se queda en prosa |
| **D2** | Rastreo de origen del reproceso (el culpable asume) | Parcial — nota general, no nodo nuevo | En el plan, nota debajo del diagrama |
| B2 | Fila del taller en capa 1 (fuente de datos del check) | No — detalle de origen de datos del nodo R1, no un nodo nuevo | Se queda en prosa |
| C1 | Cronograma inicial por factores de tamaño | No — parametriza cuánto dura O→R, no cambia la forma | Se queda en prosa |
| **D3 (I-035/I-043)** | Verificador único = comercial vendedor | **Sí** | En el plan, relabel de nodo S |
| — | Separación ejecutor-verificador a nivel de evento (nodo P permite mismo actor; nodo S exige otro) | Parcial — matiz en la etiqueta de P | Propuesto como opcional, §3 |
| — | Hallazgo B: "Producción" se disuelve en 4 bounded contexts | No — arquitectura de backend, ya implícito en O→R1→S | Se queda en prosa |

**Conclusión de la auditoría:** de 17 decisiones registradas, 5 cambian la forma del diagrama (I-034, I-025, D1, D3, y I-027 que ya estaba), 3 son enriquecimientos opcionales de etiqueta, y 9 son correctamente prosa-only (compensación, reporting, principios de diseño, detalles de origen de datos). El plan original (mensaje anterior) tenía razón en su alcance — la auditoría no encontró nada mayor que faltara agregar como nodo.

---

## 2. Hallazgo que bloquea — inconsistencia entre archivos madre

**`REGISTRO_DE_ENTIDADES.md` §5 contradice a `logica_de_negocio.md` y `glosario_h07.md` sobre qué desenlace de `check_produccion` reduce las comisiones:**

| Fuente | `novedad` | `extremo` |
|---|---|---|
| `nucleo/logica_de_negocio.md:251` | "las comisiones se reducen" | "negociar con el cliente" (sin mención de comisiones) |
| `nucleo/glosario_h07.md:228-229` | "comisiones se reducen" | "se escala y se negocia con el cliente" |
| `nucleo/REGISTRO_DE_ENTIDADES.md §5` | "acción correctiva" (sin mención de comisiones) | **"comisiones reducidas E-35"** |

**2 de 3 fuentes coinciden en que `novedad` reduce comisiones. `REGISTRO_DE_ENTIDADES.md` es el único que se lo atribuye a `extremo`.** Por la regla de precedencia del propio registro ("si este documento difiere de cualquier otra fuente, gana este"), no puedo resolver esto por mayoría de votos — el registro se declara a sí mismo superior, así que si de verdad tiene el dato correcto, hay que corregir `logica_de_negocio.md` y `glosario_h07.md`, no al revés. **Necesito que el Supervisor diga cuál es la regla real antes de que el diagrama (una tercera copia) herede cualquiera de las dos versiones.**

**No se toca el diagrama hasta resolver esto** — construir el nodo R1/R2/R3/R4 con la etiqueta equivocada sería insertar el error en un tercer lugar, exactamente lo que esta auditoría existe para prevenir.

---

## 3. Plan de nodos — TODO APLICADO (2026-08-08)

- ✅ Nodo `Q1` + `RED5`: gate de caja bloqueante (D1).
- ✅ Nodos `R1`→`R2`/`R3`/`R4`: check de producción, 3 desenlaces (I-025/I-034) — resuelto vía `mini_diamante_check_produccion.md`, no como elección de una etiqueta entre dos.
- ✅ Relabel de `S`: verificador único = comercial vendedor (D3).
- ✅ Clasificación "contrato vivo" + nota de refresco arriba del diagrama.
- ✅ Nota de rastreo de origen (D2) debajo del diagrama.
- ✅ Los 3 opcionales, aplicados: nodo `M2` pregunta de viajes (I-024), SLA 5-24h en la etiqueta de `R3` (E-34), matiz ejecutor=verificador en la etiqueta de `P`.

---

## 4. Cierre

**Resuelto:** ni `novedad` ni `extremo` "ganó" la pregunta original — el rediseño axiomático hizo que ambos redujeran comisión, en magnitud distinta (50%/100%), reconciliando las 3 fuentes en vez de declarar una correcta y dos equivocadas. Detalle completo en `nucleo/mini_diamante_check_produccion.md`. El diagrama de `nucleo/logica_de_negocio.md` refleja el resultado final, verificado por grep cruzado contra los otros 2 archivos madre (ver `arnes/tareas/t-104.json`).
