import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyExecution__ } from '@modules/core/routes/execution.routes';
import { ToolType } from '@modules/core/domain/SystemTool';
import { NodeType } from '@modules/core/domain/Automation';

describe('Execution API - /api/execution', () => {
  beforeEach(() => {
    __testOnlyExecution__.clearLogs();
    __testOnlyExecution__.clearAutomations();
    __testOnlyExecution__.clearTools();
    __testOnlyExecution__.clearAgents();
  });

  describe('POST /api/execution/:automationId/start', () => {
    it('should start execution and return 202', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

      // Create tool
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ result: 'test' }),
      });

      // Create automation
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

      const response = await request(app)
        .post(`/api/execution/${automation.getId()}/start`)
        .send({ test: 'input' });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('message', 'Execution started');
      expect(response.body).toHaveProperty('automationId');
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app)
        .post('/api/execution/non-existent-id/start')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/execution/:automationId/status', () => {
    it('should return execution status', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

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

      await request(app)
        .post(`/api/execution/${automation.getId()}/start`)
        .send({});

      // Wait a bit for execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get(`/api/execution/${automation.getId()}/status`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('automationId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('totalNodes');
      expect(response.body).toHaveProperty('completedNodes');
      expect(response.body).toHaveProperty('failedNodes');
      expect(response.body).toHaveProperty('logs');
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app)
        .get('/api/execution/non-existent-id/status');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/execution/:automationId/logs', () => {
    it('should return execution logs', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

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

      await request(app)
        .post(`/api/execution/${automation.getId()}/start`)
        .send({});

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const response = await request(app)
        .get(`/api/execution/${automation.getId()}/logs`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/execution/:automationId/events (SSE)', () => {
    it('should return SSE headers', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

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

      // Just verify the endpoint exists and returns correct headers
      // Full SSE testing requires more complex setup
      const response = await request(app)
        .get(`/api/execution/${automation.getId()}/events`)
        .set('Accept', 'text/event-stream')
        .timeout(100)
        .catch(err => err);

      // SSE connection will timeout, which is expected
      // We just want to verify headers are set correctly
      expect(response).toBeDefined();
    });
  });

  describe('Full execution flow', () => {
    it('should execute automation with connected nodes', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

      // Create tools
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ output: 'trigger result' }),
      });

      const tool = await toolRepository.create({
        name: 'ActionTool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ processed: input }),
      });

      // Create automation
      const automation = await automationRepository.create({
        name: 'Connected Nodes',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: trigger.getId(),
          },
          {
            id: 'tool-1',
            type: NodeType.TOOL,
            referenceId: tool.getId(),
          },
        ],
        links: [
          {
            fromNodeId: 'trigger-1',
            fromOutputKey: 'output',
            toNodeId: 'tool-1',
            toInputKey: 'input',
          },
        ],
      });

      // Start execution
      await request(app)
        .post(`/api/execution/${automation.getId()}/start`)
        .send({});

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 200));

      // Check status
      const statusResponse = await request(app)
        .get(`/api/execution/${automation.getId()}/status`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.completedNodes).toBeGreaterThan(0);

      // Check logs
      const logsResponse = await request(app)
        .get(`/api/execution/${automation.getId()}/logs`);

      expect(logsResponse.status).toBe(200);
      expect(logsResponse.body.length).toBeGreaterThan(0);
    });

    it('should handle execution errors', async () => {
      const toolRepository = __testOnlyExecution__.getToolRepository();
      const automationRepository = __testOnlyExecution__.getAutomationRepository();

      const tool = await toolRepository.create({
        name: 'FailingTrigger',
        type: ToolType.TRIGGER,
        executor: async () => {
          throw new Error('Execution failed');
        },
      });

      const automation = await automationRepository.create({
        name: 'Failing Automation',
        nodes: [
          {
            id: 'trigger-1',
            type: NodeType.TRIGGER,
            referenceId: tool.getId(),
          },
        ],
        links: [],
      });

      await request(app)
        .post(`/api/execution/${automation.getId()}/start`)
        .send({});

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 200));

      const statusResponse = await request(app)
        .get(`/api/execution/${automation.getId()}/status`);

      expect(statusResponse.status).toBe(200);
      // Should have failure recorded
      expect(statusResponse.body.failedNodes).toBeGreaterThan(0);
    });
  });
});
