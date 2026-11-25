# Diagnóstico: página de cocinas (`/espacios/cocinas-integrales-bogota`)

**Fecha:** 2026-11-25
**URL real (campaña):** `https://www.vetadorada.co/espacios/cocinas-integrales-bogota` (dos anuncios activos y aprobados; el anuncio que llega por `vetadeoro.co/cocinas` está en un grupo pausado)
**Fuentes:** HTML descargado con curl (móvil y escritorio, 25-nov), código en `app/(publico)/espacios/cocinas-integrales-bogota/page.tsx`, `components/veta/espacio-landing.tsx`, `components/veta/asesoria-modal.tsx`, `components/veta/asesoria-boton.tsx`, `lib/contacto.ts`, historial de git y consultas de solo lectura a Google Ads.

---

## 1. Hallazgo crítico (no es de Google, es nuestro)

**El modal de asesoría de la página de cocinas manda los contactos al WhatsApp del experto de pisos (Jair Daza, `3227008706`) desde el 16-nov-2026.**

- Commit `caba017` (16-nov, 17:00): cambió `WHATSAPP_NUMBER` de `573025922101` (canal general, `lib/contacto.ts`) a `573227008706` (Jair Daza). El commit pretendía cambiar solo el flujo de pisos, pero el modal es **compartido** por todas las páginas `/espacios/*` y por el botón flotante de WhatsApp.
- Efecto: un cliente que llena el formulario de cocinas escribe a Jair, no a la empresa de cocinas. El lead se guarda en el ERP, pero el mensaje no llega al número general.
- Google sí cuenta la conversión: el modal dispara `fireAdsConversion('general')` con la etiqueta de "boton contactar". Es decir, Google optimiza por contactos que quizá nadie atendió.
- **Verificar hoy:** pedirle a Jair si recibió mensajes de cocinas desde el 16-nov, y revisar en el ERP los leads de `utm_campaign` de cocinas creados desde esa fecha.

Este hallazgo no explica la caída de octubre, que empezó antes (16-oct a 4-nov), pero sí explica que desde el 16-nov los contactos de cocinas no llegaran al canal general.

---

## 2. Hipótesis previas vs. resultado

| # | Hipótesis | Resultado | Evidencia |
|---|---|---|---|
| H1 | El contenido no coincide con las búsquedas | **Confirmada en parte** | El H1 es genérico: "Tus espacios a medida. Sin intermediarios." No contiene "cocinas integrales". Sí aparecen en el `title` y `meta description`. Google marca **experiencia por debajo del promedio** en `venta de cocinas integrales`, `cocina integral`, `cotizar cocina integral` y `fabricantes cocinas integrales`. |
| H2 | Velocidad o peso | **Parcial** | `dynamic = 'force-dynamic'`: la página se genera en cada visita y hace 3-4 consultas a la base (carrusel, atributos técnicos, precio 3D, galería). Tiempo de respuesta medido: **1,1 a 1,7 s**. Hay 59 scripts y 42 imágenes. No es catastrófico, pero es lento para móvil, que es el 80% de los clics. |
| H3 | Falta transparencia (dirección, datos de contacto) | **Confirmada** | No hay dirección en el HTML. "Somos fabricantes directos" aparece en el hero, pero no hay ubicación del taller ni datos verificables. |
| H4 | El CTA de WhatsApp no es visible | **Confirmada, con matiz** | El CTA principal es "Agenda tu asesoría gratuita", que abre un formulario, no WhatsApp directo. Y ese formulario envía al número equivocado (hallazgo 1). El botón flotante sí existe en móvil. |
| H5 | Falta prueba social | **Parcial** | Aparece "testimonio" una vez en el texto. No pude confirmar en el HTML estático si hay testimonios reales con nombre, foto o cifras. Hay que revisarlo visualmente. |
| H6 | Contenido delgado | **Descartada** | Unas 710 palabras visibles. El contenido es suficiente en volumen, aunque mal enfocado (ver punto 3). |

---

## 3. Problemas de relevancia que sí encontré

- **La sección "Mesones" vende lo que no queremos atraer.** Menciona `Quarztone`, `Granito natural` y `Piedra Sinterizada (Neolith/Dekton)`. Son las mismas marcas que buscaban los clics de mesón que ya bloqueamos. Para el negocio, un cambio de mesón suelto no tiene valor: el cliente que solo busca un mesón se descarta y no se remite a ningún otro proveedor. La página, sin querer, atrae exactamente esa búsqueda.
- **Lenguaje de la página vs. búsquedas que convierten.** Las búsquedas que sí han convertido son `cocinas integrales bogota`, `cocinas integrales en bogotá`, `muebles a medida` y `carpinteria madera bogota`. El H1 y el primer párrafo no usan esas frases.
- **"Asesoría gratuita" y precio 3D.** El CTA dice "gratuita" y justo debajo aparece "Diseño 3D opcional por $130.000 (deducible del contrato)". No es falso, pero la combinación puede generar desconfianza.

---

## 4. Cruce con los datos de conversión

- **Google cuenta ~10 conversiones de la acción "boton contactar" en los últimos 30 días** (8 en móvil, 2 en escritorio). Esa acción la dispara el modal de asesoría, compartido por todas las páginas `/espacios/*` y el botón flotante. No puedo separar desde Ads cuántas vinieron de la página de cocinas y cuántas de otras páginas.
- **Pero el mensaje de la mayoría no llegó al canal general desde el 16-nov.** Si la mayoría de conversiones de las últimas dos semanas cayeron en el WhatsApp de Jair, la cifra de Google es correcta pero el negocio no la vio.
- **Cruce pendiente:** necesito los leads del ERP (tabla `leads`, desde 16-nov) y las cotizaciones reales que tú recibiste. Con eso se confirma cuántos contactos de cocinas llegaron al canal general y cuántos a Jair.

---

## 5. Propuesta de corrección (requiere plan antes de tocar código)

**Prioridad 1 (urgente, hoy):**
1. **APLICADO (commit `f8d9439`, push a `dev` el 25-nov).** El modal de asesoría (`asesoria-modal.tsx`) vuelve a `obtenerCanal('general')` = `302 5922101`. El globo fijo (`whatsapp-float.tsx`) muestra a Jair solo en `/espacios/pisos-de-madera`; en el resto muestra el número general. `AsesoriaModalPisos` no se tocó. Pendiente: verificar en producción tras el deploy.
2. Confirmar con Jair qué mensajes recibió desde el 16-nov.

**Prioridad 2 (esta semana):**
3. Reescribir el H1 y el primer párrafo con las búsquedas que convierten: "Cocinas integrales a medida en Bogotá", con precio de entrada o rango.
4. Bajar el peso de "Mesones" en la página: mencionar mesón solo como parte de una cocina completa, sin marcas de piedra en el titular.
5. Agregar zona de cobertura y, si aplica, dirección o referencia del taller (transparencia para Google y para el cliente).
6. Mostrar WhatsApp como botón visible en la primera pantalla del móvil, además del formulario.

**Prioridad 3 (cuando haya cambios de contenido):**
7. Quitar `force-dynamic` o usar revalidación, para que la página no consulte la base en cada visita. Revisar qué consultas son estáticas.
8. Testimonios reales con nombre y proyecto (la tabla de testimonios del legacy se perdió; ver `estado_demanda.md` H7).

---

## 5b. Correcciones al diagnóstico (revisión posterior)

- **H5 (prueba social):** corregido. Los testimonios **sí existen** en la base (tabla `testimonios`, campo `publicado`) y se muestran en la home y en `/testimonios`. Lo que falta es que la landing de cocinas no los muestra.
- **Transparencia:** en el código no hay dirección real del taller ni zona de cobertura (solo datos de ejemplo en `lib/data/fixtures.ts`). Ese dato lo tiene que aportar el negocio.
- **Botón de WhatsApp:** verificado en producción tras el deploy `f8d9439`: el modal manda al número general.

## 5c. Plan de corrección (propuesta, sin código aún)

### Relevancia
- **R1.** H1 y `subtitulo` con la búsqueda principal: "Cocinas integrales a medida en Bogotá". El eyebrow "Somos fabricantes directos" se conserva. Título y meta ya lo tienen; se alinean.
- **R2.** Subir la respuesta de precio (hoy en FAQ, al final) a una sección visible: qué incluye, rango de inversión, tiempos. **Requiere el rango real aprobado por el negocio; no lo invento.**
- **R3.** Sección "Mesones": pasar de "Quarztone, Granito, Neolith/Dekton" a "Mesón incluido en tu cocina", sin marcas de piedra en el titular, y aclarar que el mesón se cotiza dentro de la cocina, no como servicio aislado (coherente con la lógica de negocio).
- **Medición:** QS de las palabras clave de cocinas a las 2-3 semanas.

### Transparencia
- **T1.** Dirección o referencia del taller y zona de cobertura visibles en el pie y en la landing. **Dato que necesito de ti.** Decisión: ¿Chía, Cota y Cajicá dentro de la cobertura de la página? (coherente con la exclusión que hicimos en Ads).
- **T2.** Testimonios publicados (tabla `testimonios`) en la landing de cocinas, con nombre, proyecto y foto si existe.
- **T3.** Aclarar el CTA: "Asesoría sin costo" y "diseño 3D opcional, $130.000 deducibles del contrato" en vez de "gratuita" con un precio debajo.

### Velocidad
- **V1.** Quitar `force-dynamic` de la landing y usar `revalidate` (p. ej., 1 hora). La galería, los atributos y el precio 3D no son de sesión, así que se pueden cachear. Hoy la página consulta la base en cada visita (tiempo medido 1,1-1,7 s).
- **V2.** Reducir las fuentes de imagen: `IMG_20260418…jpg` pesa 5,2 MB e `instalacion-real.jpg` 4,6 MB. `next/image` las optimiza al servirlas, pero el origen tan pesado retrasa la primera carga y consume recursos del optimizador. Meta: fuentes de 300-400 KB.
- **V3.** Auditar los 59 scripts y cargar diferido los que no son necesarios para ver la página (analítica y chat), en `lazyOnload`.
- **Medición:** PageSpeed móvil antes y después, con el mismo URL.

### CTA
- **C1.** Un solo CTA principal arriba: "Agenda tu asesoría sin costo", con el formulario corto (nombre, teléfono, tipo). El formulario es la captura del lead, la conversión y el dato para el ERP. **Decisión tuya:** ¿agregamos también un botón de WhatsApp directo? Tiene que disparar la misma conversión y guardar el lead, o pierdes el registro.
- **C2.** Barra fija de contacto en móvil, como la de pisos, con el número general.
- **C3.** Quitar del formulario la opción 3D como predeterminada; que la asesoría base sea la opción por defecto.

### Orden y dependencias
1. **Hoy/mañana:** verificación en producción (hecha) y V1 (sin cambios visibles para el usuario, mayor efecto en velocidad).
2. **Esta semana:** R1, R3, T2, C1, C3, V2.
3. **Cuando tengas los datos:** R2, T1, T3 (precio, dirección, cobertura).
4. **Después:** V3, C2, y medir QS y conversiones a 2-3 semanas.

### Decisiones y datos que necesito de ti
1. Dirección o referencia del taller y zona de cobertura (T1).
2. Rango de inversión aprobado para la sección de precio (R2).
3. Testimonios que sí puedes mostrar públicamente (T2).
4. ¿Botón de WhatsApp directo además del formulario? (C1).
5. ¿Chía, Cota y Cajicá dentro de la cobertura de la página? (T1).

## 5d. Recomendación final por punto (revisión 25-nov, tarde)

Punto de precio (R2) **excluido por decisión de Javier**, no se trata en este plan.

**Relevancia**
- **R1 (H1):** "Cocinas integrales a medida en Bogotá" como H1. Subtítulo: "Diseño y fabricación directa: interiores en Madecor RH, herrajes europeos y acabados a tu medida." El título y la meta ya tienen la frase, así que el cambio es en la página.
- **R3 (mesones):** nueva sección "Mesón incluido en tu cocina", sin marcas de piedra en el titular. Política corregida por Javier: los cambios de mesón no se remiten a ningún marmolero ni a otra página. El mesón solo se vende dentro de una cocina integral completa (FAQ "¿Hacen solo el mesón?").

**Transparencia**
- **T1 (dirección y cobertura):** la dirección ya está en el pie (`Cra. 72a #71A 57, Bogotá`) y en los datos estructurados. Solución: mostrar la dirección junto al CTA de la landing y declarar cobertura "Bogotá, Chía, Cota y Cajicá" en el schema (`areaServed`). Chía, Cota y Cajicá quedan dentro, como pediste.
- **T2 (testimonios):** mostrar tres testimonios publicados en la landing, usando la misma consulta de la home. Si no hay tres de cocinas, se completan con los generales.
- **T3 (CTA):** cambiar "asesoría gratuita" por "asesoría sin costo". Quitar el precio 3D de la línea debajo del hero; esa opción ya aparece dentro del modal.

**Velocidad**
- **V1 (caché):** en la landing de cocinas, reemplazar `force-dynamic` por `revalidate = 3600` y envolver las consultas (galería, atributos, precio 3D) con caché de Next. Así la página no consulta la base en cada visita y la galería se actualiza en una hora. Los cambios se ven como máximo una hora después.
- **V2 (imágenes):** exportar las fotos grandes a WebP de máximo 2400 px y 400 KB. Renombrar `IMG_20260418…jpg` a un nombre descriptivo (también ayuda al SEO).
- **V3 (scripts):** cargar en `lazyOnload` la analítica y los scripts de terceros que no afectan la primera vista.

**CTA**
- **C1 (acción principal):** dejar el formulario como acción principal y subirlo por encima del pliegue en móvil. **No agregar WhatsApp directo:** saltaría el registro del lead y la conversión. El modal ya envía a WhatsApp después de capturar los datos.
- **C2 (barra en móvil):** barra fija inferior con "Asesoría sin costo" y el ícono de WhatsApp al número general, igual que la página de pisos.
- **C3:** ya cumplido. La opción por defecto del formulario es "gratis".

**Orden de ejecución:** V1 y R1 (dan más efecto), luego R3, T2, T3, C1 y C2, después V2 y V3, y al final T1 (cobertura en schema).

**Medición:** QS de las palabras clave de cocinas a las 2-3 semanas, y PageSpeed móvil antes y después.

## 6. Qué no puedo confirmar desde aquí

- Si Google tiene en cuenta el contenido de la página para el puntaje o solo la velocidad. Google no publica sus criterios exactos; los datos son el puntaje de la cuenta.
- Cuántos contactos de cocinas llegaron realmente al canal general desde el 16-nov (depende del ERP y de Jair).
- Cómo se ve la página en pantalla (no la abrí en navegador; el análisis es sobre el HTML y el código).
