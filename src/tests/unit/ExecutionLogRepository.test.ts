import { ExecutionLogRepositoryInMemory } from '@modules/core/repositories/ExecutionLogRepositoryInMemory';
import { ExecutionContext, ExecutionStatus } from '@modules/core/domain/Execution';

describe('ExecutionLogRepositoryInMemory', () => {
  let repository: ExecutionLogRepositoryInMemory;

  beforeEach(() => {
    repository = new ExecutionLogRepositoryInMemory();
  });

  describe('save', () => {
    it('should save execution context', async () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context);

      const found = await repository.findByNodeId('auto-1', 'node-1');
      expect(found).toBeDefined();
      expect(found?.getNodeId()).toBe('node-1');
    });

    it('should update existing context', async () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context);

      context.setStatus(ExecutionStatus.COMPLETED);
      await repository.save(context);

      const found = await repository.findByNodeId('auto-1', 'node-1');
      expect(found?.getStatus()).toBe(ExecutionStatus.COMPLETED);
    });
  });

  describe('findByAutomationId', () => {
    it('should return empty array when no logs', async () => {
      const logs = await repository.findByAutomationId('auto-1');
      expect(logs).toEqual([]);
    });

    it('should return all logs for automation', async () => {
      const context1 = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      const context2 = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-2',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context1);
      await repository.save(context2);

      const logs = await repository.findByAutomationId('auto-1');
      expect(logs).toHaveLength(2);
    });
  });

  describe('findByNodeId', () => {
    it('should return null when not found', async () => {
      const found = await repository.findByNodeId('auto-1', 'node-1');
      expect(found).toBeNull();
    });

    it('should return context by node id', async () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context);

      const found = await repository.findByNodeId('auto-1', 'node-1');
      expect(found?.getNodeId()).toBe('node-1');
    });
  });

  describe('findAll', () => {
    it('should return empty array when no logs', async () => {
      const logs = await repository.findAll();
      expect(logs).toEqual([]);
    });

    it('should return all logs', async () => {
      const context1 = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      const context2 = new ExecutionContext({
        automationId: 'auto-2',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context1);
      await repository.save(context2);

      const logs = await repository.findAll();
      expect(logs).toHaveLength(2);
    });
  });

  describe('clear', () => {
    it('should clear all logs', async () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await repository.save(context);

      repository.clear();

      const logs = await repository.findAll();
      expect(logs).toEqual([]);
    });
  });
});
