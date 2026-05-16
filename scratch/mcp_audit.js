
async function testMCP() {
  try {
    const response = await fetch('http://localhost:3000/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'GET_ALL' })
    });
    const data = await response.json();
    console.log('--- [MCP HANDSHAKE: INVENTORY] ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Fallo en el Handshake:', e.message);
  }
}

testMCP();
