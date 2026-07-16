const fs = require('fs');
const snapshot = JSON.parse(fs.readFileSync(0, 'utf8'));
const rec = snapshot.records.find(x => x.data.name === 'exportar_propuesta_pdf');
const code = rec.data.code;

function excerpt(s, max=400) { return s.length > max ? s.substring(0,max) + '...' : s; }

const m1 = code.match(/const grandTotal = .+/);
console.log('=== grandTotal line ===');
console.log(m1 ? m1[0] : 'NOT FOUND');

const m2 = code.match(/<div class="option-price">[^<]+<\//);
console.log('\n=== option-price div ===');
console.log(m2 ? m2[0] : 'NOT FOUND');

const m3 = code.match(/const (descuentoRow|ajusteRow)[^;]+/g);
console.log('\n=== descuentoRow + ajusteRow ===');
(m3||[]).forEach(r => console.log(r));

const m4 = code.match(/totals-grand-col[\s\S]{0,500}/);
console.log('\n=== totals-grand-col section ===');
console.log(m4 ? m4[0] : 'NOT FOUND');

const m5 = code.match(/Total Neto Propuesta[\s\S]{0,200}/);
console.log('\n=== Total Neto Propuesta ===');
console.log(m5 ? m5[0] : 'NOT FOUND');

const m6 = code.match(/const consolidatedCardHtml[\s\S]{0,200}/);
console.log('\n=== consolidatedCardHtml ===');
console.log(m6 ? m6[0] : 'NOT FOUND');

const m7 = code.match(/Resumen Financiero Consolidado[\s\S]{0,500}/);
console.log('\n=== Resumen Financiero Consolidado ===');
console.log(m7 ? m7[0] : 'NOT FOUND');
