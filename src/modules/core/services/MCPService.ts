import { CreateMCPProps, ImportMCPResult, MCPResponse } from '../domain/MCP';
import { ToolResponse } from '../domain/Tool';
import { IMCPRepository } from '../repositories/IMCPRepository';
import { ISandbox } from './sandbox/ISandbox';
import { RealMCPSandbox } from './sandbox/RealMCPSandbox';
import { AppError } from '@shared/errors';

export interface IMCPService {
  importMCP(props: CreateMCPProps): Promise<ImportMCPResult>;
  getAllMCPs(): Promise<MCPResponse[]>;
  getMCPTools(id: string): Promise<ToolResponse[]>;
  deleteMCP(id: string): Promise<void>;
}

export class MCPService implements IMCPService {
  private sandboxes: Map<string, ISandbox> = new Map();

  constructor(private readonly repository: IMCPRepository) {}

  public async importMCP(props: CreateMCPProps): Promise<ImportMCPResult> {
    console.log('[MCPService] 🚀 Starting MCP import...');
    console.log('[MCPService] 📦 Package:', props.source);
    console.log('[MCPService] 🏷️  Name:', props.name);
    console.log('[MCPService] 📝 Description:', props.description);
    
    if (!props.name || props.name.trim() === '') {
      console.log('[MCPService] ❌ Validation failed: Name is required');
      throw new AppError('Name is required', 400);
    }

    if (!props.source || props.source.trim() === '') {
      console.log('[MCPService] ❌ Validation failed: Source is required');
      throw new AppError('Source is required', 400);
    }

    console.log('[MCPService] ✅ Validation passed');
    console.log('[MCPService] 🔧 Step 1/4: Creating sandbox...');
    
    // Create and initialize sandbox
    const sandbox = new RealMCPSandbox();
    
    console.log('[MCPService] ✅ Sandbox created');
    console.log('[MCPService] 🔧 Step 2/4: Initializing sandbox...');
    
    await sandbox.initialize(props.env);
    
    console.log('[MCPService] ✅ Sandbox initialized');
    console.log('[MCPService] 🔧 Step 3/4: Loading MCP...');
    console.log('[MCPService] ⏱️  This may take up to 2 minutes...');

    const loadStartTime = Date.now();
    try {
      await sandbox.loadMCP(props.source);
      const loadElapsed = Date.now() - loadStartTime;
      console.log(`[MCPService] ✅ MCP loaded successfully in ${loadElapsed}ms`);
    } catch (error) {
      const loadElapsed = Date.now() - loadStartTime;
      console.error(`[MCPService] ❌ Failed to load MCP after ${loadElapsed}ms`);
      console.error('[MCPService] ❌ Error:', error);
      throw error;
    }

    console.log('[MCPService] 🔧 Step 4/4: Extracting tools...');

    // Extract tools from MCP
    const extractStartTime = Date.now();
    let tools;
    try {
      tools = await sandbox.extractTools();
      const extractElapsed = Date.now() - extractStartTime;
      console.log(`[MCPService] ✅ Tools extracted in ${extractElapsed}ms`);
      console.log(`[MCPService] 📊 Total tools found: ${tools.length}`);
    } catch (error) {
      const extractElapsed = Date.now() - extractStartTime;
      console.error(`[MCPService] ❌ Failed to extract tools after ${extractElapsed}ms`);
      console.error('[MCPService] ❌ Error:', error);
      throw error;
    }

    console.log('[MCPService] 💾 Saving MCP to repository...');
    
    // Create MCP with extracted tools
    const mcp = await this.repository.create(props, tools);
    
    console.log('[MCPService] ✅ MCP saved with ID:', mcp.getId());

    // Store sandbox for later use
    this.sandboxes.set(mcp.getId(), sandbox);
    
    console.log('[MCPService] ✅ Sandbox stored for future use');
    console.log('[MCPService] 🎉 Import completed successfully!');
    console.log('[MCPService] 📊 Summary:');
    console.log(`[MCPService]    - MCP ID: ${mcp.getId()}`);
    console.log(`[MCPService]    - Name: ${props.name}`);
    console.log(`[MCPService]    - Tools: ${tools.length}`);

    return {
      mcp: mcp.toJSON(),
      toolsExtracted: tools.length,
    };
  }

  public async getAllMCPs(): Promise<MCPResponse[]> {
    const mcps = await this.repository.findAll();
    return mcps.map(mcp => mcp.toJSON());
  }

  public async getMCPTools(id: string): Promise<ToolResponse[]> {
    const mcp = await this.repository.findById(id);

    if (!mcp) {
      throw new AppError('MCP not found', 404);
    }

    return mcp.getTools().map(tool => tool.toJSON());
  }

  public async deleteMCP(id: string): Promise<void> {
    // Check if MCP exists
    const mcp = await this.repository.findById(id);
    if (!mcp) {
      throw new AppError('MCP not found', 404);
    }

    // Destroy sandbox
    const sandbox = this.sandboxes.get(id);
    if (sandbox) {
      await sandbox.destroy();
      this.sandboxes.delete(id);
    }

    // Delete MCP from repository
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'MCP not found') {
        throw new AppError('MCP not found', 404);
      }
      throw error;
    }
  }

  public async executeTool(mcpId: string, toolName: string, input: unknown): Promise<unknown> {
    const sandbox = this.sandboxes.get(mcpId);

    if (!sandbox) {
      throw new AppError('MCP sandbox not found', 404);
    }

    const result = await sandbox.executeTool(toolName, input);

    if (!result.success) {
      throw new AppError(result.error || 'Tool execution failed', 500);
    }

    return result.result;
  }

  // Clean up all sandboxes (useful for testing)
  public async cleanup(): Promise<void> {
    for (const [id, sandbox] of this.sandboxes.entries()) {
      await sandbox.destroy();
      this.sandboxes.delete(id);
    }
  }
}
