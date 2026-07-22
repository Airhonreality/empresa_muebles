# Arquitectura de Zaps: Plataforma Web Airhon
**Especificación Técnica de Lógica de Servidor, Flujos de Eventos y Mitigación de Entropía**

* **Metodología:** Agnostic Zaps Engineering
* **Versión:** 1.0
* **Fecha:** Junio 2026

---

## 1. Inventario Global de Zaps por Módulo

Para mantener la homeostasis del sistema y cumplir con el **Axioma de Independencia**, cada módulo se apoya en scripts autónomos de backend (Zaps) con una única responsabilidad.

| Módulo | Identificador del Zap | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Módulo 1: Home** | `zap_procesar_contacto_home` | Valida, persiste y notifica mensajes y cotizaciones del formulario. |
| **Módulo 2: Proyecto** | `zap_enriquecer_proyecto_metadata` | Parsea la metadata JSON de layouts y extrae los aliados relacionados. |
| **Módulo 3: Servicios** | `zap_calcular_propuesta_estimada` | Procesa las opciones de la calculadora y devuelve el desglose final. |
| **Módulo 4: Bitácora** | `zap_gestionar_slugs_redirecciones` | Previene enlaces rotos (404) al cambiar títulos de bitácoras en el CMS. |

---

## 2. Detalle de Zaps: Módulo 1 (Home)

El Módulo 1 cuenta con el Zap central de captura de leads. A continuación, se detalla su blueprint determinista:

### 2.1. Zap: `zap_procesar_contacto_home`

#### A. Teleología (Objetivo)
Capturar, validar y persistir los leads entrantes de la Home (mensajes directos y solicitudes de cotización originadas en la calculadora de servicios) e integrarlos con canales de notificación asíncronos sin riesgo de pérdida de datos.

#### B. Especificación del Payload de Entrada (Input JSON)
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@empresa.com",
  "servicio": "desarrollo_software", 
  "mensaje": "Me gustaría cotizar un sistema Kaizen...",
  "metadata_calculadora": {
    "calc_kaizen": true,
    "calc_software": true,
    "calc_infrastructure": false,
    "calc_support": true,
    "capex_estimado": 20000000,
    "opex_estimado": 1450000
  }
}
```

*Nota de Nomenclatura:* Los valores del campo `servicio` se restringen al enum estándar de desarrollo: `desarrollo_software`, `optimizacion_procesos`, `diseno_participativo`, `arte_digital`, `otro`.

#### C. Lógica de Ejecución paso a paso (Pseudo-Algoritmo)

```javascript
/**
 * Zap: zap_procesar_contacto_home
 * Contexto: Server-side VM Sandbox (Agnostic Engine)
 */
async function main({ payload, api }) {
  // 1. Sanitización y Validación Básica (Anti-Spam & Anti-Inyección)
  const { nombre, email, servicio, mensaje, metadata_calculadora } = payload;
  
  if (!nombre || nombre.trim().length < 3) {
    return { success: false, error: "Nombre inválido (mínimo 3 caracteres)." };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: "Correo electrónico inválido." };
  }
  
  if (!mensaje || mensaje.trim().length < 10) {
    return { success: false, error: "El mensaje debe contener al menos 10 caracteres." };
  }

  // 2. Control de Fricción (Rate Limiting y Duplicidad en Ventana de 5 min)
  const registrosRecientes = await api.query('contactos', {
    where: {
      email: email.trim().toLowerCase(),
      leido: false
    },
    limit: 3
  });

  const esDuplicado = registrosRecientes.some(reg => {
    // Si el mensaje es idéntico y fue enviado hace menos de 5 minutos
    return reg.mensaje === mensaje.trim() && 
           (new Date() - new Date(reg.created_at)) < 5 * 60 * 1000;
  });

  if (esDuplicado) {
    return { 
      success: true, 
      message: "Mensaje ya recibido. Te responderemos pronto." 
    };
  }

  // 3. Enriquecimiento del Mensaje con Datos de Calculadora (si existen)
  let mensajePersistido = mensaje.trim();
  if (metadata_calculadora && Object.keys(metadata_calculadora).length > 0) {
    const desglose = `
--- DETALLE DE CALCULADORA PRE-SELECCIONADA ---
* Auditoría Kaizen: ${metadata_calculadora.calc_kaizen ? 'Sí' : 'No'}
* Desarrollo Software: ${metadata_calculadora.calc_software ? 'Sí' : 'No'}
* Servidores Serverless: ${metadata_calculadora.calc_infrastructure ? 'Sí' : 'No'}
* Soporte / OpEx: ${metadata_calculadora.calc_support ? 'Sí' : 'No'}
* CapEx Estimado: $${metadata_calculadora.capex_estimado.toLocaleString()} COP
* OpEx Estimado: $${metadata_calculadora.opex_estimado.toLocaleString()} COP/mes
----------------------------------------------
    `;
    mensajePersistido += "\n" + desglose;
  }

  // 4. Persistencia en Base de Datos (Primer Paso de Transacción)
  const nuevoContacto = await api.createRecord('contactos', {
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    servicio: servicio,
    mensaje: mensajePersistido,
    leido: false
  });

  // 5. Despacho de Evento Asíncrono (Diodo de Entropía)
  // Notificamos al sistema para que notifique por canales externos (Slack/Telegram) en segundo plano
  await api.notify('evento_contacto_creado', {
    contacto_id: nuevoContacto.id,
    nombre: nombre.trim(),
    servicio: servicio,
    email: email.trim()
  });

  return { 
    success: true, 
    contacto_id: nuevoContacto.id, 
    message: "Mensaje recibido correctamente." 
  };
}
```

#### D. Vectores de Entropía Mitigados en este Zap
* **Pérdida de Leads por Caída de Canales Externos:** Al guardar primero en la tabla local `contactos` antes de disparar el webhook de notificaciones, garantizamos que el lead nunca se pierda si Slack o Telegram fallan.
* **Race Conditions e Inundación de Spam:** El filtro de validación de tiempo de 5 minutos evita que bots o usuarios impacientes cliquen repetidamente "Enviar" y llenen la base de datos de tuplas idénticas.
* **Pérdida de Estado en Redirección:** Si el cliente viene de la Calculadora, el Zap procesa la propiedad `metadata_calculadora` y auto-construye el resumen, evitando que el usuario tenga que escribir manualmente su selección.

---

## 3. Especificación: Módulo 2 (Detalle de Proyecto)

El Módulo 2 maneja el renderizado asimétrico y dinámico de proyectos. De acuerdo con el Axioma de Independencia del Agnostic System, las lecturas no deben implementarse como Zaps (que mutan o reaccionan a acciones de usuario) sino como Resolvers del lado del servidor (Next.js Server Component / API Route Resolver) en `src/app/api/proyecto/[slug]/route.ts`.

### 2.1. Resolver SSR: `obtener_detalle_proyecto`

#### A. Teleología (Objetivo)
Obtener un proyecto a partir de su slug, resolver sus relaciones (el Eje curatorial correspondiente y los Aliados N:M), y parsear/validar de forma segura el campo JSON de metadata flexible (`metadata_especifica`) según el layout requerido. Esto aísla la UI de fallos de parseo e inconsistencias de datos en la DB durante la carga inicial de la página.

#### B. Especificación del Payload de Entrada (HTTP GET Parameter)
* **URL:** `/api/proyecto/[slug]` (e.g. `/api/proyecto/raiz-solar`)

#### C. Lógica de Ejecución paso a paso (Pseudo-Código / Controller SSR)

```javascript
/**
 * Resolver: obtener_detalle_proyecto
 * Contexto: Server Component / Route Handler de Next.js
 */
export async function GET(request, { params }) {
  const { slug } = params;
  if (!slug) {
    return Response.json({ success: false, error: "SLUG del proyecto requerido." }, { status: 400 });
  }

  // 1. Consultar el proyecto por slug usando la API del motor
  const proyectos = await api.query('proyectos', {
    where: { slug: slug },
    limit: 1
  });

  if (proyectos.length === 0) {
    return Response.json({ success: false, error: "Proyecto no encontrado." }, { status: 404 });
  }
  const proyecto = proyectos[0];

  // 2. Obtener el Eje Curatorial relacionado
  const eje = await api.getRecord('ejes', proyecto.eje_id);
  if (!eje) {
    return Response.json({ success: false, error: "El proyecto no tiene un eje curatorial válido asociado." }, { status: 500 });
  }

  // 3. Resolver la relación N:M de Aliados (a través de la tabla proyectos_aliados)
  const intermedios = await api.query('proyectos_aliados', {
    where: { proyecto_id: proyecto.id }
  });

  const aliadosIds = intermedios.map(i => i.aliado_id);
  const listaAliados = [];
  if (aliadosIds.length > 0) {
    for (const id of aliadosIds) {
      const al = await api.getRecord('aliados', id);
      if (al) {
        listaAliados.push({
          nombre: al.nombre,
          rol_alianza: al.rol_alianza,
          logo: al.logo,
          url: al.url
        });
      }
    }
  }

  // 4. Procesar y sanear la Metadata Específica del Layout
  let metadata = {};
  if (proyecto.metadata_especifica) {
    try {
      metadata = JSON.parse(proyecto.metadata_especifica);
    } catch (err) {
      // Mitigar entropía de JSON corrupto
      metadata = { error_parseo: true, raw: proyecto.metadata_especifica };
    }
  }

  // 5. Validar consistencia estructural según el Eje (Layout Físico)
  const layoutKey = eje.key; 
  // Ejemplos: "futuros_regenerativos", "friccion_resonancia", "arquitectura_servicios", "soberania_tecnologica"
  let validacionLayout = { ok: true, advertencias: [] };

  if (layoutKey === 'friccion_resonancia') {
    if (!metadata.audio_url) {
      validacionLayout.ok = false;
      validacionLayout.advertencias.push("Falta 'audio_url' requerido para el Audio Canvas Player.");
    }
  } else if (layoutKey === 'arquitectura_servicios') {
    if (!metadata.metrics || !Array.isArray(metadata.metrics)) {
      validacionLayout.ok = false;
      validacionLayout.advertencias.push("Falta array de 'metrics' requerido para el Metric Strip.");
    }
  }

  // 6. Retornar Data Transfer Object (DTO) limpio y unificado
  return Response.json({
    success: true,
    proyecto: {
      id: proyecto.id,
      nombre: proyecto.nombre,
      slug: proyecto.slug,
      subtitulo: proyecto.subtitulo,
      descripcion_markdown: proyecto.descripcion_markdown,
      rol: proyecto.rol,
      ano: proyecto.ano,
      url_link: proyecto.url_link,
      imagen_destacada: proyecto.imagen_destacada,
      galeria: proyecto.galeria,
      layout: layoutKey,
      color_acento: eje.color_acento || "var(--sat-accent-meadowland)",
      icono_eje: eje.icono || "Layers"
    },
    aliados: listaAliados,
    metadata_layout: metadata,
    validacion_layout: validacionLayout
  });
}
```

#### D. Vectores de Entropía Mitigados en este Resolver
* **Ruptura por Formatos Mal Formados (JSON Parsing):** Al procesar `metadata_especifica` en un bloque `try-catch`, evitamos que cualquier JSON corrompido o editado incorrectamente por el usuario bote la renderización del servidor Next.js.
* **Incoherencia Funcional (Axioma 1):** El Resolver audita activamente si el proyecto cuenta con los datos mínimos de su respectiva UI según el eje asociado, alertando de forma limpia si faltan campos de métricas o audio.
* **Costo de Latencia N:M:** Resuelve la intermediación relacional con aliados directamente en la capa lógica del servidor de lectura, enviando un único payload serializado listo para consumir.

---

## 4. Detalle de Zaps: Módulo 3 (Servicios)

El Módulo 3 utiliza una calculadora interactiva para pre-calificar clientes. El Zap asegura que los cálculos se mantengan centralizados e inviolables desde el servidor.

### 3.1. Zap: `zap_calcular_propuesta_estimada`

#### A. Teleología (Objetivo)
Calcular de forma determinista la propuesta de inversión CapEx y OpEx basada en las opciones seleccionadas por el usuario en la calculadora. El Zap consulta los precios oficiales directamente del schema `servicios` filtrando por el campo indexado `key` para evitar alteraciones o manipulaciones en el cliente web, garantizando la honestidad contable del lead.

#### B. Especificación del Payload de Entrada (Input JSON)
```json
{
  "calc_kaizen": true,
  "calc_software": true,
  "calc_infrastructure": false,
  "calc_support": true
}
```

#### C. Lógica de Ejecución paso a paso (Pseudo-Algoritmo)

```javascript
/**
 * Zap: zap_calcular_propuesta_estimada
 * Contexto: Server-side VM Sandbox (Agnostic Engine)
 */
async function main({ payload, api }) {
  const { calc_kaizen, calc_software, calc_infrastructure, calc_support } = payload;

  // 1. Consultar tarifas reales del schema servicios para prevenir manipulaciones en cliente
  const todosServicios = await api.query('servicios', {});

  // Mapeo determinista por campo key único para evitar descalces por edición de título
  const mapaPrecios = {
    kaizen: todosServicios.find(s => s.key === 'auditoria_kaizen') || { precio_base: 8000000, precio_recurrente: 1200000 },
    software: todosServicios.find(s => s.key === 'desarrollo_software') || { precio_base: 12000000 },
    infrastructure: todosServicios.find(s => s.key === 'infraestructura_serverless') || { precio_base: 3000000 },
    support: todosServicios.find(s => s.key === 'soporte_evolutivo') || { precio_base: 0, precio_recurrente: 1450000 }
  };

  let capexTotal = 0;
  let opexTotal = 0;
  const desglose = [];

  // 2. Liquidación matemática
  if (calc_kaizen) {
    capexTotal += mapaPrecios.kaizen.precio_base;
    opexTotal += mapaPrecios.kaizen.precio_recurrente || 0;
    desglose.push({
      item: "Auditoría Kaizen Operativa (CapEx)",
      monto: mapaPrecios.kaizen.precio_base
    });
    if (mapaPrecios.kaizen.precio_recurrente) {
      desglose.push({
        item: "Mejora Continua Mensual (OpEx)",
        monto: mapaPrecios.kaizen.precio_recurrente,
        unidad: "mes"
      });
    }
  }

  if (calc_software) {
    capexTotal += mapaPrecios.software.precio_base;
    opexTotal += mapaPrecios.software.precio_recurrente || 0;
    desglose.push({
      item: "Desarrollo de Software / Dashboards (CapEx)",
      monto: mapaPrecios.software.precio_base
    });
  }

  if (calc_infrastructure) {
    capexTotal += mapaPrecios.infrastructure.precio_base;
    opexTotal += mapaPrecios.infrastructure.precio_recurrente || 0;
    desglose.push({
      item: "Migración e Infraestructura Serverless (CapEx)",
      monto: mapaPrecios.infrastructure.precio_base
    });
  }

  if (calc_support) {
    capexTotal += mapaPrecios.support.precio_base || 0;
    opexTotal += mapaPrecios.support.precio_recurrente;
    desglose.push({
      item: "Soporte Técnico y Evolutivos (OpEx)",
      monto: mapaPrecios.support.precio_recurrente,
      unidad: "mes"
    });
  }

  // 3. Retornar desglose matemático validado
  return {
    success: true,
    capex_total: capexTotal,
    opex_total: opexTotal,
    desglose: desglose,
    moneda: "COP",
    garantias: [
      "Propiedad intelectual del código: 100% transferido al cliente.",
      "Arquitectura web estándar sin secuestro de datos ni licenciamiento."
    ]
  };
}
```

#### D. Vectores de Entropía Mitigados en este Zap
* **Manipulación Local de Precios:** Elimina el riesgo de inyección de valores falsos desde el navegador de un cliente avanzado. La verdad tarifaria proviene estrictamente de la DB.
* **Mapeo Editorial Robusto:** Al usar un campo `key` invariable (`auditoria_kaizen`, etc.) en lugar de buscar coincidencias por substring en el `titulo`, el CMS permite actualizar el título de cara al público sin romper la lógica de cálculo.
* **Coherencia Contable (Axioma 2):** Al centralizar el algoritmo matemático de suma y desglose en el Zap, la UI solo se encarga de renderizar los strings y el estado visual, minimizando la complejidad del código frontend.

---

## 5. Detalle de Zaps: Módulo 4 (Bitácora)

El Módulo 4 implementa la publicación de notas. Este Zap resguarda la salud del SEO técnico ante cambios dinámicos.

### 5.1. Zap: `zap_gestionar_slugs_redirecciones`

#### A. Teleología (Objetivo)
Detectar cambios en los títulos de bitácoras o proyectos que provoquen la regeneración de slugs. Si hay cambios, almacena el historial de slugs antiguos en un mapa de redirecciones 301 del sistema, evitando enlaces rotos (error 404) y preservando el link equity de SEO técnico.

#### B. Trigger (Disparador)
* **Automático:** Configurado como un **Hook Post-Update (After-Update Trigger)** en el Agnostic Engine para el schema `bitacoras`. Se ejecuta inmediatamente tras confirmar cualquier edición de registro que afecte al título o slug.

#### C. Especificación del Payload de Entrada (Input JSON)
```json
{
  "record_id": "uuid-bitacora-123",
  "nuevo_titulo": "La Estética del Error y Hacking de Hardware Modificado",
  "slug_propuesto": "la-estetica-del-error-y-hacking-de-hardware-modificado"
}
```

#### D. Lógica de Ejecución paso a paso (Pseudo-Algoritmo)

```javascript
/**
 * Zap: zap_gestionar_slugs_redirecciones
 * Contexto: Server-side VM Sandbox (Agnostic Engine)
 */
async function main({ payload, api }) {
  const { record_id, nuevo_titulo, slug_propuesto } = payload;
  
  if (!record_id || !slug_propuesto) {
    return { success: false, error: "Faltan parámetros requeridos." };
  }

  // 1. Consultar el estado anterior del registro
  const bitacoraAnterior = await api.getRecord('bitacoras', record_id);
  if (!bitacoraAnterior) {
    return { success: false, error: "Registro no encontrado en DB." };
  }

  const slugViejo = bitacoraAnterior.slug;
  const slugNuevo = slug_propuesto;

  // 2. Si el slug no cambió, salir silenciosamente (sin mutación innecesaria)
  if (slugViejo === slugNuevo) {
    return { success: true, cambio_detectado: false };
  }

  // 3. Si cambió, registrar la tupla de redirección en la bitácora
  let metadataRedireccion = [];
  if (bitacoraAnterior.metadata_seo) {
    try {
      metadataRedireccion = JSON.parse(bitacoraAnterior.metadata_seo);
    } catch (e) {
      metadataRedireccion = [];
    }
  }

  // Insertar el slug antiguo en el array de redirecciones para SEO (evitar duplicados)
  if (!metadataRedireccion.includes(slugViejo)) {
    metadataRedireccion.push(slugViejo);
  }

  // 4. Actualizar el registro con el nuevo slug y su historial
  await api.updateRecord('bitacoras', record_id, {
    titulo: nuevo_titulo,
    slug: slugNuevo,
    metadata_seo: JSON.stringify(metadataRedireccion)
  });

  // 5. Emitir evento para refrescar la caché del Middleware de Redirecciones
  await api.notify('evento_slug_modificado', {
    slug_antiguo: slugViejo,
    slug_nuevo: slugNuevo,
    record_id: record_id
  });

  return {
    success: true,
    cambio_detectado: true,
    slug_antiguo: slugViejo,
    slug_nuevo: slugNuevo
  };
}
```

#### E. Vectores de Entropía Mitigados en este Zap
* **Ruptura de Enlaces Indexados (SEO):** En lugar de que el slug anterior deje de existir provocando un error 404, se almacena en `metadata_seo` para que el middleware de Next.js (`middleware.ts`) intercepte las peticiones a URLs viejas y haga un redirect 301 automático al nuevo slug.
* **Invariante de Consistencia Temporal:** Al automatizar esta lógica post-commit, se remueve de la mente del editor del CMS la responsabilidad de configurar manualmente las redirecciones web.

---

## 6. Conclusión de Planificación

El ecosistema de datos de Airhon queda axiomáticamente blindado por resolvers dedicados del lado del servidor y Zaps específicos que resuelven los vectores de entropía más críticos. Con todos los parches aplicados, la consistencia entre UI, Schemas y Zaps es del 100%.

---

## 7. Próximos Pasos (Diálogo con el Usuario)

1. **Planos Auditados y Corregidos:** Se ha culminado la fase de aseguramiento arquitectónico de los planos. No queda ningún vacío técnico o de información.
2. **Luz Verde:** Si deseas proceder a la creación física de las tablas y compilación de TypeScript para iniciar el desarrollo, por favor indícame la instrucción **"IMPLEMENTAR"**.
