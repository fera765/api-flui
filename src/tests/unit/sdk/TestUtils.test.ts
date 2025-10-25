/**
 * Test Utils Tests
 * Tests for SDK test utilities
 */

import {
  createFakeLogger,
  createFakeSandbox,
  createFakeContext,
  mockPluginManifest,
  mockPluginBundle,
  assertToolExecutesAndValidatesSchema,
  createMockTool,
} from '../../../../sdk/packages/test-utils/src';
import { schema } from '../../../../sdk/packages/core/src';

describe('Test Utils', () => {
  describe('createFakeLogger', () => {
    it('should create logger that captures logs', () => {
      const logger = createFakeLogger() as any;

      logger.info('test message', { meta: 'data' });
      logger.error('error message');

      const logs = logger.getLogs();

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual({
        level: 'info',
        message: 'test message',
        meta: [{ meta: 'data' }],
      });
    });

    it('should support all log levels', () => {
      const logger = createFakeLogger() as any;

      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(4);
      expect(logs.map((l: any) => l.level)).toEqual(['debug', 'info', 'warn', 'error']);
    });
  });

  describe('createFakeSandbox', () => {
    it('should create sandbox with id', () => {
      const sandbox = createFakeSandbox({});
      expect(sandbox.id).toBeDefined();
    });

    it('should execute with custom mock', async () => {
      const sandbox = createFakeSandbox({
        mockExecute: async <T>(_code: string, _context?: any): Promise<T> => {
          return 'mocked result' as T;
        },
      });

      const result = await sandbox.execute<string>('code');
      expect(result).toBe('mocked result');
    });

    it('should terminate without error', async () => {
      const sandbox = createFakeSandbox({});
      await expect(sandbox.terminate()).resolves.toBeUndefined();
    });
  });

  describe('createFakeContext', () => {
    it('should create default context', () => {
      const context = createFakeContext();

      expect(context.workspaceId).toBe('test-workspace');
      expect(context.logger).toBeDefined();
      expect(context.capabilities).toBeDefined();
      expect(context.capabilities.network).toBe(true);
    });

    it('should allow overrides', () => {
      const context = createFakeContext({
        workspaceId: 'custom',
        capabilities: {
          network: false,
          filesystem: true,
          spawn: true,
          env: false,
        },
      });

      expect(context.workspaceId).toBe('custom');
      expect(context.capabilities.filesystem).toBe(true);
    });

    it('should support spawnSandbox', async () => {
      const context = createFakeContext();
      const sandbox = await context.spawnSandbox!({ capabilities: ['network'] });

      expect(sandbox).toBeDefined();
      expect(sandbox.id).toBeDefined();
    });
  });

  describe('mockPluginManifest', () => {
    it('should create default manifest', () => {
      const manifest = mockPluginManifest();

      expect(manifest.name).toBe('@test/mock-plugin');
      expect(manifest.version).toBe('1.0.0');
      expect(manifest.exports).toHaveLength(1);
    });

    it('should allow overrides', () => {
      const manifest = mockPluginManifest({
        name: '@custom/plugin',
        version: '2.0.0',
        capabilities: ['filesystem', 'network'],
      });

      expect(manifest.name).toBe('@custom/plugin');
      expect(manifest.version).toBe('2.0.0');
      expect(manifest.capabilities).toContain('filesystem');
    });
  });

  describe('mockPluginBundle', () => {
    it('should create bundle with manifest and handlers', () => {
      const manifest = mockPluginManifest();
      const handlers = {
        MockTool: async () => ({ success: true }),
      };

      const bundle = mockPluginBundle(manifest, handlers);

      expect(bundle.manifest).toEqual(manifest);
      expect(bundle.handlers.MockTool).toBeDefined();
    });
  });

  describe('assertToolExecutesAndValidatesSchema', () => {
    it('should pass for valid tool execution', async () => {
      const tool = {
        name: 'Test',
        inputSchema: schema.object({ value: schema.number() }),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (_ctx: any, input: any) => ({ result: input.value * 2 }),
      };

      await expect(
        assertToolExecutesAndValidatesSchema(tool, { value: 5 }, { result: 10 })
      ).resolves.toBeUndefined();
    });

    it('should fail for invalid input', async () => {
      const tool = {
        name: 'Test',
        inputSchema: schema.object({ value: schema.number() }),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (_ctx: any, input: any) => ({ result: input.value }),
      };

      await expect(
        assertToolExecutesAndValidatesSchema(tool, { value: 'not-number' })
      ).rejects.toThrow(/validation failed/);
    });

    it('should fail for invalid output', async () => {
      const tool = {
        name: 'Test',
        inputSchema: schema.object({}),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (): Promise<any> => ({ result: 'not-number' }),
      };

      await expect(
        assertToolExecutesAndValidatesSchema(tool, {})
      ).rejects.toThrow(/validation failed/);
    });

    it('should fail on output mismatch', async () => {
      const tool = {
        name: 'Test',
        inputSchema: schema.object({}),
        outputSchema: schema.object({ value: schema.number() }),
        handler: async () => ({ value: 10 }),
      };

      await expect(
        assertToolExecutesAndValidatesSchema(tool, {}, { value: 20 })
      ).rejects.toThrow(/mismatch/);
    });
  });

  describe('createMockTool', () => {
    it('should create default mock tool', () => {
      const tool = createMockTool();

      expect(tool.name).toBe('MockTool');
      expect(tool.inputSchema).toBeDefined();
      expect(tool.outputSchema).toBeDefined();
      expect(tool.handler).toBeDefined();
    });

    it('should allow overrides', () => {
      const tool = createMockTool({
        name: 'CustomTool',
        description: 'Custom description',
        capabilities: ['network'],
      });

      expect(tool.name).toBe('CustomTool');
      expect(tool.description).toBe('Custom description');
      expect(tool.capabilities).toContain('network');
    });
  });
});
