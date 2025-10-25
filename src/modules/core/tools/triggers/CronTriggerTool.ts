import { randomUUID } from 'crypto';
import { SystemTool, ToolType, TriggerCronConfig } from '../../domain/SystemTool';

export function createCronTriggerTool(
  schedule: string,
  enabled = true,
  inputs?: Record<string, unknown>
): SystemTool {
  const config: TriggerCronConfig = {
    schedule,
    enabled,
    inputs,
  };

  return new SystemTool({
    id: randomUUID(),
    name: 'CronTrigger',
    description: 'Triggers automation on a schedule',
    type: ToolType.TRIGGER,
    config,
    inputSchema: {
      type: 'object',
      properties: inputs || {},
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        executedAt: { type: 'string' },
        schedule: { type: 'string' },
      },
    },
    executor: async (input: unknown) => {
      return {
        status: 'executed',
        executedAt: new Date().toISOString(),
        schedule: config.schedule,
        input,
      };
    },
  });
}
