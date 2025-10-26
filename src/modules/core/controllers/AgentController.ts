import { Request, Response } from 'express';
import { AgentService } from '../services/AgentService';

export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, description, prompt, defaultModel, tools } = request.body;

    const agent = await this.agentService.createAgent({
      name,
      description,
      prompt,
      defaultModel,
      tools,
    });

    return response.status(201).json(agent);
  }

  public async getAll(_request: Request, response: Response): Promise<Response> {
    const agents = await this.agentService.getAllAgents();
    return response.status(200).json(agents);
  }

  public async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const agent = await this.agentService.getAgentById(id);
    return response.status(200).json(agent);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, description, prompt, defaultModel, tools } = request.body;

    const agent = await this.agentService.updateAgent(id, {
      name,
      description,
      prompt,
      defaultModel,
      tools,
    });

    return response.status(200).json(agent);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.agentService.deleteAgent(id);
    return response.status(204).send();
  }
}
