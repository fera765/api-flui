import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@shared/utils/asyncHandler';

describe('asyncHandler', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should handle async function that resolves', async () => {
    const handler = asyncHandler(async (_req, res) => {
      return res as Response;
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors and pass to next', async () => {
    const error = new Error('Test error');
    const handler = asyncHandler(async () => {
      throw error;
    });

    await handler(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });

  it('should handle async function that rejects', (done) => {
    const error = new Error('Async rejection');
    const handler = asyncHandler(async () => {
      return Promise.reject(error);
    });

    handler(mockRequest as Request, mockResponse as Response, mockNext);

    // Give time for the promise to reject and next to be called
    setImmediate(() => {
      expect(mockNext).toHaveBeenCalledWith(error);
      done();
    });
  });
});
