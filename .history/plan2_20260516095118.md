🏛️ Auditoría de Universalidad y Capacidad (Fase 1)
1. Diagnóstico de Estrategias Actuales (Vectores de Entropía)
SupabaseStrategy.ts:
Entropía: Uso de una tabla ancla estática (records). Es un cuello de botella y rompe la naturaleza relacional de SQL.
Hardcode: Nombres literarios como read / write.
Incapacidad: No tiene lógica de EVOLVE. Es un receptor pasivo, no un arquitecto.
LocalStrategy.ts:
Entropía: Inferencia implícita de carpetas. Crea directorios "por accidente" durante la escritura en lugar de por una orden explícita de arquitectura.
Nomenclatura: Mezcla de dbDir y storage, nombres que no significan nada en un protocolo universal.
2. Redefinición del Lenguaje (Estándar Query Universal)
Eliminamos los verbos literarios y adoptamos el estándar que cualquier motor de persistencia entiende:

Acción Antigua	Acción Universal (UGP)	Nivel	Descripción
read	SELECT	DML	Recuperación de registros con filtrado y ordenamiento.
write	COMMIT	DML	Persistencia atómica de registros (Insert/Upsert).
update	PATCH	DML	Modificación parcial de materia existente.
delete	PURGE	DML	Eliminación quirúrgica por criterios.
(Nuevo)	EVOLVE	DDL	Sincronización de estructura física (Crear tablas/campos) basada en el ADN.
(Nuevo)	WIPE	DDL	Borrado total de la estructura y materia del Silo.
introspect	INSPECT	Discovery	Análisis de la realidad física para generar un ADN sugerido.
3. Inyección Dinámica de Capacidades (Registry Sovereignty)
Confirmado: El Registry no será un objeto estático. Será un Orquestador de Capacidades.

Cada estrategia exportará un contrato de capacidades: readonly capabilities: AgnosticCapabilities.
Ejemplo: Si la SupabaseStrategy declara canEvolve: true, el Registry inyecta en el sistema la capacidad de "Cristalizar Base de Datos".
Si la UI (AgnosticManager) ve que la estrategia activa no tiene canWipe, el botón de "Borrado Total" desaparece del sistema. No hay código muerto, solo capacidades proyectadas.

Excelente. Vamos a despejar primero el **Punto 4**, que es el más profundo a nivel de arquitectura, y luego te presento el plan de ataque.

### 🔍 Aclaración del Punto 4: De "Inquilino" a "Arquitecto"

Actualmente, tu `SupabaseStrategy` es un **inquilino**. Envía todo (productos, clientes, esquemas) a una única tabla genérica llamada `records` y usa una columna llamada `context` para intentar separarlos. Es como tener un solo cajón enorme donde mezclas calcetines con cubiertos.

**Lo que propone el Punto 4 es:**
*   Si el ADN define un contexto llamado `inventario_muebles`, el sistema debe ordenar a Supabase crear una tabla física real llamada `inventario_muebles`.
*   Los datos de ese contexto vivirán en su propia tabla, con sus propias columnas indexadas, no mezclados en un JSONB genérico dentro de una tabla compartida.
*   **Beneficio:** Máximo rendimiento, limpieza total en la base de datos y una estructura que cualquier DBA entendería. El sistema deja de ser un "guardador de JSONs" para ser un **Diseñador de Infraestructura**.

---

### 🏛️ PLAN DE PURIFICACIÓN ARQUITECTÓNICA (Fase 0)

Este es el plan previo para atacar los vectores de entropía que detectamos:

#### 1. Definición del Contrato Maestro (`AgnosticBridge.ts`)
*   **Acción:** Crear una nueva interfaz única que sustituya a la actual `DataStrategy`.
*   **Objetivo:** Establecer los verbos universales (`SELECT`, `COMMIT`, `PATCH`, `PURGE`, `EVOLVE`, `WIPE`).
*   **Resultado:** Eliminamos la redundancia de métodos y unificamos el lenguaje en todo el servidor.

#### 2. Dinamización del Orquestador (`bridge.resolver.ts`)
*   **Acción:** Refactorizar `getStrategy.ts` para eliminar el `switch/case` hardcodeado.
*   **Objetivo:** Implementar un registro dinámico donde las estrategias se "anuncian" al sistema.
*   **Resultado:** Podrás añadir un nuevo proveedor (ej. Redis o Firebase) simplemente soltando el archivo en la carpeta, sin tocar el núcleo.

#### 3. Unificación de la Capa de Proyección (`UniversalManagerSection.tsx`)
*   **Acción:** Fusionar `VaultsSection`, `DNASection` y `SitemapSection` en un solo componente genérico de gestión.
*   **Objetivo:** Usar metadatos para decidir qué estamos gestionando (si son rutas, bovedas o esquemas).
*   **Resultado:** Eliminamos aproximadamente 500 líneas de código duplicado de UI. Un solo bug fix corregirá todas las secciones a la vez.

#### 4. Protocolo de Evolución Atómica (`EVOLVE`)
*   **Acción:** Dotar a los puentes de la capacidad de crear su propia infraestructura.
*   **Objetivo:** El comando `EVOLVE` leerá el ADN y se encargará de que la DB física (Supabase o Local) tenga la tabla y los campos necesarios.
*   **Resultado:** Sincronización perfecta entre lo que ves en la UI y lo que existe en el disco/nube.

---

### 🛡️ Próximo Paso (Solo si apruebas este enfoque)

Mi siguiente acción será presentarte el **Contrato Maestro (la Interfaz TypeScript)** que regirá todo este nuevo orden. No escribiré lógica, solo el "Contrato de Soberanía" para que lo audites.

**¿Procedemos con la definición del Contrato Maestro?**_
