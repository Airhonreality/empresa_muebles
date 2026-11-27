# Plan t-200 — Desacoplar el cargador de imágenes de la colección de imágenes

**Estado:** APROBADO por el Supervisor (2026-11-27) con ajuste en D3: los campos por imagen los declara el contexto; `alt` y `pie` son atributos base de toda imagen. Ver `arnes/tareas/t-200.json`. Implementación pendiente de P0.

**Registro de decisiones:** D1 y D2 aprobados con la propuesta de la sección 7. D3 resuelto según la sección 7 (ajustada). D4 aprobado con la fase 1 de la cola (sin subida directa a R2 por ahora).
**Sucede a:** nada. Extiende el trabajo de `components/veta/image-picker.tsx` y su cola de subida (plan de subida en segundo plano, decisiones abiertas 1–3 de la conversación del 2026-11-26, pendientes).
**Zona:** código de producto, zona `datos`/UI compartida. Riesgo medio-alto: toca ~20 pantallas que usan `ImagePicker`.

---

## 1. Diagnóstico

### 1.1 Qué hace hoy `ImagePicker` (406 líneas, un solo archivo)

Un único componente hace seis trabajos que no dependen entre sí:

| # | Trabajo | Dónde vive hoy |
|---|---|---|
| a | Ingesta: arrastrar, pegar, "Examinar", campo URL | `handleDrop`, `handlePaste`, `input type=file`, `agregar` |
| b | Normalización: comprimir/redimensionar a WebP | `prepareImageForUpload` |
| c | Almacenamiento: subir a R2, clonar URL externa a R2 | `subirArchivo`, `clonarUrlAR2`, prop `r2Prefix`/`uploadToR2` |
| d | Modelo de colección: agregar, quitar, reordenar, deduplicar | `agregar`, `quitar`, `mover`, `value` |
| e | Presentación: grilla de miniaturas, zoom, controles por miniatura | JSX de la grilla, `GalleryOverlay` |
| f | Estado transitorio: subidas en curso, errores | `subidasEnCurso`, `uploadError` |

Consecuencias observables:

- **Acoplamiento de infraestructura en la UI.** `r2Prefix` y `uploadToR2` son detalles de almacenamiento que cada pantalla tiene que conocer. El olvido de `uploadToR2` ya causó la pérdida de imágenes documentada en `arnes/estado.md` (2026-09-07: URLs `blob:` persistidas en la base).
- **`hideGrid` es un síntoma.** Existe porque el padre necesita su propia grilla y no puede reutilizar la del componente. Es una salida de emergencia, no un diseño.
- **Doble lógica de colección.** La grilla y los controles se calculan dentro del mismo `div` que es zona de arrastre, y la miniatura es a la vez zona de zoom (`button absolute inset-0`). Tres superficies de interacción distintas (zoom, ◀ ▶, ×) comparten el mismo rectángulo.

### 1.2 Por qué las flechas, el zoom y el × se superponen

Según el código (no reproducido visualmente todavía; ver P0):

1. La miniatura tiene un tamaño fijo proporcional a la grilla (`grid-cols-3` en móvil, `md:grid-cols-6`). A 3 columnas en un teléfono, cada miniatura mide ~110 px. Dentro caben tres controles de reordenamiento más el índice `#n` a 10–11 px, y la barra inferior (`absolute bottom-0`) cubre buena parte de la imagen.
2. El botón de ampliar es `absolute inset-0`, o sea cubre toda la miniatura. La barra de flechas y el × se apilan encima por orden de DOM. El resultado es que la imagen completa es un solo blanco de toque con controles encima, sin una zona clara para cada acción.
3. El × aparece solo con `group-hover` (`opacity-0 → group-hover:opacity-100`). En pantallas táctiles no existe hover: **quitar una imagen no es posible desde un celular** salvo por accidente.
4. Las flechas deshabilitadas se muestran al 20 % de opacidad, pero siguen ocupando espacio, así que la barra no se achica nunca.

**Causa raíz:** los controles se diseñaron como capa flotante sobre la imagen en vez de como un espacio propio. El diseño asumió un ratón con hover y una miniatura grande.

### 1.3 Lo que falta para el caso de uso real

Las pantallas del ERP necesitan, además de la lista de imágenes:

- **Texto alternativo (`alt`) y pie de foto** por imagen. Son atributos propios de cualquier imagen en HTML, no del contexto.
- **Tipos de imagen por contexto.** Un espacio cotizado tiene varios tipos (fachada, interior, detalle), cada uno con cantidad máxima y cualidades distintas. Hoy el componente sabe de una sola lista plana.
- **Cualidades de cada tipo** (ej. portafolio: descripción humana del proyecto; renders: tipo de render). Hoy no existen en ningún lado.

Hoy `value: string[]` no puede transportar nada de eso. Agregarlo sin separar capas convertiría el componente en un formulario disfrazado.

---

## 2. Concepto arquitectónico: capas

La regla es: **cada capa conoce solo a la inmediatamente inferior y no sabe de la superior**. La capa 0 no sabe qué es una colección. La capa 1 no sabe de orden. La capa 2 no sabe de R2.

```
┌────────────────────────────────────────────────────────────────┐
│ Contexto (cotizador, portafolio, finanzas…)                    │
│   entrega: lista de SLOTS (tipos de imagen), cada uno con      │
│   etiqueta, máximo y campos propios por imagen.                │
│   Además posee la entidad (espacio, proyecto, concepto) y sus  │
│   textos propios, que NO son de la imagen.                     │
└───────────────┬────────────────────────────────────────────────┘
                │ slots: SlotImagen[]   + valores por slot
┌───────────────▼────────────────────────────────────────────────┐
│ Capa 3 · Panel contextual anidado (por slot)                   │
│   renderiza los inputs que pide el slot: alt y pie (base) y    │
│   los campos declarados. Colección: orden, quitar todo.        │
│   Imagen: campos, mover, ampliar, quitar.                      │
└───────────────┬────────────────────────────────────────────────┘
┌───────────────▼────────────────────────────────────────────────┐
│ Capa 2 · Colección por slot  (components/imagen/coleccion)     │
│   grilla de miniaturas, selección, reordenamiento con teclado  │
│   y arrastre, estado visual (subiendo / error / listo)         │
└───────────────┬────────────────────────────────────────────────┘
                │ acciones: ingresar(archivos|urls), mover, quitar
┌───────────────▼────────────────────────────────────────────────┐
│ Capa 1 · Cargador  (components/imagen/cargador)                │
│   zona de arrastre, pegado, "Examinar", campo URL.             │
│   Entrega "entradas" crudas. No conoce colección ni orden.     │
└───────────────┬────────────────────────────────────────────────┘
                │ entradas crudas: File | Blob | string(URL)
┌───────────────▼────────────────────────────────────────────────┐
│ Capa 0 · Núcleo de imagen  (lib/imagen/)   SIN React, SIN DOM │
│   normalizar(entrada) → Blob canónico (formato, tamaño)        │
│   operaciones puras: insertar, quitar, mover, deduplicar       │
│   tipos: SlotImagen, ImagenItem, AtributosBase                 │
└────────────────────────────────────────────────────────────────┘

        Adaptador de almacenamiento (inyectado, no es capa):
        subir(blob, { prefijo }) → Promise<url>   ← R2 hoy, otro mañana
```

### 2.1 Reglas de dependencia

- **Capa 0** no importa React, ni `components/`, ni `lib/r2/`. Se prueba con `node:assert` y `tsx`, sin navegador.
- **Capa 1** recibe el almacenamiento por inyección (`subir` como prop o contexto). No importa `lib/r2/upload.ts`.
- **Capa 2** no conoce el almacenamiento ni los campos. Solo muestra lo que recibe y emite acciones.
- **Capa 3** recibe los slots y la selección. Renderiza inputs según el tipo de cada campo declarado. No conoce qué significa un slot para el negocio.
- **El contexto** es la única capa que sabe qué es cada slot. Esto reemplaza el `ImagePicker` monolítico en las pantallas que migren.

### 2.2 Qué es responsabilidad del módulo y qué del contexto

Hay tres niveles de datos. Mezclarlos es el error que este diseño evita:

1. **Atributos base de la imagen** (`alt`, `pie`): los pone el módulo, en cada input de imagen, por defecto.
2. **Cualidades del slot** (ej. "tipo de render", "descripción del proyecto"): las declara el contexto por tipo de imagen, y el módulo solo las renderiza.
3. **Entidad y textos de la entidad** (ej. una definición contable, una descripción del espacio): pertenecen al objeto de negocio, no a la imagen. Aunque una imagen ilustre un concepto, el texto del concepto se edita en el formulario del contexto, fuera del módulo.

### 2.2 Compatibilidad durante la migración

`ImagePicker` queda como **fachada de compatibilidad**: compone capa 1 + capa 2 + almacenamiento R2 con sus props actuales (`value: string[]`, `multiple`, `uploadToR2`, `r2Prefix`). Las ~20 pantallas no cambian en P2. `hideGrid` se elimina en P5, cuando todas las pantallas usen la colección nueva o la grilla propia desaparezca de forma natural.

---

## 3. Diseño axiomático

Se sigue el enfoque de Suh (diseño axiomático): primero las **necesidades funcionales (FR)**, luego los **parámetros de diseño (DP)** que las satisfacen, y el diseño se evalúa con dos axiomas.

- **Axioma 1 (independencia):** cada FR se satisface con un DP, y cambiar un DP no debe obligar a cambiar otra FR. La matriz de diseño debe ser triangular (o diagonal).
- **Axioma 2 (información):** entre los diseños que cumplen el Axioma 1, se prefiere el de menor contenido de información. Un campo de metadatos solo existe si el contexto lo declara.

### 3.1 Necesidades funcionales (FR)

| FR | Necesidad |
|---|---|
| FR1 | Incorporar imágenes desde archivo, portapapeles, arrastre o URL |
| FR2 | Normalizar cualquier formato de origen a un formato canónico y de tamaño acotado |
| FR3 | Obtener una referencia estable y persistible para cada imagen |
| FR4 | Representar la colección como lista ordenada |
| FR5 | Cambiar el orden de la colección |
| FR6 | Quitar imágenes de la colección |
| FR7 | Renderizar, por tipo de imagen, los campos que el contexto declara |
| FR8 | Previsualizar y ampliar una imagen |
| FR9 | Mostrar el estado de cada imagen (subiendo, error, lista) |
| FR10 | Ofrecer por defecto los atributos HTML de la imagen (`alt`, `pie`), desactivables por input |

### 3.2 Parámetros de diseño (DP)

| DP | Parámetro | Satisface |
|---|---|---|
| DP1 | Módulo de ingesta (capa 1) | FR1 |
| DP2 | Normalizador puro (capa 0) | FR2 |
| DP3 | Adaptador de almacenamiento inyectado | FR3 |
| DP4 | Modelo de datos `ImagenItem<M>[]`; el orden es la posición en el array | FR4 |
| DP5 | Operaciones puras `mover`, `quitar` (capa 0) | FR5, FR6 |
| DP6 | Contrato de slots declarado por el contexto (tipos de imagen y sus campos) | FR7 |
| DP7 | Grilla de miniaturas sin controles flotantes (capa 2) | FR8 (parte visual) |
| DP8 | Panel contextual anidado por slot (capa 3) | FR5, FR6, FR7, FR8, FR10 (controles) |
| DP9 | Estado de subida por elemento, fuera del valor del formulario | FR9 |
| DP10 | Atributos base `alt` y `pie` en cada imagen, activos por defecto | FR10 |

### 3.3 Matriz de diseño

Filas = FR, columnas = DP. Una X indica que el DP participa en la FR.

| | DP1 | DP2 | DP3 | DP4 | DP5 | DP6 | DP7 | DP8 | DP9 | DP10 |
|---|---|---|---|---|---|---|---|---|---|---|
| FR1 | X | | | | | | | | | |
| FR2 | | X | | | | | | | | |
| FR3 | | | X | | | | | | | |
| FR4 | | | | X | | | | | | |
| FR5 | | | | | X | | | X | | |
| FR6 | | | | | X | | | X | | |
| FR7 | | | | | | X | | X | | |
| FR8 | | | | | | | X | X | | |
| FR9 | | | | | | | | | X | |
| FR10 | | | | | | | | X | | X |

**Lectura de la matriz:**

- La diagonal principal está cubierta: cada FR tiene un DP propio para FR1–FR4, FR9 y FR10.
- FR5–FR8 y FR10 comparten DP8 (panel). Es un acoplamiento aceptado porque el panel es el único lugar donde viven los controles, y lo que cambia en un control no afecta a los datos. Si el panel llegara a necesitar lógica de almacenamiento para cumplir FR5 o FR6, se rompería el Axioma 1 y habría que revisarlo.
- **Verificación del axioma 1 (prueba mecánica, P1):** cambiar el adaptador de DP3 (R2 → otro) no debe modificar ningún archivo de capas 1 a 3. Cambiar el contrato de slots de DP6 no debe modificar la capa 0 ni la grilla. Agregar un campo a un slot no debe modificar `alt`/`pie` ni el código de otro slot.

### 3.4 Evaluación con el axioma 2

- Costo base del componente: un `url` y los dos atributos base (`alt`, `pie`) por imagen. Nada más.
- Cada campo adicional añade contenido solo cuando el slot lo declara.
- El estado de subida (DP9) no entra al valor persistido. Así el dato guardado no lleva ruido transitorio.
- Los controles se muestran solo para la selección actual, no para todas las miniaturas a la vez. Menos superficies simultáneas, menos información por pantalla.

---

## 4. Modelo de datos

```ts
// lib/imagen/tipos.ts — capa 0, sin React

/** Tipo de campo que el contexto puede declarar para cada imagen de un slot. */
export type TipoCampo =
  | { tipo: "texto"; etiqueta: string; maxLength?: number; multilinea?: boolean }
  | { tipo: "seleccion"; etiqueta: string; opciones: readonly string[] }
  | { tipo: "booleano"; etiqueta: string };

/** Campos propios de un tipo de imagen. Los declara el contexto. */
export type CamposSlot = Record<string, TipoCampo>;

/** Atributos base: el módulo los ofrece en cada imagen. Se desactivan por input. */
export interface AtributosBase {
  alt: string;   // texto alternativo (accesibilidad y SEO). Se marca en el panel si falta.
  pie: string;   // pie de foto visible
}

/** Contrato de un tipo de imagen, entregado por el contexto (ej. "fachada" de un espacio). */
export interface SlotImagen<C extends CamposSlot = CamposSlot> {
  id: string;                 // estable, ej. "espacio:fachada"
  etiqueta: string;           // "Fachada"
  multiple: boolean;          // false = una sola imagen en el slot
  max?: number;               // tope de imágenes en el slot
  atributosBase?: { alt?: boolean; pie?: boolean };  // default: ambos true
  campos?: C;                 // cualidades por imagen de este tipo
}

/** Valores de los campos declarados por el slot, tipados desde C. */
export type ValoresCampos<C extends CamposSlot> = {
  [K in keyof C]?: C[K] extends { tipo: "booleano" } ? boolean : string;
};

/** Una imagen dentro de un slot. */
export interface ImagenItem<C extends CamposSlot = CamposSlot> {
  /** Identificador local estable para React y selección. No se persiste. */
  clienteId: string;
  /** URL canónica en el almacenamiento. Siempre https; nunca blob: ni pending:// */
  url: string;
  /** Atributos base. Vacíos por defecto; el panel los muestra según el slot. */
  base: Partial<AtributosBase>;
  /** Valores de los campos del slot. */
  valores: ValoresCampos<C>;
}
```

**Forma persistida (decidida con D2):** cada imagen se guarda como `{ url, alt?, pie?, valores? }` dentro de la columna jsonb que el contexto ya usa para ese slot. Un lector de compatibilidad acepta el formato antiguo `["url", ...]` y lo convierte a `{ url }` sin migración de datos. Como los slots y su orden los declara el contexto, el módulo no decide dónde se guarda cada slot: eso lo sigue haciendo la pantalla.

**Nota de alcance de `alt` y `pie` por defecto:** activarlos en el módulo cambia la forma de guardado de todos los inputs de imagen del ERP. Por eso su cambio pasa por el mismo checkpoint de D2. Las imágenes antiguas quedan sin `alt` ni `pie`, y el panel avisa "sin texto alternativo" en vez de bloquear el guardado.

---

## 5. Capa 0 — operaciones y normalización (detalle)

- `insertar(coleccion, items, { max, deduplicar })` → nueva colección. Dedupe por `url`.
- `quitar(coleccion, clienteId)` → nueva colección.
- `mover(coleccion, clienteId, posicion)` → nueva colección. `posicion` se valida contra los límites.
- `actualizarValores(coleccion, clienteId, parcial)` → nueva colección, valida `valores` contra `campos` del slot y `base` contra `atributosBase`.
- `normalizar(entrada) → Promise<Blob>`: decide la ruta según el tipo de origen (D1). Imagen estática soportada por el navegador → redimensionar a lado máximo 2000 px, WebP calidad 0.85, sin depender de un umbral de tamaño (hoy solo comprime si pasa de 3 MB). GIF animado y SVG: se conservan tal cual si pesan poco; si no, se rechazan con mensaje claro.

Todas las operaciones son puras y se prueban sin DOM.

---

## 6. Capa 1–3 — comportamiento de la interfaz

### 6.1 Cargador (capa 1)

- Zona de arrastre, pegado, "Examinar", campo URL. Sin grilla.
- Emite `onIngresar(entradas: EntradaImagen[])` y nada más.
- Tamaño mínimo táctil de 44 px en botones.

### 6.2 Colección (capa 2)

- Grilla de miniaturas con **cuatro zonas que no se superponen**:
  1. Imagen: clic = seleccionar. Sin controles encima.
  2. Insignia de posición (`1`, `2`…) en esquina, no interactiva.
  3. Insignia de estado (subiendo / error), solo cuando aplica.
  4. Nada más. El ampliar y quitar viven en el panel.
- Miniatura con tamaño mínimo de 96 px. Si no cabe, la grilla usa menos columnas, no controles más pequeños.
- Teclado: foco en miniatura; `Enter` amplía; `Supr` quita; `Alt+←/→` mueve. Esto da accesibilidad sin hover.
- Arrastre para reordenar como atajo opcional, nunca como único camino.

### 6.3 Panel contextual anidado (capa 3)

Hay un panel por slot. Se muestra al lado de la grilla en escritorio y debajo en móvil. Su contenido depende de la selección:

| Contexto | Muestra |
|---|---|
| Ninguna seleccionada | Slot: etiqueta, cantidad usada de `max`, "Quitar todas" |
| Una seleccionada | Imagen: vista previa grande, botones Ampliar / Mover antes / Mover después / Quitar; inputs de `alt` y `pie` (si el slot los tiene activos); inputs de los `campos` del slot con el tipo que declare cada uno |
| Varias seleccionadas | Acciones masivas: quitar varias, mover al inicio o al final. Los campos del slot se editan solo imagen por imagen |

**Anidado** significa que cada sección se puede plegar, y que el panel de imagen aparece dentro del de slot cuando hay una selección. Los controles siempre están visibles en pantallas táctiles, sin depender de hover.

**Renderizado por tipo:** el módulo tiene un mapa fijo de `TipoCampo` a input (texto → `input`, texto multilínea → `textarea`, selección → `select`, booleano → `checkbox`). Agregar un campo nuevo al contexto no requiere código nuevo en el módulo, solo declararlo en el slot. Agregar un tipo de input nuevo sí requiere código, y se hace una sola vez para todas las pantallas.

---

## 7. Decisiones que requieren al Supervisor

- **D1 — Formatos de origen aceptados.**
  - Propuesta: formatos que el navegador decodifica (JPEG, PNG, WebP, AVIF, GIF estático, BMP) más HEIC/HEIF mediante decodificador bajo demanda (`heic2any` u otro, carga diferida, ~ pesado) o rechazo con mensaje claro.
  - Alternativa: sin HEIC en el navegador; el servidor lo convierte con `sharp` (verificar soporte HEIC de la versión instalada antes de elegir).
  - Mi recomendación: HEIC en el navegador con carga diferida, porque los celulares de Javier y de los clientes lo generan por defecto en iPhone.
- **D2 — Forma persistida de los metadatos.** Propuesta: `[{ url, ...meta }]` en jsonb con lector de compatibilidad para el formato antiguo, sin migración de datos. Requiere checkpoint por cambio de contrato de datos.
- **D3 — RESUELTO (2026-11-27, ajuste del Supervisor).** La metadata la da el contexto. El módulo no define qué campos existen para el negocio.
  - El contexto entrega una lista de **slots** (tipos de imagen). Cada slot tiene `max`, `multiple` y sus `campos`.
  - `alt` y `pie` son atributos base de toda imagen, activos por defecto y desactivables por input (`atributosBase`).
  - Los textos propios de la entidad (descripción del proyecto, definición contable) no son de la imagen. El contexto los renderiza en su formulario.
  - Valores por defecto que asumo (revisables en P3): posición en el array como único "orden de presentación" (sin rol); `pie` con `maxLength` 160; edición de `campos` solo imagen por imagen, sin edición en bloque.
- **D4 — Cola de subida (pendiente de la conversación del 2026-11-26).** Las tres preguntas siguen abiertas: alcance (solo fase 1 o también subida directa a R2 con URLs firmadas, que requiere cambiar CORS del bucket), bloqueo del botón de guardar mientras hay subidas, y recuperación de subidas tras recargar la página. Este plan asume la fase 1 de esa cola dentro del adaptador de almacenamiento de la capa 1.

---

## 8. Implementación por fases

| Fase | Entregable | Depende de | Criterio de salida |
|---|---|---|---|
| **P0** | Línea base: reproducir el solapamiento en 360 px y 1280 px, con y sin hover (DevTools, modo táctil). Captura antes/después guardada en `arnes/planes/evidencia_t-200/` | Aprobación de este plan | Problema reproducido y documentado con capturas |
| **P1** | `lib/imagen/`: tipos, operaciones puras, `normalizar` (sin decodificador HEIC todavía). Tests `*.test.ts` con `node:assert` y `tsx` | D1 (parcial), D2 | Tests verdes; prueba de independencia (cambiar adaptador no toca capas 1–3) |
| **P2** | Capa 1 (cargador) + adaptador R2 + fachada `ImagePicker` con las mismas props | P1, D4 | `tsc`, `eslint`, `next build`; las 20 pantallas siguen funcionando sin cambios de código |
| **P3** | Capa 2 (colección) y capa 3 (panel) detrás de una prop `version="v2"` en la fachada | P2, D3 | P0 repetido: sin solapamientos en 360/768/1280; navegación completa por teclado |
| **P4** | Slots y atributos base: contrato `SlotImagen`, `alt`/`pie` por defecto, lector de compatibilidad, mapa de tipos a inputs. Primer contexto: slots de espacio del cotizador (fachada, interior, detalle) | P3, D2, D3 | Checkpoint de datos aprobado; cotizador con alt y pie persistidos y leídos de vuelta; un campo nuevo declarado en un slot aparece sin tocar `lib/imagen/` ni `components/imagen/` |
| **P5** | Migrar pantallas a `version="v2"` una por una; eliminar `hideGrid` y la versión antigua | P4 | Todas las pantallas en v2; `grep` de `hideGrid` vacío |

**Piloto:** cotizador, `Fotos del espacio` (`app/erp/(modern)/cotizador/[proyectoId]/page.tsx`). Es la pantalla con más imágenes y la que más sufre el problema.

---

## 9. Verificación

- **Mecánica:** `npx tsc --noEmit`, `npx eslint .`, tests de `lib/imagen/` con `npx tsx`, `npx next build`.
- **Reglas de dependencia:** prueba que falla si un archivo de `lib/imagen/` importa `react` o `lib/r2/`.
- **Visual:** capturas antes/después en 360 px, 768 px y 1280 px, con y sin hover. Criterio: ningún control se superpone a otro ni a la imagen.
- **Táctil y teclado:** quitar y mover una imagen sin hover; navegar con Tab, Enter, Supr y Alt+flechas.
- **Datos:** después de P4, guardar, recargar y verificar el pie de foto desde la base de datos real de `dev-local`, nunca de producción.

---

## 10. Riesgos

- **Veinte pantallas con la fachada.** Si la fachada cambia comportamiento sin querer, rompe todo a la vez. Mitigación: P2 no cambia props ni comportamiento, solo estructura interna, y se verifica con pruebas en el piloto.
- **Forma jsonb.** Un lector que no acepte el formato antiguo rompe fotos existentes. Mitigación: lector de compatibilidad probado con datos reales antes de escribir el formato nuevo.
- **`alt`/`pie` por defecto en los 20 inputs.** Cambia la forma guardada de todo el ERP de una vez. Mitigación: el cambio entra en P4, después de que P3 esté verificado en el piloto, y con el lector de compatibilidad ya probado.
- **Sobrediseño por contexto.** Un contexto puede declarar demasiados campos y el panel se vuelve un formulario largo. Mitigación: el axioma 2 (solo lo que el slot declara), y revisión de cada slot en su checkpoint de pantalla.
- **Entidad vs imagen.** Es fácil meter en el slot un texto que pertenece a la entidad (ej. definición contable) y terminar con el mismo dato en dos lugares. Mitigación: la regla de tres niveles de la sección 2.2, revisada en cada contexto nuevo.
- **`key={url}` duplicado.** Hoy la grilla usa la URL como clave, y una URL repetida rompe React. Mitigación: `clienteId` local en `ImagenItem`.
- **HEIC.** Dependencia pesada en el navegador. Mitigación: carga diferida y decisión D1 explícita.
- **Solapamiento de la subida en curso con el panel.** Mitigación: el estado de subida vive en DP9, fuera del valor, y la capa 2 solo lo lee.

---

## 11. Relación con otros trabajos

- Cola de subida en segundo plano: plan de la conversación del 2026-11-26 (decisiones D4). Se integra en la capa 1 como adaptador de almacenamiento.
- Saneamiento de URLs (`arnes/lineas/ola7/tecnico/diagnostico_plan_imagenes_r2.md`, citado en `arnes/estado.md`): la capa 0 aplica la misma regla de whitelist a `url`.
- Pantalla de renders (`/erp/portafolio/renders`): candidata a usar `version="v2"` con metadatos de tipo de render en P4.
