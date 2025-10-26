import { Request, Response } from 'express';
import { MCPService } from '../services/MCPService';
import { NPMMetadataService } from '../services/NPMMetadataService';

export class MCPController {
  private npmMetadataService: NPMMetadataService;

  constructor(private readonly mcpService: MCPService) {
    this.npmMetadataService = new NPMMetadataService();
  }

  public async import(request: Request, response: Response): Promise<Response> {
    console.log('[MCPController] 📨 Received import request');
    console.log('[MCPController] 📦 Body:', JSON.stringify(request.body, null, 2));
    
    const { name, source, description, env } = request.body;

    console.log('[MCPController] 🔄 Calling MCPService.importMCP()...');
    
    try {
      const startTime = Date.now();
      const result = await this.mcpService.importMCP({
        name,
        source,
        description,
        env,
      });
      const elapsed = Date.now() - startTime;
      
      console.log(`[MCPController] ✅ Import completed in ${elapsed}ms`);
      console.log('[MCPController] 📊 Result:', JSON.stringify(result, null, 2));
      
      return response.status(201).json(result);
    } catch (error) {
      console.error('[MCPController] ❌ Import failed');
      console.error('[MCPController] ❌ Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('[MCPController] ❌ Error message:', error instanceof Error ? error.message : String(error));
      console.error('[MCPController] ❌ Stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  public async getAll(_request: Request, response: Response): Promise<Response> {
    const mcps = await this.mcpService.getAllMCPs();
    return response.status(200).json(mcps);
  }

  public async getTools(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tools = await this.mcpService.getMCPTools(id);
    return response.status(200).json(tools);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.mcpService.deleteMCP(id);
    return response.status(204).send();
  }

  public async fetchMetadata(request: Request, response: Response): Promise<Response> {
    const { source, sourceType } = request.query;

    if (!source || typeof source !== 'string') {
      return response.status(400).json({ error: 'Source parameter is required' });
    }

    // Only support NPM packages for now
    if (sourceType !== 'npx') {
      return response.json({
        suggestedName: '',
        suggestedDescription: '',
        metadata: null
      });
    }

    try {
      const suggestions = await this.npmMetadataService.suggestMCPDetails(source);
      const metadata = await this.npmMetadataService.fetchMetadata(source);

      return response.json({
        suggestedName: suggestions.suggestedName,
        suggestedDescription: suggestions.suggestedDescription,
        metadata: metadata,
        exists: metadata !== null
      });
    } catch (error) {
      console.error('Error fetching metadata:', error);
      return response.status(500).json({ 
        error: 'Failed to fetch metadata',
        suggestedName: '',
        suggestedDescription: '',
        metadata: null
      });
    }
  }
}
