import { Router } from 'express';
import { ImportExportController } from '../controllers/ImportExportController';
import { ImportExportService } from '../services/ImportExportService';
import { asyncHandler } from '@shared/utils/asyncHandler';

// Import shared repository instances from other routes
import { __testOnlyAutomations__ } from './automations.routes';
import { __testOnlyAgents__ } from './agents.routes';
import { __testOnlyTools__ } from './tools.routes';
import { __testOnlyMCPs__ } from './mcps.routes';

const importExportRoutes = Router();

// Use shared repository instances for consistency
const automationRepository = __testOnlyAutomations__.getRepository();
const agentRepository = __testOnlyAgents__.getRepository();
const toolRepository = __testOnlyTools__.getRepository();
const mcpRepository = __testOnlyMCPs__.getRepository();

// Service and Controller
const importExportService = new ImportExportService(
  automationRepository,
  agentRepository,
  toolRepository,
  mcpRepository
);
const importExportController = new ImportExportController(importExportService);

// Export for testing purposes
export const __testOnlyImportExport__ = {
  clearRepositories: () => {
    __testOnlyAutomations__.clearRepository();
    __testOnlyAgents__.clearRepository();
    __testOnlyTools__.clearRepository();
    if (__testOnlyMCPs__.clearRepository) {
      __testOnlyMCPs__.clearRepository();
    }
  },
  getService: () => importExportService,
};

// Routes
// Note: These routes are mounted under /api/automations/import and /api/automations/export
importExportRoutes.post(
  '/validate',
  asyncHandler((req, res) => importExportController.validateImport(req, res))
);

importExportRoutes.post(
  '/',
  asyncHandler((req, res) => importExportController.importAutomation(req, res))
);

importExportRoutes.get(
  '/all',
  asyncHandler((req, res) => importExportController.exportAll(req, res))
);

importExportRoutes.get(
  '/:id',
  asyncHandler((req, res) => importExportController.exportAutomation(req, res))
);

export { importExportRoutes };
