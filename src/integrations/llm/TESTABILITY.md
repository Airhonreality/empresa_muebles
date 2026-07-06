# LLM Adapter — Diseño de Testabilidad

## Problema Original

Los tests iniciales fallaban porque intentaban mockear globalmente módulos del SDK externo (`ai`, `@ai-sdk/*`), lo que era frágil y acoplaba los tests a detalles internos del SDK de Vercel.

## Solución Adoptada: Inyección de Runtime

Se creó una **capa interna de ejecución** mediante la interfaz `LlmRuntime`, que:

1. **Encapsula la ejecución del SDK** en dos métodos tipados:
   - `executeChat()` — ejecuta llamadas de chat
   - `executeClassifyImage()` — ejecuta clasificación de imágenes

2. **Se inyecta en el constructor** del adapter (parámetro opcional):
   ```typescript
   constructor(storageAdapter: StorageAdapter, runtime?: LlmRuntime)
   ```

3. **Usa implementación real en producción**:
   - Por defecto: `VercelAiRuntime` que importa dinámicamente el SDK

4. **Permite mocks simples en tests**:
   - Sin tocar módulos globales
   - Sin `vi.mock()` frágil
   - Solo una interfaz tipada inyectable

## Beneficios

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Acoplamiento** | Tests → SDK directo | Tests → interfaz inyectable |
| **Mocks** | Frágiles (vi.mock globales) | Tipados (implementación simple) |
| **Cobertura** | 4/5 tests | 14/14 tests ✅ |
| **Cambios API** | Requería refactor | Ninguno (opcional second param) |
| **Extensibilidad** | Hardcodeado | Pluggable (runtime custom) |

## Estructura

```
LlmAdapter (public interface)
  ↓
  ├─ getActiveAiConfig()    [lógica de config, sin SDK]
  ├─ getEnvApiKey()         [lógica de env, sin SDK]
  └─ runtime.execute*()     [injected, SDK isolated]
       ↓
       ├─ VercelAiRuntime   [production]
       └─ MockRuntime       [tests]
```

## Tests Unitarios

**14 tests, todos pasando:**
- ✅ Initialization & configuration
- ✅ Chat execution & config resolution
- ✅ Image classification
- ✅ API key resolution (config + env)
- ✅ Error handling (missing config, missing key)
- ✅ Multiple config handling (active vs first)
- ✅ testConnection() method
- ✅ Runtime injection verification

## Cumplimiento de DoD

- ✅ `npx tsc --noEmit` — compila sin errores LLM
- ✅ `npx vitest run src/integrations/llm` — 14/14 tests pasan
- ✅ `npx tsx scripts/agno.ts list-adapters` — adapter disponible
- ✅ `npx tsx scripts/agno.ts validate` — validation limpia

## Nota de Diseño

La inyección de runtime es **mínima y no intrusiva**:
- Segunda parámetro del constructor: opcional
- Parámetro por defecto: `new VercelAiRuntime()`
- API pública del adapter: **no cambió**
- Migración: transparente (código existente funciona igual)

Esta es una **frontera de dependencia clara** que aísla el SDK sin sacrificar funcionalidad.
