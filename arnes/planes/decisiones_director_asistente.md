# Decisiones del director de proyecto — chat del ERP (t-198 / t-199)

**Fecha:** 2026-11-26
**Contexto:** el Supervisor aprobó el proyecto completo y delegó las decisiones de ejecución. Este documento registra cada decisión tomada, por qué, y qué se puede revertir mañana. Lo que quedó fuera de esa delegación aparece al final, en §6.

---

## 1. Decisiones tomadas

| # | Decisión | Por qué | Cómo revertirla |
|---|---|---|---|
| D-01 | Trabajo en rama `feat/asistente-dev`, basada en `dev`, sin traer los commits de la rama de seguridad | La rama de seguridad cambia firmas de acciones del portal y de la publicación de propuesta. Mezclarla en el mismo despliegue impide saber qué causó un problema | Mergear la seguridad después, en una rama propia, con su revisión |
| D-02 | Protocolo de permisos del chat: tipos locales mínimos, sin depender de `lib/auth/accion.ts` | Así el chat no depende de la rama de seguridad | Cuando se mergee la seguridad, reemplazar por el protocolo completo |
| D-03 | Se quita la bandera de apagado por defecto | Lo pediste así | — |
| D-04 | Sin topes de gasto configurados, el chat no llama al modelo | Es la protección que reemplaza la bandera: evita gasto sin control | Configurar topes desde la pestaña Configuración |
| D-05 | Migración del chat: primero verificar estado de 0034–0037, luego 0038 idempotente, aplicada con script del proyecto | El journal de Drizzle termina en 0033, así que `drizzle migrate` no aplica nada de lo nuevo | Las tablas son nuevas y aditivas; se revierte con `DROP` de esos objetos |
| D-06 | Escrituras de la capa de acciones pasan por propuesta; ninguna se ejecuta directo | Principio de seguridad del plan t-198 | — |
| D-07 | Cotización completa implementada como función nueva dentro de una transacción, sin refactorizar las acciones existentes | Refactorizar las acciones del cotizador toca la interfaz en producción. Una función nueva no cambia nada de lo que ya funciona | Refactorizar después, cuando las pruebas de equivalencia existan |
| D-08 | Niveles de la capa de acciones: mapa de dominios, operaciones por dominio, ejecución | Evita 184 herramientas planas | — |
| D-09 | Dominios de la primera versión: cotización, proyecto, finanzas | Son los que pediste para el primer uso | Ampliar cuando haya operaciones aprobadas |
| D-10 | Base de conocimiento: tres documentos piloto escritos desde el código (estados, descuentos, IVA), con dueño por rol y fecha de revisión | Sin reglas escritas, el modelo inventa | Cualquier documento se puede corregir; el dueño debe revisarlo |
| D-11 | Push a `dev` solo después de: `tsc` en 0, tests en verde, `next build` que compila sin errores ajenos a la base, y migración verificada | `dev` es producción | — |
| D-12 | Prueba con clave real: queda para mañana, cuando tengas la clave en el archivo local de la rama | No puedo ni debo manejar tu clave en el chat | — |

## 2. Lo que decido no hacer hoy

- **No mergear la rama de seguridad a `dev`.** Cambia comportamiento del sitio público (borradores que dejan de verse, firmas de portal, ruta de vista previa). Requiere revisión humana, y tú mismo pediste no mezclarla con el chat.
- **No refactorizar las acciones existentes del cotizador.** Ver D-07.
- **No aplicar cambios en la base de producción sin verificar antes en la base de pruebas.** Ver D-05.

## 3. Lo que debes hacer tú (no puedo hacerlo yo)

1. **Crear la variable `ASISTENTE_CLAVE_CIFRADO` en Vercel** (32 bytes en base64). Genera el valor con `openssl rand -base64 32` y guárdalo también en un gestor de contraseñas: si se pierde, las claves guardadas no se pueden descifrar.
2. **Poner tu clave de OpenRouter** en el archivo `.env.local` de la rama de trabajo, o agregarla desde la pestaña Configuración del chat, una vez desplegado. Nunca en el chat.
3. **Definir topes de gasto** (diario por usuario y global) desde la pestaña Configuración.

## 4. Riesgos que acepto como director

- **Costo:** el chat gasta tokens reales. Los topes lo limitan, pero un valor mal configurado puede gastar más de lo esperado.
- **Modelo:** la calidad de las cotizaciones depende del modelo elegido. Verificaré con la prueba real antes de dar por bueno el resultado.
- **Conocimiento:** los documentos piloto los escribo yo desde el código. Si algo del negocio real difiere, el modelo se equivocará hasta que el dueño lo corrija.

## 5. Cómo verificar mañana

Un solo comando de prueba end-to-end, cuando la clave esté en el entorno local: pedir una cotización completa al chat, revisar la propuesta, confirmarla, y comprobar en la base de pruebas que quedaron proyecto, espacios e ítems, o que no quedó nada si algo falló.

## 6. Pendientes que requieren tu decisión (no las tomé)

- **I-1:** quién revisa los documentos de conocimiento. Propuesta: cada área, con tu aprobación de la primera versión.
- **I-2:** quién tiene permiso `cotizador:descuento`. Propuesta: admin y comercial senior.
- **I-3:** si se permite precio libre en ítems de catálogo. Propuesta: no, en esta versión.
- **Rama de seguridad:** cuándo y cómo se revisa para mergear a `dev`.
