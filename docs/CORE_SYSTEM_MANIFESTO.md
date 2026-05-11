# 🛰️ MANIFIESTO DEL SISTEMA SOBERANO (APP)
## Paradigma de Simplicidad Radical y Agnosticidad de Entidades (Entities)

Este documento establece el modelo de pensamiento para la creación de sistemas complejos (Apps) bajo el **Framework Protocol**. Abandonamos la complejidad estructural en favor de la **Modularidad Atómica**.

---

### 1. ⚛️ El Axioma de la Entidad Universal
No existen los "usuarios", las "noticias" o los "productos". Todo es una **ENTIDAD (ENTITY)**.
- **Identidad**: Cada entidad tiene un **Slug** único (su identificador).
- **Dualidad de Estado**: La entidad existe en dos estados: **Resumen** (Vista Card) y **Expandida** (Cuerpo Completo).
- **Agnosticismo**: El sistema no juzga qué es la entidad; simplemente la proyecta.

### 2. 🏛️ El Almacén de Datos (JSON + GIT)
La base de datos no es una caja negra, es un **Data Store Transparente**.
- **Persistencia Soberana**: El JSON es la "Single Source of Truth". Si está en el JSON, existe en la base de datos.
- **Control de Versiones**: Git es el historial de cambios del sistema. Cada commit es un hito en la línea de tiempo.
- **Accesibilidad**: Cualquier herramienta puede leer el Store. No hay "puentes", solo hay "lectura".

### 3. 📡 El Constructor Universal (Entity Builder)
La interfaz de creación debe ser única y absoluta.
- **Un Solo Proyector**: Un solo "Constructor" (EntityBuilder) debe ser capaz de cristalizar cualquier tipo de clase de entidad.
- **Evolución**: Si el negocio cambia, solo se añade una "Clase" al selector. La infraestructura no se toca.

### 4. 🌊 Reactividad y Proyección
La interfaz no "pide" datos, **sincroniza** con ellos.
- **Suscripción**: Los componentes (UI Components) se suscriben al estado global. Cuando la entidad cambia en el Store, todos los componentes se actualizan en sintonía al instante.
- **Despliegue Estático**: La potencia reside en el cliente. El servidor es solo un mirror (GitHub Pages / Vercel).

### 5. 🚀 Flujo de Persistencia de Datos
1. **Creación Local**: Se crea y prueba la entidad en el entorno de desarrollo (Builder Local).
2. **Push de Cambios**: Se suben los cambios al repositorio central (Git Push).
3. **Despliegue Global**: El CDN (GitHub Pages) proyecta el nuevo estado a todo el mundo en segundos.

### 6. ⚖️ Estabilidad en la Proyección Radical (React-Imperative Bridge)
Cuando el Proyector (Engine) cristaliza lógica de negocio externa, debe seguir las **Leyes de Estabilidad** para evitar la entropía del DOM:
- **I. Soberanía del Contenedor (StableContainer)**: React es dueño del contenedor, pero el Módulo es soberano de su interior. Usamos `memo` para prohibir que React reconcilie (y borre) el trabajo del módulo.
- **II. Visibilidad Determinística**: No dependemos de clases CSS volátiles. Los estados críticos (como modales) se gestionan con estilos inline para garantizar la visibilidad absoluta en inyecciones de `innerHTML`.
- **III. Puente Reactivo (API Proxy)**: La API que recibe el módulo es un puente estable. El acceso a los datos se hace a través de un túnel (`Refs`) para que el módulo siempre vea la materia fresca sin necesidad de reiniciarse.

---

> "La complejidad es la cáscara; la simplicidad es el fruto. Indra no es un software, es la forma en que el pensamiento se convierte en arquitectura."

🛰️🚀🏛️⚖️⚛️
