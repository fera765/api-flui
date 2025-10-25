import { Request, Response } from 'express';
import { HealthController } from '@/modules/core/controllers/HealthController';
import { HealthService } from '@/modules/core/services/HealthService';
import { HealthStatus } from '@/modules/core/domain/HealthStatus';

// Mock service
const mockHealthService: jest.Mocked<HealthService> = {
  getHealthStatus: jest.fn()
} as any;

describe('HealthController', () => {
  let healthController: HealthController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    healthController = new HealthController(mockHealthService);
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  it('should return health status successfully', async () => {
    const expectedHealthStatus = new HealthStatus('API is running', '1.0.0', 'development');
    mockHealthService.getHealthStatus.mockResolvedValue(expectedHealthStatus);

    await healthController.getHealth(mockRequest as Request, mockResponse as Response);

    expect(mockHealthService.getHealthStatus).toHaveBeenCalledTimes(1);
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'API is running',
      version: '1.0.0',
      environment: 'development',
      timestamp: expectedHealthStatus.timestamp
    });
  });

  it('should handle service errors', async () => {
    const error = new Error('Service error');
    mockHealthService.getHealthStatus.mockRejectedValue(error);

    await healthController.getHealth(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Service error'
    });
  });
});