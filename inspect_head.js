const http = require('http');

http.get('http://localhost:3000/schema', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const headMatch = data.match(/<head>([\s\S]*?)<\/head>/);
    if (headMatch) {
      console.log('--- HEAD CONTENT START ---');
      console.log(JSON.stringify(headMatch[1])); // Para ver caracteres invisibles como \n o \r
      console.log('--- HEAD CONTENT END ---');
    } else {
      console.log('No <head> tag found');
    }
    process.exit(0);
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
