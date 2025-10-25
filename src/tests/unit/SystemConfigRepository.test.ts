import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';

describe('SystemConfigRepositoryInMemory', () => {
  let repository: SystemConfigRepositoryInMemory;

  beforeEach(() => {
    repository = new SystemConfigRepositoryInMemory();
  });

  describe('save', () => {
    it('should save configuration', async () => {
      const config = await repository.save({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      expect(config.getEndpoint()).toBe('https://test.api.com/v1');
      expect(config.getApiKey()).toBe('test-key');
      expect(config.getModel()).toBe('gpt-4');
    });

    it('should replace previous configuration', async () => {
      await repository.save({
        endpoint: 'https://first.api.com/v1',
        model: 'gpt-3.5-turbo',
      });

      const config = await repository.save({
        endpoint: 'https://second.api.com/v1',
        model: 'gpt-4',
      });

      expect(config.getEndpoint()).toBe('https://second.api.com/v1');
      expect(config.getModel()).toBe('gpt-4');
    });
  });

  describe('findCurrent', () => {
    it('should return null when no configuration exists', async () => {
      const config = await repository.findCurrent();
      expect(config).toBeNull();
    });

    it('should return saved configuration', async () => {
      await repository.save({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      const config = await repository.findCurrent();

      expect(config).not.toBeNull();
      expect(config?.getEndpoint()).toBe('https://test.api.com/v1');
      expect(config?.getApiKey()).toBe('test-key');
      expect(config?.getModel()).toBe('gpt-4');
    });
  });

  describe('update', () => {
    it('should update existing configuration', async () => {
      await repository.save({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-3.5-turbo',
      });

      const config = await repository.update({
        model: 'gpt-4',
      });

      expect(config.getEndpoint()).toBe('https://initial.api.com/v1');
      expect(config.getApiKey()).toBe('initial-key');
      expect(config.getModel()).toBe('gpt-4');
    });

    it('should throw error when no configuration exists', async () => {
      await expect(
        repository.update({
          model: 'gpt-4',
        })
      ).rejects.toThrow('No configuration found to update');
    });

    it('should update multiple fields', async () => {
      await repository.save({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-3.5-turbo',
      });

      const config = await repository.update({
        endpoint: 'https://updated.api.com/v1',
        apiKey: 'new-key',
      });

      expect(config.getEndpoint()).toBe('https://updated.api.com/v1');
      expect(config.getApiKey()).toBe('new-key');
      expect(config.getModel()).toBe('gpt-3.5-turbo');
    });
  });

  describe('clear', () => {
    it('should clear the configuration', async () => {
      await repository.save({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });

      repository.clear();

      const config = await repository.findCurrent();
      expect(config).toBeNull();
    });
  });
});
