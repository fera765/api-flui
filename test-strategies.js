const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testStrategies() {
  console.log('[STRATEGIES] Testando múltiplas estratégias...');
  
  const strategies = [
    { name: 'direct', args: ['-y', '@modelcontextprotocol/server-memory'], timeout: 45000 },
    { name: 'explicit', args: ['-y', '--package=@modelcontextprotocol/server-memory', 'server-memory'], timeout: 30000 },
  ];

  let lastError = null;
  let transport = null;
  let client = null;

  for (const strategy of strategies) {
    try {
      console.log(`[STRATEGIES] Tentando estratégia: ${strategy.name} (timeout: ${strategy.timeout}ms)`);
      console.log(`[STRATEGIES] Comando: npx ${strategy.args.join(' ')}`);
      
      transport = new StdioClientTransport({
        command: 'npx',
        args: strategy.args,
      });

      client = new Client(
        {
          name: 'test-strategies',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      await Promise.race([
        client.connect(transport),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Connection timeout after ${strategy.timeout/1000}s`)), strategy.timeout)
        )
      ]);
      
      console.log(`[STRATEGIES] ✅ Conectado com estratégia: ${strategy.name}`);
      
      const result = await client.listTools();
      console.log(`[STRATEGIES] ✅ Tools: ${result.tools.length}`);
      
      await client.close();
      console.log('[STRATEGIES] ✅ Fechado com sucesso!');
      return; // Success!
      
    } catch (error) {
      console.log(`[STRATEGIES] ❌ Estratégia ${strategy.name} falhou: ${error.message}`);
      lastError = error;
      
      // Cleanup
      if (client) {
        try { await client.close(); } catch {}
        client = null;
      }
      if (transport) {
        try { await transport.close(); } catch {}
        transport = null;
      }
      
      // Delay entre tentativas
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('[STRATEGIES] ❌ Todas estratégias falharam!');
  console.log('[STRATEGIES] Último erro:', lastError?.message);
}

testStrategies();
