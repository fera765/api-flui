import { Router } from 'express';
import { AutomationWebhookController } from '../controllers/AutomationWebhookController';
import { AutomationWebhookService } from '../services/AutomationWebhookService';
import { automationRepository, systemToolRepository } from '@shared/repositories/singletons';
import { asyncHandler } from '@shared/utils/asyncHandler';

const automationWebhooksRoutes = Router();

// Services and Controllers
const webhookService = new AutomationWebhookService(
  automationRepository,
  systemToolRepository,
  process.env.API_BASE_URL || 'http://localhost:3000'
);
const webhookController = new AutomationWebhookController(webhookService);

// Routes
// Create webhook for automation
automationWebhooksRoutes.post(
  '/:automationId/webhooks',
  asyncHandler((req, res) => webhookController.createWebhook(req, res))
);

// Get webhook details by tool ID
automationWebhooksRoutes.get(
  '/webhooks/:toolId',
  asyncHandler((req, res) => webhookController.getWebhook(req, res))
);

// Update webhook configuration
automationWebhooksRoutes.patch(
  '/webhooks/:toolId',
  asyncHandler((req, res) => webhookController.updateWebhook(req, res))
);

// Delete webhook
automationWebhooksRoutes.delete(
  '/webhooks/:toolId',
  asyncHandler((req, res) => webhookController.deleteWebhook(req, res))
);

export { automationWebhooksRoutes };
