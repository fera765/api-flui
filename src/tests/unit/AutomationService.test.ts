import { AutomationService } from '@modules/core/services/AutomationService';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { AutomationExecutor } from '@modules/core/services/automation/AutomationExecutor';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('AutomationService', () => {
  let service: AutomationService;
  let repository: AutomationRepositoryInMemory;
  let executor: AutomationExecutor;
  let toolRepository: SystemToolRepositoryInMemory;
  let agentRepository: AgentRepositoryInMemory;

  beforeEach(() => {
    repository = new AutomationRepositoryInMemory();
    toolRepository = new SystemToolRepositoryInMemory();
    agentRepository = new AgentRepositoryInMemory();
    executor = new AutomationExecutor(toolRepository, agentRepository);
    service = new AutomationService(repository, executor);
  });

  describe('createAutomation', () => {
    it('should create an automation', async () => {
      const automation = await service.createAutomation({
        name: 'Test Automation',
        nodes: [
          {
            id: 'node-1',
            type: NodeType.TRIGGER,
            referenceId: 'trigger-1',
          },
        ],
        links: [],
      });

      expect(automation).toHaveProperty('id');
      expect(automation.name).toBe('Test Automation');
      expect(automation.status).toBe('idle');
    });

    it('should throw error when name is empty', async () => {
      await expect(
        service.createAutomation({
          name: '',
          nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
          links: [],
        })
      ).rejects.toThrow('Automation name is required');
    });

    it('should throw error when no nodes', async () => {
      await expect(
        service.createAutomation({
          name: 'Test',
          nodes: [],
          links: [],
        })
      ).rejects.toThrow('Automation must have at least one node');
    });

    it('should throw error when no trigger node', async () => {
      await expect(
        service.createAutomation({
          name: 'Test',
          nodes: [{ id: 'n1', type: NodeType.TOOL, referenceId: 't1' }],
          links: [],
        })
      ).rejects.toThrow('Automation must have at least one trigger node');
    });

    it('should throw error when name already exists', async () => {
      await service.createAutomation({
        name: 'Duplicate',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await expect(
        service.createAutomation({
          name: 'Duplicate',
          nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
          links: [],
        })
      ).rejects.toThrow('Automation with this name already exists');
    });
  });

  describe('getAllAutomations', () => {
    it('should return empty array when no automations', async () => {
      const automations = await service.getAllAutomations();
      expect(automations).toEqual([]);
    });

    it('should return all automations', async () => {
      await service.createAutomation({
        name: 'Auto1',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await service.createAutomation({
        name: 'Auto2',
        nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
        links: [],
      });

      const automations = await service.getAllAutomations();
      expect(automations).toHaveLength(2);
    });
  });

  describe('getAutomationById', () => {
    it('should return automation by id', async () => {
      const created = await service.createAutomation({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const automation = await service.getAutomationById(created.id);
      expect(automation.id).toBe(created.id);
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.getAutomationById('non-existent')
      ).rejects.toThrow('Automation not found');
    });
  });

  describe('updateAutomation', () => {
    it('should update automation', async () => {
      const created = await service.createAutomation({
        name: 'Original',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const updated = await service.updateAutomation(created.id, {
        name: 'Updated',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('New description');
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.updateAutomation('non-existent', { name: 'Updated' })
      ).rejects.toThrow('Automation not found');
    });

    it('should throw error when name is empty', async () => {
      const created = await service.createAutomation({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await expect(
        service.updateAutomation(created.id, { name: '' })
      ).rejects.toThrow('Automation name cannot be empty');
    });

    it('should throw error when new name already exists', async () => {
      await service.createAutomation({
        name: 'Existing',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const created = await service.createAutomation({
        name: 'ToUpdate',
        nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
        links: [],
      });

      await expect(
        service.updateAutomation(created.id, { name: 'Existing' })
      ).rejects.toThrow('Automation with this name already exists');
    });

    it('should rethrow non-specific errors', async () => {
      const created = await service.createAutomation({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      jest.spyOn(repository, 'update').mockRejectedValue(new Error('Unexpected error'));

      await expect(
        service.updateAutomation(created.id, { name: 'Updated' })
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('deleteAutomation', () => {
    it('should delete automation', async () => {
      const created = await service.createAutomation({
        name: 'ToDelete',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await service.deleteAutomation(created.id);

      await expect(
        service.getAutomationById(created.id)
      ).rejects.toThrow('Automation not found');
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.deleteAutomation('non-existent')
      ).rejects.toThrow('Automation not found');
    });

    it('should rethrow non-specific errors', async () => {
      const created = await service.createAutomation({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      jest.spyOn(repository, 'delete').mockRejectedValue(new Error('Unexpected error'));

      await expect(
        service.deleteAutomation(created.id)
      ).rejects.toThrow('Unexpected error');
    });
  });

  describe('executeAutomation', () => {
    it('should execute automation', async () => {
      // Create a tool
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async (input: unknown) => ({ result: input }),
      });

      // Create automation
      const created = await service.createAutomation({
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

      const context = await service.executeAutomation(created.id, { test: 'data' });

      expect(context.automationId).toBe(created.id);
      expect(context.executedNodes.size).toBeGreaterThan(0);
    });

    it('should throw error when automation not found', async () => {
      await expect(
        service.executeAutomation('non-existent')
      ).rejects.toThrow('Automation not found');
    });
  });
});
