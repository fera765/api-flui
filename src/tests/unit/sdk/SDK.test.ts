/**
 * SDK Core Tests
 * TDD tests for SDK main functionality
 */

import { createSDK, schema, SDKError, SDKErrorCode } from '../../../../sdk/packages/core/src';
import { createFakeLogger, createMockTool } from '../../../../sdk/packages/test-utils/src';

describe('SDK Core', () => {
  describe('Initialization', () => {
    it('should create SDK with default config', () => {
      const sdk = createSDK();
      expect(sdk).toBeDefined();
      expect(sdk.getStats()).toEqual({ tools: 0, triggers: 0, total: 0 });
    });

    it('should create SDK with custom config', () => {
      const logger = createFakeLogger();
      const sdk = createSDK({
        workspaceId: 'test-workspace',
        logger,
        defaultCapabilities: ['network', 'filesystem'],
      });

      expect(sdk).toBeDefined();
    });
  });

  describe('Tool Registration', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK();
    });

    afterEach(() => {
      sdk.clear();
    });

    it('should register a valid tool', async () => {
      const tool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: schema.object({ value: schema.string() }),
        outputSchema: schema.object({ result: schema.string() }),
        handler: async (ctx: any, input: any) => ({ result: input.value }),
      };

      const result = await sdk.registerTool(tool);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should fail to register tool without name', async () => {
      const tool = {
        name: '',
        inputSchema: schema.any(),
        outputSchema: schema.any(),
        handler: async () => ({}),
      };

      const result = await sdk.registerTool(tool);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Tool name is required');
    });

    it('should fail to register duplicate tool name', async () => {
      const tool = createMockTool({ name: 'DuplicateTool' });

      await sdk.registerTool(tool);
      const result = await sdk.registerTool(tool);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('already exists');
    });

    it('should fail without input/output schemas', async () => {
      const tool: any = {
        name: 'InvalidTool',
        handler: async () => ({}),
      };

      const result = await sdk.registerTool(tool);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('schemas are required');
    });

    it('should list registered tools', async () => {
      const tool1 = createMockTool({ name: 'Tool1' });
      const tool2 = createMockTool({ name: 'Tool2' });

      await sdk.registerTool(tool1);
      await sdk.registerTool(tool2);

      const tools = await sdk.listTools();

      expect(tools).toHaveLength(2);
      expect(tools.map(t => t.name)).toContain('Tool1');
      expect(tools.map(t => t.name)).toContain('Tool2');
    });
  });

  describe('Tool Execution', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK();
    });

    afterEach(() => {
      sdk.clear();
    });

    it('should execute tool with valid input', async () => {
      const tool = {
        name: 'EchoTool',
        inputSchema: schema.object({ message: schema.string() }),
        outputSchema: schema.object({ echo: schema.string() }),
        handler: async (_ctx: any, input: any) => ({ echo: input.message }),
      };

      const regResult = await sdk.registerTool(tool);
      const execResult = await sdk.executeTool(regResult.id, { message: 'hello' });

      expect(execResult.success).toBe(true);
      expect(execResult.output).toEqual({ echo: 'hello' });
      expect(execResult.duration).toBeGreaterThan(0);
    });

    it('should fail execution with invalid input', async () => {
      const tool = {
        name: 'StrictTool',
        inputSchema: schema.object({ num: schema.number() }),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (_ctx: any, input: any) => ({ result: input.num * 2 }),
      };

      const regResult = await sdk.registerTool(tool);
      const execResult = await sdk.executeTool(regResult.id, { num: 'not-a-number' });

      expect(execResult.success).toBe(false);
      expect(execResult.error).toContain('validation');
    });

    it('should fail execution for non-existent tool', async () => {
      const execResult = await sdk.executeTool('non-existent-id', {});

      expect(execResult.success).toBe(false);
      expect(execResult.error).toContain('not found');
    });

    it('should validate output schema', async () => {
      const tool = {
        name: 'BadOutputTool',
        inputSchema: schema.object({}),
        outputSchema: schema.object({ value: schema.number() }),
        handler: async () => ({ value: 'not-a-number' }), // Wrong type
      };

      const regResult = await sdk.registerTool(tool);
      const execResult = await sdk.executeTool(regResult.id, {});

      expect(execResult.success).toBe(false);
      expect(execResult.error).toContain('validation');
    });
  });

  describe('Tool Unregistration', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK();
    });

    afterEach(() => {
      sdk.clear();
    });

    it('should unregister existing tool', async () => {
      const tool = createMockTool({ name: 'RemovableTool' });
      const regResult = await sdk.registerTool(tool);

      await sdk.unregisterTool(regResult.id);

      const tools = await sdk.listTools();
      expect(tools).toHaveLength(0);
    });

    it('should fail to unregister non-existent tool', async () => {
      await expect(sdk.unregisterTool('non-existent')).rejects.toThrow(SDKError);
      await expect(sdk.unregisterTool('non-existent')).rejects.toThrow(/not found/);
    });
  });

  describe('Trigger Registration', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK();
    });

    afterEach(() => {
      sdk.clear();
    });

    it('should register webhook trigger', async () => {
      const trigger = {
        name: 'WebhookTrigger',
        triggerType: 'webhook' as const,
        webhookConfig: {
          method: 'POST' as const,
          path: '/webhook/test',
        },
        inputSchema: schema.object({ data: schema.string() }),
        outputSchema: schema.object({}),
        handler: async () => {},
      };

      const result = await sdk.registerTrigger(trigger);

      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it('should register cron trigger', async () => {
      const trigger = {
        name: 'CronTrigger',
        triggerType: 'cron' as const,
        cronConfig: {
          schedule: '0 0 * * *',
        },
        inputSchema: schema.object({}),
        outputSchema: schema.object({}),
        handler: async () => {},
      };

      const result = await sdk.registerTrigger(trigger);

      expect(result.success).toBe(true);
    });

    it('should fail without trigger type', async () => {
      const trigger: any = {
        name: 'InvalidTrigger',
        inputSchema: schema.any(),
        outputSchema: schema.any(),
        handler: async () => {},
      };

      const result = await sdk.registerTrigger(trigger);

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('type is required');
    });

    it('should warn about missing webhook config', async () => {
      const trigger = {
        name: 'WebhookNoConfig',
        triggerType: 'webhook' as const,
        inputSchema: schema.any(),
        outputSchema: schema.any(),
        handler: async () => {},
      };

      const result = await sdk.registerTrigger(trigger);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('without configuration');
    });
  });

  describe('Plugin Loading', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK({ coreVersion: '1.0.0' });
    });

    it('should load plugin from manifest with compatible version', async () => {
      const manifest = {
        name: '@test/plugin',
        version: '1.0.0',
        entry: './dist/index.js',
        capabilities: ['network'],
        exports: [],
        coreMin: '>=1.0.0 <2.0.0',
      };

      const loaded = await sdk.loadPluginFromManifest(manifest);

      expect(loaded.name).toBe('@test/plugin');
    });

    it('should fail loading plugin with incompatible core version', async () => {
      const manifest = {
        name: '@test/plugin',
        version: '1.0.0',
        entry: './dist/index.js',
        capabilities: [],
        exports: [],
        coreMin: '>=2.0.0',
      };

      await expect(sdk.loadPluginFromManifest(manifest)).rejects.toThrow(SDKError);
      await expect(sdk.loadPluginFromManifest(manifest)).rejects.toThrow(/version/);
    });

    it('should fail loading plugin with missing capabilities', async () => {
      const manifest = {
        name: '@test/plugin',
        version: '1.0.0',
        entry: './dist/index.js',
        capabilities: ['filesystem' as const, 'spawn' as const],
        exports: [],
      };

      await expect(
        sdk.loadPluginFromManifest(manifest, { capabilities: ['network'] })
      ).rejects.toThrow(SDKError);
      await expect(
        sdk.loadPluginFromManifest(manifest, { capabilities: ['network'] })
      ).rejects.toThrow(/capability/);
    });

    it('should load plugin when capabilities are satisfied', async () => {
      const manifest = {
        name: '@test/plugin',
        version: '1.0.0',
        entry: './dist/index.js',
        capabilities: ['network' as const],
        exports: [],
      };

      const loaded = await sdk.loadPluginFromManifest(manifest, {
        capabilities: ['network', 'filesystem'],
      });

      expect(loaded.name).toBe('@test/plugin');
    });
  });

  describe('Capabilities', () => {
    let sdk: ReturnType<typeof createSDK>;

    beforeEach(() => {
      sdk = createSDK({ defaultCapabilities: ['network'] });
    });

    afterEach(() => {
      sdk.clear();
    });

    it('should execute tool with satisfied capabilities', async () => {
      const tool = {
        name: 'NetworkTool',
        capabilities: ['network' as const],
        inputSchema: schema.object({}),
        outputSchema: schema.object({ success: schema.boolean() }),
        handler: async () => ({ success: true }),
      };

      const regResult = await sdk.registerTool(tool);
      const execResult = await sdk.executeTool(regResult.id, {});

      expect(execResult.success).toBe(true);
    });

    it('should fail execution with missing capability', async () => {
      const tool = {
        name: 'FilesystemTool',
        capabilities: ['filesystem' as const],
        inputSchema: schema.object({}),
        outputSchema: schema.object({}),
        handler: async () => ({}),
      };

      const regResult = await sdk.registerTool(tool);
      const execResult = await sdk.executeTool(regResult.id, {});

      expect(execResult.success).toBe(false);
      expect(execResult.error).toContain('capability');
    });
  });
});
