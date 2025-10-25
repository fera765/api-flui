import { Request, Response } from 'express';
import { AutomationService } from '../services/AutomationService';

export class AutomationController {
  constructor(private readonly automationService: AutomationService) {}

  public async create(request: Request, response: Response): Promise<Response> {
    const { name, description, nodes, links } = request.body;

    const automation = await this.automationService.createAutomation({
      name,
      description,
      nodes,
      links,
    });

    return response.status(201).json(automation);
  }

  public async getAll(_request: Request, response: Response): Promise<Response> {
    const automations = await this.automationService.getAllAutomations();
    return response.status(200).json(automations);
  }

  public async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const automation = await this.automationService.getAutomationById(id);
    return response.status(200).json(automation);
  }

  public async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, description, nodes, links } = request.body;

    const automation = await this.automationService.updateAutomation(id, {
      name,
      description,
      nodes,
      links,
    });

    return response.status(200).json(automation);
  }

  public async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    await this.automationService.deleteAutomation(id);
    return response.status(204).send();
  }

  public async execute(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const input = request.body;

    const context = await this.automationService.executeAutomation(id, input);

    return response.status(200).json({
      automationId: context.automationId,
      executedNodes: Object.fromEntries(context.executedNodes),
      errors: Object.fromEntries(
        Array.from(context.errors.entries()).map(([key, error]) => [key, error.message])
      ),
    });
  }
}
