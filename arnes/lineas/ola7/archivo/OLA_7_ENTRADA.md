# Ola 7 — Execute (Entrada única)

**Supervisor:** Javier  
**Fecha:** 2026-08-04  
**Status:** ✅ OLA 6 CERRADA — OLA 7 LISTA PARA INICIAR  
**Próxima acción:** Códigos que desarrollará Ola 7 según este checklist

---

## Qué es Ola 7

Fase de **codificación y ejecución** de:
- 34 pantallas core (26 admin + 8 frontstage)
- 65 tablas relacionales (schema)
- 5 gates deterministas (E-18, E-21, E-24, E-33, E-20)
- Subsistema de LOGS + KPIs
- Dualidad de modelos de nómina (tiempo + módulo, paralelo)

**No es rediseño.** Los esquemas, gates y pantallas YA ESTÁN ESPECIFICADOS en los consolidados. Ola 7 SOLO CODIFICA lo que Ola 6 diseñó.

---

## Documentos de entrada (lectura ÚNICA)

1. **`arnes/AGENTS.md`** — Ley del arnés (roles, zonas, prohibiciones)
2. **`arnes/estado.md`** — Dónde estamos (último checkpoint)
3. **`arnes/lineas/ola7/archivo/_INDICE_MAESTRO.md`** — Mapa de todo lo que pasó (trazabilidad)
4. **Este archivo** (`OLA_7_ENTRADA.md`) — Punto de partida

**No leas más.** Todos los demás documentos están referenciados desde estos cuatro.

---

## Checklist de Ola 6 (QA aprobó)

| Componente | Status | Referencia |
|---|---|---|
| 16 decisiones del Supervisor | ✅ Aprobadas | `fase2_ronda3_decisiones_respondidas.md` |
| 7 grafos relacionales (catálogos) | ✅ Aprobados | `OLA_6_SCHEMAS_APROBADOS.md` |
| 5 gates validados contra schemas | ✅ Validados | `OLA_6_GATES_SCHEMAS.md` |
| Subsistema de LOGS robusto | ✅ Aprobado | `OLA_6_SUBSISTEMA_LOGS.md` |
| Dualidad modelos nómina | ✅ Aprobada | `OLA_6_SCHEMAS_APROBADOS.md` (sección 6) |
| Plan de migración (4 fases) | ✅ Aprobado | `pasadas/d3_schema_a2_4_contrato_vivo.md` |

**Veredicto:** ✅ OLA 6 CERRADA, sin bloqueadores

---

## Decisiones cerradas (NO vuelven a abrirse)

| Decisión | Estado | Valor |
|---|---|---|
| Roles tipados + herencia permisos | CERRADA | 9 roles (gerente, comercial, compras, contador, etc.) |
| Comisión cierre comercial | CERRADA | 5% sobre valor total |
| Comisión módulo instalado | CERRADA | 5% sobre valor módulo |
| Tarifa carpintero | CERRADA | 15.000 COP/h |
| Tarifa auxiliar | CERRADA | 6.500 COP/h |
| Base comisión | CERRADA | Subtotal sin IVA |
| Documentos: Drive + R2 | CERRADA | Drive (SKP), R2 (imágenes) |
| Parámetros editables en ERP | CERRADA | 6 campos legales + 13 operativos |
| Catálogos relacionales | CERRADA | 7 grafos (herrajes, insumos, procesos, componentes, etc.) + FLAG-4 estructura axiomática (base + 3 especializaciones) |
| Subsistema de LOGS | CERRADA | 4 capas (core, agregación, KPIs, alertas) |

**Prohibido re-discutir.** Si una decisión cerrada necesita cambio → escalate al Supervisor, no re-abre Ola 6.

---

## Schemas de referencia

**Lectura obligatoria antes de codificar:**

1. **Schema final (65 tablas):**
   - Leer: `pasadas/d3_schema_consolidado.md`
   - Usar para: Crear migration en Drizzle ORM

2. **UI final (34 pantallas):**
   - Leer: `pasadas/d3_ui_consolidado.md`
   - Usar para: Especificación de cada ruta/componente

3. **Gates (predicados SQL):**
   - E-18: `P18(p) = estado='desarrollo' ∧ verificaciones.tipo_gate='schema' APROBADO ∧ verificador_id=p.verificador_id ∧ creado_en ≥ fecha_entrada_desarrollo`
   - E-21: `P21(r) = check_pedido_bien ∧ check_despacho_bien ∧ ¬∃item(recibido_cantidad<cantidad ∨ sin_defectos≠TRUE)`
   - E-24: `P24(p) = estado='armado' ∧ citación citada ∧ verificaciones.tipo_gate='calidad' APROBADO ∧ verificador_id=p.verificador_id`
   - E-33: `P33(p) = ∃desfase aplicado ∧ causa∈{interna,externa,cambio_contrato} ∧ motivo>0 ∧ composicion_causal>0`
   - E-20: `caja_disponible = Σ saldo_actual − Σ por_pagar(pendiente,atrasada)(monto_total−monto_pagado) ≥ monto_pago` (bloqueante)

---

## Verificación obligatoria (antes de integrar)

Cada tarea de Ola 7 DEBE cumplir (§4 de AGENTS.md, riesgo derivado):

| Tipo de tarea | Verificación | Comando |
|---|---|---|
| Schema/datos | Validación de contrato + round-trip | `npm run db:migrate` + seed |
| Lógica de negocio | Chequeo ejecutable obligatorio | Tests unitarios por módulo |
| Gates | Predicado SQL evaluado en servidor | Test de gate contra datos reales |
| Integración | Prueba aislada (nunca contra producción) | Test de flujo E2E en dev-local |
| Auditoría/Logs | Registro en `audit_logs` comprobable | Query de trazabilidad devuelve cadena completa |

**Sin verificación mecánica, ninguna tarea se cierra.**

---

## Tareas de Ola 7 (en paralelo, por zona)

### Transversal (base)
- [ ] t-074 Crear tablas core (`usuarios`, `personas`, `personas_roles`, `parametros`, `audit_logs`, `eventos`)
- [ ] t-075 Crear tablas de catálogos (herrajes, insumos, procesos, componentes, espacios)
- [ ] t-076 Crear tablas de caja/finanzas (cuentas, obligaciones, movimientos)
- [ ] t-077 Seed de datos iniciales (espacios, procesos, catálogos reales)

### Comercial/Cotizador
- [ ] t-078 Implementar P-04 (cotizador, cálculo de composición)
- [ ] t-079 Implementar P-01 (embudo comercial, kanban)

### Cronograma/Gates
- [ ] t-080 Implementar gate E-33 (desfase cronograma)
- [ ] t-081 Implementar P-09 (cronograma doble)
- [ ] t-082 Subsistema de LOGS + alertas

### Compras
- [ ] t-083 Implementar gate E-20 (caja bloqueante)
- [ ] t-084 Implementar gate E-21 (recepción triple verificación)
- [ ] t-085 Implementar P-13 (compras)

### Nóminas
- [ ] t-086 Implementar P-22 (compensación, dualidad tiempo/módulo)
- [ ] t-087 Implementar configuracion_nomina (modelo por empleado)

### Validación final
- [ ] t-088 QA: Verificación de gates E2E
- [ ] t-089 QA: Trazabilidad de decisiones (audit_logs)
- [ ] t-090 Checkpoint final Supervisor

---

## Parámetros iniciales (YA RESUELTOS)

No esperes confirmación. Están en `parametros` tabla, listos para usar:

```
comision_cierre_pct = 5
comision_modulo_instalado_pct = 5
tarifa_hora_carpintero_cop = 15000
tarifa_hora_auxiliar_cop = 6500
base_comision_tamano = 'subtotal_sin_iva'
bruto_diseno_3d_cop = 130000

Pendiente confirmación contador:
neto_diseno_3d_pct = ? (de contador)
iva_diseno_3d_pct = ? (de contador)
recargo_hora_extra_pct = ? (revisar legal Colombia)
```

---

## Frontera DIFERIDO (NO tocar en Ola 7)

- Tienda (F-04, F-05, F-06) — t-034
- KPIs avanzados (P-32) — t-034
- Testimonios (P-33) — t-034
- Facturación DIAN (`facturas`) — Fase 4
- Taller capa 2 (`tareas_produccion`) — Fase 4
- Firma digital (subsistema) — Fase 4

---

## Reglas de oro (de AGENTS.md)

1. **Separación ejecutor-verificador:** Nunca la misma persona ejecuta y QA aprueba
2. **Plan obligatorio:** Antes de tocar código, Iniciador escribe el plan
3. **Verificación mecánica:** Sin tests/linter/tipos verdes, no se aprueba
4. **Checkpoint humano:** Riesgo alto (gates, dinero, datos) pasa por Supervisor antes de integrar
5. **Auditoría de arnés:** Si algo toca AGENTS.md, pasa por ciclo plan→dry→confirmación→backup

---

## Primera acción del ejecutor

```
1. Lee: AGENTS.md (roles, zonas, prohibiciones)
2. Lee: arnes/estado.md (último checkpoint)
3. Lee: arnes/diagnostico/OLA_7_ENTRADA.md (este archivo)
4. Detente. Espera la primera tarea.

Cuando Orquestador te asigne t-074 (transversal):
5. Lee el plan (en arnes/planes/plan_t-074.md)
6. Aprende de: pasadas/d3_schema_consolidado.md (qué tablas crear)
7. Crea migration en Drizzle ORM (con esquemas exactos)
8. Escribe tests (validación de contrato)
9. Entrega para QA
```

---

## Indicadores de éxito (Ola 7 completa)

- [ ] 65 tablas creadas y migradas a dev-local
- [ ] 61/61 eventos mapeados a columnas (trazabilidad)
- [ ] 5 gates deterministas evaluando correctamente en servidor
- [ ] 34 pantallas renderizando con datos reales
- [ ] Subsistema de LOGS generando KPIs cada noche
- [ ] Dualidad nómina (tiempo + módulo) funcional
- [ ] Auditoría: cualquier decisión → trazabilidad completa en `audit_logs`
- [ ] Checkpoint final Supervisor: APROBADO

---

**Registro:** 2026-08-04 · Ola 6 CIERRE · Ola 7 ENTRADA LISTA

