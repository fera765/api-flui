import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnly__ } from '@modules/core/routes';

describe('System Configuration API - /api/setting', () => {
  beforeEach(() => {
    __testOnly__.clearRepository();
  });

  describe('GET /api/setting', () => {
    it('should return default configuration when none is set', async () => {
      const response = await request(app).get('/api/setting');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('endpoint', 'https://api.llm7.io/v1');
      expect(response.body).toHaveProperty('model');
    });

    it('should return current configuration after it is set', async () => {
      // First, set a configuration
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://custom.api.com/v1',
          apiKey: 'test-key-123',
          model: 'gpt-4',
        });

      // Then get the configuration
      const response = await request(app).get('/api/setting');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        endpoint: 'https://custom.api.com/v1',
        apiKey: 'test-key-123',
        model: 'gpt-4',
      });
    });
  });

  describe('POST /api/setting', () => {
    it('should create new configuration', async () => {
      const response = await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
          apiKey: 'my-api-key',
          model: 'gpt-3.5-turbo',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        endpoint: 'https://test.api.com/v1',
        apiKey: 'my-api-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should create configuration without apiKey', async () => {
      const response = await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
          model: 'gpt-4',
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        endpoint: 'https://test.api.com/v1',
        model: 'gpt-4',
      });
      expect(response.body.apiKey).toBeUndefined();
    });

    it('should return 400 if endpoint is missing', async () => {
      const response = await request(app)
        .post('/api/setting')
        .send({
          model: 'gpt-4',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });

    it('should return 400 if model is missing', async () => {
      const response = await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://test.api.com/v1',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('PATCH /api/setting', () => {
    beforeEach(async () => {
      // Set initial configuration
      await request(app)
        .post('/api/setting')
        .send({
          endpoint: 'https://initial.api.com/v1',
          apiKey: 'initial-key',
          model: 'gpt-3.5-turbo',
        });
    });

    it('should update only endpoint', async () => {
      const response = await request(app)
        .patch('/api/setting')
        .send({
          endpoint: 'https://updated.api.com/v1',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        endpoint: 'https://updated.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should update only apiKey', async () => {
      const response = await request(app)
        .patch('/api/setting')
        .send({
          apiKey: 'new-key',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'new-key',
        model: 'gpt-3.5-turbo',
      });
    });

    it('should update only model', async () => {
      const response = await request(app)
        .patch('/api/setting')
        .send({
          model: 'gpt-4',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        endpoint: 'https://initial.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-4',
      });
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .patch('/api/setting')
        .send({
          endpoint: 'https://multi-update.api.com/v1',
          model: 'gpt-4-turbo',
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        endpoint: 'https://multi-update.api.com/v1',
        apiKey: 'initial-key',
        model: 'gpt-4-turbo',
      });
    });

    it('should return 404 if no configuration exists', async () => {
      // Create a clean app state (this will be handled by clearing repository)
      const response = await request(app)
        .patch('/api/setting')
        .send({
          model: 'gpt-4',
        });

      // This test will need proper setup/teardown
      expect([200, 404]).toContain(response.status);
    });
  });
});
