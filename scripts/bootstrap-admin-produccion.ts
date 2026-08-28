// Bootstrap del primer usuario admin en la base de datos REAL de producción (br-twilight-mountain,
// ep-round-queen-at3nzf87) — recién migrada 2026-08-28, estaba vacía (ver arnes/estado.md).
// Problema: seed-admin-empleado.ts bloquea a propósito correr contra cualquier host que no sea el
// de pruebas (correcto para uso normal); este script es la excepción única y deliberada para el
// primer arranque de producción real. Crea la Persona (si no existe una con ese email) y el
// Usuario en una sola corrida, sin depender de tener ya una sesión activa (catch-22 de
// seed-admin-empleado.ts: /erp/equipo requiere sesión, y no hay sesión sin usuario).
//
// Uso (una sola vez):
//   DATABASE_URL="<connection string de la rama production>" \
//   ADMIN_NOMBRE="Javier ..." ADMIN_EMAIL=javier@vetadeoro.co ADMIN_PASSWORD=... \
//   CONFIRMAR=si-produccion \
//   npx tsx scripts/bootstrap-admin-produccion.ts
import { config } from 'dotenv'
config({ path: '.env.local' })

import { eq } from 'drizzle-orm'
import { db, client } from '../lib/db/client'
import { usuarios, personas } from '../lib/db/schema'
import { hashPassword } from '../lib/auth/hash'

const PRODUCTION_HOST = 'ep-round-queen-at3nzf87.c-9.us-east-1.aws.neon.tech'
const PRODUCTION_HOST_POOLED = 'ep-round-queen-at3nzf87-pooler.c-9.us-east-1.aws.neon.tech'

function guard(): void {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL no definida')
  const hostname = new URL(url).hostname
  if (hostname !== PRODUCTION_HOST && hostname !== PRODUCTION_HOST_POOLED) {
    throw new Error(
      `Este script es SOLO para la rama production de Neon (host esperado: ${PRODUCTION_HOST}). ` +
        `Host recibido: "${hostname}". Para sembrar en dev/preview usá scripts/seed-admin-empleado.ts.`,
    )
  }
  if (process.env.CONFIRMAR !== 'si-produccion') {
    throw new Error(
      'Falta la confirmación explícita: agregá CONFIRMAR=si-produccion a la llamada. ' +
        'Esto va a escribir en la base de datos REAL de producción.',
    )
  }
}

async function main(): Promise<void> {
  guard()

  const nombre = process.env.ADMIN_NOMBRE?.trim()
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  const rol = (process.env.ADMIN_ROL ?? 'admin') as typeof usuarios.$inferInsert.rolEmpleado

  if (!nombre || !email || !password) {
    throw new Error('Faltan variables: ADMIN_NOMBRE, ADMIN_EMAIL, ADMIN_PASSWORD son obligatorias.')
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres.')
  }

  let [persona] = await db.select().from(personas).where(eq(personas.email, email))
  if (!persona) {
    ;[persona] = await db.insert(personas).values({ nombre, email, activo: true }).returning()
    console.log(`Persona creada: ${nombre} (personas.id=${persona.id}).`)
  } else {
    console.log(`Persona ya existía: ${persona.nombre} (personas.id=${persona.id}), reusando.`)
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
        personaId: persona.id,
        nombre: persona.nombre,
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
        personaId: persona.id,
        nombre: persona.nombre,
        activo: true,
      })
      .returning()
    console.log(`Cuenta creada: ${email} (usuarios.id=${creado.id}, rol=${rol}).`)
  }

  console.log(`Listo. Entrá en https://vetadeoro.co/erp/login con ${email} y la contraseña que definiste.`)
}

main()
  .then(() => client.end())
  .catch((err) => {
    console.error(err)
    client.end().finally(() => process.exit(1))
  })
