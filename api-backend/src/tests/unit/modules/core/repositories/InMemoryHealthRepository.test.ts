import { InMemoryHealthRepository } from '@/modules/core/repositories/InMemoryHealthRepository';
import { HealthStatus } from '@/modules/core/domain/HealthStatus';

describe('InMemoryHealthRepository', () => {
  let repository: InMemoryHealthRepository;

  beforeEach(() => {
    repository = new InMemoryHealthRepository();
  });

  it('should return a HealthStatus when getHealthStatus is called', async () => {
    const result = await repository.getHealthStatus();

    expect(result).toBeInstanceOf(HealthStatus);
    expect(result.message).toBe('API is running');
    expect(result.version).toBe('1.0.0');
    expect(result.environment).toBe('development');
  });

  it('should return a new HealthStatus instance each time', async () => {
    const result1 = await repository.getHealthStatus();
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));
    const result2 = await repository.getHealthStatus();

    expect(result1).not.toBe(result2);
    expect(result1.timestamp).not.toEqual(result2.timestamp);
  });
});