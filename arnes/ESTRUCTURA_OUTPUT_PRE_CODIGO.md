# ESTRUCTURA DEL OUTPUT PRE-CODIGO

**Contrato vivo.** Define el paquete de diseño cerrado que desbloquea la fase de codificación (salida de la banda F0–F9).

---

## 1. Principio rector

```
REGISTRO_DE_ENTIDADES (CLASE — define una vez)
       ↑ referencia, nunca duplica
       │
  ┌────┴──────────────────────────┐
  │                               │
  diseño_PXX.md              plan_fX.md
  (INSTANCIA pantalla)       (INSTANCIA schema / hardening / QA)
```

El `REGISTRO_DE_ENTIDADES.md` es la fuente única de verdad del schema. Las plantillas **citan** las entidades que consumen — nunca las redefinen. Si un campo cambia, se actualiza en UN solo lugar (el registro) y todos los artefactos heredan el cambio por referencia.

**Tres tipos de fase, tres contratos de salida:**

| Tipo | Fases | Plantilla | Output |
|---|---|---|---|
| **Schema / Lógica** | F0, F1 | Formato libre (entidades nuevas, migración aditiva, helpers, seed, tests de contrato) | `plan_f0.md`, `plan_f1.md` |
| **Pantallas** | F2–F7 | `PLANTILLA_PANTALLA.md` (7 secciones: entidades, estados, vocabulario, reglas, componentes, comportamiento, criterios) | `disenio_PXX.md` |
| **Hardening / QA** | F8, F9 | `PLANTILLA_HARDENING.md` (migración de tipos, backfill, código impactado, orden de ejecución) / `PLANTILLA_QA.md` (gates, trazabilidad, checklist de corte, evidencia mecánica) | `plan_f8.md`, `plan_f9.md` |

---

## 2. Inventario de artefactos por fase

Cada fase F0–F9 entrega su plan según su tipo. Al completar la banda, el paquete completo es:

**Actualizado 2026-08-08 — matryoshka por línea de trabajo** (ver `arnes/lineas/REGISTRO_LINEAS.md`). El árbol de abajo es el de la línea técnica (Ola 6/7, la que produce este paquete pre-código); `arnes/nucleo/` es compartido con cualquier otra línea (hoy: `arnes/lineas/demanda/`).

```
arnes/
├── nucleo/                                    ← Compartido entre TODAS las líneas
│   ├── REGISTRO_DE_ENTIDADES.md               ← Schema canónico (~60 entidades)
│   ├── logica_de_negocio.md                   ← Punto 0 (mapa del negocio)
│   └── glosario_h07.md                        ← Vocabulario de UI (labels, estados)
├── MODELOS.md                                  ← Stack de modelos free
├── ESTRUCTURA_OUTPUT_PRE_CODIGO.md             ← Este documento
│
└── lineas/ola7/                             ← Línea Ola 6/7 (la que produce este paquete)
    ├── plan_ola7_maestro.md                    ← Plan maestro F0–F9
    ├── plan_alineacion.md                      ← Doctor de la línea técnica
    │
    ├── pantallas/                              ← Pantallas (F2–F7)
    │   ├── PLANTILLA_PANTALLA.md               ← Template tipo PANTALLA
    │   ├── disenio_p01_kanban_comercial.md
    │   ├── disenio_p02_nueva_cotizacion.md
    │   ├── disenio_p04_cotizador.md
    │   └── ... (resto de disenio_PXX/FXX.md)
    │
    ├── tecnico/                                ← Schema/Lógica F0–F1 + Hardening/QA F8–F9
    │   ├── PLANTILLA_HARDENING.md               ← Template tipo HARDENING (F8)
    │   ├── PLANTILLA_QA.md                      ← Template tipo QA (F9)
    │   ├── m06_capa_tecnica_transversal.md       ← 14 patrones técnicos L1
    │   ├── plan_t-074.md                        ← F0 Cimientos (roles, params, eventos, audit)
    │   ├── plan_t-075.md                        ← F1 Catálogos FLAG-4
    │   ├── plan_t-080.md                        ← F3 schema (cronograma/gates)
    │   ├── plan_f8.md                           ← (sin escribir aún) Migración de tipos, backfill, deprecación roles
    │   └── plan_f9.md                           ← (sin escribir aún) Verificación gates, trazabilidad, corte
    │
    ├── plan_f4.md, plan_f5.md, plan_f6.md, plan_f7.md  ← Hallazgos + decisiones por fase (F4-F7)
    └── archivo/                                 ← Histórico de la línea (pasadas/, trazabilidad_punto0/, diamante2_*, OLA_6/7)
        └── trazabilidad_punto0/
            ├── CIERRE_BUCLE_TRAZABILIDAD.md
            └── decisiones_cerradas.md            ← 6/6 decisiones del Supervisor

arnes/tareas/                                     ← Ledger (compartido entre líneas)
```

---

## 3. Plantillas de diseño (obligatorias)

Cada fase usa la plantilla que corresponde a su tipo. Ninguna fase se salta su plantilla.

### 3.1 PLANTILLA_PANTALLA.md — Fases de diseño de pantallas (F2–F7)

Toda pantalla P-XX se diseña siguiendo esta plantilla. Secciones requeridas:

| Sección | Contenido | Verificable |
|---|---|---|
| 1. Entidades que consume | Tabla: entidad → § del REGISTRO_DE_ENTIDADES → uso en esta pantalla | `grep` en REGISTRO confirma que la entidad existe |
| 2. Estados que transiciona | Origen → acción → destino → gate | `grep` en REGISTRO confirma que los estados existen |
| 3. Vocabulario H07 | Label natural → código interno | `grep` en glosario_h07.md confirma consistencia |
| 4. Reglas de negocio | Regla + validación | Criterio ejecutable (test, fórmula) |
| 5. Componentes UI | Componente + props + entidad asociada | `grep` en tokens D4 + M-06 L1 |
| 6. Comportamiento | Evento + gatillo + acción + side effect | Trazable a evento del diamante2 |
| 7. Criterios de aceptación | Verificables mecánicamente (comando, test) | QA ejecuta y pega output crudo |

### 3.2 PLANTILLA_HARDENING.md — Fases de migración técnica (F8)

Toda fase de hardening sigue esta plantilla. Secciones requeridas:

| Sección | Contenido | Verificable |
|---|---|---|
| 1. Inventario de migración de schema | Columna → tipo actual → tipo destino → backfill | `information_schema.columns` en dev-local confirma tipos post-migración |
| 2. Módulos de código impactados | Archivo, línea, código actual → nuevo | `grep` en archivos listados confirma que existen y contienen el código actual |
| 3. Orden de ejecución | Secuencia estricta con dependencias | Cada paso solo usa artefactos de pasos anteriores |
| 4. Integraciones diferidas | Placeholders de fases previas a activar | Confirmación del Supervisor de que el subsistema externo está listo |
| 5. Verificación post-hardening | Comandos ejecutables con output esperado | QA ejecuta y pega output crudo |
| 6. Criterios de aceptación | Verificables mecánicamente | Cero regresiones, tipos correctos, sin pérdida de datos |

### 3.3 PLANTILLA_QA.md — Fases de verificación y corte (F9)

Toda fase de QA sigue esta plantilla. Secciones requeridas:

| Sección | Contenido | Verificable |
|---|---|---|
| 1. Gates a verificar | Predicado SQL + datos de prueba + resultado esperado | 3 escenarios por gate (bloquea, permite, borde) |
| 2. Trazabilidad de eventos | 61 eventos → query de audit_logs | Entrada de auditoría existe para cada evento |
| 3. Checklist de corte | 10 condiciones del gate de salida | Evidencia por condición (no opinión) |
| 4. Evidencia mecánica | Output crudo de tsc, eslint, build, tests, migrate | QA pega el output textual completo |
| 5. Reporte de hallazgos | Bugs encontrados con severidad y estado | Reproducible, archivo concreto, stack trace |
| 6. Veredicto | Gates + trazabilidad + checklist + evidencia | APROBADO / RECHAZADO con firma |

---

## 4. CHECKLIST — Gate de salida a codificación

Solo cuando TODAS las condiciones están en verde, se sale de F0–F9 y se comienza a codificar:

| # | Condición | Dueño | Evidencia |
|---|---|---|---|
| 1 | `REGISTRO_DE_ENTIDADES.md` sin contradicciones internas | QA Fase 4 Ciclo H | `grep` de nombres duplicados, FKs huérfanas |
| 2 | 6/6 decisiones de negocio cerradas (A.1–A.6) | Supervisor | `decisiones_cerradas.md` ✅ |
| 3 | 10/10 decisiones técnicas axiomatizadas (B.1–B.10) | Orquestador | `decisiones_cerradas.md` ✅ |
| 4 | Plan de cada fase F0–F9 aprobado según su tipo | Supervisor | `ls arnes/lineas/ola7/plan_f*.md arnes/lineas/ola7/tecnico/plan_t-*.md arnes/lineas/ola7/tecnico/plan_f{8,9}.md` |
| 5 | Artefactos de cada tipo completos: pantallas con PLANTILLA_PANTALLA, hardening con PLANTILLA_HARDENING, QA con PLANTILLA_QA | Iniciador + Supervisor | `grep -c "Entidades que consume" arnes/lineas/ola7/pantallas/disenio_*.md` + `grep -c "Inventario de migración" arnes/lineas/ola7/tecnico/plan_f8.md` + `grep -c "Gates a verificar" arnes/lineas/ola7/tecnico/plan_f9.md` |
| 6 | 5 gates documentados (E-18, E-20, E-21, E-24, E-33) con predicados | QA | `grep` en planes confirma predicados SQL |
| 7 | Glosario H07 etiqueta toda entidad y estado | Iniciador | `grep -c` en glosario ≥ N entidades+estados |
| 8 | M-06 L1 (14 patrones) declarados y ubicados | Iniciador | `m06_capa_tecnica_transversal.md` |
| 9 | Migración de schema validada: `drizzle-kit generate` sin errores contra REGISTRO | QA | `npm run db:generate` output crudo |
| 10 | Checkpoint final del Supervisor | Supervisor | Veredicto explícito |

El checkpoint #10 dispara `dev → main` y el inicio de codificación.

---

## 5. Proceso de actualización de schema

Si durante el diseño de F5–F9 surge un nuevo campo, entidad o naming:

1. **El Iniciador detecta la necesidad** en su plan de fase
2. **Propone la adición** como parte del diseño de su fase (citando el REGISTRO)
3. **El Supervisor aprueba** el diseño
4. **Se actualiza el REGISTRO_DE_ENTIDADES.md** (la fila afectada) en el MISMO commit que el plan — contrato vivo §2.C
5. **Si la adición crea colisión de naming**, se traza contra el REGISTRO existente (que ya es el canon, por lo que gana el registro)
6. **No se reabre el bucle de trazabilidad** — el REGISTRO es la fuente de verdad; solo se verifica que la adición no contradiga decisiones cerradas

---

## 6. Distinción contrato vivo vs. registro histórico (ARNES §2.C)

| Documento | Tipo | Se actualiza |
|---|---|---|
| `REGISTRO_DE_ENTIDADES.md` | Contrato vivo | En el MISMO commit que el código/diseño que lo toca |
| `ESTRUCTURA_OUTPUT_PRE_CODIGO.md` | Contrato vivo | Si cambia la plantilla o el checklist de gate |
| `PLANTILLA_PANTALLA.md` | Contrato vivo | Si evoluciona el formato de diseño de pantallas |
| `PLANTILLA_HARDENING.md` | Contrato vivo | Si evoluciona el formato de hardening/migración |
| `PLANTILLA_QA.md` | Contrato vivo | Si evoluciona el formato de QA y corte |
| `plan_alineacion.md` | Contrato vivo | Al detectar nueva desalineación entre docs vivos y proceso real |
| `decisiones_cerradas.md` | Registro histórico | Nunca (si hay nueva decisión, se escribe una nueva) |
| `CIERRE_BUCLE_TRAZABILIDAD.md` | Registro histórico | Nunca |
| `plan_hygiene_ciclo_h.md` | Registro histórico | Nunca (tiene nota del renombre) |
| `reporte_bloque1_fase1.md` | Registro histórico | Nunca |
| `reporte_final_bloque3.md` | Registro histórico | Nunca |
