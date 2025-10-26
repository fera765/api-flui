import { Request, Response } from 'express';
import { DashboardService } from '../services/DashboardService';

export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  public async getStats(_request: Request, response: Response): Promise<Response> {
    const stats = await this.dashboardService.getStats();
    return response.status(200).json(stats);
  }
}
