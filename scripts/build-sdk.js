/**
 * 🏭 AGNOSTIC_SDK_BUILDER (v1.2)
 * =============================
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TARGET_FILE = path.join(__dirname, '../storage/empresa_muebles/modules/indra.d.ts');
const FINAL_SDK_NAME = path.join(__dirname, '../storage/empresa_muebles/modules/agnostic.d.ts');

function build() {
  console.log('🏭 Initializing Industrial SDK Build...');

  try {
    console.log('⚡ Compiling Core Contracts via TSC...');
    execSync('npx tsc -p tsconfig.sdk.json', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    if (fs.existsSync(TARGET_FILE)) {
      fs.renameSync(TARGET_FILE, FINAL_SDK_NAME);
      console.log('✨ SDK Crystallized: storage/empresa_muebles/modules/agnostic.d.ts');
    }

    console.log('✅ Industrial SDK build completed successfully.');
  } catch (err) {
    console.error('❌ SDK Build Failed.');
    process.exit(1);
  }
}

build();
