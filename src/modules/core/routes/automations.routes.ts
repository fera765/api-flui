import { Router } from 'express';
import { AutomationController } from '../controllers/AutomationController';
import { AutomationService } from '../services/AutomationService';
import { AutomationExecutor } from '../services/automation/AutomationExecutor';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { 
  automationRepository, 
  systemToolRepository, 
  agentRepository,
  mcpRepository 
} from '@shared/repositories/singletons';

const automationsRoutes = Router();

// Use shared singleton instances
const toolRepository = systemToolRepository;

// Services and Controllers - Now with MCP support
const automationExecutor = new AutomationExecutor(
  toolRepository, 
  agentRepository,
  mcpRepository
);
const automationService = new AutomationService(automationRepository, automationExecutor);
const automationController = new AutomationController(automationService);

// Export for testing purposes
export const __testOnlyAutomations__ = {
  clearRepository: () => automationRepository.clear(),
  clearToolRepository: () => toolRepository.clear(),
  clearAgentRepository: () => agentRepository.clear(),
  clearMCPRepository: () => mcpRepository.clear(),
  getRepository: () => automationRepository,
  getToolRepository: () => toolRepository,
  getAgentRepository: () => agentRepository,
  getMCPRepository: () => mcpRepository,
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
