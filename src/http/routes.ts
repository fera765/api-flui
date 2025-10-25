import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';
import { agentsRoutes } from '@modules/core/routes/agents.routes';
import { mcpsRoutes } from '@modules/core/routes/mcps.routes';
import { toolsRoutes, webhookRoutes } from '@modules/core/routes/tools.routes';

const routes = Router();

routes.use('/', coreRoutes);
routes.use('/api/agents', agentsRoutes);
routes.use('/api/mcps', mcpsRoutes);
routes.use('/api/tools', toolsRoutes);
routes.use('/api/webhooks', webhookRoutes); // WebHook dynamic routes

export { routes };
