const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testWithTimeout() {
  console.log('[RACE-TEST] Testando com Promise.race (como no código)...');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  });

  const client = new Client(
    {
      name: 'test-race',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log('[RACE-TEST] Conectando com timeout de 45s...');
    
    // Exatamente como está no código
    await Promise.race([
      client.connect(transport),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 45s')), 45000)
      )
    ]);
    
    console.log('[RACE-TEST] ✅ Conectado!');
    
    const result = await client.listTools();
    console.log('[RACE-TEST] ✅ Tools:', result.tools.length);
    
    await client.close();
    console.log('[RACE-TEST] ✅ Sucesso!');
    
  } catch (error) {
    console.error('[RACE-TEST] ❌ Erro:', error.message);
    console.error('[RACE-TEST] Stack:', error.stack);
  }
}

testWithTimeout();
