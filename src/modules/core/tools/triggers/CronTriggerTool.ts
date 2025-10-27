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
      properties: {
        schedule: {
          type: 'string',
          description: 'Expressão Cron (ex: "0 * * * *" para a cada hora, "0 0 * * *" para diariamente)',
          pattern: '^[0-9\\s\\*\\/\\-\\,\\?LW#]+$',
        },
        enabled: {
          type: 'boolean',
          description: 'Ativar ou desativar este trigger',
          default: true,
        },
      },
      required: ['schedule'],
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
