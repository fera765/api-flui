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
    // Validate package name format
    if (!packageName || packageName.trim() === '') {
      throw new Error('Package name is required');
    }

    console.log(`[MCP] Connecting to NPX package: ${packageName}`);
    
    // Try multiple connection strategies for maximum compatibility
    const strategies = [
      // Strategy 1: Direct npx execution (most compatible)
      { name: 'direct', args: ['-y', packageName] },
      // Strategy 2: With explicit executable name discovery
      { name: 'explicit', args: await this.getExplicitArgs(packageName) },
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      if (!strategy.args) continue; // Skip if args couldn't be determined
      
      try {
        console.log(`[MCP] Trying strategy: ${strategy.name}`);
        console.log(`[MCP] Command: npx ${strategy.args.join(' ')}`);
        
        await this.connectWithArgs(packageName, strategy.args);
        console.log(`[MCP] Successfully connected using strategy: ${strategy.name}`);
        return; // Success!
        
      } catch (error) {
        console.log(`[MCP] Strategy ${strategy.name} failed:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // Clean up failed attempt
        if (this.client) {
          try { await this.client.close(); } catch {}
          this.client = undefined;
        }
        if (this.transport) {
          try { await this.transport.close(); } catch {}
          this.transport = undefined;
        }
      }
    }

    // All strategies failed
    console.error('[MCP] All connection strategies failed');
    throw new Error(
      `Failed to connect to MCP package "${packageName}". ` +
      `Please verify: 1) Package name is correct, ` +
      `2) Package exists on NPM and has MCP support, ` +
      `3) You have internet connection, ` +
      `4) Your environment has npx available. ` +
      `Last error: ${lastError?.message || 'Unknown error'}`
    );
  }

  private async getExplicitArgs(packageName: string): Promise<string[] | null> {
    try {
      const executableName = await this.discoverExecutableName(packageName);
      if (executableName) {
        return ['-y', `--package=${packageName}`, executableName];
      }
    } catch (error) {
      console.log('[MCP] Could not discover executable name, will skip explicit strategy');
    }
    return null;
  }

  private async connectWithArgs(_packageName: string, args: string[]): Promise<void> {
    const envVars = this.env ? { ...this.env } : undefined;
    
    this.transport = new StdioClientTransport({
      command: 'npx',
      args: args,
      env: envVars,
    });

    this.client = new Client(
      {
        name: 'flui-automation',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    // Connect with timeout to fail fast
    await Promise.race([
      this.client.connect(this.transport),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000)
      )
    ]);
  }

  /**
   * Discover the executable name from NPM registry
   * Queries npm view to get the bin field
   */
  private async discoverExecutableName(packageName: string): Promise<string | null> {
    try {
      // Query NPM for bin field (suppress stderr)
      const result = execSync(`npm view ${packageName} bin --json 2>/dev/null || echo "{}"`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const trimmed = result.trim();
      if (!trimmed || trimmed === '{}') {
        return this.getFallbackExecutableName(packageName);
      }
      
      const binData = JSON.parse(trimmed);
      
      // bin can be a string or an object
      if (typeof binData === 'string') {
        // Single bin
        return packageName.split('/').pop() || null;
      } else if (typeof binData === 'object' && binData !== null) {
        // Multiple bins - get first key
        const binNames = Object.keys(binData);
        if (binNames.length > 0) {
          return binNames[0];
        }
      }
      
      return this.getFallbackExecutableName(packageName);
    } catch (error) {
      // Silently fallback
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
