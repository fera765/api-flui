import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testConnection() {
  console.log('[TS-DEBUG] Iniciando teste TypeScript...');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  });

  const client = new Client(
    {
      name: 'test-ts-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log('[TS-DEBUG] Conectando...');
    await client.connect(transport);
    console.log('[TS-DEBUG] ✅ Conectado!');
    
    const result = await client.listTools();
    console.log('[TS-DEBUG] ✅ Tools:', result.tools.length);
    
    await client.close();
    console.log('[TS-DEBUG] ✅ Sucesso!');
  } catch (error) {
    console.error('[TS-DEBUG] ❌ Erro:', error);
  }
}

testConnection();
