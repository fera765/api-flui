import { HealthCheck, HealthCheckResponse } from '../domain/HealthCheck';
import { getCurrentTimestamp } from '@shared/utils';

export interface IHealthCheckService {
  execute(): HealthCheckResponse;
}

export class HealthCheckService implements IHealthCheckService {
  public execute(): HealthCheckResponse {
    const healthCheck = new HealthCheck(
      'success',
      'API is running',
      getCurrentTimestamp()
    );

    return healthCheck.toJSON();
  }
}
