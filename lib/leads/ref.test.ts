import assert from 'node:assert/strict'
import {
  generarRefLead,
  construirMensajeWhatsApp,
  construirUrlWhatsApp,
} from './ref'

// t-188: ref corta, estable y legible.
assert.equal(generarRefLead('8f3a9c21-1111-2222-3333-444455556666'), 'VD-8F3A9C21')
assert.equal(generarRefLead('sha256-no-uuid'), 'VD-SHA256NO')
assert.equal(generarRefLead(''), 'VD-00000000')
assert.match(generarRefLead('abc'), /^VD-[A-Z0-9]{1,8}$/)

// Con nombre: el mensaje lo incluye, sin referencia corta.
const conNombre = construirMensajeWhatsApp({
  nombre: '  Carlos Mendoza ',
  tipoProyecto: 'Asesoría Base',
  ubicacion: 'Bogotá D.C.',
})
assert.match(conNombre, /mi nombre es Carlos Mendoza\./)
assert.doesNotMatch(conNombre, /Ref:/)
assert.match(conNombre, /Asesoría Base/)
assert.match(conNombre, /Bogotá D\.C\./)

// Sin nombre: no debe aparecer "mi nombre es" ni el placeholder viejo "Cliente Web".
const sinNombre = construirMensajeWhatsApp({ nombre: '   ' })
assert.doesNotMatch(sinNombre, /mi nombre es/)
assert.doesNotMatch(sinNombre, /Cliente Web/)
assert.doesNotMatch(sinNombre, /Ref:/)
assert.match(sinNombre, /^Hola Veta Dorada\./)

// Defaults de tipo/ubicación cuando no llegan.
const defaultSinDatos = construirMensajeWhatsApp({})
assert.match(defaultSinDatos, /proyecto de Cocina en Bogotá/)
assert.doesNotMatch(defaultSinDatos, /Ref:/)

// URL codificada correctamente.
const url = construirUrlWhatsApp('573025922101', conNombre)
assert.ok(url.startsWith('https://api.whatsapp.com/send/?phone=573025922101&text='))
assert.ok(!url.includes(encodeURIComponent('Ref:')))

console.log('ref.test.ts OK')
