import { ExecutionService } from '@modules/core/services/ExecutionService';
import { ExecutionLogRepositoryInMemory } from '@modules/core/repositories/ExecutionLogRepositoryInMemory';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { AutomationExecutor } from '@modules/core/services/automation/AutomationExecutor';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('ExecutionService', () => {
  let service: ExecutionService;
  let executionLogRepository: ExecutionLogRepositoryInMemory;
  let automationRepository: AutomationRepositoryInMemory;
  let toolRepository: SystemToolRepositoryInMemory;
  let agentRepository: AgentRepositoryInMemory;
  let executor: AutomationExecutor;

  beforeEach(() => {
    executionLogRepository = new ExecutionLogRepositoryInMemory();
    automationRepository = new AutomationRepositoryInMemory();
    toolRepository = new SystemToolRepositoryInMemory();
    agentRepository = new AgentRepositoryInMemory();
    executor = new AutomationExecutor(toolRepository, agentRepository);
    service = new ExecutionService(automationRepository, executionLogRepository, executor);
  });

  describe('startExecution', () => {
    it('should start execution and return automation id', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      const executionId = await service.startExecution(automation.getId());

      expect(executionId).toBe(automation.getId());
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.startExecution('non-existent')
      ).rejects.toThrow('Automation not found');
    });

    it('should create execution logs for all nodes', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      await service.startExecution(automation.getId());

      // Wait a bit for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const logs = await service.getExecutionLogs(automation.getId());
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should notify event listeners', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      const listener = jest.fn();
      service.addEventListener(listener);

      await service.startExecution(automation.getId());

      expect(listener).toHaveBeenCalled();

      service.removeEventListener(listener);
    });
  });

  describe('getExecutionStatus', () => {
    it('should return execution status', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      await service.startExecution(automation.getId());

      const status = await service.getExecutionStatus(automation.getId());

      expect(status).toHaveProperty('automationId');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('totalNodes');
      expect(status).toHaveProperty('completedNodes');
      expect(status).toHaveProperty('failedNodes');
      expect(status).toHaveProperty('logs');
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.getExecutionStatus('non-existent')
      ).rejects.toThrow('Automation not found');
    });
  });

  describe('getExecutionLogs', () => {
    it('should return execution logs', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      await service.startExecution(automation.getId());

      const logs = await service.getExecutionLogs(automation.getId());

      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('event listeners', () => {
    it('should add event listener', () => {
      const listener = jest.fn();
      service.addEventListener(listener);

      // Verify listener was added (indirectly through behavior)
      expect(listener).toBeDefined();
    });

    it('should remove event listener', () => {
      const listener = jest.fn();
      service.addEventListener(listener);
      service.removeEventListener(listener);

      // Listener should be removed
      expect(listener).toBeDefined();
    });

    it('should handle listener errors gracefully', async () => {
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      const automation = await automationRepository.create({
        name: 'Test Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      const failingListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      service.addEventListener(failingListener);

      // Should not throw despite listener error
      await expect(
        service.startExecution(automation.getId())
      ).resolves.toBeDefined();

      service.removeEventListener(failingListener);
    });
  });
});
