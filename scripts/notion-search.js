const fs = require('fs');
const https = require('https');
const envVars = fs.readFileSync('.env.local', 'utf8').split('\n');
let apiKey = '';
for(let line of envVars) {
  if(line.startsWith('NOTION_API_KEY=')) {
    apiKey = line.split('=')[1].replace(/['"]/g, '').trim();
  }
}
if(!apiKey) { 
  console.log('ERROR: No se encontro NOTION_API_KEY en .env.local'); 
  process.exit(1); 
}

const options = {
  hostname: 'api.notion.com',
  path: '/v1/search',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + apiKey,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json'
  }
};
const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    const json = JSON.parse(body);
    const results = json.results || [];
    if(!json.results) { console.log(json); return; }
    
    const dbs = results.filter(r => r.object === 'database');
    const pages = results.filter(r => r.object === 'page');
    
    console.log('--- BASES DE DATOS ---');
    dbs.forEach(db => {
      const t = db.title?.[0]?.plain_text || 'Sin titulo';
      console.log('[DB] ' + t + ' | ID: ' + db.id);
    });
    
    console.log('\n--- PAGINAS (Muestra) ---');
    pages.slice(0, 30).forEach(p => {
        let t = 'Sin título';
        for (let prop in p.properties) {
           if (p.properties[prop].type === 'title' && p.properties[prop].title && p.properties[prop].title.length > 0) {
               t = p.properties[prop].title[0].plain_text;
               break;
           }
        }
        console.log('- ' + t + ' | ID: ' + p.id);
    });
    
    console.log('\nTotal de bases de datos: ' + dbs.length);
    console.log('Total de páginas en el Workspace: ' + pages.length);
  });
});
req.write('{}'); 
req.end();
