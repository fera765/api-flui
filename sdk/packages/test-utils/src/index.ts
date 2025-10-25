/**
 * SDK Test Utilities
 * Mocks and helpers for testing SDK tools and plugins
 */

import type {
  SDKContext,
  Logger,
  SandboxHandle,
  PluginManifest,
  ToolDefinition,
  Capability,
} from '../../core/src/types';
import { randomUUID } from 'crypto';

/**
 * Create a fake logger for testing
 */
export function createFakeLogger(): Logger {
  const logs: Array<{ level: string; message: string; meta: any[] }> = [];

  const logger: Logger & { getLogs: () => typeof logs } = {
    debug(message: string, ...meta: any[]) {
      logs.push({ level: 'debug', message, meta });
    },
    info(message: string, ...meta: any[]) {
      logs.push({ level: 'info', message, meta });
    },
    warn(message: string, ...meta: any[]) {
      logs.push({ level: 'warn', message, meta });
    },
    error(message: string, ...meta: any[]) {
      logs.push({ level: 'error', message, meta });
    },
    getLogs() {
      return logs;
    },
  };

  return logger;
}

/**
 * Create a fake sandbox for testing
 */
export function createFakeSandbox(opts: {
  capabilities?: Capability[];
  mockExecute?: <T>(code: string, context?: any) => Promise<T>;
}): SandboxHandle {
  const id = randomUUID();

  return {
    id,
    async execute<T>(code: string, context?: any): Promise<T> {
      if (opts.mockExecute) {
        return opts.mockExecute(code, context);
      }
      // Default mock: return context if provided
      return context as T;
    },
    async terminate(): Promise<void> {
      // Mock cleanup
    },
  };
}

/**
 * Create a fake SDK context for testing
 */
export function createFakeContext(overrides?: Partial<SDKContext>): SDKContext {
  return {
    workspaceId: 'test-workspace',
    logger: createFakeLogger(),
    capabilities: {
      network: true,
      filesystem: false,
      spawn: false,
      env: true,
    },
    env: {},
    spawnSandbox: async (opts) => createFakeSandbox({ capabilities: opts.capabilities }),
    ...overrides,
  };
}

/**
 * Create a mock plugin manifest
 */
export function mockPluginManifest(overrides?: Partial<PluginManifest>): PluginManifest {
  return {
    name: '@test/mock-plugin',
    version: '1.0.0',
    description: 'Mock plugin for testing',
    entry: './dist/index.js',
    capabilities: ['network'],
    exports: [
      {
        type: 'tool',
        name: 'MockTool',
        inputSchema: { parse: (x: any) => x, safeParse: (x: any) => ({ success: true, data: x }) },
        outputSchema: { parse: (x: any) => x, safeParse: (x: any) => ({ success: true, data: x }) },
      },
    ],
    ...overrides,
  };
}

/**
 * Create a mock plugin bundle with handlers
 */
export function mockPluginBundle(
  manifest: PluginManifest,
  handlers: Record<string, Function>
): { manifest: PluginManifest; handlers: Record<string, Function> } {
  return { manifest, handlers };
}

/**
 * Assert that a tool executes and validates schema
 */
export async function assertToolExecutesAndValidatesSchema<I, O>(
  tool: ToolDefinition<I, O>,
  input: I,
  expectedOutput?: O
): Promise<void> {
  const context = createFakeContext();

  // Validate input schema
  const inputValidation = tool.inputSchema.safeParse(input);
  if (!inputValidation.success) {
    throw new Error('Input validation failed: ' + inputValidation.error);
  }

  // Execute tool
  const output = await tool.handler(context, input);

  // Validate output schema
  const outputValidation = tool.outputSchema.safeParse(output);
  if (!outputValidation.success) {
    throw new Error('Output validation failed: ' + outputValidation.error);
  }

  // Check expected output if provided
  if (expectedOutput !== undefined) {
    if (JSON.stringify(output) !== JSON.stringify(expectedOutput)) {
      throw new Error(
        `Output mismatch. Expected: ${JSON.stringify(expectedOutput)}, Got: ${JSON.stringify(output)}`
      );
    }
  }
}

/**
 * Create a mock tool definition
 */
export function createMockTool<I = any, O = any>(
  overrides?: Partial<ToolDefinition<I, O>>
): ToolDefinition<I, O> {
  return {
    name: 'MockTool',
    description: 'A mock tool for testing',
    inputSchema: {
      parse: (x: any) => x as I,
      safeParse: (x: any) => ({ success: true, data: x as I }),
    },
    outputSchema: {
      parse: (x: any) => x as O,
      safeParse: (x: any) => ({ success: true, data: x as O }),
    },
    handler: async (ctx, input) => input as unknown as O,
    ...overrides,
  };
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  throw new Error('Timeout waiting for condition');
}

/**
 * Mock sleep/delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
