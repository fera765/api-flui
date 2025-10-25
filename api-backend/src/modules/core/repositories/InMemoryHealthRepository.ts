import { IHealthRepository } from './IHealthRepository';
import { HealthStatus } from '../domain/HealthStatus';

export class InMemoryHealthRepository implements IHealthRepository {
  async getHealthStatus(): Promise<HealthStatus> {
    return new HealthStatus();
  }
}