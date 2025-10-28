import { apiClient } from '@/lib/api';

export enum NodeType {
  TRIGGER = 'trigger',
  AGENT = 'agent',
  TOOL = 'tool',
  CONDITION = 'condition',
}

export enum AutomationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export interface NodeData {
  id: string;
  type: NodeType;
  referenceId: string;
  config?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  position?: { x: number; y: number }; // ✅ FEATURE 2: Salvar posição
}

export interface LinkData {
  fromNodeId: string;
  fromOutputKey: string;
  toNodeId: string;
  toInputKey: string;
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  nodes: NodeData[];
  links: LinkData[];
  status: AutomationStatus;
}

export interface CreateAutomationPayload {
  name: string;
  description?: string;
  nodes: NodeData[];
  links: LinkData[];
}

export interface UpdateAutomationPayload {
  name?: string;
  description?: string;
  nodes?: NodeData[];
  links?: LinkData[];
}

export interface ExecuteAutomationResult {
  automationId: string;
  executedNodes: Record<string, any>;
  errors: Record<string, string>;
}

/**
 * Get all automations
 */
export const getAllAutomations = async (): Promise<Automation[]> => {
  const response = await apiClient.get('/api/automations');
  return response.data;
};

/**
 * Get automation by ID
 */
export const getAutomationById = async (id: string): Promise<Automation> => {
  const response = await apiClient.get(`/api/automations/${id}`);
  return response.data;
};

/**
 * Create new automation
 */
export const createAutomation = async (payload: CreateAutomationPayload): Promise<Automation> => {
  const response = await apiClient.post('/api/automations', payload);
  return response.data;
};

/**
 * Update automation
 */
export const updateAutomation = async (
  id: string,
  payload: UpdateAutomationPayload
): Promise<Automation> => {
  const response = await apiClient.patch(`/api/automations/${id}`, payload);
  return response.data;
};

/**
 * Delete automation
 */
export const deleteAutomation = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/automations/${id}`);
};

/**
 * Execute automation
 */
export const executeAutomation = async (
  id: string,
  input?: Record<string, unknown>
): Promise<ExecuteAutomationResult> => {
  const response = await apiClient.post(`/api/automations/${id}/execute`, input || {});
  return response.data;
};

/**
 * Export automation
 * ✅ FEATURE 5: Exportação
 */
export const exportAutomation = async (id: string): Promise<Blob> => {
  const response = await apiClient.get(`/api/automations/export/${id}`, {
    responseType: 'blob',
  });
  return response.data;
};
