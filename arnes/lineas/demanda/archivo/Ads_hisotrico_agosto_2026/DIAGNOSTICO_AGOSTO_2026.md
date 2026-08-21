# 🔬 Diagnóstico Integral: Campañas Google Ads — Veta de Oro
## Periodo analizado: 27 de Marzo 2026 → 21 de Agosto 2026 (148 días)

**Fecha del diagnóstico:** 21 de Agosto 2026  
**Benchmark anterior:** 26 de Marzo 2026 (reporte_final_marzo_2026.md)  
**Fuentes:** 5 CSV descargados de Google Ads + serie temporal diaria de la campaña de Búsqueda  

---

## 📊 RESUMEN EJECUTIVO

| Indicador | Benchmark Marzo (histórico acumulado) | Periodo Actual (27 Mar – 21 Ago) | Variación |
|---|---|---|---|
| Inversión total (Búsqueda) | $6.095.749 COP (acumulado desde siempre) | **$871.608 COP** (148 días) | Presupuesto bajó de $4.500 a $8.500/día pero el gasto real diario es ~$5.889 |
| CPA (Coste/conv.) Búsqueda | **$14.428 COP** | **$8.142 COP** | ✅ **-43.6%** — Mejora fuerte vs el histórico |
| Tasa de conversión Búsqueda | 5,70% | **13,76%** | ✅ **+141%** — Se duplicó con creces |
| CPC medio Búsqueda | $822 COP | **$1.120 COP** | ⚠️ +36% — Pagas más por clic |
| CTR Búsqueda | 12,95% | **10,34%** | ⚠️ -20% — Menos atractivo el anuncio o más impresiones irrelevantes |
| Conversiones totales (Búsqueda) | 422,5 (acumulado histórico) | **107 conversiones** (148 días) | ~0.72 conv/día |
| Cuota de impresiones Búsqueda | No medido | **30,64%** | 🔴 Pierdes el **69%** de las subastas |
| Presupuesto diario configurado | $4.500 COP → subido a $8.500 | **$8.500 COP** | Limitado por presupuesto (Google lo confirma) |

### Veredicto en una línea:
> **El CPA mejoró dramáticamente (-43%) y la tasa de conversión se duplicó, PERO Google solo te muestra en el 30% de las búsquedas relevantes (perdiendo el 70% del mercado) y las "conversiones" que reporta son clics en botón de WhatsApp — no ventas cerradas.** Estás pagando menos por leads más baratos, pero esos leads no cierran cocinas.

---

## 1. 🚨 ANÁLISIS DE RUPTURA ALGORÍTMICA — EL "APAGÓN" DE AGOSTO

### Hallazgo: NO hay un apagón total, pero sí hay un patrón de días muertos cíclicos

Analizando la serie temporal diaria de la campaña de Búsqueda (148 días), encontré este patrón:

| Periodo | Días con $0 de gasto | Días activos | Gasto promedio en días activos |
|---|---|---|---|
| **Mar 27 – Abr 16** (21 días) | 8 días (38%) | 13 días | ~$7.402 COP/día |
| **Abr 17 – May 1** (15 días) | **15 días (100%)** | 0 días | 🔴 **APAGÓN TOTAL** |
| **May 2 – May 18** (17 días) | 8 días (47%) | 9 días | ~$4.413 COP/día |
| **May 19 – Jun 30** (43 días) | 7 días (16%) | 36 días | ~$8.432 COP/día |
| **Jul 1 – Jul 31** (31 días) | 4 días (13%) | 27 días | ~$8.893 COP/día |
| **Ago 1 – Ago 21** (21 días) | 5 días (24%) | 16 días | ~$7.634 COP/día |
| **Ago 15 – Ago 21** (última semana) | 3 de 7 días (43%) | 4 días | ~$8.653 COP/día |

### Hallazgos críticos:

1. **Hubo un APAGÓN REAL de 15 días entre el 17 de abril y el 1 de mayo.** La campaña dejó de gastar completamente durante 2 semanas enteras. Esto coincide con el período posterior a los ajustes de marzo (cambio de concordancia, lista de negativas). Es probable que Google "desaprendiera" el modelo tras los cambios agresivos y necesitara un período de recalibración.

2. **La última semana de agosto (15-21) NO está completamente muerta**, pero tiene un patrón errático: 3 días a $0 (15, 16, 17 ago) seguidos de 3 días activos (18, 19, 20 ago con $14.193, $14.656, $5.764). El día 21 (hoy) está a $0 pero puede ser que aún no se haya computado.

3. **El aviso de Google del 17 de agosto** ("los objetivos no se actualizarán automáticamente") coincide exactamente con los 3 días muertos (15-17 ago). **Esto confirma nuestra hipótesis**: el cambio algorítmico del 17 de agosto perturbó la entrega, pero la campaña se recuperó parcialmente los días 18-20.

4. **El patrón de "días cero" es endémico, no nuevo.** Desde marzo la campaña tiene días que simplemente no gasta. Esto es característico de campañas con CPA objetivo bajo + presupuesto limitado: Google "ahorra" los días que no puede garantizar el CPA y concentra el gasto en los días donde encuentra clics baratos.

---

## 2. 💰 AUDITORÍA DE DISTRIBUCIÓN DE INVERSIÓN — CANIBALIZACIÓN DE TICKETS

### Campaña de Búsqueda: 2 Grupos de Anuncios

| Grupo de Anuncios | Impr. | Clics | CTR | Inversión | % del Gasto | Conv. | CPA | Cuota Impr. |
|---|---|---|---|---|---|---|---|---|
| **Cocinas integrales** (2 anuncios activos + 1 solo llamada) | 5.118 | 459 | ~9% | **$455.569 COP** | **52.3%** | 57 conv | $7.993 | ~25% |
| **Amoblamiento Integral** (1 anuncio activo) | 2.407 | 319 | 13.25% | **$416.039 COP** | **47.7%** | 50 conv | $8.321 | ~54% |

### Hallazgo: NO hay canibalización extrema — el problema es otro

Contrario a nuestra hipótesis inicial, **los closets/amoblamiento NO están devorando el presupuesto de cocinas**. La distribución es casi 50/50 en gasto. De hecho, el grupo de "Amoblamiento Integral" tiene:
- **Mejor CTR** (13.25% vs ~9%) → Los anuncios de muebles atraen más clics
- **Mejor Cuota de Impresiones** (~54% vs ~25%) → Google muestra más los anuncios de muebles
- **CPA similar** ($8.321 vs $7.993) → Cuestan lo mismo por "conversión"

**⚠️ El verdadero problema**: El grupo de Cocinas solo aparece en el **25% de las búsquedas relevantes**. Esto significa que de cada 4 personas que buscan "cocinas integrales bogota" en Google, **solo 1 ve tu anuncio**. Las otras 3 ven a tu competencia. Y con un presupuesto diario de $8.500 dividido entre dos grupos, cada uno dispone de apenas ~$4.250/día para competir.

### Top 5 palabras clave por inversión (Búsqueda):

| Palabra clave | Tipo | Inversión | Clics | Conv. | CPA | Cuota Impr. |
|---|---|---|---|---|---|---|
| `"diseño de muebles a medida"` | Frase | **$261.797** (30%) | 200 | 30.5 | $8.583 | 54.37% |
| `"cocina integral"` | Frase | **$224.341** (25.7%) | 244 | 30 | $7.478 | 21.39% |
| `"carpintería a medida bogotá"` | Frase | **$152.507** (17.5%) | 117 | 19.5 | $7.821 | 53.63% |
| `"venta de cocinas integrales"` | Frase | **$60.105** (6.9%) | 63 | 9 | $6.678 | 28.03% |
| `"cotizar cocina integral"` | Frase | **$61.141** (7%) | 47 | 6 | $10.190 | 34.03% |

**Análisis:**
- `"cocina integral"` se lleva el 25.7% del gasto total pero solo tiene **21.39% de cuota de impresiones** — en 4 de cada 5 búsquedas, tu competencia te gana.
- `"diseño de muebles a medida"` es la estrella absoluta: 30% del gasto, 54% de cuota, 30.5 conversiones. **Este es el grupo que cerró los closets y muebles pequeños que mencionas.**
- `"cotizar cocina integral"` tiene el **CPA más caro** ($10.190) — la gente que busca cotizar es la más cara de atraer, pero paradójicamente es la más cercana a comprar.

---

## 3. 🗑️ ÍNDICE DE "GASOLINA SUCIA" — TÉRMINOS DE BÚSQUEDA

Revisé los 670 términos de búsqueda del periodo. Aquí está el diagnóstico:

### ✅ Lo que funciona (Gasolina limpia):
Los términos con conversiones reales son coherentes con el negocio:
| Término | Clics | Conv. | CPA |
|---|---|---|---|
| `cocinas integrales` (genérico) | 85 | 16 | $5.413 |
| `muebles a medida bogota` | 13 | 3 | $5.995 |
| `muebles a la medida` | 10 | 2 | $7.951 |
| `cocinas integrales cerca de mi` | 10 | 2 | $1.430 |
| `closet a la medida` | 8 | 1 | $11.077 |
| `cocinas en poliuretano precio` | 3 | 2 | $707 |
| `muebles a medida` | 6 | 3 | $3.798 |
| `remodelacion cocina` | 1 | 1 | $2.413 |

### 🔴 Gasolina sucia detectada (Términos que NO deberían activar tus anuncios):

**Categoría 1: Búsquedas de COMPETENCIA (estás pagando para que vean a otros)**
| Término | Clics | Gasto |
|---|---|---|
| `jamar cocinas integrales` | 0 | $0 (pero genera impresiones inútiles) |
| `sanicoc cocinas integrales` / `sanicoc mosquera` | 0 | $0 |
| `cociarte bogota` / `cociarte cocinas` | 0 | $0 |
| `amaderarte bogotá` / `amaderarte precios` / `amaderarte co fotos` | 1 | $333 |
| `maderarte bogota` | 1 | $693 |
| `cocinas madesa opiniones` | 0 | $0 |
| `modugal cocinas` / `cocinas modugal` | 0 | $0 |
| `pekos cocinas integrales` | 0 | $0 |
| `cocinas nicol bogota` | 0 | $0 |
| `matma mobiliario` | 0 | $0 |
| `cocinas valcucine` | 0 | $0 |
| `stosa colombia` | 0 | $0 |
| `alfa cocinas integrales` | 0 | $0 |
| `tecnicocinas fábrica...` | 1 | $1.295 |
| `incormaderas fábrica...` | 0 | $0 |
| `spacios integrales venta...chapinero` | 0 | $0 |
| `oriol fábrica de muebles...colina campestre` | 0 | $0 |
| `la petite cocinas bogota` | 0 | $0 |
| `berma cocinas` | 0 | $0 |
| `cocinas ardila bogota` | 0 | $0 |
> **Acción:** Añadir todos estos nombres de competencia a la lista de negativas.

**Categoría 2: Búsquedas DIY / "Cómo hacer" (curiosos, no compradores)**
| Término | Clics | Gasto |
|---|---|---|
| `cómo hacer cocina integral` | 0 | $0 |
| `como fabricar una cocina integral` | 0 | $0 |
| `hacer cocina integral` | 0 | $0 |
| `como remodelar una cocina integral` | 0 | $0 |
| `como modernizar una cocina vieja` | 0 | $0 |
| `como renovar cocina con poco dinero` | 0 | $0 |
| `hacer sofa a medida` | 0 | $0 |
| `diseñar escritorio` | 0 | $0 |
| `fabricar cocina integral madera` | 0 | $0 |
> **Acción:** Negativizar "como hacer", "como fabricar", "tutorial", "DIY".

**Categoría 3: Fuera de cobertura geográfica (estás pagando por gente en otras ciudades)**
| Término | Clics | Gasto |
|---|---|---|
| `cocinas integrales ibagué fabrica` | 0 | $0 |
| `cocinas integrales en valledupar` | 0 | $0 |
| `cocinas integrales jamundi` | 0 | $0 |
| `cocinas integrales monteria` | 0 | $0 |
| `cocinas integrales en pitalito` | 0 | $0 |
| `cocinas integrales duitama` | 0 | $0 |
| `cocinas integrales en rionegro antioquia` | 1 | $553 ← **pagaste clic** |
> **Acción:** Verificar la segmentación geográfica. Si ya está en radios de Bogotá, Google igual muestra por "interés" en otras ciudades. Negativizar nombres de ciudades fuera de cobertura.

**Categoría 4: Búsquedas de producto barato / genérico (no tu cliente)**
| Término | Clics | Gasto |
|---|---|---|
| `cocinas integrales de segunda` | 0 | $0 |
| `cocinas integrales económicas` | 1 | $394 |
| `fabrica de cocinas integrales económicas` | 1 | $472 |
| `cocinas integrales financiadas con gas natural` | 0 | $0 |
| `cocinas integrales a crédito` | 0 | $0 |
| `muebles a medida economicos` | 0 | $0 |
| `cocina imperio muebles dico` | 0 | $0 |
> **Acción:** Negativizar "segunda", "económicas", "baratas", "crédito", "financiadas", "dico".

**Categoría 5: Búsquedas informacionales (no intención de compra)**
| Término | Clics | Gasto |
|---|---|---|
| `materiales para hacer cocinas integrales` | 0 | $0 |
| `materiales para cocina integral` | 0 | $0 |
| `medidas cocinas integrales` | 0 | $0 |
| `altura de cocinas integrales` | 0 | $0 |
| `estilos de cocinas integrales` | 0 | $0 |
| `catalogo de cocinas integrales de madera` | 0 | $0 |
| `cocina integral 120` / `150` / `180` / `2.10` (medidas) | 2 | $1.808 |
> **Acción:** Negativizar "materiales para", "medidas de", "altura de", "estilos de", "catálogo".

### Resumen de gasolina sucia:
La mayoría de los términos sucios generaron impresiones pero **pocos clics** (gracias a que los textos de anuncio filtran parcialmente). Sin embargo, cada impresión irrelevante **degrada el Quality Score** y encarece los clics buenos. Estimación conservadora de gasto desperdiciado directo: **~$5.000-$8.000 COP** en clics de competencia y fuera de zona. El daño indirecto (Quality Score degradado, subasta perdida) es mayor.

---

## 4. 📉 REVISIÓN DE OBJETIVOS DE ADQUISICIÓN — BENCHMARK CPA

### Resultado vs. Meta:
| Métrica | Meta de Marzo | Resultado Real |
|---|---|---|
| CPA Objetivo (tCPA) | $6.500 COP | Configurado a CPA objetivo |
| CPA Real (Búsqueda) | — | **$8.142 COP** |
| CPA Real (Performance Max) | — | **$4.106 COP** |
| CPA Real (Cuenta total) | — | **$7.086 COP** |

**Hallazgo:** El CPA real de Búsqueda ($8.142) **nunca alcanzó** la meta agresiva de $6.500. Está un 25% por encima del objetivo. Esto causa que Google constantemente restrinja la entrega (los "días $0") para intentar cumplir, **sacrificando volumen por precio**. Es como pedirle a un taxi que te lleve del norte al sur por $5.000: puede que eventualmente uno acepte, pero la mayoría pasará de largo.

**Recomendación:** Subir el tCPA a **$10.000-$12.000 COP** liberaría al algoritmo para competir en más subastas, especialmente las de cocinas (que son más caras por ser ticket alto). Paradójicamente, **gastar un poco más por lead** te daría acceso al 70% del mercado que actualmente pierdes.

---

## 5. 🔌 INTEGRIDAD DEL SISTEMA DE SEGUIMIENTO (TRACKING)

### Hallazgo Crítico: Las "107 conversiones" de Google Ads NO son 107 ventas

Confirmado con el arnés (`estado_demanda.md` H2, `plan_demanda.md` Bloque A):

- **Lo que Google cuenta como "conversión":** Un clic en el botón de WhatsApp o en el enlace de llamada en la web legacy `vetadeoro.co`. Es un evento de frontend puro.
- **Lo que NO mide:** Si esa persona realmente habló contigo, si tenía intención real, si cotizó, si cerró.
- **Consecuencia directa:** Google Ads está optimizando sus pujas para maximizar **clics en botones** ($8.142/clic-en-botón), no para maximizar **ventas cerradas** ($X millones/cocina). El algoritmo no sabe que un "Hola" de WhatsApp de alguien buscando "cocinas integrales económicas" vale $0, mientras que uno de alguien buscando "fábrica de cocinas integrales en bogotá" puede valer $15 millones.

### El GCLID perdido (H2 del arnés):
- El hook `useGclidCapture` estaba diseñado y documentado en el legacy.
- Capturaba el `gclid` en `sessionStorage` al llegar el visitante.
- Al enviar el formulario, persistía el `gclid` en la tabla `leads`.
- Esto permitía **conversiones offline**: cuando cerrabas una venta, le decías a Google "este clic de $1.000 generó una venta de $15M, score 10/10".
- **Estado actual: ROTO.** La V3 no tiene esta lógica implementada aún (Bloque A del `plan_demanda.md`, pendiente).

---

## 6. 📢 ANÁLISIS DE ANUNCIOS (COPIES)

### Los 3 anuncios activos de Búsqueda:

| Anuncio | Grupo | Impr. | Clics | CTR | Conv. | CPA | Eficacia |
|---|---|---|---|---|---|---|---|
| **Amoblamiento Integral** (15 títulos, "Closets, Cocinas y Estudios") | Amoblamiento | 2.407 | 319 | **13.25%** | 50 | $8.321 | ✅ Excelente |
| **Cocinas A** ("cotiza tu cocina", "precios de fabrica") | Cocinas | 2.506 | 232 | 9.26% | 29 | $7.886 | ✅ Excelente |
| **Cocinas B** ("Directo de Fábrica", "Cocinas de Alta Gama") | Cocinas | 2.514 | 222 | 8.83% | 28.05 | $8.065 | ✅ Excelente |
| **Solo llamada** (teléfono 3025922101) | Cocinas | 98 | 5 | 5.10% | **0** | — | Ineficaz |

**Hallazgos:**
1. El anuncio de **Amoblamiento tiene el CTR más alto** (13.25%) — los títulos "Diseño de Muebles a Medida" y "Carpintería a Medida Premium" resuenan más que los de cocinas.
2. Los 2 anuncios de cocinas rinden casi idéntico (~9% CTR, ~28-29 conv). No hay un ganador claro entre "precios de fábrica" y "alta gama", lo que sugiere que el tráfico de cocinas es más disperso en intención.
3. El **anuncio de solo llamada es un desperdicio**: 98 impresiones, 5 clics, 0 conversiones. Solo gasta $689 pero no aporta nada.
4. **Las campañas Performance Max** (18.581 impr, 913 clics, 37.95 conv, CPA $4.106) tienen un CPA mucho mejor pero una tasa de conversión baja (3.71%). Esto es típico de PMax: genera volumen barato pero de calidad cuestionable.

---

## 7. 🎯 DIAGNÓSTICO FINAL Y PLAN DE ACCIÓN RECOMENDADO

### ¿Por qué no cierras cocinas?

La respuesta es una cadena de 4 eslabones rotos:

```
[1] Presupuesto limitado ($8.500/día ÷ 2 grupos = $4.250/grupo)
        ↓
[2] CPA objetivo bajo ($6.500) → Google restringe entrega → solo 25% de cuota en cocinas
        ↓  
[3] Google optimiza para "clic en botón WhatsApp" (no para ventas reales) → atrae curiosos
        ↓
[4] Sin GCLID → Google no puede aprender qué clics generan VENTAS → repite el error
```

### Acciones inmediatas (antes de tocar presupuesto o CPA):

| # | Acción | Impacto | Esfuerzo |
|---|---|---|---|
| **A1** | Actualizar la lista de negativas con los ~40 términos sucios identificados arriba (competencia, DIY, ciudades, económico) | Medio — Protege presupuesto | 30 min en Google Ads |
| **A2** | Pausar el anuncio de "Solo llamada" (0 conversiones, desperdicio) | Bajo | 2 min |
| **A3** | Verificar segmentación geográfica (aparecen búsquedas de Ibagué, Valledupar, Jamundí) | Alto — Pueden estar comiendo impresiones | 10 min |
| **A4** | Revisar si el CPA objetivo sigue en $6.500 o si Google lo auto-ajustó tras el cambio del 17 de agosto (el warning dice que "los objetivos no se actualizarán automáticamente") | **Crítico** | 5 min |

### Acciones estratégicas (requieren decisión del Supervisor):

| # | Acción | Decisión necesaria |
|---|---|---|
| **E1** | Subir el CPA objetivo a $10.000-$12.000 COP para que Google pueda competir por el 70% de subastas que hoy pierde | ¿Aceptas pagar ~$12.000 por lead sabiendo que la mayoría sigue siendo "Hola" en WhatsApp? |
| **E2** | Separar presupuestos: darle a Cocinas su propio presupuesto diario ($6.000) y a Amoblamiento el suyo ($4.000), para que no compitan entre sí | ¿Vale la pena priorizar cocinas (ticket alto) sobre closets (ticket bajo pero cierre más fácil)? |
| **E3** | Implementar Bloque A del arnés (GCLID + conversiones offline) en la V3 para que Google aprenda a distinguir un "Hola" de $0 de una venta de $15M | Esto es código — depende del roadmap de la V3. Sin esto, cualquier optimización de Ads es "adivinanza educada". |
| **E4** | Evaluar si Performance Max ($155.835 gastados, 37.95 conv a $4.106 CPA) está generando leads reales o solo clics fantasma de la red de display | ¿Cuántos leads de PMax has recibido realmente en WhatsApp? |

---

## APÉNDICE: Métricas por campaña

### Campaña: Hermanos_garcia_busqueda_noviembre_2023 (Búsqueda)
- **Estado:** Habilitada, Apta (limitada por presupuesto)
- **Presupuesto:** $8.500/día
- **Estrategia:** CPA objetivo
- **Impresiones:** 7.525
- **Clics:** 778
- **CTR:** 10.34%
- **CPC medio:** $1.120 COP
- **Conversiones:** 107.05
- **CPA:** $8.142 COP
- **Cuota de impresiones:** 30.64%
- **Nivel de optimización:** 78.50%

### Campaña: Performance Max-1
- **Estado:** Habilitada, Apta (limitada por presupuesto + falta extensión de llamada)
- **Presupuesto:** $1.000/día
- **Estrategia:** CPA objetivo
- **Impresiones:** 18.581
- **Clics:** 913
- **CTR:** 4.91%
- **CPC medio:** $171 COP
- **Conversiones:** 37.95
- **CPA:** $4.106 COP
- **Cuota de impresiones:** < 10%
- **Nivel de optimización:** 89.69%

---
*Este diagnóstico fue generado cruzando los 5 informes CSV del periodo 27-Mar a 21-Ago contra el benchmark de Marzo 2026 y las reglas del arnés de demanda (`estado_demanda.md`, `plan_demanda.md`). Todas las cifras en COP colombianos.*
