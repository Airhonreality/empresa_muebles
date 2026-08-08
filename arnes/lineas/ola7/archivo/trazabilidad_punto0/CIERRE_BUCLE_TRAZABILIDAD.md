# CIERRE — Pase de Trazabilidad Punto-0 (2026-08-07)

**Rol:** Supervisor (Javier). **Bucle:** completo. **Veredicto:** APROBADO.

---

## 1. Qué se hizo (línea de tiempo del bucle)

| Paso | Artefacto | Resultado |
|---|---|---|
| Fase 1 | Auditoría de dispersión | Veredicto FRAGMENTADO: 12+ archivos sin jerarquía, 3 canones paralelos, 8 colisiones de naming |
| Fase 2 | Lotes y ruta (Orquestador) | 9 lotes relacionales, 5 ondas de dependencia, matriz de intercalación de modelos |
| Mutación arnés | MODELOS.md + AGENTS.md corregido | Eliminada documentación falsa (agentes hermes), stack de modelos free verificado |
| Bloque 2 | 9 subagentes de trazabilidad | 48 tablas trazadas al punto 0, 9 JSON validados |
| Bloque 3 | Cruce trans-lote | 8 colisiones de naming identificadas, 6 preguntas de negocio formuladas |
| Decisión Supervisor | 6/6 decisiones cerradas | Ver §2 abajo |
| Ciclo H Fase 3 | REGISTRO_DE_ENTIDADES.md | ~60 tablas canonizadas, regla de supremacía declarada |

---

## 2. Decisiones de negocio cerradas (6/6)

| # | Materia | Decisión canónica |
|---|---|---|
| A.1 | Estados de proyecto | Set B extendido: `borrador → en_revision → cotizado → desarrollo → aprobado_compras → armado → verificado → instalado → entregado / perdida / cancelada`. Mapeo completo proyecto↔módulo (7 gates, 2 niveles). |
| A.2 | Estados de OC | 7: `solicitada → aprobada → en_pago → pagada → recibida_verificada → rechazada → cancelada`. Sin 8° estado. Tercerizados vía `mecanica_pago='subcontratacion'`. |
| A.3 | Recepción | Una tabla `recepciones_material`. Acción por rol. Log en `eventos`. |
| A.4 | Auditoría | `eventos` + `procedencia`. `audit_logs` deprecado. |
| A.5 | SLA de entrega | 4 capas: OC real > puente proveedor-insumo > proveedor default > estimación material. |
| A.6 | Taxonomía | Tabla maestra `categorias` centralizada. |

---

## 3. Decisiones técnicas (10/10 axiomatizadas)

FLAG4 gana sobre schema plano · `catalogo_acabados` canon · `modulos` árbol reemplaza `modulos_armado` · `veredictos_calidad` absorbido · `audit_logs` deprecado · `valor_tienda` ≠ `precio_publico` · C2 items referenciales · `etapa_funnel` migrar · `producciones` no existe · UNIQUE en `procedencia`.

---

## 4. Canon resultante

**Fuente única de verdad del schema:** `arnes/diagnostico/REGISTRO_DE_ENTIDADES.md`

- ~60+ tablas con nombre canónico, función de negocio, relaciones
- 7 tablas deprecadas/absorbidas documentadas
- 6 reglas de integridad (axiomas)
- Regla de supremacía: "si difiere de cualquier otra fuente, gana este"
- Apuntado desde `arnes/INDEX.md` §1.c como canon raíz
- Apuntado desde `arnes/estado.md` como próximo paso

**Si el bucle de trazabilidad se repitiera,** cada subagente leería el DESTINO primero y resolvería cualquier naming contra él — sin reabrir decisiones cerradas.

---

## 5. Estado del arnés (limpio)

| Verificación | Resultado |
|---|---|
| Referencias a agentes `hermes` inexistentes | **0** (eliminadas de AGENTS.md) |
| Directorios corruptos | **0** (`traz satz` eliminado) |
| Archivos legacy sin dueño | **0** (todo en `arnes/` está referenciado en INDEX o es trazabilidad activa) |
| Decisiones sin registrar | **0** (6/6 en `decisiones_cerradas.md`) |
| Canon sin regla de supremacía | **Corregido** (línea 4 del DESTINO) |

---

## 6. Archivo del bucle

Todo el material del pase de trazabilidad queda en:
```
arnes/diagnostico/trazabilidad_punto0/
  proceso_trazabilidad.md          ← diseño del pase (aprobado)
  reporte_bloque1_fase1.md         ← auditoría de dispersión
  reporte_bloque1_fase2.md         ← lotes y ruta
  resultados/l0..l8.json           ← 9 trazados (48 tablas)
  reporte_final_bloque3.md         ← cruce trans-lote
  decisiones_cerradas.md           ← 6 decisiones del Supervisor
```

**Próximo paso (Ciclo H Fase 5):** promoción y archivado — archivar fuentes obsoletas en `arnes/diagnostico/archivo/`, actualizar `_INDICE_MAESTRO.md`.
