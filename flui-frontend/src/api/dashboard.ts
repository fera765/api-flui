import { apiClient } from '@/lib/api';

export interface DashboardStats {
  agents: {
    total: number;
  };
  mcps: {
    total: number;
    connected: number;
  };
  automations: {
    total: number;
  };
  tools: {
    system: number;
    mcp: number;
    agent: number;
    total: number;
  };
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get('/api/dashboard/stats');
  return response.data;
};
