import { Router } from 'express';
import { HealthController } from './controllers/HealthController';

export function createCoreRoutes(healthController: HealthController): Router {
  const router = Router();

  // Health check routes
  router.get('/', healthController.getHealth.bind(healthController));
  router.get('/health', healthController.getHealth.bind(healthController));

  return router;
}