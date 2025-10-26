import { randomUUID } from 'crypto';
import { spawn, ChildProcess } from 'child_process';
import { Tool } from '../../domain/Tool';
import { ISandbox, SandboxExecutionResult } from './ISandbox';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

/**
 * Real MCP Sandbox that connects to actual MCP servers
 * Supports NPX packages and SSE URLs
 */
export class RealMCPSandbox implements ISandbox {
  private tools: Map<string, Tool> = new Map();
  private client?: Client;
  private transport?: StdioClientTransport;
  private process?: ChildProcess;
  private env?: Record<string, string>;

  public async initialize(env?: Record<string, string>): Promise<void> {
    this.env = env;
  }

  public async loadMCP(source: string): Promise<void> {
    // Determine source type
    if (source.startsWith('http://') || source.startsWith('https://')) {
      await this.connectSSE(source);
    } else {
      await this.connectNPX(source);
    }
  }

  private async connectNPX(packageName: string): Promise<void> {
    try {
      // Start MCP server via npx
      const args = ['-y', packageName];
      
      this.process = spawn('npx', args, {
        env: { ...process.env, ...this.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Create MCP client transport
      this.transport = new StdioClientTransport({
        command: 'npx',
        args,
        env: this.env,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'flui-automation',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      // Connect client to transport
      await this.client.connect(this.transport);

    } catch (error) {
      console.error('Error connecting to NPX MCP:', error);
      throw new Error(`Failed to load MCP from NPX: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async connectSSE(_url: string): Promise<void> {
    // SSE implementation would go here
    // For now, throw error as it's not implemented yet
    throw new Error('SSE MCPs not yet implemented');
  }

  public async extractTools(): Promise<Tool[]> {
    if (!this.client) {
      return [];
    }

    try {
      // List tools from MCP server
      const result = await this.client.listTools();
      
      const tools: Tool[] = [];

      for (const toolDef of result.tools) {
        const tool = new Tool({
          id: randomUUID(),
          name: toolDef.name,
          description: toolDef.description,
          inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
          outputSchema: { type: 'object' }, // MCP doesn't define output schema explicitly
          executor: async (input: unknown) => {
            return await this.executeToolInternal(toolDef.name, input);
          },
        });

        tools.push(tool);
        this.tools.set(tool.getName(), tool);
      }

      return tools;
    } catch (error) {
      console.error('Error extracting tools:', error);
      throw new Error(`Failed to extract tools: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeToolInternal(toolName: string, input: unknown): Promise<unknown> {
    if (!this.client) {
      throw new Error('MCP client not connected');
    }

    try {
      const result = await this.client.callTool({
        name: toolName,
        arguments: input as Record<string, unknown>,
      });

      return result.content;
    } catch (error) {
      console.error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  public async executeTool(toolName: string, input: unknown): Promise<SandboxExecutionResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found in sandbox`,
      };
    }

    try {
      const result = await tool.execute(input);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async destroy(): Promise<void> {
    try {
      // Close MCP client
      if (this.client) {
        await this.client.close();
        this.client = undefined;
      }

      // Close transport
      if (this.transport) {
        await this.transport.close();
        this.transport = undefined;
      }

      // Kill process
      if (this.process && !this.process.killed) {
        this.process.kill();
        this.process = undefined;
      }

      this.tools.clear();
    } catch (error) {
      console.error('Error destroying sandbox:', error);
    }
  }
}
