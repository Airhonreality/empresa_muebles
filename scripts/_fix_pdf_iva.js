// Clean fix for PDF IVA - idempotent
const BASE = 'https://vetadorada.netlify.app/api/vault';

async function main() {
  console.log('Fetching scripts from Neon...');
  const getRes = await fetch(`${BASE}?namespace=scripts`);
  const data = await getRes.json();
  if (!data.success) throw new Error('GET failed');

  const rec = data.records.find(x => x.data.name === 'exportar_propuesta_pdf');
  if (!rec) throw new Error('Record not found');
  console.log('Found:', rec.id, '| length:', rec.data.code.length);

  let code = rec.data.code;

  // ---- STEP 1: Fix corrupted label if present ----
  // The corrupted pattern: '${aplicaIva ? \'Total con IVA:\' : \'${aplicaIva ? \'Total con IVA:\' : \'Total Neto Propuesta:\'}\'}'
  const corruptedLabel = "'${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}'";
  const correctLabel = "${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}";
  if (code.includes(corruptedLabel)) {
    code = code.replaceAll(corruptedLabel, correctLabel);
    console.log('  Fixed corrupted label');
  }

  // ---- STEP 2: Ensure IVA calculation exists ----
  const gtLine = 'const grandTotal = baseSubtotal + opCosts + imprevistos - discount + adjustment;';
  if (!code.includes(gtLine)) throw new Error('grandTotal line not found');

  const ivaVars = [
    'const aplicaIva = activeCotizacion.aplica_iva ?? false;',
    'const pctIva = activeCotizacion.porcentaje_iva ?? 19;',
    'const ivaAmount = aplicaIva ? grandTotal * (pctIva / 100) : 0;',
    'const grandTotalFinal = grandTotal + ivaAmount;'
  ];
  const ivaBlock = '\r\n' + ivaVars.join('\r\n');

  // Check if already inserted (avoid duplicate)
  if (code.includes('const aplicaIva = activeCotizacion.aplica_iva')) {
    console.log('  IVA calc already present, skipping');
  } else {
    code = code.replace(gtLine, gtLine + ivaBlock);
    console.log('  IVA calculation inserted');
  }

  // ---- STEP 3: option-price use grandTotalFinal ----
  const oldPrice = '${grandTotal.toLocaleString(\'en-US\', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}';
  const newPrice = '${grandTotalFinal.toLocaleString(\'en-US\', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}';

  // Check option-price specifically
  const opPriceIdx = code.indexOf('<div class="option-price">');
  if (opPriceIdx !== -1) {
    const opSection = code.substring(opPriceIdx, opPriceIdx + 200);
    if (opSection.includes('grandTotalFinal')) {
      console.log('  option-price already uses grandTotalFinal');
    } else {
      // Only replace within option-price section
      const before = code.substring(0, opPriceIdx);
      const after = code.substring(opPriceIdx);
      const fixed = after.replace(oldPrice, newPrice);
      code = before + fixed;
      console.log('  option-price updated');
    }
  }

  // ---- STEP 4: ivaRow variable before consolidatedCardHtml ----
  const ivaRowLines = [
    'const ivaRow = aplicaIva',
    '  ? `',
    '    <div class="final-line">',
    '      <span>IVA (${pctIva}%):</span>',
    '      <span>$ ${ivaAmount.toLocaleString(\'en-US\', { minimumFractionDigits: 2 })}</span>',
    '    </div>',
    '    ` : \'\';',
  ];
  const ivaRowStr = ivaRowLines.join('\r\n');

  const consolidatedMarker = 'const consolidatedCardHtml = `';
  if (!code.includes(consolidatedMarker)) throw new Error('consolidatedCardHtml not found');

  if (code.includes('const ivaRow = aplicaIva')) {
    console.log('  ivaRow already present, skipping');
  } else {
    code = code.replace(consolidatedMarker, ivaRowStr + '\r\n\r\n' + consolidatedMarker);
    console.log('  ivaRow added');
  }

  // ---- STEP 5: ${ivaRow} in totals-grand-col ----
  const tgcIdx = code.indexOf('totals-grand-col');
  if (tgcIdx === -1) throw new Error('totals-grand-col not found');

  const tgcSection = code.substring(tgcIdx, tgcIdx + 400);
  if (tgcSection.includes('${ivaRow}')) {
    console.log('  ${ivaRow} already in totals-grand-col');
  } else {
    // Try \r\n variant first
    let pat = '${descuentoRow}\r\n            ${ajusteRow}';
    let rep = '${descuentoRow}\r\n            ${ajusteRow}\r\n            ${ivaRow}';
    if (code.includes(pat)) {
      code = code.replace(pat, rep);
      console.log('  ${ivaRow} added (\\r\\n)');
    } else {
      pat = '${descuentoRow}\n            ${ajusteRow}';
      rep = '${descuentoRow}\n            ${ajusteRow}\n            ${ivaRow}';
      if (code.includes(pat)) {
        code = code.replace(pat, rep);
        console.log('  ${ivaRow} added (\\n)');
      } else {
        const idx = code.indexOf('${descuentoRow}');
        console.log('  DEBUG context:', JSON.stringify(code.substring(idx-2, idx+80)));
        throw new Error('Could not match pattern');
      }
    }
  }

  // ---- STEP 6: grand-total div - conditional label + grandTotalFinal ----
  const gtDivStart = code.indexOf('<div class="final-line grand-total">');
  if (gtDivStart === -1) throw new Error('grand-total div not found');

  // Find the full grand-total div (3 nested divs closing)
  let depth = 0;
  let gtDivEnd = gtDivStart;
  for (let i = gtDivStart; i < code.length; i++) {
    if (code.substring(i, i+5) === '<div ') depth++;
    if (code.substring(i, i+6) === '</div>') { depth--; if (depth < 0) { gtDivEnd = i + 6; break; } }
  }

  const oldGtDiv = code.substring(gtDivStart, gtDivEnd);
  let newGtDiv = oldGtDiv;

  // Fix grandTotal to grandTotalFinal in the display
  if (oldGtDiv.includes('grandTotalFinal')) {
    console.log('  grand-total already uses grandTotalFinal');
  } else {
    newGtDiv = newGtDiv.replace(
      '${grandTotal.toLocaleString(\'en-US\', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}',
      '${grandTotalFinal.toLocaleString(\'en-US\', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}'
    );
    console.log('  grand-total display value updated');
  }

  // Fix label - handle both corrupted and clean cases
  if (newGtDiv.includes('Total con IVA:') && newGtDiv.includes('Total Neto Propuesta:')) {
    // Already has the ternary, verify it's correct
    if (newGtDiv.includes("'${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}'")) {
      newGtDiv = newGtDiv.replace(
        "'${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}'",
        "${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}"
      );
      console.log('  Fixed corrupted label');
    } else {
      console.log('  Conditional label already correct');
    }
  } else if (newGtDiv.includes('Total Neto Propuesta:') && !newGtDiv.includes('aplicaIva')) {
    newGtDiv = newGtDiv.replace(
      'Total Neto Propuesta:',
      "${aplicaIva ? 'Total con IVA:' : 'Total Neto Propuesta:'}"
    );
    console.log('  Label set to conditional');
  } else {
    console.log('  Label already updated');
  }

  code = code.replace(oldGtDiv, newGtDiv);

  // ---- POST ----
  const payload = {
    action: "WRITE",
    namespace: "scripts",
    record: { id: rec.id, data: { name: rec.data.name, code } }
  };

  console.log('\nPosting...');
  console.log('  length:', code.length);

  const postRes = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const postData = await postRes.json();

  if (postData.success) {
    console.log('✓ POST success');
  } else {
    console.log('✗ POST failed:', JSON.stringify(postData));
    process.exit(1);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
