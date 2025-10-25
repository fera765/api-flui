import { Request, Response, NextFunction } from 'express';
import { errorHandler } from '@http/middlewares';
import { AppError } from '@shared/errors';

describe('Middlewares', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
    mockNext = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('errorHandler', () => {
    it('should handle AppError with custom status code', () => {
      const error = new AppError('Custom error', 404);

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Custom error',
      });
    });

    it('should handle AppError with default status code', () => {
      const error = new AppError('Bad request');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Bad request',
      });
    });

    it('should handle generic Error with 500 status', () => {
      const error = new Error('Unexpected error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        status: 'error',
        message: 'Internal server error',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should log non-AppError errors to console', () => {
      const error = new Error('System error');

      errorHandler(
        error,
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
