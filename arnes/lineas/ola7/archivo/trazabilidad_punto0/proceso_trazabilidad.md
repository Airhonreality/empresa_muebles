# PROCESO — Trazabilidad de decisiones punto-0 (diseño del pase)

**Estado:** PROPUESTA del Orquestador — pendiente de aprobación del Supervisor.
**Objetivo:** para cada schema diseñado, reconstruir la cadena de decisiones hacia el **punto 0** (las conversaciones iniciales que desembocaron en `logica_de_negocio.md`), pasando por bucles y evolución natural; **detectar saltos/alucinaciones** en el proceso y proponer reconciliaciones posibles.

---

## 1. Fuentes de trazabilidad (el árbol hacia atrás)

| Capa | Fuente | Rol en la trazabilidad |
|------|--------|------------------------|
| 0 | `arnes/diagnostico/logica_de_negocio.md` | **punto 0**: mapa de negocio, narrativas, invariantes, definiciones |
| 1 | `segunda_ronda_preguntas.md`, `cierre_diamante.md`, `loop2_y_retroalimentacion.md` | decisiones del Negocio tomadas por el Supervisor |
| 2 | `diamante2_discover_eventos.md`, `diamante2_define_eventos.md` | los **61 eventos** y 15 bounded contexts (qué dispara cada cosa) |
| 3 | `OLA_6_*.md` (GATES_SCHEMAS, FLAG4, METODOLOGIA_GRAFOS, SCHEMAS_APROBADOS) | esquema aprobado de Ola 6 (fuente de campo/schema) |
| 4 | `pasadas/d3_schema_*.md` (a1..a5, consolidado) | pasadas de normalización/determinismo/auditoría del schema |
| 5 | `d3_ui_b*.md` (B1..B5) | diseño de pantallas y su mapeo de datos a schema |
| 6 | `planes/plan_f4.md`, `plan_f5.md`, `plan_t-080.md`, `disenio_modulo_espacio.md` (ÚLTIMO) | planes de ejecución y decisiones nuevas (D-2026-08-07*) |

El **punto 0** es `logica_de_negocio.md`; TODO schema debe trazar hasta ahí sin saltos documentales.

---

## 2. Método de trazabilidad (validable y robusto)

Cada schema se traza con una **cadena ascendente verificable** campo-a-campo:

```
schema/tabla.campo  →  (origen)  →  evento/E-job que lo nace  →  pasada d3 que lo decide  →  fuente OLA_6  →  lógica de negocio (punto 0)
```

Reglas de validez (el subagente DEBE cumplirlas y reportarlas como structured output):
- **R1 — Origen por campo:** cada campo ANS a un `evento` (diamante2) o a una fuente explícita. Un campo sin origen = **sospecha de alucinación**.
- **R2 — Cadena sin saltos:** no puede haber un hueco de capa (ej: un campo en `modulos` que no exista en ninguna pasada previa ni en punto 0).
- **R3 — Conflicto entre fuentes:** si OLA_6 y el consolidado difieren (ej. `recepciones` vs `recepciones_material`; `fecha_recepcion_esperada` solo en gates), se reporta como **inconsistencia a reconciliar**, no se "resuelve" unilateralmente.
- **R4 — Punto 0 como ancla:** si el schema contradice la lógica de negocio (punto 0), es un **retroceso** (como el hallazgo del módulo jerárquico) y se marca crítico, no se descarta.

---

## 3. Bloque 1 — Subagente de ubicación del destino + agrupación autocdinámica

> **Corrección del Supervisor (2026-08-07):** NO predefinir lotes. Un primer subagente de escaneo resuelve primero **dónde vive** el schema aprobado y si es **verificable**, y sobre ese destino decide la agrupación.

**Paso 3.1 — Dispersión o consolidación (pre-requisito):** el subagente de escaneo responde, con citas:
- ¿Hay **un solo documento** que registre todos los schemas, o esto está **disperso** en una serie de `*.md`?
- ¿A **dónde apunta** el estado aprobado de los schemas? (¿`d3_schema_consolidado.md` es autoritativo? ¿hay un canon único de migración?)
- ¿Es **verificable**? (contra qué: `lib/db/schema.ts`? el consolidado D3? el contrato vivo A2-4?)

Salida 3a: reporte de **destino canónico** (archivo/es/ruta/s) con su verificabilidad y advertencias de dispersión.

**Paso 3b — agrupación de lotes decidida por el subagente:** sobre el **destino** de 3a, el subagente **decide él mismo cuántos lotes**, cuáles schemas están **más relacionados sistémica/relacionalmente**, y **diseña la ruta de trazabilidad** de los subagentes (orden, deps). No se impone un número fijo.

**Contrato del subagente de Bloque 1:** localizar → verificar → agrupar → diseñar ruta. NO traza aún (eso es Bloque 2).

---

## 4. Bloque 2 — Un subagente por lote-decidido (cada uno al origen, punto 0)

Se lanza **1 subagente por lote** (el nº que haya decidido el Bloque 1), cada uno con:
- la lista de tablas del lote (salida del Bloque 1),
- la ruta de trazabilidad asignada (del Bloque 1),
- la **metodología R1-R4**,
- y el **formato de salida estándar** (ver §5).

**Especialización:** cada subagente debe ir **al origen / punto 0** — las **primeras conversaciones con Javier** que originaron las primeras decisiones/inquietudes — y trazar el **hilo decisional** a través de:
1. primeras conversaciones → decisiones/inquietudes iniciales (origen, punto 0),
2. consolidación en **planes y estrategias** (Ola 6, D4, estrategias F0-F9, decisiones D-2026-08-07*),
3. **outputs** de esos planes/estrategias,
4. **consolidado actual** (`d3_schema_consolidado.md`, `plan_f4/f5`, `disenio_modulo_espacio.md`).

**Inyección del contrato de rol** (`arnes/roles/`): el subagente actúa como **Código/QA** verificación documental — NO diseña ni inventa, únicamente **rastrea** con cita de fuente y línea.

---

## 5. Formato de salida estándar (JSON) por lote

```json
{
  "lote": "L3",
  "generado_por": "<agente>",
  "fuentes_consultadas": ["..."],
  "tablas": [
    {
      "tabla": "catalogo_acabados",
      "origen_punto0": {"hallazgo": "grafo acabados", "fuente": "OLA_6_METODOLOGIA_GRAFOS.md:118"},
      "campos": [
        {
          "campo": "familia",
          "origen": "pintura/laminado/enchapado",
          "fuente": "OLA_6_METODOLOGIA_GRAFOS.md:121",
          "punto0_ref": "logica:356 (no acumular deuda)" ,
          "salto": null,
          "inconsistencia_archivo": "con report ...: campo o rango"
        }
      ],
      "decisiones_clave": ["D-2026-08-07-C", "grafo M-02"],
      "saltos_detectados": [],
      "reconciliaciones_propuestas": []
    }
  ],
  "veredicto_lote": "OK | CON_INCONSISTENCIAS | CON_SALTOS"
}
```

---

## 6. Bloque 3 — Cruce de resultados y consolidación

El Orquestador (o subagente general) cruza los JSON de los lotes, **detecta duplicaciones de decisiones** (ej. acabados en L3 vs L4 — vistas divergentes de un mismo master), marca inconsistencias trans-lote, y consolida en el **reporte final**:

**`arnes/diagnostico/trazabilidad_punto0/reporte_final.md`**
- OCDE por lote (con su arsenal de saltos/inconsistencias).
- **Catálogo de alucinaciones** detectadas (campos sin origen en el punto 0).
- **Catálogo de reconciliaciones** pendientes de decisión del Supervisor.
- **Red flags retroceso** (como el módulo jerárquico).
- Tabla de prioridades de validación.

---

## 7. Gates del proceso

1. **Gate A — aprobación de este método** (Supervisor): ✅ aprobado (2026-08-07) con la corrección de no predefinir lotes.
2. **Bloque 1** (subagente de escaneo): resuelve dispersión + destino canónico verificable + decide los lotes y la ruta. Salida a validar por el Orquestador (que el destino sea verificable, sin tablas huérfanas ni duplicadas entre lotes).
3. **Bloque 2** (subagentes por lote-decidido): cada salida JSON pasa validación de formato + citas presentes + referencia a punto 0.
4. **Bloque 3** (cruzar): consolida y el Supervisor revisa el reporte final, decide reconciliaciones.

**Nota:** no se modifica schema ni plan hasta que el Supervisor apruebe cada reconciliación.

---

## Referencias

- Pasadas de schema: `arnes/diagnostico/pasadas/d3_schema_*.md`
- Grafo acabados: `OLA_6_METODOLOGIA_GRAFOS.md`
- Planes F4/F5 y módulo jerárquico: `arnes/planes/plan_f4.md`, `plan_f5.md`, `disenio_modulo_espacio.md`
- Punto 0: `logica_de_negocio.md`