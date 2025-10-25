import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyTools__ } from '@modules/core/routes/tools.routes';
import { createManualTriggerTool } from '@modules/core/tools/triggers/ManualTriggerTool';
import { createWebHookTriggerTool } from '@modules/core/tools/triggers/WebHookTriggerTool';
import { TriggerWebHookConfig } from '@modules/core/domain/SystemTool';

describe('Tools API - /api/tools', () => {
  beforeEach(() => {
    __testOnlyTools__.clearRepository();
  });

  describe('POST /api/tools', () => {
    it('should create a tool', async () => {
      const response = await request(app)
        .post('/api/tools')
        .send({
          name: 'TestTool',
          description: 'A test tool',
          type: 'action',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('TestTool');
      expect(response.body.type).toBe('action');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/tools')
        .send({
          type: 'action',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should return 400 when tool name already exists', async () => {
      await request(app)
        .post('/api/tools')
        .send({
          name: 'DuplicateTool',
          type: 'action',
        });

      const response = await request(app)
        .post('/api/tools')
        .send({
          name: 'DuplicateTool',
          type: 'action',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/tools', () => {
    it('should return empty array when no tools exist', async () => {
      const response = await request(app).get('/api/tools');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all tools', async () => {
      await request(app)
        .post('/api/tools')
        .send({ name: 'Tool1', type: 'action' });

      await request(app)
        .post('/api/tools')
        .send({ name: 'Tool2', type: 'trigger' });

      const response = await request(app).get('/api/tools');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /api/tools/:id', () => {
    it('should return tool by id', async () => {
      const createResponse = await request(app)
        .post('/api/tools')
        .send({ name: 'TestTool', type: 'action' });

      const toolId = createResponse.body.id;

      const response = await request(app).get(`/api/tools/${toolId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(toolId);
      expect(response.body.name).toBe('TestTool');
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app).get('/api/tools/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/tools/:id', () => {
    it('should delete a tool', async () => {
      const createResponse = await request(app)
        .post('/api/tools')
        .send({ name: 'ToDelete', type: 'action' });

      const toolId = createResponse.body.id;

      const response = await request(app).delete(`/api/tools/${toolId}`);

      expect(response.status).toBe(204);

      const getResponse = await request(app).get(`/api/tools/${toolId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when trying to delete non-existent tool', async () => {
      const response = await request(app).delete('/api/tools/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/tools/:id/execute', () => {
    it('should execute a tool', async () => {
      const repository = __testOnlyTools__.getRepository();
      const tool = createManualTriggerTool();
      await repository.create({
        name: tool.getName(),
        type: tool.getType(),
        config: tool.getConfig(),
        inputSchema: tool.getInputSchema(),
        outputSchema: tool.getOutputSchema(),
        executor: async (input: unknown) => tool.execute(input),
      });

      const tools = await repository.findAll();
      const toolId = tools[0].getId();

      const response = await request(app)
        .post(`/api/tools/${toolId}/execute`)
        .send({ message: 'test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'executed');
    });

    it('should return 404 when tool not found', async () => {
      const response = await request(app)
        .post('/api/tools/non-existent-id/execute')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
    });
  });

  describe('WebHook Trigger', () => {
    it('should execute webhook with POST', async () => {
      const repository = __testOnlyTools__.getRepository();
      const tool = createWebHookTriggerTool('POST');
      await repository.create({
        name: tool.getName(),
        type: tool.getType(),
        config: tool.getConfig(),
        inputSchema: tool.getInputSchema(),
        outputSchema: tool.getOutputSchema(),
        executor: async (input: unknown) => tool.execute(input),
      });

      const tools = await repository.findAll();
      const webhookTool = tools[0];
      const config = webhookTool.getConfig() as TriggerWebHookConfig;

      const response = await request(app)
        .post(`/api/webhooks/${webhookTool.getId()}`)
        .set('Authorization', `Bearer ${config.token}`)
        .send({ message: 'webhook test' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'received');
      expect(response.body.payload).toEqual({ message: 'webhook test' });
    });

    it('should execute webhook with GET', async () => {
      const repository = __testOnlyTools__.getRepository();
      const tool = createWebHookTriggerTool('GET');
      await repository.create({
        name: tool.getName(),
        type: tool.getType(),
        config: tool.getConfig(),
        inputSchema: tool.getInputSchema(),
        outputSchema: tool.getOutputSchema(),
        executor: async (input: unknown) => tool.execute(input),
      });

      const tools = await repository.findAll();
      const webhookTool = tools[0];
      const config = webhookTool.getConfig() as TriggerWebHookConfig;

      const response = await request(app)
        .get(`/api/webhooks/${webhookTool.getId()}?message=test`)
        .set('Authorization', `Bearer ${config.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'received');
    });

    it('should return 401 with invalid token', async () => {
      const repository = __testOnlyTools__.getRepository();
      const tool = createWebHookTriggerTool('POST');
      await repository.create({
        name: tool.getName(),
        type: tool.getType(),
        config: tool.getConfig(),
        inputSchema: tool.getInputSchema(),
        outputSchema: tool.getOutputSchema(),
        executor: async (input: unknown) => tool.execute(input),
      });

      const tools = await repository.findAll();
      const webhookTool = tools[0];

      const response = await request(app)
        .post(`/api/webhooks/${webhookTool.getId()}`)
        .set('Authorization', 'Bearer invalid-token')
        .send({ message: 'test' });

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent webhook', async () => {
      const response = await request(app)
        .post('/api/webhooks/non-existent-id')
        .set('Authorization', 'Bearer some-token')
        .send({ test: 'data' });

      expect(response.status).toBe(404);
    });
  });
});
