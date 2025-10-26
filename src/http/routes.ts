import { Router } from 'express';
import { coreRoutes } from '@modules/core/routes';
import { agentsRoutes } from '@modules/core/routes/agents.routes';
import { mcpsRoutes } from '@modules/core/routes/mcps.routes';
import { toolsRoutes, webhookRoutes } from '@modules/core/routes/tools.routes';
import { automationsRoutes } from '@modules/core/routes/automations.routes';
import { executionRoutes } from '@modules/core/routes/execution.routes';
import { conditionRoutes } from '@modules/core/routes/condition.routes';
import { importExportRoutes } from '@modules/core/routes/import-export.routes';
import { allToolsRoutes } from '@modules/core/routes/all-tools.routes';
import { toolsRoutes as torRoutes } from '@modules/tools/routes';
import { chatRoutes } from '@modules/chat/routes';

const routes = Router();

routes.use('/', coreRoutes);
routes.use('/api/agents', agentsRoutes);
routes.use('/api/mcps', mcpsRoutes);
routes.use('/api/all-tools', allToolsRoutes); // All tools from System + MCPs
routes.use('/api/tools/condition', conditionRoutes); // Condition tools (specific path first)
routes.use('/api/tor', torRoutes); // TOR - Tool Onboarding Registry (moved to /api/tor)
routes.use('/api/tools', toolsRoutes); // System tools (legacy)
routes.use('/api/webhooks', webhookRoutes); // WebHook dynamic routes
routes.use('/api/automations/export', importExportRoutes); // Must come before /api/automations to match export routes
routes.use('/api/automations/import', importExportRoutes); // Must come before /api/automations to match import routes
routes.use('/api/automations', automationsRoutes);
routes.use('/api/execution', executionRoutes);
routes.use('/api/chats', chatRoutes); // Chat contextual integration - FEATURE 10

export { routes };
