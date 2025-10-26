import { randomUUID } from 'crypto';
import { execSync } from 'child_process';
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
      // Validate package name format
      if (!packageName || packageName.trim() === '') {
        throw new Error('Package name is required');
      }

      // Discover the executable name from NPM
      console.log(`[MCP] Discovering executable for package: ${packageName}`);
      const executableName = await this.discoverExecutableName(packageName);
      
      if (!executableName) {
        throw new Error(`Could not determine executable name for package: ${packageName}`);
      }
      
      // Create MCP client transport (will spawn process automatically)
      const envVars = this.env ? { ...this.env } : undefined;
      
      console.log(`[MCP] Connecting to NPX package: ${packageName}`);
      console.log(`[MCP] Executable: ${executableName}`);
      console.log(`[MCP] Using command: npx -y --package=${packageName} ${executableName}`);
      
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: ['-y', `--package=${packageName}`, executableName],
        env: envVars,
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
      
      console.log(`[MCP] Successfully connected to ${packageName}`);

    } catch (error) {
      console.error('[MCP] Error connecting to NPX MCP:', error);
      
      // Provide helpful error message
      let errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMsg.includes('not found') || errorMsg.includes('Connection closed')) {
        throw new Error(
          `Failed to connect to MCP package "${packageName}". ` +
          `Please verify: 1) Package name is correct, ` +
          `2) Package exists on NPM and has MCP support, ` +
          `3) You have internet connection. ` +
          `Tested packages: @modelcontextprotocol/server-filesystem, @modelcontextprotocol/server-memory`
        );
      }
      
      throw new Error(`Failed to load MCP from NPX: ${errorMsg}`);
    }
  }

  /**
   * Discover the executable name from NPM registry
   * Queries npm view to get the bin field
   */
  private async discoverExecutableName(packageName: string): Promise<string | null> {
    try {
      console.log(`[MCP] Querying NPM for bin name: npm view ${packageName} bin`);
      
      // Query NPM for bin field
      const result = execSync(`npm view ${packageName} bin --json`, {
        encoding: 'utf-8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const binData = JSON.parse(result.trim());
      
      // bin can be a string or an object
      if (typeof binData === 'string') {
        // Single bin
        return packageName.split('/').pop() || null;
      } else if (typeof binData === 'object' && binData !== null) {
        // Multiple bins - get first key
        const binNames = Object.keys(binData);
        if (binNames.length > 0) {
          const binName = binNames[0];
          console.log(`[MCP] Found bin name: ${binName}`);
          return binName;
        }
      }
      
      return null;
    } catch (error) {
      console.error('[MCP] Error querying NPM for bin:', error);
      
      // Fallback: try common patterns
      return this.getFallbackExecutableName(packageName);
    }
  }

  /**
   * Fallback executable name detection
   */
  private getFallbackExecutableName(packageName: string): string {
    let name = packageName;
    
    // Handle scoped packages (@org/name)
    if (name.startsWith('@')) {
      const parts = name.split('/');
      if (parts.length === 2) {
        name = parts[1];
      }
    }
    
    // Most official MCP servers follow: server-xyz -> mcp-server-xyz
    if (name.startsWith('server-')) {
      return `mcp-${name}`;
    }
    
    // Fallback: use the package name as-is
    return name;
  }

  private async connectSSE(_url: string): Promise<void> {
    // SSE implementation note:
    // Most MCPs use stdio transport via npx
    // SSE support would require custom implementation per server
    // and is not part of the standard MCP protocol
    throw new Error('SSE MCPs require custom implementation per server. Please use NPX packages instead.');
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

      // Close transport (will also kill the spawned process)
      if (this.transport) {
        await this.transport.close();
        this.transport = undefined;
      }

      this.tools.clear();
    } catch (error) {
      console.error('Error destroying sandbox:', error);
    }
  }
}
