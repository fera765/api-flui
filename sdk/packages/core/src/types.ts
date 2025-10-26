/**
 * SDK Core Types
 * Universal TypeScript SDK for automation platform
 */

export type UUID = string;

/**
 * Logger interface for SDK operations
 */
export interface Logger {
  debug(message: string, ...meta: any[]): void;
  info(message: string, ...meta: any[]): void;
  warn(message: string, ...meta: any[]): void;
  error(message: string, ...meta: any[]): void;
}

/**
 * Capabilities that a tool/plugin can request
 */
export type Capability = 'network' | 'filesystem' | 'spawn' | 'env';

/**
 * Sandbox options for isolated execution
 */
export interface SandboxOptions {
  timeout?: number;
  memoryLimit?: number;
  capabilities?: Capability[];
  env?: Record<string, string>;
}

/**
 * Sandbox handle for managing isolated execution
 */
export interface SandboxHandle {
  id: UUID;
  execute<T>(code: string, context?: any): Promise<T>;
  terminate(): Promise<void>;
}

/**
 * SDK execution context provided to tools
 */
export interface SDKContext {
  workspaceId: string;
  env?: Readonly<Record<string, string>>;
  logger: Logger;
  capabilities: Readonly<Record<Capability, boolean>>;
  spawnSandbox?(opts: SandboxOptions): Promise<SandboxHandle>;
}

/**
 * Schema definition (compatible with Zod/JSON Schema)
 */
export interface Schema<T = unknown> {
  parse(input: unknown): T;
  safeParse(input: unknown): { success: boolean; data?: T; error?: any };
}

/**
 * Tool definition with typed input/output
 */
export interface ToolDefinition<I = unknown, O = unknown> {
  id?: UUID;
  name: string;
  version?: string;
  description?: string;
  inputSchema: Schema<I>;
  outputSchema: Schema<O>;
  capabilities?: Capability[];
  handler: (ctx: SDKContext, input: I) => Promise<O>;
  metadata?: Record<string, unknown>;
}

/**
 * Trigger types supported
 */
export type TriggerType = 'manual' | 'webhook' | 'cron' | 'event';

/**
 * Webhook trigger configuration
 */
export interface WebhookConfig {
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  path?: string;
  auth?: boolean;
  headers?: Record<string, string>;
}

/**
 * Cron trigger configuration
 */
export interface CronConfig {
  schedule: string;
  timezone?: string;
  enabled?: boolean;
}

/**
 * Trigger definition extending tool definition
 */
export interface TriggerDefinition<I = unknown> extends Omit<ToolDefinition<I, void>, 'handler'> {
  triggerType: TriggerType;
  webhookConfig?: WebhookConfig;
  cronConfig?: CronConfig;
  handler: (ctx: SDKContext, input: I) => Promise<void>;
}

/**
 * Registration result
 */
export interface RegistrationResult {
  success: boolean;
  id: UUID;
  errors?: string[];
  warnings?: string[];
}

/**
 * Tool metadata
 */
export interface ToolMetadata {
  id: UUID;
  name: string;
  version?: string;
  description?: string;
  capabilities?: Capability[];
  type: 'tool' | 'trigger';
}

/**
 * Plugin export definition
 */
export interface PluginExport {
  type: 'tool' | 'trigger' | 'adapter';
  name: string;
  inputSchema?: any;
  outputSchema?: any;
  handler?: Function;
}

/**
 * Plugin manifest
 */
export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  author?: string;
  entry: string;
  capabilities?: Capability[];
  exports: PluginExport[];
  dependencies?: Record<string, string>;
  coreMin?: string;
  coreMax?: string;
}

/**
 * Plugin load options
 */
export interface PluginLoadOpts {
  timeout?: number;
  capabilities?: Capability[];
  env?: Record<string, string>;
  verify?: boolean;
}

/**
 * Adapter definition
 */
export interface AdapterDefinition<Config = unknown> {
  name: string;
  version?: string;
  type: 'http' | 'sse' | 'cron' | 'worker' | 'custom';
  config?: Config;
  initialize(config: Config): Promise<void>;
  execute<I, O>(input: I): Promise<O>;
  cleanup(): Promise<void>;
}

/**
 * Execution result
 */
export interface ExecutionResult<O = unknown> {
  success: boolean;
  output?: O;
  error?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * SDK Error codes
 */
export enum SDKErrorCode {
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  MISSING_CAPABILITY = 'MISSING_CAPABILITY',
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  EXECUTION_FAILED = 'EXECUTION_FAILED',
  TIMEOUT = 'TIMEOUT',
  SANDBOX_ERROR = 'SANDBOX_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PLUGIN_LOAD_ERROR = 'PLUGIN_LOAD_ERROR',
  COMPATIBILITY_ERROR = 'COMPATIBILITY_ERROR',
}

/**
 * SDK Error class
 */
export class SDKError extends Error {
  constructor(
    public code: SDKErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'SDKError';
  }
}
