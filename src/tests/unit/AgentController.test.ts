import { Request, Response } from 'express';
import { AgentController } from '@modules/core/controllers/AgentController';
import { AgentService } from '@modules/core/services/AgentService';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';

describe('AgentController', () => {
  let controller: AgentController;
  let service: AgentService;
  let repository: AgentRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    repository = new AgentRepositoryInMemory();
    service = new AgentService(repository);
    controller = new AgentController(service);

    mockRequest = {
      body: {},
      params: {},
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

  describe('create', () => {
    it('should create a new agent', async () => {
      mockRequest.body = {
        name: 'Test Agent',
        prompt: 'You are helpful',
      };

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'Test Agent',
          prompt: 'You are helpful',
          tools: [],
        })
      );
    });

    it('should create agent with all fields', async () => {
      mockRequest.body = {
        name: 'Complete Agent',
        description: 'A complete agent',
        prompt: 'You are an expert',
        defaultModel: 'gpt-4',
      };

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Complete Agent',
          description: 'A complete agent',
          defaultModel: 'gpt-4',
        })
      );
    });
  });

  describe('getAll', () => {
    it('should return all agents', async () => {
      await service.createAgent({
        name: 'Agent 1',
        prompt: 'Prompt 1',
      });

      await service.createAgent({
        name: 'Agent 2',
        prompt: 'Prompt 2',
      });

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Agent 1' }),
          expect.objectContaining({ name: 'Agent 2' }),
        ])
      );
    });

    it('should return empty array when no agents', async () => {
      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([]);
    });
  });

  describe('getById', () => {
    it('should return agent by id', async () => {
      const created = await service.createAgent({
        name: 'Test Agent',
        prompt: 'Test prompt',
      });

      mockRequest.params = { id: created.id };

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          id: created.id,
          name: 'Test Agent',
        })
      );
    });
  });

  describe('update', () => {
    it('should update agent', async () => {
      const created = await service.createAgent({
        name: 'Original',
        prompt: 'Original prompt',
      });

      mockRequest.params = { id: created.id };
      mockRequest.body = {
        name: 'Updated',
        description: 'New description',
      };

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated',
          description: 'New description',
        })
      );
    });
  });

  describe('delete', () => {
    it('should delete agent', async () => {
      const created = await service.createAgent({
        name: 'To Delete',
        prompt: 'Will be deleted',
      });

      mockRequest.params = { id: created.id };

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });
});
