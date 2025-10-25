import { AppError } from '@shared/errors';

describe('AppError', () => {
  it('should create an AppError with message and default status code', () => {
    const error = new AppError('Test error');

    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  it('should create an AppError with custom status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
  });

  it('should be instance of Error', () => {
    const error = new AppError('Test');

    expect(error instanceof Error).toBe(true);
  });

  it('should have correct prototype', () => {
    const error = new AppError('Test');

    expect(Object.getPrototypeOf(error)).toBe(AppError.prototype);
  });
});
