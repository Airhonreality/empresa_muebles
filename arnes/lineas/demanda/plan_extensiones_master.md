# Master plan de recursos de anuncio (extensiones) — Línea de Demanda

**Fecha:** 2026-11-27 · **Cuenta:** Veta Carp `939-997-3984` (ID `9399973984`) · **Campaña activa:** `Hermanos_garcia_busqueda_noviembre_2023` (ID `20773460137`, ENABLED)
**Origen:** Misión 5 del Supervisor — "Aprovechar los recursos de anuncio": texto destacado, llamadas y vínculos a sitios adicionales, para ocupar más espacio en la pantalla de búsqueda (CTR y Nivel de Calidad).
**Alcance:** campaña de Búsqueda de cocinas. La cuenta Pisos de Madera (`975-949-1517`) no tiene ningún recurso todavía; queda en la sección 6.

---

## 1. Inventario completo (fuentes oficiales)

### 1.1 Tipos de recurso (`AssetType`, API v26 — 32 valores)

Fuente: [AssetType — Google Ads API v26](https://developers.google.com/google-ads/api/reference/rpc/v26/AssetTypeEnum.AssetType), [Assets overview](https://developers.google.com/google-ads/api/docs/assets/overview).

| Tipo | ¿Sirve en Búsqueda? | Estado en la campaña (2026-11-27) |
|---|---|---|
| `SITELINK` | Sí | ✅ 4 de campaña + 3 de cuenta |
| `CALLOUT` | Sí | ✅ 8 activos (2 nuevos en revisión) |
| `STRUCTURED_SNIPPET` | Sí | ⚠️ 2 activos + 1 nuevo; 1 pausado sin validar |
| `CALL` | Sí | ✅ 1 (`+57 3025922101`), sin horario |
| `BUSINESS_LOGO` (`IMAGE`) | Sí | ✅ 1 activo |
| `BUSINESS_NAME` (`TEXT`) | Sí | ❌ Ninguno activo en la campaña (solo pausado o retirados) |
| `LOCATION` | Sí (requiere Perfil de Empresa vinculado) | ❌ No aparece en la campaña ni a nivel cuenta |
| `PRICE` | Sí | ❌ Ninguno. **Bloqueado** por decisión de precio pendiente |
| `PROMOTION` | Sí | ❌ Ninguno (retirado). Solo con oferta real |
| `LEAD_FORM` | Sí | ❌ Ninguno. Evaluar |
| `BUSINESS_MESSAGE` | Revisar | ⚠️ Activo sin texto visible. Confirmar si sigue vigente en la UI |
| `AD_IMAGE` (`IMAGE`) | Revisar | ✅ 17 activos (imágenes de anuncio). No es el foco de esta misión |
| `CALL_TO_ACTION` | No (PMax/Demand Gen) | N/A |
| `APP_DEEP_LINK`, `MOBILE_APP` | No (no hay app) | N/A |
| `HOTEL_CALLOUT`, `HOTEL_PROPERTY`, `DYNAMIC_*` (Education, Flights, Hotels, Jobs, Local, Real Estate, Travel, Custom), `DEMAND_GEN_CAROUSEL_CARD`, `MEDIA_BUNDLE`, `YOUTUBE_VIDEO`, `YOUTUBE_VIDEO_LIST`, `PAGE_FEED`, `TEXT`, `BOOK_ON_GOOGLE` | No / no aplica | N/A (ver nota sobre `BOOK_ON_GOOGLE` en §4) |
| `UNKNOWN`, `UNSPECIFIED` | — | N/A |

Nota: `DYNAMIC_*` y los vínculos automáticos (sitelinks, callouts y fragmentos dinámicos) se muestran solo si Google los considera elegibles; no se crean a mano.

### 1.2 Encabezados de fragmento estructurado (13 en inglés)

Fuente: [Structured snippet header translations — Google Ads API](https://developers.google.com/google-ads/api/data/structured-snippet-headers).

`Brands`, `Amenities`, `Styles`, `Types`, `Destinations`, `Service catalog`, `Courses`, `Neighborhoods`, `Shows`, `Insurance coverage`, `Degree programs`, `Featured hotels`, `Models`.

- El encabezado **debe salir de esta lista** (se elige, no se escribe libre). La API acepta la versión localizada; el listado en español (≈60 locales) no se revisó: el encabezado "Servicios" ya funcionó en la cuenta, así que se asume que es el localizado de `Service catalog`. **Verificar antes de crear otro encabezado.**
- Para esta campaña se usan: `Types` (Tipos), `Brands` (Marcas), `Service catalog` (Servicios) y `Models` (Modelos).

### 1.3 Límites de caracteres y cantidades (corrección a la premisa)

| Recurso | Límite | Fuente |
|---|---|---|
| Sitelink: `link_text` | 1–25 caracteres | [SitelinkAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/SitelinkAsset) |
| Sitelink: `description1` / `description2` | 1–35 caracteres, deben ir juntas | Ídem |
| Callout: `callout_text` | 1–25 caracteres | [CalloutAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/CalloutAsset) |
| Fragmento estructurado: cada valor | **1–25 caracteres** | [StructuredSnippetAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/StructuredSnippetAsset) |
| Fragmento estructurado: cantidad de valores | **3–10** por fragmento | Ídem |
| Fragmento estructurado: encabezado | Lista predefinida, sin límite de largo | Ídem |
| Precio: cantidad de ofertas | 3–8 | [PriceAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/PriceAsset) |
| Horario de llamada / sitelink / callout | Máximo 6 horarios por día, 42 en total | CallAsset, SitelinkAsset, CalloutAsset v26 |
| Sitelinks | Mínimo 4 activos recomendado; máximo 20 por campaña | [Ayuda Google Ads — Use as many asset types](https://support.google.com/google-ads/answer/12073962?hl=en) |
| Callouts | Mínimo 2; se muestran hasta 4 a la vez | Ídem |

**Corrección:** el límite de **12 caracteres** que aparece en la ayuda de Google Ads es una recomendación antigua para campañas de móvil, no el límite de la API. La regla real para cada valor de fragmento es **1–25 caracteres**. Los dos límites conviven: usar 25 como máximo duro y dejar los valores cortos cuando se pueda.

Los encabezados se muestran de a 2 en escritorio y de a 1 en móvil ([Ayuda — About structured snippet assets](https://support.google.com/google-ads/answer/6280012?hl=en)).

---

## 2. Cruce con lo que hay hoy (campaña `20773460137`)

### 2.1 Lo que está bien
- **Llamada** `+57 3025922101`: coincide con `lib/contacto.ts` (el número real del negocio).
- **Vínculos a sitios**: 4 de campaña + 3 de cuenta, todos aprobados, con descripciones. Destinos reales: `/espacios/cocinas-integrales-bogota`, `/portafolio`, `/` (fábrica).
- **Callouts**: 6 originales aprobados sin errores + 2 corregidos nuevos (en revisión).
- **Logo** activo.

### 2.2 Lo que está mal (corregido hoy o pendiente)
| # | Problema | Estado |
|---|---|---|
| 1 | Callouts "Herajeria de calidad" y "Caldiad y Conofort" (errores de ortografía) | ✅ **Corregido hoy**: desvinculados. Reemplazados por "Herrajería de calidad" y "Calidad y confort" (en revisión) |
| 2 | Fragmento "Servicios" retirado | ✅ **Corregido hoy**: vuelto a vincular con sus 4 valores (`Diseño único`, `Fabricación`, `Instalación`, `Garantía de uso`) — en revisión |
| 3 | Fragmento "Modelos" pausado: `Gama Estandar`, `Confort Plus`, `Tech Luxe` | ⏸ Sin tocar. Nombres no verificados contra el catálogo real. Reactivar solo si Javier confirma que son modelos reales |
| 4 | Descripción 2 del sitelink "Nuestros proyectos" = "espacios" (débil) | Pendiente — ver §3, acción S-2 |
| 5 | Sin recurso `BUSINESS_NAME` activo en la campaña | Pendiente — acción N-1 |
| 6 | Sin `LOCATION` | Pendiente — acción N-2 (requiere la UI de Google Business Profile) |
| 7 | Sin `PRICE` | Bloqueado — ver §4 |
| 8 | Fragmento "Marcas" activo (`Blum`, `Hettich`, `Hafele`, `Samet`) | OK. Verificar que esas marcas se usen de verdad en los proyectos |
| 9 | Sin horario en la llamada | Pendiente — acción C-1 (necesita horario real) |

---

## 3. Plan maestro 0 → 100 (acciones)

Cada acción marca su **estado de checkpoint**. Lo que no tiene "✅ aplicado" sigue requiriendo confirmación de Javier antes de escribir en Google Ads.

### A. Texto destacado (callouts)
| Acción | Detalle | Estado |
|---|---|---|
| A-1 | Desvincular los 2 callouts con errores | ✅ aplicado 2026-11-27 |
| A-2 | Vincular "Herrajería de calidad" y "Calidad y confort" | ✅ aplicado 2026-11-27 (en revisión) |
| A-3 | Mantener 8 callouts activos (límite útil: 4 visibles a la vez) | — |
| A-4 | Revisar "Cocinas de lujo": el posicionamiento del negocio es "muebles a medida". Confirmar con Javier | Pendiente |

Callouts vigentes (8): `Diseño y remodelación`, `Remodelación y amoblado`, `Una experiencia completa`, `Instalaciones y muebles`, `Cocinas de lujo`, `Diseño y fabricación`, `Herrajería de calidad` (nuevo), `Calidad y confort` (nuevo).

### B. Vínculos a sitios (sitelinks)
| Acción | Detalle | Estado |
|---|---|---|
| S-1 | Mantener los 7 actuales (4 de campaña + 3 de cuenta) | ✅ |
| S-2 | Reemplazar la descripción 2 "espacios" de "Nuestros proyectos" por un texto concreto (≤35 caracteres) | Pendiente |
| S-3 | Agregar 1 sitelink nuevo: **"Closets a medida"** → `/espacios/closets-vestidores-bogota`, con 2 descripciones (≤35 caracteres) | Pendiente (checkpoint) |
| S-4 | Evaluar el sitelink de cuenta "Conoce nuestros proyectos" (apunta a `/espacios/cocinas-integrales-bogota`, mismo destino que otros dos): cambiar uno de los tres destinos para repartir tráfico | Pendiente |

Regla para vínculos: cada sitelink debe apuntar a una página real y aprobada del sitio, y el texto no puede prometer nada que la página no muestre.

### C. Llamada (`CALL`)
| Acción | Detalle | Estado |
|---|---|---|
| C-1 | Asignar horario de atención a la llamada (máx. 6 franjas por día). Sin horario, las llamadas nocturnas se pagan sin contestar | **Necesita horario real de Javier** |
| C-2 | Revisar que la llamada esté contada como conversión (reporte de llamadas) | Verificar en UI |

### D. Fragmentos estructurados (`STRUCTURED_SNIPPET`)
Reglas: encabezado de la lista predefinida; 3–10 valores; cada valor ≤25 caracteres.

| Encabezado | Valores propuestos (≤25 car.) | Estado |
|---|---|---|
| **Servicios** (`Service catalog`) | `Diseño único`, `Fabricación`, `Instalación`, `Garantía de uso` | ✅ aplicado 2026-11-27 (en revisión) |
| **Marcas** (`Brands`) | `Blum`, `Hettich`, `Hafele`, `Samet` | ✅ activo (sin cambios) |
| **Tipos** (`Types`) | `Cocinas integrales`, `Closets y vestidores`, `Consolas y recibidores`, `Estudios home office`, `Cavas y bares`, `Centro de entretenimiento` | Pendiente (checkpoint). Requiere que Javier confirme que todos se venden (corresponden a las carpetas de `app/(publico)/espacios/`) |
| **Modelos** (`Models`) | Solo si Javier confirma nombres reales de modelos | ⏸ Pausado. Sin validar |

Política: el encabezado `Models` no admite nombres de fabricante ni años de modelo; `Brands` no admite conteos ni frases promocionales ([Políticas — Structured snippet requirements](https://support.google.com/adspolicy/answer/6283300/structured-snippet-requirements?hl=en-GB)).

### E. Nombre de empresa (`BUSINESS_NAME`)
| Acción | Detalle | Estado |
|---|---|---|
| N-1 | Vincular un recurso de nombre **"Veta Dorada"** (la marca se renombró el 2026-08-19). Hoy solo hay "Veta Dorada - Carpintería" pausado | Pendiente (checkpoint) |

### F. Ubicación (`LOCATION`)
| Acción | Detalle | Estado |
|---|---|---|
| N-2 | Vincular el Perfil de Empresa de Google (Veta Dorada) a la cuenta. No se crea por API; el recurso sale del perfil | **Manual, en la UI de Google Ads / Business Profile (Javier)** |
| N-3 | Revisar reseñas: las calificaciones de vendedor aparecen solo con ≥3,5 estrellas | Verificar |

### G. Precio (`PRICE`) y promoción (`PROMOTION`)
| Acción | Detalle | Estado |
|---|---|---|
| P-1 | Precio: **bloqueado**. La decisión "¿mostrar precio estimado?" está en `archivo/matriz_decision_precio_estimado.md` con estado *propuesta, requiere resolución*. Sin decisión no se crea ningún precio (≥3 ofertas, precios reales). | Bloqueado por el Supervisor |
| P-2 | Promoción: solo si existe una oferta real con fecha y condiciones. Hoy no hay ninguna. No inventar | Sin oferta |

### H. Otros tipos a evaluar (no urgentes)
| Tipo | Comentario | Estado |
|---|---|---|
| `LEAD_FORM` | Formulario nativo de Google. Los contactos hoy llegan por WhatsApp; un formulario crearía leads con datos personales y otro flujo de atención | Evaluar después de la fase A–E |
| `BOOK_ON_GOOGLE` (reservas) | Podría servir para "agendar visita". Está en el enum oficial (v26), pero no se revisó su requisito de elegibilidad; probablemente depende del perfil de reservas en la UI | Evaluar en UI |
| `BUSINESS_MESSAGE` | Está ENABLED sin texto visible. Confirmar si es el chat vigente o un recurso heredado a retirar | Verificar en UI |

---

## 4. Estado final esperado (lo que significa "100")

| Recurso | Hoy (antes de A–E) | Meta |
|---|---|---|
| Sitelinks | 7 | 7 aprobados, 1 nuevo ("Closets a medida"), descripciones útiles |
| Callouts | 8 (2 en revisión) | 8 aprobados, sin errores |
| Fragmentos estructurados | 2 activos + 1 en revisión | 3 activos (Servicios, Marcas, Tipos) |
| Llamada | 1, sin horario | 1, con horario real |
| Logo | 1 | 1 |
| Nombre de empresa | 0 activos | 1 ("Veta Dorada") |
| Ubicación | 0 | 1 (Perfil de Empresa vinculado) |
| Precio | 0 | Solo si hay decisión de negocio |
| Promoción | 0 | Solo si hay oferta real |

La meta **no** es llenar todos los tipos. Es tener los que aplican a Búsqueda, con datos reales y aprobados. Cuando se cumplan A–E y N-2, la campaña tiene todo lo que se puede poner sin inventar información.

---

## 5. Verificación

- Después de cada escritura: consulta GAQL a `campaign_asset` de la campaña `20773460137` (estado de vínculo y `policy_summary.approval_status`).
- Esperar a que los recursos nuevos salgan de `UNSPECIFIED` a `APPROVED` antes de dar el cambio por bueno. Si uno sale `DISAPPROVED`, anotar el tema de política y corregir.
- Medir a 14 días: impresiones del bloque de recursos, CTR y Nivel de Calidad, comparado con la ventana del 05 al 25-nov (CTR 6,5%, CPA $15.656; ver `01_analisis_campanas/2026-08-22_a_2026-11-25_Veta_Carp/AUDITORIA_CAIDA_LEADS_2026-11-25.md`).

**Límite honesto de la medición:** las extensiones mejoran CTR y espacio visual, pero no arreglan la calidad de búsqueda (mesones, carpintero como oficio, marcas ajenas) que diagnostica la auditoría del 25-nov. Ese trabajo va en negativas y palabras clave, en otro bloque del plan.

**Costo:** los clics en vínculos se cobran como clics normales. La afirmación "sin costo extra" no es exacta; el beneficio es más visibilidad y CTR, y se mide.

---

## 6. Cuenta Pisos de Madera (`975-949-1517`)

Hoy tiene **0 recursos de campaña** y 0 de cuenta. La campaña `24429621538` acaba de salir de negativas bloqueantes (2026-11-26) y no tiene métricas todavía. Propuesta: aplicar el mismo esquema (sitelinks, callouts, llamada, fragmentos `Tipos` con los 4 espacios de pisos, nombre de empresa) **cuando haya impresiones**. Checkpoint aparte.

---

## 7. Decisiones pendientes para Javier

1. **Horario** de atención para la llamada (C-1).
2. **Confirmar** los valores de `Tipos` (S: ¿todos se venden?) y el sitelink "Closets a medida" (S-3).
3. **Modelos:** ¿hay nombres reales de modelos para el fragmento, o se queda pausado?
4. **Precio estimado** (P-1): resolver la matriz de decisión.
5. **Cocinas de lujo** (A-4): ¿se queda o se reemplaza?
6. **Perfil de Empresa** (N-2): vincular en la UI.
7. **Pisos de Madera** (§6): cuándo activar el set de recursos.

---

## 8. Registro de cambios

| Fecha | Acción | Resultado |
|---|---|---|
| 2026-11-27 | Desvinculados callouts `Herajeria de calidad` (112530509477) y `Caldiad y Conofort` (112530509480) | `REMOVED` ✅ |
| 2026-11-27 | Creados callouts `Herrajería de calidad` (443530839179) y `Calidad y confort` (443631172561), vinculados a la campaña | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Creado fragmento `Servicios` (443530837691) con 4 valores, vinculado a la campaña | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Llamada reemplazada (443531527523): mismo número y misma acción de conversión (6616992457), horario L–V 08:00–17:00 (sábado y domingo quedan fuera; confirmar). Retirada la llamada anterior (96578764698) | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Sitelink "Nuestros proyectos" reemplazado (443705713101) con descripciones nuevas; retirado el anterior (127867197589). Destino `/portafolio` | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Sitelink nuevo "Closets a medida" (443705710146) → `/espacios/closets-vestidores-bogota` | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Fragmento `Tipos` (443531504408) con 6 valores | `ENABLED`, en revisión ✅ |
| 2026-11-27 | Nombre de empresa `Veta Dorada` (443631846910) | `ENABLED`, en revisión ✅ |

---

## 9. Fuentes

- [AssetType — Google Ads API v26](https://developers.google.com/google-ads/api/reference/rpc/v26/AssetTypeEnum.AssetType)
- [Assets — visión general](https://developers.google.com/google-ads/api/docs/assets/overview)
- [Structured snippet header translations](https://developers.google.com/google-ads/api/data/structured-snippet-headers)
- [SitelinkAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/SitelinkAsset) · [CalloutAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/CalloutAsset) · [StructuredSnippetAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/StructuredSnippetAsset) · [CallAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/CallAsset) · [PromotionAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/PromotionAsset) · [PriceAsset v26](https://developers.google.com/google-ads/api/reference/rpc/v26/PriceAsset)
- [Ayuda — About structured snippet assets](https://support.google.com/google-ads/answer/6280012?hl=en)
- [Ayuda — Use as many asset types as possible](https://support.google.com/google-ads/answer/12073962?hl=en)
- [Políticas — Structured snippet requirements](https://support.google.com/adspolicy/answer/6283300/structured-snippet-requirements?hl=en-GB)
