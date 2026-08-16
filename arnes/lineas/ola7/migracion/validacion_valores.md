# Validación de valores reales contra el schema V3 (Fase 0.5, `t-129`, bloqueo `B-2`)

**Fecha:** 2026-08-14 · **Estado:** ✅ **B-2 RESUELTO** — 5/5 decisiones tomadas por el Supervisor, ver sección de decisiones abajo · **Fuente de datos:** primera pasada contra `agnostic_records` en `dev-local` (copy-on-write de `production`); hallazgo de huérfanos re-verificado contra `production` en vivo (`DATABASE_URL_LEGACY`)

**Cobertura:** a diferencia de lo que pedía `t-129` (muestra de 5-10 registros/namespace), se corrió **exhaustivo sobre el 100% de los registros** de cada namespace core — el dataset es chico (máx. 626 filas) y muestrear habría escondido hallazgos reales (ver nota metodológica al final).

**PII:** ningún valor de `nombre`/`telefono`/`email`/`domicilio` de cliente se imprimió ni se guarda acá — solo conteos de nulos/inválidos, nunca el dato.

---

## Resumen ejecutivo

**`B-2` NO se puede aprobar tal cual.** Hay 6 discrepancias críticas reales, en su mayoría con volumen alto (no casos aislados). Todas requieren una decisión de negocio antes de escribir `scripts/migrate-core.ts` — no son bugs que yo pueda resolver solo, porque implican elegir qué hacer con datos reales de la empresa (completar, excluir, o inventar valores por defecto).

## Hallazgos críticos

| # | Namespace | Hallazgo | Volumen | Por qué bloquea |
|---|---|---|---|---|
| 1 | `productos_catalogo` | Sin `sku` | **219 / 278 (78.8%)** | V3 `productosCatalogo.sku` es `NOT NULL` + `UNIQUE`. La gran mayoría del catálogo no tiene SKU hoy. |
| 2 | `proyectos` | `estado` = `NULL` | **13 / 50 (26%)** | V3 `proyectos.estado` es `NOT NULL` (enum de 19 valores). |
| 3 | `cotizaciones` | `estado` = `NULL` | **13 / 18 (72%)** | Mapean a `proyectos.estado` (`NOT NULL`) según el plan — mismo problema, más agudo. |
| 4 | `proyectos` | `estado` = `'visita_tecnica'` | 1 / 50 | Valor fuera del enum V3 `estado_proyecto` (19 valores) — ni siquiera es un estado del sistema nuevo. |
| 5 | `items_variante` | `variante_id` no existe en `espacio_variantes` | **97 / 626 (15.5%)** | FK rota — son ítems huérfanos en el legacy. |
| 6 | `espacio_variantes` | `proyecto_id` no existe en `proyectos` | 2 / 138 | FK rota, mismo tipo de problema, menor volumen. |
| 7 | `propuestas_publicas` | Mapeo documentado apunta a una tabla muerta | 24 / 24 | Ver detalle abajo — es el hallazgo más importante de los siete, porque no es un dato sucio, es un **error de diseño del mapeo mismo**. |

## Detalle del hallazgo #7 (el más importante)

`mapeo_campos.md` (LIVE PRODUCTION MAPPING, línea 22) dice `propuestas_publicas → portfolioPublico`. Pero `lib/db/schema.ts` marca `portfolioPublico`/`imagenesPortfolio` como **superseditas por ARCH-012** (2026-08-12): *"Estas dos tablas quedan sin uso en el store nuevo — no se leen ni escriben desde `createDrizzleStore()`"*. El store real usa la tabla `portafolio` (con `galeriaPortafolioUrl`), confirmado también en `lib/data/snapshot.ts` (`StoreSnapshot.portafolio`, no existe `portfolioPublico` ahí).

Además, las claves reales de `propuestas_publicas` (`estado`, `proyecto_id`, `public_slug`, `snapshot_json`, `emitida_en`) no tienen forma de portafolio de marketing (no hay `titulo`, `categoria_espacio`, `imagen_portafolio_url`) — tienen forma de **snapshot de propuesta pública (F-08)**, el concepto de "el cliente ve su cotización en un link público", no el de "foto de proyecto terminado en la vitrina".

**Conclusión:** si se ejecuta el clone con el mapeo documentado tal cual, los 24 registros terminan en una tabla que la aplicación nunca lee — la página pública `/portafolio` seguiría vacía después de una migración "exitosa", sin ningún error visible. Hace falta decidir: ¿estos datos van a `portafolio` (con una transformación de campos que hoy no existe), a ningún lado (si F-08 se genera en vivo desde `proyectos`+`contratos` en V3 y no necesita tabla propia), o hace falta crear un tercer destino que hoy no está en el schema?

## Lo que SÍ pasó limpio (sin hallazgos)

- `clientes`: 33/33 con `nombre` presente.
- `contratos`: 7/7 con `codigo_contrato` y `valor_total`, todos los `estado` (`borrador`/`firmado`) dentro del enum.
- `productos_catalogo`: 0 sin `descripcion`, 0 SKUs duplicados entre los que sí tienen valor.
- `espacio_variantes`: 0 sin `nombre_espacio`.

## Nota metodológica — por qué se corrigió el alcance de `t-129`

La primera pasada (muestra de 10 registros/namespace, tal como pedía `t-129`) tenía dos problemas reales, encontrados al repetirla exhaustiva:
1. **Subestimó la severidad**: la muestra de 10 en `productos_catalogo` mostraba 4/10 (40%) sin SKU; el dato real es 219/278 (78.8%) — casi el doble.
2. **Se comió el hallazgo #2/#3 por completo**: el script de muestra tenía un bug — comparaba `estado` contra el enum solo si el valor estaba *presente*, y un `estado` `NULL` se convertía en cadena vacía antes de la comparación, así que nunca entraba a la rama que reporta "fuera de enum". El hallazgo de 13/50 proyectos y 13/18 cotizaciones con `estado NULL` — el más grave de todos por volumen — solo apareció al correr una query de distribución exhaustiva (`GROUP BY estado`) en la segunda pasada.

Ambos problemas son la razón concreta por la que el alcance real terminó siendo full-scan en vez de muestra — para un dataset de este tamaño, muestrear no ahorra nada que valga la pena frente al riesgo de no ver el problema real.

## ✅ B-2 RESUELTO (2026-08-14) — decisiones del Supervisor

1. **SKUs faltantes:** el SKU nunca se usó operativamente (el negocio copia catálogos de proveedores por nombre+precio, no por código). Se **generan automáticamente para los 278 productos** (no solo los 219 que faltaban — se regeneran todos como ID único interno de la empresa), no se completan a mano.
2. **Huérfanos — verificados con detalle, no solo contados:**
   - **2 `espacio_variantes` con `proyecto_id` roto → descartar.** Verificado que el `proyecto_id` referenciado no existe en NINGÚN namespace (uno de los dos ni siquiera es un id real: `%3Aid`, un placeholder de ruta mal grabado). Nombres genéricos ("Nuevo Espacio"/"Nuevo Espacio / Elemento") — registros de prueba nunca asociados a un proyecto real.
   - **97 `items_variante` con `variante_id` roto → descartar.** Re-verificado leyendo producción en vivo (no solo la copia de `dev-local`): el número es idéntico, 97 en ambas fuentes. Vienen de **19 `espacio_variante` "fantasma"** distintos (1 a 10 items c/u) — un espacio completo se borró en el sistema legacy sin arrastrar a sus items (sin `ON CASCADE`). No hay cadena que trepar hasta un proyecto (items→espacio→proyecto, y el espacio ya no existe) — la excepción de "conservar si el proyecto padre existe" no aplica estructuralmente acá.
   - **1 proyecto con `nombre_proyecto` vacío, con 1 `espacio_variante` hijo → CONSERVAR** (tanto el proyecto como el espacio). El proyecto sí existe como fila real — el criterio del Supervisor fue "si tiene proyecto padre (aunque el título esté vacío), se conserva".
3. **`'visita_tecnica'` (1 proyecto):** remapea a `'negociacion'`.
4. **`estado` NULL en proyectos/cotizaciones (13+13):** default a `'borrador'`. El Supervisor los transiciona manualmente a su estado real después de la migración.
5. **`propuestas_publicas` (24-25 registros) y campos de portafolio web público:** **NO se migran** — se regeneran automáticamente en V3 a partir de `proyectos`/`contratos`/`espacios`/`items` (F-08 se genera en vivo, no necesita snapshot guardado). El alcance real del clone de Fase 2 es: **`proyectos` + sub-ítems (`espacio_variantes`, `items_variante`) + `clientes` + `productos_catalogo`**. Nada de propuestas públicas, PDFs, ni campos de portafolio — eso se reconstruye solo.

**Fuente de datos para el clone real (Fase 2):** producción en vivo (`DATABASE_URL_LEGACY`, agregada a `.env.local` 2026-08-14), no la copia congelada de `dev-local` — se confirmó que `dev-local` ya tiene drift real frente a producción (+1 proyecto, +1 espacio, +4 items, +1 propuesta desde que se congeló la rama).

## ⚠️ Hallazgo adicional, encontrado al escribir el script de clone (no estaba en la primera pasada)

**`cotizaciones` NO es un namespace de entidades separadas — es el mismo `id` que 18 de los 51 `proyectos`.** Los 18 registros de `cotizaciones` comparten exactamente el mismo `id` que su proyecto correspondiente (18/18, sin excepción) — es un aspecto/snapshot adicional del mismo registro, no una entidad de negocio distinta. Cuando difieren en `estado` (2 casos: `proyecto.estado='produccion'` vs `cotizacion.estado='en_contrato'`), la cotización parece ser un snapshot histórico congelado al momento del envío, mientras el proyecto tiene el estado vigente.

El mapeo original de `mapeo_campos.md` (`cotizaciones → proyectos`, `estado='enviada'` fijo) habría **duplicado 18 proyectos reales** con un id nuevo y un estado inventado, si se hubiera seguido tal cual. **Decisión aplicada:** `cotizaciones` se ignora por completo como fuente de filas nuevas — solo se migra desde el namespace `proyectos` (51 reales, sin duplicados). Se verificó además que no aporta ningún dato rescatable para los 13 proyectos con `estado` NULL (de esos 13, 12 tienen su cotización espejo, y en los 12 casos la cotización también tiene `estado` NULL).

`mapeo_campos.md` queda con esta entrada desactualizada — pendiente de corregir cuando se retome ese documento.

## ✅ Resultado de la corrida de prueba contra `v3-preview` (2026-08-14)

Ejecutado `scripts/migrate-core.ts` (lee `DATABASE_URL_LEGACY` solo lectura, escribe `DATABASE_URL_V3_PREVIEW`). Idempotente — trunca las 5 tablas destino antes de insertar, se puede re-correr.

| Tabla | Migrados | Descartados | Nota |
|---|---|---|---|
| `clientes` | 33 | 0 | — |
| `productos_catalogo` | 278 | 0 | SKU autogenerado (`AUTO-000001`..`AUTO-000278`) para los 278, no solo los 219 que faltaban |
| `proyectos` | 51 | 0 | Solo desde el namespace `proyectos`; `cotizaciones` no migrada por separado (ver hallazgo arriba); 1 con nombre vacío → `'(sin nombre)'` |
| `espacio_variantes` | 137 | 2 | Los 2 sin proyecto padre resoluble (confirmado: no existen en ningún namespace) |
| `items_variante` | 531 | 99 | Los 97 huérfanos ya conocidos + 2 adicionales que colgaban de los 2 espacios descartados |

**Verificación post-clone:** 0 `items_variante` con FK rota en destino. `contratos`/`hitos_pago`/`propuestas_publicas`/`portafolio` — no migrados, según lo decidido (se regeneran solos).

**Hallazgo a revisar manualmente, no un bug:** 25 de los 51 proyectos (49%) no tienen `cliente_id` — confirmado contra producción que es dato real (`cliente_id` nulo/vacío en el legacy, 0 casos de referencia rota). No se inventó ningún cliente para rellenar esto.

**Cómo revisar:** `npx drizzle-kit studio` (o cualquier cliente Postgres) apuntando a `DATABASE_URL_V3_PREVIEW`, o correr la app local con `DATABASE_URL` temporalmente apuntado a esa rama y `DATA_IMPL=drizzle`. No se desplegó a Vercel Preview todavía (Fase 1 propiamente dicha) — eso es un paso aparte, pendiente de decisión.

## ✅ Corrección post-revisión manual del Supervisor (2026-08-14, misma sesión)

Javier revisó `v3-preview` corriendo la app local y encontró 2 problemas reales, ambos corregidos y re-verificados contra la base:

1. **Bug real (mío, no del dato):** `espacio_variantes.fotosEspacio` nunca se mapeó en la primera corrida — se me olvidó incluirlo en el objeto de inserción pese a tenerlo identificado desde el diseño. Al corregirlo apareció otro hallazgo: el campo legacy `imagenes` **nunca es un array** — es `null` (97 casos) o **un string suelto con una sola URL** (42 casos), nunca una lista. Se corrigió envolviendo el string en un array de 1 elemento. Verificado: 42/137 espacios con foto en destino, coincide exacto con los 42 legacy que tenían imagen.

2. **Namespace no descubierto: `items_obra_civil` (8 registros).** No estaba en `mapeo_campos.md` — ni en el primer dry-run ni en el diseño original del script. Contiene ítems de "materiales" (4), "logística" (2) y **"mano_obra" (2)** por proyecto/espacio, con `catalogo_id` siempre vacío (no referencian un producto real) y una `descripcion_manual` en su lugar. Es exactamente el caso de uso para el que V3 ya tenía `itemsVariante.esReferencial`/`fuenteReferencial`/`grupoReferencial` — se migran ahí: `esReferencial=true`, `fuenteReferencial='obra_civil'`, `grupoReferencial=categoria` (materiales/logistica/mano_obra), `nombrePersonalizado=descripcion_manual`. 8/8 migrados, 0 descartados (FK contra `espacio_variantes` sana en el 100% de los casos).

`mapeo_campos.md` queda con dos huecos confirmados para corregir cuando se retome ese documento: la entrada de `propuestas_publicas` (ya señalada) y la ausencia total de `items_obra_civil` como namespace mapeable.

**Conteos finales tras la corrección:** clientes 33, productos_catalogo 278, proyectos 51, espacio_variantes 137 (42 con foto), items_variante 531 + items_obra_civil 8 = 539 items totales en `itemsVariante`.

## ✅ Segunda ronda de correcciones (2026-08-14, misma sesión, tras revisión visual real)

Javier corrió la app local apuntada a `v3-preview` y reportó: ícono de imagen rota (URL presente pero no carga) + mano de obra "nunca llegó". Investigado ambos antes de tocar nada:

- **Mano de obra: NO era un bug.** De los 8 registros de `items_obra_civil`, 7 (incluidos los 2 de `mano_obra`) pertenecen todos al mismo proyecto real, "Elba Rozo" → espacio "Cocina Integral". El código de `app/erp/cotizador/[proyectoId]/page.tsx` sí maneja correctamente los ítems `esReferencial` (sección "Presupuesto adicional", con fallback a `nombrePersonalizado`) — estaba bien migrado y bien renderizado, Javier no había revisado ese proyecto específico todavía.
- **Imágenes: bug real, corregido.** El campo legacy `imagenes` no es un string con una URL suelta como se asumió en la primera corrección — es un **string que contiene JSON codificado de un array de URLs** (ej. el string literal `["url1.jpg","url2.jpg"]`, doble-encodeado). Envolver el string crudo en un array (primer intento) guardaba el texto JSON como si fuera la URL. Se agregó `parseImagenesLegacy()` en `migrate-core.ts`: si el string empieza con `[`, se parsea como JSON y se usan las URLs reales; si falla el parseo o no tiene esa forma, se trata como URL suelta (fallback). Re-corrido y verificado: las 42 fotos ahora son URLs de Cloudflare R2 limpias y válidas (`https://pub-....r2.dev/...`).

## Referencias

- `arnes/tareas/t-129.json` — ticket de este dry-run.
- `arnes/lineas/ola7/tecnico/plan_f10_migracion.md` §3.1c — criterio de aceptación `CA-8`, bloqueo `B-2`.
- `arnes/lineas/ola7/migracion/mapeo_campos.md` — mapeo de campos vigente (necesita corrección en la sección de `propuestas_publicas`, hallazgo #7).
