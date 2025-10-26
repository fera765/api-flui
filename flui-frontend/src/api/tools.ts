import { apiClient } from '@/lib/api';

export interface Tool {
  id: string;
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema: object;
  source?: 'system' | 'mcp' | 'agent';
  mcpName?: string;
  agentName?: string;
}

export interface MCPToolsGroup {
  mcp: {
    id: string;
    name: string;
    source: string;
    sourceType: string;
    description?: string;
  };
  tools: Tool[];
  toolsCount: number;
}

export interface AgentToolsGroup {
  agent: {
    id: string;
    name: string;
    description?: string;
    defaultModel?: string;
  };
  tools: Tool[];
  toolsCount: number;
}

export interface AllToolsResponse {
  tools: {
    system: Tool[];
    mcps: MCPToolsGroup[];
    agents: AgentToolsGroup[];
  };
  summary: {
    systemTools: number;
    mcpTools: number;
    agentTools: number;
    totalTools: number;
    mcpsCount: number;
    agentsCount: number;
  };
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  filters: {
    category: string;
    mcpId: string | null;
    agentId: string | null;
  };
  toolsPaginated: Tool[];
}

export interface SearchToolsResponse {
  query: string;
  tools: Tool[];
  total: number;
}

/**
 * Get all tools from all sources (SystemTools + MCPs + Agents)
 */
export const getAllTools = async (params?: {
  page?: number;
  pageSize?: number;
  category?: 'system' | 'mcp' | 'agent' | 'all';
  mcpId?: string;
  agentId?: string;
}): Promise<AllToolsResponse> => {
  const response = await apiClient.get('/api/all-tools', { params });
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
