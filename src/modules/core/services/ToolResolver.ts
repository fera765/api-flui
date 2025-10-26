import { Tool } from '../domain/Tool';
import { ISystemToolRepository } from '../repositories/ISystemToolRepository';
import { IMCPRepository } from '../repositories/IMCPRepository';

/**
 * ToolResolver - Unified tool resolution from multiple sources
 * Resolves tools from SystemTools and MCP tools
 */
export class ToolResolver {
  constructor(
    private readonly systemToolRepository: ISystemToolRepository,
    private readonly mcpRepository: IMCPRepository
  ) {}

  /**
   * Find tool by ID from any source (SystemTools or MCPs)
   */
  public async findToolById(toolId: string): Promise<Tool | null> {
    // Try SystemTools first
    const systemTool = await this.systemToolRepository.findById(toolId);
    if (systemTool) {
      // Convert SystemTool to Tool
      return new Tool({
        id: systemTool.getId(),
        name: systemTool.getName(),
        description: systemTool.getDescription(),
        inputSchema: systemTool.getInputSchema() || { type: 'object' },
        outputSchema: systemTool.getOutputSchema() || { type: 'object' },
        executor: async (input: unknown) => await systemTool.execute(input),
      });
    }

    // Try MCPs
    const allMCPs = await this.mcpRepository.findAll();
    
    for (const mcp of allMCPs) {
      const mcpTools = mcp.getTools();
      const tool = mcpTools.find(t => t.getId() === toolId);
      
      if (tool) {
        return tool;
      }
    }

    return null;
  }

  /**
   * Get all available tools from all sources
   */
  public async getAllTools(): Promise<Tool[]> {
    const tools: Tool[] = [];

    // Get SystemTools
    const systemTools = await this.systemToolRepository.findAll();
    for (const systemTool of systemTools) {
      tools.push(new Tool({
        id: systemTool.getId(),
        name: systemTool.getName(),
        description: systemTool.getDescription(),
        inputSchema: systemTool.getInputSchema() || { type: 'object' },
        outputSchema: systemTool.getOutputSchema() || { type: 'object' },
        executor: async (input: unknown) => await systemTool.execute(input),
      }));
    }

    // Get MCP Tools
    const allMCPs = await this.mcpRepository.findAll();
    for (const mcp of allMCPs) {
      tools.push(...mcp.getTools());
    }

    return tools;
  }

  /**
   * Get tools by IDs
   */
  public async getToolsByIds(toolIds: string[]): Promise<Tool[]> {
    const tools: Tool[] = [];

    for (const toolId of toolIds) {
      const tool = await this.findToolById(toolId);
      if (tool) {
        tools.push(tool);
      }
    }

    return tools;
  }

  /**
   * Search tools by name or description
   */
  public async searchTools(query: string): Promise<Tool[]> {
    const allTools = await this.getAllTools();
    const lowerQuery = query.toLowerCase();

    return allTools.filter(tool => 
      tool.getName().toLowerCase().includes(lowerQuery) ||
      tool.getDescription()?.toLowerCase().includes(lowerQuery)
    );
  }
}
