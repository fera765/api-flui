import { AppError } from '@/shared/errors/AppError';

describe('AppError', () => {
  it('should create an AppError with default values', () => {
    const error = new AppError('Test error message');

    expect(error.message).toBe('Test error message');
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should create an AppError with custom status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('should be instance of Error', () => {
    const error = new AppError('Test error');

    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name', () => {
    const error = new AppError('Test error');

    expect(error.name).toBe('AppError');
  });
});