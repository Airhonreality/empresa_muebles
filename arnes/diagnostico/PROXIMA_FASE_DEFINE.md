# Próxima fase — Define y Execute (2026-08-04)

**Estado:** Fase 0 (decisiones) COMPLETADA. 14/16 decisiones cerradas, 2 pendientes de confirmación contable (no bloquean). 5 mini-diamantes abiertos (no bloquean). Listo para Ola 7 (Execute).

---

## Decisiones respondidas (Fase 0)

### D-01: Rol `compras` — rol tipado dedicado
- **Respuesta:** Sí, rol `compras` tipado en `roles`. Gerente = suma de roles (gerente + compras + otros). Personas se asignan roles; al cambiar de cargo, se reasignan.
- **Impacto:** `roles` tabla + fila `compras`, `personas_roles` N:N, `erp-nav.ts` módulo `compras`, gate E-20, `require-rol.ts` soporta array de roles.

### D-02: Login del contador — cuenta propia
- **Respuesta:** Cuenta propia con rol `contador`. Gerente (RRHH) crea invitación con rol pre-asignado; contador completa datos y crea password.
- **Impacto:** `usuarios` + `tokenInvitacion`, `/registro?token=`, `requireEmpleado` para P-23.

### D-03: Transparencia por rol (H8)
- **Respuesta:** Permisos sumativos por rol asignado. Gerente ve todo. Comercial ve sus proyectos + leads entrantes (<5 min). Diseñador aislado solo a sus proyectos/clientes. Nuevo rol `disenador`.
- **Impacto:** `erp-nav.ts` filtrado por suma de roles, P-09/P-16/P-20 con aislamiento por rol.

### D-04: Checkout anónimo (H12)
- **Respuesta:** No anónimo. Cuenta obligatoria para checkout. Anónimo solo para agendamiento WP (F-03).
- **Impacto:** F-06 requiere `requireCliente`, F-03 permanece público.

### D-05: Base comisión — subtotal sin IVA
- **Respuesta:** Subtotal sin IVA. La comisión es sobre el valor del trabajo, no sobre el impuesto.
- **Impacto:** Parámetro `base_comision_tamano = 'subtotal_sin_iva'`, P-22 muestra base de cálculo.

### D-06: Alojador de documentos (DP-09)
- **Respuesta:** Drive para SKP/SDK mobiliario. R2 para imágenes exportadas (JPG/espacio/módulo). Excel de herrajes eliminado → absorbido por pantalla del sistema con gate + catálogo.
- **Impacto:** `documentos_proyecto.alojador` enum, upload R2, pantalla definición de proyecto por espacios.

### D-07: Valores numéricos compensación (DP-01)
- **Respuesta:** Estimados como v1. Comisión cierre 5%, módulo 5%, tarifa carpintero 15k COP/h, auxiliar 6.5k COP/h, reducción retraso 0.5%/día (máx 5%). Pendiente confirmación contador para retención e IVA diseño.
- **Impacto:** `parametros` tabla con 10 claves, `parametros_historial` versionado, panel de administración.

### D-08: Catálogo insumos vs producto (DP-05)
- **Respuesta:** Metodología de grafos requerida. Entidades simples relacionadas: tabla de costos proveedores, catálogo productos/servicios, catálogo herrajes (compra + presentación), productos→colores→acabados, insumos→productos terminados.
- **Impacto:** Nuevas tablas: `catalogo_herrajes`, `productos_colores`, `productos_acabados`, `insumos_producto`. Mini-diamante M-02.

### D-09: Deprecación rolEmpleado (DP-03)
- **Respuesta:** Migrar código existente al nuevo schema, no levantar de 0. Transición coordinada Fase 4.
- **Impacto:** `personas_roles` con backfill desde `usuarios.rolEmpleado`, deprecación gradual.

### D-10: Determinismo causal E-33 (DP-04)
- **Respuesta:** Metodología para determinismo con justificación humana natural. Verificador valida/rechaza composición causal con justificación textual.
- **Impacto:** `desfases_cronograma` + columnas `verificadoPor`, `verificadoEn`, `justificacion_rechazo`. Mini-diamante M-01.

### D-11: Grafos de composición (DP-05/schema)
- **Respuesta:** Metodología de grafos para composición de entidades: insumo→producto→proyecto, herrajes como catálogo dual (compra + presentación).
- **Impacto:** Grafo implementado como relaciones FK en Drizzle. Mini-diamante M-02.

### D-12: Espejar parámetros en eventos (DP-07)
- **Respuesta:** Logs robustos como sub-sistema de observabilidad. Cada cambio de parámetro, evaluación de gate, y acción de usuario → evento en `eventos`. KPIs derivan del log.
- **Impacto:** `eventos` tipos expandidos, sub-sistema KPIs, panel P-23 alimentado desde `eventos`. Mini-diamante M-04.

### D-13: Fuente SLA/holgura (DP-08)
- **Respuesta:** Derivar del grafo de composición de proyecto. SLA y holgura no son valores sueltos sino consecuencia de módulos activos, dependencias, cantidad de espacios.
- **Impacto:** Mini-diamante M-03 (derivación de parámetros desde factores de proyecto).

### D-14: Marca/legal editable (DP-09/schema)
- **Respuesta:** Panel de parametrización general en ERP, editable desde el logo. 6 claves de marca en `parametros`.
- **Impacto:** `/app/erp/configuracion` (nueva ruta), `parametros` con 6 claves de marca, `lib/seo/jsonld.ts` lee en tiempo real.

### Pendientes de confirmación (A-01 — no bloquean corte):
- `umbral_novedad_check15`: unidad (días, horas, %). Estimado: ≥3 días.
- `recargo_hora_extra_pct`: revisar legal Colombia 2026.
- `neto_diseno_3d_pct`: ($130k − retención − IVA) → validar contador.
- `iva_diseno_3d_pct`: tasa IVA diseño (puede ser especial) → validar contador.
- Valores de marca (nombre, NIT, dirección, teléfono, horario): input Supervisor.

---

## Qué falta para abrir la Ola 7 (Execute)

### 1. Confirmación de checkpoint (Supervisor, 5 min)

Revisar las decisiones respondidas y confirmar:
- 14 de 16 decisiones cerradas ✅
- 2 pendientes de confirmación contable (A-01: retención diseñador, IVA diseño 3D) — no bloquean ✅
- 5 mini-diamantes abiertos (M-01 a M-05) — no bloquean ✅
- Parámetros v1 están bien como punto de partida ✅

### 2. Aclaración de parámetros faltantes (Supervisor + Orquestador, 15 min)

Definir valores concretos para:

| Parámetro | Tipo | Fuente | Notas |
|---|---|---|---|
| `umbral_novedad_check15_dias` | int | A-01 | ¿Qué desfase dispara? Ej. "≥3 días" |
| `recargo_hora_extra_pct` | float | A-01 | Revisar Ministerio Trabajo Colombia 2026 |
| `neto_diseno_3d_pct` | float | A-01 | ($130k − retención − IVA) → validar contador |
| `iva_diseno_3d_pct` | float | A-01 | Tasa IVA diseño (puede ser especial) → validar contador |
| Marca (6 campos) | string | D-14 | Nombre, NIT, razón social, dirección, teléfono, horario |

**Responsable:** Supervisor da valores o rangos; Orquestador valida formato para `parametros.sql`.

### 3. Sesiones de mini-diamante (paralelo a Ola 7, no bloqueante)

| Mini-diamante | Sesión | Duración | Prepara |
|---|---|---|---|
| M-01 Causalidad | Orquestador + Supervisor | 2h | Protocolo de auditoría automática de desfases |
| M-02 Grafos catálogo | Orquestador | 1h | Esbozo de modelo relacional insumo→producto |
| M-03 Derivación parámetros | Supervisor + Orquestador | 1h | Tabla de factores que afectan comisiones |
| M-04 Logging/KPIs | Orquestador | 2h | Diseño de `eventos` como observabilidad |
| M-05 Modularización | Supervisor + equipo producción | 3h | Inventario de procesos elementales |

**Timing:** M-01 antes de ejecutar P-09 (cronograma), M-04 antes de t-034 (KPIs).

---

## Ola 7 — Execute architecture (post-checkpoint)

### Fase 3.1 — Codificación base (semana 1–2)

**Responsable:** Código (agente especializado, por zona)

**Inputs:**
- `d3_schema_consolidado.md` (65 tablas, predicados gates)
- `d3_ui_consolidado.md` (34 pantallas, 8 secciones)
- `fase2_ronda3_decisiones_respondidas.md` (parámetros, roles)
- Plan de migración CC-01..CC-10 (`d3_schema_a2_4_contrato_vivo.md`)

**Ejecución por zona (paralelo):**
1. **Transversal (tablas core):** `roles`, `personas`, `personas_roles`, `usuarios`, `parametros`, `eventos`, `verificaciones`, `excepciones_gate`
2. **Comercial/Cotizador:** `leads`, `clientes`, `proyectos`, `cotizaciones`, `diseños3d`, `conversaciones`, `citas`, `visitas`
3. **Contratos:** `contratos`, `hitos_pago`, `firmas_contrato`, `disponibilidad_cliente`, `cambios_contrato`
4. **Cronograma:** `cronogramas`, `cronograma_etapas`, `desfases_cronograma`, `novedades_criticas`, `check_15_dias`, `comunicaciones_progreso`, `estimaciones`
5. **Desarrollo:** `schemas_proyecto`, `bom_materiales`, `retomas`, `reprocesos`
6. **Compras:** `ordenes_compra`, `items_orden_compra`, `recepciones`
7. **Taller (capa 1):** `fila_taller` (P-16, minimal, puntos de articulación)
8. **Calidad:** `tareas_calidad`, `veredictos_calidad`
9. **Finanzas:** `cuentas_financieras`, `obligaciones_pendientes`, `movimientos`, `compensaciones`, `arriendos`
10. **Datos maestros:** Actualizar `productos_catalogo`, `proveedores`, `espacios`, etc.

**Patrón de implementación (b4_3):**
- Atomicidad `eventos`+mutación en tx
- Gates evaluados en servidor (nunca cliente)
- Caja derivada en servidor (`GET /api/erp/caja` calcula real-time)
- Componentes 'use client' aislados de Server Components

**Verificación por zona:**
- `tsc --noEmit` limpio
- `npx eslint .` limpio
- Tests unitarios para lógica de gates (E-18/E-21/E-24/E-33/E-20)
- `npm run db:migrate` limpio en dev-local

### Fase 3.2 — Codificación de pantallas (semana 3–4)

**Responsable:** Código (agente especializado, por familia)

**Familias de pantallas (en paralelo):**
- **B3-1 (Comercial/Cotizador):** P-01..P-08 + F-01, F-02, F-03, F-08 (9 pantallas)
- **B3-2 (Cronograma/Gates):** P-06..P-12 (7 pantallas)
- **B3-3 (Compras/Taller):** P-13..P-19 (7 pantallas)
- **B3-4 (Finanzas):** P-20..P-23 (4 pantallas)
- **B3-5 (Cliente/Docs):** P-24..P-26 + F-07 (4 pantallas + 1 frontstage)
- **Soporte:** P-27..P-31 (5 pantallas, sin rediseño)

**Contrato por pantalla (met:110-123):**
1. Datos (fuentes de schema)
2. Gates (predicados ejecutables)
3. Acciones (API POST/PUT/PATCH)
4. Validación (zod schemas)
5. Roles (quién ve qué, quién puede qué)
6. Restricciones (businessrules)
7. UX (principios + reglas R01-R40)
8. Layout (responsive 3 breakpoints)

**Verificación:**
- QA (agente especializado) revisa contra consolidado UI
- `npm run dev` corre sin errores
- Flujos manuales testeados en dev-local real

### Fase 3.3 — Migración de datos (semana 5)

**Plan CC-01..CC-10** (de `d3_schema_a2_4_contrato_vivo.md`):
1. Snapshot de producción a `dev-local` (copia de seguridad)
2. Seed de usuarios de test en tablas nuevas
3. Migración de datos legacy ajustados a nuevo schema (proyectos, clientes, productos)
4. Validación de integridad (FKs, constraints, gates)
5. Prueba end-to-end en dev-local

**Responsable:** QA + Supervisor (validación de datos reales).

### Fase 3.4 — Hardening y docs (semana 6)

**Auditoría de seguridad:**
- Autorización en todas las rutas (requireEmpleado/requireCliente)
- Aislamiento clienteId/userId
- Validación de entrada (zod + sanitización)
- Prueba de ataque (SQL injection, XSS, escalada de privilegios)

**Documentación:**
- README de setup (dev-local)
- Guía de roles y permisos
- Runbook de operaciones (parámetros, backups, escala)

---

## Fronteras DIFERIDO (t-034, Fase 4+)

- **Tienda** (F-04, F-05, F-06)
- **KPIs y Medición** (P-32, gobierno/observabilidad)
- **Testimonios** (P-33, social proof)
- **Facturación DIAN** (`facturas`, integraciones)
- **Taller capa 2** (`tareas_produccion`, modularización)
- **Firma digital** (subsistema)
- **Mini-diamantes metodológicos** (M-01 a M-05)

---

## Checklist de aprobación (Supervisor)

- [ ] `fase2_ronda3_decisiones_respondidas.md` — 14/16 decisiones cerradas, 2 pendientes (A-01) ✅
- [ ] Parámetros faltantes confirmados (A-01) — pendiente de confirmación contable
- [ ] Mini-diamantes se abordan en paralelo, no bloquean corte ✅
- [ ] Roles tipados + herencia de permisos aprobado (D-01) ✅
- [ ] Onboarding empleados aprobado (D-02) ✅
- [ ] Parámetros de comisiones v1 aprobados (D-05/D-07) ✅
- [ ] Documentos (Drive + R2) aprobado (D-06) ✅
- [ ] Parámetros editables en ERP aprobado (D-14) ✅
- [ ] Plan de migración 4 fases aprobado (CC-01..CC-10) ✅
- [ ] Ola 7 comienza cuando todas las checks estén marcadas

---

**Registro:** 2026-08-04 · Orquestador · Fase 2 → Fase 3 transición

