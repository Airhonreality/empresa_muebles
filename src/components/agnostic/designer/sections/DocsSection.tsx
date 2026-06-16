'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Database, Github, RefreshCw, Shield, Info, Cloud, 
  BookOpen, Terminal, AlertCircle, CheckCircle2, ChevronRight, Rocket 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

// ─── CONNECTION STRING TESTER ───────────────────────────────────────────────

interface ParsedString {
  ok: boolean;
  message?: string;
  provider?: string;
  warning?: string;
  suggestion?: string;
  details?: {
    host: string;
    database: string;
    user: string;
  };
}

function analyzeConnectionString(connectionString: string): ParsedString | null {
  if (!connectionString.trim()) return null;
  try {
    const url = new URL(connectionString.trim());
    const protocol = url.protocol;
    const hostname = url.hostname;
    const isPostgres = protocol === 'postgresql:' || protocol === 'postgres:';
    
    if (!isPostgres) {
      return { ok: false, message: 'El protocolo debe comenzar con postgresql:// o postgres://' };
    }
    
    let provider = 'Proveedor Estándar (PostgreSQL)';
    let warning = '';
    let suggestion = '';
    
    if (hostname.includes('.neon.tech')) {
      provider = 'Neon Database';
      const isPooled = hostname.includes('-pooler') || url.searchParams.get('pgbouncer') === 'true';
      if (!isPooled) {
        warning = 'Estás utilizando la URL de conexión Directa de Neon.';
        suggestion = 'Para despliegues en Vercel (Serverless), Neon proporciona una URL "Pooled" (que contiene \'-pooler\' en el host). Úsala en producción para evitar agotar el pool de conexiones del plan gratuito.';
      } else {
        suggestion = '¡Excelente! Estás utilizando la URL Pooled (Serverless-optimized), ideal para Vercel.';
      }
    } else if (hostname.includes('.supabase.')) {
      provider = 'Supabase Postgres (Directo)';
      suggestion = 'Conectando directamente a la base de datos de Supabase. Recuerda que esto se salta la API REST y usa PostgreSQL nativo.';
    } else if (hostname.includes('railway.app') || hostname.includes('railway')) {
      provider = 'Railway Postgres';
      suggestion = 'Railway proporciona una conexión robusta y escalable.';
    } else if (hostname.includes('render.com') || hostname.includes('render')) {
      provider = 'Render Postgres';
      suggestion = 'Render tiene límites de conexiones activas; considera usar un pooler si el tráfico aumenta.';
    }
    
    return {
      ok: true,
      provider,
      warning,
      suggestion,
      details: {
        host: hostname,
        database: url.pathname.replace('/', ''),
        user: url.username,
      }
    };
  } catch (e) {
    return { ok: false, message: 'La URL no tiene un formato válido de conexión PostgreSQL (ej: postgresql://usuario:clave@host:puerto/bd).' };
  }
}

// ─── CUSTOM MARKDOWN RENDERER COMPONENTS ──────────────────────────────────────

function MdCode({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/50 bg-muted/20">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-muted/40 border-b border-border/30">
        <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
          <Terminal size={9} /> {lang || 'code'}
        </span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          className="text-[9px] text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-bold"
        >
          {copied ? '✓ copiado' : 'copiar'}
        </button>
      </div>
      <pre className="px-4 py-3 text-[10px] font-mono overflow-x-auto leading-relaxed text-foreground/90">{code}</pre>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  return (
    <ReactMarkdown
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-[11px] text-foreground/80">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        em: ({ children }) => <em className="italic">{children}</em>,
        h1: ({ children }) => <h1 className="font-black text-sm mb-3 mt-5 first:mt-0 text-foreground border-b pb-1.5">{children}</h1>,
        h2: ({ children }) => <h2 className="font-black text-[12px] mb-2 mt-4 first:mt-0 text-foreground flex items-center gap-1">{children}</h2>,
        h3: ({ children }) => <h3 className="font-bold text-[11px] mb-1.5 mt-3.5 first:mt-0 text-foreground/90">{children}</h3>,
        ul: ({ children }) => <ul className="ml-4 mb-3 space-y-1 list-disc list-outside text-[11px] text-foreground/80">{children}</ul>,
        ol: ({ children }) => <ol className="ml-4 mb-3 space-y-1 list-decimal list-outside text-[11px] text-foreground/80">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        code: ({ children, className }) => {
          const lang = (className ?? '').replace('language-', '');
          if (lang) return <MdCode lang={lang} code={String(children).trimEnd()} />;
          return <code className="px-1.5 py-0.5 rounded bg-muted/80 font-mono text-[9px] text-primary">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
        hr: () => <hr className="my-4 border-border/40" />,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary/40 pl-3.5 my-3 text-muted-foreground italic bg-muted/10 py-1.5 px-3 rounded-r-xl">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80 font-semibold" target="_blank" rel="noopener noreferrer">{children}</a>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

// ─── DOCUMENTATION CONTENTS ──────────────────────────────────────────────────

const GUIDES = {
  vercel: {
    title: 'Vincular Vercel',
    icon: Rocket,
    content: `# Paso 0: Integración con la API de Vercel (Obligatorio)

Para que el panel de **Agnostic System** pueda escribir y guardar variables de entorno en tu servidor en producción de manera automática, **debes vincular el panel con tu cuenta de Vercel**.

Si no haces esta vinculación, las credenciales de base de datos o almacenamiento que configures en el panel no se aplicarán en tu servidor de producción, y tendrás que escribirlas manualmente una a una en el panel de control de Vercel.

---

### 🔑 Credenciales de Vercel Requeridas:

1. **\`VERCEL_ACCESS_TOKEN\`**:
   * *Dónde obtenerlo:* Ve a tu cuenta de Vercel, entra en **Settings** ➔ **Tokens** y genera un nuevo token con alcance (scope) global o de tu equipo.
2. **\`VERCEL_PROJECT_ID\`**:
   * *Dónde obtenerlo:* Entra a tu proyecto en Vercel, ve a **Settings** ➔ **General** y copia el ID del proyecto en la sección superior.
3. **\`VERCEL_TEAM_ID\`**:
   * *Dónde obtenerlo:* Solo es necesario si tu proyecto pertenece a un equipo u organización de Vercel (no a un perfil personal). Lo encuentras en el panel de configuración de tu equipo.

---

### 🤖 Asistente de Configuración

Si visitas la pestaña **"Estado del Deploy"** y estas variables no se encuentran activadas, el panel de forma automática te mostrará un asistente paso a paso para pegarlas y guardarlas.
`,
  },
  postgres: {
    title: 'PostgreSQL & Neon',
    icon: Database,
    content: `# Configuración de PostgreSQL (Recomendado)

Agnostic System utiliza un adaptador de persistencia completamente desacoplado. Esto significa que puedes usar cualquier base de datos PostgreSQL estándar de manera universal, sin configuraciones complejas de esquemas (es decir, sin DDL manual).

---

### 🔌 La Variable Universal: \`DATABASE_URL\`

A diferencia de otras plataformas que te piden ingresar 5 o 6 variables distintas (host, usuario, puerto, contraseña, base de datos), el estándar de PostgreSQL unifica todo en un solo texto o cadena de conexión:

\`\`\`text
postgresql://usuario:contraseña@servidor.com:5432/nombre_base_de_datos?options
\`\`\`

Al configurar esta única variable en el panel de **Deploy**, el sistema automáticamente detectará que debe usar la persistencia en base de datos PostgreSQL y cargará los datos desde allí.

---

### 🚀 Creación Automática de Tablas (Zero-DDL)

No necesitas ejecutar ningún comando \`CREATE TABLE\` ni importar archivos SQL. En la primera escritura de datos, el sistema creará automáticamente la tabla \`agnostic_records\` y sus índices:

* **Tabla única:** Se crea la tabla \`agnostic_records\` que guarda los registros en formato JSONB.
* **Dinámica:** El motor maneja múltiples namespaces (esquemas) internamente dentro de la misma tabla usando una columna indexada.
* **Sin DDL:** Evita la entropía de tener decenas de tablas distintas y permite agregar nuevos campos o colecciones sobre la marcha sin tocar la base de datos.

---

### ⚡ Neon: Conexiones Directas vs. Pooled (Serverless)

Si utilizas **Neon** (el proveedor recomendado), notarás que te ofrecen dos URLs en su dashboard:

1. **Directa (\`ep-xxx...\`):** Úsala para desarrollo local o scripts de larga duración.
2. **Pooled / Serverless (\`ep-xxx-pooler...\`):** **Úsala en Vercel.** En entornos Serverless, cada petición web de un usuario puede levantar una función nueva. Si usas la URL Directa, agotarás rápidamente el límite de conexiones concurrentes de tu base de datos. La URL Pooled utiliza *PgBouncer* para multiplexar conexiones de forma inteligente.

> 💡 **Consejo:** Neon te permite activar el switch "Pooled Connection" o "Serverless" al copiar tu URL. Asegúrate de copiar la URL Serverless antes de pegarla en tu panel de Deploy de Vercel.
`,
  },
  github: {
    title: 'Estrategia GitHub (Gratis)',
    icon: Github,
    content: `# Estrategia de Datos en GitHub (JSON)

Si no quieres configurar bases de datos relacionales ni pagar por instancias de servidores, la estrategia de GitHub es la solución ideal para despliegues rápidos y gratuitos.

---

### 📂 ¿Cómo funciona?

El sistema guarda los datos en archivos JSON directamente dentro de tu propio repositorio de GitHub, bajo la ruta:
\`\`\`text
storage/db/{namespace}.json
\`\`\`

Cada vez que guardas algo en producción:
1. El servidor realiza una petición segura a la API de GitHub.
2. Escribe o actualiza el archivo JSON correspondiente a tu "namespace" (colección).
3. Permite almacenamiento gratuito e ilimitado para configuraciones, páginas y bases de datos pequeñas.

---

### 🔑 Variables requeridas

* **\`GITHUB_REPO\`:** El repositorio del proyecto en formato \`usuario/repositorio\` (ej. \`mi-cuenta/mi-proyecto\`).
* **\`GITHUB_TOKEN\`:** Un Token de Acceso Personal (PAT) con permisos de escritura en ese repositorio.
* **\`GITHUB_BRANCH\`:** Opcional (por defecto \`main\`).

---

### ⚠️ Limitaciones Importantes

* **Rendimiento:** Cada consulta o escritura requiere llamadas HTTP a la API de GitHub. No es adecuada para aplicaciones de muy alto tráfico con miles de usuarios concurrentes.
* **Concurrencia:** Si dos usuarios guardan información exactamente al mismo tiempo, una de las escrituras podría sobrescribir a la otra. Es ideal para paneles de administración de un solo gestor, blogs o landing pages configurables.
`,
  },
  migrate: {
    title: 'Migración de Datos',
    icon: RefreshCw,
    content: `# Migración Segura de Datos

Agnostic System incluye un panel de migración que te permite mover toda tu base de datos de una estrategia a otra sin perder información.

---

### 📋 El Proceso Paso a Paso (ej. GitHub → PostgreSQL)

1. **Configura el Destino en Vercel:**
   Agrega la variable \`DATABASE_URL\` en tu panel de **Deploy** o en las variables de entorno de Vercel.
   * *Nota:* No elimines \`GITHUB_REPO\` todavía. Como GitHub tiene mayor prioridad, el sistema seguirá usando GitHub para leer y escribir mientras configuras el resto.

2. **Accede al Panel de Migración:**
   En el panel de **Deploy**, ve a la sección inferior **"Migrar datos"**.

3. **Selecciona Origen y Destino:**
   * **Desde:** \`github\`
   * **Hacia:** \`postgres\`

4. **Simula la Migración:**
   Haz clic en **"Simular"**. El sistema leerá todos tus archivos de GitHub y verificará si puede escribirlos en PostgreSQL. No guardará nada aún. Verás una simulación detallada.

5. **Ejecuta la Migración:**
   Haz clic en **"Ejecutar migración"**. Los datos se copiarán a la base de datos de PostgreSQL. Esta operación es *idempotente* (puedes correrla varias veces y no duplicará datos).

6. **Desconecta el Origen:**
   Una vez que verifiques en tu base de datos que todo se copió correctamente:
   * Ve a Vercel Dashboard y elimina la variable \`GITHUB_REPO\`.
   * Vuelve a desplegar tu proyecto.
   * El sistema resolverá la siguiente estrategia en prioridad: \`DATABASE_URL\` (PostgreSQL) y estará activa.
`,
  },
  r2: {
    title: 'Archivos (Cloudflare R2)',
    icon: Cloud,
    content: `# Almacenamiento de Archivos en Cloudflare R2

Por defecto, los archivos subidos al sistema se guardan en el sistema de archivos local (solo en desarrollo) o fallan en producción (ya que el disco duro de Vercel es de solo lectura). Para producción, debes configurar **Cloudflare R2**.

---

### ☁️ ¿Por qué Cloudflare R2?

R2 es una alternativa a Amazon S3 que **no cobra por ancho de banda (egress fees)**. Es extremadamente rápido y gratuito para los primeros 10 GB de archivos.

---

### 🔑 Variables requeridas

* **\`CF_ACCOUNT_ID\`:** El ID de tu cuenta de Cloudflare (lo encuentras en la barra lateral derecha del dashboard principal de Cloudflare).
* **\`CF_R2_BUCKET\`:** El nombre del bucket R2 que creaste.
* **\`CF_R2_ACCESS_KEY_ID\`:** Clave de acceso de la API de R2.
* **\`CF_R2_SECRET_ACCESS_KEY\`:** Clave secreta de la API de R2.
* **\`CF_R2_PUBLIC_URL\`:** Opcional. La URL pública asociada a tu bucket (ej. \`https://pub-xxx.r2.dev\` o tu dominio personalizado) para poder visualizar imágenes subidas.
`,
  },
  security: {
    title: 'Seguridad & Login',
    icon: Shield,
    content: `# Seguridad y Autenticación del Panel

Por defecto, el panel de administración de Agnostic System se encuentra en **modo abierto** (desarrollo local) para agilizar la creación de rutas, scripts y schemas.

En producción, **debes cerrar el acceso** activando la autenticación nativa.

---

### 🔒 Cómo Activar el Login

Para activar la pantalla de inicio de sesión y bloquear el acceso público, debes configurar la variable:

\`\`\`text
SESSION_SECRET=un_secreto_de_al_menos_32_caracteres_hexadecimales
\`\`\`

Si el sistema detecta que esta variable existe y tiene la longitud adecuada, obligará a cualquier visitante a iniciar sesión con su correo y contraseña.

---

### 🛠️ Generar un Secreto Seguro

Puedes generar un código aleatorio seguro copiando y ejecutando uno de los siguientes comandos:

* **En Windows (PowerShell):**
  \`\`\`powershell
  $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create(); $b = New-Object byte[] 32; $rng.GetBytes($b); [System.BitConverter]::ToString($b).Replace('-','').ToLower()
  \`\`\`
* **En macOS / Linux (Terminal):**
  \`\`\`bash
  openssl rand -hex 32
  \`\`\`
`,
  },
};

type GuideKey = keyof typeof GUIDES;

export function DocsSection() {
  const [activeGuide, setActiveGuide] = useState<GuideKey>('vercel');
  const [testUrl, setTestUrl] = useState('');
  
  const testResult = analyzeConnectionString(testUrl);

  return (
    <div className="space-y-6 py-2 animate-in fade-in duration-500 max-w-4xl">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b pb-4">
        <div className="h-8 w-8 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
          <BookOpen size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground">
            Guías de Configuración e Infraestructura
          </h3>
          <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black opacity-60 mt-0.5">
            Aprende a configurar y desplegar tu Agnostic System paso a paso
          </p>
        </div>
      </div>

      {/* ── TWO COLUMN LAYOUT ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 flex flex-col gap-1">
          {Object.entries(GUIDES).map(([key, guide]) => {
            const Icon = guide.icon;
            const isActive = activeGuide === key;
            return (
              <button
                key={key}
                onClick={() => setActiveGuide(key as GuideKey)}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all',
                  isActive 
                    ? 'bg-primary text-primary-foreground font-bold shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon size={13} className="shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider truncate">{guide.title}</span>
                {isActive && <ChevronRight size={10} className="ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="bg-background border rounded-2xl p-6 shadow-sm min-h-[400px]">
            <MarkdownContent text={GUIDES[activeGuide].content} />
          </div>

          {/* Interactive Widget on PostgreSQL tab */}
          {activeGuide === 'postgres' && (
            <div className="bg-background border rounded-2xl p-5 shadow-sm space-y-3.5 border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2">
                <Info size={14} className="text-primary shrink-0" />
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Analizador Inteligente de Connection String (Postgres)
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Pega tu cadena de conexión a continuación para verificar qué proveedor es y si está correctamente optimizada para Vercel Serverless:
              </p>
              <div className="flex items-center gap-2">
                <Input
                  value={testUrl}
                  onChange={(e) => setTestUrl(e.target.value)}
                  placeholder="postgresql://usuario:clave@host:puerto/bd"
                  type="password"
                  className="h-8 text-xs font-mono bg-background border-border/40 focus:ring-1 focus:ring-primary"
                />
                {testUrl && (
                  <button 
                    onClick={() => setTestUrl('')}
                    className="text-[9px] uppercase font-black tracking-widest text-muted-foreground hover:text-foreground shrink-0 px-2"
                  >
                    limpiar
                  </button>
                )}
              </div>

              {testResult && (
                <div className={cn(
                  'rounded-xl border p-3.5 text-[10px] space-y-2 font-sans',
                  testResult.ok 
                    ? testResult.warning 
                      ? 'border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-400' 
                      : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-400'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                )}>
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[9px]">
                    {testResult.ok ? (
                      testResult.warning ? (
                        <AlertCircle size={12} className="text-amber-500 shrink-0" />
                      ) : (
                        <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      )
                    ) : (
                      <AlertCircle size={12} className="text-destructive shrink-0" />
                    )}
                    <span>{testResult.ok ? `Proveedor detectado: ${testResult.provider}` : 'Error de formato'}</span>
                  </div>

                  {!testResult.ok && <p>{testResult.message}</p>}

                  {testResult.ok && (
                    <div className="space-y-1.5 leading-relaxed">
                      {testResult.warning && <p className="font-semibold">{testResult.warning}</p>}
                      {testResult.suggestion && <p>{testResult.suggestion}</p>}
                      
                      {testResult.details && (
                        <div className="border-t border-current/10 pt-2 mt-2 font-mono text-[9px] opacity-80 grid grid-cols-2 gap-x-4 gap-y-1">
                          <div>Host: <span className="font-bold">{testResult.details.host}</span></div>
                          <div>Database: <span className="font-bold">{testResult.details.database}</span></div>
                          <div>Usuario: <span className="font-bold">{testResult.details.user}</span></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── OBSTACLES & DEV NOTES CARD ────────────────────────────────── */}
      <div className="bg-background border border-destructive/20 bg-destructive/5 rounded-2xl p-5 shadow-sm space-y-3.5 mt-4">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-destructive shrink-0" />
          <p className="text-[10px] font-black uppercase tracking-widest text-destructive">
            Obstáculos Comunes y Lecciones Técnicas
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] leading-relaxed text-muted-foreground">
          <div className="space-y-1.5">
            <p className="font-bold text-foreground/80 uppercase tracking-wide">1. Conexión Directa en Serverless (Neon)</p>
            <p>
              Si usas la URL directa en Vercel, cada carga en frío abre conexiones que agotan rápidamente los límites. Usa siempre la URL pooled en Vercel. En local, puedes usar la directa para testing sin PgBouncer.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-foreground/80 uppercase tracking-wide">2. Prioridad de Variables</p>
            <p>
              El motor resuelve de izquierda a derecha: <code>GITHUB_REPO &gt; DATABASE_URL &gt; SUPABASE_URL</code>. Si configuras PostgreSQL pero dejas el repo de GitHub configurado en Vercel, el motor usará GitHub. Elimina las variables obsoletas.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-foreground/80 uppercase tracking-wide">3. Límite de Ejecución en Vercel (Timeouts)</p>
            <p>
              Vercel en su plan gratuito corta las peticiones API a los 10 segundos. Si tienes una migración masiva (&gt;500 filas), hazla localmente conectándote a ambas bases de datos remotas. Localmente no tienes límite de ejecución.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-bold text-foreground/80 uppercase tracking-wide">4. Permisos de Usuario PostgreSQL</p>
            <p>
              La creación automática (Zero-DDL) ejecuta <code>CREATE TABLE IF NOT EXISTS</code>. El usuario en tu connection string debe tener permisos para crear tablas. Si usas un usuario restringido, la primera escritura fallará.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
