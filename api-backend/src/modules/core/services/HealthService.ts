import { IHealthRepository } from '../repositories/IHealthRepository';
import { HealthStatus } from '../domain/HealthStatus';

export class HealthService {
  constructor(private readonly healthRepository: IHealthRepository) {}

  async getHealthStatus(): Promise<HealthStatus> {
    return await this.healthRepository.getHealthStatus();
  }
}