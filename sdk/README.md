# 🚀 Automation Platform SDK

Universal TypeScript SDK for building tools, triggers, plugins, and automations.

## 📦 Packages

| Package | Description |
|---------|-------------|
| `@automation-sdk/core` | Core types, API, and runtime |
| `@automation-sdk/adapters` | HTTP, Cron, SSE adapters |
| `@automation-sdk/test-utils` | Testing utilities and mocks |
| `@automation-sdk/cli` | Command-line tools |
| `@automation-sdk/builders` | Helper builders |

## 🎯 Features

- ✅ **Type-Safe**: Full TypeScript support with generic types
- ✅ **Schema Validation**: Built-in schema system (Zod-compatible API)
- ✅ **Capability Model**: Security-first with explicit capabilities
- ✅ **Plugin System**: Dynamic loading from NPX, URL, or manifest
- ✅ **Sandbox Execution**: Isolated execution environment
- ✅ **Runtime Adapters**: HTTP, Cron, SSE, Worker
- ✅ **TDD Ready**: Comprehensive test utilities
- ✅ **Version Compatible**: Semver-based compatibility checking

---

## 🚀 Quick Start

### Installation

```bash
npm install @automation-sdk/core
```

### Create Your First Tool

```typescript
import { createSDK, schema } from '@automation-sdk/core';

// Initialize SDK
const sdk = createSDK();

// Define a tool
const greetingTool = {
  name: 'GreetingTool',
  description: 'Generates personalized greetings',
  inputSchema: schema.object({
    name: schema.string(),
    language: schema.optional(schema.string()),
  }),
  outputSchema: schema.object({
    greeting: schema.string(),
    timestamp: schema.number(),
  }),
  handler: async (ctx, input) => {
    const lang = input.language || 'en';
    const greetings: Record<string, string> = {
      en: `Hello, ${input.name}!`,
      es: `¡Hola, ${input.name}!`,
      fr: `Bonjour, ${input.name}!`,
    };
    
    ctx.logger.info(`Generating greeting for ${input.name}`);
    
    return {
      greeting: greetings[lang] || greetings.en,
      timestamp: Date.now(),
    };
  },
};

// Register the tool
const result = await sdk.registerTool(greetingTool);
console.log('Tool registered:', result.id);

// Execute the tool
const execution = await sdk.executeTool(result.id, {
  name: 'Alice',
  language: 'es',
});

console.log(execution.output); // { greeting: '¡Hola, Alice!', timestamp: ... }
```

---

## 📚 Core Concepts

### 1. Tools

Tools are reusable functions with typed inputs and outputs:

```typescript
interface ToolDefinition<I, O> {
  name: string;
  version?: string;
  description?: string;
  inputSchema: Schema<I>;
  outputSchema: Schema<O>;
  capabilities?: Capability[];
  handler: (ctx: SDKContext, input: I) => Promise<O>;
}
```

### 2. Triggers

Triggers respond to external events:

```typescript
const webhookTrigger = {
  name: 'OrderWebhook',
  triggerType: 'webhook',
  webhookConfig: {
    method: 'POST',
    path: '/webhooks/orders',
    auth: true,
  },
  inputSchema: schema.object({
    orderId: schema.string(),
    amount: schema.number(),
  }),
  outputSchema: schema.object({}),
  handler: async (ctx, input) => {
    ctx.logger.info('Order received:', input.orderId);
    // Process order...
  },
};
```

### 3. Schemas

Type-safe validation with Zod-like API:

```typescript
// Primitives
const str = schema.string();
const num = schema.number();
const bool = schema.boolean();

// Objects
const userSchema = schema.object({
  name: schema.string(),
  age: schema.number(),
  email: schema.optional(schema.string()),
});

// Arrays
const arraySchema = schema.array(schema.string());

// Union types
const unionSchema = schema.union(
  schema.literal('admin'),
  schema.literal('user')
);

// Complex nested
const complexSchema = schema.object({
  users: schema.array(userSchema),
  settings: schema.object({
    theme: schema.literal('dark'),
    notifications: schema.boolean(),
  }),
});
```

### 4. Capabilities

Security model with explicit permissions:

```typescript
const tool = {
  name: 'FileReader',
  capabilities: ['filesystem'], // Requires filesystem access
  inputSchema: schema.object({ path: schema.string() }),
  outputSchema: schema.object({ content: schema.string() }),
  handler: async (ctx, input) => {
    // Only executes if 'filesystem' capability is granted
    // ...
  },
};

// Execute with specific capabilities
await sdk.executeTool(toolId, input, {
  capabilities: {
    network: true,
    filesystem: true,
    spawn: false,
    env: false,
  },
});
```

Available capabilities:
- `network`: HTTP requests, external APIs
- `filesystem`: File read/write operations
- `spawn`: Child processes, subcommands
- `env`: Environment variable access

---

## 🔌 Adapters

### HTTP Adapter

```typescript
import { createHttpAdapter } from '@automation-sdk/adapters';

const httpAdapter = createHttpAdapter({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Authorization': 'Bearer token',
  },
});

const response = await httpAdapter.execute({
  url: '/users/123',
  method: 'GET',
});

console.log(response.data);
```

### Cron Adapter

```typescript
import { createCronAdapter } from '@automation-sdk/adapters';

const cronAdapter = createCronAdapter();

cronAdapter.schedule('daily-job', '0 0 * * *', async () => {
  console.log('Running daily job...');
});
```

---

## 🧪 Testing

### Test Utilities

```typescript
import {
  createFakeContext,
  createFakeLogger,
  createMockTool,
  assertToolExecutesAndValidatesSchema,
} from '@automation-sdk/test-utils';

describe('My Tool', () => {
  it('should process data correctly', async () => {
    const tool = {
      name: 'DataProcessor',
      inputSchema: schema.object({ value: schema.number() }),
      outputSchema: schema.object({ result: schema.number() }),
      handler: async (ctx, input) => ({ result: input.value * 2 }),
    };

    // Assert tool execution and schema validation
    await assertToolExecutesAndValidatesSchema(
      tool,
      { value: 5 },
      { result: 10 }
    );
  });

  it('should log correctly', async () => {
    const logger = createFakeLogger();
    const context = createFakeContext({ logger });

    // Use in tool handler
    // ...

    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
  });
});
```

---

## 🔧 Plugin System

### Creating a Plugin

```typescript
// plugin-manifest.ts
export const manifest = {
  name: '@acme/data-tools',
  version: '1.0.0',
  description: 'Data processing tools',
  entry: './dist/index.js',
  capabilities: ['network'],
  exports: [
    {
      type: 'tool',
      name: 'DataValidator',
    },
    {
      type: 'tool',
      name: 'DataTransformer',
    },
  ],
  coreMin: '>=1.0.0 <2.0.0',
};
```

### Loading Plugins

```typescript
// From manifest (testing/development)
const manifest = { /* ... */ };
const loaded = await sdk.loadPluginFromManifest(manifest, {
  capabilities: ['network'],
});

// From NPX (production)
// const loaded = await sdk.loadPluginFromNpx('@acme/data-tools');

// From URL (remote)
// const loaded = await sdk.loadPluginFromUrl('https://...');
```

---

## 🏗️ Architecture

### Clean Architecture Layers

```
┌─────────────────────────────────────┐
│         Applications Layer          │
│  (Examples, CLI, Integrations)      │
└─────────────────────────────────────┘
             ⬇
┌─────────────────────────────────────┐
│      Adapters & Interfaces          │
│   (HTTP, Cron, SSE, Workers)        │
└─────────────────────────────────────┘
             ⬇
┌─────────────────────────────────────┐
│         Use Cases Layer             │
│   (SDK API, Plugin Loading)         │
└─────────────────────────────────────┘
             ⬇
┌─────────────────────────────────────┐
│         Domain Layer                │
│ (Types, Schemas, Core Logic)        │
└─────────────────────────────────────┘
```

### Package Structure

```
sdk/
├── packages/
│   ├── core/           # Core types, API, runtime
│   │   ├── src/
│   │   │   ├── types.ts      # Type definitions
│   │   │   ├── schema.ts     # Schema system
│   │   │   ├── sdk.ts        # Main SDK class
│   │   │   └── index.ts      # Exports
│   │   └── package.json
│   │
│   ├── adapters/       # Runtime adapters
│   │   ├── src/
│   │   │   ├── http-adapter.ts
│   │   │   ├── cron-adapter.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── test-utils/     # Testing utilities
│   │   ├── src/
│   │   │   └── index.ts      # Mocks, helpers
│   │   └── package.json
│   │
│   └── examples/       # Usage examples
│       ├── basic-tool.ts
│       ├── webhook-trigger.ts
│       ├── http-adapter-usage.ts
│       └── plugin-manifest.ts
│
└── README.md
```

---

## 🔒 Security

### Capability-Based Security

Tools declare required capabilities upfront:

```typescript
const tool = {
  name: 'SecureTool',
  capabilities: ['network', 'filesystem'],
  // ...
};
```

At runtime, SDK verifies capabilities before execution:

```typescript
// ✅ Success: capabilities satisfied
await sdk.executeTool(id, input, {
  capabilities: {
    network: true,
    filesystem: true,
    spawn: false,
    env: false,
  },
});

// ❌ Failure: missing 'filesystem' capability
await sdk.executeTool(id, input, {
  capabilities: {
    network: true,
    filesystem: false, // ← Missing required capability
    spawn: false,
    env: false,
  },
});
```

### Sandbox Isolation

Plugins execute in isolated sandboxes:

```typescript
const sandbox = await sdk.createSandbox({
  timeout: 5000,
  memoryLimit: 512 * 1024 * 1024, // 512MB
  capabilities: ['network'],
});

try {
  const result = await sandbox.execute(code, context);
} finally {
  await sandbox.terminate();
}
```

---

## 📊 Error Handling

```typescript
import { SDKError, SDKErrorCode } from '@automation-sdk/core';

try {
  await sdk.executeTool(id, input);
} catch (error) {
  if (error instanceof SDKError) {
    switch (error.code) {
      case SDKErrorCode.TOOL_NOT_FOUND:
        console.error('Tool not found');
        break;
      case SDKErrorCode.VALIDATION_ERROR:
        console.error('Validation failed:', error.details);
        break;
      case SDKErrorCode.MISSING_CAPABILITY:
        console.error('Missing capability:', error.message);
        break;
      case SDKErrorCode.TIMEOUT:
        console.error('Execution timeout');
        break;
      default:
        console.error('Unknown error:', error);
    }
  }
}
```

Error codes:
- `INVALID_SCHEMA`
- `MISSING_CAPABILITY`
- `TOOL_NOT_FOUND`
- `EXECUTION_FAILED`
- `TIMEOUT`
- `SANDBOX_ERROR`
- `VALIDATION_ERROR`
- `PLUGIN_LOAD_ERROR`
- `COMPATIBILITY_ERROR`

---

## 🎯 Best Practices

### 1. Always Use Schemas

```typescript
// ✅ Good: Type-safe with schema validation
const tool = {
  inputSchema: schema.object({
    email: schema.string(),
    age: schema.number(),
  }),
  outputSchema: schema.object({
    valid: schema.boolean(),
  }),
  // ...
};

// ❌ Bad: No validation
const tool = {
  inputSchema: schema.any(),
  outputSchema: schema.any(),
  // ...
};
```

### 2. Declare Minimum Capabilities

```typescript
// ✅ Good: Only what's needed
capabilities: ['network']

// ❌ Bad: Over-permissive
capabilities: ['network', 'filesystem', 'spawn', 'env']
```

### 3. Use Descriptive Names

```typescript
// ✅ Good
name: 'FetchUserFromAPI'
description: 'Fetches user data from external REST API'

// ❌ Bad
name: 'tool1'
description: 'does stuff'
```

### 4. Handle Errors Gracefully

```typescript
handler: async (ctx, input) => {
  try {
    const result = await externalAPI.call(input);
    return { success: true, data: result };
  } catch (error) {
    ctx.logger.error('API call failed:', error);
    return { success: false, data: null };
  }
}
```

### 5. Test Everything

```typescript
import { assertToolExecutesAndValidatesSchema } from '@automation-sdk/test-utils';

describe('MyTool', () => {
  it('should validate schemas', async () => {
    await assertToolExecutesAndValidatesSchema(
      myTool,
      { input: 'test' },
      { output: 'expected' }
    );
  });
});
```

---

## 🆚 Comparison with N8n

| Feature | N8n | Our SDK |
|---------|-----|---------|
| **Type Safety** | ⚠️ Limited | ✅ Full TypeScript |
| **Schema Validation** | ⚠️ Basic | ✅ Advanced with types |
| **Plugin System** | ⚠️ Limited | ✅ NPX/URL/Manifest |
| **Capability Model** | ❌ No | ✅ Yes |
| **Sandbox Isolation** | ⚠️ Basic | ✅ Advanced |
| **Test Utilities** | ⚠️ Limited | ✅ Comprehensive |
| **Version Compatibility** | ⚠️ Weak | ✅ Semver-based |
| **Runtime Adapters** | ⚠️ Few | ✅ Extensible |
| **Developer Experience** | ⚠️ Good | ✅ Excellent |
| **Security** | ⚠️ Basic | ✅ Capability-based |

---

## 📖 API Reference

### SDK Class

```typescript
class SDK {
  constructor(config?: SDKConfig)
  
  // Tool management
  registerTool<I, O>(tool: ToolDefinition<I, O>): Promise<RegistrationResult>
  unregisterTool(id: UUID): Promise<void>
  listTools(): Promise<ToolMetadata[]>
  executeTool<I, O>(id: UUID, input: I, context?: Partial<SDKContext>): Promise<ExecutionResult<O>>
  
  // Trigger management
  registerTrigger<I>(trigger: TriggerDefinition<I>): Promise<RegistrationResult>
  
  // Plugin management
  loadPluginFromNpx(packageName: string, opts?: PluginLoadOpts): Promise<PluginManifest>
  loadPluginFromUrl(url: string, opts?: PluginLoadOpts): Promise<PluginManifest>
  loadPluginFromManifest(manifest: PluginManifest, opts?: PluginLoadOpts): Promise<PluginManifest>
  
  // Sandbox management
  createSandbox(opts: SandboxOptions): Promise<SandboxHandle>
  
  // Utilities
  getStats(): { tools: number; triggers: number; total: number }
  clear(): void
}
```

### Schema Builders

```typescript
schema.string(): Schema<string>
schema.number(): Schema<number>
schema.boolean(): Schema<boolean>
schema.object<T>(shape: Record<keyof T, Schema>): Schema<T>
schema.array<T>(itemSchema: Schema<T>): Schema<T[]>
schema.optional<T>(schema: Schema<T>): Schema<T | undefined>
schema.any(): Schema<any>
schema.literal<T>(value: T): Schema<T>
schema.union<T>(...schemas: Schema[]): Schema<T>
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🌟 Examples

Check out the `/packages/examples` directory for more examples:
- Basic tool creation
- Webhook triggers
- HTTP adapter usage
- Plugin manifests
- Advanced use cases

---

## 🚀 Roadmap

- [ ] CLI tooling (`sdk init`, `sdk build`, `sdk pack`)
- [ ] SSE adapter
- [ ] Worker thread adapter
- [ ] Plugin marketplace
- [ ] Visual plugin builder
- [ ] Hot reload for development
- [ ] Performance monitoring
- [ ] Plugin signing and verification

---

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/automation-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/automation-sdk/discussions)
- **Docs**: [Documentation](https://docs.automation-sdk.dev)

---

**Built with ❤️ for the automation community**
