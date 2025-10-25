import { SystemConfigService } from '@modules/core/services/SystemConfigService';
import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';

describe('SystemConfigService', () => {
  let service: SystemConfigService;
  let repository: SystemConfigRepositoryInMemory;

  beforeEach(() => {
    repository = new SystemConfigRepositoryInMemory();
    service = new SystemConfigService(repository);
  });

  describe('getConfig', () => {
    it('should return default configuration when none is set', async () => {
      const config = await service.getConfig();

      expect(config).toEqual({
        endpoint: 'https://api.llm7.io/v1',
        model: 'gpt-4',
      });
    });

    it('should return saved configuration', async () => {
      await service.createConfig({
        endpoint: 'https://custom.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      const config = await service.getConfig();

      expect(config).toEqual({
        endpoint: 'https://custom.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });
    });
  });

  describe('createConfig', () => {
    it('should create new configuration', async () => {
      const config = await service.createConfig({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'my-key',
        model: 'gpt-4',
      });

      expect(config).toEqual({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'my-key',
        model: 'gpt-4',
      });
    });

    it('should create configuration without apiKey', async () => {
      const config = await service.createConfig({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });

      expect(config).toEqual({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });
      expect(config.apiKey).toBeUndefined();
    });

    it('should throw error if endpoint is missing', async () => {
      await expect(
        service.createConfig({
          endpoint: '',
          model: 'gpt-4',
        })
      ).rejects.toThrow('Endpoint is required');
    });

    it('should throw error if model is missing', async () => {
      await expect(
        service.createConfig({
          endpoint: 'https://test.api.com/v1',
          model: '',
        })
      ).rejects.toThrow('Model is required');
    });
  });

  describe('updateConfig', () => {
    beforeEach(async () => {
      await service.createConfig({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should update endpoint only', async () => {
      const config = await service.updateConfig({
        endpoint: 'https://updated.api.com/v1',
      });

      expect(config).toEqual({
        endpoint: 'https://updated.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should update apiKey only', async () => {
      const config = await service.updateConfig({
        apiKey: 'new-key',
      });

      expect(config).toEqual({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'new-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should update model only', async () => {
      const config = await service.updateConfig({
        model: 'gpt-4',
      });

      expect(config).toEqual({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-4',
      });
    });

    it('should update multiple fields', async () => {
      const config = await service.updateConfig({
        endpoint: 'https://multi.api.com/v1',
        model: 'gpt-4-turbo',
      });

      expect(config).toEqual({
        endpoint: 'https://multi.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-4-turbo',
      });
    });

    it('should throw error when no configuration exists', async () => {
      repository.clear();

      await expect(
        service.updateConfig({
          model: 'gpt-4',
        })
      ).rejects.toThrow('No configuration found to update');
    });

    it('should rethrow non-specific errors', async () => {
      // Mock repository to throw a different error
      const errorMessage = 'Unexpected database error';
      jest.spyOn(repository, 'update').mockRejectedValue(new Error(errorMessage));

      await expect(
        service.updateConfig({
          model: 'gpt-4',
        })
      ).rejects.toThrow(errorMessage);
    });
  });
});
