import { HealthStatus } from '@/modules/core/domain/HealthStatus';

describe('HealthStatus', () => {
  it('should create a HealthStatus with correct values', () => {
    const healthStatus = new HealthStatus('API is running', '1.0.0', 'development');

    expect(healthStatus.message).toBe('API is running');
    expect(healthStatus.version).toBe('1.0.0');
    expect(healthStatus.environment).toBe('development');
    expect(healthStatus.timestamp).toBeInstanceOf(Date);
  });

  it('should create a HealthStatus with default values', () => {
    const healthStatus = new HealthStatus();

    expect(healthStatus.message).toBe('API is running');
    expect(healthStatus.version).toBe('1.0.0');
    expect(healthStatus.environment).toBe('development');
    expect(healthStatus.timestamp).toBeInstanceOf(Date);
  });

  it('should have a valid timestamp', () => {
    const before = new Date();
    const healthStatus = new HealthStatus();
    const after = new Date();

    expect(healthStatus.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(healthStatus.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});