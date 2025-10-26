import { Condition } from '@modules/core/domain/Condition';

describe('Condition Entity', () => {
  describe('Creation', () => {
    it('should create a condition with valid props', () => {
      const condition = new Condition({
        id: 'condition-1',
        name: 'Purchase Condition',
        predicate: 'input.action === "compra"',
        linkedNodes: ['node-1', 'node-2'],
      });

      expect(condition.getId()).toBe('condition-1');
      expect(condition.getName()).toBe('Purchase Condition');
      expect(condition.getPredicate()).toBe('input.action === "compra"');
      expect(condition.getLinkedNodes()).toEqual(['node-1', 'node-2']);
    });

    it('should create a condition using factory method', () => {
      const condition = Condition.create({
        name: 'Help Condition',
        predicate: 'input.intent === "ajuda"',
        linkedNodes: ['node-3'],
      });

      expect(condition.getId()).toBeDefined();
      expect(condition.getName()).toBe('Help Condition');
    });

    it('should throw error if ID is empty', () => {
      expect(() => {
        new Condition({
          id: '',
          name: 'Test',
          predicate: 'true',
          linkedNodes: [],
        });
      }).toThrow('Condition ID is required');
    });

    it('should throw error if name is empty', () => {
      expect(() => {
        new Condition({
          id: 'cond-1',
          name: '',
          predicate: 'true',
          linkedNodes: [],
        });
      }).toThrow('Condition name is required');
    });

    it('should throw error if predicate is empty', () => {
      expect(() => {
        new Condition({
          id: 'cond-1',
          name: 'Test',
          predicate: '',
          linkedNodes: [],
        });
      }).toThrow('Condition predicate is required');
    });

    it('should throw error if linkedNodes is not an array', () => {
      expect(() => {
        new Condition({
          id: 'cond-1',
          name: 'Test',
          predicate: 'true',
          linkedNodes: 'not-an-array' as any,
        });
      }).toThrow('Condition linkedNodes must be an array');
    });
  });

  describe('Evaluation', () => {
    it('should evaluate simple equality condition', () => {
      const condition = Condition.create({
        name: 'Purchase',
        predicate: 'input.action === "compra"',
        linkedNodes: [],
      });

      expect(condition.evaluate({ action: 'compra' })).toBe(true);
      expect(condition.evaluate({ action: 'venda' })).toBe(false);
    });

    it('should evaluate nested property condition', () => {
      const condition = Condition.create({
        name: 'High Value',
        predicate: 'input.transaction.amount > 1000',
        linkedNodes: [],
      });

      expect(condition.evaluate({ transaction: { amount: 1500 } })).toBe(true);
      expect(condition.evaluate({ transaction: { amount: 500 } })).toBe(false);
    });

    it('should evaluate complex boolean condition', () => {
      const condition = Condition.create({
        name: 'VIP Purchase',
        predicate: 'input.action === "compra" && input.vip === true',
        linkedNodes: [],
      });

      expect(condition.evaluate({ action: 'compra', vip: true })).toBe(true);
      expect(condition.evaluate({ action: 'compra', vip: false })).toBe(false);
      expect(condition.evaluate({ action: 'venda', vip: true })).toBe(false);
    });

    it('should handle evaluation errors gracefully', () => {
      const condition = Condition.create({
        name: 'Invalid',
        predicate: 'invalid syntax ===',
        linkedNodes: [],
      });

      expect(condition.evaluate({})).toBe(false);
    });
  });

  describe('Updates', () => {
    it('should update name', () => {
      const condition = Condition.create({
        name: 'Original',
        predicate: 'true',
        linkedNodes: [],
      });

      condition.updateName('Updated');
      expect(condition.getName()).toBe('Updated');
    });

    it('should throw error when updating with empty name', () => {
      const condition = Condition.create({
        name: 'Original',
        predicate: 'true',
        linkedNodes: [],
      });

      expect(() => condition.updateName('')).toThrow('Condition name cannot be empty');
    });

    it('should update predicate', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'input.a === 1',
        linkedNodes: [],
      });

      condition.updatePredicate('input.b === 2');
      expect(condition.getPredicate()).toBe('input.b === 2');
    });

    it('should throw error when updating with empty predicate', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: [],
      });

      expect(() => condition.updatePredicate('')).toThrow('Condition predicate cannot be empty');
    });
  });

  describe('Linked Nodes Management', () => {
    it('should set linked nodes', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: ['node-1'],
      });

      condition.setLinkedNodes(['node-2', 'node-3']);
      expect(condition.getLinkedNodes()).toEqual(['node-2', 'node-3']);
    });

    it('should add linked node', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: ['node-1'],
      });

      condition.addLinkedNode('node-2');
      expect(condition.getLinkedNodes()).toEqual(['node-1', 'node-2']);
    });

    it('should not add duplicate linked node', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: ['node-1'],
      });

      condition.addLinkedNode('node-1');
      expect(condition.getLinkedNodes()).toEqual(['node-1']);
    });

    it('should remove linked node', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: ['node-1', 'node-2', 'node-3'],
      });

      condition.removeLinkedNode('node-2');
      expect(condition.getLinkedNodes()).toEqual(['node-1', 'node-3']);
    });

    it('should throw error when adding empty node ID', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: [],
      });

      expect(() => condition.addLinkedNode('')).toThrow('Node ID cannot be empty');
    });

    it('should throw error when setting non-array linkedNodes', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: [],
      });

      expect(() => condition.setLinkedNodes('not-array' as any)).toThrow('Linked nodes must be an array');
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON', () => {
      const condition = Condition.create({
        name: 'Test Condition',
        predicate: 'input.value > 10',
        linkedNodes: ['node-1', 'node-2'],
      });

      const json = condition.toJSON();

      expect(json).toEqual({
        id: expect.any(String),
        name: 'Test Condition',
        predicate: 'input.value > 10',
        linkedNodes: ['node-1', 'node-2'],
      });
    });

    it('should return copy of linked nodes array', () => {
      const condition = Condition.create({
        name: 'Test',
        predicate: 'true',
        linkedNodes: ['node-1'],
      });

      const linkedNodes1 = condition.getLinkedNodes();
      const linkedNodes2 = condition.getLinkedNodes();

      expect(linkedNodes1).not.toBe(linkedNodes2);
      expect(linkedNodes1).toEqual(linkedNodes2);
    });
  });
});
