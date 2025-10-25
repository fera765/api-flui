import { HealthStatus } from '../domain/HealthStatus';

export interface IHealthRepository {
  getHealthStatus(): Promise<HealthStatus>;
}