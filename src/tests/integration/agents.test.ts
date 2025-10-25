import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnlyAgents__ } from '@modules/core/routes/agents.routes';

describe('Agents API - /api/agents', () => {
  beforeEach(() => {
    __testOnlyAgents__.clearRepository();
  });

  describe('GET /api/agents', () => {
    it('should return empty array when no agents exist', async () => {
      const response = await request(app).get('/api/agents');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return all agents', async () => {
      // Create agents first
      await request(app)
        .post('/api/agents')
        .send({
          name: 'Agent 1',
          prompt: 'You are a helpful assistant',
        });

      await request(app)
        .post('/api/agents')
        .send({
          name: 'Agent 2',
          prompt: 'You are a code reviewer',
        });

      const response = await request(app).get('/api/agents');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('prompt');
      expect(response.body[0]).toHaveProperty('tools');
    });
  });

  describe('GET /api/agents/:id', () => {
    it('should return agent by id', async () => {
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          description: 'A test agent',
          prompt: 'You are a test assistant',
          defaultModel: 'gpt-4',
        });

      const agentId = createResponse.body.id;

      const response = await request(app).get(`/api/agents/${agentId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: agentId,
        name: 'Test Agent',
        description: 'A test agent',
        prompt: 'You are a test assistant',
        defaultModel: 'gpt-4',
        tools: [],
      });
    });

    it('should return 404 when agent not found', async () => {
      const response = await request(app).get('/api/agents/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/agents', () => {
    it('should create a new agent with required fields', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          name: 'New Agent',
          prompt: 'You are a helpful assistant',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Agent');
      expect(response.body).toHaveProperty('prompt', 'You are a helpful assistant');
      expect(response.body).toHaveProperty('tools', []);
    });

    it('should create agent with all fields', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          name: 'Complete Agent',
          description: 'A complete agent',
          prompt: 'You are an expert',
          defaultModel: 'gpt-4-turbo',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.any(String),
        name: 'Complete Agent',
        description: 'A complete agent',
        prompt: 'You are an expert',
        defaultModel: 'gpt-4-turbo',
        tools: [],
      });
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          prompt: 'You are helpful',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 when prompt is missing', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          name: 'Agent',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /api/agents/:id', () => {
    it('should update agent name', async () => {
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Original Name',
          prompt: 'Original prompt',
        });

      const agentId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.prompt).toBe('Original prompt');
    });

    it('should update multiple fields', async () => {
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Agent',
          prompt: 'Original prompt',
        });

      const agentId = createResponse.body.id;

      const response = await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({
          name: 'New Name',
          description: 'New description',
          defaultModel: 'gpt-4',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('New description');
      expect(response.body.defaultModel).toBe('gpt-4');
    });

    it('should return 404 when agent not found', async () => {
      const response = await request(app)
        .patch('/api/agents/non-existent-id')
        .send({
          name: 'New Name',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('DELETE /api/agents/:id', () => {
    it('should delete an agent', async () => {
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Agent to Delete',
          prompt: 'Will be deleted',
        });

      const agentId = createResponse.body.id;

      const response = await request(app).delete(`/api/agents/${agentId}`);

      expect(response.status).toBe(204);

      // Verify agent was deleted
      const getResponse = await request(app).get(`/api/agents/${agentId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when trying to delete non-existent agent', async () => {
      const response = await request(app).delete('/api/agents/non-existent-id');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });
});
