import { Request, Response } from 'express';
import { AutomationWebhookService } from '../services/AutomationWebhookService';

export class AutomationWebhookController {
  constructor(private readonly webhookService: AutomationWebhookService) {}

  public async createWebhook(request: Request, response: Response): Promise<Response> {
    const { automationId } = request.params;
    const { method, inputs } = request.body;

    const webhook = await this.webhookService.createWebhookForAutomation(automationId, {
      method,
      inputs,
    });

    return response.status(201).json(webhook);
  }

  public async getWebhook(request: Request, response: Response): Promise<Response> {
    const { toolId } = request.params;

    const webhook = await this.webhookService.getWebhookByToolId(toolId);

    return response.status(200).json(webhook);
  }

  public async updateWebhook(request: Request, response: Response): Promise<Response> {
    const { toolId } = request.params;
    const { method, inputs } = request.body;

    const webhook = await this.webhookService.updateWebhookConfig(toolId, {
      method,
      inputs,
    });

    return response.status(200).json(webhook);
  }

  public async deleteWebhook(request: Request, response: Response): Promise<Response> {
    const { toolId } = request.params;

    await this.webhookService.deleteWebhook(toolId);

    return response.status(204).send();
  }
}
