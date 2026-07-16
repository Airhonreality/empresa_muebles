// Fix v5 - robust dedup of const declarations
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  const getRes = await fetch(BASE + '?namespace=scripts');
  const data = await getRes.json();
  if (!data.success) throw new Error('GET failed');
  const rec = data.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Not found');

  let code = rec.data.code;

  // Find all occurrences of each const declaration
  const markers = [
    'const aplicaIva = activeCotizacion.aplica_iva',
    'const pctIva = activeCotizacion.porcentaje_iva',
    'const ivaAmount = aplicaIva',
    'const grandTotalFinal = grandTotal',
    'const ivaRow = aplicaIva'
  ];

  for (const marker of markers) {
    const firstIdx = code.indexOf(marker);
    const lastIdx = code.lastIndexOf(marker);
    if (firstIdx !== -1 && firstIdx !== lastIdx) {
      // There are duplicates - remove all but the last occurrence
      console.log('Deduping:', marker);
      
      // Find the start of each declaration (go back to previous newline)
      let searchFrom = 0;
      while (true) {
        const idx = code.indexOf(marker, searchFrom);
        if (idx === -1 || idx === lastIdx) break;
        
        // Find the start of this declaration (previous \n)
        const lineStart = code.lastIndexOf('\n', idx);
        const declStart = lineStart !== -1 ? lineStart : 0;
        
        // Find the end of this declaration (next \n after the statement ends)
        // The statement ends at a semicolon followed by a newline
        let declEnd = code.indexOf('\n', idx + marker.length);
        if (declEnd === -1) declEnd = code.length;
        
        // Remove this occurrence
        code = code.substring(0, declStart) + code.substring(declEnd);
        
        // Adjust lastIdx since we removed text
        // Reset loop
        searchFrom = 0;
      }
    }
  }

  // Also check for empty line before consolidatedCardHtml (from removing ivaRow)
  // Remove double blank lines
  code = code.replace(/\n\n\n+/g, '\n\n');

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
  
  // Verify no duplicates remain
  if (postData.success) {
    const newCode = postData.record.data.code;
    for (const marker of markers) {
      const firstIdx = newCode.indexOf(marker);
      const lastIdx = newCode.lastIndexOf(marker);
      if (firstIdx !== -1 && firstIdx !== lastIdx) {
        console.log('WARNING: still duplicate:', marker);
      }
    }
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
