import request from 'supertest';
import express from 'express';
import { createRoutes } from '@/http/routes';
import { HealthController } from '@/modules/core/controllers/HealthController';
import { HealthService } from '@/modules/core/services/HealthService';
import { InMemoryHealthRepository } from '@/modules/core/repositories/InMemoryHealthRepository';

// Create test app without starting server
const healthRepository = new InMemoryHealthRepository();
const healthService = new HealthService(healthRepository);
const healthController = new HealthController(healthService);

const app = express();
app.use(express.json());
app.use(createRoutes(healthController));

describe('API Integration Tests', () => {
  it('should start the server and respond to health check', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.message).toBe('API is running');
  });

  it('should respond to API health endpoint', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.message).toBe('API is running');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown-route')
      .expect(404);

    expect(response.body).toEqual({
      error: 'Not Found',
      message: 'Route not found'
    });
  });
});