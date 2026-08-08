# Diseño — Módulo de espacio (árbol jerárquico recursivo) — decisión aprobada

**Fecha:** 2026-08-07 · **Aprobado por:** Javier (Supervisor), en sesión, con salvedad sobre la relación con el catálogo (ver §5)
**Alcance:** transversal — toca F2 (cotizador), F3 (cronograma), F4/F5 (compras/taller/calidad/instalación)
**Fuentes:** hallazgo del Supervisor en revisión del plan F5; `d3_ui_b3_3_compras_taller_calidad.md`; `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md`

---

## 1. El hallazgo (dado por el Supervisor)

> "¿Por qué limitamos el ciclo de vida de un módulo al taller? Un módulo nace cuando se diseña en el cotizador para el cliente → se transforma → contrata → se desarrolla (gate) → se compran sus insumos (gate compras) → se arma (fila taller) → se verifica → se despacha a instalación → se instala o tiene reprocesos → posibles garantías postventa. Esto da la respuesta sobre el despacho parcial."

**Consecuencia estructural:** el "módulo" no es una fila de taller; es **la unidad de trazabilidad del proyecto entero**, con un identificador que sobrevive todo el ciclo. Evaluar los gates por proyecto completo rompe el despacho parcial (un proyecto no siempre se despacha completo: ej. 3 de 6 espacios).

## 2. Modelo aprobado

Un **espacio** (`espacio_variantes`) se compone de **módulos y sub-módulos anidables recursivamente**.

```
espacio_variantes (1)
   └─ módulo compuesto "Bajo cocina" (padre=null)
        ├─ submódulo "Cajón correderas" (tipo: base)  ×3
        │     └─ piezas: superficie melamínica · correderas → BOM
        ├─ submódulo "Cubiertero plástico" (tipo: base)
        └─ "Conjunto bisagras" (tipo: herraje)
```

- **Módulo básico** ej: cajón de correderas = superficie melamínica + correderas.
- **Módulo compuesto** ej: bajo cocina = 3 submódulos correderas + cubiertero + bisagras.
- La hoja del árbol (piezas/insumos) aterriza en `bom_materiales` (ya existe, con `linaje_item_id` y `homologable`).

## 3. Tabla propuesta: `modulos` (hereda la semántica de `modulos_armado`, nombre canónico deprecado)

| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | identificador de vida completa |
| espacio_variante_id | FK→espacio_variantes | espacio del cotizador (nullable si módulo suelto/prefabricado) |
| proyecto_id | FK→proyectos | |
| padre_id | FK→modulos (self) | recursión; null = raíz del espacio |
| nombre_modulo | text | "Cajón correderas", "Bajo cocina" |
| tipo_modulo | enum | base / compuesto / consumible / herraje / pieza_tercero |
| cantidad | numeric | unidades del mismo nodo |
| estado | text/enum | ciclo completo (ver §4) |
| jornadas_desarrollo / ensamblaje / instalacion | numeric | hereda del espacio, ponderado por nodo |
| horas_estimadas | numeric | |
| origen_modulo | enum | proyectado / adicional / prefabricado / garantia |
| padre_linaje | uuid | rastreo de origen (E-54) |

## 4. Gates por nodo (agregación recursiva)

- **Desarrollo (E-18), compras (E-21), verificación (E-24), despacho, instalación (E-25), garantía (E-36)** se evalúan **por `modulos.id`**.
- Un padre aprueba solo si **todos** sus hijos aprobaron (agregación recursiva determinista).
- **Despacho parcial** = "los nodos con E-24 aprobado y E-21 recibido pasan". Natural, sin caso especial.
- **Tercero pendiente** = ese nodo (`tipo_pieza_tercero`) no despachado; no bloquea a los demás nodos.

## 5. ✅ Relación módulo ↔ catálogo — RESUELTO (principio clase↔instancia, aprobado por el Supervisor)

**Aprobado (2026-08-07, en sesión):** el nodo `modulos` NO duplica el detalle comercial del catálogo. Aplica el principio **clase ↔ instancia**:

| Entidad | Rol | Qué vive |
|---------|-----|----------|
| **Catálogo** (`productos_tienda`/`materiales_insumos`) | **CLASE** (reutilizable, plantilla) | ficha técnica, margen, `valor_tienda`, `categoria_tienda`, BOM/genérico, procesos, imagen de tienda |
| **Nodo `modulo`** del árbol del proyecto | **INSTANCIA** (caso concreto) | FK→catálogo, `cantidad`, `colores` elegidos, estado de ciclo, `jornadas`, `horas`, `padre_id`, `espacio` |

**Detalle comercial (ficha técnica, margen, precio, imágenes de tienda) NO se duplica:** vive UNA vez en el catálogo y el nodo la referencia por FK. Colores y cantidad son la elección de la instancia (ya existe: `espacio_variantes.colores`, ítems).

### Refinamiento 2 — assets formales de producción SÍ en el módulo (sin violar el axioma)

> Corrección del Supervisor: "el módulo debería tener imagen, orden de armado/plano, diseño 3D (heredado del árbol del objeto del proyecto específico, o un 3D dedicado y reutilizable del módulo estándar)."

Esto NO contradice el axioma si no se duplica por columna. En vez de meter `imagen/plano/3d` como columnas en `modulos` (que duplicaría forma por cada nodo), se modela con una **tabla auxiliar de artefactos formales** (1—N por nodo, sin columnas duplicadas):

**`modulos_artefactos`** (assets formales de producción por nodo)
| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | |
| nodo_id | FK→modulos | |
| tipo | enum | imagen / plano_armado / orden_armado / modelo_3d |
| fuente | enum | `heredado_catalogo` (reutiliza el 3D/plano de la CLASE) / `dedicado_proyecto` (3D específico del objeto del proyecto) |
| url / referencia | text | asset en alojador (R2/Drive, ver E-41) |
| revision | int | |

- `fuente='heredado_catalogo'` → el plano/3D viene del estándar (clase), sin duplicar el binario; el nodo solo lo referencia.
- `fuente='dedicado_proyecto'` → artefacto del caso concreto (apoyado del árbol 3D del proyecto específico).
- Convivive con `productos_tienda.imagen_principal_url` (imagen de storefront) sin conflicto: una es imagen comercial (clase), la otra es asset de producción (nodo).

### Refinamiento 3 — acabados formales (color, textura, acabado, material, estilo, estilema) — RESUELTO (Opción A, aprobada)

> **Decisión del Supervisor (2026-08-07, Opción A):** el vocabulario de acabados es **compartido por nodo (instancia) y catálogo (clase)**. El catálogo define los acabados **posibles** de la clase; el nodo **elige por instancia**. Una sola entidad, dos vínculos.

**RECONCILIACIÓN con el grafo M-02 (2026-08-07):** este refinamiento NO crea un esquema de acabados paralelo. Reutiliza y extiende el **grafo de acabados ya aprobado** en `OLA_6_METODOLOGIA_GRAFOS.md:118-127` (`catalogo_acabados` + `acabados_muestras`) y la taxonomía FLAG-4. Nombre canónico: **`catalogo_acabados`** (vocabulario), NO `acabados` (evita colisión con la futura tabla del mismo nombre en el grafo).

**`catalogo_acabados`** (vocabulario - CLASE, extiende el grafo M-02)
| Campo | Tipo | Nota |
|-------|------|------|
| id | uuid PK | |
| familia | text | pintura / laminado / enchapado / melamina / textura (grafo M-02:121) |
| tipo_acabado | enum | color / textura / acabado / material / estilo / estilema |
| nombre | text | "Melamina Blanca", "Brillante" |
| color_hex | text | para color/pigmento |
| imagen_textura_url | text | para textura/material (en `acabados_muestras` también puede vivir la muestra web) |
| codigo_proveedor | text | referencial (M-02:121) |
| precio_diferencial | numeric | +X% sobre material base (M-02:122) |
| parametros_extra | jsonb | SOLO variación no homogénea (ej. perfil de grabado param). NO para estilemas/descripciones — esos son filas reales del vocabulario. |

**`acabados_muestras`** (del grafo M-02, se amplía con compatibilidad)
| Campo | Tipo | Nota |
|-------|------|------|
| acabado_id | FK→catalogo_acabados | |
| imagen_muestra_url | text | |
| disponible_web | boolean | publicación en tienda |
| compatibilidad_insumo | jsonb | `[{insumo_aplicable, valido}]` — tablero A + acabado X (M-02:127) |

**`modulos_acabados`** (puente - INSTANCIA: acabado aplicado al nodo)
| Campo | Tipo | Nota |
|-------|------|------|
| nodo_id | FK→modulos | acabado aplicado al nodo del proyecto |
| acabado_id | FK→catalogo_acabados | vocabulario |
| zona | text | superficies / apliques / manetas / bordes ... |

**`catalogo_producto_acabados`** (puente - CLASE: acabados posibles del estándar)
| Campo | Tipo | Nota |
|-------|------|------|
| producto_catalogo_id | FK→productos_catalogo | acabados posibles del estándar (tienda) |
| acabado_id | FK→catalogo_acabados | vocabulario |
| disponibilidad_web | boolean | si este acabado se ofrece en la tienda |
| es_default | boolean | acabado por defecto de la clase |

**Regla anti-paralelismo (resultado de la reconciliación):** el vocabulario `catalogo_acabados` + `acabados_muestras` vive en el esquema de catálogos (grafo M-02 / FLAG-4), y `modulos_acabados` / `catalogo_producto_acabados` son vínculos hacia él. **Un solo master de acabados** consultable y sin duplicación binaria.

**Rastreabilidad:** `espacio_variantes.colores` (jsonb simple de presentación) se conserva; el vocabulario lo hace consultable/traducible sin romperlo (migración aditiva).

## 6. Impacto en fases ya planificadas (retroceso correcto)

| Fase | Impacto |
|------|---------|
| F2 (cotizador) | Definir módulos al diseñar el espacio; descomposición por nodo |
| F3 (cronograma) | Programación por módulo/nodo; `estimaciones`/`comisiones` ya miden "cantidad de módulos" |
| F4 (compras) | OC/item a nivel de nodo; `bom_materiales` por módulo |
| F5 (taller/calidad/instalación) | `citaciones_calidad.modulos_ids` (jsonb) acepta subconjunto; `verificaciones`/`instalaciones`/`actas` a nivel módulo |

**Registro:** decisión D-2026-08-07-C · planes afectados: `plan_f5.md` (t-098..101), referencia a F2/F3.

## Referencias

- `d3_ui_b3_3_compras_taller_calidad.md` (P-16..P-19)
- `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md` (especialización relacional axiomática)
- `logica_de_negocio.md` (compensación por módulo, tamaño = valor + cantidad de ítems/módulos)