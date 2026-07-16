// Fix v7 - reconstruct ivaRow section surgically
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  const res = await fetch(BASE + '?namespace=scripts');
  const json = await res.json();
  if (!json.success) throw new Error('GET failed');
  const rec = json.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Not found');

  let code = rec.data.code;

  // Find the ajusteRow close and consolidatedCardHtml start
  const adjusteClose = 'Ajuste T\u00e9cnico:'; // 'Ajuste Técnico:'
  const adjIdx = code.indexOf(adjusteClose);
  if (adjIdx === -1) throw new Error('ajusteRow not found');

  // The ajusteRow template closes at the next ` : '';
  const closeIdx = code.indexOf("` : '';", adjIdx);
  if (closeIdx === -1) throw new Error('ajusteRow close not found');
  const closeEnd = closeIdx + 7; // after ` : '';

  // Find consolidatedCardHtml
  const ccIdx = code.indexOf('const consolidatedCardHtml');
  if (ccIdx === -1) throw new Error('consolidatedCardHtml not found');

  console.log('ajusteRow close ends at pos', closeEnd);
  console.log('consolidatedCardHtml at pos', ccIdx);
  console.log('Section to replace (' + (ccIdx - closeEnd) + ' chars):');

  // Build the clean ivaRow block (CRLF line endings)
  const ivaRowBlock = '\r\n\r\nconst ivaRow = aplicaIva\r\n  ? `\r\n    <div class="final-line">\r\n      <span>IVA (${pctIva}%):</span>\r\n      <span>$ ${ivaAmount.toLocaleString(\'en-US\', { minimumFractionDigits: 2 })}</span>\r\n    </div>\r\n    ` : \'\';';

  // Replace everything between closeEnd and ccIdx with the clean block
  code = code.substring(0, closeEnd) + ivaRowBlock + '\r\n\r\n' + code.substring(ccIdx);

  // Verify: only 1 ivaRow declaration
  const marker = 'const ivaRow = aplicaIva';
  const first = code.indexOf(marker);
  const last = code.lastIndexOf(marker);
  console.log('const ivaRow = aplicaIva count:', first !== -1 && first === last ? 1 : 'MULTIPLE');

  // POST
  const body = {
    action: 'WRITE',
    namespace: 'scripts',
    record: { id: rec.id, data: { name: rec.data.name, code } }
  };
  const post = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const result = await post.json();
  console.log(result.success ? 'POST success' : 'POST failed', result.success ? '' : JSON.stringify(result));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
