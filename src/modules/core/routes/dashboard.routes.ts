import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { DashboardService } from '../services/DashboardService';
import { 
  agentRepository, 
  mcpRepository, 
  automationRepository,
  systemToolRepository 
} from '@shared/repositories/singletons';
import { asyncHandler } from '@shared/utils/asyncHandler';

const dashboardRoutes = Router();

// Services and Controllers
const dashboardService = new DashboardService(
  agentRepository,
  mcpRepository,
  automationRepository,
  systemToolRepository
);
const dashboardController = new DashboardController(dashboardService);

// Routes
dashboardRoutes.get('/api/dashboard/stats', asyncHandler((req, res) => dashboardController.getStats(req, res)));

export { dashboardRoutes };
