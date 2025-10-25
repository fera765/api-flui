import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';
import { agentsRoutes } from '@modules/core/routes/agents.routes';
import { mcpsRoutes } from '@modules/core/routes/mcps.routes';

const routes = Router();

routes.use('/', coreRoutes);
routes.use('/api/agents', agentsRoutes);
routes.use('/api/mcps', mcpsRoutes);

export { routes };
