/**
 * SDK Main API
 * Core functionality for registering and executing tools, triggers, and plugins
 */

import {
  UUID,
  ToolDefinition,
  TriggerDefinition,
  RegistrationResult,
  ToolMetadata,
  SDKContext,
  PluginManifest,
  PluginLoadOpts,
  SandboxOptions,
  SandboxHandle,
  SDKError,
  SDKErrorCode,
  ExecutionResult,
  Logger,
  Capability,
} from './types';
import { validate } from './schema';
import { randomUUID } from 'crypto';
import * as semver from 'semver';

/**
 * Simple console logger implementation
 */
class ConsoleLogger implements Logger {
  debug(message: string, ...meta: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...meta);
  }
  info(message: string, ...meta: any[]): void {
    console.info(`[INFO] ${message}`, ...meta);
  }
  warn(message: string, ...meta: any[]): void {
    console.warn(`[WARN] ${message}`, ...meta);
  }
  error(message: string, ...meta: any[]): void {
    console.error(`[ERROR] ${message}`, ...meta);
  }
}

/**
 * Internal tool/trigger storage
 */
interface RegisteredTool<I = unknown, O = unknown> extends ToolDefinition<I, O> {
  id: UUID;
  registeredAt: Date;
  type: 'tool' | 'trigger';
}

/**
 * SDK configuration
 */
export interface SDKConfig {
  workspaceId?: string;
  logger?: Logger;
  defaultCapabilities?: Capability[];
  coreVersion?: string;
}

/**
 * Main SDK class
 */
export class SDK {
  private tools = new Map<UUID, RegisteredTool>();
  private triggers = new Map<UUID, RegisteredTool>();
  private config: Required<SDKConfig>;
  private logger: Logger;

  constructor(config: SDKConfig = {}) {
    this.config = {
      workspaceId: config.workspaceId || 'default',
      logger: config.logger || new ConsoleLogger(),
      defaultCapabilities: config.defaultCapabilities || ['network'],
      coreVersion: config.coreVersion || '1.0.0',
    };
    this.logger = this.config.logger;
  }

  /**
   * Register a tool
   */
  async registerTool<I, O>(
    tool: ToolDefinition<I, O>
  ): Promise<RegistrationResult> {
    try {
      // Validate tool definition
      if (!tool.name || tool.name.trim() === '') {
        return {
          success: false,
          id: '',
          errors: ['Tool name is required'],
        };
      }

      // Check for duplicate names
      const existing = Array.from(this.tools.values()).find(
        (t) => t.name === tool.name
      );
      if (existing) {
        return {
          success: false,
          id: '',
          errors: [`Tool with name "${tool.name}" already exists`],
        };
      }

      // Generate ID if not provided
      const id = tool.id || randomUUID();

      // Validate schemas
      if (!tool.inputSchema || !tool.outputSchema) {
        return {
          success: false,
          id: '',
          errors: ['Input and output schemas are required'],
        };
      }

      // Store tool
      const registered: RegisteredTool<I, O> = {
        ...tool,
        id,
        registeredAt: new Date(),
        type: 'tool',
      };

      this.tools.set(id, registered as RegisteredTool);

      this.logger.info(`Tool "${tool.name}" registered with id ${id}`);

      return {
        success: true,
        id,
      };
    } catch (error) {
      return {
        success: false,
        id: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Unregister a tool
   */
  async unregisterTool(id: UUID): Promise<void> {
    if (!this.tools.has(id)) {
      throw new SDKError(
        SDKErrorCode.TOOL_NOT_FOUND,
        `Tool with id "${id}" not found`
      );
    }

    const tool = this.tools.get(id)!;
    this.tools.delete(id);
    this.logger.info(`Tool "${tool.name}" (${id}) unregistered`);
  }

  /**
   * List all registered tools
   */
  async listTools(): Promise<ToolMetadata[]> {
    return Array.from(this.tools.values()).map((tool) => ({
      id: tool.id,
      name: tool.name,
      version: tool.version,
      description: tool.description,
      capabilities: tool.capabilities,
      type: tool.type,
    }));
  }

  /**
   * Execute a tool
   */
  async executeTool<I, O>(
    id: UUID,
    input: I,
    contextOverrides?: Partial<SDKContext>
  ): Promise<ExecutionResult<O>> {
    const startTime = Date.now();

    try {
      // Find tool
      const tool = this.tools.get(id) as RegisteredTool<I, O> | undefined;
      if (!tool) {
        throw new SDKError(
          SDKErrorCode.TOOL_NOT_FOUND,
          `Tool with id "${id}" not found`
        );
      }

      // Validate input
      const inputValidation = validate(tool.inputSchema, input);
      if (!inputValidation.valid) {
        throw new SDKError(
          SDKErrorCode.VALIDATION_ERROR,
          'Input validation failed',
          { errors: inputValidation.errors }
        );
      }

      // Build context
      const context = this.buildContext(tool.capabilities, contextOverrides);

      // Check capabilities
      this.checkCapabilities(tool.capabilities, context);

      // Execute handler
      const output = await tool.handler(context, inputValidation.data!);

      // Validate output
      const outputValidation = validate(tool.outputSchema, output);
      if (!outputValidation.valid) {
        throw new SDKError(
          SDKErrorCode.VALIDATION_ERROR,
          'Output validation failed',
          { errors: outputValidation.errors }
        );
      }

      const duration = Date.now() - startTime;

      this.logger.debug(`Tool "${tool.name}" executed successfully in ${duration}ms`);

      return {
        success: true,
        output: outputValidation.data as O,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Tool execution failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        duration,
      };
    }
  }

  /**
   * Register a trigger
   */
  async registerTrigger<I>(
    trigger: TriggerDefinition<I>
  ): Promise<RegistrationResult> {
    try {
      // Validate trigger definition
      if (!trigger.name || trigger.name.trim() === '') {
        return {
          success: false,
          id: '',
          errors: ['Trigger name is required'],
        };
      }

      if (!trigger.triggerType) {
        return {
          success: false,
          id: '',
          errors: ['Trigger type is required'],
        };
      }

      // Generate ID if not provided
      const id = trigger.id || randomUUID();

      // Store trigger
      const registered: RegisteredTool<I, void> = {
        ...trigger,
        id,
        registeredAt: new Date(),
        type: 'trigger',
        outputSchema: trigger.outputSchema,
      };

      this.triggers.set(id, registered as RegisteredTool);

      this.logger.info(`Trigger "${trigger.name}" registered with id ${id}`);

      return {
        success: true,
        id,
        warnings:
          trigger.triggerType === 'webhook' && !trigger.webhookConfig
            ? ['Webhook trigger registered without configuration']
            : undefined,
      };
    } catch (error) {
      return {
        success: false,
        id: '',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Load plugin from NPX package
   */
  async loadPluginFromNpx(
    packageName: string,
    _opts?: PluginLoadOpts
  ): Promise<PluginManifest> {
    this.logger.info(`Loading plugin from NPX: ${packageName}`);

    // Mock implementation - in real SDK would use dynamic import or spawn npx
    throw new SDKError(
      SDKErrorCode.PLUGIN_LOAD_ERROR,
      'NPX plugin loading not yet implemented. Use loadPluginFromManifest for testing.'
    );
  }

  /**
   * Load plugin from URL
   */
  async loadPluginFromUrl(
    url: string,
    _opts?: PluginLoadOpts
  ): Promise<PluginManifest> {
    this.logger.info(`Loading plugin from URL: ${url}`);

    // Mock implementation
    throw new SDKError(
      SDKErrorCode.PLUGIN_LOAD_ERROR,
      'URL plugin loading not yet implemented. Use loadPluginFromManifest for testing.'
    );
  }

  /**
   * Load plugin from manifest (for testing/development)
   */
  async loadPluginFromManifest(
    manifest: PluginManifest,
    opts?: PluginLoadOpts
  ): Promise<PluginManifest> {
    this.logger.info(`Loading plugin: ${manifest.name} v${manifest.version}`);

    // Validate compatibility
    if (manifest.coreMin && !semver.satisfies(this.config.coreVersion, manifest.coreMin)) {
      throw new SDKError(
        SDKErrorCode.COMPATIBILITY_ERROR,
        `Plugin requires core version ${manifest.coreMin}, but running ${this.config.coreVersion}`
      );
    }

    // Validate capabilities
    const requestedCaps = manifest.capabilities || [];
    const allowedCaps = opts?.capabilities || this.config.defaultCapabilities;

    for (const cap of requestedCaps) {
      if (!allowedCaps.includes(cap)) {
        throw new SDKError(
          SDKErrorCode.MISSING_CAPABILITY,
          `Plugin requires capability "${cap}" which is not allowed`
        );
      }
    }

    this.logger.info(
      `Plugin "${manifest.name}" loaded successfully with ${manifest.exports.length} exports`
    );

    return manifest;
  }

  /**
   * Create sandbox for isolated execution
   */
  async createSandbox(opts: SandboxOptions): Promise<SandboxHandle> {
    const id = randomUUID();

    this.logger.debug(`Creating sandbox ${id} with capabilities:`, opts.capabilities);

    // Mock implementation - real SDK would use Worker threads or child process
    const handle: SandboxHandle = {
      id,
      async execute<T>(_code: string, _context?: any): Promise<T> {
        // Mock execution
        throw new Error('Sandbox execution not implemented in mock');
      },
      async terminate(): Promise<void> {
        // Cleanup
      },
    };

    return handle;
  }

  /**
   * Get SDK statistics
   */
  getStats() {
    return {
      tools: this.tools.size,
      triggers: this.triggers.size,
      total: this.tools.size + this.triggers.size,
    };
  }

  /**
   * Clear all registrations (for testing)
   */
  clear(): void {
    this.tools.clear();
    this.triggers.clear();
  }

  /**
   * Build execution context
   */
  private buildContext(
    _requiredCapabilities: Capability[] = [],
    overrides?: Partial<SDKContext>
  ): SDKContext {
    const capabilities: Record<Capability, boolean> = {
      network: this.config.defaultCapabilities.includes('network'),
      filesystem: this.config.defaultCapabilities.includes('filesystem'),
      spawn: this.config.defaultCapabilities.includes('spawn'),
      env: this.config.defaultCapabilities.includes('env'),
    };

    return {
      workspaceId: this.config.workspaceId,
      logger: this.logger,
      capabilities,
      ...overrides,
    };
  }

  /**
   * Check if tool has required capabilities
   */
  private checkCapabilities(
    required: Capability[] = [],
    context: SDKContext
  ): void {
    for (const cap of required) {
      if (!context.capabilities[cap]) {
        throw new SDKError(
          SDKErrorCode.MISSING_CAPABILITY,
          `Tool requires capability "${cap}" which is not available in context`
        );
      }
    }
  }
}

/**
 * Create a new SDK instance
 */
export function createSDK(config?: SDKConfig): SDK {
  return new SDK(config);
}
