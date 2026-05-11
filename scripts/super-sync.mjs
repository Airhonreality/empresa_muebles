import fs from 'fs';
import path from 'path';

const SUPABASE_URL = "https://irezvdysgqgbmmtiesxw.supabase.co";
const SUPABASE_KEY = "sb_publishable_zeChgfzgWDZmMgcC6K8gRg_9c5bDntf";
const TENANT = "empresa_muebles";

async function push() {
  console.log(`\n🌀 INICIANDO SUPER SYNC: [${TENANT}]`);
  
  const dbPath = path.join(process.cwd(), 'storage', TENANT, 'db');
  const files = fs.readdirSync(dbPath).filter(f => f.endsWith('.json'));

  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'resolution=merge-duplicates'
  };

  for (const file of files) {
    const context = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(dbPath, file), 'utf8'));
    const records = Array.isArray(content) ? content : [content];

    console.log(`\n📤 Subiendo [${context}]...`);

    const payload = records.map(item => ({
      id: item.id || `gen_${Date.now()}_${Math.random()}`,
      context: context,
      data: item.data || item,
      updated_at: new Date().toISOString()
    }));

    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/records`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log(`✅ [${context}] Sincronizado.`);
      } else {
        console.error(`❌ Error en [${context}]:`, await res.text());
      }
    } catch (e) {
      console.error(`❌ Fallo de red en [${context}]:`, e.message);
    }
  }

  console.log('\n✨ RECONSTRUCCIÓN FINALIZADA. Refresca tu navegador.');
}

push();
