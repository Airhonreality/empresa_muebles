# Auditoría de referencias — adapters IA/marketing (2026-07-06)

Esta auditoría mapea de manera exhaustiva toda referencia a los siguientes 4 adapters (y únicamente estos 4): `runpod-comfyui`, `shotstack-composer`, `google-ads-conversions`, y `meta-conversions-api`. Su propósito es servir de insumo de seguridad para las tareas de preservación y remoción del contrato de la lane `goal/adapters-ia-extraccion`.

---

## 1. Inventario físico

A continuación, se detalla la presencia física de los adapters en el repositorio, incluyendo el conteo exacto de archivos y las rutas a limpiar:

| Adapter | Carpeta Integración | Existe | # Archivos | Detalle de Archivos |
| :--- | :--- | :---: | :---: | :--- |
| **runpod-comfyui** | `src/integrations/runpod-comfyui/` | Sí | 5 | `ConfigPanel.tsx`, `adapter.test.ts`, `adapter.ts`, `index.ts`, `manifest.ts` |
| | `src/app/api/integrations/runpod-comfyui/` | Sí | 2 | `webhook/route.test.ts`, `webhook/route.ts` |
| | `src/adapters/runpod-comfyui/` | Sí | 1 | `INDEX.md` |
| **shotstack-composer** | `src/integrations/shotstack-composer/` | Sí | 5 | `ConfigPanel.tsx`, `adapter.test.ts`, `adapter.ts`, `index.ts`, `manifest.ts` |
| | `src/app/api/integrations/shotstack-composer/` | Sí | 2 | `webhook/route.test.ts`, `webhook/route.ts` |
| | `src/adapters/shotstack-composer/` | Sí | 1 | `INDEX.md` |
| **google-ads-conversions** | `src/integrations/google-ads-conversions/` | Sí | 5 | `ConfigPanel.tsx`, `adapter.test.ts`, `adapter.ts`, `index.ts`, `manifest.ts` |
| | `src/app/api/integrations/google-ads-conversions/` | Sí | 2 | `report/route.test.ts`, `report/route.ts` |
| | `src/adapters/google-ads-conversions/` | Sí | 1 | `INDEX.md` |
| **meta-conversions-api** | `src/integrations/meta-conversions-api/` | Sí | 5 | `ConfigPanel.tsx`, `adapter.test.ts`, `adapter.ts`, `index.ts`, `manifest.ts` |
| | `src/app/api/integrations/meta-conversions-api/` | Sí | 2 | `report/route.test.ts`, `report/route.ts` |
| | `src/adapters/meta-conversions-api/` | Sí | 1 | `INDEX.md` |

---

## 2. Registro en engine

Cita exacta de las líneas de registro en los archivos de configuración del motor:

### a) `agnostic.config.ts` (Líneas 72 a 75)
```typescript
    'runpod-comfyui': () => import('./src/integrations/runpod-comfyui'),
    'shotstack-composer': () => import('./src/integrations/shotstack-composer'),
    'meta-conversions-api': () => import('./src/integrations/meta-conversions-api'),
    'google-ads-conversions': () => import('./src/integrations/google-ads-conversions'),
```

### b) `src/lib/integrations/adapters.server.ts`

#### Imports de adaptadores y manifiestos (Líneas 18 a 25)
```typescript
import { RunpodComfyuiAdapter } from '@/integrations/runpod-comfyui/adapter';
import { manifest as runpodComfyuiManifest } from '@/integrations/runpod-comfyui/manifest';
import { ShotstackComposerAdapter } from '@/integrations/shotstack-composer/adapter';
import { manifest as shotstackComposerManifest } from '@/integrations/shotstack-composer/manifest';
import { MetaConversionsApiAdapter } from '@/integrations/meta-conversions-api/adapter';
import { manifest as metaConversionsApiManifest } from '@/integrations/meta-conversions-api/manifest';
import { GoogleAdsConversionsAdapter } from '@/integrations/google-ads-conversions/adapter';
import { manifest as googleAdsConversionsManifest } from '@/integrations/google-ads-conversions/manifest';
```

#### Bloque del Registry (Líneas 50 a 53)
```typescript
    'runpod-comfyui': { manifest: runpodComfyuiManifest, create: creds => new RunpodComfyuiAdapter(creds) },
    'shotstack-composer': { manifest: shotstackComposerManifest, create: creds => new ShotstackComposerAdapter(creds) },
    'meta-conversions-api': { manifest: metaConversionsApiManifest, create: creds => new MetaConversionsApiAdapter(creds) },
    'google-ads-conversions': { manifest: googleAdsConversionsManifest, create: creds => new GoogleAdsConversionsAdapter(creds) },
```

---

## 3. Referencias en `src/` (y raíz técnica `scripts/`)

Mapeo de referencias vivas encontradas en el código fuente. Se incluye la raíz de scripts ya que hereda referencias directas para comandos del CLI:

| Archivo:Línea | Adapter | Tipo de referencia |
| :--- | :--- | :--- |
| `src/lib/integrations/adapters.server.ts:18-19` | `runpod-comfyui` | Importación estática de clase de adapter y manifest. |
| `src/lib/integrations/adapters.server.ts:20-21` | `shotstack-composer` | Importación estática de clase de adapter y manifest. |
| `src/lib/integrations/adapters.server.ts:22-23` | `meta-conversions-api` | Importación estática de clase de adapter y manifest. |
| `src/lib/integrations/adapters.server.ts:24-25` | `google-ads-conversions` | Importación de clase de adapter y manifest. |
| `src/lib/integrations/adapters.server.ts:50` | `runpod-comfyui` | Registro del adapter para instanciación dinámica. |
| `src/lib/integrations/adapters.server.ts:51` | `shotstack-composer` | Registro del adapter para instanciación dinámica. |
| `src/lib/integrations/adapters.server.ts:52` | `meta-conversions-api` | Registro del adapter para instanciación dinámica. |
| `src/lib/integrations/adapters.server.ts:53` | `google-ads-conversions` | Registro del adapter para instanciación dinámica. |
| `scripts/agno.ts:55` | `runpod-comfyui` | Importación estática de `previewRunpodComfyuiSubmit` para comando de CLI. |
| `scripts/agno.ts:56` | `shotstack-composer` | Importación estática de `previewShotstackComposeRequest` para comando de CLI. |
| `scripts/agno.ts:58-60` | `meta-conversions-api` | Importación estática de helpers de previsualización de conversiones. |
| `scripts/agno.ts:62-64` | `google-ads-conversions` | Importación de helpers de previsualización de conversiones. |
| `scripts/agno.ts:363-369` | `google-ads-conversions` | Extracción de variables de entorno de prueba para Google Ads. |
| `scripts/agno.ts:372-375` | `meta-conversions-api` | Extracción de variables de entorno de prueba para Meta CAPI. |
| `scripts/agno.ts:381-385` | `google-ads-conversions` | Invocación de preview single/batch para Google Ads. |
| `scripts/agno.ts:387-390` | `meta-conversions-api` | Invocación de preview single/batch para Meta CAPI. |
| `scripts/agno.ts:2072-2081` | `shotstack-composer` | Manejo de comando de previsualización `adapter compose --dry`. |
| `scripts/agno.ts:2418` | `runpod-comfyui` | Manejo de comando de previsualización `adapter submit --dry`. |
| `scripts/agno.ts:2483-2492` | `shotstack-composer` | Duplicación de lógica de previsualización `adapter compose --dry` en runner principal. |

---

## 4. Referencias en `storage/db/`

Se realizó una búsqueda recursiva sobre todos los archivos JSON de base de datos local en `storage/db/` (incluyendo `scripts.json`, `page_routes.json`, `schema_definitions.json` y archivos específicos de entidades).

* **Zaps (`scripts.json`):** 0 referencias. Ninguno de los 4 adapters es invocado en scripts o zaps del motor local.
* **Rutas (`page_routes.json`):** 0 referencias. Ninguna página o bloque visual define flujos asociados a los 4 IDs.
* **Schemas (`schema_definitions.json`):** 0 referencias.
* **Otras entidades:** 0 referencias.

**Conclusión:** Los 4 adapters no tienen ningún cableado en la capa de datos o reglas del fork local, lo que facilita enormemente su remoción.

---

## 5. Artefactos raíz

Se abrieron y analizaron los archivos JSON sueltos en la raíz del repositorio:

* **`edl.json` (Veredicto: REMOVER):** Contiene la especificación de una EDL (Edit Decision List) para composición de video asíncrona. Llama directamente a `https://example.com/api/integrations/shotstack-composer/webhook`. Es un archivo de prueba para `shotstack-composer`. Se debe archivar y mover en las carpetas hermanas fuera del repositorio.
* **`cobro.json` (Veredicto: PRESERVAR):** Estructura un payload de cobro que incluye transacciones vía PSE, COP, aceptación de términos legales y tokens de la pasarela **Wompi** (Colpatria/Bancolombia). Wompi es un adapter activo de pagos que se queda en el fork, por lo tanto, `cobro.json` debe preservarse en la raíz.

---

## 6. Variables `.env` involucradas (solo nombres)

Estas variables son consumidas por las integraciones correspondientes y no registran valores locales activos en los archivos `.env` o `.env.local` actuales (están limpias a nivel local):

### a) runpod-comfyui
* `RUNPOD_API_KEY`
* `RUNPOD_ENDPOINT_ID`
* `RUNPOD_BUCKET_ENDPOINT_URL`
* `RUNPOD_BUCKET_ACCESS_KEY_ID`
* `RUNPOD_BUCKET_SECRET_ACCESS_KEY`
* `RUNPOD_COMFYUI_WEBHOOK_STORE` (ruta interna para persistencia de webhooks)

### b) shotstack-composer
* `SHOTSTACK_API_KEY`
* `SHOTSTACK_ENV`
* `SHOTSTACK_COMPOSER_WEBHOOK_STORE` (ruta interna de webhook)
* `SHOTSTACK_COMPOSER_VIDEO_DIR` (ruta de salida para descargas)

### c) google-ads-conversions
* `GOOGLE_ADS_OPERATING_ACCOUNT_ID`
* `GOOGLE_ADS_CONVERSION_ACTION_ID`
* `GOOGLE_DM_SERVICE_ACCOUNT_JSON`

### d) meta-conversions-api
* `META_CAPI_DATASET_ID`
* `META_CAPI_SYSTEM_TOKEN`
* `META_CAPI_TEST_EVENT_CODE`

---

## 7. Docs que mencionan los 4 (para actualizar en tarea 5)

Estos archivos de documentación y notas de diseño hacen referencia a los 4 adapters y requerirán ser actualizados, editados o eliminados según corresponda:

1. **Gestores de Adapters:**
   * `src/adapters/INDEX.md` (Remover tablas y notas de los 4)
   * `src/adapters/current_state.md` (Actualizar estado de integraciones)
   * `src/adapters/AUDITORIA_HOMEOSTASIS_2026-07-03.md` (Documentación histórica)
   * `src/adapters/PROMPT_FABLE5_ARQUITECTO_ARNES.md` (Documentación histórica)
2. **Capabilidades de Módulos (en diseño):**
   * `src/modules/render-studio/INDEX.md` (Editar notas del satélite)
   * `src/modules/render-studio/docs/01_arquitectura_paquete.md` (Editar referencias externas)
   * `src/modules/render-studio/docs/02_contrato_universal_render.md` (Editar referencias externas)
   * `src/modules/render-studio/workflows/README.md`
   * `src/modules/render-studio/ui/README.md`
   * `src/modules/video-editor/INDEX.md` (Editar notas de satélite de video)
   * `src/modules/video-editor/README.md`
   * `src/modules/video-editor/ui/README.md`
   * `src/modules/video-editor/docs/02_contrato_universal_video.md`
   * `src/modules/video-editor/docs/01_arquitectura_paquete.md`
   * `src/modules/video-editor/workflows/README.md`
3. **Control del Fork:**
   * `storage/progreso/current_state.md`
   * `storage/progreso/lanes/goal-adapters-ia-extraccion.md` (Este contrato)

---

## 8. Falsos positivos descartados

* **Adapter `meta` (Mensajería / Inbox):** Se identificaron múltiples referencias en `agnostic.config.ts` (línea 68) y `src/lib/integrations/adapters.server.ts` (líneas 10, 11 y 46) que apuntan al adapter de mensajería `meta`. Este adapter corresponde al Inbox/WhatsApp de la mueblería y **se queda**. Queda descartado como referencia a remover.
* **`cobro.json`:** Como se mencionó en la sección 5, pertenece al adapter `wompi` que no está bajo el alcance de remoción.

---

## 9. Riesgos detectados y recomendación GO/NO-GO

### Riesgos Detectados:
1. **Riesgo Crítico de Compilación (`scripts/agno.ts`):** Si simplemente se eliminan los directorios físicos de los adapters de `src/integrations/`, la compilación general (`npm run agnostic:compile` y `tsc --noEmit`) fallará debido a las importaciones estáticas que tiene `scripts/agno.ts`. 
   *Mitigación:* Es obligatorio limpiar/comentar las importaciones de preview y sus bloques de llamada en `scripts/agno.ts` durante la **Tarea 5**.
2. **Inconsistencia de Documentación en Módulos:** Módulos en diseño como `render-studio` y `video-editor` perderán la referencia de sus adapters locales.
   *Mitigación:* Se deben limpiar sus archivos de índice para registrar que el motor consumirá estas capabilities conectándose vía HTTP con el proyecto satélite `estudio_multimedia`.

### Recomendación GO/NO-GO por Adapter:

* **`runpod-comfyui` ➔ GO** (Bajo la condición de limpiar `scripts/agno.ts` y documentar la migración en `render-studio`).
* **`shotstack-composer` ➔ GO** (Bajo la condición de archivar `edl.json` y actualizar `video-editor`).
* **`google-ads-conversions` ➔ GO** (Sin riesgos de datos. Limpieza trivial).
* **`meta-conversions-api` ➔ GO** (Sin riesgos de datos. Limpieza trivial).
