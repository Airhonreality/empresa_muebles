# ZU_04: Plan de UI y Usabilidad Comercial (Fase Post-Zustand Cotizador)

**Fecha:** 2026-09-03  
**Estado:** PLANIFICADO (Entrada en vigencia estricta tras la aprobación y verificación de la Fase 2 de Zustand)  
**Línea de trabajo:** `arnes/lineas/ola7/tecnico/zustand-migration/`  
**Rol responsable:** Orquestador / Iniciador  
**Dependencias:** ZN-001 (Fase 0), ZN-002 (Fase 1 mergeada en `dev`), ZN-003 (Fase 2 Cotizador)  

---

## 1. Registro y Cumplimiento de Observaciones de Campo

| # | Observación de Campo | Diagnóstico Técnico en Código Real | Solución Planificada en este Documento |
|---|---|---|---|
| **O-01** | **Modal de Ítem y Reemplazo:** Modal es solo lectura; borrar genera registro fantasma (`anulado=true`) en DB. | `ItemDescriptorModal` solo recibe `ProductoCatalogo`, no el ítem cotizado. `eliminarItemAction` hace `UPDATE items_variante SET anulado=true` inflando Neon. | `ItemEditorModal`: Reemplazo *in-situ* de producto conservando fila + política de Hard Delete en cotizaciones preliminares. |
| **O-02** | **Variantes / Tabs:** No se sabe cómo renombrarlas y no existe acción para eliminarlas. | Renombrar estaba escondido en `FormDetallesEspacio`. La acción de eliminar variante **no existía** en todo el backend ni store. | Tabs con renombrado inline (`Enter`/`onBlur`) + `eliminarVariante()` con guardia de integridad en backend. *(Asignado a Fase 2 ZN-003)*. |
| **O-03** | **Espacios:** No se puede borrar un espacio completo. | `store.espacios.eliminar` ausente en contratos y UI. | Botón de eliminación en la cabecera de `EspacioGroup` con confirmación. |
| **O-04** | **ImagePicker Multi-archivo:** No toma varias imágenes arrastradas o seleccionadas a la vez. | `components/veta/image-picker.tsx`: `forEach(agregarArchivo)` produce un **stale closure** sobre `value`. Cada upload sobreescribe al anterior. | Procesamiento asíncrono por lotes con `Promise.all` emitiendo un único `onChange([...value, ...nuevasUrls])`. |
| **O-05** | **Campo de Color y Acabados:** Input de texto CSV plano desconectado de la DB. | `lib/db/schema.ts:1383` ya tiene `catalogo_acabados` con hex y fotos HD. `colores` es `jsonb` desaprovechado. | Tipado agnóstico `AcabadoItem` sobre `jsonb` + componente `AcabadoPicker` con swatches y texturas HD. |
| **O-06** | **Layouts / Presets de Cotización:** Cargar cocinas o closets típicos para customizar. | Actualmente se deben buscar 20-30 ítems manuales desde cero para cada espacio típico. | Presets estándar en `lib/catalogos/presets-espacios.ts` + modal UI `+ Desde Plantilla` que precarga espacio e ítems en un clic. |
| **O-07** | **Ítem Libre / A Medida:** Crear ítem no catalogado saca destructivamente al comercial de la vista. | `SmartSearch` hace `window.location.href = '/erp/catalogo'`. El schema ya soporta `catalogoId: null`. | Soporte nativo en el cotizador para agregar ítem libre con nombre y precio sin salir de la pantalla. |
| **O-08** | **Guardias de Estado:** Cotizaciones en contrato o producción siguen siendo editables sin `?readonly=true`. | Falta de validación automática por `proyecto.estado`. | Banner automático y bloqueo a solo lectura si el proyecto pasa a contrato o producción. |

---

## 2. Diagnósticos Técnicos Profundos

### 2.1. Bug de Carga Múltiple en `ImagePicker` (`components/veta/image-picker.tsx`)
* **Causa raíz comprobada:** En líneas 78 y 156 se ejecuta `Array.from(files).forEach(agregarArchivo)`. `agregarArchivo` es asíncrono y hace `onChange([...value, limpio])`. Todas las iteraciones capturan el mismo array `value` inicial. Al resolverse concurrentemente las promesas, cada una sobreescribe a las demás y solo la última sobrevive.
* **Solución técnica:**
  ```typescript
  const procesarArchivosMultiples = async (files: File[]) => {
    if (!multiple) {
      if (files[0]) await procesarUnico(files[0]);
      return;
    }
    setIsUploading(true);
    try {
      const urlsNuevas = await Promise.all(
        files.filter(f => f.type.startsWith("image/")).map(f => uploadToR2 ? uploadFileToR2(f, r2Prefix) : Promise.resolve(URL.createObjectURL(f)))
      );
      const combinadas = Array.from(new Set([...value, ...urlsNuevas]));
      onChange(combinadas);
    } finally {
      setIsUploading(false);
    }
  };
  ```

### 2.2. Campo de Colores y Schemas de Acabados
* **Estado en DB:** `catalogo_acabados` (`lib/db/schema.ts:1383`) posee: `nombre`, `familia`, `color`, `colorHex`, `textura`, `precioDiferencial` e `imagenTexturaUrl`.
* **Solución agnóstica:** `espacio_variantes.colores` es `jsonb`. Tipar en TypeScript:
  ```typescript
  export interface AcabadoItem {
    acabadoId?: string;       // FK opcional a catalogo_acabados.id
    nombre: string;           // Nombre visible
    familia?: string;          // Melamina, Poliuretano, Madera, Piedra
    colorHex?: string;         // Swatch hex para UI rápida
    imagenTexturaUrl?: string; // Textura HD
    ubicacion?: string;        // "Frentes", "Estructura", "Mesón"
  }
  ```
  Con normalizador para strings legacy `["Blanco"]` -> `{ nombre: "Blanco" }`. El nuevo `AcabadoPicker` ofrece buscador visual con swatches y fotos de muestra reales.

### 2.3. Sistema de Layouts / Plantillas de Cotización
* **Capa A (Presets canónicos tipados):** `lib/catalogos/presets-espacios.ts` define espacios típicos (cocina lineal 2.40m, closet 2 cuerpos, etc.) con sus SKUs base, cantidades y jornadas estimadas.
* **Capa B (UI):** Botón `+ Desde Plantilla` en la cabecera de Espacios que despliega tarjetas visuales y crea el espacio e ítems en ráfaga con una acción atómica.

---

## 3. Especificación de Componentes de UI a Construir

### 3.1. `ItemEditorModal` (Evolución de `ItemDescriptorModal`)
* **Ubicación:** `components/veta/item-editor-modal.tsx`
* **Funcionalidad:** Reemplazo in-situ de producto sin borrar la fila, edición de cantidad/precio/notas, conmutador contractual vs adicional, y descarte limpio.

### 3.2. Tabs Interactivas de Variantes (`EspacioGroup`)
* **Ubicación:** `app/erp/cotizador/[proyectoId]/page.tsx`
* **Funcionalidad:** Renombrado inline directo en pestaña (`Enter`/`onBlur`) + botón `×` en variantes inactivas conectado a `eliminarVariante(id)` con guardia de integridad.

### 3.3. `AcabadoPicker`
* **Ubicación:** `components/veta/acabado-picker.tsx`
* **Funcionalidad:** Selector visual con chips, swatches de color y texturas HD filtrable por familia sobre `catalogo_acabados`.

---

## 4. Próximos Pasos

1. El Agente Operativo ejecuta la **Fase 2 de Zustand (`PLAN_ZN-003.md`)**, la cual ya incluye P3 (`eliminarVariante`) y P4 (rename inline).
2. Completada la Fase 2, se ejecuta este plan `ZU_04` para implementar `ItemEditorModal`, el fix de `ImagePicker`, `AcabadoPicker` y las plantillas de cotización sobre la arquitectura Zustand terminada.
