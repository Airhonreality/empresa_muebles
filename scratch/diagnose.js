const http = require('http');

const url = 'http://localhost:3003/create-project';

console.log(`[DIAGNOSTIC] Probing ${url}...`);

http.get(url, (res) => {
  console.log(`[STATUS] ${res.statusCode}`);
  console.log(`[HEADERS] ${JSON.stringify(res.headers, null, 2)}`);

  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('[BODY START]');
    console.log(data);
    console.log('[BODY END]');
    process.exit(0);
  });
}).on('error', (err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
