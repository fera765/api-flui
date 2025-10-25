import { createCronTriggerTool } from '@modules/core/tools/triggers/CronTriggerTool';
import { ToolType, TriggerCronConfig } from '@modules/core/domain/SystemTool';

describe('CronTriggerTool', () => {
  it('should create cron trigger with schedule', () => {
    const tool = createCronTriggerTool('0 * * * *');
    const config = tool.getConfig() as TriggerCronConfig;

    expect(tool.getName()).toBe('CronTrigger');
    expect(tool.getType()).toBe(ToolType.TRIGGER);
    expect(config.schedule).toBe('0 * * * *');
    expect(config.enabled).toBe(true);
  });

  it('should create cron trigger with disabled state', () => {
    const tool = createCronTriggerTool('*/5 * * * *', false);
    const config = tool.getConfig() as TriggerCronConfig;

    expect(config.enabled).toBe(false);
  });

  it('should create cron trigger with custom inputs', () => {
    const inputs = { target: 'production' };
    const tool = createCronTriggerTool('0 0 * * *', true, inputs);
    const config = tool.getConfig() as TriggerCronConfig;

    expect(config.inputs).toEqual(inputs);
  });

  it('should execute and return result', async () => {
    const tool = createCronTriggerTool('0 * * * *');
    const input = { data: 'test' };

    const result = await tool.execute(input) as { 
      status: string; 
      executedAt: string; 
      schedule: string;
      input: unknown;
    };

    expect(result.status).toBe('executed');
    expect(result.executedAt).toBeDefined();
    expect(result.schedule).toBe('0 * * * *');
    expect(result.input).toEqual(input);
  });

  it('should have correct schemas', () => {
    const tool = createCronTriggerTool('0 * * * *');

    expect(tool.getInputSchema()).toBeDefined();
    expect(tool.getOutputSchema()).toHaveProperty('properties');
  });
});
