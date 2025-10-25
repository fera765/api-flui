import { HealthCheckService } from '@modules/core/services/HealthCheckService';

describe('HealthCheckService', () => {
  let healthCheckService: HealthCheckService;

  beforeEach(() => {
    healthCheckService = new HealthCheckService();
  });

  it('should execute and return a health check response', () => {
    const result = healthCheckService.execute();

    expect(result).toHaveProperty('status', 'success');
    expect(result).toHaveProperty('message', 'API is running');
    expect(result).toHaveProperty('timestamp');
  });

  it('should return a valid timestamp in ISO format', () => {
    const result = healthCheckService.execute();

    expect(result.timestamp).toBeDefined();
    expect(typeof result.timestamp).toBe('string');
    expect(new Date(result.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should return consistent structure on multiple calls', () => {
    const result1 = healthCheckService.execute();
    const result2 = healthCheckService.execute();

    expect(result1).toHaveProperty('status');
    expect(result1).toHaveProperty('message');
    expect(result1).toHaveProperty('timestamp');
    expect(result2).toHaveProperty('status');
    expect(result2).toHaveProperty('message');
    expect(result2).toHaveProperty('timestamp');
  });
});
