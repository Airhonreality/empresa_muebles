/**
 * Tests de `lib/data/contenedores.ts`.
 * Patrón del repo: `node:assert` + `npx tsx`, sin runner (ver AGENTS.md).
 *
 *   npx tsx lib/data/contenedores.test.ts
 */
import assert from 'node:assert/strict'
import { ContenedorDescriptivo } from './contracts'
import { aplicarContenedoresAEspacios, aplicarContenedoresAGrupos, normalizarDescripcion } from './contenedores'

function contenedor(id: string, grupoItemId: string | null, espacioVarianteId: string | null, descripcion: string | null): ContenedorDescriptivo {
  return {
    id,
    espacioVarianteId,
    grupoItemId,
    descripcion,
    fotosEspacio: [],
    fotosDisenio: [],
    fotosReferencia: [],
    createdAt: '2026-10-29T00:00:00Z',
    updatedAt: '2026-10-29T00:00:00Z',
  }
}

// ── aplicarContenedoresAEspacios ────────────────────────────────────────────

{
  const espacio = { id: 'esp-1', descripcion: null as string | null, fotosEspacio: null as string[] | null }
  const resultado = aplicarContenedoresAEspacios([espacio], [
    contenedor('c1', null, 'esp-1', 'Texto con **negrita** y lista:\n- Uno\n- Dos'),
  ])
  assert.equal(resultado[0].descripcion, 'Texto con **negrita** y lista:\n- Uno\n- Dos')
  assert.deepEqual(resultado[0].fotosEspacio, [])

  const sinContenedor = aplicarContenedoresAEspacios([{ id: 'esp-2' }], [])
  assert.equal(sinContenedor[0].descripcion, undefined)
}

// ── aplicarContenedoresAGrupos ─────────────────────────────────────────────

{
  const grupo = { id: 'grupo-1', nombre: 'Muebles Bajos', descripcion: undefined as string | undefined }
  const resultado = aplicarContenedoresAGrupos([grupo], [
    contenedor('c2', 'grupo-1', null, 'Grupo con descripción markdown:\n- Item A\n- Item B'),
  ])
  assert.equal(resultado[0].descripcion, 'Grupo con descripción markdown:\n- Item A\n- Item B')

  const sinContenedor = aplicarContenedoresAGrupos([grupo], [])
  assert.equal(sinContenedor[0].descripcion, null)
}

// ── normalizarDescripcion ─────────────────────────────────────────────────

{
  // Mantiene una línea en blanco (separación de bloques markdown).
  assert.equal(normalizarDescripcion('Párrafo A\n\nPárrafo B'), 'Párrafo A\n\nPárrafo B')
  // Colapsa 3+ saltos seguidos a dos.
  assert.equal(normalizarDescripcion('A\n\n\n\nB'), 'A\n\nB')
  // Normaliza CRLF.
  assert.equal(normalizarDescripcion('A\r\n\r\nB'), 'A\n\nB')
  // Normaliza CRLF, recorta espacios finales de línea y los extremos del texto.
  assert.equal(normalizarDescripcion('  A  \nB\n'), 'A\nB')
  // Vacíos quedan nulos.
  assert.equal(normalizarDescripcion(null), null)
  assert.equal(normalizarDescripcion('   '), null)
}

console.log('contenedores.test.ts: 4 pruebas pasadas')
