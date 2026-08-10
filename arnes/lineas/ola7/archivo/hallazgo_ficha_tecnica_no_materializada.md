# Hallazgo: Ficha Técnica del Catálogo NO Materializada

**ID:** H-FICHA-TEC-2026-08-09  
**Fecha:** 2026-08-09  
**Tipo:** Desalineación schema vs diseño (FR no implementado)  
**Severidad:** Alto (bloquea implementación de ficha técnica dinámica)  
**Fuente:** Revisión de plan_t-075 vs REGISTRO_DE_ENTIDADES.md vs lib/db/schema.ts  

---

## 1. Descripción del Hallazgo

La decisión **t-075#2** (2026-08-05, `arnes/lineas/ola7/tecnico/plan_t-075.md:34`) definió la **ficha técnica DINÁMICA** por tipo de producto, materializada como:
- Tabla 1:1 `productos_atributos` (campos físicos + ficha proveedor + campos personalizados JSONB)
- Tabla `marcas` (id, nombre UNIQUE, proveedor_id FK, categoria)
- Tabla `campos_tecnicos_definicion` (definición de campos dinámicos por tipo: electrodoméstico, estufa, tablero, etc.)

**Evidencia de que NO fue materializada en ninguna capa:**

### 1.a REGISTRO_DE_ENTIDADES.md (§2 Catálogo)
- **Grep:** 0 matches para `productos_atributos`, `marcas`, `campos_tecnicos_definicion`
- **Contenido actual:** Solo lista `categorias`, `productos_catalogo`, `productos_tienda`, `materiales_insumos`, `catalogo_acabados`, `acabados_muestras`, `catalogo_producto_acabados`
- **Fuente:** `arnes/nucleo/REGISTRO_DE_ENTIDADES.md:34-46`

### 1.b lib/db/schema.ts
- **Grep:** 0 matches para `productos_atributos`, `marcas`, `campos_tecnicos_definicion`
- **Contenido actual:** Solo incluye tablas de FLAG-4 base (`productos_catalogo`, `productos_tienda`, `materiales_insumos`) + `espacios_artefactos` (que SÍ existe, línea 191)
- **Fuente:** `lib/db/schema.ts` (verificado 2026-08-09)

### 1.c Contrato TypeScript
- **`ProductoCatalogo`:** Solo incluye `imagenUrl` + `modelo3DUrl` (heredado de FLAG-4), sin:
  - Dimensiones (ancho/alto/profundo_mm)
  - Peso (peso_g)
  - Material
  - Ficha proveedor (URL/PDF + imagen)
  - Campos personalizados dinámicos
- **Fuente:** Implícito en `OLA_6_FLAG4_PRODUCTOS_CATALOGO.md:26-43` (tabla base sin atributos técnicos)

### 1.d Desalineación adicional
- `espacios_artefactos` **SÍ existe** en `lib/db/schema.ts:191` (tabla para objetos concretos del espacio), pero:
  - **NO está registrado** en REGISTRO_DE_ENTIDADES.md §2
  - **NO está alineado** con el principio CLASE vs INSTANCIA (ver §2 abajo)

---

## 2. Impacto

### 2.a Bloqueo de funcionalidad
- **Cotizador (P-04):** No puede mostrar fichas técnicas dinámicas por tipo de producto (ej: voltage para electrodomésticos, espesor para tableros).
- **Compras (P-13):** No puede validar especificaciones técnicas de materiales/insumos contra ficha del proveedor.
- **BOM (P-08):** No puede heredar dimensiones/peso de productos de catálogo para cálculos de transporte o instalación.
- **3D (F-08):** No puede parametrizar modelos 3D con dimensiones reales de herrajes/tableros.

### 2.b Violación de axiomas
- **Regla de supremacía del REGISTRO** (`REGISTRO_DE_ENTIDADES.md:4`): "Si este documento difiere de cualquier otra fuente, gana este".
  - **Problema:** t-075 define tablas que REGISTRO no incluye → **REGISTRO está incompleto**.
- **Un solo dueño por dato** (`REGISTRO_DE_ENTIDADES.md:194`): La ficha técnica no tiene dueño (no existe en schema).
- **Clase ↔ Instancia** (`REGISTRO_DE_ENTIDADES.md:196`): `espacios_artefactos` (INSTANCIA) no está explícitamente desacoplado de `productos_atributos` (CLASE, no implementada).

---

## 3. Causa Raíz

**Falta de sincronización entre decisiones:**
1. **t-075** (2026-08-05) aprueba el grafo de catálogos incluyendo `productos_atributos`, `marcas`, `campos_tecnicos_definicion`.
2. **REGISTRO_DE_ENTIDADES.md** se promueve el 2026-08-07 **sin absorber t-075** (error humano: no se actualizó el REGISTRO con las nuevas tablas).
3. **schema.ts** (F0) se implementa basado en REGISTRO (que no incluía las tablas de t-075) → **las tablas nunca se crearon**.

**Consecuencia:** Las tablas de ficha técnica quedaron en **limbo**: decididas pero no registradas ni implementadas.

---

## 4. Solución Propuesta (Mini-Diamante 2026-08-09)

Ver:
- `arnes/lineas/ola7/archivo/disenio_ficha_catalogo.md` (diseño completo)
- `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (actualización §2)
- `arnes/nucleo/glosario_h07.md` (nuevos labels)
- `arnes/nucleo/logica_de_negocio.md` (reflexión CLASE vs INSTANCIA)
- `arnes/lineas/ola7/tecnico/plan_t-NNN.md` (plan de código para implementación)

**Decisión canónica:**
- **Agregar filas en REGISTRO** para `marcas`, `productos_atributos`, `campos_tecnicos_definicion` (opción a de la tensión REGISTRO vs t-075).
- **Marca:** `[POC/2026-08-09]`

---

## 5. Verificación de Integridad (Checklist)

- [ ] `productos_atributos` existe en REGISTRO_DE_ENTIDADES.md §2
- [ ] `marcas` existe en REGISTRO_DE_ENTIDADES.md §2
- [ ] `campos_tecnicos_definicion` existe en REGISTRO_DE_ENTIDADES.md §2
- [ ] `espacios_artefactos` existe en REGISTRO_DE_ENTIDADES.md §2 (ya existe en schema.ts pero no en REGISTRO)
- [ ] Nota de coexistencia CLASE vs INSTANCIA agregada en REGISTRO
- [ ] Todos los campos propuestos en `disenio_ficha_catalogo.md` tienen traza en REGISTRO/glosario
- [ ] No hay referencias huérfanas a `ficha_tecnica_json` (legacy) en el código nuevo

---

## 6. Referencias

- `arnes/lineas/ola7/tecnico/plan_t-075.md` (decisiones 2, 5, esquema línea 57-75)
- `arnes/nucleo/REGISTRO_DE_ENTIDADES.md` (§2 Catálogo)
- `arnes/lineas/ola7/archivo/OLA_6_FLAG4_PRODUCTOS_CATALOGO.md`
- `lib/db/schema.ts` (verificado: no contiene las tablas)
