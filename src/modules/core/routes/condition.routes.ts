import { Router } from 'express';
import { ConditionToolController } from '../controllers/ConditionToolController';
import { ConditionToolService } from '../services/ConditionToolService';
import { ConditionToolRepositoryInMemory } from '../repositories/ConditionToolRepositoryInMemory';
import { asyncHandler } from '@shared/utils/asyncHandler';

const conditionRoutes = Router();

// Singleton repository instance
const conditionToolRepository = new ConditionToolRepositoryInMemory();

// Services and Controllers
const conditionToolService = new ConditionToolService(conditionToolRepository);
const conditionToolController = new ConditionToolController(conditionToolService);

// Export for testing purposes
export const __testOnlyConditions__ = {
  clearRepository: () => conditionToolRepository.clear(),
  getRepository: () => conditionToolRepository,
  getService: () => conditionToolService,
};

// Routes
conditionRoutes.get('/', asyncHandler((req, res) => conditionToolController.getAll(req, res)));
conditionRoutes.get('/:id', asyncHandler((req, res) => conditionToolController.getById(req, res)));
conditionRoutes.post('/', asyncHandler((req, res) => conditionToolController.create(req, res)));
conditionRoutes.patch('/:id', asyncHandler((req, res) => conditionToolController.update(req, res)));
conditionRoutes.delete('/:id', asyncHandler((req, res) => conditionToolController.delete(req, res)));
conditionRoutes.post('/:id/evaluate', asyncHandler((req, res) => conditionToolController.evaluate(req, res)));

export { conditionRoutes };
