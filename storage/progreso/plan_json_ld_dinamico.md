# Arquitectura Dinámica de JSON-LD (Nivel: Entity Graph)

Este documento justifica y diseña la implementación técnica del SEO Semántico Dinámico para Veta Dorada en Next.js. El objetivo es superar la inyección tradicional de "scripts aislados" (práctica común incluso en desarrolladores Senior) y construir un **Grafo de Conocimiento (Knowledge Graph)** cohesionado.

---

## 1. Geometría Espacial Quirúrgica (Geometría S2 vs Polígonos de Ads)
**La Estrategia Superior:** Hemos descartado el uso de circunferencias superpuestas (`GeoCircle`) ya que generan canibalización SEO e introducen ruido geográfico (captando tráfico aspiracional de estratos 3 y 3.5 que no son nuestro target). 
Para el SEO Semántico, utilizaremos la precisión de la **Geometría S2**:
*   **Códigos Postales y `AdministrativeArea`:** Arreglos exactos de los códigos postales premium.
*   **`containsPlace`:** Anidación explícita de nodos de riqueza B2B (Zona T, Salitre) y ecosistemas de lujo (Club El Nogal, Country Club).
*   **Precisión de Coordenadas:** Todo punto geográfico (Lat/Long) tendrá un mínimo estricto de **5 decimales** para garantizar trazabilidad milimétrica.

---

## 2. El Problema del "Script Generalizado" y la Solución del Grafo (`@id`)

Tu preocupación es clave: *Si pongo la información del negocio local en el Home, pero pongo solo el "Servicio" en la página de servicios... ¿Google se olvida de quién es el negocio cuando lee el servicio?*

**El Error del Dev Senior Tradicional:** Pega bloques JSON-LD independientes. En la tienda hay un `Product`, en el home hay un `LocalBusiness`. Google los ve como islas flotantes desconectadas.

**Nuestra Arquitectura Superior (Entity Graphing):**
Vamos a usar anclajes relacionales a través de la propiedad `@id`.
En el archivo raíz (`layout.tsx`), inyectaremos UN SOLO bloque fundacional que define la **Organización Madre**. A este bloque le pondremos una "placa patente": `@id: "https://vetadeoro.co/#organization"`.
En las páginas hijas (Landing de cocinas, tienda online), inyectaremos esquemas específicos (Servicios, Productos), pero **siempre** declararemos que le pertenecen a la organización madre haciendo referencia a su patente. 

De esta forma, no sobrecargamos la página con código repetido (evitamos el "script estático" gigante), pero Google sabe matemáticamente que la Silla (Página Hija) es fabricada y vendida por Veta Dorada (Organización Madre).

---

## 3. Plan Detallado y Coherencia con el Mapa de Sitio

### A. Capa Fundacional: `layout.tsx` (Se inyecta en TODA la web)
*   **Esquema:** `Organization` (o `FurnitureStore` base).
*   **Identificador Canónico Crítico:** `@id: "https://vetadeoro.co/#organization"` (Debe ser idéntico en toda la app. Ninguna variante sin 'www' o con 'http' es permitida, o se romperá el grafo).
*   **Contenido:** 
    *   `logo`: URL absoluta a una imagen indexable (JPG/PNG/WebP, NUNCA un SVG inline).
    *   `contactPoint`: Número con indicativo colombiano `+57` y `contactType: "customer service"`.
    *   `sameAs`: Perfiles reales activos, incluyendo obligatoriamente el enlace directo al Google Business Profile.

### B. Capa de Autoridad Local: `page.tsx` (Página de Inicio)
*   **Esquema:** `LocalBusiness` / `FurnitureStore`.
*   **Fundamentos NAP (Obligatorios):**
    *   `name`: Nombre legal exacto (idéntico al Google Business Profile).
    *   `address`: Objeto `PostalAddress` completo.
    *   `telephone` y `url`.
*   **Contenido Exclusivo de Cobertura:** 
    *   `geo` (WGS84): Coordenadas exactas validadas con 5 decimales.
    *   `areaServed`: Array de Códigos Postales (`postalCode`) de las zonas premium.
    *   `containsPlace`: Array explícito con puntos de interés corporativo y de lujo (Ej: "Zona T", "Club Campestre Los Lagartos").
    *   `openingHours`: Formato estándar (ej: `Mo-Fr 09:00-18:00`).
    *   `parentOrganization` -> Vinculado al `@id` exacto `#organization`.

### C. Capa Transaccional de Servicios: `/diseno-de-interiores-bogota` y `/fabricacion...`
*   **Esquema:** `Service` + `FAQPage` + `BreadcrumbList`.
*   **Contenido Exclusivo:**
    *   `serviceType`: "Diseño de interiores Bogotá" (String legible por humanos, no código interno).
    *   `provider`: Vinculado al `@id` `#organization`.
    *   `hasOfferCatalog`: Vinculado a la URL real del modal de agendamiento (`/agendar`), nunca un placeholder.
    *   `areaServed`: Debe re-declararse aquí (Google no asume herencia implícita de zona de servicio).
*   **Reglas Críticas de `FAQPage`:**
    *   Mínimo 3 preguntas para forzar la activación del Rich Snippet.
    *   Respuestas en el rango óptimo de extracción (50-300 palabras).
    *   **Penalización Fantasma:** Toda pregunta inyectada en el JSON-LD DEBE existir y ser visible en el HTML renderizado. Google penaliza severamente inyectar FAQs ocultas.

### D. Capa E-Commerce Comercial: `/colecciones/[slug]`
*   **Esquema:** `Product` + `ImageObject`.
*   **Contenido Exclusivo (Requerimientos Google Shopping):**
    *   `priceCurrency`: Obligatoriamente `"COP"`. Si se omite o se asume USD, Google excluye el producto del panel orgánico colombiano.
    *   `priceValidUntil`: Fecha de expiración obligatoria para evitar desactivación del listing.
    *   `availability`: URI completa (`https://schema.org/InStock`).
    *   `brand`: Vinculado al `@id` `#organization`.
    *   **Regla de Reseñas (`Review`):** Si un mueble no tiene reseñas reales en la base de datos Agnostic, el esquema `Review` NO se inyecta. Falsificar reseñas en JSON-LD genera una penalización manual destructiva.

---

## 4. Implementación Técnica en Next.js (Manejador Central)

Para lograr esta perfección, construiremos `src/lib/agnostic/seo/schemaGenerator.ts`. Esta utilidad deberá cumplir las siguientes normas técnicas de la auditoría:
1.  **Renderizado SSR Obligatorio:** El JSON-LD debe renderizarse en el Servidor (Server-Side Rendering). Los crawlers y bots no ejecutan JavaScript client-side (CSR).
2.  **Prevención de Colisiones:** El script asegurará que si estamos en `page.tsx`, no se duplique el bloque `Organization` que ya inyectó `layout.tsx`.
3.  **Codificación Segura:** Se forzará UTF-8 puro (las tildes como `á, é` y las `ñ` no deben escaparse a entidades HTML dentro del JSON, o Googlebot fallará al parsear las zonas de Bogotá).
