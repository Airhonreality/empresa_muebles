# Pasada P3 — Flujo de datos transversal (subagente, loop de 3 pasadas)

## Iteración 1 (bruta)

Rastreo de cada dato clave por su ciclo de vida completo sobre el inventario de 47 eventos (`diamante2_discover_eventos.md`), contra `logica_de_negocio.md` (Parte I y Parte II), `inventario_legacy.md` y `auditoria_neon.md`. Todo hallazgo bruto, sin filtrar:

**Dato LEAD / CLIENTE**
- R1. El lead nace en E-01 con "datos de contacto" y el proyecto nace en E-05, pero **ningún evento materializa el registro `clientes`**: el inventario asume que un proyecto referenciará un cliente sin decir de dónde sale. El legacy dice que la conversión lead→proyecto es manual ("se convierte manualmente en proyectos", `leads` sin relación tipada). Riesgo: los datos de contacto del lead se re-crean como cliente (duplicación) sin vínculo.
- R2. `score_conversion` / `gclid` / etapa de lead: **YA cubierto** (I-005, I-012: `score_conversion` tiene propósito documentado; I-011 conversión WhatsApp). No se reporta acá.
- R3. El lead descartado/redirigido (E-04) sigue siendo dato vivo para E-42 (medición de embudo): su "muerte" es un estado, no un borrado. El inventario lo trata bien (E-04 cambia de estado) — no es gap.

**Dato PROYECTO**
- R4. E-17 produce una BOM "más detallada/afinada que la lista de la cotización"; el mapa pregunta si es la misma `items_variante` o un nivel nuevo. El inventario lo anota como "posible gap de schema (granularidad)" pero no declara el **linaje**: de `items_variante` (cotización) → BOM → lista de compras → orden de compra (E-19), cada salto re-crea el ítem sin relación de derivación → divergencia posible.
- R5. E-16 (ajuste de contrato en paralelo) altera el alcance vendido; ese alcance alimenta el cronograma (E-14) y la BOM (E-17). El inventario no declara que un cambio de alcance deba re-derivar BOM y disparar E-33 (cambio de cronograma con causa). Dato "alcance" muta sin cadena de recálculo declarada.
- R6. La propuesta pública (E-09) es un snapshot congelado (`propuestas_publicas.snapshot_json`, legacy) mientras el proyecto sigue editándose en E-10/E-11: **dos versiones del mismo dato** (items_variante vivo vs. snapshot) sin relación declarada.

**Dato DINERO**
- R7. La obligación de cobro (E-28/E-29 la asumen existente: "saldo de obligación", "obligación vencida") **no tiene evento de nacimiento** en el inventario. En el legacy la crea `zap_activar_produccion` (implícito). El mismo dinero del cliente se representa en 4 namespaces: `contratos.hitos_pago` (calendario), `obligaciones_pendientes` (deuda), `abonos_contrato` (abonos parciales, 0 registros en producción), `movimientos_financieros` (movimiento). Dato sin dueño entre Contratos y Finanzas.
- R8. La cuenta de cobro del diseñador **nace dos veces**: E-08 declara "cuenta de cobro del diseñador" como dato que nace ahí, y E-32 la autogenera por registro. Duplicación de nacimiento del mismo documento.
- R9. La nómina del desarrollador/auxiliar es **dato compuesto**: E-31 crea la base por rol y E-35 crea el ajuste por cumplimiento de cronograma (se resta si desfasa). El inventario no declara que el salario final = base + ajuste (dos eventos, dos orígenes, un solo salario).
- R10. E-08↔E-30 (pago diseño → deducción): **YA LOOP 1** (D-4).
- R11. El dinero disponible (E-43, restricción máxima de caja) consume movimientos, pero el legacy almacena `cuentas_financieras.saldo_actual` junto a `movimientos_financieros`: dos fuentes de verdad posibles para el mismo saldo (la conciliación existe precisamente por el riesgo de drift).
- R12. La factura DIAN vive en el software externo "Aliado"; E-08 dice "facturado DIAN" como cambio de estado, pero el sistema no ve ese dato. No se declara la reconciliación con `movimientos_financieros`. (El mapa ya documenta Facturación externa — es límite de contexto, no duplicación.)

**Dato MATERIAL**
- R13. El costo del material se registra en 3 sitios: `productos_catalogo.precio_directo` (referencia), `items_variante.precio_unitario` (comercial), `compras_materiales.costo_real_compra` (real). Cada contexto cree que es suyo el "costo del proyecto". (Se funde con R4.)
- R14. Recepción de material duplicada entre Compras y Producción: **YA LOOP 1** (D-2).

**Dato MEDICIÓN**
- R15. La medición de sitio se captura en E-07 (visita, "info de medidas/contexto") y se **recaptura** en E-15 (retoma post-contrato, "miden de nuevo"). El inventario no declara si E-15 corrige/supera E-07 ni dónde vive el dato (`items_variante` que "se va llenando" vs. `registros_tecnicos` como bitácora). Mismo dato físico capturado dos veces sin relación.

**Dato DOCUMENTO**
- R16. La documentación por etapa (E-41) nace sin consumidor declarado en la cadena de eventos (¿portal del cliente? ¿auditoría? nadie la lee aguas abajo). Fotos/drive = archivo; consumidor humano, no sistema. Débil.
- R17. Acta de entrega (E-26) y firma (E-13): nacen bien, sin duplicación. La holgura de 12 días es regla, no dato duplicado.

**Dato HITO / CRONOGRAMA**
- R18. E-33 (desfase con causa) y E-34 (novedad crítica con SLA) comparten el mismo destino (cronograma) sin relación declarada: ¿una novedad crítica es un subtipo de desfase? ¿genera ambos registros? Solapamiento del dato cronograma.
- R19. Inmutabilidad del cronograma: **YA LOOP 1** (A-7).

**Dato LEAD → GARANTÍA**
- R20. El "problema reportado" de la garantía (E-36) nace sin clasificación, aunque el mapa ya tiene la **taxonomía de fallas** (material defectuoso / error de desarrollo / incidente físico / fallo de información). Dato causa sin estructura, con estructura disponible.

**Dato CLIENTE → TIENDA**
- R21. `pedidos_web.cliente_id/user_id` es texto libre sin relación tipada (legacy): el cliente de la tienda es un segundo registro sin vínculo al ERP. El enganche E-44 (pedido→producción) hereda esta identidad suelta.
- R22. Pedido de tienda = `items_snapshot` congelado del catálogo al momento de compra: duplicación intencional (patrón e-commerce), no se reporta como gap salvo en la identidad del cliente (R21).

**Otros**
- R23. Gates E-18/E-21/E-23/E-33 sin dueño: **YA LOOP 1** (D-3).
- R24. Enlace tienda→producción (E-44), reposición (E-45), no-show (E-46), KPIs (E-47): **YA LOOP 1** (adiciones A-1..A-5).

## Iteración 2 (autocrítica)

**Descartados (y por qué):**
- R2, R10, R14, R19, R23, R24 → `YA LOOP 1` / `YA I-005..I-010` (prohibido repetirlos; además I-012 **reclasifica** `score_conversion` como dato con propósito documentado, así que reportarlo muerto sería un error).
- R3 → no es gap: E-04 conserva el lead como estado, correcto para E-42.
- R16 (documentación sin consumidor) → cae: el consumidor es humano/archivo; E-41 es un evento de frontera de documentación y la nomenclatura ya está en I-004/B-2 (diferido). Sin traza de un consumidor de sistema, es especulación.
- R12 (factura externa) → cae de la tabla: es límite de contexto ya documentado por el mapa (Facturación = Aliado), no un dato duplicado interno; no aporta a la convergencia de eventos.

**Lo que sobrevive con matiz:**
- R1 (lead→cliente): sobrevive como ADICIÓN — falta el evento de materialización del cliente; el mapa no lo inventa, el legacy documenta la conversión manual.
- R7 (obligación de cobro): sobrevive como ADICIÓN — es un registro que nace y el inventario no declara su nacimiento. Evidencia dura: 6/7 contratos de producción no tienen `hitos_pago` (`auditoria_neon.md:44`) → el dato fuente de la obligación es inconsistente.
- R4+R13 (cadena del material + costo): se funden en un solo hallazgo de linaje/costos.
- R8, R9, R18, R20, R21: sobreviven (trazables).
- R6, R11, R15: sobreviven aunque son los más suaves; R15 se mantiene porque la medición es un dato de frontera entre Comercial y Desarrollo (quién la escribe, quién la corrige).

**Qué se me escapó en la pasada 1 (re-trazado a propósito):**
- **R8**: E-08 ya declara "cuenta de cobro del diseñador" en su propio "dato que nace"; casi lo perdí al re-leer solo E-32.
- **R18**: E-33 vs E-34 comparten "cronograma" como dato destino; pasada 1 los veía como eventos distintos sin notar el solapamiento del dato.
- **R21**: la identidad del cliente en `pedidos_web` (texto libre) — la re-traza el dato "cliente" a través de la tienda, no solo del proyecto.
- **R11**: el saldo disponible como dato derivado vs. almacenado — la restricción máxima de caja (invariante del mapa) depende de que el saldo sea una sola verdad.

## Iteración 3 (refinamiento final)

12 hallazgos depurados, todos con traza verificable. Ninguno cambia bounded contexts ni gates existentes (los 4 gates y sus fronteras siguen como los dejó el loop 1); los hallazgos aclaran **dueño y linaje del dato** dentro de los contextos ya declarados. La única decisión de frontera nueva (P3-02, obligación de cobro) es sobre un dato que ya vive en Finanzas — no reabre el esqueleto.

- **P3-01 (ADICIÓN):** falta el evento "lead se materializa como cliente" — hoy conversión manual, datos de contacto duplicados sin vínculo.
- **P3-02 (ADICIÓN):** falta el evento de nacimiento de la obligación de cobro (derivada de `hitos_pago` del contrato); E-28/E-29 la asumen existente; el mismo dinero del cliente vive en 4 namespaces.
- **P3-03 (REFUERZO):** cuenta de cobro del diseñador con doble nacimiento (E-08 y E-32).
- **P3-04 (REFUERZO):** nómina como dato compuesto (E-31 base + E-35 ajuste) sin relación declarada.
- **P3-05 (REFUERZO):** cadena de derivación del material sin linaje (cotización → BOM → lista compras → OC → recepción) y costo con 3 posibles dueños.
- **P3-06 (REFUERZO):** cambio de contrato en paralelo (E-16) altera alcance sin re-derivación declarada de cronograma (E-33) y BOM (E-17).
- **P3-07 (REFUERZO):** propuesta pública = snapshot congelado vs. proyecto vivo editándose (E-09→E-10→E-11), dos versiones sin relación.
- **P3-08 (REFUERZO):** E-33 (desfase con causa) y E-34 (novedad crítica con SLA) comparten el dato cronograma sin relación declarada.
- **P3-09 (REFUERZO):** medición de sitio capturada dos veces (E-07 visita, E-15 retoma) sin relación de superación ni hogar declarado.
- **P3-10 (VACÍO):** el problema reportado en garantía (E-36) no existe como dato clasificado, pese a existir la taxonomía de fallas en el mapa.
- **P3-11 (REFUERZO):** identidad del cliente en la tienda web (`pedidos_web`) sin relación tipada al ERP — cliente duplicado.
- **P3-12 (REFUERZO):** dinero disponible (E-43) como derivado de movimientos vs. `saldo_actual` almacenado — dos verdades posibles para la restricción máxima de caja.

## Hallazgos finales (tabla)

| ID | Tipo | Descripción | Evento(s) afectado(s) | Fuente (archivo:línea) |
|---|---|---|---|---|
| P3-01 | ADICIÓN | Falta el evento "lead → cliente": el proyecto (E-05) asume un `clientes` sin evento de materialización; el legacy convierte manual y deja `leads` sin relación tipada → datos de contacto duplicados entre `leads` y `clientes`, sin dueño declarado | E-01, E-05 | `diamante2_discover_eventos.md:30,34`; `inventario_legacy.md:26-27,52` |
| P3-02 | ADICIÓN | Falta el nacimiento de la obligación de cobro: E-28/E-29 la asumen existente ("saldo de obligación"); el legacy la crea en `zap_activar_produccion` (implícito). El mismo dinero del cliente se representa en 4 namespaces (`hitos_pago`, `obligaciones_pendientes`, `abonos_contrato`, `movimientos_financieros`) — dato sin dueño entre Contratos y Finanzas; 6/7 contratos de producción sin `hitos_pago` | E-12, E-28, E-29, E-30 | `diamante2_discover_eventos.md:47,89-91`; `inventario_legacy.md:33-34,44,67`; `auditoria_neon.md:44` |
| P3-03 | REFUERZO | Cuenta de cobro del diseñador con doble nacimiento: E-08 la declara en su "dato que nace" y E-32 la autogenera por registro transaccional — el mismo documento se crea en dos eventos | E-08, E-32 | `diamante2_discover_eventos.md:38,93` |
| P3-04 | REFUERZO | Nómina como dato compuesto: E-31 (base por rol) + E-35 (ajuste por cumplimiento de cronograma, se resta si desfasa) — el salario final nace de dos eventos sin relación declarada | E-31, E-35 | `diamante2_discover_eventos.md:92,101`; `logica_de_negocio.md:220,253` |
| P3-05 | REFUERZO | Cadena del material sin linaje: `items_variante` (cotización) → BOM detallada (E-17) → lista de compras → orden de compra (E-19) → recepción (E-21); cada salto re-crea el ítem y el costo tiene 3 dueños (`productos_catalogo.precio_directo`, `items_variante.precio_unitario`, `compras_materiales.costo_real_compra`) | E-17, E-19, E-21 | `diamante2_discover_eventos.md:57,64,66`; `logica_de_negocio.md:452,456`; `inventario_legacy.md:29,31,39` |
| P3-06 | REFUERZO | El ajuste de contrato en paralelo (E-16) altera el alcance que alimenta cronograma (E-14) y BOM (E-17); el inventario no declara la re-derivación (cambio de alcance → E-33 con causa → recálculo) | E-16, E-14, E-17, E-33 | `diamante2_discover_eventos.md:49,56,57,99`; `logica_de_negocio.md:530` |
| P3-07 | REFUERZO | Propuesta pública = snapshot congelado (`propuestas_publicas.snapshot_json`) vs. proyecto vivo que sigue editándose en E-10/E-11 — dos versiones del mismo dato sin relación declarada (riesgo de mostrar una propuesta distinta a la cotización final) | E-09, E-10, E-11 | `diamante2_discover_eventos.md:39-41`; `inventario_legacy.md:56` |
| P3-08 | REFUERZO | E-33 (desfase con causa) y E-34 (novedad crítica con SLA) comparten el mismo dato destino (cronograma) sin relación declarada — ¿la novedad crítica es un subtipo de desfase? ¿genera ambos registros? | E-33, E-34 | `diamante2_discover_eventos.md:99-100` |
| P3-09 | REFUERZO | Medición de sitio capturada dos veces: E-07 (visita, "medidas/contexto") y E-15 (retoma post-contrato, "miden de nuevo") sin relación de superación ni hogar declarado (`items_variante` que "se va llenando" vs. `registros_tecnicos`) | E-07, E-15 | `diamante2_discover_eventos.md:36,55`; `logica_de_negocio.md:444,448`; `inventario_legacy.md:49` |
| P3-10 | VACÍO | El "problema reportado" de la garantía (E-36) no existe como dato clasificado: la orden de garantía (E-37) nace sin clasificación contra la taxonomía de fallas del mapa (material/desarrollo/incidente/información), que ya está lista | E-36, E-37 | `diamante2_discover_eventos.md:107-108`; `logica_de_negocio.md:432-438` |
| P3-11 | REFUERZO | Identidad del cliente en la tienda web: `pedidos_web.cliente_id/user_id` es texto libre sin relación tipada — el mismo cliente es dos registros sin vínculo (ERP vs. tienda) al modelar el enganche E-44 | E-44 | `diamante2_discover_eventos.md:131`; `inventario_legacy.md:57` |
| P3-12 | REFUERZO | Dinero disponible (E-43, restricción máxima de caja): el saldo se puede derivar de `movimientos_financieros` pero el legacy almacena `cuentas_financieras.saldo_actual` — dos verdades posibles para el dato que gobierna la política "no acumular deuda" | E-43 | `diamante2_discover_eventos.md:124`; `inventario_legacy.md:41,43` |

## Notas para el Define

- **Dueño canónico del dinero del cliente (P3-02):** el Define debe decidir quién materializa la obligación de cobro desde `hitos_pago` (¿Contratos la deriva? ¿Finanzas la lee del contrato?) y si `hitos_pago` es el dato fuente único frente a `obligaciones_pendientes`/`abonos_contrato`. La evidencia de 6/7 contratos sin hitos (`auditoria_neon.md:44`) hace de esto una decisión de datos, no cosmética. Es la única decisión que roza una frontera (Contratos↔Finanzas); se resuelve como frontera del Define, no reabre el esqueleto.
- **Conversión lead→cliente (P3-01):** declarar el evento evita la conversión manual del legacy y el riesgo de duplicar contacto; conecta con la palanca de demanda (E-42 mide el salto lead→proyecto y hoy el dato no lo permite).
- **Linaje del material (P3-05):** decidir que la BOM y la orden de compra son **derivadas** de `items_variante` (no re-entrada) y que `compras_materiales.costo_real_compra` es el costo real que alimenta utilidad/caja (E-43); `precio_directo` e `items_variante.precio_unitario` quedan como precio de referencia y comercial respectivamente.
- **Recálculo por cambio de alcance (P3-06):** la regla de inmutabilidad del cronograma (A-7) y el flujo de causa estructurada (E-33) deben cubrir también el cambio de contrato en paralelo (E-16), o el cronograma quedará desincronizado del alcance vendido.
- **Snapshots (P3-07, P3-11):** el Define necesita una política de versión para `propuestas_publicas` (¿congelar al publicar E-09 y re-snapshoteer en E-11?) y un vínculo tipado de `pedidos_web` a `clientes` para que E-44 no arrastre una identidad suelta.
- **Composición (P3-03, P3-04):** E-32 debe ser el único nacimiento de la cuenta de cobro (E-08 solo registra el movimiento) y E-35 debe alimentar la liquidación de E-31 (base + ajuste = salario), no coexistir como registros paralelos.
- **Estructuración (P3-08, P3-09, P3-10):** declarar si la novedad crítica es subtipo del desfase; declarar que la retoma (E-15) supera las mediciones de la visita (E-07); y estructurar el problema de garantía con la taxonomía de fallas ya existente (habilitaría el bucle garantía→calidad).
- **Dato derivado vs. estado (P3-12):** el dinero disponible debe ser una proyección de `movimientos_financieros`, no un campo que compita con ellos; la restricción máxima de caja (invariante del mapa) no puede depender de un saldo que pueda derivar.
