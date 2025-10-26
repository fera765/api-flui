import { apiClient } from '@/lib/api';

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
  modalities?: {
    input: string[];
  };
}

export interface SystemConfig {
  endpoint: string;
  apiKey?: string;
  model: string;
}

/**
 * Normalize endpoint URL (remove trailing slash)
 */
export const normalizeEndpoint = (endpoint: string): string => {
  return endpoint.trim().replace(/\/$/, '');
};

/**
 * Fetch models from LLM endpoint
 */
export const fetchModelsFromEndpoint = async (
  endpoint: string,
  apiKey?: string
): Promise<Model[]> => {
  const normalizedEndpoint = normalizeEndpoint(endpoint);
  const url = `${normalizedEndpoint}/models`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle both array response and object with data property
    if (Array.isArray(data)) {
      return data;
    } else if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
};

/**
 * Get models from backend API
 */
export const getModels = async (): Promise<Model[]> => {
  try {
    const response = await apiClient.get('/api/models');
    const data = response.data;
    
    // Handle both array response and object with models property
    if (Array.isArray(data)) {
      return data;
    } else if (data.models && Array.isArray(data.models)) {
      return data.models;
    }
    
    return [];
  } catch (error: any) {
    console.error('Error fetching models from API:', error);
    // If backend API fails, return empty array
    return [];
  }
};

/**
 * Get system config from backend
 */
export const getSystemConfig = async (): Promise<SystemConfig | null> => {
  try {
    const response = await apiClient.get('/api/setting');
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Create system config
 */
export const createSystemConfig = async (
  config: SystemConfig
): Promise<SystemConfig> => {
  const response = await apiClient.post('/api/setting', {
    endpoint: normalizeEndpoint(config.endpoint),
    apiKey: config.apiKey,
    model: config.model,
  });
  return response.data;
};

/**
 * Update system config
 */
export const updateSystemConfig = async (
  config: Partial<SystemConfig>
): Promise<SystemConfig> => {
  const normalizedConfig = {
    ...config,
    ...(config.endpoint ? { endpoint: normalizeEndpoint(config.endpoint) } : {}),
  };
  
  const response = await apiClient.patch('/api/setting', normalizedConfig);
  return response.data;
};
