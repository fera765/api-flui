import { createManualTriggerTool } from '@modules/core/tools/triggers/ManualTriggerTool';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('ManualTriggerTool', () => {
  it('should create manual trigger with default config', () => {
    const tool = createManualTriggerTool();

    expect(tool.getName()).toBe('ManualTrigger');
    expect(tool.getType()).toBe(ToolType.TRIGGER);
    expect(tool.getDescription()).toBeDefined();
  });

  it('should create manual trigger with custom config', () => {
    const config = { inputs: { test: 'value' } };
    const tool = createManualTriggerTool(config);

    expect(tool.getConfig()).toEqual(config);
  });

  it('should execute and return result', async () => {
    const tool = createManualTriggerTool();
    const input = { message: 'test' };

    const result = await tool.execute(input) as { status: string; executedAt: string; input: unknown };

    expect(result.status).toBe('executed');
    expect(result.executedAt).toBeDefined();
    expect(result.input).toEqual(input);
  });

  it('should have correct schemas', () => {
    const tool = createManualTriggerTool();

    expect(tool.getInputSchema()).toHaveProperty('type', 'object');
    expect(tool.getOutputSchema()).toHaveProperty('properties');
  });
});
