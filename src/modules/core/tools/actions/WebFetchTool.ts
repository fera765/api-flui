import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';
import axios from 'axios';

export function createWebFetchTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'WebFetch',
    description: 'Performs HTTP requests to external APIs',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
        headers: { type: 'object' },
        body: { type: 'object' },
      },
      required: ['url'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        status: { type: 'number' },
        data: { type: 'object' },
        headers: { type: 'object' },
      },
    },
    executor: async (input: unknown) => {
      const { url, method = 'GET', headers, body } = input as {
        url: string;
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
      };

      const response = await axios({
        url,
        method,
        headers,
        data: body,
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    },
  });
}
