import { CreateMCPProps, ImportMCPResult, MCPResponse } from '../domain/MCP';
import { ToolResponse } from '../domain/Tool';
import { IMCPRepository } from '../repositories/IMCPRepository';
import { ISandbox } from './sandbox/ISandbox';
import { MockSandbox } from './sandbox/MockSandbox';
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
    if (!props.name || props.name.trim() === '') {
      throw new AppError('Name is required', 400);
    }

    if (!props.source || props.source.trim() === '') {
      throw new AppError('Source is required', 400);
    }

    // Create and initialize sandbox
    const sandbox = new MockSandbox();
    await sandbox.initialize(props.env);

    // Load MCP in sandbox
    await sandbox.loadMCP(props.source);

    // Extract tools from MCP
    const tools = await sandbox.extractTools();

    // Create MCP with extracted tools
    const mcp = await this.repository.create(props, tools);

    // Store sandbox for later use
    this.sandboxes.set(mcp.getId(), sandbox);

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
