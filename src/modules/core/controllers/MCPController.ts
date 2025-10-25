import { Request, Response } from 'express';
import { MCPService } from '../services/MCPService';

export class MCPController {
  constructor(private readonly mcpService: MCPService) {}

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
}
