import { Request, Response } from 'express';
import { AutomationController } from '@modules/core/controllers/AutomationController';
import { AutomationService } from '@modules/core/services/AutomationService';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { AutomationExecutor } from '@modules/core/services/automation/AutomationExecutor';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('AutomationController', () => {
  let controller: AutomationController;
  let service: AutomationService;
  let repository: AutomationRepositoryInMemory;
  let executor: AutomationExecutor;
  let toolRepository: SystemToolRepositoryInMemory;
  let agentRepository: AgentRepositoryInMemory;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    repository = new AutomationRepositoryInMemory();
    toolRepository = new SystemToolRepositoryInMemory();
    agentRepository = new AgentRepositoryInMemory();
    executor = new AutomationExecutor(toolRepository, agentRepository);
    service = new AutomationService(repository, executor);
    controller = new AutomationController(service);

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
    it('should create automation', async () => {
      mockRequest.body = {
        name: 'Test Automation',
        nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
        links: [],
      };

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Automation',
        })
      );
    });
  });

  describe('getAll', () => {
    it('should return all automations', async () => {
      await service.createAutomation({
        name: 'Auto1',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Auto1' }),
        ])
      );
    });
  });

  describe('getById', () => {
    it('should return automation by id', async () => {
      const automation = await service.createAutomation({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      mockRequest.params = { id: automation.id };

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ id: automation.id })
      );
    });
  });

  describe('update', () => {
    it('should update automation', async () => {
      const automation = await service.createAutomation({
        name: 'Original',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      mockRequest.params = { id: automation.id };
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
    it('should delete automation', async () => {
      const automation = await service.createAutomation({
        name: 'ToDelete',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      mockRequest.params = { id: automation.id };

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('execute', () => {
    it('should execute automation', async () => {
      // Create tool
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async (input: unknown) => ({ result: input }),
      });

      // Create automation
      const automation = await service.createAutomation({
        name: 'Test',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      mockRequest.params = { id: automation.id };
      mockRequest.body = { test: 'data' };

      await controller.execute(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          automationId: automation.id,
          executedNodes: expect.any(Object),
        })
      );
    });
  });
});
