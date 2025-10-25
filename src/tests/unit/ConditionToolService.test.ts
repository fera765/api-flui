import { ConditionToolService } from '@modules/core/services/ConditionToolService';
import { ConditionToolRepositoryInMemory } from '@modules/core/repositories/ConditionToolRepositoryInMemory';
import { AppError } from '@shared/errors';

describe('ConditionToolService', () => {
  let service: ConditionToolService;
  let repository: ConditionToolRepositoryInMemory;

  beforeEach(() => {
    repository = new ConditionToolRepositoryInMemory();
    service = new ConditionToolService(repository);
  });

  describe('createConditionTool', () => {
    it('should create a condition tool with valid data', async () => {
      const data = {
        name: 'Action Router',
        description: 'Routes based on action',
        conditions: [
          {
            name: 'Purchase',
            predicate: 'input.action === "compra"',
            linkedNodes: ['node-1'],
          },
          {
            name: 'Sale',
            predicate: 'input.action === "venda"',
            linkedNodes: ['node-2'],
          },
        ],
      };

      const result = await service.createConditionTool(data);

      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Action Router');
      expect(result.type).toBe('atoom');
      expect(result.conditions).toHaveLength(2);
    });

    it('should throw error if name is missing', async () => {
      await expect(
        service.createConditionTool({
          name: '',
          conditions: [],
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error if conditions array is empty', async () => {
      await expect(
        service.createConditionTool({
          name: 'Test',
          conditions: [],
        })
      ).rejects.toThrow('At least one condition is required');
    });

    it('should throw error if condition name is missing', async () => {
      await expect(
        service.createConditionTool({
          name: 'Test',
          conditions: [
            {
              name: '',
              predicate: 'true',
              linkedNodes: [],
            },
          ],
        })
      ).rejects.toThrow('Condition name is required');
    });

    it('should throw error if condition predicate is missing', async () => {
      await expect(
        service.createConditionTool({
          name: 'Test',
          conditions: [
            {
              name: 'Test',
              predicate: '',
              linkedNodes: [],
            },
          ],
        })
      ).rejects.toThrow('Condition predicate is required');
    });

    it('should throw error if linkedNodes is not an array', async () => {
      await expect(
        service.createConditionTool({
          name: 'Test',
          conditions: [
            {
              name: 'Test',
              predicate: 'true',
              linkedNodes: 'not-array' as any,
            },
          ],
        })
      ).rejects.toThrow('Condition linkedNodes must be an array');
    });
  });

  describe('getConditionToolById', () => {
    it('should get condition tool by id', async () => {
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [
          {
            name: 'Cond1',
            predicate: 'true',
            linkedNodes: [],
          },
        ],
      });

      const result = await service.getConditionToolById(created.id);
      expect(result.id).toBe(created.id);
      expect(result.name).toBe('Test');
    });

    it('should throw error if tool not found', async () => {
      await expect(service.getConditionToolById('non-existent')).rejects.toThrow('ConditionTool not found');
    });
  });

  describe('getAllConditionTools', () => {
    it('should return empty array when no tools exist', async () => {
      const result = await service.getAllConditionTools();
      expect(result).toEqual([]);
    });

    it('should return all condition tools', async () => {
      await service.createConditionTool({
        name: 'Tool1',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      await service.createConditionTool({
        name: 'Tool2',
        conditions: [{ name: 'Cond2', predicate: 'true', linkedNodes: [] }],
      });

      const result = await service.getAllConditionTools();
      expect(result).toHaveLength(2);
    });
  });

  describe('updateConditionTool', () => {
    it('should update tool name and description', async () => {
      const created = await service.createConditionTool({
        name: 'Original',
        description: 'Original Description',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      const updated = await service.updateConditionTool(created.id, {
        name: 'Updated',
        description: 'Updated Description',
      });

      expect(updated.name).toBe('Updated');
      expect(updated.description).toBe('Updated Description');
    });

    it('should update conditions', async () => {
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      const updated = await service.updateConditionTool(created.id, {
        conditions: [
          { name: 'NewCond1', predicate: 'input.a === 1', linkedNodes: ['node-1'] },
          { name: 'NewCond2', predicate: 'input.b === 2', linkedNodes: ['node-2'] },
        ],
      });

      expect(updated.conditions).toHaveLength(2);
      expect(updated.conditions[0].name).toBe('NewCond1');
      expect(updated.conditions[1].name).toBe('NewCond2');
    });

    it('should throw error if tool not found', async () => {
      await expect(
        service.updateConditionTool('non-existent', { name: 'Test' })
      ).rejects.toThrow('ConditionTool not found');
    });

    it('should throw error if name is empty', async () => {
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      await expect(service.updateConditionTool(created.id, { name: '' })).rejects.toThrow(
        'ConditionTool name cannot be empty'
      );
    });

    it('should throw error if conditions is not an array', async () => {
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      await expect(
        service.updateConditionTool(created.id, { conditions: 'not-array' as any })
      ).rejects.toThrow('Conditions must be an array');
    });
  });

  describe('deleteConditionTool', () => {
    it('should delete existing tool', async () => {
      const created = await service.createConditionTool({
        name: 'Test',
        conditions: [{ name: 'Cond1', predicate: 'true', linkedNodes: [] }],
      });

      await service.deleteConditionTool(created.id);

      await expect(service.getConditionToolById(created.id)).rejects.toThrow('ConditionTool not found');
    });

    it('should throw error if tool not found', async () => {
      await expect(service.deleteConditionTool('non-existent')).rejects.toThrow('ConditionTool not found');
    });
  });

  describe('evaluateCondition', () => {
    it('should evaluate and return first satisfied condition', async () => {
      const created = await service.createConditionTool({
        name: 'Router',
        conditions: [
          { name: 'Purchase', predicate: 'input.action === "compra"', linkedNodes: ['node-1'] },
          { name: 'Sale', predicate: 'input.action === "venda"', linkedNodes: ['node-2'] },
        ],
      });

      const result = await service.evaluateCondition(created.id, {
        input: { action: 'compra' },
      });

      expect(result).toHaveProperty('satisfied', true);
      expect(result).toHaveProperty('conditionName', 'Purchase');
      expect((result as any).linkedNodes).toEqual(['node-1']);
    });

    it('should evaluate all conditions when evaluateAll is true', async () => {
      const created = await service.createConditionTool({
        name: 'Multi-Router',
        conditions: [
          { name: 'High Value', predicate: 'input.amount > 1000', linkedNodes: ['node-1'] },
          { name: 'VIP', predicate: 'input.vip === true', linkedNodes: ['node-2'] },
        ],
      });

      const results = await service.evaluateCondition(created.id, {
        input: { amount: 1500, vip: true },
        evaluateAll: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect((results as any[]).length).toBe(2);
    });

    it('should throw error if tool not found', async () => {
      await expect(
        service.evaluateCondition('non-existent', { input: {} })
      ).rejects.toThrow('ConditionTool not found');
    });
  });
});
