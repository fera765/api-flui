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
      properties: {
        url: {
          type: 'string',
          description: 'Webhook endpoint URL (gerado automaticamente)',
          readOnly: true,
        },
        token: {
          type: 'string',
          description: 'API Key para autenticação do webhook (gerado automaticamente)',
          readOnly: true,
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST'],
          description: 'Método HTTP para o webhook',
          default: 'POST',
        },
        inputs: {
          type: 'object',
          description: 'Campos esperados no payload do webhook (pares chave-tipo)',
          additionalProperties: {
            type: 'string',
            enum: ['string', 'number', 'array', 'object'],
          },
        },
      },
      required: ['url', 'token', 'method'],
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
