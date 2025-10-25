import { Router } from 'express';
import { HealthController } from '@/modules/core/controllers/HealthController';
import { createCoreRoutes } from '@/modules/core/routes';
import { notFoundHandler, errorHandler } from './middlewares';

export function createRoutes(healthController: HealthController): Router {
  const router = Router();

  // Main route
  router.get('/', healthController.getHealth.bind(healthController));

  // API routes
  router.use('/api', createCoreRoutes(healthController));

  // Error handling
  router.use(notFoundHandler);
  router.use(errorHandler);

  return router;
}