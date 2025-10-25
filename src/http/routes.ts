import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';

const routes = Router();

routes.use('/', coreRoutes);

export { routes };
