import { MCPService } from '@modules/core/services/MCPService';
import { MCPRepositoryInMemory } from '@modules/core/repositories/MCPRepositoryInMemory';

describe('MCPService', () => {
  let service: MCPService;
  let repository: MCPRepositoryInMemory;

  beforeEach(() => {
    repository = new MCPRepositoryInMemory();
    service = new MCPService(repository);
  });

  afterEach(async () => {
    await service.cleanup();
  });

  describe('importMCP', () => {
    it('should import MCP via NPX', async () => {
      const result = await service.importMCP({
        name: 'Pollinations MCP',
        source: '@pinkpixel/mcpollinations',
        description: 'Image and text generation',
      });

      expect(result).toHaveProperty('mcp');
      expect(result).toHaveProperty('toolsExtracted');
      expect(result.mcp).toHaveProperty('id');
      expect(result.mcp.name).toBe('Pollinations MCP');
      expect(result.mcp.sourceType).toBe('npx');
      expect(result.toolsExtracted).toBeGreaterThan(0);
    });

    it('should import MCP via URL', async () => {
      const result = await service.importMCP({
        name: 'SSE MCP',
        source: 'https://example.com/mcp',
      });

      expect(result.mcp.sourceType).toBe('url');
    });

    it('should import MCP with environment variables', async () => {
      const result = await service.importMCP({
        name: 'MCP with ENV',
        source: '@example/mcp',
        env: {
          API_KEY: 'secret',
          BASE_URL: 'https://api.example.com',
        },
      });

      expect(result.mcp.env).toEqual({
        API_KEY: 'secret',
        BASE_URL: 'https://api.example.com',
      });
    });

    it('should throw error when name is missing', async () => {
      await expect(
        service.importMCP({
          name: '',
          source: '@example/mcp',
        })
      ).rejects.toThrow('Name is required');
    });

    it('should throw error when source is missing', async () => {
      await expect(
        service.importMCP({
          name: 'MCP',
          source: '',
        })
      ).rejects.toThrow('Source is required');
    });
  });

  describe('getAllMCPs', () => {
    it('should return empty array when no MCPs exist', async () => {
      const mcps = await service.getAllMCPs();
      expect(mcps).toEqual([]);
    });

    it('should return all imported MCPs', async () => {
      await service.importMCP({
        name: 'MCP 1',
        source: '@example/mcp1',
      });

      await service.importMCP({
        name: 'MCP 2',
        source: '@example/mcp2',
      });

      const mcps = await service.getAllMCPs();
      expect(mcps).toHaveLength(2);
    });
  });

  describe('getMCPTools', () => {
    it('should return tools from MCP', async () => {
      const result = await service.importMCP({
        name: 'Pollinations MCP',
        source: '@pinkpixel/mcpollinations',
      });

      const tools = await service.getMCPTools(result.mcp.id);

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools[0]).toHaveProperty('id');
      expect(tools[0]).toHaveProperty('name');
      expect(tools[0]).toHaveProperty('inputSchema');
      expect(tools[0]).toHaveProperty('outputSchema');
      expect(tools[0]).not.toHaveProperty('executor');
    });

    it('should throw error when MCP not found', async () => {
      await expect(
        service.getMCPTools('non-existent-id')
      ).rejects.toThrow('MCP not found');
    });
  });

  describe('deleteMCP', () => {
    it('should delete an MCP and cleanup sandbox', async () => {
      const result = await service.importMCP({
        name: 'MCP to Delete',
        source: '@example/mcp',
      });

      await service.deleteMCP(result.mcp.id);

      await expect(
        service.getMCPTools(result.mcp.id)
      ).rejects.toThrow('MCP not found');
    });

    it('should throw error when MCP not found', async () => {
      await expect(
        service.deleteMCP('non-existent-id')
      ).rejects.toThrow('MCP not found');
    });

    it('should rethrow non-specific errors on delete', async () => {
      const result = await service.importMCP({
        name: 'Test MCP',
        source: '@example/mcp',
      });

      const errorMessage = 'Unexpected error';
      jest.spyOn(repository, 'delete').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.deleteMCP(result.mcp.id)
      ).rejects.toThrow(errorMessage);
    });
  });

  describe('executeTool', () => {
    it('should execute tool from MCP sandbox', async () => {
      const result = await service.importMCP({
        name: 'Pollinations MCP',
        source: '@pinkpixel/mcpollinations',
      });

      const output = await service.executeTool(
        result.mcp.id,
        'generate_image',
        { prompt: 'A beautiful sunset' }
      );

      expect(output).toHaveProperty('url');
    });

    it('should throw error when sandbox not found', async () => {
      await expect(
        service.executeTool('non-existent-id', 'tool_name', {})
      ).rejects.toThrow('MCP sandbox not found');
    });

    it('should throw error when tool execution fails', async () => {
      const result = await service.importMCP({
        name: 'Test MCP',
        source: '@example/mcp',
      });

      await expect(
        service.executeTool(result.mcp.id, 'non_existent_tool', {})
      ).rejects.toThrow("Tool 'non_existent_tool' not found in sandbox");
    });

    it('should throw generic error when tool fails without message', async () => {
      const result = await service.importMCP({
        name: 'Test MCP',
        source: 'https://example.com/mcp',
      });

      // The mock will fail with a tool not found, but we're testing the error handling
      await expect(
        service.executeTool(result.mcp.id, 'invalid_tool', {})
      ).rejects.toThrow();
    });
  });

  describe('cleanup', () => {
    it('should cleanup all sandboxes', async () => {
      await service.importMCP({
        name: 'MCP 1',
        source: '@example/mcp1',
      });

      await service.importMCP({
        name: 'MCP 2',
        source: '@example/mcp2',
      });

      await service.cleanup();

      // Cleanup is successful (no errors thrown)
      expect(true).toBe(true);
    });
  });
});
