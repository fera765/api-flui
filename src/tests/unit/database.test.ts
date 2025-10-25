import { databaseConfig } from '@config/database';

describe('Database Config', () => {
  it('should have type property set to memory', () => {
    expect(databaseConfig).toHaveProperty('type');
    expect(databaseConfig.type).toBe('memory');
  });

  it('should return valid configuration object', () => {
    expect(databaseConfig).toBeDefined();
    expect(typeof databaseConfig.type).toBe('string');
  });
});
