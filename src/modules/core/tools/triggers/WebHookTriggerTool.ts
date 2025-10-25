import { randomUUID } from 'crypto';
import { SystemTool, ToolType, TriggerWebHookConfig } from '../../domain/SystemTool';

export function generateWebHookToken(): string {
  return `whk_${randomUUID().replace(/-/g, '')}`;
}

export function generateWebHookURL(toolId: string, baseURL = 'http://localhost:3000'): string {
  return `${baseURL}/api/webhooks/${toolId}`;
}

export function createWebHookTriggerTool(
  method: 'POST' | 'GET' = 'POST',
  inputs?: Record<string, 'string' | 'number' | 'array' | 'object'>,
  customConfig?: Record<string, unknown>,
  baseURL?: string
): SystemTool {
  const id = randomUUID();
  const token = generateWebHookToken();
  const url = generateWebHookURL(id, baseURL);

  const config: TriggerWebHookConfig = {
    url,
    method,
    token,
    inputs,
    customConfig,
  };

  return new SystemTool({
    id,
    name: 'WebHookTrigger',
    description: 'Triggers automation via HTTP webhook',
    type: ToolType.TRIGGER,
    config,
    inputSchema: {
      type: 'object',
      properties: inputs || {},
      additionalProperties: true,
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        receivedAt: { type: 'string' },
        payload: { type: 'object' },
      },
    },
    executor: async (input: unknown) => {
      return {
        status: 'received',
        receivedAt: new Date().toISOString(),
        payload: input,
      };
    },
  });
}
