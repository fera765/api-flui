import { AppError } from '@shared/errors';
import { ISystemToolRepository } from '../repositories/ISystemToolRepository';
import { IAutomationRepository } from '../repositories/IAutomationRepository';
import { createWebHookTriggerTool } from '../tools/triggers/WebHookTriggerTool';
import { TriggerWebHookConfig } from '../domain/SystemTool';

export interface WebhookResponse {
  id: string;
  url: string;
  token: string;
  method: 'POST' | 'GET';
  inputs?: Record<string, 'string' | 'number' | 'array' | 'object'>;
}

export interface CreateWebhookPayload {
  method?: 'POST' | 'GET';
  inputs?: Record<string, 'string' | 'number' | 'array' | 'object'>;
}

export interface IAutomationWebhookService {
  createWebhookForAutomation(automationId: string, payload: CreateWebhookPayload): Promise<WebhookResponse>;
  getWebhookByToolId(toolId: string): Promise<WebhookResponse>;
  deleteWebhook(toolId: string): Promise<void>;
  updateWebhookConfig(toolId: string, payload: CreateWebhookPayload): Promise<WebhookResponse>;
}

export class AutomationWebhookService implements IAutomationWebhookService {
  constructor(
    private readonly automationRepository: IAutomationRepository,
    private readonly systemToolRepository: ISystemToolRepository,
    private readonly baseURL: string = process.env.API_BASE_URL || 'http://localhost:3000'
  ) {}

  public async createWebhookForAutomation(
    automationId: string,
    payload: CreateWebhookPayload
  ): Promise<WebhookResponse> {
    // Verify automation exists
    const automation = await this.automationRepository.findById(automationId);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    // Create webhook tool with unique ID
    const method = payload.method || 'POST';
    const inputs = payload.inputs || {};
    
    const webhookTool = createWebHookTriggerTool(method, inputs, undefined, this.baseURL);

    // Save to repository
    const savedTool = await this.systemToolRepository.create({
      name: webhookTool.getName(),
      description: webhookTool.getDescription(),
      type: webhookTool.getType(),
      config: webhookTool.getConfig(),
      inputSchema: webhookTool.getInputSchema(),
      outputSchema: webhookTool.getOutputSchema(),
      executor: webhookTool.execute.bind(webhookTool),
    });

    const config = savedTool.getConfig() as TriggerWebHookConfig;

    return {
      id: savedTool.getId(),
      url: config.url,
      token: config.token,
      method: config.method,
      inputs: config.inputs,
    };
  }

  public async getWebhookByToolId(toolId: string): Promise<WebhookResponse> {
    const tool = await this.systemToolRepository.findById(toolId);

    if (!tool) {
      throw new AppError('Webhook not found', 404);
    }

    if (tool.getName() !== 'WebHookTrigger') {
      throw new AppError('Tool is not a webhook trigger', 400);
    }

    const config = tool.getConfig() as TriggerWebHookConfig;

    return {
      id: tool.getId(),
      url: config.url,
      token: config.token,
      method: config.method,
      inputs: config.inputs,
    };
  }

  public async updateWebhookConfig(
    toolId: string,
    payload: CreateWebhookPayload
  ): Promise<WebhookResponse> {
    const tool = await this.systemToolRepository.findById(toolId);

    if (!tool) {
      throw new AppError('Webhook not found', 404);
    }

    if (tool.getName() !== 'WebHookTrigger') {
      throw new AppError('Tool is not a webhook trigger', 400);
    }

    const currentConfig = tool.getConfig() as TriggerWebHookConfig;

    // Update only method and inputs (url and token remain the same)
    const updatedConfig: TriggerWebHookConfig = {
      ...currentConfig,
      method: payload.method || currentConfig.method,
      inputs: payload.inputs !== undefined ? payload.inputs : currentConfig.inputs,
    };

    tool.updateConfig(updatedConfig);

    // Note: SystemTool repository doesn't have update method
    // Tool config is updated in memory, next execution will use new config

    return {
      id: tool.getId(),
      url: updatedConfig.url,
      token: updatedConfig.token,
      method: updatedConfig.method,
      inputs: updatedConfig.inputs,
    };
  }

  public async deleteWebhook(toolId: string): Promise<void> {
    const tool = await this.systemToolRepository.findById(toolId);

    if (!tool) {
      throw new AppError('Webhook not found', 404);
    }

    if (tool.getName() !== 'WebHookTrigger') {
      throw new AppError('Tool is not a webhook trigger', 400);
    }

    try {
      await this.systemToolRepository.delete(toolId);
    } catch (error) {
      if (error instanceof Error && error.message === 'Tool not found') {
        throw new AppError('Webhook not found', 404);
      }
      throw error;
    }
  }
}
