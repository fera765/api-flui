import { apiClient } from '@/lib/api';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema: object;
}

export interface MCP {
  id: string;
  name: string;
  source: string;
  sourceType: 'npx' | 'url';
  description?: string;
  tools: Tool[];
  env?: Record<string, string>;
}

export interface CreateMCPRequest {
  name: string;
  source: string;
  description?: string;
  env?: Record<string, string>;
}

export interface ImportMCPResponse {
  mcp: MCP;
  toolsExtracted: number;
}

/**
 * Get all MCPs
 */
export const getAllMCPs = async (): Promise<MCP[]> => {
  const response = await apiClient.get('/api/mcps');
  return response.data;
};

/**
 * Import new MCP
 */
export const importMCP = async (data: CreateMCPRequest): Promise<ImportMCPResponse> => {
  const response = await apiClient.post('/api/mcps/import', data);
  return response.data;
};

/**
 * Get tools from specific MCP
 */
export const getMCPTools = async (id: string): Promise<Tool[]> => {
  const response = await apiClient.get(`/api/mcps/${id}/tools`);
  return response.data;
};

/**
 * Delete MCP
 */
export const deleteMCP = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/mcps/${id}`);
};
