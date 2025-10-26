import { Router } from 'express';
import { Request, Response } from 'express';
import { ToolResolver } from '../services/ToolResolver';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { systemToolRepository, mcpRepository } from '@shared/repositories/singletons';

const allToolsRoutes = Router();

// Create ToolResolver singleton
const toolResolver = new ToolResolver(systemToolRepository, mcpRepository);

/**
 * GET /api/all-tools
 * Returns all tools from SystemTools + MCPs
 */
allToolsRoutes.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const tools = await toolResolver.getAllTools();
    const toolResponses = tools.map(tool => tool.toJSON());
    
    res.json({
      tools: toolResponses,
      total: toolResponses.length,
      sources: {
        system: toolResponses.filter((t: any) => !t.id.startsWith('tool-')).length,
        mcp: toolResponses.filter((t: any) => t.id.startsWith('tool-')).length,
      },
    });
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
