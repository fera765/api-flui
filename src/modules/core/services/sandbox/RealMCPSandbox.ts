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
    console.log('[MCP-DEBUG] 📥 loadMCP() called with source:', source);
    
    // Determine source type
    if (source.startsWith('http://') || source.startsWith('https://')) {
      console.log('[MCP-DEBUG] 🌐 Detected SSE source');
      await this.connectSSE(source);
    } else {
      console.log('[MCP-DEBUG] 📦 Detected NPX source');
      await this.connectNPX(source);
    }
    
    console.log('[MCP-DEBUG] ✅ loadMCP() completed successfully');
  }

  private async connectNPX(packageName: string): Promise<void> {
    // Validate package name format
    if (!packageName || packageName.trim() === '') {
      throw new Error('Package name is required');
    }

    console.log(`[MCP] Connecting to NPX package: ${packageName}`);
    
    // Try multiple connection strategies for maximum compatibility
    const strategies = [
      // Strategy 1: Direct npx execution (most compatible, 2 minutes timeout)
      { name: 'direct', args: ['-y', packageName], timeout: 120000 },
      // Strategy 2: With explicit executable name discovery
      { name: 'explicit', args: await this.getExplicitArgs(packageName), timeout: 120000 },
      // Strategy 3: Try with .js extension if available
      { name: 'explicit-js', args: await this.getExplicitArgsWithJS(packageName), timeout: 120000 },
    ];

    let lastError: Error | null = null;

    for (const strategy of strategies) {
      if (!strategy.args) continue; // Skip if args couldn't be determined
      
      try {
        console.log(`[MCP] Trying strategy: ${strategy.name} (timeout: ${strategy.timeout}ms)`);
        console.log(`[MCP] Command: npx ${strategy.args.join(' ')}`);
        
        await this.connectWithArgs(packageName, strategy.args, strategy.timeout);
        console.log(`[MCP] ✅ Successfully connected using strategy: ${strategy.name}`);
        return; // Success!
        
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`[MCP] ❌ Strategy ${strategy.name} failed: ${errorMsg}`);
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
        
        // Small delay between attempts
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // All strategies failed
    console.error('[MCP] ❌ All connection strategies failed');
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

  private async getExplicitArgsWithJS(packageName: string): Promise<string[] | null> {
    try {
      const result = execSync(`npm view ${packageName} bin --json 2>/dev/null || echo "{}"`, {
        encoding: 'utf-8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      const binData = JSON.parse(result.trim() || '{}');
      
      if (typeof binData === 'object' && binData !== null) {
        const binNames = Object.keys(binData);
        if (binNames.length > 0) {
          const binName = binNames[0];
          const binPath = binData[binName];
          
          // Try with .js extension if the bin path includes it
          if (binPath && typeof binPath === 'string' && binPath.endsWith('.js')) {
            return ['-y', `--package=${packageName}`, binName];
          }
        }
      }
    } catch (error) {
      // Silently skip
    }
    return null;
  }

  private async connectWithArgs(_packageName: string, args: string[], timeout: number = 30000): Promise<void> {
    const envVars = this.env ? { ...this.env } : undefined;
    
    console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[MCP-DEBUG] 🔧 connectWithArgs() - Starting connection process`);
    console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`[MCP-DEBUG] 📦 Command: npx ${args.join(' ')}`);
    console.log(`[MCP-DEBUG] ⏱️  Timeout: ${timeout}ms (${timeout/1000}s)`);
    console.log(`[MCP-DEBUG] 🌍 Environment vars:`, envVars ? Object.keys(envVars) : 'none');
    
    console.log(`[MCP-DEBUG] Step 1/3: Creating StdioClientTransport...`);
    
    try {
      this.transport = new StdioClientTransport({
        command: 'npx',
        args: args,
        env: envVars,
      });
      console.log(`[MCP-DEBUG] ✅ StdioClientTransport created successfully`);
    } catch (error) {
      console.error(`[MCP-DEBUG] ❌ Failed to create StdioClientTransport:`, error);
      throw error;
    }

    console.log(`[MCP-DEBUG] Step 2/3: Creating MCP Client...`);

    try {
      this.client = new Client(
        {
          name: 'flui-automation',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );
      console.log(`[MCP-DEBUG] ✅ Client created successfully`);
    } catch (error) {
      console.error(`[MCP-DEBUG] ❌ Failed to create Client:`, error);
      throw error;
    }
    console.log(`[MCP-DEBUG] Step 3/3: Connecting client to transport...`);
    console.log(`[MCP-DEBUG] ⏱️  Starting timer for ${timeout/1000}s timeout...`);
    
    const startTime = Date.now();
    let connectionResolved = false;
    let timeoutReached = false;
    
    try {
      // Connect with configurable timeout
      await Promise.race([
        this.client.connect(this.transport).then(() => {
          const elapsed = Date.now() - startTime;
          connectionResolved = true;
          console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`[MCP-DEBUG] ✅ Connection SUCCESSFUL!`);
          console.log(`[MCP-DEBUG] ⏱️  Time taken: ${elapsed}ms`);
          console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        }).catch((err) => {
          const elapsed = Date.now() - startTime;
          console.error(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.error(`[MCP-DEBUG] ❌ Connection promise REJECTED`);
          console.error(`[MCP-DEBUG] ⏱️  Time: ${elapsed}ms`);
          console.error(`[MCP-DEBUG] ❌ Error:`, err);
          console.error(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          throw err;
        }),
        new Promise((_, reject) => 
          setTimeout(() => {
            const elapsed = Date.now() - startTime;
            timeoutReached = true;
            console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`[MCP-DEBUG] ⏱️  TIMEOUT REACHED!`);
            console.log(`[MCP-DEBUG] ⏱️  Elapsed: ${elapsed}ms`);
            console.log(`[MCP-DEBUG] ⏱️  Configured timeout: ${timeout}ms`);
            console.log(`[MCP-DEBUG] ❌ Connection did not complete in time`);
            console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            reject(new Error(`Connection timeout after ${timeout/1000}s`));
          }, timeout)
        )
      ]);
      
      console.log(`[MCP-DEBUG] ✅ Promise.race completed successfully`);
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`[MCP-DEBUG] ❌ connectWithArgs() FAILED`);
      console.log(`[MCP-DEBUG] ⏱️  Total time: ${elapsed}ms`);
      console.log(`[MCP-DEBUG] 📊 Connection resolved: ${connectionResolved}`);
      console.log(`[MCP-DEBUG] 📊 Timeout reached: ${timeoutReached}`);
      console.log(`[MCP-DEBUG] ❌ Error:`, error instanceof Error ? error.message : String(error));
      console.log(`[MCP-DEBUG] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      throw error;
    }
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
    console.log('[MCP-DEBUG] 🔧 Starting extractTools()...');
    
    if (!this.client) {
      console.log('[MCP-DEBUG] ❌ No client available!');
      return [];
    }

    console.log('[MCP-DEBUG] ✅ Client exists, calling listTools()...');

    try {
      // List tools from MCP server
      const startTime = Date.now();
      const result = await this.client.listTools();
      const elapsed = Date.now() - startTime;
      
      console.log(`[MCP-DEBUG] ✅ listTools() returned in ${elapsed}ms`);
      console.log(`[MCP-DEBUG] 📊 Found ${result.tools.length} tools`);
      
      const tools: Tool[] = [];

      for (const toolDef of result.tools) {
        console.log(`[MCP-DEBUG]   📌 Processing tool: ${toolDef.name}`);
        
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

      console.log(`[MCP-DEBUG] ✅ All ${tools.length} tools processed successfully`);
      return tools;
    } catch (error) {
      console.error('[MCP-DEBUG] ❌ Error extracting tools:', error);
      console.error('[MCP-DEBUG] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[MCP-DEBUG] ❌ Error message:', error instanceof Error ? error.message : String(error));
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
