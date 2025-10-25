import { Router } from 'express';
import { HealthCheckController } from './controllers/HealthCheckController';
import { SystemConfigController } from './controllers/SystemConfigController';
import { ModelsController } from './controllers/ModelsController';
import { SystemConfigService } from './services/SystemConfigService';
import { ModelsService } from './services/ModelsService';
import { SystemConfigRepositoryInMemory } from './repositories/SystemConfigRepositoryInMemory';
import { asyncHandler } from '@shared/utils/asyncHandler';

const coreRoutes = Router();

// Singleton repository instance
const configRepository = new SystemConfigRepositoryInMemory();

// Export for testing purposes
export const __testOnly__ = {
  clearRepository: () => configRepository.clear(),
};

// Controllers
const healthCheckController = new HealthCheckController();
const systemConfigService = new SystemConfigService(configRepository);
const systemConfigController = new SystemConfigController(systemConfigService);
const modelsService = new ModelsService(configRepository);
const modelsController = new ModelsController(modelsService);

// Health Check
coreRoutes.get('/', (req, res) => healthCheckController.handle(req, res));

// System Configuration
coreRoutes.get('/api/setting', asyncHandler((req, res) => systemConfigController.getConfig(req, res)));
coreRoutes.post('/api/setting', asyncHandler((req, res) => systemConfigController.createConfig(req, res)));
coreRoutes.patch('/api/setting', asyncHandler((req, res) => systemConfigController.updateConfig(req, res)));

// Models
coreRoutes.get('/api/models', asyncHandler((req, res) => modelsController.getModels(req, res)));

export { coreRoutes };
