import { Router } from 'express';
import { Request, Response } from 'express';
import { ToolResolver } from '../services/ToolResolver';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { systemToolRepository, mcpRepository, agentRepository } from '@shared/repositories/singletons';

const allToolsRoutes = Router();

// Create ToolResolver singleton
const toolResolver = new ToolResolver(systemToolRepository, mcpRepository);

/**
 * GET /api/all-tools
 * Returns all tools from SystemTools + MCPs + Agents
 * Query params:
 *   - page: number (default: 1)
 *   - pageSize: number (default: 50, max: 100)
 *   - category: 'system' | 'mcp' | 'agent' | 'all' (default: 'all')
 *   - mcpId: string (filter by specific MCP)
 *   - agentId: string (filter by specific Agent)
 */
allToolsRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    // Parse query params
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 50));
    const category = (req.query.category as string) || 'all';
    const mcpId = req.query.mcpId as string;
    const agentId = req.query.agentId as string;
    
    // Build response structure
    const response: any = {
      tools: {
        system: [],
        mcps: [],
        agents: [],
      },
      pagination: {
        page,
        pageSize,
        total: 0,
        totalPages: 0,
      },
      filters: {
        category,
        mcpId: mcpId || null,
        agentId: agentId || null,
      },
    };
    
    // Get System Tools (if requested)
    if (category === 'all' || category === 'system') {
      const systemTools = await systemToolRepository.findAll();
      response.tools.system = systemTools.map(tool => tool.toJSON());
    }
    
    // Get MCP Tools (if requested)
    if (category === 'all' || category === 'mcp') {
      const mcps = await mcpRepository.findAll();
      
      for (const mcp of mcps) {
        // Filter by specific MCP if requested
        if (mcpId && mcp.getId() !== mcpId) continue;
        
        const mcpTools = mcp.getTools();
        
        if (mcpTools.length > 0) {
          response.tools.mcps.push({
            mcp: {
              id: mcp.getId(),
              name: mcp.getName(),
              source: mcp.getSource(),
              sourceType: mcp.getSourceType(),
              description: mcp.getDescription(),
            },
            tools: mcpTools.map(tool => tool.toJSON()),
            toolsCount: mcpTools.length,
          });
        }
      }
    }
    
    // Get Agent Tools (if requested)
    if (category === 'all' || category === 'agent') {
      const agents = await agentRepository.findAll();
      
      for (const agent of agents) {
        // Filter by specific Agent if requested
        if (agentId && agent.getId() !== agentId) continue;
        
        const agentTools = agent.getTools();
        
        // Always include agent (even with 0 tools) to show agents as available tools
        response.tools.agents.push({
          agent: {
            id: agent.getId(),
            name: agent.getName(),
            description: agent.getDescription(),
            defaultModel: agent.getDefaultModel(),
          },
          tools: agentTools.map(tool => {
            // Handle both Tool instances and plain ToolResponse objects
            if (typeof tool === 'object' && 'toJSON' in tool && typeof tool.toJSON === 'function') {
              return tool.toJSON();
            }
            return tool;
          }),
          toolsCount: agentTools.length,
        });
      }
    }
    
    // Calculate totals
    const systemCount = response.tools.system.length;
    const mcpCount = response.tools.mcps.reduce((acc: number, m: any) => acc + m.toolsCount, 0);
    // Agents themselves are tools - count the agents, not their sub-tools
    const agentCount = response.tools.agents.length;
    const totalTools = systemCount + mcpCount + agentCount;
    
    response.summary = {
      systemTools: systemCount,
      mcpTools: mcpCount,
      agentTools: agentCount,
      totalTools: totalTools,
      mcpsCount: response.tools.mcps.length,
      agentsCount: response.tools.agents.length,
    };
    
    // Apply pagination to flat list (for API compatibility)
    const allToolsFlat: any[] = [
      ...response.tools.system,
      ...response.tools.mcps.flatMap((m: any) => m.tools.map((t: any) => ({ ...t, source: 'mcp', mcpName: m.mcp.name }))),
      ...response.tools.agents.flatMap((a: any) => a.tools.map((t: any) => ({ ...t, source: 'agent', agentName: a.agent.name }))),
    ];
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTools = allToolsFlat.slice(startIndex, endIndex);
    
    response.pagination.total = totalTools;
    response.pagination.totalPages = Math.ceil(totalTools / pageSize);
    response.toolsPaginated = paginatedTools;
    
    res.json(response);
  })
);

/**
 * GET /api/all-tools/search?q={query}
 * Search tools by name or description
 */
allToolsRoutes.get(
  '/search',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Query parameter "q" is required' });
      return;
    }
    
    const tools = await toolResolver.searchTools(q);
    const toolResponses = tools.map(tool => tool.toJSON());
    
    res.json({
      query: q,
      tools: toolResponses,
      total: toolResponses.length,
    });
  })
);

// Export for testing
export const __testOnlyAllTools__ = {
  getResolver: () => toolResolver,
};

export { allToolsRoutes };
