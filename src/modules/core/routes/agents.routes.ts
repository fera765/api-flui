import { Router } from 'express';
import { AgentController } from '../controllers/AgentController';
import { AgentService } from '../services/AgentService';
import { AgentRepositoryInMemory } from '../repositories/AgentRepositoryInMemory';
import { asyncHandler } from '@shared/utils/asyncHandler';

const agentsRoutes = Router();

// Singleton repository instance
const agentRepository = new AgentRepositoryInMemory();

// Services and Controllers
const agentService = new AgentService(agentRepository);
const agentController = new AgentController(agentService);

// Export for testing purposes
export const __testOnlyAgents__ = {
  clearRepository: () => agentRepository.clear(),
  getRepository: () => agentRepository,
};

// Routes
agentsRoutes.get('/', asyncHandler((req, res) => agentController.getAll(req, res)));
agentsRoutes.get('/:id', asyncHandler((req, res) => agentController.getById(req, res)));
agentsRoutes.post('/', asyncHandler((req, res) => agentController.create(req, res)));
agentsRoutes.patch('/:id', asyncHandler((req, res) => agentController.update(req, res)));
agentsRoutes.delete('/:id', asyncHandler((req, res) => agentController.delete(req, res)));

export { agentsRoutes };
