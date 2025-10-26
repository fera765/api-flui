import { ConditionToolRepositoryInMemory } from '@modules/core/repositories/ConditionToolRepositoryInMemory';
import { ConditionTool } from '@modules/core/domain/ConditionTool';
import { Condition } from '@modules/core/domain/Condition';

describe('ConditionToolRepositoryInMemory', () => {
  let repository: ConditionToolRepositoryInMemory;

  beforeEach(() => {
    repository = new ConditionToolRepositoryInMemory();
  });

  const createSampleConditionTool = () => {
    const conditions = [
      Condition.create({ name: 'Test', predicate: 'true', linkedNodes: [] }),
    ];
    return ConditionTool.create({
      name: 'Test Tool',
      conditions,
    });
  };

  describe('create', () => {
    it('should create and store a condition tool', async () => {
      const tool = createSampleConditionTool();
      const result = await repository.create(tool);

      expect(result).toBe(tool);
      expect(result.getId()).toBe(tool.getId());
    });

    it('should allow multiple condition tools', async () => {
      const tool1 = createSampleConditionTool();
      const tool2 = createSampleConditionTool();

      await repository.create(tool1);
      await repository.create(tool2);

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('findById', () => {
    it('should find condition tool by id', async () => {
      const tool = createSampleConditionTool();
      await repository.create(tool);

      const found = await repository.findById(tool.getId());

      expect(found).toBeDefined();
      expect(found?.getId()).toBe(tool.getId());
    });

    it('should return null for non-existent id', async () => {
      const found = await repository.findById('non-existent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return empty array when no tools exist', async () => {
      const tools = await repository.findAll();
      expect(tools).toEqual([]);
    });

    it('should return all condition tools', async () => {
      const tool1 = createSampleConditionTool();
      const tool2 = createSampleConditionTool();

      await repository.create(tool1);
      await repository.create(tool2);

      const tools = await repository.findAll();
      expect(tools).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('should update existing condition tool', async () => {
      const tool = createSampleConditionTool();
      await repository.create(tool);

      tool.updateName('Updated Name');
      const updated = await repository.update(tool);

      expect(updated.getName()).toBe('Updated Name');

      const found = await repository.findById(tool.getId());
      expect(found?.getName()).toBe('Updated Name');
    });

    it('should throw error when updating non-existent tool', async () => {
      const tool = createSampleConditionTool();

      await expect(repository.update(tool)).rejects.toThrow('ConditionTool not found');
    });
  });

  describe('delete', () => {
    it('should delete existing condition tool', async () => {
      const tool = createSampleConditionTool();
      await repository.create(tool);

      await repository.delete(tool.getId());

      const found = await repository.findById(tool.getId());
      expect(found).toBeNull();
    });

    it('should throw error when deleting non-existent tool', async () => {
      await expect(repository.delete('non-existent')).rejects.toThrow('ConditionTool not found');
    });
  });

  describe('clear', () => {
    it('should clear all condition tools', async () => {
      const tool1 = createSampleConditionTool();
      const tool2 = createSampleConditionTool();

      await repository.create(tool1);
      await repository.create(tool2);

      repository.clear();

      const tools = await repository.findAll();
      expect(tools).toHaveLength(0);
    });
  });
});
