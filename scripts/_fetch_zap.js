const fs = require('fs');
const https = require('https');

const url = 'https://vetadorada.netlify.app/api/vault?namespace=scripts';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const d = JSON.parse(data);
    const r = d.records.find(x => x.data.name === 'exportar_propuesta_pdf');
    fs.writeFileSync('scripts/_temp_zap_check.js', r.data.code, 'utf8');
    console.log('Written', r.data.code.length, 'bytes');
  });
});
