# Diamante 3 · Metodología del grafo Schema → UI (orquestado con subagentes, ejecución nocturna autónoma)

**Qué es esto:** la especificación del grafo de ejecución que transforma el **Define convergido y aprobado** (`diamante2_define_eventos.md`, 15 bounded contexts, 61 eventos, enforcement determinista) en dos entregables encadenados:
1. **Schema relacional aprobado** (Fase A: A1 divergir → A2 converger → A3 auditor final).
2. **Diseño de pantallas de alto detalle listo para React** (Fase B: B1 investigación → B2 destilación → B3 divergir pantallas → B4 converger auditoría → B5 auditor final).

El **checkpoint humano** es el entregable final de pantallas. **No hay checkpoints intermedios**: cada loop cierra por su **goal**, verificado por un **auditor final independiente** (que no ejecutó el loop).

---

## Gobernanza global (heredada del método C1-C6)

- Cada sub-agente es `opencode` **general** con **loop interno de 3 iteraciones** (bruta → autocrítica → refinamiento).
- Cada sub-agente **SOLO lee** sus fuentes y **SOLO escribe** su archivo de salida (serialización: nadie toca el Define, el mapa, el schema ni los outputs de otros).
- El Orquestador audita formato/trazabilidad entre olas, consolida, y aplica correcciones estructurales SOLO con el veredicto del auditor de esa fase.
- **Reapertura:** si un auditor final rechaza, se reabre solo el pase/contexto afectado (loop focalizado, máx 2 veces) — como no hay humano hasta la mañana, la escalación a Supervisor se registra en el ledger como `esperando_humano`, no detiene el grafo (se aplica el mejor juicio y se documenta).
- Trazabilidad obligatoria: `archivo:línea` en TODO hallazgo. Sin traza no es hallazgo.
- Escepticismo: nunca se inventa una regla de negocio; si un punto depende de intención del negocio no escrita, se marca `DECISION_PENDIENTE` y se documenta para el Supervisor.
- **Modelos:** usar cualquier modelo free disponible; si un subagente falla por límite de API, relanzar con otro modelo/intento. **La misión es no parar.**

---

## Reglas de serialización (archivos de salida únicos)

### Fase A — Schema
| Pase | Archivo de salida |
|---|---|
| A1-1 | `arnes/diagnostico/pasadas/d3_schema_a1_1_contextos.md` |
| A1-2 | `arnes/diagnostico/pasadas/d3_schema_a1_2_enforcement.md` |
| A1-3 | `arnes/diagnostico/pasadas/d3_schema_a1_3_roles.md` |
| A1-4 | `arnes/diagnostico/pasadas/d3_schema_a1_4_dinero.md` |
| A1-5 | `arnes/diagnostico/pasadas/d3_schema_a1_5_datos.md` |
| A2-1 | `arnes/diagnostico/pasadas/d3_schema_a2_1_normalizacion.md` |
| A2-2 | `arnes/diagnostico/pasadas/d3_schema_a2_2_determinismo.md` |
| A2-3 | `arnes/diagnostico/pasadas/d3_schema_a2_3_trazabilidad.md` |
| A2-4 | `arnes/diagnostico/pasadas/d3_schema_a2_4_contrato_vivo.md` |
| A2-5 | `arnes/diagnostico/pasadas/d3_schema_a2_5_parametros.md` |
| A3 | `arnes/diagnostico/pasadas/d3_schema_a3_auditor.md` |
| Consolidado | `arnes/diagnostico/pasadas/d3_schema_consolidado.md` |

### Fase B — UI
| Pase | Archivo de salida |
|---|---|
| B1-1 | `arnes/diagnostico/pasadas/d3_ui_b1_1_ux_ergonomia.md` |
| B1-2 | `arnes/diagnostico/pasadas/d3_ui_b1_2_responsive_design.md` |
| B1-3 | `arnes/diagnostico/pasadas/d3_ui_b1_3_inv_clasificacion.md` |
| B2-1 | `arnes/diagnostico/pasadas/d3_ui_b2_1_destilacion_inv.md` |
| B2-2 | `arnes/diagnostico/pasadas/d3_ui_b2_2_pantallas_requeridas.md` |
| B3-1 | `arnes/diagnostico/pasadas/d3_ui_b3_1_embudo_comercial.md` |
| B3-2 | `arnes/diagnostico/pasadas/d3_ui_b3_2_cronograma_gates.md` |
| B3-3 | `arnes/diagnostico/pasadas/d3_ui_b3_3_compras_taller_calidad.md` |
| B3-4 | `arnes/diagnostico/pasadas/d3_ui_b3_4_finanzas_compensacion.md` |
| B3-5 | `arnes/diagnostico/pasadas/d3_ui_b3_5_cliente_documentacion.md` |
| B4-1 | `arnes/diagnostico/pasadas/d3_ui_b4_1_determinismo_gates.md` |
| B4-2 | `arnes/diagnostico/pasadas/d3_ui_b4_2_roles_x_gates.md` |
| B4-3 | `arnes/diagnostico/pasadas/d3_ui_b4_3_detalle_implementabilidad.md` |
| B4-4 | `arnes/diagnostico/pasadas/d3_ui_b4_4_ux_responsive.md` |
| B5 | `arnes/diagnostico/pasadas/d3_ui_b5_auditor.md` |
| Consolidado | `arnes/diagnostico/pasadas/d3_ui_consolidado.md` |

---

## Fuentes maestras (rutas absolutas, leen todas las pasadas)

- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_define_eventos.md` — **la convergencia aprobada** (15 bounded contexts, 61 eventos, gates, enforcement, capa 1/2, decisiones D1-D8, valores numéricos resueltos). **Fuente primaria.**
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\diamante2_discover_eventos.md` — inventario de 61 eventos (estados, disparadores, datos que nacen).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\logica_de_negocio.md` — mapa maestro (Parte I negocio, Parte II implicaciones técnicas).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\cierre_diamante.md` — tesis, invariantes, bounded contexts del diamante 1.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\log_insights_fase2.md` — decisiones del Supervisor (I-024..I-054).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\arnes\diagnostico\pasadas\diamante2_define_consolidado.md` — veredicto del ciclo C1-C6 + checkpoint aprobado.
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\lib\db\schema.ts` — schema Drizzle existente (18 tablas) para **consistencia con lo ya construido** (cotizador, contratos, finanzas t-008..t-022).
- `C:\Users\javir\Documents\DEVs\empresa_muebles_clone-dev\lib\modules\` — queries/modules existentes (patrones de acceso a datos).
- `C:\Users\javir\Documents\DEVs\Arnes natural\` — carpeta de INV/INS (deep research) para B1-3.

---

## Formato de output (idéntico en cada pase)

```
# Pase {X} — {nombre del lente} (subagente, loop de 3 iteraciones)

## Iteración 1 (bruta)
{resultado crudo del lente}

## Iteración 2 (autocrítica)
{qué sobrevive, qué cae y por qué; qué se escapó en la pasada 1}

## Iteración 3 (refinamiento final)
{resultado final depurado}

## Entregable (tabla o secciones, según el pase)
{...}

## Trazabilidad / Notas para el Orquestador
{archivo:línea de cada afirmación; qué decide el siguiente pase}
```

**Clasificación de hallazgos (vocabulario del diamante 3):**
- `CORRECCION_SCHEMA` — el schema propuesto contradice el Define/mapa/schema existente.
- `GAP_SCHEMA` — entidad/columna/relación que falta para materializar un evento o gate.
- `RUIDO_SCHEMA` — columna/relación sin consumidor (anti-campos muertos tipo `score_conversion`).
- `NORMALIZACION` — violación FN/identidad/relación.
- `DECISION_PENDIENTE` — requiere decisión de negocio del Supervisor (no inventar).
- `DIFERIDO` — se registra, no se modela ahora (capa 2, palanca de demanda).
- `PANTALLA_FALTA` / `PANTALLA_AMBIGUA` / `PANTALLA_DETALLE_INSUFICIENTE` — auditorías de UI.
- `DETERMINISMO_OK` / `DETERMINISMO_ROTO` — auditorías de gates vs UI.

---

## Contrato de formato de pantalla (regla del método — el out que el Supervisor revisará mañana)

Todo diseño de pantalla (B3) DEBE especificar, por pantalla, en tablas:

1. **Encabezado:** nombre, ruta propuesta (`/app/erp/...`), bounded context(es), eventos E-XX que cubre, rol(es) que la usan.
2. **Wireframe estructural:** layout de regiones (header, filtros, tabla/formulario, acciones, notificaciones) en texto/ASCII.
3. **Elementos interactivos (TABLA):** cada botón/acción/input → `etiqueta | tipo | evento E-XX que dispara | transición de estado resultante | guard que aplica (rol) | rama negativa / mensaje de error | validación (zod/dato) | estado deshabilitado`.
4. **Elementos de texto (TABLA):** cada label, placeholder, empty state, mensaje de éxito/error → texto literal en español + cuándo aparece.
5. **Mapeo de datos (TABLA):** cada campo visual → `entidad.columna` (schema Drizzle) + formato (currency, fecha, enum) + fuente (¿cálculo? ¿evento?).
6. **Máquina de estados del gate:** qué acciones de UI disparan qué transiciones de los gates E-18/E-21/E-24/E-33/E-20 y qué se bloquea si el guard no pasa.
7. **Responsive + accesibilidad:** comportamiento en 3 breakpoints, objetivos táctiles ≥48px, `aria`, estados de foco.
8. **Aspectos de código React:** componentes a crear/reutilizar, props clave, hooks (estado/effect), server actions o API routes a llamar (`lib/modules/*` o `app/api/erp/*`), validación zod, manejo de error/loading.

El nivel de detalle debe permitir que un desarrollador **codifique la pantalla sin releer otra fuente**.

---

## El grafo (orden de ejecución)

```
Ola 1 (paralelo):  A1-1‖A1-2‖A1-3‖A1-4‖A1-5 ‖ B1-1‖B1-2‖B1-3
Ola 2 (paralelo):  A2-1‖A2-2‖A2-3‖A2-4‖A2-5 ‖ B2-1‖B2-2   ← necesita salidas de ola 1
Ola 3:             A3 (auditor final schema) + consolidado schema  ← necesita A2
Ola 4 (paralelo):  B3-1‖B3-2‖B3-3‖B3-4‖B3-5                       ← necesita A3 + B2
Ola 5 (paralelo):  B4-1‖B4-2‖B4-3‖B4-4                            ← necesita B3
Ola 6:             B5 (auditor final UI) + consolidado UI          ← necesita B4
Ola 7:             informe final para el Supervisor (checkpoint humano) + commits
```

---

## Goals de cierre (definen los límites de cada loop)

| Loop | Goal de cierre (verificado por auditor independiente) |
|---|---|
| A1 | 5 propuestas de schema, cada una con trazabilidad evento→tabla→columna 100% de los 61 eventos |
| A2 | 1 schema relacional convergido, 0 correcciones estructurales pendientes |
| A3 | Veredicto APROBADO contra goals duros (61/61 huella · 5 gates deterministas · 0 campos muertos · 0 contradicción contrato vivo · capa 1/2) |
| B1 | 3 sets de principios + inventario de INV clasificadas (VALIOSA/REFERENCIA/DESCARTADA) con razón |
| B2 | Reglas destiladas aplicables + inventario de pantallas requeridas (roles×gates) |
| B3 | 100% de pantallas requeridas con detalle según contrato de formato |
| B4 | 0 hallazgos estructurales pendientes en las 4 lentes |
| B5 | Veredicto APROBADO contra goals duros (100% pantallas · 100% gates con UI · roles×gates · 0 ambigüedad · UX destilado) |

---

## Registro

- Fecha: 2026-08-03 (noche) — ejecución autónoma sin checkpoints intermedios, aprobada por el Supervisor.
- Ledger: t-048 a t-073 (26 pases).
- Estado del diamante 2: Define convergido y aprobado (loop 2 de diseño ABIERTO). Este método ES el loop 2.
