import { apiClient } from '@/lib/api';

export enum Operator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
}

export interface Predicate {
  field: string;
  operator: Operator;
  value: any;
}

export interface Condition {
  id: string;
  name: string;
  predicate: string | Predicate; // API retorna string, mas também aceita objeto
  linkedNodes: string[];
}

export interface ConditionTool {
  id: string;
  name: string;
  description?: string;
  type: 'atoom';
  conditions: Condition[];
}

export interface CreateConditionToolPayload {
  name: string;
  description?: string;
  conditions: Omit<Condition, 'id'>[];
}

export interface UpdateConditionToolPayload {
  name?: string;
  description?: string;
  conditions?: Condition[];
}

export interface EvaluateConditionPayload {
  input: Record<string, any>;
}

export interface EvaluateConditionResult {
  satisfied: boolean;
  conditionId?: string;
  conditionName?: string;
  linkedNodes: string[];
}

/**
 * Get all condition tools
 */
export const getAllConditionTools = async (): Promise<ConditionTool[]> => {
  const response = await apiClient.get('/api/tools/condition');
  return response.data;
};

/**
 * Get condition tool by ID
 */
export const getConditionToolById = async (id: string): Promise<ConditionTool> => {
  const response = await apiClient.get(`/api/tools/condition/${id}`);
  return response.data;
};

/**
 * Create new condition tool
 */
export const createConditionTool = async (
  payload: CreateConditionToolPayload
): Promise<ConditionTool> => {
  const response = await apiClient.post('/api/tools/condition', payload);
  return response.data;
};

/**
 * Update condition tool
 */
export const updateConditionTool = async (
  id: string,
  payload: UpdateConditionToolPayload
): Promise<ConditionTool> => {
  const response = await apiClient.patch(`/api/tools/condition/${id}`, payload);
  return response.data;
};

/**
 * Delete condition tool
 */
export const deleteConditionTool = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/tools/condition/${id}`);
};

/**
 * Evaluate condition tool
 */
export const evaluateConditionTool = async (
  id: string,
  payload: EvaluateConditionPayload
): Promise<EvaluateConditionResult> => {
  const response = await apiClient.post(`/api/tools/condition/${id}/evaluate`, payload);
  return response.data;
};
