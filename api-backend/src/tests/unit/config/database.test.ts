import { databaseConfig } from '@/config/database';

describe('Database Config', () => {
  it('should have correct default values', () => {
    expect(databaseConfig.type).toBe('memory');
    expect(databaseConfig.host).toBe('localhost');
    expect(databaseConfig.port).toBe(5432);
    expect(databaseConfig.username).toBe('postgres');
    expect(databaseConfig.password).toBe('postgres');
    expect(databaseConfig.database).toBe('api_backend');
  });

  it('should use environment variables when available', () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      DB_TYPE: 'postgres',
      DB_HOST: 'test-host',
      DB_PORT: '5433',
      DB_USERNAME: 'test-user',
      DB_PASSWORD: 'test-pass',
      DB_DATABASE: 'test_db'
    };

    // Re-import to get updated config
    jest.resetModules();
    const { databaseConfig: newConfig } = require('@/config/database');

    expect(newConfig.type).toBe('postgres');
    expect(newConfig.host).toBe('test-host');
    expect(newConfig.port).toBe(5433);
    expect(newConfig.username).toBe('test-user');
    expect(newConfig.password).toBe('test-pass');
    expect(newConfig.database).toBe('test_db');

    process.env = originalEnv;
  });
});