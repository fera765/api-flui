import { Request, Response } from 'express';
import { SystemConfigController } from '@modules/core/controllers/SystemConfigController';
import { SystemConfigService } from '@modules/core/services/SystemConfigService';
import { SystemConfigRepositoryInMemory } from '@modules/core/repositories/SystemConfigRepositoryInMemory';

describe('SystemConfigController', () => {
  let controller: SystemConfigController;
  let service: SystemConfigService;
  let repository: SystemConfigRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    repository = new SystemConfigRepositoryInMemory();
    service = new SystemConfigService(repository);
    controller = new SystemConfigController(service);

    mockRequest = { body: {} };
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('getConfig', () => {
    it('should return default configuration', async () => {
      await controller.getConfig(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        endpoint: 'https://api.llm7.io/v1',
        model: 'gpt-4',
      });
    });

    it('should return saved configuration', async () => {
      await service.createConfig({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });

      await controller.getConfig(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
      });
    });
  });

  describe('createConfig', () => {
    it('should create new configuration', async () => {
      mockRequest.body = {
        endpoint: 'https://test.api.com/v1',
        apiKey: 'my-key',
        model: 'gpt-4',
      };

      await controller.createConfig(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'my-key',
        model: 'gpt-4',
      });
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

    it('should update configuration', async () => {
      mockRequest.body = {
        model: 'gpt-4',
      };

      await controller.updateConfig(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-4',
      });
    });
  });
});
