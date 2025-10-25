import { HealthCheck } from '@modules/core/domain/HealthCheck';

describe('HealthCheck Domain', () => {
  it('should create a HealthCheck instance with correct properties', () => {
    const timestamp = new Date().toISOString();
    const healthCheck = new HealthCheck('success', 'API is running', timestamp);

    const result = healthCheck.toJSON();

    expect(result).toEqual({
      status: 'success',
      message: 'API is running',
      timestamp,
    });
  });

  it('should return a valid JSON representation', () => {
    const timestamp = '2024-01-01T00:00:00.000Z';
    const healthCheck = new HealthCheck('success', 'Test message', timestamp);

    const json = healthCheck.toJSON();

    expect(json).toHaveProperty('status');
    expect(json).toHaveProperty('message');
    expect(json).toHaveProperty('timestamp');
    expect(typeof json.status).toBe('string');
    expect(typeof json.message).toBe('string');
    expect(typeof json.timestamp).toBe('string');
  });
});
