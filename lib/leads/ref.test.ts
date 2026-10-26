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

// Con nombre: el mensaje lo incluye y siempre lleva la referencia.
const conNombre = construirMensajeWhatsApp({
  nombre: '  Carlos Mendoza ',
  tipoProyecto: 'Asesoría Base',
  ubicacion: 'Bogotá D.C.',
  ref: 'VD-8F3A9C21',
})
assert.match(conNombre, /mi nombre es Carlos Mendoza\./)
assert.match(conNombre, /Ref: VD-8F3A9C21\./)
assert.match(conNombre, /Asesoría Base/)
assert.match(conNombre, /Bogotá D\.C\./)

// Sin nombre: no debe aparecer "mi nombre es" ni el placeholder viejo "Cliente Web".
const sinNombre = construirMensajeWhatsApp({ nombre: '   ', ref: 'VD-11112222' })
assert.doesNotMatch(sinNombre, /mi nombre es/)
assert.doesNotMatch(sinNombre, /Cliente Web/)
assert.match(sinNombre, /^Hola Veta Dorada\./)
assert.match(sinNombre, /Ref: VD-11112222\./)

// Defaults de tipo/ubicación cuando no llegan.
const defaultSinDatos = construirMensajeWhatsApp({ ref: 'VD-99999999' })
assert.match(defaultSinDatos, /proyecto de Cocina en Bogotá/)

// URL codificada correctamente.
const url = construirUrlWhatsApp('573025922101', conNombre)
assert.ok(url.startsWith('https://api.whatsapp.com/send/?phone=573025922101&text='))
assert.ok(url.includes(encodeURIComponent('Ref: VD-8F3A9C21.')))

console.log('ref.test.ts OK')
