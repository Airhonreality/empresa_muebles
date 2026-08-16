// Bootstrap del primer admin del ERP (D-08b, F10 2026-08-15).
// Problema que resuelve: middleware.ts bloquea /erp/equipo (donde se generan
// invitaciones) a cualquiera sin sesión — nadie puede autoinvitarse la
// primera vez por la UI. Este script crea/activa directamente una fila en
// `usuarios` con contraseña real, corriendo una sola vez, localmente.
//
// Uso:
//   PERSONA_ID=<uuid> ADMIN_EMAIL=javier@vetadeoro.co ADMIN_PASSWORD=... npx tsx scripts/seed-admin-empleado.ts
//
// Mismo guard de allowlist de host que scripts/seed-dev.ts: nunca corre
// contra producción. IMPORTANTE: el host de abajo es el que realmente resuelve
// hoy `DATABASE_URL` en .env.local (verificado 2026-08-15) — NO el nombre de
// rama documentado en arnes/estado.md, que está desactualizado respecto al
// contenido real de .env.local (discrepancia encontrada en esta sesión, sin
// resolver — ver nota en arnes/estado.md).
import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db, client } from '../lib/db/client'
import { usuarios, personas } from '../lib/db/schema'
import { hashPassword } from '../lib/auth/hash'

const DEV_HOST_ALLOWLIST = new Set([
  'ep-muddy-cherry-at5j2mz7.c-9.us-east-1.aws.neon.tech',
])

function guard(): void {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no definida')
  const hostname = new URL(url).hostname
  if (!DEV_HOST_ALLOWLIST.has(hostname)) {
    throw new Error(
      `SEED BLOQUEADO: host "${hostname}" no está en la allowlist de desarrollo. ` +
        'Este script NUNCA debe correr contra producción.',
    )
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SEED BLOQUEADO: NODE_ENV=production. No se siembra en producción.')
  }
}

async function main(): Promise<void> {
  guard()

  const personaId = process.env.PERSONA_ID
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const rol = (process.env.ADMIN_ROL ?? 'admin') as typeof usuarios.$inferInsert.rolEmpleado

  if (!personaId || !email || !password) {
    throw new Error(
      'Faltan variables: PERSONA_ID, ADMIN_EMAIL, ADMIN_PASSWORD son obligatorias ' +
        '(ej. PERSONA_ID=<uuid de una Persona ya existente en /erp/equipo>).',
    )
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.')
  }

  const [personaExistente] = await db.select().from(personas).where(eq(personas.id, personaId))
  if (!personaExistente) {
    throw new Error(`No existe ninguna Persona con id ${personaId}. Creala primero en /erp/equipo.`)
  }

  const passwordHash = await hashPassword(password)
  const [existente] = await db.select().from(usuarios).where(eq(usuarios.email, email))

  if (existente) {
    await db
      .update(usuarios)
      .set({
        passwordHash,
        activo: true,
        tipo: 'empleado',
        rolEmpleado: rol,
        personaId,
        nombre: personaExistente.nombre,
        inviteToken: null,
        inviteTokenExpiraEn: null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(usuarios.id, existente.id))
    console.log(`Cuenta actualizada: ${email} (usuarios.id=${existente.id}, rol=${rol}).`)
  } else {
    const [creado] = await db
      .insert(usuarios)
      .values({
        email,
        passwordHash,
        tipo: 'empleado',
        rolEmpleado: rol,
        personaId,
        nombre: personaExistente.nombre,
        activo: true,
      })
      .returning()
    console.log(`Cuenta creada: ${email} (usuarios.id=${creado.id}, rol=${rol}).`)
  }

  console.log(`Listo. Entrá en /erp/login con ${email} y la contraseña que definiste.`)
}

main()
  .then(() => client.end())
  .catch((err) => {
    console.error(err)
    client.end().finally(() => process.exit(1))
  })
