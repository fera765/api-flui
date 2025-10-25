import { ValidationError } from '@/shared/errors/ValidationError';

describe('ValidationError', () => {
  it('should create a ValidationError with default values', () => {
    const error = new ValidationError('Validation failed');

    expect(error.message).toBe('Validation failed');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should create a ValidationError with custom message', () => {
    const error = new ValidationError('Invalid email format');

    expect(error.message).toBe('Invalid email format');
    expect(error.statusCode).toBe(400);
    expect(error.isOperational).toBe(true);
  });

  it('should be instance of Error', () => {
    const error = new ValidationError('Test validation error');

    expect(error).toBeInstanceOf(Error);
  });

  it('should have correct name', () => {
    const error = new ValidationError('Test validation error');

    expect(error.name).toBe('ValidationError');
  });
});