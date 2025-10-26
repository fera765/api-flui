import { apiClient } from '@/lib/api';

export interface ToolSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface Tool {
  id: string;
  name: string;
  description?: string;
  type?: string;
  inputSchema?: ToolSchema;
  outputSchema?: ToolSchema;
  config?: Record<string, any>;
}

export interface MCPTools {
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

export interface AgentTools {
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
    mcps: MCPTools[];
    agents: AgentTools[];
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
  toolsPaginated: any[];
}

/**
 * Get all tools (System + MCPs + Agents)
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
export const searchTools = async (query: string): Promise<{
  query: string;
  tools: Tool[];
  total: number;
}> => {
  const response = await apiClient.get('/api/all-tools/search', {
    params: { q: query },
  });
  return response.data;
};
