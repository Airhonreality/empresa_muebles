# Pase B4-2 — Roles × gates (subagente, auditoría)

**Lente:** auditoría de la matriz roles × gates: quién ejecuta cada gate, quién ve cada pantalla, y si los guards de rol especificados en B3 son consistentes con el Define y con `d3_schema_a1_3_roles.md`.
**Rol:** sub-agente B4-2 del Diamante 3 (`met:55`). **Modo:** `opencode general`, loop interno de 3 iteraciones.
**Fuentes leídas (solo estas):** `d3_schema_consolidado.md` (sch_c) · `d3_ui_b2_2_pantallas_requeridas.md` (inv, matriz roles×pantallas 119-132) · `d3_ui_b3_1_embudo_comercial.md` (b3_1) · `d3_ui_b3_2_cronograma_gates.md` (b3_2) · `d3_ui_b3_3_compras_taller_calidad.md` (b3_3) · `d3_ui_b3_4_finanzas_compensacion.md` (b3_4) · `d3_ui_b3_5_cliente_documentacion.md` (b3_5) · `d3_schema_a1_3_roles.md` (roles) · `diamante2_define_eventos.md` (define) · `diamante3_metodologia.md` (met).
**Archivo de salida (único escrito):** `arnes/diagnostico/pasadas/d3_ui_b4_2_roles_x_gates.md`.
**Vocabulario:** `met:98-107`. Escepticismo: ningún guard se da por bueno sin verlo en la fuente citada.

---

## Iteración 1 (bruta)

Barrido: ¿quién dispara cada uno de los 5 gates y quién ve cada pantalla operativa?

| Gate | Rol que ejecuta (Define/D3) | Pantalla | Guard en B3 |
|---|---|---|---|
| E-18 | comercial (veredicto, D3) — desarrollador ejecuta desarrollo | P-08 | verificador único = `proyectos.verificador_id` |
| E-21 | desarrollador (checklist C3) | P-14 | verificadoPorRol='desarrollador' |
| E-24 | comercial (veredicto, D3) | P-17 | verificador único = `proyectos.verificador_id` |
| E-33 | gerente (decisión manual, define:79) | P-09 | gerente/comercial |
| E-20 | gerente (resuelve, define:87) | P-20 | gerente |

Roles tipados (roles:8/`sch_c:35`): comercial, diseñador, desarrollador, carpintero, auxiliar, instalador, gerente, contador + cliente externo.

---

## Iteración 2 (autocrítica — verificación por rol)

**¿El comercial puede ejecutar E-18 y E-24?** Es el verificador único por despacho (D3, `define:75,78,153`), designado en `proyectos.verificador_id` (P-12/P-06, b3_2). Los guards de B3-2 (P-08) y B3-3 (P-17) exigen `verificador_id = rol actual`. **Consistente.** Nota: el verificador es designación por proyecto, NO rol permanente (`roles:58`; `sch_c:35`) — no se agrega rol nuevo.

**¿El desarrollador ejecuta E-21?** `define:76` — recepción triple la hace el desarrollador; b3_3 P-14 fija `verificadoPorRol='desarrollador'`. **Consistente.**

**¿El gerente resuelve E-20 y E-33?** `define:87` (E-20 caja) y `define:79` (E-33 decisión manual). b3_4 (P-20) y b3_2 (P-09) fijan guard gerente. **Consistente.** El comercial también puede participar en E-33 (comercial decide con gerente) — b3_2 lo documenta.

**¿El contador solo lee?** `roles:249`/`logica:390-391` — lectura estricta (P-20/P-21/P-22/P-23). b3_4 P-23 es solo GET con guard rol=contador; P-20/P-21 marcan contador como lectura. **Consistente.** DP-04 (login propio vs sin sesión) sigue abierta — anotada para Supervisor.

**¿El cliente nunca toca el admin?** `roles:195` — solo E-60 frontstage; aislamiento por `clienteId` (`lib/modules/cuenta/queries.ts:53-88`). b3_5 F-07 respeta aislamiento. **Consistente.**

**¿Los roles de operación (carpintero/auxiliar) solo ven saldo?** `inv:127-128` — capa 2 sin pantallas de operación; solo P-22 (E-58, su saldo). b3_4 P-22: guard rol+socioId. **Consistente.**

**Decisiones pendientes que bloquean permisos (no estructurales):**
- DP-02 (rol `compras` vs gerente en P-13) — b3_3:H-B3-3-01.
- DP-04 (login contador) — b3_4:H-B3-4-01.
- DP transparencia por rol (H8) — comercial y caja/cronograma (b3_4:H-B3-4-05; inv:H-B2-2-03).
- H12 (pedidos anónimos, F-06) — b3_5:H-B3-5-01.

---

## Iteración 3 (refinamiento final)

- **Los 5 gates tienen dueño de rol único y consistente** con el Define y con la designación por `verificador_id`. Cero contradicciones estructurales.
- **Matriz roles × pantallas del inventario (inv:119-132) coincide** con los guards de B3 salvo en los puntos DP-02/DP-04/H8/H12, todos `DECISION_PENDIENTE` de Supervisor, ninguno estructural.
- **Sin hallazgos estructurales pendientes.** Cierre de loop B4-2.

---

## Entregable: matriz roles × gates (veredicto)

| Gate | Pantalla | Rol ejecutor | Rol(es) lectura | Guard en B3 | Veredicto |
|---|---|---|---|---|---|
| E-18 | P-08 | comercial (verific. único) | gerente, desarrollador | `verificador_id` | `DETERMINISMO_OK` |
| E-21 | P-14 | desarrollador | gerente | `verificadoPorRol='desarrollador'` | `DETERMINISMO_OK` |
| E-24 | P-17 | comercial (verific. único) | gerente, desarrollador | `verificador_id` + citación previa | `DETERMINISMO_OK` |
| E-33 | P-09 | gerente/comercial | desarrollador, instalador | decisión manual + causa | `DETERMINISMO_OK` |
| E-20 | P-20 | gerente | contador (lectura) | caja derivada servidor | `DETERMINISMO_OK` |

**Matriz roles × pantallas (muestra clave — total en inv:119-132):**

| Rol | Pantallas que ve | Guard crítico |
|---|---|---|
| comercial | P-01..P-05, P-06..P-11, P-13, P-16, P-17, P-18, P-20 (solo hecho), P-21, P-24, P-25, P-27..P-29, P-31 | verificador único E-18/E-24; visibilidad limitada H8 |
| gerente | todas P-01..P-31 | resuelve E-20/E-33 |
| desarrollador | P-06..P-11, P-13, P-14, P-15, P-16, P-17 (cita), P-24, P-26, P-27 | ejecuta E-21 |
| diseñador | P-04, P-22 (saldo E-58) | solo E-48 |
| carpintero/auxiliar | P-22 (saldo) | capa 2 |
| instalador | P-09 (ventana), P-10, P-18, P-19, P-25 | E-25/E-26/E-37/E-61 |
| contador | P-20/P-21/P-22 (lectura), P-23 | solo lectura (DP-04) |
| cliente | F-01..F-08 | aislamiento `clienteId` |

---

## Hallazgos

| ID | Tipo | Descripción | Fuente |
|---|---|---|---|
| H-B4-2-01 | `DECISION_PENDIENTE` | DP-02: ¿rol `compras` tipado o función del gerente en P-13? Resolver antes de B5 — toca la matriz de permisos de OC/pago | `b3_3:H-B3-3-01`; `inv:H-B2-2-02`; `roles:107,246` |
| H-B4-2-02 | `DECISION_PENDIENTE` | DP-04: login del contador (P-23) — ¿login propio o vista sin sesión? | `b3_4:H-B3-4-01`; `inv:H-B2-2-04`; `roles:249` |
| H-B4-2-03 | `DECISION_PENDIENTE` | Transparencia por rol (H8): qué ve el comercial de caja/cronograma interno (P-09/P-16/P-20) | `b3_4:H-B3-4-05`; `inv:H-B2-2-03` |
| H-B4-2-04 | `DECISION_PENDIENTE` | H12: pedidos anónimos en F-06 (checkout tienda) | `b3_5:H-B3-5-01`; `inv:H-B2-2-05` |
| H-B4-2-05 | NOTA | Verificador único = designación por proyecto (`proyectos.verificador_id`), NO rol permanente — no agregar `verificador` a roles tipados | `roles:58`; `sch_c:35` |

---

## Notas para el Orquestador

- **Contrato cumplido (met:55,91-96):** matriz roles × gates con veredicto por fila; 5/5 consistentes.
- **Para B5:** las 4 DP abiertas (H-B4-2-01..04) se escalan al Supervisor en el checkpoint humano; ninguna es estructural.
- **Para el checkpoint:** registrar las 4 DP como `esperando_humano` en el ledger.
- **Prohibido cumplido:** solo escribió `d3_ui_b4_2_roles_x_gates.md`.

## Registro

- Fecha: 2026-08-04 · Pase B4-2 (ola 5 — roles × gates).
- Archivo de salida: `arnes/diagnostico/pasadas/d3_ui_b4_2_roles_x_gates.md`.
- Veredicto: **5/5 gates con dueño de rol consistente** · 0 contradicciones estructurales · 5 hallazgos (4 DECISION_PENDIENTE, 1 nota).
