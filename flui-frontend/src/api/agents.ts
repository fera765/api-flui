import { apiClient } from '@/lib/api';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools: Tool[];
}

export interface CreateAgentPayload {
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools?: Tool[];
}

export interface UpdateAgentPayload {
  name?: string;
  description?: string;
  prompt?: string;
  defaultModel?: string;
  tools?: Tool[];
}

/**
 * Get all agents
 */
export const getAllAgents = async (): Promise<Agent[]> => {
  const response = await apiClient.get('/api/agents');
  return response.data;
};

/**
 * Get agent by ID
 */
export const getAgentById = async (id: string): Promise<Agent> => {
  const response = await apiClient.get(`/api/agents/${id}`);
  return response.data;
};

/**
 * Create new agent
 */
export const createAgent = async (payload: CreateAgentPayload): Promise<Agent> => {
  const response = await apiClient.post('/api/agents', payload);
  return response.data;
};

/**
 * Update agent
 */
export const updateAgent = async (id: string, payload: UpdateAgentPayload): Promise<Agent> => {
  const response = await apiClient.patch(`/api/agents/${id}`, payload);
  return response.data;
};

/**
 * Delete agent
 */
export const deleteAgent = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/agents/${id}`);
};
