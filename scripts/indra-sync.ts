/**
 * 🛰️ INDRA HYDRATION PROTOCOL (indra-sync)
 * ========================================
 * 
 * ROLE: Syncs local Materia (.json files) from storage to the Cloud (Supabase).
 * 
 * USAGE: 
 * $env:ACTIVE_TENANT="empresa_muebles"; npx tsx scripts/indra-sync.ts
 */

import fs from 'fs';
import path from 'path';

async function sync() {
  const tenant = process.env.ACTIVE_TENANT;
  if (!tenant) {
    console.error('❌ ERROR: ACTIVE_TENANT not set.');
    process.exit(1);
  }

  console.log(`\n🚀 Starting Indra Sync for tenant: [${tenant}]`);

  const storagePath = path.join(process.cwd(), 'storage', tenant);
  const dbPath = path.join(storagePath, 'db');
  const dnaPath = path.join(storagePath, 'dna.json');

  if (!fs.existsSync(dnaPath)) {
    console.error(`❌ ERROR: dna.json not found in ${storagePath}`);
    process.exit(1);
  }

  // 1. Read DNA for credentials
  const dna = JSON.parse(fs.readFileSync(dnaPath, 'utf8'));
  const { supabaseUrl, supabaseKey } = dna;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERROR: Supabase credentials missing in dna.json');
    process.exit(1);
  }

  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  // 2. Scan /db folder
  if (!fs.existsSync(dbPath)) {
    console.warn(`⚠️ Warning: No /db folder found in ${storagePath}`);
    return;
  }

  const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'));

  for (const file of files) {
    const context = file.replace('.json', '');
    const filePath = path.join(dbPath, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Ensure content is an array
    const records = Array.isArray(content) ? content : [content];

    console.log(`\n📦 Syncing context: [${context}] (${records.length} items)...`);

    // Prepare records for the 'records' table in Supabase
    const mappedRecords = records.map(item => {
      const data = item.data || item;
      
      // --- SLUG GENERATION ---
      let slug = data._slug || '';
      try {
        const fullDb = JSON.parse(fs.readFileSync(path.join(storagePath, 'db', 'schema_definitions.json'), 'utf8'));
        const schema = fullDb.find((s: any) => s.data?.name?.toString().toLowerCase() === context.toLowerCase() || s.id === context);
        if (schema && schema.data.slug_source) {
          const sourceValue = data[schema.data.slug_source];
          if (sourceValue) {
            slug = sourceValue.toString()
              .toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-+|-+$/g, '');
          }
        }
      } catch (e) { /* schema not found or other error */ }

      return {
        id: item.id || `gen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        context: context,
        data: { ...data, _slug: slug },
        updated_at: new Date().toISOString()
      };
    });

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/records`, {
        method: 'POST', // Post with merge-duplicates header acts as Upsert
        headers,
        body: JSON.stringify(mappedRecords)
      });

      if (res.ok) {
        console.log(`✅ Success: [${context}] is now in sync with Cloud.`);
      } else {
        const err = await res.text();
        console.error(`❌ Failed: [${context}] -> ${err}`);
      }
    } catch (e) {
      console.error(`❌ Network Error in [${context}]:`, e);
    }
  }

  console.log('\n✨ Indra Hydration Complete.\n');
}

sync();
