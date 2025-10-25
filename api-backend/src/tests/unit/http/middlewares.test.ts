import request from 'supertest';
import express from 'express';
import { errorHandler, notFoundHandler } from '@/http/middlewares';

describe('HTTP Middlewares', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('notFoundHandler', () => {
    it('should return 404 for unknown routes', async () => {
      app.use(notFoundHandler);

      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Not Found',
        message: 'Route not found'
      });
    });
  });

  describe('errorHandler', () => {
    it('should handle AppError correctly', async () => {
      app.get('/test-error', (_req, _res, next) => {
        const { AppError } = require('@/shared/errors');
        next(new AppError('Test error', 400));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test-error')
        .expect(400);

      expect(response.body).toEqual({
        error: 'AppError',
        message: 'Test error'
      });
    });

    it('should handle generic errors', async () => {
      app.get('/test-error', (_req, _res, next) => {
        next(new Error('Generic error'));
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Generic error'
      });
    });

    it('should handle errors without message', async () => {
      app.get('/test-error', (_req, _res, next) => {
        next(new Error());
      });
      app.use(errorHandler);

      const response = await request(app)
        .get('/test-error')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Internal Server Error',
        message: 'Unknown error'
      });
    });
  });
});