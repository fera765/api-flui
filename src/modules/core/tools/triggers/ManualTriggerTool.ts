import { randomUUID } from 'crypto';
import { SystemTool, ToolType, TriggerManualConfig } from '../../domain/SystemTool';

export function createManualTriggerTool(config?: TriggerManualConfig): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'ManualTrigger',
    description: 'Executes automation manually on demand',
    type: ToolType.TRIGGER,
    config: config || {},
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: true,
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        executedAt: { type: 'string' },
        input: { type: 'object' },
      },
    },
    executor: async (input: unknown) => {
      return {
        status: 'executed',
        executedAt: new Date().toISOString(),
        input,
      };
    },
  });
}
