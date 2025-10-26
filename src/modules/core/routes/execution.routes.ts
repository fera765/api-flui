import { Router } from 'express';
import { ExecutionController } from '../controllers/ExecutionController';
import { ExecutionService } from '../services/ExecutionService';
import { AutomationExecutor } from '../services/automation/AutomationExecutor';
import { asyncHandler } from '@shared/utils/asyncHandler';
import { 
  executionLogRepository, 
  automationRepository, 
  systemToolRepository, 
  agentRepository,
  mcpRepository 
} from '@shared/repositories/singletons';

const executionRoutes = Router();

// Use shared singleton instances
const toolRepository = systemToolRepository;

// Services and Controllers - Now with MCP support
const automationExecutor = new AutomationExecutor(
  toolRepository, 
  agentRepository,
  mcpRepository
);
const executionService = new ExecutionService(automationRepository, executionLogRepository, automationExecutor);
const executionController = new ExecutionController(executionService);

// Export for testing purposes
export const __testOnlyExecution__ = {
  clearLogs: () => executionLogRepository.clear(),
  clearAutomations: () => automationRepository.clear(),
  clearTools: () => toolRepository.clear(),
  clearAgents: () => agentRepository.clear(),
  clearMCPs: () => mcpRepository.clear(),
  getAutomationRepository: () => automationRepository,
  getToolRepository: () => toolRepository,
  getMCPRepository: () => mcpRepository,
  getService: () => executionService,
};

// Execution Routes
executionRoutes.post('/:automationId/start', asyncHandler((req, res) => executionController.start(req, res)));
executionRoutes.get('/:automationId/status', asyncHandler((req, res) => executionController.getStatus(req, res)));
executionRoutes.get('/:automationId/logs', asyncHandler((req, res) => executionController.getLogs(req, res)));
executionRoutes.get('/:automationId/events', (req, res) => executionController.streamEvents(req, res));

export { executionRoutes };
