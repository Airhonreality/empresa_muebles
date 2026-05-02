# 📐 SUBSISTEMA: Geometric Engine (Layouts Fluídos)

Este subsistema rige la proyección física de la materia en la pantalla, eliminando la dependencia de librerías externas y unidades de medida absolutas.

## 📏 1. Axioma de las 12 Columnas
El diseño se basa en una rejilla matemática de 12 fragmentos.
*   **Span**: Propiedad en el JSON que dicta cuántas columnas ocupa un bloque.
*   **Cálculo**: `width = (100% / 12) * span`.
*   **Gap Dinámico**: El "aire" se mide en `vw` (viewport width), asegurando que la separación sea proporcional al tamaño de la pantalla.

## 🌊 2. Paradigma "No Pixels"
Está prohibido el uso de la unidad `px` en todo el sistema.
*   **rem**: Para tipografía y jerarquías escalables.
*   **% / vw**: Para anchos y layouts.
*   **vh**: Para alturas y espaciados verticales.

## 📱 3. Mobile First Nativo
Todo bloque nace con un `flex-basis: 100%`. La expansión a columnas solo ocurre en viewports mayores a `48rem` (~768px), garantizando que la app sea perfectamente usable en dispositivos móviles sin código extra.
