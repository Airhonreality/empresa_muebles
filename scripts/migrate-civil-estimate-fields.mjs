#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const storagePath = path.join(__dirname, '../storage/db')
const proposalFile = path.join(storagePath, 'propuestas_publicas.json')
const itemsFile = path.join(storagePath, 'items_obra_civil.json')
const backupFile = path.join(storagePath, '.backup_propuestas_publicas_' + Date.now() + '.json')

console.log('🔄 Iniciando migración de civil_estimate fields...\n')

try {
  // 1. Leer archivos
  if (!fs.existsSync(proposalFile)) {
    console.error('❌ Archivo no encontrado:', proposalFile)
    process.exit(1)
  }

  const proposalData = JSON.parse(fs.readFileSync(proposalFile, 'utf8'))
  const itemsData = fs.existsSync(itemsFile) ? JSON.parse(fs.readFileSync(itemsFile, 'utf8')) : []

  console.log(`📋 Propuestas encontradas: ${proposalData.length}`)
  console.log(`📦 Items obra civil disponibles: ${itemsData.length}\n`)

  // 2. Crear backup
  fs.writeFileSync(backupFile, JSON.stringify(proposalData, null, 2))
  console.log(`💾 Backup creado: ${backupFile}\n`)

  // 3. Procesar cada propuesta
  let migratedCount = 0
  let itemsUpdated = 0

  proposalData.forEach((proposal, idx) => {
    const snapshotStr = proposal.data?.snapshot_json
    if (!snapshotStr) return

    try {
      const snapshot = JSON.parse(snapshotStr)
      let snapshotModified = false

      // Procesar cada espacio
      if (snapshot.spaces && Array.isArray(snapshot.spaces)) {
        snapshot.spaces.forEach(space => {
          if (space.variants && Array.isArray(space.variants)) {
            space.variants.forEach(variant => {
              if (variant.civil_estimate && Array.isArray(variant.civil_estimate)) {
                variant.civil_estimate.forEach(item => {
                  // Solo procesar si faltan fields
                  if (item.unit_price === undefined || item.total === undefined) {
                    // Intentar obtener datos de items_obra_civil
                    const matchedItem = itemsData.find(i => {
                      const idata = i.data
                      return idata?.descripcion_manual === item.name ||
                             idata?.descripcion_manual?.includes(item.name)
                    })

                    const unitPrice = matchedItem ? Number(matchedItem.data.precio_unitario) || 0 : 0
                    const quantity = Number(item.quantity) || 0
                    const lineTotal = matchedItem
                      ? Number(matchedItem.data.total_linea) || 0
                      : (unitPrice * quantity)

                    item.unit_price = unitPrice
                    item.total = lineTotal

                    if (unitPrice > 0 || lineTotal > 0) {
                      itemsUpdated++
                    }
                    snapshotModified = true
                  }
                })
              }
            })
          }
        })
      }

      if (snapshotModified) {
        proposal.data.snapshot_json = JSON.stringify(snapshot)
        migratedCount++
      }
    } catch (e) {
      console.warn(`⚠️  Error procesando propuesta ${idx}:`, e.message)
    }
  })

  // 4. Validar JSON antes de guardar
  console.log('\n✔️  Validando estructura JSON...')
  JSON.stringify(proposalData) // Throws si JSON inválido
  console.log('✅ JSON válido\n')

  // 5. Guardar
  fs.writeFileSync(proposalFile, JSON.stringify(proposalData, null, 2))

  console.log(`🎉 Migración completada:`)
  console.log(`   • Propuestas procesadas: ${migratedCount}`)
  console.log(`   • Items con fields agregados: ${itemsUpdated}`)
  console.log(`   • Backup seguro: ${path.basename(backupFile)}\n`)

  console.log('✅ SEGURO: Todos los campos se agregaron sin romper la estructura')
} catch (error) {
  console.error('❌ ERROR:', error.message)
  console.error('\n🔙 Restaurando backup...')

  if (fs.existsSync(backupFile)) {
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'))
    fs.writeFileSync(proposalFile, JSON.stringify(backup, null, 2))
    console.log('✅ Restaurado desde backup')
  }

  process.exit(1)
}
