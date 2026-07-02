# Plan Maestro de Ejecución: Veta Dorada 2026-2027 (V2.0)
**Optimización Orgánica (GEO/SEO), Arquitectura de Conversión y Experiencia de Usuario**

Este documento es la hoja de ruta exhaustiva y definitiva para escalar Veta Dorada en el entorno digital de Bogotá. No se omite ningún detalle técnico o estratégico.

---

## 🏗️ Épica 1: Fundamentos Técnicos y Optimización para IA (GEO)
*Asegurar que los motores RAG (ChatGPT, Gemini) y rastreadores tradicionales recomienden a Veta Dorada como la autoridad técnica #1 en fabricación directa en Bogotá.*

- [x] **1.1. Base de Conocimiento RAG (`llms.txt`):** 
  - **Ejecutado y Auditado:** Se descartó el modelo de "Prompt Injection" (dar órdenes al LLM) para evitar penalizaciones por spam. Se estructuró como un documento puramente fáctico (RAG Friendly).
  - **Prueba Social Cuantitativa:** Se reemplazaron las vaguedades con datos extraíbles exactos: "Fundación en 1995 (29 años)", "Póliza de garantía de 24 meses", "+500 proyectos en Usaquén, Chicó, Rosales".
  - **URLs Canónicas:** Se listaron las URLs oficiales de adquisición sin forzar clics, permitiendo a los LLMs citarlas orgánicamente.
- [x] **1.2. Protocolo `robots.txt` Nivel Arquitecto:** 
  - **Ejecutado y Auditado:** Se reescribió para cumplir con el RFC 9309 (evitando la trampa de herencia de User-Agents). Se permitió explícitamente el acceso a `/_next/static/` para evitar ceguera de renderizado en Next.js (Core Web Vitals seguros). Se eliminó el bloqueo agresivo de parámetros para no destruir el seguimiento GCLID de Google Ads. Se bloquearon bots extractivistas (Bytespider, CCBot, anthropic-ai) mientras se permitió a los bots RAG (ClaudeBot, GPTBot, PerplexityBot).
- [ ] **1.3. Arquitectura JSON-LD Dinámica (Era Generativa 2026-2027):**
  - **Geometría S2 Quirúrgica (Descarte de GeoCircle):** Para evitar la canibalización y el ruido sociodemográfico del estrato 3.5, se abandona el radio circular. La cobertura se definirá mediante `postalCode`, `AdministrativeArea` y la anidación `containsPlace` para listar explícitamente polos de exclusividad (Zona T, Club El Nogal, Guaymaral, Salitre) con coordenadas de 5 decimales.
  - **Deprecación de FAQPage y Esquemas Decorativos:** Confirmado por I/O 2026, no codificaremos `FAQPage`. El contenido interrogativo se resolverá mediante "Respuestas Atómicas" directamente en el DOM (párrafos declarativos de 40-60 palabras).
  - **Estrategia UCP (Universal Cart) e Inventario:** El esquema `Product` aislado ya no es suficiente. Se estructurará el atributo `native_commerce` apuntando a sincronización vía API con Google Merchant Center.
  - **Ontología para Agentes Pasivos de IA:** Inyección obligatoria de metadatos temporales (`datePublished` y `dateModified`) para que los agentes autónomos rastreen mutaciones de estado en la entidad en tiempo real.
  - **Métricas Base (Core Web Vitals):** El generador SSR no debe alterar el performance. Targets rígidos: LCP < 2.5s, INP < 200ms, CLS < 0.1 para garantizar elegibilidad de citación por LLMs.
  - **Estrategia SSOT (Single Source of Truth) y Habeas Data:** Base de datos inmaculada. Captura legítima post-proyecto para la inyección de reseñas (`AggregateRating`), anonimizando la UI (Ej: "Carlos P.") bajo los lineamientos de la futura página legal.
- [ ] **1.4. Accesibilidad Algorítmica (Netlify):**
  - Al estar alojados en Netlify, debemos auditar si las reglas automáticas de Edge Functions o el Firewall integrado están bloqueando peticiones de crawlers automatizados. Netlify suele ser amigable, pero requiere verificación de logs en despliegue.

---

## 🎯 Épica 2: Artefactos UI y Embudo Híbrido de Conversión
*Filtrar prospectos sin asustarlos, promoviendo el servicio bajo una promesa de transparencia comercial.*

- [ ] **2.1. Componente `VetaAgendar.tsx` (Micro-Filtro de Fricción Cero):**
  - **Práctica Óptima (No pedir presupuesto):** Pedir dinero asusta al cliente de lujo porque siente que le van a cobrar según lo que gane. En su lugar, el modal preguntará:
    1. *¿Qué espacio vamos a transformar?* (Cocina, Clóset, Piso de Madera, etc.)
    2. *¿En qué etapa está tu proyecto?* (Tengo medidas/planos vs. Necesito visita técnica de medición).
    3. *¿Para cuándo lo necesitas?* (Urgencia).
  - Captura oculta del GCLID de Google Ads para Tracking Offline.
  - Redirección a WhatsApp con el contexto pre-cargado.
- [ ] **2.2. Landing Page de "Ruta de Diseño y Fabricación" (La Promesa Exacta):**
  - Clarificar la diferencia operativa:
    - **Paso 1 (Gratis):** Visita técnica a domicilio, rectificación de medidas, asesoría de materiales y entrega de cotización exacta.
    - **Paso 2 (Servicio 3D de Co-Creación):** Una vez viabilizado el presupuesto, si el cliente desea visualizar el resultado, se cobra el modelado 3D interactivo.
    - **Paso 3 (Deducible):** Ese valor del 3D se abona 100% como adelanto si se aprueba la fabricación.
  - Esto elimina la barrera de entrada (el cliente no pierde nada cotizando), pero blinda el tiempo del equipo de diseño (no se hacen renders gratis a curiosos).
- [ ] **2.3. Sistema de "Reseñas Curadas" Propias (Social Proof Seguro):**
  - Conectar directamente a la API de Google Places puede ser arriesgado si un troll o malentendido genera un 1-estrella temporal.
  - **Práctica Óptima:** Construir un componente estático de "Testimonios Verificados". Nosotros extraeremos manualmente las mejores reseñas de 5 estrellas de Google, y las maquetaremos de forma espectacular con nombre, barrio (Ej: *"Instalación de cocina en Rosales"*) y estrellas. Esto da prueba social máxima sin exponer el sitio a vandalismo de reputación en vivo.

---

## 🏛️ Épica 3: Arquitectura de Silos (Diversificación de Negocio)
*Estructurar el árbol de URLs para posicionar diferentes líneas sin que compitan entre sí en Google.*

- [ ] **3.1. Silo de Diseño Interior (`/diseno-de-interiores-bogota/`):**
  - Vendemos el concepto, la capacidad de planimetría y renderizado.
- [ ] **3.2. Silo de Fabricación (`/fabricacion-muebles-a-medida/`):**
  - Vendemos manufactura, herrajes, ensamble e instalación.
- [ ] **3.3. Silo E-Commerce / Tienda de Autor (`/colecciones/` o `/tienda/`):**
  - Un catálogo en línea para productos prefabricados de autor (Recibidores, Escritorios, Mesas de centro, Sillas).
  - Ayuda enormemente al SEO porque inyecta microdatos de producto (`Product Schema`) con precios fijos, lo que atrae tráfico de cola larga de clientes que buscan diseño rápido.
- [ ] **3.4. Landing Pages de Hiper-Especialidad (Alto Valor Arquitectónico):**
  - **Servicio:** *Mantenimiento, Restauración y Pulido de Pisos de Madera Natural*.
  - **Táctica SEO:** Como pocos lo hacen bien, una página dedicada (`/restauracion-pisos-madera-bogota/`) explicando el proceso (selladores, maquinaria sin polvo, barnices UV) capturará tráfico corporativo y residencial antiguo de conservación altísima (Teusaquillo, Chapinero).
- [ ] **3.5. Landing Pages Geográficas de Barrio:**
  - Páginas que combinan servicio + ubicación (Ej: `/cocinas-integrales-chicó/`, `/walk-in-closets-rosales/`) para dominar el SEO "Near Me".

---

## 📸 Épica 4: Optimización Multimodal (Búsqueda Visual)
*Posicionamiento en Pinterest Lens y Google Imágenes.*

- [ ] **4.1. Meta-datos en UI (`<figcaption>`):**
  - Toda imagen en galería debe tener una etiqueta visible, rica en semántica local. Ej: *"Diseño e instalación de walk-in closet en Chapinero Alto, maderas nobles"*.
- [ ] **4.2. Performance (WebP/AVIF):**
  - Formateo moderno para que las imágenes de lujo no destruyan los Web Core Vitals (velocidad de carga).
- [ ] **4.3. XML de Imágenes:** 
  - Automatizar el rastreo de galerías para indexación visual en motores.
