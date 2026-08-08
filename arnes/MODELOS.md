# MODELOS — Registro de modelos (contrato vivo del stack agéntico)

**Estado:** PROMOVIDO 2026-08-07 (contrato vivo). Este registro es la fuente única de verdad
para la **rotación / intercalación de modelos** de los agentes OpenCode del arnés.
**Regla:** si este documento difiere de cualquier otra fuente sobre qué modelo usar, gana este.

**Por qué existe:** `AGENTS.md` declaraba agentes `hermes` y sus children en `.opencode/agents/`
con una regla canónica de arranque, pero **esos agentes no existen** en este worktree
(fue documentación falsa / vendedora). Este registro reemplaza esa regla con la realidad
verificada: qué modelos free están desbloqueados hoy, en qué proveedor, y cómo intercalarlos.

---

## 0. Cómo se usa (regla de rotación, no negociable)

- **Nunca el mismo modelo dos veces seguidas** para tareas encadenadas (§ARIES Diseño / roles).
- Cada subagente usa UNA identidad de modelo; el `ejecutor` y su `verificador` usan modelos distinto.
- **Intercalamos entre dos proveedores free**: capa `opencode` (zen) + capa `OpenRouter`.
- En el bucle agéntico vigente (trazabilidad punto-0, Bloque 2) se fija **6 OpenRouter : 3 opencode**.
- Si un modelo falla en runtime o devuelve salida no verificable, se marca `bloqueado` y se
  reemplaza por el siguiente **desbloqueado** de la misma capa. Nunca se lo reasigna en caliente a
  la misma tarea sin registrar el cambio aquí.

---

## 2. Inventario completo de modelos free (verificado 2026-08-07)

### 2.1 Capa `opencode` (proveedor zen, nativo de OpenCode)

| model_id (opencode/...) | rol sugerido | consumo |
|-------------------------|--------------|---------|
| `big-pickle` | razonamiento general | medio |
| `deepseek-v4-flash-free` | liviano/transcribe | bajo |
| `laguna-s-2.1-free` | lectura/rastreo medio | bajo |
| `ling-3.0-tiny-free` | muy liviano, clasificación | muy bajo |
| `longcat-2.0-free` | contexto largo, resúmenes | medio |
| `mimo-v2.5-free` | medio/texto | medio |
| `nemotron-3-ultra-free` | razonamiento fuerte | alto |
| `north-mini-code-free` | código/JSON estricto | bajo |

Estos aparecen como `opencode/*-free` (y `big-pickle`, `longcat-2.0-free`) en `opencode models`.

### 2.2 Capa OpenRouter (free tier, `:free`, precio $0)

| model_id (openrouter/...) | ctx | rol sugerido |
|---------------------------|-----|--------------|
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M | razonamiento fuerte (análisis trazabilidad pesada) |
| `nvidia/nemotron-3-super-120b-a12b:free` | 262k | razonamiento pesado |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256k | razonamiento acotado |
| `nvidia/nemotron-3-nano-30b-a3b:free` | 256k | razonamiento ligero |
| `nvidia/nemotron-nano-12b-v2-vl:free` | 128k | VL/visión |
| `nvidia/nemotron-nano-9b-v2:free` | 128k | texto ligero |
| `google/gemma-4-31b-it:free` | 262k | razonamiento sólido |
| `google/gemma-4-26b-a4b-it:free` | 262k | multillingüe razonable |
| `openai/gpt-oss-20b:free` | 131k | clínico/razonamiento |
| `cohere/north-mini-code:free` | 256k | código/JSON estricto |
| `poolside/laguna-s-2.1:free` | 262k | textos/razonamiento |
| `poolside/laguna-xs-2.1:free` | 262k | rápido/liviano |
| `inclusionai/ling-3.0-tiny:free` | 262k | muy liviano |
| `nvidia/nemotron-3.5-content-safety:free` | 128k | solo safety (no para trazar) |

---

## 3. Intercalación inteligente OPEN versus OPENROUTER (política)

Regla de equilibrio en cada bucle de subagentes (por defecto **OPENROUTER > opencode**, 2 pigidos):

- **OpenRouter** para las tareas de razonamiento/profundidad (saltos R1-R4, reconciliación de naming,
  trazado al punto-0): por su mayor contexto (256k-1M) y razonamiento fuerte (Nemotron-3, Gemma-4).
- **opencode/zen** para tareas de acoplamiento/transcripción/verificación rápida (salida JSON estándar,
  checks mecánicos livianos): por economía de rate y respuesta rápida.

Encadenado: nunca el mismo proveedor-modelo dos veces; alternar capa cuando el lote lo permita.

## 4. Importancia de mantener actualizado el stack preferido / desbloqueado

- Los modelos **free tier cambian**: entradas/salidas de `:free`, se desbloquean/reenuevan
  tasas, y el catálogo OpenRouter muta. Un modelo que hoy está en este registro puede mañana
  estar `bloqueado` o deprecado. La rotación automática por fallo (sección 1) lo cubre en runtime;
  la **reevaluación del registro** hay que hacerla con evidencia real:
  `opencode models` (capa opencode) y `GET /api/v1/models` con credenciales OpenRouter (capa OpenRouter).
- **Actualizar este archivo** en el MISMO commit en que se cambia el stack (living documentación
  §2.C de ARNES_AGENTICO): si un subagente corre con un modelo que ya no existe, el saldo no se
  mantiene y el registro se corrompe en silencio.
- Cada actualización de la tabla de modelos cuenta como `mutacion_arnes` (riesgo máximo §8) solo
  si además toca estructura de `arnes/`. Una corrección de tabla de modelos aquí es de riesgo medio
  documental; de todos modos se registra en el ledger.

## 5. Estado por modelo (desbloqueado / bloqueado)

Verificado al PROMOCIÓN 2026-08-07. Actualizar al detectar fallo en runtime:

| model_id | estado | nota |
|----------|--------|------|
| openrouter/nvidia/nemotron-3-ultra-550b-a55b:free | desbloqueado | |
| openrouter/nvidia/nemotron-3-super-120b-a12b:free | desbloqueado | |
| openrouter/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free | desbloqueado | |
| openrouter/nvidia/nemotron-3-nano-30b-a3b:free | desbloqueado | |
| openrouter/google/gemma-4-31b-it:free | desbloqueado | |
| openrouter/openai/gpt-oss-20b:free | desbloqueado | |
| opencode/deepseek-v4-flash-free | desbloqueado | |
| opencode/big-pickle | desbloqueado | |
| opencode/laguna-s-2.1-free | desbloqueado | |

*(Las filas `:free` de menor capacidad que la lista de la §2 quedan en el inventario completo,
 pero la rotación activa del Bloque 2 usa la §3 matriz.)*