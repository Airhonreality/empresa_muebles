# Auditoría de caída de leads — Veta Carp (Google Ads `9399973984`)

**Periodo auditado:** 22-ago → 25-nov-2026 (fuente: `informe_*_2026-08-22_a_2026-11-25.csv`)
**Cruzado con:** `agosto_2026/DIAGNOSTICO_AGOSTO_2026.md` (27-mar → 21-ago) y `marzo_2026/reporte_final_marzo_2026.md`
**Fecha:** 2026-11-25

---

## 1. Respuesta corta

- **No se apagó la campaña.** Desde el 29-ago la campaña sirve de forma continua (salvo 5 días sin impresiones del 18 al 22 de octubre). El gasto y el volumen de clics se mantienen en niveles similares.
- **Lo que cayó es la calidad del tráfico.** Antes del 21-ago, ~14 de cada 100 clics terminaban en contacto de WhatsApp; ahora son ~6-7. El CPA pasó de **$8.142 a ~$15.700-17.300**.
- **Las búsquedas que hoy entran son otras.** Una parte grande de los contactos son de **mesones / cuarzo / Dekton / Neolith** (búsquedas de cambio de mesón suelto, que para el negocio no tienen valor y no se remiten a otro proveedor), y otra parte son **búsquedas de carpintero como oficio**, **competencia por marca** y **bricolaje**.
- **Causas mecánicas que lo explican** (verificadas en los CSV): palabras clave demasiado amplias en el grupo "Cocinas integrales", un grupo legacy duplicado que compite contra sí mismo, cero negativas para mesones/marmolerías, y un CPA objetivo que Google parece estar usando para frenar la subasta (ver §4 — hay que confirmarlo en la UI).

Las conversiones de Google **no se cayeron a cero**: en los últimos 21 días hubo 7 (≈0,33/día), casi igual que entre el 29-ago y el 15-oct (≈0,35/día). Lo que cambió es **qué tipo de contacto llega**, no la cantidad de clics.

---

## 2. Tres periodos comparados (campaña Búsqueda "Hermanos_garcia_busqueda")

| Periodo | Días con datos | Impr. | Clics | CTR | Gasto COP | Conv. | Conv./clic | CPA COP | CPC COP | Cuota impr.* |
|---|---|---|---|---|---|---|---|---|---|---|
| **Histórico** (27-mar → 21-ago, informe agosto) | 148 | 7.525 | 778 | 10,3% | 871.608 | 107 | **13,8%** | **8.142** | 1.120 | 30,6% |
| **A.** 22-ago → 28-ago (pre-V3) | 2 de 7 | 241 | 26 | 10,8% | 38.059 | 2 | 7,7% | 19.030 | 1.464 | — |
| **B.** 29-ago → 15-oct (relanzamiento V3) | 47 de 48 | 3.936 | 299 | 7,6% | 293.373 | 17 | 5,7% | 17.257 | 981 | ~17% |
| **C.** 16-oct → 04-nov | 15 de 20 | 946 | 56 | 5,9% | 65.463 | 4 | 7,1% | 16.366 | 1.169 | — |
| **D.** 05-nov → 25-nov (últimos 20 días) | 20 de 21 | 1.565 | 102 | 6,5% | 109.591 | 7 | 6,9% | **15.656** | 1.074 | ~22% |

\* Cuota de impresiones: promedio de la columna del export, incluye días con valor de relleno; orientativa.

**Lectura:**
- **Volumen estable:** ~80 impresiones y ~5 clics por día en B y D. No hay caída de tráfico.
- **Conv./día:** 0,35 (B) vs 0,33 (D). No hay caída de conversiones registradas en los últimos 20 días frente a septiembre-octubre.
- **Calidad:** conv./clic cayó de 13,8% (histórico) a 5-7%. Es la causa principal del aumento del CPA.
- **Cuota de impresiones:** de ~31% (histórico) a ~17-22%. Google muestra la campaña en menos subastas que antes.
- **Días sin datos:** 12 días sin fila en el export (22-23 ago, 26-28 ago, 14 sep, 18-22 oct, 25 nov). El bloque del 18 al 22 de octubre es un apagón real de 5 días. Coincide con el periodo C, de conversiones bajas.

---

## 3. ¿Qué entra hoy? (`informe_terminos_busqueda`, 864 términos, 4.166 impresiones, 273 clics, $283.575)

**Conversiones del periodo (12,5 en total) por tipo de búsqueda:**

| Tipo | Conv. | Ejemplos reales (término → conv.) |
|---|---|---|
| **Mesones / piedra (fuera de alcance)** | **6** | `mesones de cocina sencillos` (2), `dekton bogota` (1), `fábrica de mesones para cocina` (1), `mesones en cuarzo para cocina` (1), `mesos de cocina` (1) |
| Cocina / carpintería / muebles (en alcance) | 6,5 | `cocinas integrales` (1), `cocinas bogota` (1), `cocinas integrales bogota` (1), `cocinas integrales en bogotá` (1), `precio cocinas integrales bogota` (0,5), `carpinteria madera bogota` (1), `muebles a medida` (1) |

→ **Casi la mitad de las conversiones de Google son mesones**, y es justo lo que describes (“cotizaciones de mesones”).

**Gasto desperdiciado (clics sin conversión, muestra):**

| Grupo de búsquedas | Ejemplos | Gasto aprox. |
|---|---|---|
| Carpintero como oficio | `carpinteria bogota` ($10.043), `carpintero bogota` ($2.366), `carpinteros` ($3.103), `carpintero de cocinas integrales` ($2.461) | ~$18.000+ |
| Piedra / mármol | `cuarzo para mesones de cocina` ($3.839), `fabricas de marmol en bogota` ($3.622), `mesones para cocina` ($3.832) | ~$11.000+ |
| Bricolaje / cómo hacer | `como construir cocinas integrales`, `diseñar cocina online` | bajo |
| Remodelación pequeña | `cocina 1.5 metros`, `cocinas integrales en l pequeñas`, `remodelacion de cocina` | bajo |
| Competencia / marcas | `madecentro cocinas`, `cjr cocinas`, `bayco cocinas`, `cocinas marco polo`, `neolith bogota` | bajo, pero es pago por marca ajena |
| Amplias sin contexto | `oferta`, `modelos`, `alquiler`, `popayan`, `ibague`, `pequeña` (palabras clave BROAD activas en "Cocinas integrales") | bajo, pero abren la puerta a basura |

Las dos palabras clave más caras del periodo son la búsqueda exacta `cocinas integrales` ($31.997, 33 clics, 1 conv.) y `cocinas integrales bogota` ($13.648, 9 clics, 1 conv.). Son términos genéricos que se disparan contra mesones y muebles en general.

---

## 4. Por qué Google está mandando este tráfico

**a) Palabras clave y grupos (verificado en `informe_palabras_clave` y `informe_anuncios`):**
1. Los anuncios que sí reciben impresiones son solo **2 anuncios de "Cocinas integrales"** y **2 de "Grupo de anuncios 3 (copia legacy de cocinas)"** (216 + 168 impresiones el periodo).
2. **El grupo legacy duplica 10 palabras clave de frase** del grupo principal (`cocinas integrales bogota`, `cocina integral`, `cotizar cocina integral`…). Ambos grupos pujan por las mismas búsquedas y se pisan entre sí.
3. El grupo principal conserva **palabras clave amplias sin control**: `oferta`, `modelos`, `alquiler`, `pequeña`, `popayan`, `ibague`.
4. Hay palabras clave que traen mesones o marcas ajenas: `neolith bogota` (marca de piedra), `madecentro cocinas`, `cjr cocinas`, `bayco cocinas`, `cocinas marco polo` (todas de tipo EXACTO).
5. Hay palabras clave de remodelación (`remodelacion de cocina`, `remodelar mi cocina`) y de bricolaje (`como construir cocinas integrales`, `diseñar cocina online`).
6. Grupos inactivos pero **listos para activarse**: `RE CASA Y APTO` (27 palabras clave amplias: Homecenter, pisos, porcelanato, ferreterías…), `BAÑOS`, `CARPINTERIA`, `Driwall y sistemas de iluminación`, `Grupo de anuncios 1` y `4`. Tienen anuncios con estado DISAPPROVED o APPROVED, pero 0 impresiones. Si uno se aprueba, empieza a pagar por esas búsquedas.

**b) Negativas (verificado en `LISTA_PALABRAS_NEGATIVAS_ROBUSTA_AGOSTO_2026.txt`):**
La lista de 21-ago cubre competencia (Jamar, Sanicoc, Madesa…), bricolaje ("cómo hacer", "tutorial"), precios bajos, ciudades y accesorios. **No cubre mesón, cuarzo, Dekton, Neolith, mármol, marmolería, carpintero, pisos, porcelanato, baños ni remodelación.** Esas son las búsquedas que hoy entran.

**c) Puja (verificación pendiente en la UI):**
- En el export, `campaign_budget.amount_micros` = 11.300 COP/día, pero el gasto real de los últimos 20 días es ~5.500 COP/día. **La campaña no está limitada por presupuesto.**
- El relanzamiento del 29-ago dice que el **CPA objetivo quedó en $7.200**. El CPA real del periodo es ~$15.700-17.300, más del doble. Con una meta tan baja, Smart Bidding recorta la entrega, y es coherente con la cuota de impresiones de 17-22% y con los días sin impresiones.
- **No cuadran los números entre informes:** 21-ago decía presupuesto $15.000 y tCPA $11.719; 29-ago decía presupuesto $1.122 y tCPA $7.200; el export marca $11.300 constantes. Hay que confirmar en la UI cuál es el valor real vigente. No conviene tomar decisiones de puja antes de eso.

**d) Medición:** Google sigue optimizando sobre el **clic en el botón de WhatsApp** (conversión frontend), no sobre contratos. Por eso un contacto de mesón cuenta igual que uno de cocina. El GCLID ya se captura en V3 (`lib/hooks/useGclidCapture.ts`, `app/actions/lead-actions.ts`), pero la subida de conversiones offline no está activa: `lib/data/conversion-offline.ts` solo encola, y la subida depende de t-110 (credenciales `[SOLO_HUMANO]`).

---

## 5. Lo que ya está resuelto o verificado

- **Redirect `/cocinas`:** existe en `next.config.ts` (línea 35) hacia `/espacios/cocinas-integrales-bogota`. El riesgo de 404 que marcó el relanzamiento está cubierto para esa ruta. Quedan por revisar otras URLs de Wix.
- **Campaña Pisos Madera (`9759491517`):** fuera de este análisis, como indica el INDEX.

---

## 6. Plan de acción (orden de prioridad)

### Hoy — en la UI de Google Ads (sin tocar código)
1. **Verificar** presupuesto diario y CPA objetivo vigentes (ver §4c). Anotar el valor real en este informe.
2. **Agregar las negativas** de `LISTA_NEGATIVAS_2026-11-25.txt` (sección "Aplicar ya") a nivel campaña.
3. **Pausar** el grupo `Grupo de anuncios 3 (copia legacy de cocinas)` (duplica palabras clave del grupo principal).
4. **Pausar** las palabras clave BROAD `oferta`, `modelos`, `alquiler`, `pequeña`, `popayan`, `ibague`, y las EXACTAS de marcas ajenas (`madecentro…`, `cjr…`, `bayco…`, `cocinas marco polo`, `neolith bogota`).
5. **Pausar** los grupos inactivos `RE CASA Y APTO`, `BAÑOS`, `CARPINTERIA`, `Driwall y sistemas de iluminación`, `Grupo de anuncios 1` y `Grupo de anuncios 4`, para que no se activen solos.

### Esta semana
6. **Ajustar el CPA objetivo** después de confirmar el valor real (punto 1). Propuesta: subirlo a **~$12.000** (cerca del CPA real menos un margen) y reevaluar en 14 días. No bajarlo más.
7. **Decisión tuya:** si los `carpintero` / `carpinteros` / `carpintería bogotá` se negativizan o no (son búsquedas de oficio, pero también pueden ser clientes; con 0 conversiones en el periodo, lo más sano es negativizar `carpintero` y `carpinteros`).
8. **Revisar en la base de datos (tabla `leads`, desde 05-nov)** cuántos leads reales entraron y de qué tipo (`tipoProyecto`). Ojo: el formulario guarda `tipoProyecto = "Cocina"` cuando el campo viene vacío (`app/actions/lead-actions.ts` línea 86), así que el dato puede estar sesgado.

### Próximas dos semanas (no bloquean la recuperación)
9. Crear el análisis de **búsquedas por fecha** (el export no incluye fecha en `search_term_view`). Con eso se confirma si los mesones son de noviembre o de todo el periodo.
10. Conversiones offline (t-110): es la única forma de que Google deje de pagar por "Hola" de WhatsApp de un mesón.

---

## 7. Qué no pude verificar con estos datos

- Cuál es el CPA objetivo y el presupuesto **reales** (ver §4c).
- Cuántos de los 7 contactos de los últimos 21 días son mesones. El export no tiene término por fecha ni lead por contacto.
- Si los 2 anuncios de Cocinas tienen el Final URL correcto (`/espacios/cocinas-integrales-bogota`). Es un chequeo visual en la UI.
- El número real de leads en la base de datos: **no disponible.** La `DATABASE_URL` de `.env.local` apunta a un branch de Neon (`ep-round-queen-…`) que no tiene las columnas de atribución (`gclid`, `utm_term`, `tipo_proyecto`) y tiene 0 filas. Es un branch desactualizado, no producción. Para ver leads reales hace falta la cadena de producción (la de Vercel), o un export de la tabla `leads` desde el 5-nov.

---

## 7b. Actualización 2026-11-25 (tarde) — correcciones y acciones aplicadas

Tras consultar la cuenta por SDK (solo lectura), varias afirmaciones de este informe cambian:

- **Corrección de la puja:** la campaña usa `MAXIMIZE_CONVERSIONS` **con un tCPA de $14.117 COP**. Lo aplicó Google el 19-nov (21:32 UTC) por una recomendación automática (`GOOGLE_ADS_RECOMMENDATIONS_SUBSCRIPTION`). La cifra de $7.200 del 29-ago no está en la cuenta. Con un tCPA por debajo del CPA real (~$15.700), Google recorta la entrega. Es un candidato fuerte para la sequía reciente.
- **Cronología de cambios** (`change_event`, verificada): 
  - **02-nov 11:05 UTC:** la interfaz cambió estado y nombre del grupo legacy `203012639882` (hoy PAUSED).
  - **19-nov 21:32 UTC:** Google aplicó el tCPA de $14.117 (campaña) y cambió el tCPA del grupo Amoblamiento (pausado).
  - **24-nov 06:37 UTC:** se activó IA Max (`ai_max_setting.enable_ai_max`), desde la interfaz.
  - **Hoy:** IA Max está **desactivado** (`enable_ai_max: false`, verificado). La automatización de textos y expansión de URL está en `OPTED_OUT`, así que no es una causa.
  - **25-nov (aprobado por Javier):** se quitó el tCPA de $14.117. La campaña queda en `MAXIMIZE_CONVERSIONS` sin meta (verificado). **Pendiente (verificado en capturas de la interfaz, 25-nov):** la aplicación automática **sigue activa** en "Expande tu empresa" (5 de 14): Maximizar clics, Maximizar conversiones, Maximizar conversiones con CPA objetivo, **Establece un CPA objetivo** y **Ajusta tus objetivos de CPA**. Estas últimas dos son las que pudieron aplicar el tCPA. En "Mantén tus anuncios" (6 de 7) están activas también "Quite las palabras clave negativas en conflicto" (puede borrar negativas) y "Usar la segmentación optimizada". Hay que desmarcarlas en Recomendaciones → Configuración de aplicación automática.
- **Subir presupuesto no es la solución.** El gasto real no llega al presupuesto (~$5.500/día frente a $11.300), así que el límite no es el presupuesto. Coincide con lo que indicaste.
- **El grupo legacy ya estaba pausado** (`Grupo de anuncios 3 (copia legacy de cocinas)`, estado PAUSED, 0 gasto en los últimos 14 días). Los anuncios figuran como ENABLED en el export, pero el grupo no sirve.
- **Las otras campañas están pausadas** (`Hermanos García 3`, `campaña búsqueda`, `enfoque_llamadas`, `Performance Max-1`) y sin gasto en el periodo. Solo sirve la campaña de búsqueda de cocinas.
- **Las negativas existentes eran casi todas de coincidencia EXACTA** (p. ej. `mesones de cocina sencillos`, `mesones en cuarzo para cocina precios`). Una negativa exacta solo bloquea esa frase literal, por eso siguieron entrando variantes. Las que había de tipo amplio (`meson`, `alquiler`, `popayan`, `ibague`, `diy`) sí aplican.

**Aplicado hoy (2026-11-25) en la campaña activa, como negativas de coincidencia AMPLIA** (14 nuevas, validadas antes con `validate_only`):
`mesón`, `mesones`, `cuarzo`, `dekton`, `neolith`, `granito`, `mármol`, `marmol`, `marmolero`, `encimera`, `bayco`, `marco polo`, `como construir`, `diseñar cocina online`.

Costo conocido de esta decisión: una negativa amplia de `mesón` también bloquea búsquedas de cocina que mencionan mesón como parte del proyecto (p. ej. "cocina integral con mesón de cuarzo"). Se aceptó porque el criterio es no atender mesones; si eso reduce leads de cocina, se revierte quitando la negativa.

**Aplicado después, por instrucción tuya** (negativas amplias, 5 nuevas): `carpintero`, `carpinteros`, `carpintería cerca de mi`, `carpinteria near me`, `carpintería near me`. Se evitó `cerca de mi` sola para no bloquear `cocinas integrales cerca de mi`.

**Pendiente de decisión tuya** (no aplicado): `pequeña(s)`, `modelos`, `oferta`, y pausar las palabras clave ENABLED de marcas y DIY (las negativas ya las bloquean).

---

## 7c. Acciones ejecutadas hoy (2026-11-25), con aprobación de Javier

| # | Acción | Cómo se hizo | Verificación |
|---|---|---|---|
| 1 | 14 negativas amplias de mesón, marcas, DIY (`mesón`, `mesones`, `cuarzo`, `dekton`, `neolith`, `granito`, `mármol`, `marmol`, `marmolero`, `encimera`, `bayco`, `marco polo`, `como construir`, `diseñar cocina online`) | API, validado antes con `validate_only` | 14 resultados de creación |
| 2 | 5 negativas amplias de oficio de carpintero (`carpintero`, `carpinteros`, `carpintería cerca de mi`, `carpinteria near me`, `carpintería near me`) | API, validado antes | 5 resultados |
| 3 | Quitar el tCPA de $14.117 (quedó `MAXIMIZE_CONVERSIONS` sin meta) | API, validado antes | Consulta posterior sin `target_cpa` |
| 4 | Desmarcar en la interfaz la aplicación automática: 5 recomendaciones de puja en "Expande tu empresa" y "Quite las palabras clave negativas en conflicto" y "Usar la segmentación optimizada" en "Mantén tus anuncios" | Interfaz (la API no permite identificar la suscripción) | Capturas de Javier: las 14 de "Expande" desmarcadas; las dos de "Mantén" desmarcadas |

**Estado de IA Max:** desactivado (verificado). **Estado del grupo legacy:** pausado desde el 2-nov (cambio en la interfaz).

---

## 7d. Hallazgos nuevos del análisis profundo (25-nov)

**Riesgos de configuración (revisar con prioridad):**

1. **Ubicaciones.** La API no devolvió ubicaciones positivas, pero sí cinco negativas: Medellín, Villavicencio, Tunja, Soacha y Funza. Eso sugiere que el objetivo positivo es más amplio que Bogotá. Los términos de búsqueda confirman tráfico de Ibagué, Popayán, Valledupar y otras ciudades. **Verificar en la interfaz:** Configuración de la campaña → Ubicaciones debe ser Bogotá y su área de servicio, con "Personas en la ubicación" (presence). No la cambié.

2. **Acciones de conversión primarias.** La campaña no tiene selección propia de conversiones (`selective_optimization` vacía), así que optimiza sobre **todas las acciones primarias cuenta**. Esas incluyen "Local actions - Website visits" (vistas de página), "Other engagements", "Indicaciones de Maps", "Calls from ads" y "Clics de llamada de Maps". Solo "boton contactar (versión desktop)" tuvo conversiones el último mes, pero cualquier acción primaria que se dispare puede atraer tráfico barato. **Propuesta:** dejar como primaria solo el contacto (WhatsApp/botón) y pasar el resto a secundarias. Es un cambio de medición, así que pide tu confirmación.

3. **Seguimiento móvil.** El 80% de los clics son móviles (114 clics de 142 en 30 días), y la mayoría de las conversiones también (8 de 10). La acción de seguimiento que queda tiene nombre "versión desktop", y las acciones "whatsapp" y "click en numero de telefono versión mobile" están **REMOVED**. **Verificar** que el botón de WhatsApp del sitio V3 en móvil dispare esa conversión (`NEXT_PUBLIC_GTAG_SEND_TO`). Si no la dispara, Google no está viendo la mitad de los contactos.

**Calidad de la página de destino:**

4. El Quality Score tiene experiencia de página **por debajo del promedio** en `venta de cocinas integrales`, `cocina integral`, `cotizar cocina integral` y `fabricantes cocinas integrales`. El problema es la página de cocinas del sitio V3, no los anuncios. Los dos anuncios activos tienen fuerza **EXCELLENT**, así que no hay que tocarlos.

**Sin cambios necesarios:**

5. Las recomendaciones activas de Google ya no incluyen ninguna de puja (solo quedó `DISPLAY_EXPANSION_OPT_IN`, descartada).
6. Campañas paralelas (`Hermanos García 3`, `campaña búsqueda`, `enfoque_llamadas`, `Performance Max-1`) están pausadas. No gastan.
7. El presupuesto diario ($11.300) está muy por encima del gasto real (~$5.500). **No conviene subirlo.**

---

### Ejecutado (25-nov, tarde): exclusiones geográficas y declaración UE

- **Declaración UE:** la campaña no contiene publicidad política de la UE (`DOES_NOT_CONTAIN…`), confirmada por Javier.
- **95 ubicaciones negativas aplicadas** (municipios de sabana sur y oriente, departamentos lejanos). **Chía, Cota y Cajicá se dejaron sin excluir** a propósito (clientela de alto nivel). Ninguna excluye la región completa de Cundinamarca (`geoTargetConstants/20202`).
- Municipios no resueltos por la API (Choachí, Pasca, Arbeláez, Sibaté, Granada, Guasca, Une, Cabrera, etc.): se agregan a mano en la interfaz.

### Chequeo final (25-nov, lectura de la cuenta)

| Punto | Estado verificado |
|---|---|
| Puja | `MAXIMIZE_CONVERSIONS`, sin tCPA |
| IA Max | Desactivado |
| Automatización de textos y expansión de URL | `OPTED_OUT` |
| Declaración UE | Hecha |
| Ubicaciones negativas | 100 (5 previas + 95 nuevas). Chía/Cota/Cajicá no excluidas |
| Negativas de palabra clave | 492 (296 amplias). Incluye las 19 nuevas de hoy |
| Presupuesto | $11.300/día (sin cambios) |
| Grupos de anuncios | Cocinas integrales ACTIVO; Amoblamiento y legacy PAUSADOS |
| Aplicación automática de recomendaciones | Desactivada (capturas de Javier) |
| Conversiones primarias a nivel campaña | **Pendiente.** La API no permite seleccionar conversiones en campañas de búsqueda con este tipo de cambio. Hay que hacerlo en la interfaz |

**Conversiones pendientes en la interfaz:** en la campaña, configurar el objetivo de conversión solo con **"boton contactar (versión desktop)"**. Las acciones de Maps y "Local actions" son del sistema y no se pueden desactivar por API; la selección a nivel campaña las deja fuera de la optimización.

## 8. Próximo paso (lo que pediste después, sin hacerlo aún)

Estudio de cotizaciones de mayor valor de las últimas 3 veces para indicarle a Google el valor de conversión, y perfilamiento del cliente de proyectos grandes de carpintería. Para el valor de conversión necesito los montos de contratos firmados de esos tres casos y el `gclid` asociado a cada lead (tabla `leads` y `contratos`).

---
*Generado 2026-11-25 a partir de los CSV de la carpeta. Cifras en COP. Cálculos: `/tmp/analisis_ads/*.py` (fuera del repo).*
