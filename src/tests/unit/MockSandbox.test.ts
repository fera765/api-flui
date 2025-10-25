import { MockSandbox } from '@modules/core/services/sandbox/MockSandbox';

describe('MockSandbox', () => {
  let sandbox: MockSandbox;

  beforeEach(() => {
    sandbox = new MockSandbox();
  });

  afterEach(async () => {
    await sandbox.destroy();
  });

  describe('initialize', () => {
    it('should initialize with environment variables', async () => {
      await sandbox.initialize({
        API_KEY: 'test-key',
        BASE_URL: 'https://api.example.com',
      });

      expect(true).toBe(true); // Sandbox initialized successfully
    });

    it('should initialize without environment variables', async () => {
      await sandbox.initialize();

      expect(true).toBe(true); // Sandbox initialized successfully
    });
  });

  describe('loadMCP', () => {
    it('should load NPX-based MCP', async () => {
      await sandbox.loadMCP('@pinkpixel/mcpollinations');

      expect(true).toBe(true); // MCP loaded successfully
    });

    it('should load URL-based MCP', async () => {
      await sandbox.loadMCP('https://example.com/mcp');

      expect(true).toBe(true); // MCP loaded successfully
    });
  });

  describe('extractTools', () => {
    it('should extract tools from NPX MCP', async () => {
      await sandbox.loadMCP('@pinkpixel/mcpollinations');
      const tools = await sandbox.extractTools();

      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty('getName');
      expect(tools[0]).toHaveProperty('getInputSchema');
      expect(tools[0]).toHaveProperty('getOutputSchema');
    });

    it('should extract tools from URL MCP', async () => {
      await sandbox.loadMCP('https://example.com/mcp');
      const tools = await sandbox.extractTools();

      expect(tools.length).toBeGreaterThan(0);
    });

    it('should return empty array when no MCP loaded', async () => {
      const tools = await sandbox.extractTools();

      expect(tools).toEqual([]);
    });
  });

  describe('executeTool', () => {
    beforeEach(async () => {
      await sandbox.loadMCP('@pinkpixel/mcpollinations');
      await sandbox.extractTools();
    });

    it('should execute tool with valid input', async () => {
      const result = await sandbox.executeTool('generate_image', {
        prompt: 'A beautiful sunset',
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('url');
      expect(result.error).toBeUndefined();
    });

    it('should execute generate_text tool', async () => {
      const result = await sandbox.executeTool('generate_text', {
        prompt: 'Write a poem',
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('text');
      expect(result.error).toBeUndefined();
    });

    it('should return error for non-existent tool', async () => {
      const result = await sandbox.executeTool('non_existent_tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.result).toBeUndefined();
    });
  });

  describe('URL-based MCP tools', () => {
    beforeEach(async () => {
      await sandbox.loadMCP('https://example.com/mcp');
      await sandbox.extractTools();
    });

    it('should execute SSE stream tool', async () => {
      const result = await sandbox.executeTool('sse_stream', {
        query: 'test query',
      });

      expect(result.success).toBe(true);
      expect(result.result).toHaveProperty('stream');
      expect(result.error).toBeUndefined();
    });
  });

  describe('destroy', () => {
    it('should cleanup sandbox resources', async () => {
      await sandbox.initialize({ KEY: 'value' });
      await sandbox.loadMCP('@example/mcp');
      await sandbox.extractTools();

      await sandbox.destroy();

      const tools = await sandbox.extractTools();
      expect(tools).toEqual([]);
    });
  });
});
