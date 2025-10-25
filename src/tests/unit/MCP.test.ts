import { MCP, MCPSourceType } from '@modules/core/domain/MCP';
import { Tool } from '@modules/core/domain/Tool';

describe('MCP Domain', () => {
  const mockTool = new Tool({
    id: 'tool-1',
    name: 'test_function',
    description: 'A test function',
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    executor: async (input: unknown) => input,
  });

  it('should create an MCP with all properties', () => {
    const mcp = new MCP({
      id: 'mcp-1',
      name: 'Test MCP',
      source: '@example/mcp',
      sourceType: MCPSourceType.NPX,
      description: 'A test MCP',
      tools: [mockTool],
      env: { API_KEY: 'test-key' },
    });

    expect(mcp.getId()).toBe('mcp-1');
    expect(mcp.getName()).toBe('Test MCP');
    expect(mcp.getSource()).toBe('@example/mcp');
    expect(mcp.getSourceType()).toBe(MCPSourceType.NPX);
    expect(mcp.getDescription()).toBe('A test MCP');
    expect(mcp.getTools()).toHaveLength(1);
    expect(mcp.getEnv()).toEqual({ API_KEY: 'test-key' });
  });

  it('should create an MCP without optional fields', () => {
    const mcp = new MCP({
      id: 'mcp-2',
      name: 'Minimal MCP',
      source: '@example/minimal',
      sourceType: MCPSourceType.NPX,
      tools: [],
    });

    expect(mcp.getDescription()).toBeUndefined();
    expect(mcp.getEnv()).toBeUndefined();
    expect(mcp.getTools()).toHaveLength(0);
  });

  it('should add tools to MCP', () => {
    const mcp = new MCP({
      id: 'mcp-3',
      name: 'MCP',
      source: '@example/mcp',
      sourceType: MCPSourceType.NPX,
      tools: [],
    });

    mcp.addTool(mockTool);

    expect(mcp.getTools()).toHaveLength(1);
    expect(mcp.getTools()[0]).toBe(mockTool);
  });

  it('should return correct JSON representation', () => {
    const mcp = new MCP({
      id: 'mcp-4',
      name: 'JSON MCP',
      source: '@example/json',
      sourceType: MCPSourceType.NPX,
      description: 'For JSON test',
      tools: [mockTool],
      env: { KEY: 'value' },
    });

    const json = mcp.toJSON();

    expect(json).toEqual({
      id: 'mcp-4',
      name: 'JSON MCP',
      source: '@example/json',
      sourceType: MCPSourceType.NPX,
      description: 'For JSON test',
      tools: [mockTool.toJSON()],
      env: { KEY: 'value' },
    });
  });

  describe('determineSourceType', () => {
    it('should identify URL sources', () => {
      expect(MCP.determineSourceType('https://example.com/mcp')).toBe(MCPSourceType.URL);
      expect(MCP.determineSourceType('http://example.com/mcp')).toBe(MCPSourceType.URL);
    });

    it('should identify NPX sources', () => {
      expect(MCP.determineSourceType('@pinkpixel/mcpollinations')).toBe(MCPSourceType.NPX);
      expect(MCP.determineSourceType('example-package')).toBe(MCPSourceType.NPX);
      expect(MCP.determineSourceType('@scope/package')).toBe(MCPSourceType.NPX);
    });
  });
});
