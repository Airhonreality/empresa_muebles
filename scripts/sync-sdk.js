/**
 * 🔄 SDK_SYNC_ENGINE (v1.0)
 * ========================
 * 
 * ROLE: Ensures the AgnosticAPI contract is perfectly mirrored between
 * the Seed Core and the Storage Modules.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_PATH = path.join(__dirname, '../src/core/indra.ts');
const TARGET_PATH = path.join(__dirname, '../storage/empresa_muebles/modules/agnostic.d.ts');

function sync() {
  console.log('🔄 Syncing SDK Contracts...');

  try {
    const sourceContent = fs.readFileSync(SOURCE_PATH, 'utf8');
    
    // Extract the AgnosticAPI interface and related types using a clean regex
    const typesToExtract = ['DataItem', 'UnifiedQuery', 'AgnosticAPI', 'AppState'];
    let extractedContent = '/** 🛰️ AUTO-GENERATED CONTRACT - DO NOT EDIT **/\n\n';

    typesToExtract.forEach(typeName => {
      const regex = new RegExp(`export (interface|type) ${typeName} [\\s\\S]*?\\n}`, 'g');
      const match = sourceContent.match(regex);
      if (match) {
        extractedContent += match[0] + '\n\n';
      }
    });

    fs.writeFileSync(TARGET_PATH, extractedContent);
    console.log('✅ SDK Contract synchronized successfully.');
  } catch (err) {
    console.error('❌ Sync Failed:', err.message);
  }
}

sync();
