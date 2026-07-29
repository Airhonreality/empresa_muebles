# Contrato de programa: navegación y operación ERP

Estado: `plan_borrador_documentado`  
Implementación: no iniciada.  
Documento maestro:
[`ARQUITECTURA_NAVEGACION_OPERACION_ERP.md`](../../fork_doc/ARQUITECTURA_NAVEGACION_OPERACION_ERP.md)

## Goal

Evolucionar el ERP existente hacia una navegación estable y un flujo verificable:

```text
lead -> cotización -> proyecto -> producción -> abastecimiento -> finanzas
```

sin crear subsistemas paralelos, sin modificar engine por necesidades de negocio y
sin perder trazabilidad de datos.

## Decisiones congeladas

- Producción define, agrega, elimina y valida ítems.
- Finanzas ejecuta pagos y controla liquidez.
- Abastecimiento pertenece a Producción.
- El catálogo existente se reutiliza.
- El proyecto es el agregado transversal.
- El espacio es la unidad mínima operativa.
- Existe un modelo 3D maestro por proyecto, aislable por espacio.
- La primera opción siempre es reutilizar schemas existentes.

## Fuera de alcance de este contrato documental

- Implementar componentes.
- Cambiar schemas, rutas o zaps.
- Escribir Neon o datos de producción.
- Modificar archivos de engine.
- Crear ramas o worktrees.
- Desplegar.

## DAG de lanes futuras

| Orden | Lane | Depende de | Resultado |
|---|---|---|---|
| 0 | `goal/erp-navigation-capabilities` | Documento aprobado | Catálogo de módulos, navegación y permisos |
| 1 | `goal/erp-commercial-pipeline` | Lane 0 | Leads y oportunidades vigentes separados |
| 2 | `goal/erp-project-production-shell` | Lanes 0–1 | Ficha integral y Producción canónica |
| 3 | `goal/erp-procurement-flow` | Lane 2 | Abastecimiento trazable |
| 4 | `goal/erp-finance-integration` | Lane 3 | Obligaciones, pagos y costos por proyecto |
| 5 | `goal/erp-technical-assets` | Lane 2 | Planos, despieces y GLB por espacio |
| 6 | `goal/erp-navigation-operation-qa` | Lanes 1–5 | Auditoría integral |

Las lanes 3 y 5 pueden avanzar en paralelo después de la 2 si sus superficies de
definiciones y componentes son disjuntas. Si ambas requieren
`schema_definitions`, se serializan.

## Superficies tentativas

Las superficies definitivas se fijan al crear cada contrato de lane.

| Lane | Superficie esperada |
|---|---|
| Navegación | storage de navegación, rutas y componentes especializados de shell |
| Comercial | componentes especializados comerciales y campos mínimos existentes |
| Proyecto/Producción | componentes especializados de proyecto y taller |
| Abastecimiento | `WidgetArmadoOrdenCompra`, proyección común y zaps relacionados |
| Finanzas | `FinanzasShell`, zaps financieros y proyección por proyecto |
| Técnica/3D | `registros_tecnicos`, feed técnico y visor especializado |
| QA | pruebas y evidencia; sin rediseño |

## Workers

| Worker | Modelo | Entrega |
|---|---|---|
| Inventario de lane | `gpt-5.4-mini` | Matriz archivo/contrato/brecha |
| Implementación mecánica | `gpt-5.4-mini` | Cambio dentro de superficie |
| QA mecánico | Modelo liviano | Gates y evidencia |
| Orquestador | Modelo principal | Dependencias, integración y revisión |
| Auditor independiente | Modelo principal, sesión separada | CONFORME o DESVIACIÓN |

## Gates previos a cada lane

- [ ] Contrato específico creado.
- [ ] Superficie `lane-surface` exacta.
- [ ] Rama `goal/*` y entorno aislado.
- [ ] Estado base y cambios paralelos inventariados.
- [ ] Snapshot si toca datos reales.
- [ ] Gate humano si toca catálogo estructural o producción.
- [ ] Definición de Done ejecutable.

## Gates de cierre

- [ ] Diff dentro de superficie.
- [ ] `npm run validate:encoding`.
- [ ] `npm run validate:storage`.
- [ ] `npm run agnostic:compile` cuando cambian schemas.
- [ ] Pruebas específicas de la capacidad.
- [ ] Build o typecheck según riesgo.
- [ ] Auditoría independiente.
- [ ] Commit y push de la rama.
- [ ] Merge serializado a `dev`.
- [ ] Push de `dev`.

## Regla de activación

Este programa permanece documental hasta que el usuario emita una orden explícita de
implementación. La primera lane ejecutable será
`goal/erp-navigation-capabilities`; ninguna lane posterior se adelanta al contrato
de navegación y capacidades.

