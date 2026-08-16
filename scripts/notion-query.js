const fs = require('fs');
const https = require('https');
const envVars = fs.readFileSync('.env.local', 'utf8').split('\n');
let apiKey = '';
for(let line of envVars) {
  if(line.startsWith('NOTION_API_KEY=')) {
    apiKey = line.split('=')[1].replace(/['"]/g, '').trim();
  }
}

function queryDB(dbId, label) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'api.notion.com',
      path: `/v1/databases/${dbId}/query`,
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
        console.log(`\n=== ESTRUCTURA DE ${label} ===`);
        if(json.results && json.results.length > 0) {
          const item = json.results[0];
          console.log("Propiedades encontradas:");
          for(let key in item.properties) {
            console.log(`- ${key}: ${item.properties[key].type}`);
          }
          console.log("\nDatos del primer item:");
          console.log(JSON.stringify(item.properties, null, 2).substring(0, 500) + '...');
        } else {
          console.log("DB vacía o sin resultados.");
          console.log(json);
        }
        resolve();
      });
    });
    req.write(JSON.stringify({ page_size: 1 })); 
    req.end();
  });
}

async function run() {
  await queryDB('18db5567-ba71-812b-a38d-ea3338d0265e', 'CLIENTES');
  await queryDB('18db5567-ba71-81b5-b07c-c4bde133ac6f', 'PROYECTOS');
}

run();
