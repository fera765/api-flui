/**
 * Example: Plugin Manifest
 * Shows how to create a plugin manifest and load it
 */

import { createSDK } from '@automation-sdk/core';
import { mockPluginManifest } from '@automation-sdk/test-utils';

const sdk = createSDK({ coreVersion: '1.0.0' });

// Create plugin manifest
const pluginManifest = mockPluginManifest({
  name: '@example/data-processor',
  version: '2.0.0',
  description: 'Data processing plugin',
  capabilities: ['network', 'filesystem'],
  exports: [
    {
      type: 'tool',
      name: 'ProcessData',
    },
    {
      type: 'tool',
      name: 'ValidateData',
    },
    {
      type: 'trigger',
      name: 'DataWebhook',
    },
  ],
  coreMin: '>=1.0.0 <2.0.0',
});

async function main() {
  try {
    // Load plugin from manifest
    const loaded = await sdk.loadPluginFromManifest(pluginManifest, {
      capabilities: ['network', 'filesystem'],
    });

    console.log('Plugin loaded successfully:', loaded.name);
    console.log('Exports:', loaded.exports.length);
  } catch (error) {
    console.error('Failed to load plugin:', error);
  }
}

main().catch(console.error);
