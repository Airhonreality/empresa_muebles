# Diseño t-198 — Interfaz del asistente (modal global del ERP)

**Complementa a:** `arnes/planes/plan_t-198_asistente_erp.md` (piezas 1–7). Este documento reemplaza la pieza 7 y agrega configuración, proveedores y adjuntos.
**Estado:** borrador para aprobación del Supervisor. Las decisiones de §10 se toman antes de implementar.

---

## 1. Principios

1. **Un solo lugar.** Todo el asistente vive en un modal. Ningún otro lugar del ERP tiene pantallas de configuración del chat.
2. **Disponible en cada pantalla.** Un botón flotante abajo a la derecha y el atajo `Ctrl+/` (Cmd+/ en Mac) abren el modal sin perder la página.
3. **Las claves nunca regresan al navegador.** Se escriben una vez; después solo se ven como `••••1a2b`.
4. **Configurable desde el modal, pero solo lo que el rol permite.** Un empleado sin permiso de configuración no ve la pestaña.
5. **Transparencia de costo y de fallos.** Siempre se ve cuánto se gastó hoy y qué clave está activa.

---

## 2. Disparadores

| Elemento | Dónde | Comportamiento |
|---|---|---|
| Botón flotante | Esquina inferior derecha, en todas las páginas de `/erp/**` | Abre el modal. Muestra un punto si hay una propuesta pendiente de confirmación |
| Atajo | `Ctrl+/` / `Cmd+/` | Abre o cierra el modal. Si el foco está en un campo de texto, no interfiere |
| Botón en la barra superior | Opcional, junto a notificaciones | Mismo comportamiento |

El modal se monta **una sola vez** en `app/erp/layout.tsx`, dentro de un proveedor de estado. Así conserva la conversación al navegar entre pantallas.

---

## 3. Estructura del modal

### 3.1 Escritorio (ancho ≥ 1024 px)

```
┌───────────────────────────────────────────────────────────────────────────┐
│ Asistente                                  Hoy: $ 2,14 de $ 10,00  ●  ✕   │
├──────────────┬────────────────────────────────────────────────────────────┤
│ [+ Nueva]    │ Conversación: "Cotización Juan Pérez"        ⋯ (renombrar, │
│              │                                                  borrar)  │
│ Hoy          │ ───────────────────────────────────────────────────────── │
│ ▸ Cotizacion │                                                            │
│   Juan Pérez │  Tú · 10:42                                                │
│ ▸ Caja nov   │  ┌──────────────────────────────────────────────┐          │
│              │  │ ¿Cuánto llevo cotizado este mes?            │          │
│ Ayer         │  └──────────────────────────────────────────────┘          │
│ ▸ Garantía   │                                                            │
│              │  Asistente · 10:42                                         │
│              │  Usé `cotizacion_buscar` y `proyecto_consultar`.           │
│              │  ┌ Herramientas usadas ─────────────────────────┐          │
│              │  │ ✓ cotizacion_buscar (12 resultados)          │          │
│              │  │ ✓ proyecto_consultar (ver detalle)          │          │
│              │  └──────────────────────────────────────────────┘          │
│              │  Llevas $ 48.200.000 en cotizaciones este mes.            │
│              │                                                            │
│              │  ┌ Propuesta pendiente ─────────────────────────┐          │
│              │  │ Crear movimiento: ingreso $ 500.000 caja Bancolombia│   │
│              │  │ [Confirmar]  [Cancelar]        vence en 47 h │          │
│              │  └──────────────────────────────────────────────┘          │
├──────────────┴────────────────────────────────────────────────────────────┤
│ [📎] [ Escribe tu mensaje...                              ] [Enviar ▶]    │
│ Modelo: openrouter/… ▾   Herramientas: 3 activas   Pantalla: Cotización ☑ │
└───────────────────────────────────────────────────────────────────────────┘
```

Pestañas superiores del modal: **Chat** (vista anterior), **Configuración** (§5). El historial está siempre a la izquierda en escritorio.

### 3.2 Móvil (< 768 px)

- El modal ocupa la pantalla completa.
- El historial se abre como cajón desde la izquierda (botón ☰).
- Caja de entrada fija abajo, con el botón de adjuntos a la izquierda.

---

## 4. Ventana de chat

### 4.1 Mensajes
- **Usuario:** burbuja a la derecha, texto plano con saltos de línea. Puede incluir adjuntos (§6).
- **Asistente:** burbuja a la izquierda, markdown (tablas, listas, código). Se muestra el texto mientras llega (streaming).
- **Bloque "Herramientas usadas":** colapsable. Muestra cada herramienta, su resultado resumido y su duración. Al expandir, muestra la entrada y el resultado truncado. Nunca muestra claves ni datos fuera del permiso del usuario.
- **Propuesta:** tarjeta con resumen legible, botones Confirmar y Cancelar, y tiempo restante. Después de resolverla, la tarjeta queda con estado `Ejecutada` o `Cancelada`, sin botones.
- **Error:** tarjeta roja con mensaje claro y botón "Reintentar". Si el error viene de una clave, dice cuál y qué pasó (§5.2).

### 4.2 Caja de entrada
- Área de texto que crece hasta 6 líneas.
- `Enter` envía; `Shift+Enter` agrega salto de línea.
- Botón 📎 para adjuntos; arrastrar y soltar sobre la ventana también funciona.
- Botón **Detener** mientras el asistente responde.
- Contador de caracteres visible cerca del límite (4.000).
- Si se pega una imagen, se adjunta.

### 4.3 Estados
- **Vacío:** tres sugerencias de ejemplo según el permiso del usuario ("busca una cotización", "saldo de caja").
- **Cargando:** indicador en el mensaje del asistente, con botón Detener.
- **Sin configuración:** banner "Agrega una clave de proveedor en Configuración para empezar", con enlace a la pestaña.
- **Sin cuota (todas las claves agotadas):** banner con la hora estimada de reactivación.

### 4.4 Contexto de pantalla
Casilla "Pantalla" en la barra inferior. Si está marcada, el servidor recibe el tipo de pantalla y el identificador de la entidad abierta (por ejemplo, la cotización `COT-2026-11-25-01`), para que el asistente entienda "esta cotización". Se apaga por defecto en pantallas sensibles (finanzas) y el usuario puede desactivarla en cualquier momento.

---

## 5. Pestaña Configuración

Visible solo con el permiso `asistente:configurar` (propuesto para `admin`, ver D7). Los demás usuarios ven el selector de modelo de solo lectura.

### 5.1 Proveedores y claves

```
┌ Proveedores ────────────────────────────────────────────────────────────┐
│ OpenRouter                                                              │
│  #  Etiqueta        Clave        Estado                        Acción   │
│  1  Principal       ••••7f3e     ● Activa                      ⋮        │
│  2  Respaldo        ••••a91c     ◐ Sin cuota hasta 18:00        ⋮        │
│  3  Cuenta nueva    ••••0d42     ✕ Inválida (401)              ⋮        │
│                                                                          │
│ [+ Agregar clave]     Orden de uso: arrastrar para reordenar            │
│                                                                          │
│ Anthropic      (no configurado)                    [Configurar]        │
│ Google         (no configurado)                    [Configurar]        │
└──────────────────────────────────────────────────────────────────────────┘
```

**Agregar clave** abre un campo tipo contraseña. Al guardar, el servidor cifra la clave y la muestra solo con los últimos 4 caracteres. No hay forma de volver a ver la clave completa desde la interfaz; para cambiarla se borra y se agrega otra.

**Acciones por clave (⋮):** probar (hace una llamada mínima y muestra el resultado), desactivar, eliminar, mover arriba/abajo.

**Estados de clave:**
- `● Activa`: se usa en la siguiente llamada.
- `◐ Enfriada hasta HH:MM`: recibió error de cuota; se salta hasta esa hora.
- `✕ Inválida`: el proveedor rechazó la clave (401). Requiere reemplazarla.
- `⏸ Desactivada`: la desactivó el usuario.

### 5.2 Rotación automática de claves
Reglas del servidor (van en la pieza 4 del plan):
1. Se intenta la primera clave activa en orden.
2. Error de cuota o límite de tasa → la clave pasa a `Enfriada` durante el tiempo que indique el proveedor, o 60 minutos por defecto. Se intenta la siguiente.
3. Error 401 → la clave pasa a `Inválida`. Se intenta la siguiente y se notifica al administrador.
4. Errores de red o 5xx → reintento con espera corta (2 intentos) en la misma clave antes de cambiar.
5. Si todas las claves fallan → error al usuario con la hora estimada de reactivación.
6. Cada cambio de clave queda en el registro de llamadas, sin mostrar la clave.

> Los códigos exactos de error de cada proveedor deben verificarse en su documentación antes de implementar. No se asumen.

### 5.3 Modelo y parámetros

```
┌ Modelo ─────────────────────────────────────────────────────────────────┐
│ Proveedor    OpenRouter ▾                                                │
│ Modelo       [ buscar modelo...                              ▾ ]        │
│   Precio de referencia: $ X / 1M tokens entrada · $ Y / 1M salida       │
│   Soporta adjuntos de imagen: sí / no                                    │
│   Soporta herramientas: sí / no                                          │
│                                                                          │
│ Temperatura           [──────●────]  0.2                                 │
│ Máximo de respuesta   [ 2048 ] tokens                                    │
│ Pasos máximos por petición  [ 8 ]                                        │
│                                                                          │
│ Tope de gasto diario por usuario   [ $ 5,00 ]                            │
│ Tope de gasto diario global        [ $ 50,00 ]     Alerta al 80%         │
│                                                                          │
│ Herramientas habilitadas (además de los permisos del usuario)           │
│  ☑ cotizacion_buscar   ☑ proyecto_consultar   ☐ movimiento_registrar     │
│                                                                          │
│ Instrucciones adicionales (opcional, máx. 1.000 caracteres)              │
│ [ ........................................................ ]             │
│                                                                          │
│                                        [Restablecer]  [Guardar cambios] │
└──────────────────────────────────────────────────────────────────────────┘
```

**Notas de diseño:**
- El precio de referencia y las capacidades (imagen, herramientas) vienen del proveedor en tiempo real. Si el proveedor no las informa, se muestra "desconocido" y no se habilita el adjunto de imagen.
- "Herramientas habilitadas" solo puede **reducir** lo que el permiso permite, nunca ampliarlo.
- "Instrucciones adicionales" se agregan al texto fijo del sistema. Nunca reemplazan las reglas de seguridad.
- Los topes de gasto se verifican antes de cada llamada. Si se superan, el asistente lo dice y no llama al modelo.

---

## 6. Historial de conversaciones

- **Lista** agrupada por fecha (Hoy, Ayer, esta semana, más antiguas).
- **Búsqueda** por texto del título y del contenido de los mensajes.
- **Renombrar** y **borrar**. El borrado es lógico durante 30 días y después se elimina de forma definitiva. Borrar una conversación no deshace acciones ya ejecutadas.
- **Límite:** 200 conversaciones por usuario. Las más antiguas se archivan automáticamente, nunca se borran sin aviso.
- Cada usuario ve solo sus conversaciones. Esto se verifica en el servidor, no solo en la interfaz.

---

## 7. Adjuntos

| Tipo | Permitido | Límite | Tratamiento |
|---|---|---|---|
| Imagen (png, jpg, webp) | Sí, si el modelo lo soporta | 5 MB, máx. 4 por mensaje | Se envía al modelo; se guarda en R2 privado |
| PDF | Sí | 10 MB, máx. 2 por mensaje | Se extrae el texto en el servidor; se guarda en R2 privado |
| Texto y CSV | Sí | 1 MB | Se incluye como texto entre delimitadores |
| Ejecutables, comprimidos, otros | No | — | Rechazado en el cliente y en el servidor |

**Reglas:**
- Validación de tipo por contenido real (no solo por extensión) en el servidor.
- Los archivos viven en R2 bajo una clave privada. Se sirven con URL firmada de corta duración, nunca pública.
- El contenido de un adjunto es **dato, no instrucción**. Si un PDF dice "ignora tus reglas", el asistente no lo obedece. Esto se refleja en el texto fijo del sistema y en un test.
- Un adjunto ligado a un mensaje se borra junto con la conversación.

---

## 8. Componentes

```
components/asistente/
  AsistenteProvider.tsx      estado global, atajo de teclado, montaje en layout
  BotonAsistente.tsx         botón flotante con indicador de propuesta pendiente
  ModalAsistente.tsx         contenedor, pestañas, responsive
  ListaConversaciones.tsx    historial con búsqueda, renombrar, borrar
  VentanaChat.tsx            mensajes y estados
  Mensaje.tsx                burbuja, markdown, bloque de herramientas
  TarjetaPropuesta.tsx       confirmar / cancelar / estados
  CajaEntrada.tsx            texto, adjuntos, arrastrar y soltar, detener
  Adjunto.tsx                chip con nombre, tamaño, quitar
  PanelConfiguracion.tsx     pestañas internas de la configuración
  ClavesProveedor.tsx        lista de claves, orden, estados, probar
  SelectorModelo.tsx         búsqueda de modelo y capacidades
  ParametrosModelo.tsx       temperatura, tokens, pasos, topes
  ResumenGasto.tsx           gasto del día en la cabecera
```

Los componentes usan las primitivas de diseño ya existentes en `components/veta/`. **Antes de implementar hay que revisar esas primitivas**; no se crean estilos nuevos si ya hay uno equivalente.

---

## 9. Cambios en el plan de datos (bloque A)

Tablas nuevas, además de las del plan original:

- **`proveedores_asistente`**: id, proveedor (enum), etiqueta, clave_cifrada (texto), clave_ultimos4, orden (int), estado (activa | enfriada | invalida | desactivada), enfriada_hasta (timestamp nullable), creada_en, actualizada_en. **Nunca** se guarda la clave en texto plano.
- **`configuracion_asistente`**: clave (texto, única), valor (jsonb), actualizada_por, actualizada_en. Guarda modelo, temperatura, topes, instrucciones y herramientas habilitadas.
- **`adjuntos_asistente`**: id, mensaje_id, r2_clave, nombre, tipo_mime, tamano_bytes, creado_en.
- **Ampliar `llamadas_herramienta_asistente`** con: proveedor_clave_id (sin la clave), modelo, tokens_entrada, tokens_salida, costo_estimado, para que el tope de gasto se calcule desde la base.

**Cifrado de claves:** AES-256-GCM con una clave maestra que vive solo en una variable de entorno del servidor (`ASISTENTE_CLAVE_CIFRADO`). Si falta, el arranque falla. La clave maestra nunca se guarda en la base ni en el repositorio.

---

## 10. Decisiones que necesito de ti

| # | Decisión | Mi recomendación | Consecuencia si cambias |
|---|---|---|---|
| D7 | Quién configura claves y parámetros | Solo `admin` (permiso `asistente:configurar`). Todos los empleados pueden **usar** el chat | Si cada empleado trae su propia clave, cambia el modelo de datos a claves por usuario |
| D8 | Claves globales o por usuario | Globales (una pila de claves para toda la empresa) | Con claves por usuario, el tope de gasto también es por usuario |
| D9 | Atajo de teclado | `Ctrl+/` | Si choca con algo del navegador en tu equipo, lo cambiamos |
| D10 | Adjuntos | Imagen, PDF, texto y CSV; los tamaños de §7 | Quitar imágenes evita un costo de tokens alto, pero limita análisis de fotos de obra |
| D11 | Retención del historial | 30 días de papelera, luego borrado definitivo | Ajustable; afecta cumplimiento de datos personales |
| D12 | Pantallas sensibles | Contexto de pantalla apagado por defecto en finanzas | Si lo activas, el asistente ve montos al abrir esas pantallas |

---

## 11. Criterios de aceptación de la interfaz

- Abrir el modal desde cualquier página de `/erp/**` con el botón y con `Ctrl+/`, sin perder la página.
- Enviar un mensaje, ver el streaming y poder detenerlo.
- Adjuntar una imagen con un modelo que sí la soporta; con uno que no, el botón se deshabilita y explica por qué.
- Una clave agregada no vuelve a aparecer completa en ninguna respuesta, ni en el DOM, ni en los logs (test con búsqueda de la cadena).
- Un empleado sin `asistente:configurar` no ve la pestaña Configuración ni por URL directa (la acción rechaza).
- Cuando la clave activa responde con cuota agotada, el chat sigue funcionando con la siguiente y la tarjeta de la clave cambia de estado.
- Dos usuarios distintos no ven las conversaciones del otro (test en servidor).
- Probado en escritorio y en móvil (dos anchos de referencia), con teclado y lector de pantalla en lo básico: foco visible, botones con etiqueta, modal que atrapa el foco.

---

## 12. Fuera de alcance de esta versión

- Varios usuarios editando la misma conversación.
- Voz.
- Exportar conversaciones a PDF.
- Proveedores distintos de OpenRouter, Anthropic y Google.
