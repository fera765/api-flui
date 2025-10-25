import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';

describe('AutomationRepositoryInMemory', () => {
  let repository: AutomationRepositoryInMemory;

  beforeEach(() => {
    repository = new AutomationRepositoryInMemory();
  });

  describe('create', () => {
    it('should create an automation', async () => {
      const automation = await repository.create({
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

      expect(automation.getId()).toBeDefined();
      expect(automation.getName()).toBe('Test Automation');
      expect(automation.getNodes()).toHaveLength(1);
    });

    it('should generate unique IDs for automations', async () => {
      const auto1 = await repository.create({
        name: 'Auto1',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const auto2 = await repository.create({
        name: 'Auto2',
        nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
        links: [],
      });

      expect(auto1.getId()).not.toBe(auto2.getId());
    });

    it('should generate IDs for nodes without ID', async () => {
      const automation = await repository.create({
        name: 'Test',
        nodes: [
          {
            type: NodeType.TRIGGER,
            referenceId: 'trigger-1',
          } as never,
        ],
        links: [],
      });

      const nodes = automation.getNodes();
      expect(nodes[0].getId()).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no automations', async () => {
      const automations = await repository.findAll();
      expect(automations).toEqual([]);
    });

    it('should return all automations', async () => {
      await repository.create({
        name: 'Auto1',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await repository.create({
        name: 'Auto2',
        nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
        links: [],
      });

      const automations = await repository.findAll();
      expect(automations).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return null when automation not found', async () => {
      const automation = await repository.findById('non-existent');
      expect(automation).toBeNull();
    });

    it('should return automation by id', async () => {
      const created = await repository.create({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const found = await repository.findById(created.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(created.getId());
    });
  });

  describe('findByName', () => {
    it('should return null when automation not found', async () => {
      const automation = await repository.findByName('NonExistent');
      expect(automation).toBeNull();
    });

    it('should return automation by name', async () => {
      await repository.create({
        name: 'UniqueAutomation',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      const found = await repository.findByName('UniqueAutomation');

      expect(found).not.toBeNull();
      expect(found?.getName()).toBe('UniqueAutomation');
    });
  });

  describe('update', () => {
    it('should update automation', async () => {
      const automation = await repository.create({
        name: 'Original',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      automation.update({ name: 'Updated' });
      await repository.update(automation);

      const found = await repository.findById(automation.getId());
      expect(found?.getName()).toBe('Updated');
    });

    it('should throw error when automation not found', async () => {
      const automation = await repository.create({
        name: 'Test',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await repository.delete(automation.getId());

      await expect(
        repository.update(automation)
      ).rejects.toThrow('Automation not found');
    });
  });

  describe('delete', () => {
    it('should delete automation', async () => {
      const automation = await repository.create({
        name: 'ToDelete',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await repository.delete(automation.getId());

      const found = await repository.findById(automation.getId());
      expect(found).toBeNull();
    });

    it('should throw error when automation not found', async () => {
      await expect(
        repository.delete('non-existent')
      ).rejects.toThrow('Automation not found');
    });
  });

  describe('clear', () => {
    it('should clear all automations', async () => {
      await repository.create({
        name: 'Auto1',
        nodes: [{ id: 'n1', type: NodeType.TRIGGER, referenceId: 't1' }],
        links: [],
      });

      await repository.create({
        name: 'Auto2',
        nodes: [{ id: 'n2', type: NodeType.TRIGGER, referenceId: 't2' }],
        links: [],
      });

      repository.clear();

      const automations = await repository.findAll();
      expect(automations).toEqual([]);
    });
  });
});
