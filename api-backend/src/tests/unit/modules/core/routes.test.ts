import request from 'supertest';
import express from 'express';
import { createCoreRoutes } from '@/modules/core/routes';
import { HealthController } from '@/modules/core/controllers/HealthController';
import { HealthService } from '@/modules/core/services/HealthService';
import { InMemoryHealthRepository } from '@/modules/core/repositories/InMemoryHealthRepository';

describe('Core Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    const repository = new InMemoryHealthRepository();
    const service = new HealthService(repository);
    const controller = new HealthController(service);
    
    app = express();
    app.use(express.json());
    app.use('/api', createCoreRoutes(controller));
  });

  it('should respond to GET /api/health', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.message).toBe('API is running');
  });

  it('should respond to GET /api/', async () => {
    const response = await request(app)
      .get('/api/')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body.message).toBe('API is running');
  });
});