import 'dotenv/config'
import { db } from '../lib/db/client'
import { portafolio } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const mapeoTitulos = {
  'Cocina Victoria G. - Rosales': 'Cocina G. — Rosales',
  'Proyecto en el barrio Chico para Ciro R.': 'Cocina R. — Chicó',
  'Proyecto Carlos C - Centro de TV': 'Centro de TV C. — Pontevedra',
  'Proyecto Neidy Snachez': 'Cocina S. — Cota',
  'Proyecto ciro rincon': 'Vestier R. — Santa Bárbara',
  'Proyecto Angela L- cocina baño wk closet': 'Proyecto Integral L. — Niza',
  'Proyecto Carlos Cortes - Tocadores': 'Tocador C. — Pontevedra',
  'Proyecto Cocina Salitre': 'Cocina Lineal — Salitre Oriental',
  'Proyecto Nestor': 'Biblioteca N. — El Nogal',
}

async function normalizarTitulos() {
  console.log('Iniciando normalización de títulos de portafolio público...\n')
  
  for (const [oldTitle, newTitle] of Object.entries(mapeoTitulos)) {
    console.log(`Buscando: "${oldTitle}"`)
    
    try {
      const result = await db.update(portafolio)
        .set({ titulo: newTitle })
        .where(eq(portafolio.titulo, oldTitle))
        .returning({ id: portafolio.id })
      
      if (result.length > 0) {
        console.log(`✅ Actualizado a: "${newTitle}" (ID: ${result[0].id})\n`)
      } else {
        console.log(`⚠️ No se encontró el proyecto original o ya fue actualizado.\n`)
      }
    } catch (error) {
      console.error(`❌ Error actualizando "${oldTitle}":`, error)
    }
  }
  
  console.log('Proceso de normalización completado.')
  process.exit(0)
}

normalizarTitulos().catch(console.error)
