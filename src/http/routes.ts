import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';
import { agentsRoutes } from '@modules/core/routes/agents.routes';
import { mcpsRoutes } from '@modules/core/routes/mcps.routes';
import { toolsRoutes, webhookRoutes } from '@modules/core/routes/tools.routes';
import { automationsRoutes } from '@modules/core/routes/automations.routes';
import { executionRoutes } from '@modules/core/routes/execution.routes';
import { conditionRoutes } from '@modules/core/routes/condition.routes';

const routes = Router();

routes.use('/', coreRoutes);
routes.use('/api/agents', agentsRoutes);
routes.use('/api/mcps', mcpsRoutes);
routes.use('/api/tools/condition', conditionRoutes); // Must come before /api/tools to match correctly
routes.use('/api/tools', toolsRoutes);
routes.use('/api/webhooks', webhookRoutes); // WebHook dynamic routes
routes.use('/api/automations', automationsRoutes);
routes.use('/api/execution', executionRoutes);

export { routes };
