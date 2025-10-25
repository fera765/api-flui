import { Tool } from '@modules/core/domain/Tool';

describe('Tool Domain', () => {
  const mockExecutor = jest.fn(async (input: unknown) => {
    return { result: input };
  });

  it('should create a tool with all properties', () => {
    const tool = new Tool({
      id: 'tool-1',
      name: 'Test Tool',
      description: 'A test tool',
      inputSchema: { type: 'string' },
      outputSchema: { type: 'object' },
      executor: mockExecutor,
    });

    expect(tool.getId()).toBe('tool-1');
    expect(tool.getName()).toBe('Test Tool');
    expect(tool.getDescription()).toBe('A test tool');
    expect(tool.getInputSchema()).toEqual({ type: 'string' });
    expect(tool.getOutputSchema()).toEqual({ type: 'object' });
  });

  it('should create a tool without description', () => {
    const tool = new Tool({
      id: 'tool-2',
      name: 'Minimal Tool',
      inputSchema: { type: 'any' },
      outputSchema: { type: 'any' },
      executor: mockExecutor,
    });

    expect(tool.getDescription()).toBeUndefined();
  });

  it('should execute the tool', async () => {
    const executorFn = jest.fn(async (input: unknown) => {
      return { processed: input };
    });

    const tool = new Tool({
      id: 'tool-3',
      name: 'Executable Tool',
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      executor: executorFn,
    });

    const input = { data: 'test' };
    const result = await tool.execute(input);

    expect(executorFn).toHaveBeenCalledWith(input);
    expect(result).toEqual({ processed: input });
  });

  it('should return correct JSON representation', () => {
    const tool = new Tool({
      id: 'tool-4',
      name: 'JSON Tool',
      description: 'For JSON test',
      inputSchema: { type: 'number' },
      outputSchema: { type: 'boolean' },
      executor: mockExecutor,
    });

    const json = tool.toJSON();

    expect(json).toEqual({
      id: 'tool-4',
      name: 'JSON Tool',
      description: 'For JSON test',
      inputSchema: { type: 'number' },
      outputSchema: { type: 'boolean' },
    });
    expect(json).not.toHaveProperty('executor');
  });

  it('should handle executor errors', async () => {
    const errorExecutor = jest.fn(async () => {
      throw new Error('Execution failed');
    });

    const tool = new Tool({
      id: 'tool-5',
      name: 'Error Tool',
      inputSchema: { type: 'any' },
      outputSchema: { type: 'any' },
      executor: errorExecutor,
    });

    await expect(tool.execute({})).rejects.toThrow('Execution failed');
  });
});
