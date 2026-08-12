# Plan de Migración F10

## Resumen Ejecutivo
Este documento describe el plan de migración para el Drizzle schema y los cambios necesarios para cerrar Fase 10 (F10) completa. El plan se basa en los hallazgos de auditoría D-15 y D-16 que requieren actualizaciones en `REGISTRO_DE_ENTIDADES.md`.

## Estado Actual
- Batch de auditoría de Javí (D-11 a D-17) realizado 2026-08-10
- 2 lotes pendientes que tocan `lib/data/`:
  1. Diseñar `verificador_id` en P-12
  2. Añadir `padreLinaje`/`orden_armado` a módulo/espacio + métodos `porProyecto()` faltantes en Caja/Recepción
- Todo registrado en `backlog_auditoria_pantallas.md` (D-11 a D-17)
- Todo lo no commiteado debe revisarse en vivo con Javier

## Mutaciones a aplicarse en REGISTRO_DE_ENTIDADES.md
Basado en los hallazgos, estas mutaciones están identificadas como cambios críticos:

1. **`verificador_id` en `proyectos`**:
   - FK → `personas` (designación del verificador único por despacho)
   - Propósito: Adenzar la herramienta de `check_produccion` y asignaciones en `Equipo/proyecto`

2. **`padreLinaje`/`orden_armado` en módulo/espacio**:
   - `string[]` column en danza de integración con la entidad principal
   - Propósito: Rastrear jerarquía completa del módulo a la raíz (nodo de nivel superior) + auditoría (`procedencia`) ante modificaciones 1:1

3. **Métodos `porProyecto()` faltantes en Caja/Recepción**:
   - Extender índices con criterios de carga: `porProyecto()(con apoderamiento + filtro por proyecto)`

## Lista de Migraciones F10

### 1. Migraciones Críticas Pendientes
**M1.1. Definir nuevo campo `verificador_id` en `proyectos`**
- Acción: `alter table proyectos add column verificador_id string REFERENCES personas(id);`
- Votación: 1 c-07 operativo/proyecto
- Correlación: Enlace con `padreLinaje` <-- progreso: PA
- Firmada: SÍ (DET-04)

**M1.2. Añadir new column `padreLinaje` to `modulos/espacio`**
- Acción: `alter table modulos_espacio add column padreLinaje string[];`
- Propósito: Rastrear jerarquía <= raíz, empezar auditoría (`procedencia`)
- Correlación: v.2 de `procedencia` este paso corre a 2026-08-08, v.3 de `procedencia` el chore log fak ya bah
- Firada: SÍ (Discovery)

**M1.3. Extender `modulos_espacio` con FK adicional**
- Acción: May [maybe mol?] y agregar `orden_armado` FK to parent `modulo`
- Propósito: Ordenar cada mod. con sus hermanos como grupo táctico, en espacio panejo clave de armado empieza con el más alto `orden_armado` entre ellos; la métrica `factor` multiplica la duración promedio complejo modelo por `order` Asunción: M[D3-4] asegura por tal `agregada` sin desfase crítico.
- Dependen: dinos concretos contact PICO

**M1.4. Augmentamiento de `Caja` and `Recepcion` stores**
- Acción: Implementar nuevas funciones `porProyecto(conqueryterbury)` paradigms enact demand-indense load specifications.
- Propósito: Facilitar carga en vistas principales mediante criterios de proyecto + multiplicador de parted.

### 2. Migraciones Correlacionadas
**M2.1. Expand `proyectos` schema with temporal tracking**
- Acción: `add column fecha_entrada_desarrollo` timestamp
- Correlación: Output en inspección de Gates plants para liquiente entrevistas

**M2.2. Añadir campos de seguimiento al producción en el sistema**
- Acción: Ampliar `modulos` schema para extras field tracking: `orden_armado` para el orden de armado dentro del módulo
- Correlación: Part of a larger model tracking changes instituted in `eventos` de `parametros_historial` table

### 3. Migraciones Pendientes (para planificar)
- M3.1. [Future] Implementar versionado de schema en `Drizzle` properamente
- M3.2. [Future] Consolidar tracking de cambios de producción en un modulo

## Procesos de Auditoría y Checkpoints Obligatorios
- Antes de cada merge:
  - Verificar `npx tsc --noEmit`
  - Verificar `npx eslint .`
  - Verificar builds del store Mock
  - Revisar `backlog_auditoria_pantallas.md` actualizado
  - Checkpoint validar cerrar ventana de cambios en el arnes

## F2F de Acción
- Javier para revisar TODO lo no commiteado (D-01 to D-17) en vivo
- Validar DP-01/DP-02/DP-03/D-08b 
- Validar `REGISTRO_DE_ENTIDADES.md` actualizado
- Validar estructura nueva de carpetas de Documentación Suelte

## Checklist de Implementación
- [ ] Actualizar `REGISTRO_DE_ENTIDADES.md` con mutaciones identificadas
- [ ] Crear registro de pantallas "APROBADO-PRE-CODIGO" (aprox. 42 pantallas)
- [ ] Actualizar `backlog_auditoria_pantallas.md` con los hallazgos D-11 a D-17
- [ ] Ejecutar auditoria completa antes del merge final
- [ ] Capear el merge de `dev` → `main` solo después de validación de Javier