import { apiClient } from '@/lib/api';

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

/**
 * Create a unique webhook for an automation
 */
export const createWebhookForAutomation = async (
  automationId: string,
  payload: CreateWebhookPayload = {}
): Promise<WebhookResponse> => {
  const response = await apiClient.post(`/api/automations/${automationId}/webhooks`, payload);
  return response.data;
};

/**
 * Get webhook details by tool ID
 */
export const getWebhookByToolId = async (toolId: string): Promise<WebhookResponse> => {
  const response = await apiClient.get(`/api/automations/webhooks/${toolId}`);
  return response.data;
};

/**
 * Update webhook configuration
 */
export const updateWebhookConfig = async (
  toolId: string,
  payload: CreateWebhookPayload
): Promise<WebhookResponse> => {
  const response = await apiClient.patch(`/api/automations/webhooks/${toolId}`, payload);
  return response.data;
};

/**
 * Delete webhook
 */
export const deleteWebhook = async (toolId: string): Promise<void> => {
  await apiClient.delete(`/api/automations/webhooks/${toolId}`);
};
