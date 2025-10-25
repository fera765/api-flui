import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyAutomations__ } from '@modules/core/routes/automations.routes';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('Automations API - /api/automations', () => {
  beforeEach(() => {
    __testOnlyAutomations__.clearRepository();
    __testOnlyAutomations__.clearToolRepository();
    __testOnlyAutomations__.clearAgentRepository();
  });

  describe('POST /api/automations', () => {
    it('should create an automation', async () => {
      const response = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          description: 'Test description',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              referenceId: 'some-trigger-id',
            },
          ],
          links: [],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Automation');
      expect(response.body.status).toBe('idle');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/automations')
        .send({
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('name is required');
    });

    it('should return 400 when no nodes provided', async () => {
      const response = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test',
          nodes: [],
          links: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least one node');
    });

    it('should return 400 when no trigger node', async () => {
      const response = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test',
          nodes: [{ id: 'n1', type: 'tool', referenceId: 't1' }],
          links: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least one trigger node');
    });

    it('should return 400 when name already exists', async () => {
      await request(app)
        .post('/api/automations')
        .send({
          name: 'Duplicate',
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      const response = await request(app)
        .post('/api/automations')
        .send({
          name: 'Duplicate',
          nodes: [{ id: 'n2', type: 'trigger', referenceId: 't2' }],
          links: [],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/automations', () => {
    it('should return empty array when no automations', async () => {
      const response = await request(app).get('/api/automations');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all automations', async () => {
      await request(app)
        .post('/api/automations')
        .send({
          name: 'Auto1',
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      await request(app)
        .post('/api/automations')
        .send({
          name: 'Auto2',
          nodes: [{ id: 'n2', type: 'trigger', referenceId: 't2' }],
          links: [],
        });

      const response = await request(app).get('/api/automations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/automations/:id', () => {
    it('should return automation by id', async () => {
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test',
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      const automationId = createResponse.body.id;

      const response = await request(app).get(`/api/automations/${automationId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(automationId);
      expect(response.body.name).toBe('Test');
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app).get('/api/automations/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('PATCH /api/automations/:id', () => {
    it('should update automation', async () => {
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Original',
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      const automationId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/automations/${automationId}`)
        .send({
          name: 'Updated',
          description: 'New description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated');
      expect(response.body.description).toBe('New description');
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app)
        .patch('/api/automations/non-existent-id')
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/automations/:id', () => {
    it('should delete automation', async () => {
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'ToDelete',
          nodes: [{ id: 'n1', type: 'trigger', referenceId: 't1' }],
          links: [],
        });

      const automationId = createResponse.body.id;

      const response = await request(app).delete(`/api/automations/${automationId}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/api/automations/${automationId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app).delete('/api/automations/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/automations/:id/execute', () => {
    it('should execute automation with manual trigger', async () => {
      // Create a trigger tool
      const toolRepository = __testOnlyAutomations__.getToolRepository();
      const tool = await toolRepository.create({
        name: 'ManualTrigger',
        type: ToolType.TRIGGER,
        executor: async (input: unknown) => ({ result: 'executed', input }),
      });

      // Create automation
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Execution',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              referenceId: tool.getId(),
            },
          ],
          links: [],
        });

      const automationId = createResponse.body.id;

      // Execute automation
      const response = await request(app)
        .post(`/api/automations/${automationId}/execute`)
        .send({ test: 'data' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('automationId', automationId);
      expect(response.body).toHaveProperty('executedNodes');
      expect(Object.keys(response.body.executedNodes).length).toBeGreaterThan(0);
    });

    it('should execute automation with connected nodes', async () => {
      const toolRepository = __testOnlyAutomations__.getToolRepository();

      // Create trigger
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ output: 'trigger result' }),
      });

      // Create action tool
      const tool = await toolRepository.create({
        name: 'ActionTool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ processed: input }),
      });

      // Create automation with connected nodes
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Connected Nodes',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              referenceId: trigger.getId(),
            },
            {
              id: 'tool-1',
              type: 'tool',
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

      const automationId = createResponse.body.id;

      // Execute automation
      const response = await request(app)
        .post(`/api/automations/${automationId}/execute`)
        .send({});

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.executedNodes).length).toBe(2);
    });

    it('should execute automation with agent node', async () => {
      const toolRepository = __testOnlyAutomations__.getToolRepository();
      const agentRepository = __testOnlyAutomations__.getAgentRepository();

      // Create trigger
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ message: 'start' }),
      });

      // Create agent
      const agent = await agentRepository.create({
        name: 'TestAgent',
        prompt: 'You are a helpful assistant',
        tools: [],
      });

      // Create automation
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Agent Automation',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              referenceId: trigger.getId(),
            },
            {
              id: 'agent-1',
              type: 'agent',
              referenceId: agent.getId(),
            },
          ],
          links: [
            {
              fromNodeId: 'trigger-1',
              fromOutputKey: 'message',
              toNodeId: 'agent-1',
              toInputKey: 'input',
            },
          ],
        });

      const automationId = createResponse.body.id;

      // Execute automation
      const response = await request(app)
        .post(`/api/automations/${automationId}/execute`)
        .send({});

      expect(response.status).toBe(200);
      expect(Object.keys(response.body.executedNodes).length).toBe(2);
    });

    it('should return 404 when automation not found', async () => {
      const response = await request(app)
        .post('/api/automations/non-existent-id/execute')
        .send({});

      expect(response.status).toBe(404);
    });

    it('should handle execution errors', async () => {
      const toolRepository = __testOnlyAutomations__.getToolRepository();

      // Create failing trigger
      const tool = await toolRepository.create({
        name: 'FailingTrigger',
        type: ToolType.TRIGGER,
        executor: async () => {
          throw new Error('Execution failed');
        },
      });

      // Create automation
      const createResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Failing Automation',
          nodes: [
            {
              id: 'trigger-1',
              type: 'trigger',
              referenceId: tool.getId(),
            },
          ],
          links: [],
        });

      const automationId = createResponse.body.id;

      // Execute automation
      const response = await request(app)
        .post(`/api/automations/${automationId}/execute`)
        .send({});

      expect(response.status).toBe(500);
    });
  });
});
