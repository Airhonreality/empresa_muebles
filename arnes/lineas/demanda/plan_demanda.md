# Plan de demanda — convergencia única

> **Este documento reemplaza a dos.** Sustituye `arnes/lineas/demanda/archivo/marco_estrategia_mercado.md` (las 6 ramas) y absorbe el mapa de 11 fases de `Fase paralela de mercados 1.txt`. Ambos pasan a **registro histórico**: se leen para entender cómo se llegó acá, no para decidir. **Desde ahora la línea de demanda tiene una sola fuente de verdad, y es esta.**

**Objetivo:** más leads cualificados reales → más ventas → el departamento de diseño comercial visitando clientes en forma.

---

## 0. Reglas de operación (las tres que faltaban)

Salen de [`diagnostico_de_proceso.md`](../diagnostico/diagnostico_de_proceso.md). Sin ellas este documento sería el artefacto número trece en estado `Idea`.

1. **WIP = 1.** Se ejecuta **un bloque a la vez**. No se abre el siguiente hasta que el anterior cierre. Nada de avanzar en paralelo "porque no estorba".
2. **"Hecho" es un cambio de estado en el mundo, nunca un documento aprobado.** Cada bloque declara abajo su condición de cierre y es verificable por alguien que no lo ejecutó.
3. **Regla de sucesión.** Cualquier documento nuevo de esta línea declara qué reemplaza. Si no reemplaza nada, justifica por qué existe.

**Si un bloque se cierra y el siguiente no arranca en la sesión siguiente, el problema no es el plan: es que volvimos al patrón.**

---

## 1. Decisiones ya cerradas (no se reabren)

| Decisión | Resuelta |
|---|---|
| **Antigüedad** | *"Tradición familiar desde 1995. Estudio de diseño desde 2014."* En datos estructurados va **2014**; 1995 vive en el relato. |
| **Identidad legal** | Marca comercial arriba, sociedad abajo: *"Veta Dorada es una marca comercial registrada. Facturación, contratos, recaudos y garantías son operados por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9."* |
| **Nombre de marca** | **Veta Dorada.** El renombre del Perfil de Empresa va **aparte y después** del corte, con medición antes/después. |
| **Tema visual** | **Luz & Biofilia** (aprobado, "no reabrir"): luz solar y fotografía natural, **nunca verde literal en los tokens**. Acento dorado intacto. |
| **Arquetipo y tono** | El Creador Experto. Directo, elegante, sin jerga pretenciosa. Anti-posicionamiento: *no* estudio esnob, *no* muebles baratos, *no* CNC industrial masivo → **híbrido artesanal**. |
| **Geografía** | **La decide el portafolio real, no una apuesta a priori.** Nada de páginas locales artificiales: se gana Chicó habiendo hecho una cocina en Chicó. Mientras tanto la pauta cubre lo que el portafolio todavía no. |
| **Medición primero** | Prioridad cero, por convergencia independiente de dos análisis. |
| **Precio del diseño 3D (D3)** | **$130.000 + DIAN por 2 espacios.** Descontable/deducible del anticipo vía sistema (E-30). Decisión 2026-08-08. |
| **Capacidad real (D4)** | **Parámetro operativo en rango 1.25–2.5 proyectos/mes.** No es bloqueante de código ni corrige el mapa (el mapa usa 1.25 por estabilidad del ratio 4:1). Decisión 2026-08-08. |
| **Audiencia (D2)** | **Híbrida — arquetipo "El Creador Experto".** No se elige una audiencia única; las tres escritas (familias / estratos premium norte / arquitectos y diseñadores) se sirven por pieza del embudo con el tono del arquetipo. Decisión 2026-08-08. |
| **Geografía (D5)** | **Bogotá + servicios a municipios de sabana norte (Chía, Cajicá, Cota) con costo de viáticos adicional.** Decisión 2026-08-08. |
| **Escrituras a Google Ads** | Ninguna (pujas, presupuestos, pausar) sin checkpoint explícito. Es plata real. |

## 2. Decisiones abiertas (bloquean solo lo que se indica)

| # | Decisión | Bloquea |
|---|---|---|
| D1 | **Eslogan**: ~~¿"Habita en el bienestar" · "Diseña tu espacio. Habita el bienestar" · "Diseñar con intención. Vivir con diseño."?~~ **RESUELTA 2026-08-09.** "Diseña tu espacio. Habita el bienestar." (versión completa del `Tono de voz de marca.md`). | ~~Bloque C~~ Cerrada |

---

## 3. Los bloques

### 🅰 BLOQUE A — Medición
**Cierra cuando:** *un lead entra con su `gclid` guardado, aparece en el embudo con etapa, y una venta cerrada vuelve a Google Ads como conversión offline.*

| Item | Ref |
|---|---|
| Instalar tag de analítica y eventos (no hay ninguno) | I-006 |
| Devolver `gclid` a `leads` + `utm_*` ya existentes | I-005, I-012 |
| Agregar etapa, fecha de primer contacto y FK a `proyectos` | I-005 |
| Definir el criterio de `score_conversion` (score 1-10 ya diseñado) | I-012 |
| Conectar importación de conversiones offline | I-012, I-048 |
| Portar `useGclidCapture` (hook puro, `sessionStorage`) | I-042 |

**Depende de:** nada. **Bloquea:** todo lo demás. ⚠️ Toca schema → checkpoint propio.

---

### 🅱 BLOQUE B — Lo gratis que ya está pagado
**Cierra cuando:** *la ficha de Google marca perfil completo, el chat de WhatsApp recibe el primer mensaje, y entran las primeras 5 reseñas nuevas.*

| Item | Ref |
|---|---|
| Conectar WhatsApp (`https://wa.me/57…`) | I-024 |
| Llenar áreas de servicio (Bogotá + Chía/Cajicá/Cota con viáticos, D5 resuelta) | I-024 |
| Corregir categoría principal → fabricante, no "diseñador de interiores" | I-025 |
| Reescribir descripción con copy aprobado · `Fecha de apertura` = **2014** | I-019, I-044 |
| Cargar los 7 servicios (incluida restauración de pisos) | I-014 |
| Subir fotos con la convención de nombres de la guía | I-027 |
| Activar solicitud sistemática de reseñas (hoy 8) | I-024 |
| Alinear horario de pauta con horario real (el anuncio muestra `Cerrado`) | I-024 |

**Depende de:** nada. **Corre en paralelo a A por excepción** — cero código, cero riesgo, y es la palanca de mejor relación impacto/costo del plan.

---

### 🅲 BLOQUE C — El corte sin romper la conversión
**Cierra cuando:** *`vetadeoro.co` sirve el sitio nuevo y la conversión de Ads sigue registrando igual o mejor que la semana anterior.*

| Item | Ref |
|---|---|
| 🚨 **WhatsApp en el sitio nuevo antes del merge** — es el evento que entrena la puja | **I-011** |
| Portar el embudo híbrido (modal de 2 pasos + redirección) | I-042 |
| Arreglar las imágenes rotas de las 6 landings (recuperar, no producir) | I-016, I-027 |
| NAP completo en `jsonld.ts` (Cra. 72a #71A 57 · 302 5922101) | I-019 |
| Testimonios: tabla + componente + **Jose Talero** como primer caso | I-008, I-050 |
| Footer con identidad legal y NAP correctos (hoy dice "Medellín") | I-039 |
| Unificar nombre a Veta Dorada en el repo | I-017 |
| Tokens Luz & Biofilia + reglas de UX/responsive | I-037, I-038 |
| Mapa de 301 desde el Wix actual | I-015 |

**Depende de:** A (para verificar que la conversión no se rompió) y D1.
**Después:** esperar **4-8 semanas de métricas estables** antes de mover el dominio. Secuenciar, no combinar.

---

### 🅳 BLOQUE D — Sistema de Proyectos
**Cierra cuando:** *un proyecto real entregado está publicado como página con problema, ubicación, materiales, proceso, fotos, antes/después, testimonio y CTA.*

```
1 PROYECTO REAL → 1 página SEO → 10 fotos → 1 caso de estudio
              → 1 video → 1 reel → 1 Pinterest → 1 post de ficha → 1 contenido informativo
```

Es el motor que resuelve cuatro cosas con un solo esfuerzo: **SEO local real, prueba social, contenido y portafolio.** Y es lo que convierte la geografía en consecuencia en vez de apuesta.

**Depende de:** C. **Regla:** el segundo proyecto no se publica hasta que el primero esté completo.

---

### 🅴 BLOQUE E — Máquina de contenidos
**Cierra cuando:** *3 piezas están publicadas y las 3 tienen su columna `Lección / Resultado` llena con dato real.*

Las 16 piezas de la tabla de Notion ya están mapeadas al embudo (Descubrimiento → Interés → Decisión → Acción). **No se producen sueltas: se derivan del Bloque D.** Y se agrega la regla que a la tabla le falta: **vencimiento de `Idea`** — pasado el plazo se promueve o se mata.

**Depende de:** D (los activos salen de ahí) y A (sin medición, `Lección/Resultado` es indefendible).

---

### 🅵 BLOQUE F — Ad manager agentivo
**Cierra cuando:** *una decisión de puja se toma con datos de venta real, no de formularios.*

Primero solo lectura y análisis. **La pregunta que abre el bloque:** al duplicar el presupuesto, ¿el CPA se mantuvo o subió? Si se mantuvo → volver a duplicar. Si subió → ahí empieza la optimización estructural.

**Depende de:** A, sin excepción. Sin verdad de terreno, un agente optimizando campañas amplifica el error más rápido que un humano.

---

### ⏸ Diferido con condición de reapertura

| Qué | Cuándo vuelve |
|---|---|
| Autoridad, backlinks, prensa | Después de E |
| Segundo dominio | 4-8 semanas de métricas estables tras C |
| Renombre del Perfil de Empresa | Después de C, medido, nunca el día del corte |
| Silo B2B (diseño por m² a arquitectos y constructoras) | Requiere decisión de modelo de negocio; toca Parte I |
| Capa ecológica / biomateriales / "transición solar punk" | **Si y solo si** un atributo material aparece en el lenguaje real del cliente como razón de compra u objeción |

---

## 4. Frontera con el diamante 2 (técnico)

Su Define ya aparcó tres bounded contexts esperando esta línea: **Marketing/Demanda**, **Tienda web**, **Gobierno/Medición**. Este plan los desbloquea.

**La única costura a sincronizar es el schema de `leads`:** su contexto `Comercial/Cotizador` es capa 1 y se diseña ahora, y el Bloque A toca esa misma tabla. **Recomendación: que su loop 2 tome `leads` desde I-005 e I-012**, que ya especifican campos y propósito. El valor concreto del score es dato, no estructura, y no debe bloquear el diseño.

---

## 5. Estado

- **Creado:** 2026-08-03. Convergencia de `marco_estrategia_mercado.md` + `Fase paralela de mercados` + 52 insights del log.
- **Bloque activo:** ninguno todavía — **arranca A (y B en paralelo) cuando el Supervisor apruebe.**
- **Pendiente del Supervisor:** D1 (eslogan, ver t-112), credenciales de solo lectura de Ads/GA4/Search Console (ver instructivo t-110 [SOLO_HUMANO]), informe de sector, y checkpoint del schema para el Bloque A (ver t-111). D2-D5 cerradas 2026-08-08.
- **Registro histórico** (no se decide desde ahí): `marco_estrategia_mercado.md`, `destilacion_docs_veta.md`, `Fase paralela de mercados 1.txt`.
