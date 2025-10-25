import { Request, Response } from 'express';
import { SystemToolService } from '../services/SystemToolService';

export class SystemToolController {
  constructor(private readonly toolService: SystemToolService) {}

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, description, type, config, inputSchema, outputSchema, executor } = request.body;

    const tool = await this.toolService.createTool({
      name,
      description,
      type,
      config,
      inputSchema,
      outputSchema,
      executor: executor || (async (input: unknown) => input),
    });

    return response.status(201).json(tool);
  }

  public async getAll(_request: Request, response: Response): Promise<Response> {
    const tools = await this.toolService.getAllTools();
    return response.status(200).json(tools);
  }

  public async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const tool = await this.toolService.getToolById(id);
    return response.status(200).json(tool);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.toolService.deleteTool(id);
    return response.status(204).send();
  }

  public async execute(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const input = request.body;

    const result = await this.toolService.executeTool(id, input);
    return response.status(200).json(result);
  }

  public async executeWebHook(request: Request, response: Response): Promise<Response> {
    const { toolId } = request.params;
    const token = request.headers.authorization?.replace('Bearer ', '') || '';
    const payload = request.method === 'GET' ? request.query : request.body;

    const result = await this.toolService.executeWebHook(toolId, token, payload);
    return response.status(200).json(result);
  }
}
