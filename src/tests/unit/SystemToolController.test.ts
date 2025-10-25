import { Request, Response } from 'express';
import { SystemToolController } from '@modules/core/controllers/SystemToolController';
import { SystemToolService } from '@modules/core/services/SystemToolService';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('SystemToolController', () => {
  let controller: SystemToolController;
  let service: SystemToolService;
  let repository: SystemToolRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    repository = new SystemToolRepositoryInMemory();
    service = new SystemToolService(repository);
    controller = new SystemToolController(service);

    mockRequest = {
      body: {},
      params: {},
      headers: {},
    };
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ 
      json: jsonMock,
      send: sendMock,
    });
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  const mockExecutor = async (input: unknown) => input;

  describe('create', () => {
    it('should create a tool', async () => {
      mockRequest.body = {
        name: 'TestTool',
        type: 'action',
      };

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'TestTool',
          type: 'action',
        })
      );
    });

    it('should create tool with custom executor', async () => {
      const customExecutor = async (input: unknown) => ({ custom: input });
      mockRequest.body = {
        name: 'CustomTool',
        type: 'action',
        executor: customExecutor,
      };

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
    });
  });

  describe('getAll', () => {
    it('should return all tools', async () => {
      await service.createTool({
        name: 'Tool1',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Tool1' }),
        ])
      );
    });
  });

  describe('getById', () => {
    it('should return tool by id', async () => {
      const tool = await service.createTool({
        name: 'TestTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      mockRequest.params = { id: tool.id };

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: tool.id })
      );
    });
  });

  describe('delete', () => {
    it('should delete a tool', async () => {
      const tool = await service.createTool({
        name: 'ToDelete',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      mockRequest.params = { id: tool.id };

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should execute a tool', async () => {
      const tool = await service.createTool({
        name: 'ExecutableTool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ result: input }),
      });

      mockRequest.params = { id: tool.id };
      mockRequest.body = { test: 'data' };

      await controller.execute(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ result: { test: 'data' } })
      );
    });
  });

  describe('executeWebHook', () => {
    it('should execute webhook with POST', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'POST' as const,
        token: 'test-token',
      };

      const tool = await service.createTool({
        name: 'WebHook',
        type: ToolType.TRIGGER,
        config,
        executor: async (input: unknown) => ({ received: input }),
      });

      mockRequest.params = { toolId: tool.id };
      mockRequest.headers = { authorization: 'Bearer test-token' };
      mockRequest.method = 'POST';
      mockRequest.body = { test: 'payload' };

      await controller.executeWebHook(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should execute webhook with GET', async () => {
      const config = {
        url: 'http://localhost:3000/webhook',
        method: 'GET' as const,
        token: 'test-token',
      };

      const tool = await service.createTool({
        name: 'WebHookGET',
        type: ToolType.TRIGGER,
        config,
        executor: async (input: unknown) => ({ received: input }),
      });

      mockRequest.params = { toolId: tool.id };
      mockRequest.headers = { authorization: 'Bearer test-token' };
      mockRequest.method = 'GET';
      mockRequest.query = { message: 'test' };

      await controller.executeWebHook(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });
});
