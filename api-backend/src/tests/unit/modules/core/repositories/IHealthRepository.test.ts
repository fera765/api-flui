import { IHealthRepository } from '@/modules/core/repositories/IHealthRepository';
import { HealthStatus } from '@/modules/core/domain/HealthStatus';

// Mock implementation for testing
class MockHealthRepository implements IHealthRepository {
  async getHealthStatus(): Promise<HealthStatus> {
    return new HealthStatus('Test API is running', '1.0.0', 'test');
  }
}

describe('IHealthRepository', () => {
  let repository: IHealthRepository;

  beforeEach(() => {
    repository = new MockHealthRepository();
  });

  it('should return a HealthStatus when getHealthStatus is called', async () => {
    const result = await repository.getHealthStatus();

    expect(result).toBeInstanceOf(HealthStatus);
    expect(result.message).toBe('Test API is running');
    expect(result.version).toBe('1.0.0');
    expect(result.environment).toBe('test');
  });
});