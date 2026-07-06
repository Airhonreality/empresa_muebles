# MATRIZ DE ESTADOS

## Objetivo

Unificar el vocabulario de `proyectos.estado` entre schema, UI comercial y zaps comerciales, sin cambiar codigo en esta fase.

## Fuentes inventariadas

### 1) Schema `proyectos.estado`

Fuente: [`storage/db/schema_definitions.json`](../../db/schema_definitions.json#L251)

Valores actuales:

| Valor | Observacion |
|---|---|
| `Prospecto` | Estado inicial legado |
| `Cotizando` | Propuesta en curso |
| `Aprobado` | Aprobacion previa al arranque |
| `Producción` | Fase operativa con acento y mayuscula |
| `Entregado` | Cierre final legado |

### 2) UI comercial

Fuente: [`src/components/specialized/kanban/ComercialKanban.tsx`](../../src/components/specialized/kanban/ComercialKanban.tsx#L20)

Vocabulario visible en el tablero:

| Valor | Archivo:linea |
|---|---|
| `activa` | `ComercialKanban.tsx:20-26`, `:101-105` |
| `enviada` | `ComercialKanban.tsx:20-26` |
| `en_contrato` | `ComercialKanban.tsx:20-26` |
| `pre_produccion` | `ComercialKanban.tsx:20-26` |
| `produccion` | `ComercialKanban.tsx:20-26`, `:128-130` |

Comportamiento relevante:

- `ComercialKanban.tsx:97-105` agrupa por `estado` sin validar transicion.
- `ComercialKanban.tsx:108-121` persiste cualquier `newStage` recibido.
- `ComercialKanban.tsx:124-136` fuerza `produccion` al activar produccion.

### 3) UI de cotizacion

Fuente: [`src/components/specialized/cotizador/CotizadorPro.tsx`](../../src/components/specialized/cotizador/CotizadorPro.tsx)

Vocabulario visible:

| Valor | Archivo:linea |
|---|---|
| `activa` | `CotizadorPro.tsx:47`, `:706-711` |
| `en_contrato` | `CotizadorPro.tsx:313-317`, `:1286-1295` |
| `pre_produccion` | `CotizadorPro.tsx:313-317` |

Comportamiento relevante:

- `CotizadorPro.tsx:47` inicializa el header con `estado: 'activa'`.
- `CotizadorPro.tsx:313-317` considera lista para produccion solo `en_contrato` o `pre_produccion`.
- `CotizadorPro.tsx:706-722` crea una nueva cotizacion con `estado: 'activa'` y la guarda en `proyectos`.
- `CotizadorPro.tsx:1257-1295` pasa `headerLocal.estado` al dialogo de produccion.

### 4) Zaps comerciales

Fuente: [`storage/db/scripts.json`](../../db/scripts.json)

| Zap | Archivo:linea | Lectura / escritura de estado |
|---|---|---|
| `generar_contrato` | `scripts.json:54` | Escribe `proyectos.estado = 'en_contrato'` y `contratos.estado = 'borrador'` |
| `registrar_abono_y_activar` | `scripts.json:63` | Escribe `proyectos.estado = 'produccion'` y `contratos.estado = 'firmado'` |
| `zap_activar_produccion` | `scripts.json:189` | Escribe `proyectos.estado = 'produccion'` y `contratos.estado = 'firmado'` |
| `capturar_lead_embudo` | `scripts.json:239` | Escribe `leads.estado_proyecto`, no `proyectos.estado` |

## Desalineamiento encontrado

### Mapa columna por columna

| Schema legado | Canon propuesto | UI actual | Estado |
|---|---|---|---|
| `Prospecto` | `activa` | `activa` | Origen schema desalineado, UI ya usa canon |
| `Cotizando` | `enviada` | `enviada` | Origen schema desalineado, UI ya usa canon |
| `Aprobado` | `en_contrato` | `en_contrato` | Origen schema desalineado, UI ya usa canon |
| `Producción` | `produccion` | `produccion` | Origen schema desalineado por acento y mayuscula |
| `Entregado` | `entregado` | no visible hoy | Schema tiene terminal no representado en el kanban actual |

### Huérfanos

- Huérfanos del schema frente a la UI actual: `Prospecto`, `Cotizando`, `Aprobado`, `Producción`, `Entregado`.
- Huérfanos de la UI actual frente al schema legado: `activa`, `enviada`, `en_contrato`, `pre_produccion`, `produccion`.
- Huérfano funcional adicional: `pre_produccion` existe en UI y cotizador, pero no tiene espejo en el schema legado.

## Vocabulario canónico propuesto

Canon definitivo propuesto para `proyectos.estado`:

1. `activa`
2. `enviada`
3. `en_contrato`
4. `pre_produccion`
5. `produccion`
6. `entregado`
7. `perdida`
8. `cancelada`

Notas:

- Todo valor va en `snake_case`.
- Se evita acento, mayúscula inicial y variantes semanticas duplicadas.
- El canon conserva la salida final `entregado` para no perder cierre de ciclo.

## Transiciones legales

| Estado actual | Destinos permitidos |
|---|---|
| `activa` | `enviada`, `en_contrato`, `perdida` |
| `enviada` | `en_contrato`, `activa`, `perdida` |
| `en_contrato` | `pre_produccion`, `produccion`, `entregado`, `cancelada` |
| `pre_produccion` | `produccion`, `en_contrato`, `cancelada` |
| `produccion` | `entregado`, `pre_produccion`, `cancelada` |
| `entregado` | `[]` |
| `perdida` | `[]` |
| `cancelada` | `[]` |

### Correcciones manuales

Las siguientes transiciones hacia atras se conservan como correcciones manuales, no como flujo normal:

- `enviada` -> `activa`
- `pre_produccion` -> `en_contrato`
- `produccion` -> `pre_produccion`

## Mapeo de migracion

| Valor viejo | Valor canonico |
|---|---|
| `Prospecto` | `activa` |
| `Cotizando` | `enviada` |
| `Aprobado` | `en_contrato` |
| `Producción` | `produccion` |
| `Entregado` | `entregado` |

Confirmacion de alcance:

- Ningun valor viejo mapea a `perdida`.
- Ningun valor viejo mapea a `cancelada`.

## Hallazgos

### Deuda semantica `proyecto` / `cotizacion`

- El schema usa `proyectos`, pero la UI y varios zaps hablan de `cotizacion` como si fuera la unidad de negocio.
- `CotizadorPro.tsx` trata el registro activo como cotizacion, aunque persiste en `proyectos`.
- `ComercialKanban.tsx` y `AgnosticShell.tsx` muestran el mismo registro con nombres distintos segun el contexto.
- `cancelada` es el punto de enganche para el flujo de reembolso; ese flujo queda para la lane de finanzas.

### Deuda semantica `nombre_proyecto`

- `nombre_proyecto` funciona como etiqueta comercial primaria, aunque el resto del flujo usa `proyecto_id` como llave operativa.
- Ese doble lenguaje ya aparece en PDF, contratos y widgets de producto.

### Campos orfanos o semiorfanos

- `estado_proyecto` en `leads` es un campo hermano, no el mismo estado de `proyectos`.
- `cotizacion_id` aparece como alias historico en scripts viejos y compite con `proyecto_id`.
- `pre_produccion` no existe en el schema legado; vive solo en UI y cotizador.
- `entregado` existe en schema, pero no tiene columna propia en el tablero actual.
- Para registros sin `estado`, el default propuesto en schema es `activa`.

### Riesgo estructural

- El kanban persiste cambios sin validar transicion.
- `generar_contrato`, `registrar_abono_y_activar` y `zap_activar_produccion` escriben estados sin una maquina de estados compartida.
- Sin un canon unico, el mismo proyecto puede rotar entre vocabularios incompatibles y perder trazabilidad.

## Estado de esta fase

`Estado: plan_borrador`

Esta matriz es una propuesta para aprobacion humana. No impone cambios en schema, UI ni zaps.
