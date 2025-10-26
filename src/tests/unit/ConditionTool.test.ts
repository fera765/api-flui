import { ConditionTool } from '@modules/core/domain/ConditionTool';
import { Condition } from '@modules/core/domain/Condition';

describe('ConditionTool Entity', () => {
  const createCondition = (name: string, predicate: string, linkedNodes: string[] = []) => {
    return Condition.create({ name, predicate, linkedNodes });
  };

  describe('Creation', () => {
    it('should create a condition tool with valid props', () => {
      const conditions = [
        createCondition('Purchase', 'input.action === "compra"', ['node-1']),
        createCondition('Sale', 'input.action === "venda"', ['node-2']),
      ];

      const tool = new ConditionTool({
        id: 'tool-1',
        name: 'Action Router',
        description: 'Routes based on action type',
        type: 'atoom',
        conditions,
      });

      expect(tool.getId()).toBe('tool-1');
      expect(tool.getName()).toBe('Action Router');
      expect(tool.getDescription()).toBe('Routes based on action type');
      expect(tool.getType()).toBe('atoom');
      expect(tool.getConditions()).toHaveLength(2);
    });

    it('should create using factory method', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [],
      });

      expect(tool.getId()).toBeDefined();
      expect(tool.getType()).toBe('atoom');
    });

    it('should throw error if ID is empty', () => {
      expect(() => {
        new ConditionTool({
          id: '',
          name: 'Test',
          type: 'atoom',
          conditions: [],
        });
      }).toThrow('ConditionTool ID is required');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        new ConditionTool({
          id: 'tool-1',
          name: '',
          type: 'atoom',
          conditions: [],
        });
      }).toThrow('ConditionTool name is required');
    });

    it('should throw error if type is not atoom', () => {
      expect(() => {
        new ConditionTool({
          id: 'tool-1',
          name: 'Test',
          type: 'invalid' as any,
          conditions: [],
        });
      }).toThrow('ConditionTool type must be "atoom"');
    });

    it('should throw error if conditions is not an array', () => {
      expect(() => {
        new ConditionTool({
          id: 'tool-1',
          name: 'Test',
          type: 'atoom',
          conditions: 'not-array' as any,
        });
      }).toThrow('Conditions must be an array');
    });
  });

  describe('Condition Evaluation', () => {
    it('should evaluate and return first satisfied condition', () => {
      const tool = ConditionTool.create({
        name: 'Action Router',
        conditions: [
          createCondition('Purchase', 'input.action === "compra"', ['node-1', 'node-2']),
          createCondition('Sale', 'input.action === "venda"', ['node-3']),
          createCondition('Help', 'input.action === "ajuda"', ['node-4']),
        ],
      });

      const result = tool.evaluateConditions({ action: 'compra' });

      expect(result.satisfied).toBe(true);
      expect(result.conditionName).toBe('Purchase');
      expect(result.linkedNodes).toEqual(['node-1', 'node-2']);
    });

    it('should return not satisfied if no condition matches', () => {
      const tool = ConditionTool.create({
        name: 'Action Router',
        conditions: [
          createCondition('Purchase', 'input.action === "compra"', ['node-1']),
          createCondition('Sale', 'input.action === "venda"', ['node-2']),
        ],
      });

      const result = tool.evaluateConditions({ action: 'unknown' });

      expect(result.satisfied).toBe(false);
      expect(result.conditionId).toBeUndefined();
      expect(result.linkedNodes).toEqual([]);
    });

    it('should evaluate all conditions', () => {
      const tool = ConditionTool.create({
        name: 'Multi-match Router',
        conditions: [
          createCondition('High Value', 'input.amount > 1000', ['node-1']),
          createCondition('VIP', 'input.vip === true', ['node-2']),
          createCondition('Premium', 'input.premium === true', ['node-3']),
        ],
      });

      const results = tool.evaluateAllConditions({
        amount: 1500,
        vip: true,
        premium: false,
      });

      expect(results).toHaveLength(2);
      expect(results[0].conditionName).toBe('High Value');
      expect(results[1].conditionName).toBe('VIP');
    });

    it('should evaluate complex conditions', () => {
      const tool = ConditionTool.create({
        name: 'Complex Router',
        conditions: [
          createCondition('VIP Purchase', 'input.action === "compra" && input.vip === true', ['node-1']),
          createCondition('Regular Purchase', 'input.action === "compra" && input.vip === false', ['node-2']),
        ],
      });

      const result1 = tool.evaluateConditions({ action: 'compra', vip: true });
      expect(result1.conditionName).toBe('VIP Purchase');

      const result2 = tool.evaluateConditions({ action: 'compra', vip: false });
      expect(result2.conditionName).toBe('Regular Purchase');
    });
  });

  describe('Condition Management', () => {
    it('should add condition', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [],
      });

      const condition = createCondition('Test', 'true', []);
      tool.addCondition(condition);

      expect(tool.getConditions()).toHaveLength(1);
      expect(tool.getConditions()[0].getName()).toBe('Test');
    });

    it('should throw error when adding duplicate condition', () => {
      const condition = createCondition('Test', 'true', []);
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [condition],
      });

      expect(() => tool.addCondition(condition)).toThrow('Condition with ID');
    });

    it('should get condition by id', () => {
      const condition1 = createCondition('Test1', 'true', []);
      const condition2 = createCondition('Test2', 'true', []);
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [condition1, condition2],
      });

      const found = tool.getConditionById(condition1.getId());
      expect(found).toBeDefined();
      expect(found?.getName()).toBe('Test1');
    });

    it('should return undefined for non-existent condition', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [],
      });

      const found = tool.getConditionById('non-existent');
      expect(found).toBeUndefined();
    });

    it('should update condition', () => {
      const condition = createCondition('Original', 'input.a === 1', ['node-1']);
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [condition],
      });

      tool.updateCondition(condition.getId(), {
        name: 'Updated',
        predicate: 'input.b === 2',
        linkedNodes: ['node-2', 'node-3'],
      });

      const updated = tool.getConditionById(condition.getId());
      expect(updated?.getName()).toBe('Updated');
      expect(updated?.getPredicate()).toBe('input.b === 2');
      expect(updated?.getLinkedNodes()).toEqual(['node-2', 'node-3']);
    });

    it('should throw error when updating non-existent condition', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [],
      });

      expect(() => {
        tool.updateCondition('non-existent', { name: 'Test' });
      }).toThrow('Condition with ID non-existent not found');
    });

    it('should remove condition', () => {
      const condition1 = createCondition('Test1', 'true', []);
      const condition2 = createCondition('Test2', 'true', []);
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [condition1, condition2],
      });

      tool.removeCondition(condition1.getId());
      expect(tool.getConditions()).toHaveLength(1);
      expect(tool.getConditions()[0].getName()).toBe('Test2');
    });

    it('should throw error when removing non-existent condition', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        conditions: [],
      });

      expect(() => {
        tool.removeCondition('non-existent');
      }).toThrow('Condition with ID non-existent not found');
    });
  });

  describe('Updates', () => {
    it('should update name', () => {
      const tool = ConditionTool.create({
        name: 'Original',
        conditions: [],
      });

      tool.updateName('Updated');
      expect(tool.getName()).toBe('Updated');
    });

    it('should throw error when updating with empty name', () => {
      const tool = ConditionTool.create({
        name: 'Original',
        conditions: [],
      });

      expect(() => tool.updateName('')).toThrow('ConditionTool name cannot be empty');
    });

    it('should update description', () => {
      const tool = ConditionTool.create({
        name: 'Test',
        description: 'Original',
        conditions: [],
      });

      tool.updateDescription('Updated');
      expect(tool.getDescription()).toBe('Updated');
    });

    it('should allow undefined description', () => {
      const tool = ConditionTool.create({
        name: 'Test',
        description: 'Original',
        conditions: [],
      });

      tool.updateDescription(undefined);
      expect(tool.getDescription()).toBeUndefined();
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON', () => {
      const tool = ConditionTool.create({
        name: 'Test Tool',
        description: 'Test Description',
        conditions: [
          createCondition('Test', 'true', ['node-1']),
        ],
      });

      const json = tool.toJSON();

      expect(json).toEqual({
        id: expect.any(String),
        name: 'Test Tool',
        description: 'Test Description',
        type: 'atoom',
        conditions: [
          {
            id: expect.any(String),
            name: 'Test',
            predicate: 'true',
            linkedNodes: ['node-1'],
          },
        ],
      });
    });

    it('should return copy of conditions array', () => {
      const tool = ConditionTool.create({
        name: 'Test',
        conditions: [createCondition('Test', 'true', [])],
      });

      const conditions1 = tool.getConditions();
      const conditions2 = tool.getConditions();

      expect(conditions1).not.toBe(conditions2);
      expect(conditions1).toHaveLength(conditions2.length);
    });
  });
});
