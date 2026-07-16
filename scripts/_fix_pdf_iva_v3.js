// Clean fix v3 - single-quoted strings to avoid interpolation
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  const getRes = await fetch(BASE + '?namespace=scripts');
  const data = await getRes.json();
  if (!data.success) throw new Error('GET failed');
  const rec = data.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Not found');

  let code = rec.data.code;

  // Using single-quoted strings to avoid template literal interpolation
  const corrupted = '${aplicaIva ? \'Total con IVA:\' : ${aplicaIva ? \'Total con IVA:\' : \'Total Neto Propuesta:\'}}';
  const clean = '${aplicaIva ? \'Total con IVA:\' : \'Total Neto Propuesta:\'}';

  if (code.includes(corrupted)) {
    code = code.replaceAll(corrupted, clean);
    console.log('Fixed corrupted label');
  } else {
    // Debug: check what's there
    const idx = code.indexOf('aplicaIva ?');
    if (idx > -1) {
      const ctx = code.substring(Math.max(0, idx - 10), idx + 150);
      console.log('Context around aplicaIva:', JSON.stringify(ctx));
    } else {
      console.log('aplicaIva ? not found in code');
    }
    throw new Error('Corrupted pattern not found');
  }

  const payload = {
    action: 'WRITE',
    namespace: 'scripts',
    record: { id: rec.id, data: { name: rec.data.name, code: code } }
  };
  const postRes = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const postData = await postRes.json();
  console.log(postData.success ? 'POST success' : 'POST failed', JSON.stringify(postData));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
