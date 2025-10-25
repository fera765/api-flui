import { MCPRepositoryInMemory } from '@modules/core/repositories/MCPRepositoryInMemory';
import { Tool } from '@modules/core/domain/Tool';

describe('MCPRepositoryInMemory', () => {
  let repository: MCPRepositoryInMemory;

  beforeEach(() => {
    repository = new MCPRepositoryInMemory();
  });

  const mockTool = new Tool({
    id: 'tool-1',
    name: 'test_function',
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    executor: async (input: unknown) => input,
  });

  describe('create', () => {
    it('should create an MCP with tools', async () => {
      const mcp = await repository.create({
        name: 'Test MCP',
        source: '@example/mcp',
      }, [mockTool]);

      expect(mcp.getId()).toBeDefined();
      expect(mcp.getName()).toBe('Test MCP');
      expect(mcp.getSource()).toBe('@example/mcp');
      expect(mcp.getTools()).toHaveLength(1);
    });

    it('should create an MCP with environment variables', async () => {
      const mcp = await repository.create({
        name: 'MCP with ENV',
        source: '@example/mcp',
        env: {
          API_KEY: 'secret',
          BASE_URL: 'https://api.example.com',
        },
      }, []);

      expect(mcp.getEnv()).toEqual({
        API_KEY: 'secret',
        BASE_URL: 'https://api.example.com',
      });
    });

    it('should determine source type automatically', async () => {
      const npxMCP = await repository.create({
        name: 'NPX MCP',
        source: '@pinkpixel/mcpollinations',
      }, []);

      const urlMCP = await repository.create({
        name: 'URL MCP',
        source: 'https://example.com/mcp',
      }, []);

      expect(npxMCP.getSourceType()).toBe('npx');
      expect(urlMCP.getSourceType()).toBe('url');
    });

    it('should generate unique IDs', async () => {
      const mcp1 = await repository.create({
        name: 'MCP 1',
        source: '@example/mcp1',
      }, []);

      const mcp2 = await repository.create({
        name: 'MCP 2',
        source: '@example/mcp2',
      }, []);

      expect(mcp1.getId()).not.toBe(mcp2.getId());
    });
  });

  describe('findAll', () => {
    it('should return empty array when no MCPs exist', async () => {
      const mcps = await repository.findAll();
      expect(mcps).toEqual([]);
    });

    it('should return all MCPs', async () => {
      await repository.create({
        name: 'MCP 1',
        source: '@example/mcp1',
      }, []);

      await repository.create({
        name: 'MCP 2',
        source: '@example/mcp2',
      }, []);

      const mcps = await repository.findAll();
      expect(mcps).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return null when MCP not found', async () => {
      const mcp = await repository.findById('non-existent-id');
      expect(mcp).toBeNull();
    });

    it('should return MCP by id', async () => {
      const created = await repository.create({
        name: 'Test MCP',
        source: '@example/mcp',
      }, [mockTool]);

      const found = await repository.findById(created.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(created.getId());
      expect(found?.getName()).toBe('Test MCP');
    });
  });

  describe('delete', () => {
    it('should delete an MCP', async () => {
      const mcp = await repository.create({
        name: 'To Delete',
        source: '@example/mcp',
      }, []);

      await repository.delete(mcp.getId());

      const found = await repository.findById(mcp.getId());
      expect(found).toBeNull();
    });

    it('should throw error when MCP not found', async () => {
      await expect(
        repository.delete('non-existent-id')
      ).rejects.toThrow('MCP not found');
    });
  });

  describe('clear', () => {
    it('should clear all MCPs', async () => {
      await repository.create({
        name: 'MCP 1',
        source: '@example/mcp1',
      }, []);

      await repository.create({
        name: 'MCP 2',
        source: '@example/mcp2',
      }, []);

      repository.clear();

      const mcps = await repository.findAll();
      expect(mcps).toEqual([]);
    });
  });
});
