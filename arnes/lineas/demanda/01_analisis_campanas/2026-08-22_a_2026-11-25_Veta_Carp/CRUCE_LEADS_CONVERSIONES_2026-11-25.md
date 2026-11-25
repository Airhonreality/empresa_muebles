# Cruce de leads, proyectos y conversiones de Google Ads (2026-11-25)

**Fuente:** base de producción (`DATABASE_URL_V3_PREVIEW`, solo lectura) y Google Ads (solo lectura).
**Privacidad:** este documento no incluye nombres, teléfonos ni correos. Los datos nominales quedan en una carpeta local fuera del repositorio.

---

## 1. Inventario

| Dato | Cantidad |
|---|---|
| Leads (desde 21-ago) | 45 (44 reales; 1 de prueba) |
| Leads con cliente enlazado | **0** |
| Leads con proyecto enlazado | **0** |
| Leads con GCLID (clic de Google) | 30 (27 vinculables al clic; 3 sin clic en el período) |
| Proyectos | 176 (49 creados desde 21-ago) |
| Clientes | 99 |
| Contratos firmados | 62, por **$694.239.220** |
| Contratos en borrador | 7, por $147.305.830 |
| Eventos de conversión offline enviados a Google | **0** |
| Testimonios publicados | 4 |

**Conclusión:** la tabla de leads no está enlazada con clientes ni proyectos. Hoy el seguimiento de cada lead hasta el contrato se hace solo de memoria.

---

## 2. Método de enlace

**Método A — automático por nombre completo (regla estricta).** Enlace solo si coinciden **todas** las palabras del nombre del lead con el nombre del proyecto o del cliente (mínimo dos palabras). Así se evitan coincidencias por nombre de pila ("Jenny Ortega" con "Jenny Reinoso", por ejemplo).

**Método B — por GCLID (más confiable).** Cada lead con GCLID se cruza con el clic de Google Ads del mismo identificador. Da la palabra clave, el grupo de anuncios y la fecha del clic.

---

## 3. Resultados del enlace por nombre (método A)

| Lead (fecha) | Proyecto | Estado del contrato | Valor | Nota |
|---|---|---|---|---|
| 2026-09-08 | COT-2026-09-10-002 (cocina integral, Chía) | **Borrador** | **$73.078.700** | El cliente registrado en el proyecto es otra persona; el nombre del proyecto sí corresponde al lead. **Revisar y corregir el cliente.** |
| 2026-09-29 | COT-2026-09-30-001 | Borrador | $5.306.900 | Coincidencia exacta de nombre. |
| 2026-09-23 | COT-2026-08-15-050 | Sin contrato | — | El cliente coincide; el proyecto se llama "Nuevo Proyecto". |
| 2026-10-16 | COT-2026-10-20-002 | Sin contrato | — | Proyecto "Muebles varios". |

**Pendientes de revisión manual (coincidencia parcial, 20 leads):** por ejemplo, posibles coincidencias por nombre de pila o errores de escritura ("Eymi" / "Eimy"). No se enlazan automáticamente.

---

## 4. Resultados del enlace por GCLID (método B)

**27 de 30 leads con GCLID se vincularon a un clic** (los 3 restantes no aparecen en los clics de los últimos 90 días).

Distribución por palabra clave del clic:

| Palabra clave | Leads | Observación |
|---|---|---|
| fabricantes cocinas integrales | 7 | 2 de ellos desde el grupo legacy (27 y 28-oct), que se pausó el 2-nov |
| cocinas integrales bogota | 4 | |
| diseñador de cocinas integrales | 4 | |
| remodelacion de cocina | 4 | Palabra que hay que revisar: remodelación general sí, cambio de mesón no |
| remodelar mi cocina | 1 | |
| cotizar cocina integral | 2 | |
| cocina integral | 2 | |
| venta de cocinas integrales | 2 | |
| sin palabra clave registrada | 1 | |

**Valor por palabra clave (solo leads con proyecto enlazado):**
- `fabricantes cocinas integrales`: el proyecto de $73 M (borrador) y uno de $5,3 M en `cotizar cocina integral`.
- Muestra muy pequeña (dos proyectos con valor). No es suficiente para decidir la puja todavía.

---

## 5. Cruce con las conversiones de Google Ads

- Google contó **30 conversiones** de la acción "boton contactar" entre el 22-ago y el 25-nov.
- La base registra **44 leads reales** desde el 21-ago, de los cuales **27 vienen de un clic de Google** con GCLID.
- La diferencia (≈17 leads) viene de otros canales (orgánico, Google Business Profile, pisos) y de conversiones que Google no atribuye al clic.

---

## 6. Qué falta para el valor de conversión y la automatización

1. **Enlace por teléfono (llave natural):** el proyecto de Iván Pérez está bien asociado (el contrato figura a nombre de su esposa, no hay error). El teléfono del formulario no está en el cliente ni en la propuesta, y no hay coincidencias: 0 de 45 leads cruzan con un cliente por teléfono. Hace falta que al crear el cliente desde un lead se copie el teléfono del formulario. Es un cambio del ERP, con checkpoint.
2. **Enlace manual:** revisar los 20 casos de coincidencia parcial con Javier.
3. **Valor de conversión (puntaje 0–10):** no es un envío de contratos firmados. Es un valor artificial que se envía a Google en cada conversión: 0 = conversión sin valor (mesón suelto, DIY, empleo, competencia), 10 = proyecto de alto valor como el de Iván. Como el valor se debe enviar en el momento de la conversión (formulario), el puntaje se calcula con datos del formulario (tipo de proyecto, ubicación, medidas) y se calibra con los contratos enlazados por teléfono.

---

## 7. Perfil de clientes de alto valor (idea para después)

Lo que se puede hacer con datos propios y públicos:
- Priorizar leads de zonas de alto valor (Chía, Cota, Cajicá) y de tipos de proyecto grandes (cocina integral más mobiliario).
- Usar señales de compra inmobiliaria de fuentes públicas agregadas (por zona o por proyecto inmobiliario nuevo), **sin datos personales de terceros**.
- Antes de cualquier uso de datos de personas, revisar el tratamiento de datos personales (Ley 1581 de 2012, habeas data) con el Supervisor.
