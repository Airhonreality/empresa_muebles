# F-09C — Landing Especializada: Cocinas Integrales

**Fecha:** 2026-08-19 · **Estado:** aprobado · **Ruta:** `/espacios/cocinas-integrales-bogota` · **Arquetipo:** Creador Experto

*Nota de Arquitectura:* A diferencia de las otras 5 landings (F-09 genéricas), la página de cocinas concentra la mayoría de las conversiones de Google Ads. Por ende, rompe el molde estándar para inyectar "Overrides de Alta Conversión" extraídos por ingeniería inversa del sitio legacy.

---

## 1. El Gancho Visual y Emocional (Hero)
El cliente que remodela una cocina no teme al diseño, teme al contratista incumplido. El Hero no vende muebles, vende *tranquilidad*, soportado por un diseño editorial de alto contraste.

| Elemento | Copy / Directiva | Justificación (Ingeniería Inversa) |
|---|---|---|
| H1 (Oculto o Subtítulo SEO) | Cocinas integrales a medida | Necesario para SEO. |
| **Headline Principal** | **Nuestros clientes no solo estrenan cocina, estrenan tranquilidad.** | Ataca el JTBD principal: el estrés de la obra. |
| CTA Primario | Quiero cotizar | Directo al punto (botón dorado). Redirige a F-12. |
| Diseño Visual (Stop) | Tipografía Serif (ej. Playfair/Ogg) gigante (`text-5xl` o superior). Contraste abrupto: texto sobre fondo pastel/crema que rompe contra imágenes oscuras/madera. | Rompe la ceguera de banner. Grita "Revista de diseño editorial", no "Ferretería". |

---

## 2. Embudo Acelerado (Fast-Track)
Para el cliente que ya tiene planos (constructor, remodelador avanzado), eliminamos la fricción de la asesoría general.

| Elemento | Copy / Directiva | Justificación |
|---|---|---|
| Headline | ¿Ya tienes medidas? | Capta al usuario avanzado de inmediato. |
| Texto | Recibe una cotización sin costo enviando las dimensiones de tu cocina. | Propuesta de valor clara y directa. |
| CTA | Envía medidas | Botón oscuro de alto contraste. |
| Enrutamiento | Dirige a `/agendar?intencion=cotizar-plano` | Se salta las preguntas largas del F-12 y pide subir el plano directo. |
| Enlace auxiliar | *¿No sabes cómo? Aprende cómo tomar tus medidas aquí* | Dirige a la Bitácora (F-15). Retiene al usuario que dudó o no tiene experiencia midiendo. |

---

## 3. Módulo Educativo de Materiales ("Dog Whistle" SEO)
Módulo exclusivo de esta landing. Educa al usuario y justifica el ticket premium. No existe en el molde F-09 genérico.

| Sección | Contenido Específico | Justificación / Keywords de Autoridad |
|---|---|---|
| Fachadas | Mencionar explícitamente **Madecor RH** (Resistente a la Humedad) y Poliuretano. | En Bogotá, "RH" es el filtro entre cocina barata que se sopla y cocina premium. Si no lo decimos, asumen que es aglomerado estándar. |
| Funciones | Mencionar **Herrajes Europeos** (brazos neumáticos, rieles pesados) e iluminación con sensor. | Transmite calidad táctil y funcionalidad superior. Justifica precio. |
| Mesones | Diferenciar entre Granito, Quarztone y **Piedra Sinterizada**. | Muestra dominio técnico de las opciones más duraderas del mercado. |

---

## 4. Validación Técnica y Prueba Social
La empresa no es fantasma. Se demuestra el "cómo" con fotos de la operación real.

| Card | Foto real requerida (del legacy) | Texto |
|---|---|---|
| 1. Modelado 3D | Foto de la diseñadora trabajando en monitor doble con el software 3D. | Visualizas tu proyecto antes de que empiece, asegurando una ejecución sin sorpresas. Ves exactamente cómo quedará en 3D antes de cortar la primera pieza. |
| 2. Fábrica Directa | Foto de cliente y asesora revisando un herraje extraíble en físico en el showroom. | Te guiamos en cada paso: distribución, materiales y diseño funcional. Sin intermediarios, fabricamos en nuestro propio taller para cuidar cada eslabón. |
| 3. Garantía | Foto de cocina real instalada (con el gato caminando). | Aseguramos la calidad y durabilidad de cada proyecto, respaldados por nuestra experiencia técnica y un equipo de diseñadores industriales a tu lado. |

---

## 5. El Cierre (Anclaje de Valor)
El último botón antes del footer.

| Elemento | Copy | Justificación |
|---|---|---|
| Headline | ¿Listo para comenzar tu proyecto? | Cierre persuasivo estándar. |
| **Anclaje de Valor** | **Visita y cotización sin costo. Diseño 3D opcional.** | **CORREGIDO.** No se puede prometer 3D gratis. El 3D cuesta $130k (paramétrico) y es deducible. Ofrecer la visita gratis y el 3D como addon pago. |
| CTA | Agendar ahora | Redirige al F-12 (Embudo híbrido) estándar. |

---

## 6. Galería Dinámica (Integración ERP)
*Bandera Roja corregida: No podemos perder la conexión con el Portafolio.*
Después del módulo de materiales, se inyecta el componente que trae las fotos reales de proyectos.

| Elemento | Fuente | Justificación |
|---|---|---|
| Grid de imágenes | `obtenerGaleriaEspacioAction('cocinas-integrales')` (ERP) | Mantiene la landing viva y actualizada con los últimos proyectos del ERP sin tocar código. Prueba visual irrefutable. |

---

## 7. Respuestas Atómicas (SEO de Cola Larga)
Preguntas frecuentes visibles en el DOM para capturar tráfico informativo. (Ajustadas con las keywords de materiales).

| # | Pregunta (H2) | Respuesta (40-60 palabras) |
|---|---|---|
| RA-1 | ¿Cuánto cuesta una cocina integral a la medida en Bogotá? | El precio depende del tamaño, los materiales y los acabados. Una cocina en Madecor RH parte de $X, mientras que acabados en poliuretano o piedra sinterizada ajustan el valor. Agenda una visita para un presupuesto exacto. |
| RA-2 | ¿Qué materiales usan para las cocinas integrales? | Usamos interiores en Madecor RH (Resistente a la Humedad) para garantizar durabilidad. Para fachadas ofrecemos poliuretano o madera maciza, y mesones en Quarztone o Piedra Sinterizada. |

---

## 8. Metadatos SEO y JSON-LD
- `<title>`: Cocinas Integrales en Bogotá | Diseño a Medida
- `meta description`: Cocinas integrales a medida en Bogotá. Nuestros clientes estrenan cocina y tranquilidad. Materiales de primera, Madecor RH y acabados personalizados.
- Tipo Schema: `Service` con `areaServed` Bogotá.
