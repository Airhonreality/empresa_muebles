const fs = require('fs');
const snapshot = JSON.parse(fs.readFileSync(0, 'utf8'));
const rec = snapshot.records.find(x => x.data.name === 'exportar_propuesta_pdf');
const code = rec.data.code;

// Find context around grandTotal calculation
const idx = code.indexOf('const grandTotal = baseSubtotal + opCosts + imprevistos - discount + adjustment;');
console.log('=== Context around grandTotal ===');
console.log(code.substring(Math.max(0,idx-300), idx+400));

console.log('\n\n=== Context around option-price (100 before, 200 after) ===');
const idx2 = code.indexOf('<div class="option-price">');
console.log(code.substring(Math.max(0,idx2-200), idx2+250));

console.log('\n\n=== Full totals-grand-col section ===');
const idx3 = code.indexOf('totals-grand-col');
const endIdx3 = code.indexOf('const _tpls', idx3);
console.log(code.substring(idx3-20, endIdx3 !== -1 ? endIdx3 : idx3+500));
