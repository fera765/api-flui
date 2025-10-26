/**
 * Tools Routes
 * Rotas para TOR (Tool Onboarding Registry)
 */

import { Router } from 'express';
import multer from 'multer';
import { ToolImportController } from './controllers/ToolImportController';
import { ToolImportService } from './services/ToolImportService';
import { ToolRepositoryInMemory } from './repositories/ToolRepositoryInMemory';
import { SandboxManager } from './infra/sandbox/SandboxManager';
import { asyncHandler } from '@shared/utils/asyncHandler';
import * as os from 'os';
import * as path from 'path';

const toolsRoutes = Router();

// Setup multer para upload de arquivos
const upload = multer({
  dest: path.join(os.tmpdir(), 'tool-uploads'),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are allowed'));
    }
  },
});

// Singleton instances
const toolRepository = new ToolRepositoryInMemory();
const sandboxManager = new SandboxManager();
const importService = new ToolImportService(toolRepository, sandboxManager);
const importController = new ToolImportController(importService);

// Export for testing
export const __testOnlyTools__ = {
  clearRepository: () => toolRepository.clear(),
  getRepository: () => toolRepository,
  getSandboxManager: () => sandboxManager,
  getService: () => importService,
};

// Routes
toolsRoutes.post(
  '/import',
  upload.single('file'),
  asyncHandler((req, res) => importController.import(req, res))
);

toolsRoutes.get(
  '/',
  asyncHandler((req, res) => importController.listAll(req, res))
);

toolsRoutes.get(
  '/versions/:name',
  asyncHandler((req, res) => importController.listVersions(req, res))
);

toolsRoutes.get(
  '/:id',
  asyncHandler((req, res) => importController.getById(req, res))
);

toolsRoutes.delete(
  '/:id',
  asyncHandler((req, res) => importController.delete(req, res))
);

export { toolsRoutes };
