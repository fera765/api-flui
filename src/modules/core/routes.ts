import { Router } from 'express';
import { HealthCheckController } from './controllers/HealthCheckController';

const coreRoutes = Router();
const healthCheckController = new HealthCheckController();

coreRoutes.get('/', (req, res) => healthCheckController.handle(req, res));

export { coreRoutes };
