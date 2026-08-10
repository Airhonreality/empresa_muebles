# Diseño: Ficha Técnica del Catálogo (Mini-Diamante)

**ID:** disenio_ficha_catalogo  
**Fecha:** 2026-08-09  
**Rol:** Iniciador + Orquestador  
**Estado:** Diseño pre-código (NO toca `lib/db/schema.ts` ni migraciones)  
**Decisión canónica:** `[POC/2026-08-09]` — Agregar filas en REGISTRO para alinear con plan_t-075  

---

## 1. Entidades que Consume

### 1.a Entidades nuevas (a agregar a REGISTRO_DE_ENTIDADES.md §2)

| Schema | Nombre natural | Función en el sistema | Relaciones | Fuente |
|--------|---------------|----------------------|------------|--------|
| `marcas` | Marca del producto | Representa la marca de un producto/insumo. Codependiente de proveedores. | FK→`proveedores`, FK desde `productos_atributos` | plan_t-075:33 |
| `productos_atributos` | Ficha técnica del catálogo | Extensión 1:1 de `productos_catalogo` para atributos físicos y dinámicos. **Dueña de la ficha de CLASE.** | FK 1:1→`productos_catalogo`, FK→`marcas`, FK→`campos_tecnicos_definicion` (opcional) | plan_t-075:57-61 |
| `campos_tecnicos_definicion` | Definición de campos dinámicos | Catálogo de campos personalizados por tipo de producto (ej: voltage para electrodomésticos). | 1—N `productos_atributos` (vía `campos_personalizados_json`) | plan_t-075:72-75 |

### 1.b Entidades existentes (consumidas/referenciadas)

| Schema | Nombre natural | Relación con ficha técnica | Fuente |
|--------|---------------|---------------------------|--------|
| `productos_catalogo` | Catálogo base | Tabla padre 1:1 de `productos_atributos` | FLAG-4 |
| `proveedores` | Proveedor | FK desde `marcas` | REGISTRO §7 |
| `espacios_artefactos` | Artefacto de espacio | **INSTANCIA** (objeto concreto del espacio). FK NULLABLE → `productos_catalogo` para no repetir especificación. | `lib/db/schema.ts:191` |
| `catalogo_acabados` | Vocabulario de acabados | Compartido por CLASE e INSTANCIA (ver `disenio_modulo_espacio.md:87-129`) | REGISTRO §2 |

### 1.c Jerarquía de consumo

```
proveedores
   └── marcas (1:N)
      └── productos_atributos (1:1 con productos_catalogo)
          └── campos_tecnicos_definicion (N:1 vía tipo_item)

productos_catalogo
   └── productos_atributos (1:1, CLASE)
   └── espacios_artefactos (0:N, INSTANCIA, FK nullable)
```

---

## 2. Decisiones Axiomáticas (FR/DP)

### 2.a Requisitos Funcionales (FR)

| ID | FR | Tipo | Descripción |
|----|----|------|-------------|
| FR-01 | Ficha física de producto | CLASE | Todo producto vendible (bisagra, corredera, tablero, electrodoméstico referencial) tiene ficha física: dimensiones (mm), peso (g), material, ficha proveedor (URL/PDF + imagen), unidad de compra. |
| FR-02 | Campos dinámicos por tipo | CLASE | Cada tipo de producto tiene campos técnicos específicos (ej: electrodoméstico → voltage, tipo_apertura, capacidad; estufa → combustible, #quemadores; tablero → espesor, tipo_borde). |
| FR-03 | Ficha de proveedor | CLASE | URL/PDF de ficha técnica del fabricante + imagen de referencia. |
| FR-04 | Marca del producto | CLASE | Atributo de marca (ej: Blum, DeWalt, Bosch) vinculada a proveedor. |
| FR-05 | Captura de instancia | INSTANCIA | Objetos concretos del espacio (impresora del cliente, cortina bloque) se miden y validan en sitio (retoma E-15). |

### 2.b Principios de Diseño (DP)

| ID | DP | Axioma | Decisión |
|----|----|--------|----------|
| DP-01 | **Un solo dueño por dato** | Cada campo tiene exactamente una tabla donde nace. | `productos_atributos` es dueña de ficha de CLASE; `espacios_artefactos` de INSTANCIA. |
| DP-02 | **Clase ↔ Instancia** | El catálogo define lo posible; el nodo elige. | No se duplica ficha técnica en el módulo. |
| DP-03 | **No acoplamiento** | FR-catálogo (CLASE) y FR-espacio (INSTANCIA) son independientes. | Conexión opcional vía FK NULLABLE. |
| DP-04 | **Extensibilidad** | Campos dinámicos sin schema rígido. | `campos_personalizados_json` (JSONB) guiado por `campos_tecnicos_definicion`. |
| DP-05 | **Trazabilidad** | Linaje de datos. | `procedencia` tabla (ya existe, REGISTRO §1) registra origen. |

### 2.c Matriz de Independencia (Suh)

| FR/DP | FR-01 | FR-02 | FR-03 | FR-04 | FR-05 |
|-------|-------|-------|-------|-------|-------|
| **DP-01** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DP-02** | ✅ | ✅ | ✅ | ✅ | ❌ (INSTANCIA no usa catálogo) |
| **DP-03** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **DP-04** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **DP-05** | ✅ | ✅ | ✅ | ✅ | ✅ |

**Conclusión:** El diseño cumple el **Axioma de Independencia** (Suh): cada FR se satisface con un DP único sin acoplamiento.

---

## 3. Lista de Campos Dinámicos por Tipo

### 3.a `campos_tecnicos_definicion` (Tabla de definición)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `id` | UUID PK | Identificador único | `uuid()` |
| `tipo_item` | VARCHAR | Tipo de producto (enum) | `electrodomestico`, `estufa`, `tablero`, `bisagra`, `corredera` |
| `campo_clave` | VARCHAR | Clave técnica del campo | `voltage`, `apertura`, `capacidad`, `combustible`, `num_quemadores`, `espesor`, `tipo_borde` |
| `etiqueta` | VARCHAR | Label para UI | "Voltage (V)", "Tipo de apertura", "Capacidad (L)" |
| `tipo_dato` | ENUM | Tipo de dato | `number`, `text`, `enum`, `boolean` |
| `opciones_json` | JSONB | Opciones válidas (si `tipo_dato='enum'`) | `["induction", "gas"]` para `combustible` |
| `requerido` | BOOLEAN | Campo obligatorio | `true` para `espesor` en tableros |
| `unidad` | VARCHAR | Unidad de medida | "V", "mm", "L", "kg" |

### 3.b Ejemplos de Campos por Tipo

#### Tipo: `electrodomestico`
| campo_clave | etiqueta | tipo_dato | opciones_json | requerido | unidad |
|-------------|----------|-----------|--------------|-----------|--------|
| `voltage` | Voltage | number | - | true | V |
| `tipo_apertura` | Tipo de apertura | enum | `["abatible", "corrediza", "elevable"]` | true | - |
| `capacidad` | Capacidad | number | - | false | L |
| `potencia_w` | Potencia | number | - | false | W |

#### Tipo: `estufa`
| campo_clave | etiqueta | tipo_dato | opciones_json | requerido | unidad |
|-------------|----------|-----------|--------------|-----------|--------|
| `combustible` | Combustible | enum | `["induction", "gas_natural", "gas_propano"]` | true | - |
| `num_quemadores` | N° quemadores | number | - | true | - |
| `ancho_mm` | Ancho | number | - | true | mm |

#### Tipo: `tablero`
| campo_clave | etiqueta | tipo_dato | opciones_json | requerido | unidad |
|-------------|----------|-----------|--------------|-----------|--------|
| `espesor` | Espesor | number | - | true | mm |
| `tipo_borde` | Tipo de borde | enum | `["recto", "redondeado", "biselado"]` | false | - |
| `densidad_kg_m3` | Densidad | number | - | false | kg/m³ |

#### Tipo: `bisagra` / `corredera`
| campo_clave | etiqueta | tipo_dato | opciones_json | requerido | unidad |
|-------------|----------|-----------|--------------|-----------|--------|
| `ancho_mm` | Ancho | number | - | true | mm |
| `alto_mm` | Alto | number | - | true | mm |
| `profundo_mm` | Profundo | number | - | true | mm |
| `angulo_apertura` | Ángulo de apertura | number | - | false | ° |
| `carga_max_kg` | Carga máxima | number | - | false | kg |

### 3.c `productos_atributos` (Tabla 1:1 con `productos_catalogo`)

| Campo | Tipo | Nullable | Descripción | Ejemplo |
|-------|------|----------|-------------|---------|
| `catalogo_id` | UUID PK FK | NOT NULL | Relación 1:1 con `productos_catalogo` | `prod-catalogo-uuid` |
| `marca_id` | UUID FK | NULL | FK→`marcas` | `marca-blum-uuid` |
| `modelo_fabricante` | VARCHAR | NULL | Modelo del fabricante | "DCD791" (DeWalt) |
| `ancho_mm` | INTEGER | NULL | Ancho en milímetros | 600 |
| `alto_mm` | INTEGER | NULL | Alto en milímetros | 800 |
| `profundo_mm` | INTEGER | NULL | Profundidad en milímetros | 400 |
| `peso_g` | INTEGER | NULL | Peso en gramos | 1200 |
| `material` | VARCHAR | NULL | Material principal | "Acero inoxidable", "MDF 18mm" |
| `ficha_proveedor_url` | VARCHAR(1024) | NULL | URL de ficha técnica del proveedor (PDF) | `https://.../ficha_blum.pdf` |
| `ficha_proveedor_imagen_url` | VARCHAR(1024) | NULL | URL de imagen de referencia del proveedor | `https://.../imagen_blum.jpg` |
| `campos_personalizados_json` | JSONB | NULL | Campos dinámicos según `tipo_catalogo` | `{"voltage": 220, "tipo_apertura": "abatible"}` |
| `unidad_compra` | VARCHAR(20) | NULL | Unidad de compra (default: heredado de `productos_catalogo`) | "pieza", "metro", "par" |

**Constraints:**
- `FK (catalogo_id) REFERENCES productos_catalogo(id)` + `UNIQUE (catalogo_id)` (1:1)
- `FK (marca_id) REFERENCES marcas(id)`
- `CHECK (ancho_mm IS NULL OR ancho_mm > 0)` (y similares para alto/profundo/peso)

---

## 4. VINTA con REGISTRO/Glosario

### 4.a Verificación de Integridad con REGISTRO_DE_ENTIDADES.md

| Entidad | Existe en REGISTRO | Acción | Traza |
|---------|-------------------|--------|-------|
| `marcas` | ❌ | Agregar en §2 Catálogo | plan_t-075:33 |
| `productos_atributos` | ❌ | Agregar en §2 Catálogo | plan_t-075:57 |
| `campos_tecnicos_definicion` | ❌ | Agregar en §2 Catálogo | plan_t-075:72 |
| `espacios_artefactos` | ❌ | Agregar en §2 (ya existe en schema.ts pero no en REGISTRO) | `lib/db/schema.ts:191` |

### 4.b Verificación de Integridad con Glosario

| Término | Existe en glosario_h07.md | Acción | Label propuesto |
|---------|--------------------------|--------|-----------------|
| Ficha técnica del catálogo | ❌ | Agregar en §A | "Ficha técnica" |
| Artefacto de espacio | ❌ | Agregar en §A | "Artefacto de espacio" |
| Determinante de diseño | ❌ | Agregar en §A | "Determinante de diseño / objeto bloqueante" |
| Objeto bloqueante | ❌ | Agregar en §A | Ver "Determinante de diseño" |

### 4.c Verificación de Integridad con Lógica de Negocio

| Concepto | Existe en logica_de_negocio.md | Acción | Sección |
|----------|--------------------------------|--------|----------|
| CLASE vs INSTANCIA | ✅ (implícito) | Añadir reflexión explícita | §3 (Control de cronograma) |
| Ficha técnica | ❌ | Añadir narrativa | Parte I (Diseño de negocio) |

---

## 5. Impacto en BOM/Compras/3D

### 5.a BOM (Lista de Materiales)
- **Impacto:** `bom_materiales` (REGISTRO §6) puede heredar **dimensiones/peso** de `productos_atributos` para:
  - Cálculo de **volumen de transporte** (m³).
  - Validación de **compatibilidad física** (ej: tablero de 18mm vs. herraje para 16mm).
- **Relación:** `bom_materiales.producto_catalogo_id` → `productos_catalogo.id` → `productos_atributos.catalogo_id` (JOIN).

### 5.b Compras (Ordenes de Compra)
- **Impacto:** `items_orden_compra` (REGISTRO §7) puede validar:
  - **Especificaciones técnicas** contra ficha del proveedor (`ficha_proveedor_url`).
  - **Unidad de compra** (`unidad_compra` en `productos_atributos` vs. `unidad_medida` en `productos_catalogo`).
- **Ejemplo:** Si `productos_atributos.unidad_compra = "caja de 10 unidades"`, la OC debe ser múltiplo de 10.

### 5.c 3D (Modelado)
- **Impacto:** Modelos 3D (F-08) pueden parametrizarse con:
  - **Dimensiones** (`ancho_mm`, `alto_mm`, `profundo_mm`) para escalado automático.
  - **Material** para texturas/acabados (vinculado a `catalogo_acabados`).
- **Relación:** `modulos_artefactos.modelo_3d_url` (si `fuente='heredado_catalogo'`) puede reutilizar el modelo 3D de la CLASE.

---

## 6. Plan de Migración de Mock a Real

### 6.a Fase 1: Mock (F10)
- **Objetivo:** Prototipar pantallas con datos mock de ficha técnica.
- **Acciones:**
  1. Crear `lib/data/mocks/ficha_tecnica.ts` con ejemplos de `productos_atributos` por tipo.
  2. Mock de `campos_tecnicos_definicion` con definiciones de campos por tipo.
  3. Mock de `marcas` con datos reales (Blum, DeWalt, Bosch, etc.).
- **Criterio de aceptación:**
  - `npx tsc --noEmit` 0 errores.
  - Pantallas de catálogo muestran fichas técnicas mock.

### 6.b Fase 2: Schema (t-NNN)
- **Objetivo:** Implementar tablas en `lib/db/schema.ts` + migración.
- **Acciones:**
  1. Agregar tablas `marcas`, `productos_atributos`, `campos_tecnicos_definicion` a `schema.ts`.
  2. Crear migración Drizzle para las nuevas tablas.
  3. Seed inicial con datos reales de marcas y campos técnicos.
- **Criterio de aceptación:**
  - `npx tsc --noEmit` 0 errores.
  - `npx eslint .` 0 errores.
  - `npm run db:migrate` + `db:seed` limpios en `dev-local`.

### 6.c Fase 3: Integración (t-NNN+1)
- **Objetivo:** Integrar ficha técnica en cotizador, compras, BOM, 3D.
- **Acciones:**
  1. **Cotizador (P-04):** Mostrar ficha técnica en detalle de producto.
  2. **Compras (P-13):** Validar especificaciones contra ficha proveedor.
  3. **BOM (P-08):** Heredar dimensiones/peso para cálculos.
  4. **3D (F-08):** Parametrizar modelos con dimensiones reales.
- **Criterio de aceptación:**
  - Round-trip: producto con ficha técnica persistido y leído sin pérdida.
  - Validación de compatibilidad (ej: tablero 18mm + herraje para 18mm).

### 6.d Fase 4: Backfill (t-NNN+2)
- **Objetivo:** Migrar datos legacy a nuevo schema.
- **Acciones:**
  1. Mapear `productos_catalogo.descripcion` legacy → `productos_atributos.material` (si aplica).
  2. Extraer dimensiones de `productos_catalogo.sku` (ej: "TABL-18mm" → `espesor=18`).
  3. Asignar `marca_id` basado en `proveedores` existentes.
- **Criterio de aceptación:**
  - Script de migración idempotente.
  - 0 datos perdidos (validación manual con Javier).

---

## 7. Decisiones Pendientes (para Supervisor)

1. **¿Aprobar el diseño del mini-diamante?**
   - Sí → Proceder con `plan_t-NNN.md` (código).
   - Ajustes → Indicar cambios específicos.

2. **¿Confirmar enumerado de `tipo_item` en `campos_tecnicos_definicion`?**
   - Propuesto: `electrodomestico`, `estufa`, `tablero`, `bisagra`, `corredera`, `herraje`, `perfil`, `tornillo`, `pintura`, `laminado`.
   - ¿Falta algún tipo?

3. **¿Validar campos dinámicos propuestos?**
   - Ver §3.b (ejemplos por tipo).
   - ¿Agregar/eliminar campos?

---

## 8. Referencias

- `arnes/lineas/ola7/tecnico/plan_t-075.md` (decisiones 2, 5, esquema línea 57-75)
- `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§2 Catálogo)
- `arnes/lineas/ola7/archivo/OLA_6_FLAG4_PRODUCTOS_CATALOGO.md`
- `arnes/lineas/ola7/pantallas/disenio_modulo_espacio.md` (CLASE vs INSTANCIA)
- `lib/db/schema.ts:191` (`espacios_artefactos` existente)
