# Guía de Configuración e Infraestructura de Datos (Base de Datos)

Esta guía explica en detalle cómo configurar el almacenamiento del **Agnostic System** en producción (Vercel). Está pensada tanto para desarrolladores como para perfiles no técnicos que administran el despliegue.

## 0. Paso Obligatorio: Vincular con Vercel (Integración API)

Para que el panel de administración de Agnostic System pueda escribir y guardar variables de entorno en producción de forma automática, **debes vincular el panel con la API de Vercel**. Sin este paso, las configuraciones que guardes no se guardarán en tu servidor y tendrás que copiarlas manualmente.

### 🔑 Credenciales de Vercel Requeridas:

1. **`VERCEL_ACCESS_TOKEN`**: Lo generas en tu panel de Vercel (Vercel Dashboard ➔ Settings ➔ Tokens).
2. **`VERCEL_PROJECT_ID`**: Lo obtienes de la configuración general de tu proyecto (Vercel Dashboard ➔ Tu Proyecto ➔ Settings ➔ General).
3. **`VERCEL_TEAM_ID`**: Opcional (solo si tu proyecto pertenece a un equipo u organización en Vercel, no a una cuenta personal).

*Nota:* Si estas tres variables no están en tu archivo `.env.local` (local) o en Vercel, el panel de **Deploy** te mostrará automáticamente un asistente visual paso a paso para inyectarlas.

---

## 1. Persistencia de Datos en PostgreSQL (Recomendado)

La persistencia en PostgreSQL te permite conectar tu Agnostic System a cualquier base de datos SQL estándar. Admite de forma nativa proveedores como **Neon**, **Supabase** (Postgres directo), **Railway** o **Render**.

### 🔌 La Cadena de Conexión Universal: `DATABASE_URL`

En lugar de configurar múltiples campos separados (servidor, usuario, puerto, base de datos), el estándar PostgreSQL condensa toda la información en un único texto:

```text
postgresql://usuario:contraseña@servidor.com:5432/nombre_base_de_datos?opciones
```

Al pegar este texto en el campo `DATABASE_URL` del panel **Deploy** y pulsar en guardar, el sistema se autoconfigurará automáticamente.

### 🚀 Creación Automática de Tablas (Zero-DDL)

No tienes que ejecutar scripts SQL iniciales. Cuando guardes datos por primera vez (o al pulsar "Probar conexión"), el sistema ejecutará de manera autónoma una query para crear la tabla de almacenamiento principal:

* **Nombre de la tabla:** `agnostic_records`
* **Funcionamiento:** Todos los esquemas (namespaces) y campos dinámicos que crees se almacenarán en una única columna de tipo `JSONB` de forma ultra-rápida.
* **Sin migraciones complejas:** Si agregas campos en tu panel, no tienes que hacer un refactor de la base de datos SQL; el Agnostic Engine se encarga de guardar y relacionar todo sobre el mismo esquema flexible.

### ⚡ Neon: String de Conexión Directa vs. Pooled (Serverless)

Si usas **Neon**, notarás que su panel te proporciona dos URLs:

1. **Directa (`ep-xxx...`):** Adecuada para desarrollo local en tu computador.
2. **Pooled / Serverless (`ep-xxx-pooler...`):** **Obligatoria para Vercel en producción.** En entornos Serverless como Vercel, cada petición web puede instanciar un contenedor independiente. Si usas la URL Directa, agotarás en pocos segundos el límite de conexiones concurrentes de tu base de datos. La URL Pooled utiliza *PgBouncer* en los servidores de Neon para compartir y multiplexar conexiones de forma óptima.

---

## 2. Persistencia en GitHub Strategy (Gratuita)

Ideal para proyectos personales o pequeños negocios que no requieren una base de datos activa o quieren mantener costes de infraestructura en cero.

### 📂 ¿Cómo funciona?

Los datos se guardan como archivos JSON convencionales dentro de tu propio repositorio de GitHub en la ruta:
```text
storage/db/{namespace}.json
```

Cada vez que realizas un cambio, el servidor escribe un commit a tu rama de producción utilizando la API REST de GitHub.

### 🔑 Variables requeridas

* **`GITHUB_REPO`:** En formato `usuario/nombre-del-repositorio`.
* **`GITHUB_TOKEN`:** Token de Acceso Personal de GitHub con permisos de lectura y escritura (escribir commits) en tu repositorio.

---

## 3. Persistencia en Supabase REST (Legacy)

Esta es una alternativa que conecta con el endpoint REST de Supabase (PostgREST). 

> ⚠️ **Nota:** Esta estrategia es **legacy**. Requiere que cada namespace tenga una tabla SQL física creada con DDL manual de manera previa en Supabase. Si vas a usar Supabase, te recomendamos encarecidamente utilizar la estrategia de **PostgreSQL Directo** configurando la variable `DATABASE_URL`.

---

## 4. Guía de Migración Paso a Paso (ej: GitHub ➔ PostgreSQL)

Mover tus datos de una infraestructura gratuita a una base de datos en caliente es totalmente seguro e idempotente (se puede ejecutar varias veces sin duplicar datos).

1. **Configura el destino:** Escribe la variable `DATABASE_URL` en tu panel de **Deploy** o en las variables de entorno de Vercel y guarda (no elimines `GITHUB_REPO` aún; el motor prioriza GitHub para no interrumpir el servicio).
2. **Accede al panel de migración:** Ve a la sección inferior del panel de Deploy: **"Migrar datos"**.
3. **Selecciona parámetros:** De `github` hacia `postgres`.
4. **Simular:** Pulsa el botón "Simular" para verificar cuántos registros por namespace se leerían de GitHub y se escribirían en PostgreSQL.
5. **Ejecutar:** Pulsa "Ejecutar migración". Una vez completado, los datos se habrán copiado.
6. **Desconectar:** Elimina `GITHUB_REPO` en tu Vercel Dashboard y redespliega. El sistema bajará la prioridad de lectura a `DATABASE_URL` y tu base de datos de PostgreSQL pasará a ser la principal activa.

---

## ⚠️ Obstáculos Comunes y Cómo Evitarlos

1. **Error de Límite de Conexiones (Neon Direct en Vercel):**
   * *Síntoma:* La aplicación devuelve errores `500` tras unas pocas visitas o consultas.
   * *Solución:* Asegúrate de que tu `DATABASE_URL` apunte al pooler (`-pooler` en el host o parámetro `?pgbouncer=true` activo).
2. **Prioridad de Variables no Resuelta:**
   * *Síntoma:* Has configurado PostgreSQL pero el sistema sigue leyendo de GitHub o de Local.
   * *Explicación:* El motor evalúa las variables con la prioridad: `GITHUB_REPO` ➔ `DATABASE_URL` ➔ `SUPABASE_URL` ➔ `Local`. Si `GITHUB_REPO` sigue definido en Vercel, PostgreSQL será ignorado. Elimina las variables de GitHub en tu dashboard de Vercel.
3. **Errores de Red y Timeout en Migraciones Masivas:**
   * *Síntoma:* Al migrar bases de datos grandes, la UI da error de red.
   * *Explicación:* El plan Vercel Hobby limita la ejecución de APIs a un máximo de 10 segundos. Si tienes miles de registros, la migración desde Vercel fallará por timeout.
   * *Solución:* Realiza la migración ejecutando el servidor localmente en tu computador, conectándote a las variables de producción en tu `.env.local`. En local no existe el límite de timeout de 10 segundos.
4. **Falta de Permisos SQL:**
   * *Síntoma:* Error al intentar escribir el primer registro en PostgreSQL.
   * *Explicación:* Tu usuario de base de datos no tiene permisos para realizar operaciones `CREATE TABLE` en el esquema público de Postgres.
   * *Solución:* Asegúrate de proveer la cadena de conexión del usuario administrador primario de Neon/Supabase.
