import { Request, Response } from 'express';
import { ConditionToolService } from '../services/ConditionToolService';

export class ConditionToolController {
  constructor(private conditionToolService: ConditionToolService) {}

  async create(request: Request, response: Response): Promise<Response> {
    const { name, description, conditions } = request.body;

    const conditionTool = await this.conditionToolService.createConditionTool({
      name,
      description,
      conditions,
    });

    return response.status(201).json(conditionTool);
  }

  async getAll(_request: Request, response: Response): Promise<Response> {
    const conditionTools = await this.conditionToolService.getAllConditionTools();
    return response.status(200).json(conditionTools);
  }

  async getById(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    const conditionTool = await this.conditionToolService.getConditionToolById(id);
    return response.status(200).json(conditionTool);
  }

  async update(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { name, description, conditions } = request.body;

    const conditionTool = await this.conditionToolService.updateConditionTool(id, {
      name,
      description,
      conditions,
    });

    return response.status(200).json(conditionTool);
  }

  async delete(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;

    await this.conditionToolService.deleteConditionTool(id);
    return response.status(204).send();
  }

  async evaluate(request: Request, response: Response): Promise<Response> {
    const { id } = request.params;
    const { input, evaluateAll } = request.body;

    const result = await this.conditionToolService.evaluateCondition(id, {
      input,
      evaluateAll,
    });

    return response.status(200).json(result);
  }
}
