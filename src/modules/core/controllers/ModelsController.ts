import { Request, Response } from 'express';
import { ModelsService } from '../services/ModelsService';

export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  public async getModels(_request: Request, response: Response): Promise<Response> {
    const models = await this.modelsService.getModels();
    return response.status(200).json(models);
  }
}
