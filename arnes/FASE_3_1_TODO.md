# Fase 3.1: UI/UX - Integración de Grupos como Entidades Completas

**Status:** Documentado para implementación (tokens insuficientes)  
**Commit:** `5238385` (Fases 2+3 schema + tipos + actions)

## Overview

Grupos ahora son entidades completas (mano de obra, estado, relación a catálogo). Fase 3.1 conecta esto con la UI.

---

## Tareas

### T1: Componentes de Grupo en Cotizador

**Archivo:** `app/erp/(modern)/cotizador/[proyectoId]/page.tsx`

Extensiones necesarias:
- [ ] Expandable para mostrar jornadas propias de grupo
- [ ] Inputs: jornadasDesarrolloTecnico, jornadasEnsamblajeTaller, jornadasInstalacionObra
- [ ] Cálculo de precio público: suma ítems + valor mano de obra
- [ ] Toolbar de grupo con botones:
  - "Convertir a Producto" (abre modal)
  - "Editar Grupo"
  - "Duplicar"
  - "Borrar"

### T2: Modal "Convertir Grupo a Producto de Catálogo"

**Location:** Nueva modal o extender `CreateProductModal`

Estructura:
```tsx
<ConvertirGrupoAProductoModal
  grupo={grupoHidratado}
  onConfirm={async (datosProducto) => {
    await convertirGrupoAProductoAction(grupo.id, datosProducto)
  }}
/>
```

Campos:
- Nombre del producto (pre-rellenado: grupo.nombre)
- SKU (auto-generado: GRUPO-{grupoId.substring(0, 8)})
- Descripción (combo: grupo.contenedor.descripcion)
- Categoría comercial (dropdown)
- Precio público (pre-calculado: sum(items) + mano de obra)
- Vista previa: ítems que formarán el producto compuesto
- Botón "Archivar Grupo → Crear Producto"

### T3: Propuesta Pública - Render de Grupos

**Archivo:** `app/(publico)/propuesta/[proyectoId]/PropuestaPublicaClient.tsx`

Cambio:
- Grupos aparecen como bloques colapsables (no expandidos por defecto)
- Muestra: nombre grupo + precioPublicoGrupo (no suma de ítems individuales)
- Click para expandir → muestra ítems dentro
- Icono de foto (grupo.contenedor.fotosDisenio[0] si existe)

### T4: Correcciones de Tipos en Componentes

**Errores restantes** (23 TS errors):
- [ ] PropuestaPublicaClient.tsx: lines 711, 658-708 → usar `?? []` para fallback
- [ ] ContratoModal.tsx: lines 665, 667 → usar `?.` operator
- [ ] cotizador/page.tsx: lines 1578-1657, 2982-2984 → fallbacks para fotos
- [ ] proyectos/page.tsx: lines 377-381 → type safety para urls

### T5: Queries para Cargar Grupos Hidratados

**Archivo:** `lib/data/actions/lecturas-cotizador.ts`

Nueva función:
```typescript
export async function obtenerGruposItemHidratados(
  espacioVarianteId: string
): Promise<GrupoItemHidratado[]>
```

Lógica:
- SELECT gruposItem LEFT JOIN contenedoresDescriptivos
- Para cada grupo: cargar items (grupoItemId = grupo.id)
- Cargar subgrupos recursivamente (padreId = grupo.id)
- Retornar árbol completo

### T6: Cálculo de Precio Público de Grupo

**Archivo:** Crear `lib/data/queries/grupo-calculado.ts`

```typescript
export function calcularGrupoItemCalculado(
  grupo: GrupoItemHidratado,
  parametrosFinancieros: { tasaManoObraDesarrollo, tasaManoObraEnsamblaje, tasaManoObraInstalacion }
): GrupoItemCalculado
```

Fórmula:
```
sumaItemsNeto = Σ(items.precioUnitario * items.cantidad)
sumaItemsConIVA = sumaItemsNeto * (1 + tasaIVA)
valorManoObraEstimada = 
  (jornadasDesarrolloTecnico * tasaManoObraDesarrollo) +
  (jornadasEnsamblajeTaller * tasaManoObraEnsamblaje) +
  (jornadasInstalacionObra * tasaManoObraInstalacion)
precioPublicoGrupo = sumaItemsConIVA + valorManoObraEstimada
```

### T7: Fixtures - Crear Contenedores para Grupos

**Archivo:** `lib/data/fixtures.ts`

Actualización:
- Cuando se crean gruposItem de fixtures → crear su contenedorDescriptivo
- Ejemplo: grupo "Isla Central" con descripción + fotosDisenio

---

## Dependencias

| Tarea | Bloqueada por | Estado |
|-------|---------------|--------|
| T1 | T6 (cálculos) | 🔴 Bloqueada |
| T2 | T1 | 🔴 Bloqueada |
| T3 | T5 (queries) | 🔴 Bloqueada |
| T4 | Nada | 🟡 En espera (bajo impacto, puede hacerse paralelo) |
| T5 | Nada | 🟢 Puede empezar |
| T6 | Nada | 🟢 Puede empezar |
| T7 | Nada | 🟢 Puede empezar |

---

## Notas

- **Compilación:** Actualmente 23 errores de TS (mostly type-safety en componentes, no lógica rota)
- **Migraciones Drizzle:** Ver `arnes/FASE_2_3_MIGRACION.sql` (TODO generarlo)
- **Testing:** Unitarios para `calcularGrupoItemCalculado` en `lib/data/queries/grupo-calculado.test.ts`
- **PR:** Este cambio va en rama `dev`, automáticamente en producción (Vercel ya redirige)

---

## Checklist de Completitud

- [ ] Todos los errores TS resueltos
- [ ] Grupos cargan con contenedor descriptivo en cotizador
- [ ] Modal "Convertir a Producto" funciona
- [ ] Propuesta pública rendea grupos colapsables
- [ ] Fixtures crean contenedores para grupos
- [ ] E2E: crear grupo → editar → convertir → verificar en catálogo
