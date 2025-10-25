import { ModelsService } from '@modules/core/services/ModelsService';
import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModelsService', () => {
  let service: ModelsService;
  let configRepository: SystemConfigRepositoryInMemory;

  beforeEach(() => {
    configRepository = new SystemConfigRepositoryInMemory();
    service = new ModelsService(configRepository);
    jest.clearAllMocks();
  });

  describe('getModels', () => {
    it('should fetch models from configured endpoint', async () => {
      await configRepository.save({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-4',
      });

      const mockResponse = {
        data: {
          data: [
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
          ],
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getModels();

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/v1/models',
        {
          headers: {
            Authorization: 'Bearer test-key',
          },
        }
      );
    });

    it('should use default endpoint when no configuration exists', async () => {
      const mockResponse = {
        data: {
          data: [{ id: 'default-model', name: 'Default Model' }],
        },
      };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getModels();

      expect(result).toEqual(mockResponse.data);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.llm7.io/v1/models',
        {}
      );
    });

    it('should not include Authorization header when apiKey is not set', async () => {
      await configRepository.save({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });

      const mockResponse = { data: { data: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      await service.getModels();

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://test.api.com/v1/models',
        {}
      );
    });

    it('should throw error when API request fails', async () => {
      await configRepository.save({
        endpoint: 'https://invalid.api.com/v1',
        model: 'gpt-4',
      });

      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(service.getModels()).rejects.toThrow('Failed to fetch models');
    });

    it('should handle API error responses', async () => {
      await configRepository.save({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'invalid-key',
        model: 'gpt-4',
      });

      const axiosError = {
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
        isAxiosError: true,
      };
      mockedAxios.get.mockRejectedValue(axiosError);
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(service.getModels()).rejects.toThrow('Failed to fetch models');
    });

    it('should handle non-axios errors', async () => {
      await configRepository.save({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });

      const genericError = new Error('Generic error');
      mockedAxios.get.mockRejectedValue(genericError);
      mockedAxios.isAxiosError.mockReturnValue(false);

      await expect(service.getModels()).rejects.toThrow('Failed to fetch models');
    });
  });
});
