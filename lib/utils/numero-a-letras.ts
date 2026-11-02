/**
 * Convierte un número (string) a su representación en letras en español,
 * con formato para pesos colombianos.
 *
 * Ejemplos:
 *   numeroALetrasPesos('1250000')  → 'UN MILLÓN DOSCIENTOS CINCUENTA MIL PESOS M/CTE'
 *   numeroALetrasPesos('1250000.50') → 'UN MILLÓN DOSCIENTOS CINCUENTA MIL PESOS CON 50/100'
 *   numeroALetrasPesos('0')        → 'CERO PESOS M/CTE'
 */

const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const UNIDADES_FEM = ['', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve']
const DECENAS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve']
const DECENAS_MULTIPL = ['veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa']
const CENTENAS = ['ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos']

function convertirGrupo(n: number, fem: boolean): string {
  if (n === 0) return ''
  let resultado = ''

  const centena = Math.floor(n / 100)
  const decena = Math.floor((n % 100) / 10)
  const unidad = n % 10

  if (centena > 0) {
    if (centena === 1 && decena === 0 && unidad === 0) {
      resultado = 'cien'
    } else {
      resultado = CENTENAS[centena - 1]
    }
  }

  if (decena > 0 || unidad > 0) {
    if (centena > 0) resultado += ' '

    if (decena === 1) {
      resultado += DECENAS[unidad]
    } else if (decena === 2) {
      if (unidad === 0) {
        resultado += 'veinte'
      } else {
        resultado += 'veinti' + (fem ? UNIDADES_FEM[unidad] : UNIDADES[unidad])
      }
    } else if (decena > 2) {
      resultado += DECENAS_MULTIPL[decena - 2]
      if (unidad > 0) {
        resultado += ' y ' + (fem ? UNIDADES_FEM[unidad] : UNIDADES[unidad])
      }
    } else if (unidad > 0) {
      resultado += fem ? UNIDADES_FEM[unidad] : UNIDADES[unidad]
    }
  }

  return resultado
}

export function numeroALetrasPesos(cantidad: string): string {
  const limpio = cantidad.replace(/[^\d.,]/g, '').replace(',', '.')
  const num = parseFloat(limpio)
  if (!Number.isFinite(num) || num < 0) return 'CERO PESOS M/CTE'

  const entero = Math.floor(num)
  const centavos = Math.round((num - entero) * 100)

  let resultado = ''

  if (entero >= 1000000) {
    const millones = Math.floor(entero / 1000000)
    const resto = entero % 1000000
    if (millones === 1) {
      resultado = 'un millón'
    } else {
      const grupo = convertirGrupo(millones, false)
      resultado = grupo ? grupo + ' millones' : 'millones'
    }
    if (resto > 0) {
      const grupo = convertirGrupo(resto, false)
      if (grupo) resultado += ' ' + grupo
    }
  } else if (entero >= 1000) {
    const miles = Math.floor(entero / 1000)
    const resto = entero % 1000
    if (miles === 1) {
      resultado = 'mil'
    } else {
      const grupo = convertirGrupo(miles, false)
      resultado = grupo ? grupo + ' mil' : 'mil'
    }
    if (resto > 0) {
      const grupo = convertirGrupo(resto, false)
      if (grupo) resultado += ' ' + grupo
    }
  } else {
    resultado = convertirGrupo(entero, false) || 'cero'
  }

  // Ajuste de género: "una" antes de "pesos" no se usa, es "un pesos"? No — en español se dice
  // "un peso" (singular) o "X pesos" (plural). Para 1 entero, usamos singular.
  if (entero === 1 && centavos === 0) {
    resultado = 'un'
  }

  const moneda = entero === 1 && centavos === 0 ? 'peso' : 'pesos'
  const centavosTexto = centavos > 0 ? ` con ${centavos.toString().padStart(2, '0')}/100` : ' m/cte'

  return (resultado.charAt(0).toUpperCase() + resultado.slice(1)) + ' ' + moneda + centavosTexto
}
