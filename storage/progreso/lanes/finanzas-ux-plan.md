# Plan de informacion: Finanzas UX

Estado: `plan_borrador`

Alcance de esta fase:
- Solo contrato de informacion.
- No reescribe la UI.
- No toca `FinanzasShell.tsx`.
- No toca zaps, schema ni tokens de marca.

## Inventario del estado actual de las 3 cards superiores

Nota: este bloque describe el diseño vigente para diagnosticar la mezcla entre KPI y detalle. No propone conservarlo.

### 1) Liquidez bancos
- KPI: `amount={totalBancos}` en `src/components/specialized/finanzas/FinanzasShell.tsx:555-560`.
- KPI secundario: `detail={`${cuentas.filter(...).length} cuentas activas`}` en `src/components/specialized/finanzas/FinanzasShell.tsx:558`.
- Detalle: lista de cuentas con saldo en `src/components/specialized/finanzas/FinanzasShell.tsx:564-570`.
- Lectura: hoy mezcla resumen de liquidez con mini-listado operativo de cuentas.

### 2) Por pagar
- KPI: `amount={totalPorPagar}` en `src/components/specialized/finanzas/FinanzasShell.tsx:573-578`.
- KPI secundario: `detail={`${porPagar.length} compromisos abiertos`}` en `src/components/specialized/finanzas/FinanzasShell.tsx:576`.
- Detalle: lista de obligaciones con descripcion, tercero y saldo en `src/components/specialized/finanzas/FinanzasShell.tsx:582-597`.
- Lectura: hoy mezcla saldo agregado con mini-lista de compromisos abiertos.

### 3) Saldos por cobrar
- KPI: `amount={totalSaldosPorCobrar}` en `src/components/specialized/finanzas/FinanzasShell.tsx:599-604`.
- KPI secundario: `detail={`${saldosContrato.length} saldos abiertos`}` en `src/components/specialized/finanzas/FinanzasShell.tsx:602`.
- Detalle: lista de saldos por cobrar con contrato, proyecto y saldo pendiente en `src/components/specialized/finanzas/FinanzasShell.tsx:608-623`.
- Lectura: es la card mas cerca de un panel de detalle, porque ya muestra sublabel y desglose expandible.

## Estructura propuesta

Esta es la única estructura objetivo para la fase 2.

### Jerarquia objetivo
1. Franja KPI arriba.
2. Colecciones de cards abajo.
3. Las secciones operativas actuales quedan despues, sin cambiar logica ni datos.

### Franja KPI arriba
- Solo metricas de sintesis.
- Cada bloque debe responder una sola pregunta: cuanto hay, cuanto falta, cuanto se cobra.
- No debe incluir mini-listas, sublistas ni desgloses expandibles.
- Debe leerse como estado del modulo, no como panel de trabajo.

### Colecciones abajo
- Cada card pasa a ser una coleccion de detalle.
- La prioridad visual es la lista, no el numero principal.
- Cada coleccion conserva sus acciones actuales, pero la accion vive como control de la coleccion, no como parte de la lectura KPI.
- La coleccion debe permitir escaneo por item: nombre, tercero/proyecto, saldo, estado y, cuando exista, desglose.

### Regla de lectura
- Arriba: resumen.
- Abajo: trabajo.
- Si un dato exige recorrer varias filas, pertenece a la coleccion.
- Si un dato responde con un solo numero, pertenece a la franja KPI.

## Literales del `style jsx global` y destino token

Nota: el manual solo abre la familia `--finanzas-shell-*` para esta migracion. Los valores puramente estructurales que no expresan marca quedan locales; los valores de superficie, borde, radio y foco deben migrar a la familia de tokens.

| Linea aproximada | Literal | Destino |
|---|---|---|
| `474-481` | `min-height: 44px` | Local, no marca; mantener como geometria de control.
| `474-481` | `width: 100%` | Local, no marca; mantener como geometria de control.
| `475` | `8px` en `border-radius` | `--finanzas-shell-radius-input`.
| `476` | `1px solid rgb(214 211 209)` | `--finanzas-shell-surface-border`.
| `477` | `white` en `background` | `--finanzas-shell-surface-bg`.
| `478` | `0 12px` en `padding` | Local, no marca; mantener como espaciado de control.
| `479` | `14px` en `font-size` | Local, no marca; mantener como escala tipografica del control.
| `480` | `600` en `font-weight` | Local, no marca; mantener como peso de control.
| `481` | `rgb(28 25 23)` en `color` | `--finanzas-shell-surface-fg`.
| `482` | `rgb(245 158 11)` en `border-color` focus | `--finanzas-shell-surface-accent`.
| `483` | `0 0 0 3px rgb(245 158 11 / 0.16)` | `--finanzas-shell-shadow-focus`.
| `486` | `13px` en `font-size` | Local, no marca; mantener como cuerpo secundario.
| `487` | `rgb(68 64 60)` en `color` | `--finanzas-shell-surface-fg-muted`.
| `488` | `1.6` en `line-height` | Local, no marca; mantener como legibilidad del markdown.
| `491` | `800` en `font-weight` | Local, no marca; mantener como jerarquia tipografica interna.
| `492` | `14px` en `font-size` | Local, no marca; mantener como titulo secundario.
| `493` | `8px` en `margin-bottom` | Local, no marca; mantener como separacion interna.
| `494` | `rgb(28 25 23)` en `color` | `--finanzas-shell-surface-fg`.
| `495` | `1px solid rgb(231 229 228)` | `--finanzas-shell-surface-border-soft`.
| `496` | `4px` en `padding-bottom` | Local, no marca; mantener como separacion interna.
| `499` | `8px` en `margin-bottom` | Local, no marca; mantener como separacion interna.
| `502` | `100%` en `width` de tabla | Local, no marca; mantener como geometria de contenido.
| `503` | `collapse` en `border-collapse` | Local, no marca; comportamiento de tabla.
| `504` | `12px 0` en `margin` | Local, no marca; mantener como separacion interna.
| `505` | `white` en `background` | `--finanzas-shell-surface-bg`.
| `506` | `6px` en `border-radius` | `--finanzas-shell-radius-table`.
| `507` | `hidden` en `overflow` | Local, no marca; comportamiento de recorte.
| `510` | `1px solid rgb(231 229 228)` | `--finanzas-shell-surface-border-soft`.
| `511` | `8px 10px` en `padding` | Local, no marca; mantener como espaciado de tabla.
| `512` | `left` en `text-align` | Local, no marca; alineacion de tabla.
| `515` | `rgb(245 245 244)` en `background-color` | `--finanzas-shell-surface-muted-bg`.
| `516` | `700` en `font-weight` | Local, no marca; mantener como jerarquia de encabezado.
| `517` | `rgb(28 25 23)` en `color` | `--finanzas-shell-surface-fg`.
| `520` | `20px` en `margin-left` | Local, no marca; sangria de lista.
| `521` | `8px` en `margin-bottom` | Local, no marca; separacion de lista.
| `522` | `disc` en `list-style-type` | Local, no marca; estilo de lista.
| `525` | `4px` en `margin-bottom` | Local, no marca; separacion de item.

## Criterio de cierre de Fase 1
- El doc deja claro que la franja KPI solo contiene metricas.
- Las cards inferiores conservan el detalle y el trabajo operativo.
- La lista de literales deja listo el mapa de tokenizacion para la fase 2.
- No se modifica `FinanzasShell.tsx` en esta fase.
