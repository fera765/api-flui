import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';
import { AutomationService } from '../services/AutomationService';
import { AutomationRepositoryInMemory } from '../repositories/AutomationRepositoryInMemory';
import { AutomationExecutor } from '../services/automation/AutomationExecutor';
import { SystemToolRepositoryInMemory } from '../repositories/SystemToolRepositoryInMemory';
import { AgentRepositoryInMemory } from '../repositories/AgentRepositoryInMemory';
import { asyncHandler } from '@shared/utils/asyncHandler';

const automationsRoutes = Router();

// Singleton repository instances
const automationRepository = new AutomationRepositoryInMemory();
const toolRepository = new SystemToolRepositoryInMemory();
const agentRepository = new AgentRepositoryInMemory();

// Services and Controllers
const automationExecutor = new AutomationExecutor(toolRepository, agentRepository);
const automationService = new AutomationService(automationRepository, automationExecutor);
const automationController = new AutomationController(automationService);

// Export for testing purposes
export const __testOnlyAutomations__ = {
  clearRepository: () => automationRepository.clear(),
  clearToolRepository: () => toolRepository.clear(),
  clearAgentRepository: () => agentRepository.clear(),
  getRepository: () => automationRepository,
  getToolRepository: () => toolRepository,
  getAgentRepository: () => agentRepository,
  getExecutor: () => automationExecutor,
};

// Automation CRUD Routes
automationsRoutes.get('/', asyncHandler((req, res) => automationController.getAll(req, res)));
automationsRoutes.get('/:id', asyncHandler((req, res) => automationController.getById(req, res)));
automationsRoutes.post('/', asyncHandler((req, res) => automationController.create(req, res)));
automationsRoutes.patch('/:id', asyncHandler((req, res) => automationController.update(req, res)));
automationsRoutes.delete('/:id', asyncHandler((req, res) => automationController.delete(req, res)));

// Execution Route
automationsRoutes.post('/:id/execute', asyncHandler((req, res) => automationController.execute(req, res)));

export { automationsRoutes };
