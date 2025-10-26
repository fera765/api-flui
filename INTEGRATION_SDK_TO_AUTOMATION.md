# 🔗 Integração SDK → Automação

Guia completo de como adicionar uma tool criada com o SDK no fluxo de automação.

---

## 📋 Processo de Integração

```
┌─────────────────────┐
│  1. Criar Tool      │
│  usando SDK         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  2. Registrar no    │
│  SystemTool         │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  3. Adicionar em    │
│  Automação (Node)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  4. Executar        │
│  Automação          │
└─────────────────────┘
```

---

## 🚀 Passo a Passo Completo

### Passo 1: Criar Tool com SDK

```typescript
// tools/my-custom-tool.ts
import { createSDK, schema } from '../sdk/packages/core/src';

const sdk = createSDK();

// Definir a tool com SDK
export const emailValidatorTool = {
  name: 'EmailValidator',
  description: 'Validates email addresses and extracts domain',
  version: '1.0.0',
  
  // Schema de entrada (tipado)
  inputSchema: schema.object({
    email: schema.string(),
    checkDNS: schema.optional(schema.boolean()),
  }),
  
  // Schema de saída (tipado)
  outputSchema: schema.object({
    valid: schema.boolean(),
    email: schema.string(),
    domain: schema.string(),
    dnsValid: schema.optional(schema.boolean()),
  }),
  
  // Capabilities necessárias
  capabilities: ['network' as const], // Para DNS check
  
  // Handler da tool
  handler: async (ctx, input) => {
    ctx.logger.info('Validating email:', input.email);
    
    // Validação básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const valid = emailRegex.test(input.email);
    
    // Extrair domínio
    const domain = input.email.split('@')[1] || '';
    
    // DNS check (se solicitado)
    let dnsValid: boolean | undefined;
    if (input.checkDNS && valid) {
      // Simular check DNS
      dnsValid = domain.length > 0;
    }
    
    return {
      valid,
      email: input.email,
      domain,
      dnsValid,
    };
  },
};

// Registrar no SDK
export async function registerEmailValidator() {
  const result = await sdk.registerTool(emailValidatorTool);
  console.log('Tool registered:', result.id);
  return result;
}
```

### Passo 2: Converter para SystemTool

Criar um adapter que converte SDK Tool → SystemTool:

```typescript
// adapters/sdk-to-system-tool.ts
import { SystemTool, ToolType } from '@modules/core/domain/SystemTool';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { createSDK } from '../sdk/packages/core/src';

/**
 * Adapter que converte SDK Tool para SystemTool
 */
export class SDKToolAdapter {
  private sdk = createSDK();
  private toolRepository = new SystemToolRepositoryInMemory();
  private sdkToSystemMap = new Map<string, string>(); // sdkId → systemId

  /**
   * Registra uma SDK Tool e cria um SystemTool correspondente
   */
  async registerSDKTool(sdkTool: any): Promise<{ sdkId: string; systemId: string }> {
    // 1. Registrar no SDK
    const sdkResult = await this.sdk.registerTool(sdkTool);
    
    if (!sdkResult.success) {
      throw new Error(`Failed to register SDK tool: ${sdkResult.errors?.join(', ')}`);
    }

    // 2. Criar SystemTool wrapper
    const systemTool = new SystemTool({
      id: sdkResult.id, // Usar mesmo ID para simplificar
      name: sdkTool.name,
      description: sdkTool.description,
      type: ToolType.ACTION,
      config: {
        sdkToolId: sdkResult.id,
        capabilities: sdkTool.capabilities || [],
      },
      inputSchema: {
        type: 'object',
        properties: this.convertSchemaToJSONSchema(sdkTool.inputSchema),
      },
      outputSchema: {
        type: 'object',
        properties: this.convertSchemaToJSONSchema(sdkTool.outputSchema),
      },
      // Executor que chama o SDK
      executor: async (input: any) => {
        const result = await this.sdk.executeTool(sdkResult.id, input);
        
        if (!result.success) {
          throw new Error(result.error || 'SDK tool execution failed');
        }
        
        return result.output;
      },
    });

    // 3. Salvar no repository
    await this.toolRepository.create({
      name: systemTool.getName(),
      type: systemTool.getType(),
      description: systemTool.getDescription(),
      config: systemTool.getConfig(),
    });

    // 4. Mapear IDs
    this.sdkToSystemMap.set(sdkResult.id, systemTool.getId());

    return {
      sdkId: sdkResult.id,
      systemId: systemTool.getId(),
    };
  }

  /**
   * Converte schema do SDK para JSON Schema (simplificado)
   */
  private convertSchemaToJSONSchema(sdkSchema: any): any {
    // Simplificação - em produção, implementar conversão completa
    return {};
  }

  /**
   * Busca SystemTool pelo SDK Tool ID
   */
  async getSystemToolBySdkId(sdkId: string): Promise<SystemTool | null> {
    const systemId = this.sdkToSystemMap.get(sdkId);
    if (!systemId) return null;
    
    return await this.toolRepository.findById(systemId);
  }

  /**
   * Lista todas as tools registradas
   */
  async listTools(): Promise<Array<{ sdkId: string; systemId: string; name: string }>> {
    const sdkTools = await this.sdk.listTools();
    return sdkTools.map(tool => ({
      sdkId: tool.id,
      systemId: this.sdkToSystemMap.get(tool.id) || tool.id,
      name: tool.name,
    }));
  }

  getSDK() {
    return this.sdk;
  }

  getRepository() {
    return this.toolRepository;
  }
}
```

### Passo 3: Usar na Automação

```typescript
// examples/automation-with-sdk-tool.ts
import { SDKToolAdapter } from './adapters/sdk-to-system-tool';
import { emailValidatorTool } from './tools/my-custom-tool';
import { Automation, NodeType } from '@modules/core/domain/Automation';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';

async function createAutomationWithSDKTool() {
  // 1. Setup adapter
  const adapter = new SDKToolAdapter();

  // 2. Registrar SDK tool
  const { systemId } = await adapter.registerSDKTool(emailValidatorTool);
  console.log('✅ Tool registered with ID:', systemId);

  // 3. Criar automação
  const automationRepo = new AutomationRepositoryInMemory();
  
  const automation = await automationRepo.create({
    name: 'Email Validation Flow',
    description: 'Validates emails using SDK tool',
    nodes: [
      {
        id: 'node-1',
        type: NodeType.TRIGGER,
        referenceId: 'manual-trigger',
        config: {},
      },
      {
        id: 'node-2',
        type: NodeType.TOOL,
        referenceId: systemId, // ← SDK Tool como node
        config: {
          inputMapping: {
            email: '{{trigger.email}}',
            checkDNS: true,
          },
        },
      },
      {
        id: 'node-3',
        type: NodeType.TOOL,
        referenceId: 'log-tool',
        config: {
          message: 'Email {{node-2.email}} is {{node-2.valid ? "valid" : "invalid"}}',
        },
      },
    ],
    links: [
      {
        id: 'link-1',
        fromNodeId: 'node-1',
        toNodeId: 'node-2',
      },
      {
        id: 'link-2',
        fromNodeId: 'node-2',
        toNodeId: 'node-3',
      },
    ],
  });

  console.log('✅ Automation created:', automation.getId());

  return { automation, adapter };
}

// Executar
createAutomationWithSDKTool().then(({ automation, adapter }) => {
  console.log('✅ Ready! Automation ID:', automation.getId());
  console.log('✅ Available tools:', adapter.listTools());
});
```

### Passo 4: Executar a Automação

```typescript
// examples/execute-automation-with-sdk-tool.ts
import { AutomationExecutor } from '@modules/core/services/automation/AutomationExecutor';
import { SDKToolAdapter } from './adapters/sdk-to-system-tool';
import { emailValidatorTool } from './tools/my-custom-tool';

async function executeAutomationWithSDKTool() {
  // 1. Setup
  const adapter = new SDKToolAdapter();
  const { systemId } = await adapter.registerSDKTool(emailValidatorTool);

  // 2. Criar executor
  const executor = new AutomationExecutor(
    adapter.getRepository(), // SystemToolRepository
    null as any, // AgentRepository (não usado neste exemplo)
  );

  // 3. Executar com input
  const result = await executor.execute('automation-id', {
    trigger: {
      email: 'user@example.com',
    },
  });

  console.log('✅ Execution result:', result);
  console.log('Email validation:', result.outputs['node-2']);
  
  return result;
}
```

---

## 🎯 Exemplo Completo End-to-End

### 1. Criar Multiple SDK Tools

```typescript
// tools/sdk-tools-library.ts
import { schema } from '../sdk/packages/core/src';

// Tool 1: Email Validator
export const emailValidatorTool = {
  name: 'EmailValidator',
  inputSchema: schema.object({
    email: schema.string(),
  }),
  outputSchema: schema.object({
    valid: schema.boolean(),
    domain: schema.string(),
  }),
  handler: async (ctx, input) => {
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email);
    const domain = input.email.split('@')[1] || '';
    return { valid, domain };
  },
};

// Tool 2: Text Analyzer
export const textAnalyzerTool = {
  name: 'TextAnalyzer',
  inputSchema: schema.object({
    text: schema.string(),
  }),
  outputSchema: schema.object({
    wordCount: schema.number(),
    charCount: schema.number(),
    sentenceCount: schema.number(),
  }),
  handler: async (ctx, input) => {
    const wordCount = input.text.split(/\s+/).length;
    const charCount = input.text.length;
    const sentenceCount = input.text.split(/[.!?]+/).length - 1;
    return { wordCount, charCount, sentenceCount };
  },
};

// Tool 3: Data Transformer
export const dataTransformerTool = {
  name: 'DataTransformer',
  inputSchema: schema.object({
    data: schema.array(schema.object({
      name: schema.string(),
      value: schema.number(),
    })),
    operation: schema.literal('sum'),
  }),
  outputSchema: schema.object({
    result: schema.number(),
    itemCount: schema.number(),
  }),
  handler: async (ctx, input) => {
    const sum = input.data.reduce((acc, item) => acc + item.value, 0);
    return { result: sum, itemCount: input.data.length };
  },
};
```

### 2. Service para Gerenciar SDK Tools

```typescript
// services/SDKToolService.ts
import { SDKToolAdapter } from '../adapters/sdk-to-system-tool';
import { SystemTool } from '@modules/core/domain/SystemTool';

export class SDKToolService {
  private adapter = new SDKToolAdapter();
  private registeredTools = new Map<string, { sdkId: string; systemId: string }>();

  /**
   * Registra múltiplas SDK tools de uma vez
   */
  async registerTools(tools: any[]): Promise<void> {
    for (const tool of tools) {
      const ids = await this.adapter.registerSDKTool(tool);
      this.registeredTools.set(tool.name, ids);
      console.log(`✅ Registered: ${tool.name} (${ids.systemId})`);
    }
  }

  /**
   * Busca tool pelo nome
   */
  async getToolByName(name: string): Promise<SystemTool | null> {
    const ids = this.registeredTools.get(name);
    if (!ids) return null;
    
    return await this.adapter.getSystemToolBySdkId(ids.sdkId);
  }

  /**
   * Lista todas as tools disponíveis
   */
  async listAllTools(): Promise<Array<{ name: string; id: string; type: string }>> {
    const tools = await this.adapter.listTools();
    return tools.map(tool => ({
      name: tool.name,
      id: tool.systemId,
      type: 'sdk-tool',
    }));
  }

  /**
   * Executa tool diretamente
   */
  async executeTool(toolName: string, input: any): Promise<any> {
    const tool = await this.getToolByName(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }

    const executor = tool.getExecutor();
    return await executor(input);
  }
}
```

### 3. Exemplo de Uso Completo

```typescript
// examples/complete-sdk-integration.ts
import { SDKToolService } from '../services/SDKToolService';
import { emailValidatorTool, textAnalyzerTool, dataTransformerTool } from '../tools/sdk-tools-library';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';

async function completeExample() {
  console.log('🚀 Starting complete SDK integration example...\n');

  // 1. Setup service
  const sdkService = new SDKToolService();

  // 2. Register all SDK tools
  console.log('📦 Registering SDK tools...');
  await sdkService.registerTools([
    emailValidatorTool,
    textAnalyzerTool,
    dataTransformerTool,
  ]);

  // 3. List available tools
  console.log('\n📋 Available tools:');
  const tools = await sdkService.listAllTools();
  tools.forEach(tool => {
    console.log(`  - ${tool.name} (${tool.id})`);
  });

  // 4. Test individual tool execution
  console.log('\n🧪 Testing EmailValidator...');
  const emailResult = await sdkService.executeTool('EmailValidator', {
    email: 'test@example.com',
  });
  console.log('  Result:', emailResult);

  // 5. Create automation using SDK tools
  console.log('\n🔧 Creating automation with SDK tools...');
  const automationRepo = new AutomationRepositoryInMemory();
  
  const emailTool = await sdkService.getToolByName('EmailValidator');
  const textTool = await sdkService.getToolByName('TextAnalyzer');

  const automation = await automationRepo.create({
    name: 'SDK Tools Pipeline',
    description: 'Uses multiple SDK tools in sequence',
    nodes: [
      {
        id: 'trigger',
        type: NodeType.TRIGGER,
        referenceId: 'webhook',
        config: {},
      },
      {
        id: 'validate-email',
        type: NodeType.TOOL,
        referenceId: emailTool!.getId(),
        config: {
          inputMapping: {
            email: '{{trigger.email}}',
          },
        },
      },
      {
        id: 'analyze-text',
        type: NodeType.TOOL,
        referenceId: textTool!.getId(),
        config: {
          inputMapping: {
            text: '{{trigger.message}}',
          },
        },
      },
    ],
    links: [
      {
        id: 'link-1',
        fromNodeId: 'trigger',
        toNodeId: 'validate-email',
      },
      {
        id: 'link-2',
        fromNodeId: 'validate-email',
        toNodeId: 'analyze-text',
      },
    ],
  });

  console.log('✅ Automation created:', automation.getName());
  console.log('   ID:', automation.getId());
  console.log('   Nodes:', automation.getNodes().length);

  return { sdkService, automation };
}

// Run example
completeExample()
  .then(({ sdkService, automation }) => {
    console.log('\n✅ Complete SDK integration successful!');
    console.log('   Tools available:', sdkService.listAllTools().length);
    console.log('   Automation ready for execution');
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
```

---

## 📊 Fluxo de Dados

```
┌─────────────┐
│ SDK Tool    │
│ Definition  │
└──────┬──────┘
       │
       │ registerSDKTool()
       ▼
┌─────────────┐
│ SDK         │
│ Registry    │
└──────┬──────┘
       │
       │ wrap in SystemTool
       ▼
┌─────────────┐
│ SystemTool  │
│ Repository  │
└──────┬──────┘
       │
       │ add to Automation Node
       ▼
┌─────────────┐
│ Automation  │
│ (with Node) │
└──────┬──────┘
       │
       │ execute()
       ▼
┌─────────────┐
│ Automation  │
│ Executor    │
└──────┬──────┘
       │
       │ executeNode()
       ▼
┌─────────────┐
│ SDK Tool    │
│ Handler     │
└─────────────┘
```

---

## 🎯 Checklist de Integração

- [ ] **Criar SDK Tool**
  - [ ] Definir inputSchema
  - [ ] Definir outputSchema
  - [ ] Implementar handler
  - [ ] Declarar capabilities
  - [ ] Testar isoladamente

- [ ] **Registrar no Sistema**
  - [ ] Usar SDKToolAdapter
  - [ ] Registrar no SDK
  - [ ] Criar SystemTool wrapper
  - [ ] Salvar no repository

- [ ] **Adicionar na Automação**
  - [ ] Criar node com referenceId da tool
  - [ ] Configurar inputMapping
  - [ ] Adicionar links entre nodes

- [ ] **Testar Execução**
  - [ ] Testar tool isolada
  - [ ] Testar em automação
  - [ ] Validar input/output
  - [ ] Verificar erros

---

## 💡 Boas Práticas

### 1. Sempre Validar Schemas

```typescript
// ✅ Bom
inputSchema: schema.object({
  email: schema.string(),
  options: schema.optional(schema.object({
    checkDNS: schema.boolean(),
  })),
})

// ❌ Ruim
inputSchema: schema.any()
```

### 2. Documentar Capabilities

```typescript
// ✅ Bom
{
  capabilities: ['network'], // Explícito
  handler: async (ctx, input) => {
    // Usa network para DNS check
  }
}
```

### 3. Error Handling

```typescript
// ✅ Bom
handler: async (ctx, input) => {
  try {
    const result = await externalAPI.call(input);
    return { success: true, data: result };
  } catch (error) {
    ctx.logger.error('API failed:', error);
    return { success: false, error: error.message };
  }
}
```

### 4. Logging

```typescript
// ✅ Bom
handler: async (ctx, input) => {
  ctx.logger.info('Processing:', input.id);
  const result = process(input);
  ctx.logger.info('Completed:', result.id);
  return result;
}
```

---

## 🚀 Resultado Final

Depois de seguir este guia, você terá:

1. ✅ SDK Tool criada e testada
2. ✅ Tool registrada no sistema
3. ✅ Tool disponível em automações
4. ✅ Automação executável
5. ✅ Type-safe end-to-end
6. ✅ Validação automática

**Sua SDK Tool agora está integrada no fluxo de automação!** 🎉
