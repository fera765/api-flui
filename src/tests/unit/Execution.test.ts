import { 
  ExecutionContext, 
  ExecutionStatus, 
  NodeEvent, 
  NodeEventStatus 
} from '@modules/core/domain/Execution';

describe('Execution Domain', () => {
  describe('ExecutionContext', () => {
    it('should create execution context with all properties', () => {
      const startTime = new Date();
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: { test: 'input' },
        outputs: { result: 'output' },
        status: ExecutionStatus.COMPLETED,
        startTime,
        endTime: new Date(startTime.getTime() + 1000),
      });

      expect(context.getAutomationId()).toBe('auto-1');
      expect(context.getNodeId()).toBe('node-1');
      expect(context.getInputs()).toEqual({ test: 'input' });
      expect(context.getOutputs()).toEqual({ result: 'output' });
      expect(context.getStatus()).toBe(ExecutionStatus.COMPLETED);
      expect(context.getStartTime()).toBe(startTime);
      expect(context.getEndTime()).toBeDefined();
    });

    it('should set outputs', () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      context.setOutputs({ result: 'test' });
      expect(context.getOutputs()).toEqual({ result: 'test' });
    });

    it('should set status', () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      context.setStatus(ExecutionStatus.RUNNING);
      expect(context.getStatus()).toBe(ExecutionStatus.RUNNING);
    });

    it('should set end time', () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      const endTime = new Date();
      context.setEndTime(endTime);
      expect(context.getEndTime()).toBe(endTime);
    });

    it('should set error', () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      context.setError('Test error');
      expect(context.getError()).toBe('Test error');
    });

    it('should calculate duration', () => {
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 1000);

      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.COMPLETED,
        startTime,
        endTime,
      });

      expect(context.getDuration()).toBe(1000);
    });

    it('should return undefined duration when not ended', () => {
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: {},
        status: ExecutionStatus.RUNNING,
        startTime: new Date(),
      });

      expect(context.getDuration()).toBeUndefined();
    });

    it('should return correct JSON', () => {
      const startTime = new Date();
      const context = new ExecutionContext({
        automationId: 'auto-1',
        nodeId: 'node-1',
        inputs: { test: 'input' },
        status: ExecutionStatus.PENDING,
        startTime,
      });

      const json = context.toJSON();

      expect(json).toHaveProperty('automationId', 'auto-1');
      expect(json).toHaveProperty('nodeId', 'node-1');
      expect(json).toHaveProperty('inputs');
      expect(json).toHaveProperty('status', ExecutionStatus.PENDING);
      expect(json).toHaveProperty('startTime');
    });
  });

  describe('NodeEvent', () => {
    it('should create node event with all properties', () => {
      const timestamp = new Date();
      const event = new NodeEvent({
        nodeId: 'node-1',
        automationId: 'auto-1',
        status: NodeEventStatus.COMPLETED,
        outputs: { result: 'test' },
        timestamp,
      });

      expect(event.getNodeId()).toBe('node-1');
      expect(event.getAutomationId()).toBe('auto-1');
      expect(event.getStatus()).toBe(NodeEventStatus.COMPLETED);
      expect(event.getOutputs()).toEqual({ result: 'test' });
      expect(event.getTimestamp()).toBe(timestamp);
    });

    it('should create node event with error', () => {
      const event = new NodeEvent({
        nodeId: 'node-1',
        automationId: 'auto-1',
        status: NodeEventStatus.FAILED,
        error: 'Test error',
        timestamp: new Date(),
      });

      expect(event.getStatus()).toBe(NodeEventStatus.FAILED);
      expect(event.getError()).toBe('Test error');
    });

    it('should return correct JSON', () => {
      const timestamp = new Date();
      const event = new NodeEvent({
        nodeId: 'node-1',
        automationId: 'auto-1',
        status: NodeEventStatus.RUNNING,
        timestamp,
      });

      const json = event.toJSON();

      expect(json).toHaveProperty('nodeId', 'node-1');
      expect(json).toHaveProperty('automationId', 'auto-1');
      expect(json).toHaveProperty('status', NodeEventStatus.RUNNING);
      expect(json).toHaveProperty('timestamp');
    });

    it('should format SSE correctly', () => {
      const event = new NodeEvent({
        nodeId: 'node-1',
        automationId: 'auto-1',
        status: NodeEventStatus.COMPLETED,
        timestamp: new Date(),
      });

      const sse = event.toSSE();

      expect(sse).toContain('data: ');
      expect(sse).toContain('nodeId');
      expect(sse).toContain('\n\n');
    });
  });
});
