# Índice maestro de diagnostico/ — Organización del proceso Fase 1→Ola 7

**Función:** Mapa de lectura para entender qué documento corresponde a cada fase y qué está obsoleto.

**Estado:** 🔴 DESORGANIZADO (70+ archivos sin estructura clara). Propuesta de reorganización abajo.

---

## Fase 1 — Discover (Mapa inicial del negocio)

**Entrada:** Conversación inicial con Javier, inventario del legacy, estado actual.  
**Salida:** Mapa maestro + inventario de problemas.  
**Vigencia:** Registro histórico (no se actualiza).

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `logica_de_negocio.md` | Mapa maestro de flujo de negocio (Parte I: narrativa, diagramas) | ✅ **VIGENTE** | Primero |
| `loop2_y_retroalimentacion.md` | Loop de validación + hallazgos integrados | ✅ **VIGENTE** | Segundo |
| `cierre_diamante.md` | Convergencia del mapeo (tesis, invariantes, bounded contexts) | ✅ **VIGENTE** | Tercero |
| `inventario_legacy.md` | Auditoría del sistema Agnostic viejo | ⚪ Histórico | Referencia si toca legacy |
| `auditoria_neon.md` | Auditoría técnica de infraestructura | ⚪ Histórico | Referencia si toca Neon |
| `diagnostico_de_proceso.md` | Estado de DOCS VETA (carpeta previa del Supervisor) | ⚪ Histórico | Contexto solo |

---

## Fase 2 — Define (Double Diamond: Discover→Define del flujo de negocio)

**Entrada:** Mapa (Fase 1) + ciclos de profundización.  
**Salida:** 61 eventos, 15 bounded contexts, decisiones estructurales.  
**Vigencia:** Contrato vivo (se actualiza en cada checkpoint).

### Discover 2 (Inventario de eventos)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `diamante2_discover_eventos.md` | Inventario de 61 eventos (versión convergida) | ✅ **VIGENTE** | Referencia para esquema |
| `diamante2_loop_apertura.md` | Segunda pasada Discover (adiciones, refuerzos) | ⚪ Histórico | Context solo |
| `segunda_ronda_preguntas.md` | 21 preguntas al Supervisor + respuestas brutas | ⚪ Histórico | Trazabilidad |

### Define 2 (Convergencia de eventos a bounded contexts)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `diamante2_define_eventos.md` | Define: 61 eventos → 15 contextos, gates decididos | ✅ **VIGENTE** | Referencia para gates |
| `diamante2_define_consolidado.md` | Auditoría C1-C6 del Define (0 cambios de contexto) | ⚪ Histórico | Si revisar auditoría |
| `log_insights_fase2.md` | Log acumulativo de hallazgos (I-001 a I-053) | ✅ **VIGENTE** | Decisiones del Supervisor |

### Pasadas sistémicas (P2-P8)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/pasada2_invariantes.md` | Lente: invariantes del sistema | ⚪ Histórico | Si auditar completitud |
| `pasadas/pasada3_flujo_datos.md` | Lente: flujo de datos | ⚪ Histórico | Idem |
| `pasadas/pasada4_carga_rol.md` | Lente: carga de rol | ⚪ Histórico | Idem |
| ... (pasada5-8) | Lentes: tiempo, tesis eventos, arquetipos, excepciones | ⚪ Histórico | Idem |
| `pasadas/diamante2_panorama_consolidado.md` | Consolidado de 61 hallazgos únicos (P2-P8) | ⚪ Histórico | Si auditar fuentes |
| `pasadas/diamante2_metodologia_pasadas.md` | Metodología de las 7 pasadas | ⚪ Histórico | Referencia metodológica |

---

## Fase 3 — Diamante 3 (Schema y UI de capa 1)

**Entrada:** Define convergido (61 eventos, 15 contextos) + decisiones del Supervisor.  
**Salida:** 65 tablas relacionales + 34 pantallas core especificadas.  
**Vigencia:** Contrato vivo (se codifica en Ola 7).

### Schema A1 (Divergencia)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/d3_schema_a1_1_contextos.md` | Divergencia: 15 contextos → tablas candidate | ⚪ Histórico | Trazabilidad de A1 |
| `pasadas/d3_schema_a1_*.md` (1-5) | Divergencia por tema | ⚪ Histórico | Idem |

### Schema A2 (Convergencia)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/d3_schema_a2_1_normalizacion.md` | Convergencia: 65 tablas normalizadas | ⚪ Histórico | Trazabilidad de A2 |
| `pasadas/d3_schema_a2_2_determinismo.md` | Verificación de 5 gates deterministas | ⚪ Histórico | Si revisar gates |
| `pasadas/d3_schema_a2_3_trazabilidad.md` | Huella 61/61 eventos → tablas | ⚪ Histórico | Idem |
| `pasadas/d3_schema_a2_4_contrato_vivo.md` | Plan de migración en 4 fases | ✅ **VIGENTE** | Para Ola 7 ejecución |
| `pasadas/d3_schema_a2_5_parametros.md` | 26 parámetros core + 6 marca | ⚪ Histórico | Referencia |

### Schema A3 (Auditoría final)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/d3_schema_a3_auditor.md` | Auditoría A3: 0 campos muertos, 5/5 gates OK | ⚪ Histórico | Si revisar auditoría |
| `pasadas/d3_schema_consolidado.md` | **CONSOLIDADO FINAL SCHEMA** | ✅ **VIGENTE** | Referencia maestra para Ola 7 |

### UI B1-B5 (Investigación→Diseño→Auditoría)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/d3_ui_b1_*.md` | B1: Investigación (UX, responsive, clasificación) | ⚪ Histórico | Referencia metodológica |
| `pasadas/d3_ui_b2_*.md` | B2: Destilación (40 reglas, 34 pantallas) | ⚪ Histórico | Idem |
| `pasadas/d3_ui_b3_*.md` | B3: Especificación (34 pantallas × 8 secciones) | ⚪ Histórico | Si revisar diseño detalle |
| `pasadas/d3_ui_b4_*.md` | B4: Auditoría 4 lentes | ⚪ Histórico | Si revisar auditoría |
| `pasadas/d3_ui_b5_auditor.md` | B5: Auditor final — veredicto APROBADO | ⚪ Histórico | Si revisar cierre |
| `pasadas/d3_ui_consolidado.md` | **CONSOLIDADO FINAL UI** | ✅ **VIGENTE** | Referencia maestra para Ola 7 |

### Consolidado Diamante 3

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `pasadas/diamante3_metodologia.md` | Metodología del Diamante 3 (A1-A3, B1-B5) | ⚪ Histórico | Referencia |

---

## Fase 2 Ronda 3 — Decisiones respondidas (2026-08-04)

**Entrada:** 16 decisiones pendientes de Diamante 3.  
**Salida:** Respuestas del Supervisor, esquemas de catálogos, subsistema de LOGS.  
**Vigencia:** Vigente para Ola 7.

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `fase2_ronda3_decisiones_respondidas.md` | Sistematización de 16 respuestas (raíz) | ✅ **VIGENTE** | Entrada a Ola 6 |
| `pasadas/fase2_ronda3_decisiones_respondidas.md` | (Duplicado en pasadas) | ⚪ Redundante | Eliminar |

---

## Ola 6 — Metodologías bloqueantes (2026-08-04 en curso)

**Entrada:** Decisiones respondidas + respuesta sobre logs robustos.  
**Salida:** Schemas de catálogos relacionales + subsistema de LOGS + validación de gates.  
**Vigencia:** Vigente (cierre antes de Ola 7).

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `OLA_6_METODOLOGIA_GRAFOS.md` | Propuesta de grafos relacionales (7 grafos) | ✅ **APROBADO** | Referencia |
| `OLA_6_SCHEMAS_APROBADOS.md` | Schemas core aprobados (7 schemas) | ✅ **APROBADO** | Referencia |
| `OLA_6_GATES_SCHEMAS.md` | Auditoría de schemas vs 5 gates | ✅ **COMPLETO** | Validación |
| `PROXIMA_FASE_DEFINE.md` | (Antiguo, antes de reorganización) | 🔴 **OBSOLETO** | Eliminar |

### FLAG-4 — Estructura de catálogos (2026-08-04)

| Archivo | Contenido | Vigente | Lectura |
|---|---|---|---|
| `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` | Decisión FLAG-4 APROBADA: base + 3 especializaciones (tienda, insumo, herramienta) | ✅ **VIGENTE** | Para t-075 (crear tablas de catálogos) |

---

## Propuesta de reorganización

```
arnes/diagnostico/
├─ _INDICE_MAESTRO.md (este archivo)
├─ FASE_1_DISCOVER/
│  ├─ logica_de_negocio.md ✅
│  ├─ loop2_y_retroalimentacion.md ✅
│  ├─ cierre_diamante.md ✅
│  └─ [histórico]/ (inventario_legacy, auditoria_neon, etc.)
│
├─ FASE_2_DEFINE/
│  ├─ diamante2_discover_eventos.md ✅
│  ├─ diamante2_define_eventos.md ✅
│  ├─ log_insights_fase2.md ✅
│  └─ pasadas/ (P2-P8, consolidados)
│
├─ FASE_3_DIAMANTE3/
│  ├─ d3_schema_consolidado.md ✅
│  ├─ d3_ui_consolidado.md ✅
│  └─ pasadas/ (A1-A3, B1-B5, todas las auditorías)
│
├─ OLA_6_CIERRE/ (NUEVA CARPETA)
│  ├─ ronda3_decisiones_respondidas.md ✅
│  ├─ ola6_schemas_aprobados.md ✅
│  ├─ ola6_subsistema_logs.md ⏳ FALTA
│  ├─ ola6_gates_validacion.md ✅
│  └─ OLA_7_ENTRADA.md (punto de entrada única a Ola 7)
│
└─ [archivo por eliminar]
   └─ PROXIMA_FASE_DEFINE.md (reemplazar por OLA_7_ENTRADA.md)
```

---

## Acción inmediata

**Antes de crear MÁS documentos:**

1. ✅ **Subsistema de LOGS robusto** — Crear `OLA_6_SUBSISTEMA_LOGS.md`
2. ✅ **Entrada única a Ola 7** — Crear `OLA_6_CIERRE/OLA_7_ENTRADA.md`
3. 🗑️ **Eliminar duplicados/obsoletos** — PROXIMA_FASE_DEFINE.md
4. 📝 **Actualizar INDEX.md** — Apuntar a este maestro

**Después:** Ola 7 comienza leyendo solo `OLA_7_ENTRADA.md`, punto de entrada único.

---

**¿Aprobado este plan de reorganización antes de continuar?**

