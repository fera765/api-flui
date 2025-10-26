/**
 * Example: Basic Tool
 * Shows how to create and register a simple tool
 */

import { createSDK, schema } from '@automation-sdk/core';

// Create SDK instance
const sdk = createSDK({
  workspaceId: 'example-workspace',
});

// Define a simple echo tool
const echoTool = {
  name: 'EchoTool',
  description: 'Echoes the input message',
  inputSchema: schema.object({
    message: schema.string(),
  }),
  outputSchema: schema.object({
    echo: schema.string(),
    timestamp: schema.number(),
  }),
  handler: async (ctx, input) => {
    ctx.logger.info('Echo tool called with:', input.message);
    return {
      echo: input.message,
      timestamp: Date.now(),
    };
  },
};

// Register and execute
async function main() {
  // Register tool
  const result = await sdk.registerTool(echoTool);
  console.log('Tool registered:', result);

  if (result.success) {
    // Execute tool
    const execution = await sdk.executeTool(result.id, {
      message: 'Hello, SDK!',
    });
    console.log('Execution result:', execution);
  }

  // List all tools
  const tools = await sdk.listTools();
  console.log('Registered tools:', tools);
}

main().catch(console.error);
