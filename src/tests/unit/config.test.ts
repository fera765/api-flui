describe('Config', () => {
  describe('serverConfig', () => {
    beforeEach(() => {
      jest.resetModules();
    });

    it('should have port property', () => {
      const { serverConfig } = require('@config/server');
      expect(serverConfig).toHaveProperty('port');
      expect(typeof serverConfig.port).toBe('number');
    });

    it('should have nodeEnv property', () => {
      const { serverConfig } = require('@config/server');
      expect(serverConfig).toHaveProperty('nodeEnv');
      expect(typeof serverConfig.nodeEnv).toBe('string');
    });

    it('should return valid configuration object', () => {
      const { serverConfig } = require('@config/server');
      expect(serverConfig.port).toBeGreaterThan(0);
      expect(['development', 'production', 'test']).toContain(serverConfig.nodeEnv);
    });

    it('should use default port when PORT is not set', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;
      
      jest.resetModules();
      const { serverConfig } = require('@config/server');
      
      expect(serverConfig.port).toBe(3000);
      
      if (originalPort) process.env.PORT = originalPort;
    });

    it('should use default nodeEnv when NODE_ENV is not set', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      
      jest.resetModules();
      const { serverConfig } = require('@config/server');
      
      expect(serverConfig.nodeEnv).toBe('development');
      
      if (originalEnv) process.env.NODE_ENV = originalEnv;
    });

    it('should use environment PORT when set', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';
      
      jest.resetModules();
      const { serverConfig } = require('@config/server');
      
      expect(serverConfig.port).toBe(4000);
      
      if (originalPort) process.env.PORT = originalPort;
      else delete process.env.PORT;
    });

    it('should use environment NODE_ENV when set', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      jest.resetModules();
      const { serverConfig } = require('@config/server');
      
      expect(serverConfig.nodeEnv).toBe('production');
      
      if (originalEnv) process.env.NODE_ENV = originalEnv;
      else delete process.env.NODE_ENV;
    });
  });
});
