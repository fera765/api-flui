import { Request, Response } from 'express';
import { HealthCheckService } from '../services/HealthCheckService';

export class HealthCheckController {
  private healthCheckService: HealthCheckService;

  constructor() {
    this.healthCheckService = new HealthCheckService();
  }

  public handle(_request: Request, response: Response): Response {
    const healthCheck = this.healthCheckService.execute();
    return response.status(200).json(healthCheck);
  }
}
