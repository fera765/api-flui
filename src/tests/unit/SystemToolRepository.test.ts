import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('SystemToolRepositoryInMemory', () => {
  let repository: SystemToolRepositoryInMemory;

  beforeEach(() => {
    repository = new SystemToolRepositoryInMemory();
  });

  const mockExecutor = async (input: unknown) => input;

  describe('create', () => {
    it('should create a tool', async () => {
      const tool = await repository.create({
        name: 'TestTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      expect(tool.getId()).toBeDefined();
      expect(tool.getName()).toBe('TestTool');
      expect(tool.getType()).toBe(ToolType.ACTION);
    });

    it('should generate unique IDs', async () => {
      const tool1 = await repository.create({
        name: 'Tool1',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      const tool2 = await repository.create({
        name: 'Tool2',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      expect(tool1.getId()).not.toBe(tool2.getId());
    });
  });

  describe('findAll', () => {
    it('should return empty array when no tools', async () => {
      const tools = await repository.findAll();
      expect(tools).toEqual([]);
    });

    it('should return all tools', async () => {
      await repository.create({ name: 'Tool1', type: ToolType.ACTION, executor: mockExecutor });
      await repository.create({ name: 'Tool2', type: ToolType.TRIGGER, executor: mockExecutor });

      const tools = await repository.findAll();
      expect(tools).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should return null when tool not found', async () => {
      const tool = await repository.findById('non-existent-id');
      expect(tool).toBeNull();
    });

    it('should return tool by id', async () => {
      const created = await repository.create({
        name: 'TestTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      const found = await repository.findById(created.getId());

      expect(found).not.toBeNull();
      expect(found?.getId()).toBe(created.getId());
    });
  });

  describe('findByName', () => {
    it('should return null when tool not found', async () => {
      const tool = await repository.findByName('NonExistent');
      expect(tool).toBeNull();
    });

    it('should return tool by name', async () => {
      await repository.create({
        name: 'UniqueTool',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      const found = await repository.findByName('UniqueTool');

      expect(found).not.toBeNull();
      expect(found?.getName()).toBe('UniqueTool');
    });
  });

  describe('delete', () => {
    it('should delete a tool', async () => {
      const tool = await repository.create({
        name: 'ToDelete',
        type: ToolType.ACTION,
        executor: mockExecutor,
      });

      await repository.delete(tool.getId());

      const found = await repository.findById(tool.getId());
      expect(found).toBeNull();
    });

    it('should throw error when tool not found', async () => {
      await expect(
        repository.delete('non-existent-id')
      ).rejects.toThrow('Tool not found');
    });
  });

  describe('clear', () => {
    it('should clear all tools', async () => {
      await repository.create({ name: 'Tool1', type: ToolType.ACTION, executor: mockExecutor });
      await repository.create({ name: 'Tool2', type: ToolType.ACTION, executor: mockExecutor });

      repository.clear();

      const tools = await repository.findAll();
      expect(tools).toEqual([]);
    });
  });
});
