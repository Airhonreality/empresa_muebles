/**
 * t-168: requisitos pendientes del modal de contrato.
 *
 * Módulo puro: sin React, sin store, sin I/O. Existe para que "el botón está deshabilitado"
 * sea una respuesta que el usuario pueda leer, no un estado mudo — y para que esa respuesta
 * se pueda testear sin montar nada (patrón `node:assert` + `npx tsx` del repo, ver AGENTS.md).
 *
 * Por qué NO se reimplementa la validación aquí: estas condiciones son las mismas 9 de
 * `esValido` en `app/erp/cotizador/ContratoModal.tsx`. Este módulo las devuelve una por una
 * para poder nombrarlas; el modal decide si el botón se habilita con `pendientes.length === 0`.
 * La tabla de casos de `contrato-validacion.test.ts` ata las dos cosas para que una no se
 * vuelva más laxa que la otra.
 */

/** Campo de la UI que bloquea la acción. Uno por requisito, para poder marcarlo en el formulario. */
export type CampoContrato =
  | 'cliente'
  | 'valorTotal'
  | 'hitos'
  | 'plazoSemanas'
  | 'alcanceSuministros'
  | 'anexoPropuestaIdentificacion'

/** Requisito incumplido: qué campo es y el texto exacto que ve el usuario. */
export type RequisitoPendiente = {
  campo: CampoContrato
  mensaje: string
}

/** Todo lo que la validación necesita. Todo primitivo: esta función no sabe de clientes ni de hitos. */
export type EntradaValidacionContrato = {
  /** El proyecto tiene un cliente vinculado. */
  tieneCliente: boolean
  /** Nombre del cliente tal como está en el formulario (puede estar vacío). */
  nombreCliente: string
  /** Valor total como texto (viene de MoneyInput, no es número). */
  valorTotal: string
  /** Cantidad de hitos de pago cargados. */
  cantidadHitos: number
  /** Todos los hitos son de tipo porcentaje (si hay montos fijos, la suma no tiene que dar 100). */
  todosPorcentaje: boolean
  /** Suma de los hitos, en porcentaje. */
  sumaHitos: number
  /** Plazo en semanas hábiles, como texto. */
  plazoSemanas: string
  alcanceSuministros: string
  anexoPropuestaIdentificacion: string
}

/**
 * Devuelve TODOS los requisitos incumplidos, no solo el primero: el usuario tiene que ver la
 * lista completa de una vez, porque corregir de a uno en ida y vuelta es lo que hace que un
 * formulario se abandone.
 */
export function requisitosPendientes(e: EntradaValidacionContrato): RequisitoPendiente[] {
  const pendientes: RequisitoPendiente[] = []

  if (!e.tieneCliente) {
    pendientes.push({
      campo: 'cliente',
      mensaje: 'El proyecto no tiene cliente vinculado. Elegí el cliente antes de generar el contrato.',
    })
  } else if (!e.nombreCliente.trim()) {
    pendientes.push({
      campo: 'cliente',
      mensaje: 'El nombre del contratante está vacío. Escribilo en los datos del cliente.',
    })
  }

  if (!(parseFloat(e.valorTotal) > 0)) {
    pendientes.push({
      campo: 'valorTotal',
      mensaje: 'El valor total tiene que ser un número mayor a 0.',
    })
  }

  if (e.cantidadHitos < 2) {
    pendientes.push({
      campo: 'hitos',
      mensaje: `Hacen falta al menos 2 hitos de pago y hay ${e.cantidadHitos}. Agregá otro hito en el plan de pagos.`,
    })
  }
  // Con 0 hitos la suma no es un dato, es la consecuencia de que no hay ninguno: no se reporta
  // para no listar dos veces el mismo problema con dos textos distintos.
  if (e.todosPorcentaje && e.cantidadHitos > 0 && !(Math.abs(e.sumaHitos - 100) < 0.01)) {
    pendientes.push({
      campo: 'hitos',
      mensaje: `La suma de los hitos por porcentaje es ${e.sumaHitos.toFixed(2)}% y tiene que ser 100%.`,
    })
  }

  const plazo = parseInt(e.plazoSemanas, 10)
  if (!Number.isInteger(plazo) || plazo <= 0) {
    pendientes.push({
      campo: 'plazoSemanas',
      mensaje: 'El plazo tiene que ser un número entero de semanas hábiles mayor a 0.',
    })
  }

  if (!e.alcanceSuministros.trim()) {
    pendientes.push({
      campo: 'alcanceSuministros',
      mensaje:
        'El alcance de suministros está vacío. Escribí qué suma Veta Dorada, qué trae el cliente y qué queda excluido.',
    })
  }

  if (!e.anexoPropuestaIdentificacion.trim()) {
    pendientes.push({
      campo: 'anexoPropuestaIdentificacion',
      mensaje:
        'Falta identificar el Anexo 1. Anotá cómo se identifica en papel la Propuesta impresa que se adjunta al correo.',
    })
  }

  return pendientes
}

/** El botón se habilita solo si no queda nada pendiente. Única fuente de verdad de ambos lados. */
export function esContratoValido(e: EntradaValidacionContrato): boolean {
  return requisitosPendientes(e).length === 0
}
