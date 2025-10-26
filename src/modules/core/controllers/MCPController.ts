import { Request, Response } from 'express';
import { MCPService } from '../services/MCPService';
import { NPMMetadataService } from '../services/NPMMetadataService';

export class MCPController {
  private npmMetadataService: NPMMetadataService;

  constructor(private readonly mcpService: MCPService) {
    this.npmMetadataService = new NPMMetadataService();
  }

  public async import(request: Request, response: Response): Promise<Response> {
    const { name, source, description, env } = request.body;

    const result = await this.mcpService.importMCP({
      name,
      source,
      description,
      env,
    });

    return response.status(201).json(result);
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
