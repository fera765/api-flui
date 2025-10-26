import { Router } from 'express';
import { SystemToolController } from '../controllers/SystemToolController';
import { SystemToolService } from '../services/SystemToolService';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { systemToolRepository } from '@shared/repositories/singletons';

const toolsRoutes = Router();

// Use shared singleton instance
const toolRepository = systemToolRepository;

// Services and Controllers
const toolService = new SystemToolService(toolRepository);
const toolController = new SystemToolController(toolService);

// Export for testing purposes
export const __testOnlyTools__ = {
  clearRepository: () => toolRepository.clear(),
  getRepository: () => toolRepository,
  getService: () => toolService,
};

// Tool CRUD Routes
toolsRoutes.get('/', asyncHandler((req, res) => toolController.getAll(req, res)));
toolsRoutes.get('/:id', asyncHandler((req, res) => toolController.getById(req, res)));
toolsRoutes.post('/', asyncHandler((req, res) => toolController.create(req, res)));
toolsRoutes.delete('/:id', asyncHandler((req, res) => toolController.delete(req, res)));
toolsRoutes.post('/:id/execute', asyncHandler((req, res) => toolController.execute(req, res)));

export { toolsRoutes };

// WebHook Dynamic Routes (separate router)
export const webhookRoutes = Router();
webhookRoutes.get('/:toolId', asyncHandler((req, res) => toolController.executeWebHook(req, res)));
webhookRoutes.post('/:toolId', asyncHandler((req, res) => toolController.executeWebHook(req, res)));
