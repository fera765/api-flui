/**
 * Example: Webhook Trigger
 * Shows how to create and register a webhook trigger
 */

import { createSDK, schema } from '@automation-sdk/core';

const sdk = createSDK();

// Define webhook trigger
const webhookTrigger = {
  name: 'OrderWebhook',
  description: 'Triggered when a new order is received',
  triggerType: 'webhook' as const,
  webhookConfig: {
    method: 'POST' as const,
    path: '/webhooks/orders',
    auth: true,
  },
  inputSchema: schema.object({
    orderId: schema.string(),
    amount: schema.number(),
    customer: schema.object({
      name: schema.string(),
      email: schema.string(),
    }),
  }),
  outputSchema: schema.object({}),
  handler: async (ctx, input) => {
    ctx.logger.info('Order received:', input.orderId);
    // Process order...
  },
};

async function main() {
  const result = await sdk.registerTrigger(webhookTrigger);
  console.log('Webhook trigger registered:', result);
}

main().catch(console.error);
