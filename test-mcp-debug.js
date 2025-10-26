const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testConnection() {
  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] Testando conexão com MCP');
  console.log('[DEBUG] ========================================');
  console.log('');
  
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
  });

  const client = new Client(
    {
      name: 'test-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    console.log('[DEBUG] 1. Conectando ao MCP via stdio...');
    console.log('[DEBUG]    Command: npx -y @modelcontextprotocol/server-memory');
    
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout after 30s')), 30000)
    );
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('[DEBUG] ✅ Conectado com sucesso!');
    console.log('');
    
    console.log('[DEBUG] 2. Listando ferramentas...');
    const result = await client.listTools();
    console.log('[DEBUG] ✅ Ferramentas encontradas:', result.tools.length);
    console.log('');
    
    console.log('[DEBUG] 3. Detalhes das ferramentas:');
    result.tools.forEach((tool, i) => {
      console.log(`[DEBUG]    ${i+1}. ${tool.name}`);
      console.log(`[DEBUG]       Descrição: ${tool.description?.substring(0, 60)}...`);
    });
    console.log('');
    
    console.log('[DEBUG] 4. Fechando conexão...');
    await client.close();
    console.log('[DEBUG] ✅ Conexão fechada!');
    console.log('');
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] ✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('[DEBUG] ========================================');
    
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('[DEBUG] ========================================');
    console.error('[DEBUG] ❌ ERRO DURANTE O TESTE');
    console.error('[DEBUG] ========================================');
    console.error('[DEBUG] Mensagem:', error.message);
    console.error('[DEBUG] Tipo:', error.constructor.name);
    if (error.stack) {
      console.error('[DEBUG] Stack:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

testConnection();
