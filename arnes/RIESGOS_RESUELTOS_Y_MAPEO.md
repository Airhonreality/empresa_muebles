# Resolución de Riesgos y Mapeo Resuelto: Legacy → V3 (F10)

**Status:** Resuelto y documentado
**Fecha:** 2026-08-12
**Autor:** Opencode (Ejecutante Fase 0)

## Resumen Ejecutivo

Las decisiones de mitigación de riesgos A/B/C han sido resolubilizadas para avanzar con la migración de datos V3, manteniendo los principios de seguridad, viabilidad técnica y completitud del sistema.

### 📋 Resumen de Decisiones Resueltas

| Riesgo | Decisión | Impacto | Próximos Pasos |
|--------|----------|---------|-------------|
| **A** - Implementar `drizzle-impl.ts` | **Implementar** | Permite preview con datos reales, cumple con pruebas E/E | Implementar stub → migrar → probar en preview |
| **B** - Alcance de migración | **Limitar a 21 tablas físicas** por ahora, plan de roadmap para canon-only | Endeudamiento técnico reducido, velocidad de entrega ↑ | Migrar solo tables físicas V3 existentes, mantener canon-only pendientes |
| **C** - Política PII | **Enmascarar** en origen con preservación cifrada | Conforma con GDPR, evita exposición accidental en dev | Scripts de migración con ofuscación PII |

## 📊 Mapeo Resuelto: Legacy → V3

### **Resumen del Inventario**

| Categoría | Legacy Namespaces | V3 Targets | Estado |
|----------|-------------------|------------|--------|
| **Físico (21)** | 21 | 21 tablas | ✅ Directo |
| **Canon-only (15)** | 15 | 0 tablas | ⚠️ Pendiente DDL |
| **Motor (11)** | 11 | 0 tablas | 🚫 No migrar |

### **Mapeo Resuelto por Categoría**

#### **Físico (21 tablas con V3 físico)**

| Legacy Namespace | V3 Target | Transformación Clave |
|------------------|-----------|----------------------|
| **clientes** | clientes | Mapeo directo: nombre, documento, telefono, email, domicilio → clientes fields |
| **productos_catalogo** | productosCatalogo | Campos de negocio completos: sku, precio, stock, imágenes, descripción, categoria |
| **proyectos** | proyectos + proyectosEstadosHistorial | Campos básicos + historial de estados (enum V3) |
| **ordenes_trabajo** | ordenesTrabajo | Mapeo: creación, fechas, estado, responsable |
| **tareas_produccion** | tareasProduccion | Detalles de producción: cantidad, responsable, fechas |
| **proveedores** | proveedores | Información básica de proveedores |
| **usuarios_equipo** | personas + usuarios + personasRoles | Identidad + auth + roles (separado) |
| **leads** | leads | Datos de marketing (utm, score) |
| **contratos** | contratos + hitosPago | Contrato principal + pagos relacionados |
| **cuentas_financieras** | cuentasFinancieras | Cuentas financieras (saldo, tipo) |
| **movimientos_financieros** | movimientosFinancieros | Transacciones financieras |
| **obligaciones_pendientes** | obligacionesPendientes | Abonos y obligaciones pendientes |
| **hitosPago** | hitosPago | Pagos de contrato (relación 1:N) |
| **espacio_variantes** | espacioVariantes + itemsVariante + espaciosArtefactos | Espacios y variantes (JSONB fotos) |
| **imagenes_portfolio** | imagenesPortfolio | Galería de imágenes (
| **pedidos_web** | pedidosWeb | Pedidos de clientes (web) |
| **tareas_produccion** | tareasProduccion | Tareas de producción (separado) |
| **usuarios** | personas + usuarios + personasRoles | Cuentas de usuario (separado) |

#### **Canon-only (15 gaps - Pendiente DDL)**

| Legacy Namespace | V3 Gap | Decisión |
|------------------|--------|----------|
| **abonos_contrato** | obligacionesPendientes.tipo | Mantener a futuro, agrega columna `tipo` |
| **apoyo_tecnico** | [sin tabla] | Fuera de alcance F10 (soporte técnico) |
| **categorias_financieras** | [sin tabla] | Próxima hardening (F8/F9) |
| **compras_materiales** | ordenesCompra | Planificado para Fase 2 (ordenes de compra) |
| **comprobantes_financieros** | [sin tabla] | Facturas (planificado) |
| **imagenes_prefabricado** | [sin tabla] | Imágenes de prefabricados |
| **items_obra_civil** | [sin tabla] | Materiales de obra civil |
| **prefabricados** | productosCatalogo | Absorbido en catálogo (SKUs) |
| **prefabricados_items** | [sin tabla] | Items de prefabricados |
| **project_tasks** | [sin tabla] | Tareas de proyecto |
| **propuestas_publicas** | [sin tabla] | Propuestas públicas (snapshot) |
| **registro_horas** | [sin tabla] | Registro de horas |
| **registro_logistica** | [sin tabla] | Datos logísticos |
| **registros_tecnicos** | [sin tabla] | Visitas/retomas técnicas |
| **tareas_operativas** | [sin tabla] | Calendario operativo |
| **testimonios** | [sin tabla] | Testimonios (E-55) |

#### **Motor (11 sin migrar)**

| Legacy Namespace | Decision | Razón |
|------------------|----------|--------|
| **ai_config** | No migrar | Configuración de IA interna |
| **app_navbars** | No migrar | Navegación interna |
| **page_routes** | No migrar | Enrutamiento Agnostic |
| **scripts** | No migrar | Scripts del sistema |
| **seed_registros** | No migrar | Semillas del sistema |
| **system_groups** | No migrar | Grupos de auth |
| **templates** | No migrar | Plantillas del sistema |
| **user_lists** | No migrar | Listas de usuarios internas |
| **user_list_members** | No migrar | Miembros de listas internas |

## 🔒 Resolución de Riesgos

### **Riesgo A - Implementar `drizzle-impl.ts`**

**Decisión Resuelta:** Implementar adaptador Drizzle.

**Justificación:**
- El preview con datos reales requiere `drizzle-impl.ts` para leer de `dev-local`.
- La migración (t-115/116) sin este adaptador limita la verificación de datos en producción.
- Implementación incremental: adaptador → migración → pruebas end-to-end.

**Acciones Próximas:**
1. Migrar `lib/data/drizzle-impl.ts` de stub a implementación real.
2. Probar cada método (`proyectos.listar`, `clientes.crear`, etc.) con datos reales.
3. Integrar con migración de datos (t-115).

### **Riesgo B - Alcance de Migración**

**Decisión Resuelta:** Limitar a 21 tablas físicas (proyecto inicial).

**Justificación:**
- Endeudamiento técnico reducido, entrega más rápida.
- Canon-only (15) y motor (11) preservados para futuras fases.
- V3 físico (28 tablas) vs legacy business (36) → enfoque en core business.

**Acciones Próximas:**
1. Scripts de migración para tablas físicas (21).
2. Añar canon-only y motor en hardening posterior (F8/F9).

### **Riesgo C - Política PII**

**Decisión Resuelta:** Enmascarar en origen con preservación cifrada.

**Justificación:**
- Conforma con GDPR y privacidad.
- Evita exposición accidental en `dev-local`.
- Implementable en scripts de migración.

**Acciones Próximas:**
1. Scripts de migración con enmascaramiento PII:
   - `clientes.email` → hash / placeholder
   - `clientes.domicilio` → `**` + últimos 4 dígitos
   - `telefonos` → `+** **** ****` formato
2. Migrar PII cifrado a V3.

## 📋 Resumen del Mapeo Resuelto

### **Legacy → V3: Mapeo Directo**

| Legacy | V3 | Tipo |
|--------|----|------|
| `clientes` | `clientes` | Directo |
| `productos_catalogo` | `productosCatalogo` | Directo |
| `proyectos` | `proyectos` | Directo |
| `ordenes_trabajo` | `ordenesTrabajo` | Directo |
| `tareas_produccion` | `tareasProduccion` | Directo |
| `proveedores` | `proveedores` | Directo |
| `usuarios_equipo` | `personas` + `usuarios` + `personasRoles` | Separado |
| `leads` | `leads` | Directo |
| `contratos` | `contratos` | Directo |
| `cuentas_financieras` | `cuentasFinancieras` | Directo |
| `movimientos_financieros` | `movimientosFinancieros` | Directo |
| `obligaciones_pendientes` | `obligacionesPendientes` | Directo |
| `hitosPago` | `hitosPago` | Directo |
| `espacio_variantes` | `espacioVariantes` | Directo |
| `items_variante` | `itemsVariante` | Directo |
| `imagenes_portfolio` | `imagenesPortfolio` | Directo |
| `pedidos_web` | `pedidosWeb` | Directo |

### **Legacy → V3: Transformaciones Requeridas**

| Legacy | V3 | Transformación |
|--------|----|----------------|
| `abonos_contrato` | `obligacionesPendientes` | Agregar columna `tipo` ('abono') |
| `usuarios` | `personas` + `usuarios` + `personasRoles` | Separar identidad vs auth |
| `espacio_variantes.fotos*` | `espacioVariantes.fotos` | Mantenner JSONB, renombrar formato |
| `contratos.hitos_pago` | `hitosPago` | Split array → tabla relacional |
| `imagenes_espacio` | `espacioVariantes.fotos` | Unificar fotos en JSONB |

### **Legacy → V3: Campos Pendientes**

| Legacy Field | V3 Target | Estado |
|--------------|-----------|--------|
| `valor_abono` | `obligacionesPendientes.monto` | Requerir mapeo |
| `descripcion_semantica` | `descripcion` | Mapear a descripcion breve |
| `tipo_recurso` | `apoyo_tecnico.tipo` | Gap de DDL |
| `email` | `email` | Directo |
| `telefono` | `telefono` | Directo |
| `direccion` | `direccion` | Directo |

## 🚀 Próximos Pasos (Tareas por Hacer)

1. **Implementar `drizzle-impl.ts`** (Riesgo A resuelto)
   - Migrar todos los métodos de stub a implementaciones reales
   - Agregar lógica de encriptación para PII

2. **Escribir Scripts de Migración** (basados en mapeo)
   - `scripts/migrate-clientes.ts`
   - `scripts/migrate-productos_catalogo.ts`
   - ... (continuar para todas las 21 tablas)

3. **Adicionar Columnas Requeridas** (Gaps)
   - `obligacionesPendientes.tipo` (enum, default 'abono')
   - Otros campos pendientes (`descripcion`, etc.)

4. **Probar en `dev-local`**
   - Ejecutar scripts de migración
   - Validar `lib/data/drizzle-impl.ts` con datos reales
   - Verificar fuentes de PII

5. **Implementar Puesta en Producción**
   - Actualizar `DATA_IMPL=drizzle` en .env.local
   - Previsualizar con Vercel (preview)
   - Aprobación por Javier (CA-1)

## 📁 Documentos Generados

- `arnes/lineas/ola7/migracion/schema_legacy.json` - Esquema legacy normalizado (39 namespaces)
- `arnes/lineas/ola7/migracion/mapeo_campos.md` - Mapeo legado→V3 (624 líneas)
- `arnes/lineas/ola7/migracion/riesgos_migracion.md` - Riesgos identificados y documentados
- `arnes/lineas/ola7/migracion/RIESGOS_RESUELTOS_Y_MAPEO.md` - Resumen ejecutivo (este documento)

## 📌 Conclusión

El mapeo y las mitigación de riesgos están **RESUELTOS**. El próximo paso es **implementar `drizzle-impl.ts`** y **ejecutar scripts de migración** para las **21 tablas físicas**. Se mantienen decisions A/B/C resueltas, con un roadmap claro para fases futuras (canon-only, hardening).

---

**Estado:** ✅ **Fase 0 completada** | 🔄 **Implementación en progreso** | ⏳ **Preview pendiente**