## arquitectura del producto servicio
1. Smos diseñadores y fabricantes directos en bogotá, desde nuestra cotizacion ofrecemos trnasparencia detallando los presupeustos de los espacios con mateirales, accesorios y acabados, así cómo mano de obra, el cliente sabe que es lo que se le esta cobrando desde el momento 1.

2. Ofrecemos cotizaciones gratuitas, el usuario puede mandar sus especificaciones de diseño o peude agendar una visita grautita y obtener un presupuesto.
3. EL suauiro peude contratar un servicio de disñeo por espacio que tiene un valor de 100mil pesos por cada 2 espacios. reembolsable de la cotizaicon general. este servicio es opcional no es obligatorio para obtener un presupuesto, sin embargo si es un paso logico necesario antes de mandar cualqueir poryecto a producción. 
4. Ofrecemos un catalogo de diseño de autor (recibidores, centros de tv, consllas, comedores, escritorios, etc) estos se venden a precio fijo en el store de veta dorada, el cliente peude decidir si compra el producto con o sin instalacion (valor adicional fijo de instalacion segun el producto).

El objetiov de la pagina es ser un portal comercial de la empresa comunicar al mundo su existencia marca y servicios, mover el mayor trafico posible para que la empresa peuda vender sus servicios y productos a la ciudad de bogotá (verificar consumidor especifco en storage\fork_doc\DOCS VETA DORADA\COMERCIAL WEB\Analiticas y SEO) 

---


---

## 2. Estructura de Navegación mpaa de sitio (Menú Principal)

El menú principal estará presente en todas las páginas de la web publica (no confundir con paginas del ERP), diseñado con una estética limpia, tipografía premium y alta visibilidad:

```text
+-----------------------------------------------------------------------------+
| VETA DORADA [Studio]         Espacios a Medida    Colecciones    Agendar    |
+-----------------------------------------------------------------------------+
```

*   **VETA DORADA [Studio]:** Logo principal (Redirige a `/`).
*   **Espacios a Medida:** Portafolio y explicación del servicio de carpintería personalizada de alta gama (Cocinas insignia, vestidores, cavas, baños, oficinas).
*   **Colecciones:** Catálogo interactivo de piezas de diseño terminadas con precio fijo.
*   **Agendar:** Botón destacado de conversión directa (Abre el modal de filtrado y contacto).
  **Noticiario de diseño:**). Entradas personalizadas voy a sacar artiuclos sobre diseño, arte, cultura.


---

## Estrategia de Conversión: Embudo Híbrido (Formulario + WhatsApp)

### Análisis de Comportamiento del Consumidor
Las investigaciones demuestran que en el mercado latinoamericano, **WhatsApp es el canal de cierre de ventas B2C por excelencia** debido a la inmediatez y cercanía. Sin embargo, un botón directo a WhatsApp genera demasiados "leads basura" (curiosos sin intención de compra), lo que contamina los datos de Google Ads e impide optimizar las campañas para clientes de alto valor.

### La Solución: El Embudo Híbrido de Calificación
Para mantener la eficiencia de WhatsApp y al mismo tiempo alimentar el algoritmo de Google Ads con datos de alta calidad, implementaremos un sistema de 2 pasos al hacer clic en cualquier botón de "Agendar" o "Cotizar":

**Paso 1: Modal de Micro-Filtro (Overlay)**
Al hacer clic, no se abre WhatsApp inmediatamente. Se despliega un formulario minimalista flotante para cualificar al prospecto:
```text
+-----------------------------------------------------------+
|               DISEÑEMOS TU ESPACIO IDEAL                  |
|                                                           |
|  ¿Qué espacio necesitas?                                  |
|  [ ] Cocina Integral   [ ] Clóset / Vestier               |
|  [ ] Centro de TV      [ ] Oficina / Estudio              |
|  [ ] Otro                                                 |
|                                                           |
|  Estado de tu proyecto:                                   |
|  ( ) Tengo diseño y medidas (Cotizar a distancia)         |
|  ( ) Necesito que me visiten y asesoren                   |
|                                                           |
|  Tu Nombre: [_______________________]                     |
|                                                           |
|           [ CONTINUAR A WHATSAPP ]                        |
+-----------------------------------------------------------+
```

**Paso 2: Captura Técnica y Redirección Bifurcada**
Al hacer clic en "Continuar a WhatsApp", el sistema realiza dos acciones en paralelo:
1.  **Hacia el CRM (Segundo Plano):** Captura de forma invisible el identificador de clic de Google (`GCLID`), junto con el Nombre y Teléfono del formulario. Esta data se guarda en la base de datos interna (Agnostic DB) **sin** mostrarse jamás al cliente.
2.  **Hacia WhatsApp (Primer Plano):** El usuario es redirigido a la App con un mensaje amable pre-escrito (*"Hola Veta Dorada, soy [Nombre]. Necesito un [Espacio]. Actualmente [Estado del proyecto]."*). El código técnico nunca viaja por WhatsApp.

**Paso 3: Importación de Conversiones Offline (El Santo Grial del ROAS)**
Para optimizar la pauta publicitaria sin revelar los ingresos reales a Google (protegiendo tu privacidad financiera), implementaremos un modelo de **Puntuación de Calidad de Conversión (Score 1-10)**:
*   Una vez que el equipo comercial cierra una venta en el mundo físico, actualizan el estado del lead en el CRM interno.
*   El CRM le "avisa" a Google Ads devolviéndole el `GCLID` e informándole que ese usuario compró.
*   En lugar de enviar el precio en Pesos, el CRM envía un score predefinido. (Ej. Venta de repisa = 1 punto; Venta de Cocina Premium = 10 puntos).
*   *Resultado:* El algoritmo de IA de Google aprende a buscar perfiles de usuarios tipo "10" y los prioriza en las subastas, maximizando la rentabilidad sin comprometer tus finanzas.

---

---


