import { HealthService } from '@/modules/core/services/HealthService';
import { IHealthRepository } from '@/modules/core/repositories/IHealthRepository';
import { HealthStatus } from '@/modules/core/domain/HealthStatus';

// Mock repository
const mockRepository: jest.Mocked<IHealthRepository> = {
  getHealthStatus: jest.fn()
};

describe('HealthService', () => {
  let healthService: HealthService;

  beforeEach(() => {
    healthService = new HealthService(mockRepository);
    jest.clearAllMocks();
  });

  it('should return health status from repository', async () => {
    const expectedHealthStatus = new HealthStatus('API is running', '1.0.0', 'development');
    mockRepository.getHealthStatus.mockResolvedValue(expectedHealthStatus);

    const result = await healthService.getHealthStatus();

    expect(mockRepository.getHealthStatus).toHaveBeenCalledTimes(1);
    expect(result).toBe(expectedHealthStatus);
  });

  it('should handle repository errors', async () => {
    const error = new Error('Repository error');
    mockRepository.getHealthStatus.mockRejectedValue(error);

    await expect(healthService.getHealthStatus()).rejects.toThrow('Repository error');
  });
});