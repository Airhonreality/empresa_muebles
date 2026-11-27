import assert from 'node:assert/strict'
import { ejecutarAccion, type ObtenerClienteId, type ObtenerSesion } from './accion'
import { NoAutenticadoError } from './errors'

// Almacén falso: dos clientes con sus proyectos. La acción real filtra por clienteId; aquí se
// reproduce ese filtro para probar que el clienteId que llega a la función es el de la sesión.
const PROYECTOS = [
  { id: 'p-a1', clienteId: 'cliente-A' },
  { id: 'p-a2', clienteId: 'cliente-A' },
  { id: 'p-b1', clienteId: 'cliente-B' },
]

function listarProyectosDe(clienteId: string): string[] {
  return PROYECTOS.filter((p) => p.clienteId === clienteId).map((p) => p.id)
}

const sinEmpleado: ObtenerSesion = async () => null

function sesionCliente(id: string | null): ObtenerClienteId {
  return async () => id
}

/** Un llamador malicioso puede mandar argumentos de más (la firma pública no admite clienteId). */
type LlamadorPublico = (...args: unknown[]) => Promise<unknown>

async function lanza(promesa: Promise<unknown>, clase: new (...a: never[]) => Error): Promise<void> {
  try {
    await promesa
  } catch (err) {
    assert.ok(err instanceof clase, `esperaba ${clase.name}, llegó ${(err as Error)?.name}`)
    return
  }
  assert.fail(`esperaba que lanzara ${clase.name}`)
}

async function run(): Promise<void> {
  const casos: [string, () => Promise<void>][] = [
    ['cliente A con el id de B como argumento extra -> recibe solo los proyectos de A', async () => {
      const accion = ejecutarAccion(
        sinEmpleado,
        { cliente: true },
        async (clienteId: string) => listarProyectosDe(clienteId),
        sesionCliente('cliente-A'),
      ) as unknown as LlamadorPublico
      const resultado = await accion('cliente-B') as string[]
      assert.deepEqual(resultado, ['p-a1', 'p-a2'])
      assert.ok(!resultado.includes('p-b1'), 'se filtró un proyecto de B')
    }],
    ['cliente A sin argumentos -> recibe los de A', async () => {
      const accion = ejecutarAccion(sinEmpleado, { cliente: true }, async (clienteId: string) => listarProyectosDe(clienteId), sesionCliente('cliente-A'))
      assert.deepEqual(await accion(), ['p-a1', 'p-a2'])
    }],
    ['cliente con argumentos propios -> llegan intactos después del clienteId de sesión', async () => {
      const accion = ejecutarAccion(
        sinEmpleado,
        { cliente: true },
        async (clienteId: string, proyectoId: string) => `${clienteId}|${proyectoId}`,
        sesionCliente('cliente-B'),
      )
      assert.equal(await accion('p-b1'), 'cliente-B|p-b1')
    }],
    ['cliente A pide un proyecto de B como argumento -> el clienteId sigue siendo el de A', async () => {
      const accion = ejecutarAccion(
        sinEmpleado,
        { cliente: true },
        async (clienteId: string, proyectoId: string) => ({ clienteId, proyectoId }),
        sesionCliente('cliente-A'),
      ) as unknown as LlamadorPublico
      // El id de B viaja como segundo argumento; la acción decide ownership con el clienteId de A.
      assert.deepEqual(await accion('p-b1', 'cliente-B'), { clienteId: 'cliente-A', proyectoId: 'p-b1' })
    }],
    ['sin sesión de cliente -> NoAutenticadoError y no ejecuta fn', async () => {
      let ejecutada = false
      const accion = ejecutarAccion(sinEmpleado, { cliente: true }, async () => { ejecutada = true; return 'x' }, sesionCliente(null))
      await lanza(accion(), NoAutenticadoError)
      assert.equal(ejecutada, false)
    }],
    ['regla cliente con valor distinto de true -> error al declarar', async () => {
      assert.throws(
        () => ejecutarAccion(sinEmpleado, { cliente: false } as unknown as { cliente: true }, async () => 'x', sesionCliente('cliente-A')),
        /cliente: true/,
      )
    }],
  ]

  let fallos = 0
  for (const [nombre, prueba] of casos) {
    try {
      await prueba()
      console.log(`ok - ${nombre}`)
    } catch (err) {
      fallos++
      console.error(`FAIL - ${nombre}: ${(err as Error).message}`)
    }
  }
  if (fallos > 0) process.exitCode = 1
  else console.log(`accion-cliente.test.ts: ${casos.length} casos ok`)
}

void run()
