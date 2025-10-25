import { Agent } from '@modules/core/domain/Agent';
import { Tool } from '@modules/core/domain/Tool';

describe('Agent Domain', () => {
  const mockTool = new Tool({
    id: 'tool-1',
    name: 'Test Tool',
    description: 'A test tool',
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    executor: async (input: unknown) => input,
  });

  it('should create an agent with all properties', () => {
    const agent = new Agent({
      id: 'agent-1',
      name: 'Test Agent',
      description: 'A test agent',
      prompt: 'You are helpful',
      defaultModel: 'gpt-4',
      tools: [mockTool],
    });

    expect(agent.getId()).toBe('agent-1');
    expect(agent.getName()).toBe('Test Agent');
    expect(agent.getDescription()).toBe('A test agent');
    expect(agent.getPrompt()).toBe('You are helpful');
    expect(agent.getDefaultModel()).toBe('gpt-4');
    expect(agent.getTools()).toHaveLength(1);
  });

  it('should create an agent without optional fields', () => {
    const agent = new Agent({
      id: 'agent-2',
      name: 'Minimal Agent',
      prompt: 'You are helpful',
      tools: [],
    });

    expect(agent.getDescription()).toBeUndefined();
    expect(agent.getDefaultModel()).toBeUndefined();
    expect(agent.getTools()).toHaveLength(0);
  });

  it('should update agent properties', () => {
    const agent = new Agent({
      id: 'agent-3',
      name: 'Original',
      prompt: 'Original prompt',
      tools: [],
    });

    agent.update({
      name: 'Updated',
      description: 'New description',
      defaultModel: 'gpt-4-turbo',
    });

    expect(agent.getName()).toBe('Updated');
    expect(agent.getDescription()).toBe('New description');
    expect(agent.getDefaultModel()).toBe('gpt-4-turbo');
    expect(agent.getPrompt()).toBe('Original prompt');
  });

  it('should return correct JSON representation', () => {
    const agent = new Agent({
      id: 'agent-4',
      name: 'JSON Agent',
      description: 'For JSON test',
      prompt: 'You are helpful',
      defaultModel: 'gpt-4',
      tools: [mockTool],
    });

    const json = agent.toJSON();

    expect(json).toEqual({
      id: 'agent-4',
      name: 'JSON Agent',
      description: 'For JSON test',
      prompt: 'You are helpful',
      defaultModel: 'gpt-4',
      tools: [mockTool.toJSON()],
    });
  });

  it('should update only specified fields', () => {
    const agent = new Agent({
      id: 'agent-5',
      name: 'Original',
      description: 'Original description',
      prompt: 'Original prompt',
      defaultModel: 'gpt-3.5-turbo',
      tools: [],
    });

    agent.update({
      name: 'Updated Name',
    });

    expect(agent.getName()).toBe('Updated Name');
    expect(agent.getDescription()).toBe('Original description');
    expect(agent.getPrompt()).toBe('Original prompt');
    expect(agent.getDefaultModel()).toBe('gpt-3.5-turbo');
  });

  it('should update prompt', () => {
    const agent = new Agent({
      id: 'agent-6',
      name: 'Agent',
      prompt: 'Original prompt',
      tools: [],
    });

    agent.update({
      prompt: 'New prompt',
    });

    expect(agent.getPrompt()).toBe('New prompt');
  });

  it('should update tools', () => {
    const agent = new Agent({
      id: 'agent-7',
      name: 'Agent',
      prompt: 'Prompt',
      tools: [],
    });

    agent.update({
      tools: [mockTool],
    });

    expect(agent.getTools()).toHaveLength(1);
    expect(agent.getTools()[0]).toBe(mockTool);
  });
});
