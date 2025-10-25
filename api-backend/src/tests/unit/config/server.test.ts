// Import will be done inside test to avoid module caching issues

describe('Server Config', () => {
  it('should have correct default values', () => {
    // Reset environment variables for this test
    const originalEnv = process.env;
    process.env = {};
    
    // Re-import to get fresh config
    jest.resetModules();
    const { serverConfig: freshConfig } = require('@/config/server');
    
    expect(freshConfig.port).toBe(3333);
    expect(freshConfig.name).toBe('API Backend');
    expect(freshConfig.version).toBe('1.0.0');
    expect(freshConfig.environment).toBe('development');
    
    process.env = originalEnv;
  });

  it('should use environment variables when available', () => {
    const originalEnv = process.env;
    
    process.env = {
      ...originalEnv,
      PORT: '3000',
      API_NAME: 'Test API',
      API_VERSION: '2.0.0',
      NODE_ENV: 'production'
    };

    // Re-import to get updated config
    jest.resetModules();
    const { serverConfig: newConfig } = require('@/config/server');

    expect(newConfig.port).toBe(3000);
    expect(newConfig.name).toBe('Test API');
    expect(newConfig.version).toBe('2.0.0');
    expect(newConfig.environment).toBe('production');

    process.env = originalEnv;
  });
});