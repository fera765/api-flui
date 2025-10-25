/**
 * Example: HTTP Adapter Usage
 * Shows how to use the HTTP adapter in a tool
 */

import { createSDK, schema } from '@automation-sdk/core';
import { createHttpAdapter } from '@automation-sdk/adapters';

const sdk = createSDK();

// Create HTTP adapter
const httpAdapter = createHttpAdapter({
  baseURL: 'https://api.example.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define a tool that uses HTTP adapter
const fetchUserTool = {
  name: 'FetchUser',
  description: 'Fetches user data from API',
  inputSchema: schema.object({
    userId: schema.string(),
  }),
  outputSchema: schema.object({
    id: schema.string(),
    name: schema.string(),
    email: schema.string(),
  }),
  capabilities: ['network' as const],
  handler: async (ctx, input) => {
    ctx.logger.info('Fetching user:', input.userId);

    // Use HTTP adapter
    const response = await httpAdapter.execute({
      url: `/users/${input.userId}`,
      method: 'GET',
    });

    return response.data;
  },
};

async function main() {
  const result = await sdk.registerTool(fetchUserTool);
  console.log('Tool registered:', result);

  // Execute with network capability
  if (result.success) {
    const execution = await sdk.executeTool(
      result.id,
      { userId: '123' },
      {
        capabilities: {
          network: true,
          filesystem: false,
          spawn: false,
          env: false,
        },
      }
    );
    console.log('User fetched:', execution);
  }
}

main().catch(console.error);
