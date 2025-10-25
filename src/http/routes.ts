import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';
import { agentsRoutes } from '@modules/core/routes/agents.routes';

const routes = Router();

routes.use('/', coreRoutes);
routes.use('/api/agents', agentsRoutes);

export { routes };
