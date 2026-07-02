# Mapa de Sitio y Arquitectura Web (Silos)

Este documento contiene netamente la estructura de páginas, el enrutamiento y la organización jerárquica de la plataforma web de Veta Dorada, sin mezclar aspectos de marketing o SEO.

---

## 1. Menú Principal (Navegación Global)

```text
+-----------------------------------------------------------------------------------------+
| VETA DORADA (Logo)    Diseño Interior    Carpintería a Medida    Tienda Online   [Agendar] |
+-----------------------------------------------------------------------------------------+
```

## 2. Arquitectura de Silos (URLs)

### 🏠 Nivel 0: Raíz
*   `/` (Home): Portada principal. Gancho de autoridad técnica y redirección a silos.

### 📐 Nivel 1: Silo de Diseño Interior (El Servicio de Conceptualización)
*   `/diseno-de-interiores-bogota/` (Página Pilar): Venta del servicio de medición, diseño 3D interactivo y entrega de planos técnicos.
    *   `/diseno-de-interiores-bogota/cocinas`
    *   `/diseno-de-interiores-bogota/walk-in-closets`

### 🪚 Nivel 1: Silo de Fabricación a Medida (La Carpintería)
*   `/fabricacion-muebles-a-medida/` (Página Pilar): Venta de la manufactura directa, herrajes y maderas. Ideal para quienes ya tienen planos.
    *   `/fabricacion-muebles-a-medida/cocinas-integrales-rh`
    *   `/fabricacion-muebles-a-medida/closets-empotrados`
    *   `/fabricacion-muebles-a-medida/centros-de-entretenimiento-tv`

### 🛒 Nivel 1: Silo E-Commerce (Tienda de Autor)
*   `/tienda/` o `/colecciones/` (Página Pilar): Catálogo de muebles prefabricados de precio fijo (Recibidores, Escritorios, Mesas de centro).

### 💎 Nivel 1: Especialidades Arquitectónicas
*   `/servicios-especializados/restauracion-pisos-madera-bogota/` (Página Dedicada): Servicio premium de pulido, sellado y mantenimiento de pisos de madera natural antigua.

### 📍 Nivel 2: Landing Pages Geográficas (Clúster Estrato 4+)
Rutas optimizadas dinámicamente o estáticas para SEO Local:
*   `/cocinas-integrales/rosales`
*   `/walk-in-closets/usaquen`
*   `/carpinteria-a-medida/chico`
*   `/restauracion-pisos/teusaquillo`

---

## 3. Componentes Globales Críticos

### A. El Footer (Pie de Página)
*   **Columna 1:** Veta Dorada (Logo) + Eslogan. Redes sociales.
*   **Columna 2 (Navegación):** Diseño 3D, Fabricación, Tienda, Especialidades.
*   **Columna 3 (Legal y Transparencia):** Dirección física de la fábrica en Bogotá.
*   **Bloque Legal Desacoplado:** *"Veta Dorada es una marca comercial. Todos los procesos de facturación, contratos y garantías son representados legalmente por HERMANOS GARCIA GONZALEZ SAS, NIT 901421357-9."*

### B. El Modal Híbrido (`VetaAgendar.tsx`)
Overlay interceptor global. Reemplaza los enlaces directos a WhatsApp.
*   **Paso 1:** ¿Qué espacio vamos a transformar?
*   **Paso 2:** ¿En qué etapa está tu proyecto? (Idea / Tengo Planos).
*   **Paso 3:** ¿Nivel de urgencia?
*   *Acción Final:* Redirección a WhatsApp con GCLID oculto.
