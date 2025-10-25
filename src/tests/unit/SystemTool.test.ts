import { SystemTool, ToolType } from '@modules/core/domain/SystemTool';

describe('SystemTool Domain', () => {
  const mockExecutor = jest.fn(async (input: unknown) => input);

  it('should create a system tool with all properties', () => {
    const tool = new SystemTool({
      id: 'tool-1',
      name: 'TestTool',
      description: 'A test tool',
      type: ToolType.ACTION,
      config: { key: 'value' },
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      executor: mockExecutor,
    });

    expect(tool.getId()).toBe('tool-1');
    expect(tool.getName()).toBe('TestTool');
    expect(tool.getDescription()).toBe('A test tool');
    expect(tool.getType()).toBe(ToolType.ACTION);
    expect(tool.getConfig()).toEqual({ key: 'value' });
    expect(tool.getInputSchema()).toEqual({ type: 'object' });
    expect(tool.getOutputSchema()).toEqual({ type: 'object' });
  });

  it('should execute tool with executor', async () => {
    const tool = new SystemTool({
      id: 'tool-2',
      name: 'ExecutableTool',
      type: ToolType.ACTION,
      executor: async (input: unknown) => ({ processed: input }),
    });

    const result = await tool.execute({ data: 'test' });
    expect(result).toEqual({ processed: { data: 'test' } });
  });

  it('should update config', () => {
    const tool = new SystemTool({
      id: 'tool-3',
      name: 'ConfigTool',
      type: ToolType.TRIGGER,
      config: { initial: true },
      executor: mockExecutor,
    });

    tool.updateConfig({ updated: true });
    expect(tool.getConfig()).toEqual({ updated: true });
  });

  it('should return correct JSON', () => {
    const tool = new SystemTool({
      id: 'tool-4',
      name: 'JSONTool',
      description: 'JSON test',
      type: ToolType.ACTION,
      executor: mockExecutor,
    });

    const json = tool.toJSON();
    expect(json).toEqual({
      id: 'tool-4',
      name: 'JSONTool',
      description: 'JSON test',
      type: ToolType.ACTION,
      config: undefined,
      inputSchema: undefined,
      outputSchema: undefined,
    });
    expect(json).not.toHaveProperty('executor');
  });
});
