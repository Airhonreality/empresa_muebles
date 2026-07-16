// Fix v4 - remove duplicate const declarations from mixed line-ending runs
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  const getRes = await fetch(BASE + '?namespace=scripts');
  const data = await getRes.json();
  if (!data.success) throw new Error('GET failed');
  const rec = data.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Not found');

  let code = rec.data.code;

  // Pattern 1: Duplicate IVA calculation (LF variant followed by CRLF variant)
  // Remove: \nconst aplicaIva = activeCotizacion.aplica_iva ?? false;\nconst pctIva...\nconst grandTotalFinal = grandTotal + ivaAmount;
  const dupCalc = '\nconst aplicaIva = activeCotizacion.aplica_iva ?? false;\nconst pctIva = activeCotizacion.porcentaje_iva ?? 19;\nconst ivaAmount = aplicaIva ? grandTotal * (pctIva / 100) : 0;\nconst grandTotalFinal = grandTotal + ivaAmount;';
  if (code.includes(dupCalc)) {
    code = code.replace(dupCalc, '');
    console.log('Removed duplicate IVA calc block (LF variant)');
  }

  // Pattern 2: Duplicate ivaRow (LF variant)
  const dupIvaRow = '\nconst ivaRow = aplicaIva\n  ? `\n    <div class="final-line">\n      <span>IVA (${pctIva}%):</span>\n      <span>$ ${ivaAmount.toLocaleString(\'en-US\', { minimumFractionDigits: 2 })}</span>\n    </div>\n    ` : \'\';';
  if (code.includes(dupIvaRow)) {
    // Be careful - only remove the first occurrence (the dup), not the real one
    const idx = code.indexOf(dupIvaRow);
    // Check if there's another ivaRow after this one
    const afterDup = code.substring(idx + dupIvaRow.length);
    if (afterDup.includes('const ivaRow = aplicaIva')) {
      code = code.replace(dupIvaRow, '');
      console.log('Removed duplicate ivaRow (LF variant)');
    } else {
      console.log('Only one ivaRow found, not removing');
    }
  }

  // Verify no duplicate const declarations
  const decls = ['aplicaIva', 'pctIva', 'ivaAmount', 'grandTotalFinal', 'ivaRow'];
  for (const d of decls) {
    const re = new RegExp('const ' + d + ' =', 'g');
    const matches = code.match(re);
    if (matches && matches.length > 1) {
      console.warn('WARNING: ' + d + ' has ' + matches.length + ' declarations');
    }
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
  console.log(postData.success ? 'POST success' : 'POST failed', JSON.stringify(postData));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
