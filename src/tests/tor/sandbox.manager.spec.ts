/**
 * Sandbox Manager Tests
 */

import { SandboxManager } from '../../modules/tools/infra/sandbox/SandboxManager';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('SandboxManager', () => {
  let manager: SandboxManager;
  let tempDir: string;

  beforeEach(async () => {
    manager = new SandboxManager();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sandbox-test-'));
  });

  afterEach(async () => {
    await manager.cleanup();
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  describe('createSandbox()', () => {
    it('should create a sandbox', async () => {
      const sandboxId = await manager.createSandbox({
        toolId: 'tool-123',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      expect(sandboxId).toBeDefined();
      expect(typeof sandboxId).toBe('string');

      const sandboxes = manager.listSandboxes();
      expect(sandboxes).toHaveLength(1);
      expect(sandboxes[0].id).toBe(sandboxId);
    });

    it('should create multiple sandboxes', async () => {
      const sandbox1 = await manager.createSandbox({
        toolId: 'tool-1',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      const sandbox2 = await manager.createSandbox({
        toolId: 'tool-2',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      expect(sandbox1).not.toBe(sandbox2);

      const sandboxes = manager.listSandboxes();
      expect(sandboxes).toHaveLength(2);
    });
  });

  describe('execute()', () => {
    it('should execute code in sandbox', async () => {
      const sandboxId = await manager.createSandbox({
        toolId: 'tool-123',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      const result = await manager.execute(sandboxId, {
        functionName: 'handler',
        input: { test: 'data' },
      });

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should fail when sandbox not found', async () => {
      const result = await manager.execute('non-existent-sandbox', {
        input: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should include execution duration', async () => {
      const sandboxId = await manager.createSandbox({
        toolId: 'tool-123',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      const result = await manager.execute(sandboxId, {
        input: {},
      });

      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('executeTool()', () => {
    it('should execute tool directly', async () => {
      // Create a mock tool file
      const toolPath = path.join(tempDir, 'dist');
      await fs.mkdir(toolPath, { recursive: true });
      await fs.writeFile(
        path.join(toolPath, 'index.js'),
        'module.exports.handler = async () => ({ result: "test" });'
      );

      const result = await manager.executeTool(
        tempDir,
        'dist/index.js',
        { test: 'input' },
        ['network'],
        5000
      );

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should fail when entry point not found', async () => {
      const result = await manager.executeTool(
        tempDir,
        'dist/nonexistent.js',
        {},
        [],
        5000
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('destroySandbox()', () => {
    it('should destroy a sandbox', async () => {
      const sandboxId = await manager.createSandbox({
        toolId: 'tool-123',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      await manager.destroySandbox(sandboxId);

      const sandboxes = manager.listSandboxes();
      expect(sandboxes).toHaveLength(0);
    });

    it('should not fail when destroying non-existent sandbox', async () => {
      await expect(manager.destroySandbox('non-existent')).resolves.not.toThrow();
    });
  });

  describe('listSandboxes()', () => {
    it('should list all sandboxes', async () => {
      await manager.createSandbox({
        toolId: 'tool-1',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      await manager.createSandbox({
        toolId: 'tool-2',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      const sandboxes = manager.listSandboxes();

      expect(sandboxes).toHaveLength(2);
      expect(sandboxes[0]).toHaveProperty('id');
      expect(sandboxes[0]).toHaveProperty('toolId');
      expect(sandboxes[0]).toHaveProperty('createdAt');
    });

    it('should return empty array when no sandboxes', () => {
      const sandboxes = manager.listSandboxes();
      expect(sandboxes).toHaveLength(0);
    });
  });

  describe('cleanup()', () => {
    it('should cleanup all sandboxes', async () => {
      await manager.createSandbox({
        toolId: 'tool-1',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      await manager.createSandbox({
        toolId: 'tool-2',
        toolPath: tempDir,
        entryPoint: 'dist/index.js',
      });

      await manager.cleanup();

      const sandboxes = manager.listSandboxes();
      expect(sandboxes).toHaveLength(0);
    });
  });
});
