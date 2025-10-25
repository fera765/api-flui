import { ConditionTool } from '../domain/ConditionTool';

export interface IConditionToolRepository {
  create(conditionTool: ConditionTool): Promise<ConditionTool>;
  findById(id: string): Promise<ConditionTool | null>;
  findAll(): Promise<ConditionTool[]>;
  update(conditionTool: ConditionTool): Promise<ConditionTool>;
  delete(id: string): Promise<void>;
  clear(): void;
}
