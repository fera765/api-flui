import { Request, Response } from 'express';
import { HealthCheckController } from '@modules/core/controllers/HealthCheckController';

describe('HealthCheckController', () => {
  let healthCheckController: HealthCheckController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    healthCheckController = new HealthCheckController();
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should handle request and return 200 status', () => {
    healthCheckController.handle(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should return health check data with correct structure', () => {
    healthCheckController.handle(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'success',
        message: 'API is running',
        timestamp: expect.any(String),
      })
    );
  });

  it('should return valid timestamp in response', () => {
    healthCheckController.handle(
      mockRequest as Request,
      mockResponse as Response
    );

    const responseData = jsonMock.mock.calls[0][0];
    expect(new Date(responseData.timestamp).toString()).not.toBe('Invalid Date');
  });
});
