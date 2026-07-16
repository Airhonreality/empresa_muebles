// Fix v6 - add ivaRow back where it was removed
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  const getRes = await fetch(BASE + '?namespace=scripts');
  const data = await getRes.json();
  if (!data.success) throw new Error('GET failed');
  const rec = data.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Not found');

  let code = rec.data.code;

  // Find where to inject ivaRow: after ajusteRow declaration, before consolidatedCardHtml
  const marker = "` : '';\r\n\r\nconst consolidatedCardHtml = `";
  if (!code.includes(marker)) {
    console.log('CRLF marker not found, trying LF variant...');
    const markerLf = "` : '';\n\nconst consolidatedCardHtml = `";
    if (code.includes(markerLf)) {
      console.log('Using LF marker');
      const ivaRowCode = "` : '';\n\nconst ivaRow = aplicaIva\n  ? `\n    <div class=\"final-line\">\n      <span>IVA (${pctIva}%):</span>\n      <span>$ ${ivaAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>\n    </div>\n    ` : '';\n\nconst consolidatedCardHtml = `";
      code = code.replace(markerLf, ivaRowCode);
    } else {
      // Debug
      const idx = code.indexOf('consolidatedCardHtml');
      console.log('Context pre-consolidated:', JSON.stringify(code.substring(idx-100, idx)));
      throw new Error('Cannot find insertion point');
    }
  } else {
    console.log('Using CRLF marker');
    const ivaRowCode = "` : '';\r\n\r\nconst ivaRow = aplicaIva\r\n  ? `\r\n    <div class=\"final-line\">\r\n      <span>IVA (${pctIva}%):</span>\r\n      <span>$ ${ivaAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>\r\n    </div>\r\n    ` : '';\r\n\r\nconst consolidatedCardHtml = `";
    code = code.replace(marker, ivaRowCode);
  }

  // POST
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
  console.log(postData.success ? 'POST success' : 'POST failed');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
