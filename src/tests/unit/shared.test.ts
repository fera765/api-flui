import * as shared from '@shared/index';

describe('Shared Index', () => {
  it('should export AppError', () => {
    expect(shared).toHaveProperty('AppError');
    expect(typeof shared.AppError).toBe('function');
  });

  it('should export formatDate', () => {
    expect(shared).toHaveProperty('formatDate');
    expect(typeof shared.formatDate).toBe('function');
  });

  it('should export getCurrentTimestamp', () => {
    expect(shared).toHaveProperty('getCurrentTimestamp');
    expect(typeof shared.getCurrentTimestamp).toBe('function');
  });

  it('should have all expected exports', () => {
    const exports = Object.keys(shared);
    expect(exports).toContain('AppError');
    expect(exports).toContain('formatDate');
    expect(exports).toContain('getCurrentTimestamp');
  });
});
