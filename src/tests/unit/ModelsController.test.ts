import { Request, Response } from 'express';
import { ModelsController } from '@modules/core/controllers/ModelsController';
import { ModelsService } from '@modules/core/services/ModelsService';
import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ModelsController', () => {
  let controller: ModelsController;
  let service: ModelsService;
  let repository: SystemConfigRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    repository = new SystemConfigRepositoryInMemory();
    service = new ModelsService(repository);
    controller = new ModelsController(service);

    mockRequest = {};
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('getModels', () => {
    it('should return models from service', async () => {
      const mockModels = {
        data: [
          { id: 'gpt-4', name: 'GPT-4' },
          { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
        ],
      };

      mockedAxios.get.mockResolvedValue({ data: mockModels });

      await controller.getModels(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockModels);
    });

    it('should handle empty models list', async () => {
      const mockModels = { data: [] };

      mockedAxios.get.mockResolvedValue({ data: mockModels });

      await controller.getModels(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockModels);
    });
  });
});
