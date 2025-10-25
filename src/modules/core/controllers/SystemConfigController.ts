import { Request, Response } from 'express';
import { SystemConfigService } from '../services/SystemConfigService';

export class SystemConfigController {
  constructor(private readonly systemConfigService: SystemConfigService) {}

  public async getConfig(_request: Request, response: Response): Promise<Response> {
    const config = await this.systemConfigService.getConfig();
    return response.status(200).json(config);
  }

  public async createConfig(request: Request, response: Response): Promise<Response> {
    const { endpoint, apiKey, model } = request.body;

    const config = await this.systemConfigService.createConfig({
      endpoint,
      apiKey,
      model,
    });

    return response.status(201).json(config);
  }

  public async updateConfig(request: Request, response: Response): Promise<Response> {
    const { endpoint, apiKey, model } = request.body;

    const config = await this.systemConfigService.updateConfig({
      endpoint,
      apiKey,
      model,
    });

    return response.status(200).json(config);
  }
}
