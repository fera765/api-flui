import { apiClient } from '@/lib/api';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema: object;
}

export interface AllToolsResponse {
  tools: Tool[];
  total: number;
  sources: {
    system: number;
    mcp: number;
  };
}

export interface SearchToolsResponse {
  query: string;
  tools: Tool[];
  total: number;
}

/**
 * Get all tools from all sources (SystemTools + MCPs)
 */
export const getAllTools = async (): Promise<AllToolsResponse> => {
  const response = await apiClient.get('/api/all-tools');
  return response.data;
};

/**
 * Search tools by name or description
 */
export const searchTools = async (query: string): Promise<SearchToolsResponse> => {
  const response = await apiClient.get('/api/all-tools/search', {
    params: { q: query },
  });
  return response.data;
};
