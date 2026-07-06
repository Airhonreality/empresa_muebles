# Prompt de deep research — pegar tal cual en un LLM con búsqueda web

> Instrucciones de uso: copia todo el bloque de código de abajo y pégalo en una ventana de chat de un LLM con capacidad de búsqueda web. Cuando tengas la respuesta, vuelca los resultados en `04_hallazgos_investigacion.md` y retoma el trabajo desde `INDEX.md`.

```text
ROL Y OBJETIVO

Eres un investigador técnico. Estoy construyendo un editor de video
automatizado: recibe clips crudos, los clasifica por calidad/tipo de toma
usando un LLM multimodal, descarta los de baja calidad, y compone los
buenos en un video corto sincronizado con el ritmo (BPM) de una pista de
audio. La app está en Next.js, desplegada en Vercel/Netlify (serverless).
Necesito información actualizada — confirma con búsqueda web, no asumas
desde tu entrenamiento.

1. FFMPEG EN ENTORNOS SERVERLESS
   - ¿Es viable correr ffmpeg directamente dentro de una función serverless
     de Vercel/Netlify? Límites de tamaño de función, tiempo máximo de
     ejecución, y si existe un binario de ffmpeg empaquetable (ej. paquetes
     npm tipo ffmpeg-static) que funcione en ese entorno sin instalación
     manual del sistema operativo.
   - Si no es viable para videos de duración/resolución realistas, ¿cuál es
     el patrón recomendado? (cola de trabajos hacia un servicio aparte,
     contenedor dedicado, servicio hospedado).

2. ALTERNATIVAS A FFMPEG PROPIO
   - Investiga servicios de composición de video vía API (ej. Shotstack,
     Mux Video, Cloudinary Video API, u otros vigentes en 2026): pricing,
     modelo de API (REST/webhook para trabajos asíncronos), y si soportan
     sincronización con pista de audio y edit-decision-lists similares a lo
     que describo arriba.
   - Compara costo y complejidad de integración: ffmpeg propio (en un
     contenedor/servidor separado que tú operas) vs un servicio hospedado.

3. DETECCIÓN DE ESCENAS / CORTES AUTOMÁTICOS
   - Herramientas o librerías (Node.js si existen, o servicios vía API) para
     dividir un video largo en clips automáticamente detectando cambios de
     toma — equivalente a PySceneDetect pero utilizable desde un stack
     Node/TypeScript sin depender de un proceso Python separado.

4. SINCRONIZACIÓN CON RITMO MUSICAL (BPM)
   - Cómo detectar el BPM de una pista de audio de forma programática, y
     cómo se traduce eso en tiempos de corte para el edit-decision-list que
     recibe el composer.

5. CLASIFICACIÓN DE CLIPS CON LLM MULTIMODAL
   - Confirma qué modelos multimodales actuales (GPT-4o, Claude, Gemini, u
     otros) son más confiables y económicos para clasificar frames de video
     por calidad estética/estabilidad — esto se usa como WORKFLOW sobre un
     LLM adapter que ya existe en el proyecto (no es un adapter nuevo).

6. PROBLEMAS REPORTADOS POR LA COMUNIDAD (ÚLTIMOS 6-12 MESES)
   - Busca en foros/comunidades: quejas frecuentes sobre timeouts, calidad
     de output, o costos inesperados en edición de video automatizada en
     entornos serverless.

CONTRATO BORRADOR A VALIDAR

Tengo este contrato TypeScript borrador para el adapter de composición
(deliberadamente sin clasificación — eso es un workflow aparte):

  interface EditDecision { clipUrl; startSeconds?; endSeconds?; order; }
  interface ComposeRequest { decisions; audioTrackUrl?; outputFormat?; }
  interface ComposeResult { id; status; videoUrl?; raw?; }
  interface VideoComposerAdapter {
    compose(request): Promise<ComposeResult>;
    getResult(jobId): Promise<ComposeResult>;
  }

Evalúa si esta forma es suficiente dado lo que encuentres en los puntos 1-4.
Señala cualquier dato que falte (ej. si el servicio elegido necesita
parámetros de transición, marca de agua, o formato de salida específico no
contemplado).

FORMATO DE SALIDA ESPERADO

1. Respuestas a los 6 puntos, citando fuentes (URLs) cuando sea posible.
2. Una recomendación concreta: ffmpeg propio vs servicio hospedado, y con
   qué herramienta de detección de escenas/BPM combinarlo.
3. Ajustes que el contrato borrador necesitaría.
```
