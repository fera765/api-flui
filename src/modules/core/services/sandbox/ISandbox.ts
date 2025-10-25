import { Tool } from '../../domain/Tool';

export interface SandboxExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface ISandbox {
  /**
   * Initialize the sandbox with given environment variables
   */
  initialize(env?: Record<string, string>): Promise<void>;

  /**
   * Load MCP from NPX package or URL
   */
  loadMCP(source: string): Promise<void>;

  /**
   * Extract all available tools/functions from the loaded MCP
   */
  extractTools(): Promise<Tool[]>;

  /**
   * Execute a tool within the sandbox
   */
  executeTool(toolName: string, input: unknown): Promise<SandboxExecutionResult>;

  /**
   * Cleanup and destroy the sandbox
   */
  destroy(): Promise<void>;
}
