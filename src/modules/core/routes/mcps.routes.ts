import { Router } from 'express';
import { MCPController } from '../controllers/MCPController';
import { MCPService } from '../services/MCPService';
import { MCPRepositoryInMemory } from '../repositories/MCPRepositoryInMemory';
import { asyncHandler } from '@shared/utils/asyncHandler';

const mcpsRoutes = Router();

// Singleton repository instance
const mcpRepository = new MCPRepositoryInMemory();

// Services and Controllers
const mcpService = new MCPService(mcpRepository);
const mcpController = new MCPController(mcpService);

// Export for testing purposes
export const __testOnlyMCPs__ = {
  clearRepository: () => mcpRepository.clear(),
  cleanupSandboxes: async () => await mcpService.cleanup(),
};

// Routes
mcpsRoutes.get('/', asyncHandler((req, res) => mcpController.getAll(req, res)));
mcpsRoutes.post('/import', asyncHandler((req, res) => mcpController.import(req, res)));
mcpsRoutes.get('/:id/tools', asyncHandler((req, res) => mcpController.getTools(req, res)));
mcpsRoutes.delete('/:id', asyncHandler((req, res) => mcpController.delete(req, res)));

export { mcpsRoutes };
