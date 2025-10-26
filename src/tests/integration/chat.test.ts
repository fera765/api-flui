import request from 'supertest';
import { app } from '@infra/http/app';
import { automationRepository } from '@shared/repositories/singletons';
import { chatRepository } from '@modules/chat/routes';

describe('Chat Integration Tests', () => {
  let automationId: string;
  let chatId: string;

  beforeEach(async () => {
    // Clear repositories
    chatRepository.clear();

    // Create a test automation with tools
    const automation = await automationRepository.create({
      name: 'Test Automation for Chat',
      description: 'This is a test automation for chat integration',
      nodes: [],
      links: [],
    });

    automationId = automation.getId();
  });

  describe('POST /api/chats', () => {
    it('should create a new chat for an automation', async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.automationId).toBe(automationId);
      expect(response.body.status).toBe('active');
      expect(response.body).toHaveProperty('context');
      expect(response.body.context.automation).toHaveProperty('name');
      expect(response.body.messages).toHaveLength(1); // System message

      chatId = response.body.id;
    });

    it('should return 400 if automationId is missing', async () => {
      await request(app)
        .post('/api/chats')
        .send({})
        .expect(400);
    });

    it('should return 404 if automation does not exist', async () => {
      await request(app)
        .post('/api/chats')
        .send({ automationId: 'non-existent-id' })
        .expect(404);
    });
  });

  describe('GET /api/chats/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should get chat by id', async () => {
      const response = await request(app)
        .get(`/api/chats/${chatId}`)
        .expect(200);

      expect(response.body.id).toBe(chatId);
      expect(response.body.automationId).toBe(automationId);
      expect(response.body).toHaveProperty('messages');
    });

    it('should return 404 if chat does not exist', async () => {
      await request(app)
        .get('/api/chats/non-existent-id')
        .expect(404);
    });
  });

  describe('GET /api/chats', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/chats')
        .send({ automationId });

      await request(app)
        .post('/api/chats')
        .send({ automationId });
    });

    it('should list all chats', async () => {
      const response = await request(app)
        .get('/api/chats')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter chats by automationId', async () => {
      const response = await request(app)
        .get(`/api/chats?automationId=${automationId}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
      expect(response.body.every((chat: any) => chat.automationId === automationId)).toBe(true);
    });
  });

  describe('POST /api/chats/:id/messages', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should send a message and receive response', async () => {
      const response = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'What is the status of this automation?' })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.role).toBe('assistant');
      expect(response.body).toHaveProperty('content');
      expect(response.body.content.length).toBeGreaterThan(0);
    });

    it('should return 400 if content is missing', async () => {
      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({})
        .expect(400);
    });

    it('should return 404 if chat does not exist', async () => {
      await request(app)
        .post('/api/chats/non-existent-id/messages')
        .send({ content: 'Hello' })
        .expect(404);
    });
  });

  describe('GET /api/chats/:id/messages', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;

      // Send some messages
      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'Hello' });

      await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'How are you?' });
    });

    it('should get all messages from chat', async () => {
      const response = await request(app)
        .get(`/api/chats/${chatId}/messages`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(5); // 1 system + 2 user + 2 assistant
    });
  });

  describe('GET /api/chats/:id/stream', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should stream a message response', async () => {
      const response = await request(app)
        .get(`/api/chats/${chatId}/stream?message=Tell me about this automation`)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.text).toBeTruthy();
      expect(response.text).toContain('data:');
    });

    it('should return 400 if message query parameter is missing', async () => {
      await request(app)
        .get(`/api/chats/${chatId}/stream`)
        .expect(400);
    });
  });

  describe('PATCH /api/chats/:id/archive', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should archive a chat', async () => {
      const response = await request(app)
        .patch(`/api/chats/${chatId}/archive`)
        .expect(200);

      expect(response.body.status).toBe('archived');
    });

    it('should return 404 if chat does not exist', async () => {
      await request(app)
        .patch('/api/chats/non-existent-id/archive')
        .expect(404);
    });
  });

  describe('DELETE /api/chats/:id', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should delete a chat', async () => {
      await request(app)
        .delete(`/api/chats/${chatId}`)
        .expect(204);

      // Verify chat is deleted
      await request(app)
        .get(`/api/chats/${chatId}`)
        .expect(404);
    });

    it('should return 404 if chat does not exist', async () => {
      await request(app)
        .delete('/api/chats/non-existent-id')
        .expect(404);
    });
  });

  describe('Chat Context Integration', () => {
    beforeEach(async () => {
      const response = await request(app)
        .post('/api/chats')
        .send({ automationId });
      chatId = response.body.id;
    });

    it('should include automation context in chat', async () => {
      const response = await request(app)
        .get(`/api/chats/${chatId}`)
        .expect(200);

      expect(response.body.context).toHaveProperty('automation');
      expect(response.body.context.automation.name).toBe('Test Automation for Chat');
    });

    it('should include available tools in context', async () => {
      const response = await request(app)
        .get(`/api/chats/${chatId}`)
        .expect(200);

      expect(response.body.context).toHaveProperty('availableTools');
      expect(Array.isArray(response.body.context.availableTools)).toBe(true);
    });

    it('should respond intelligently to automation questions', async () => {
      const response = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'Explain what this automation does' })
        .expect(200);

      expect(response.body.content).toContain('automation');
      expect(response.body.content.length).toBeGreaterThan(20);
    });

    it('should respond to status queries', async () => {
      const response = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'What is the status?' })
        .expect(200);

      expect(response.body.content.toLowerCase()).toContain('idle');
    });

    it('should list available tools when asked', async () => {
      const response = await request(app)
        .post(`/api/chats/${chatId}/messages`)
        .send({ content: 'List all tools' })
        .expect(200);

      expect(response.body.content.toLowerCase()).toContain('tool');
    });
  });
});
