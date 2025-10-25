import { Request, Response } from 'express';
import { HealthService } from '../services/HealthService';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  async getHealth(_req: Request, res: Response): Promise<void> {
    try {
      const healthStatus = await this.healthService.getHealthStatus();
      
      res.status(200).json({
        message: healthStatus.message,
        version: healthStatus.version,
        environment: healthStatus.environment,
        timestamp: healthStatus.timestamp
      });
    } catch (error) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}