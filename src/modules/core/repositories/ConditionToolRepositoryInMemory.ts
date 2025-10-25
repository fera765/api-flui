import { ConditionTool } from '../domain/ConditionTool';
import { IConditionToolRepository } from './IConditionToolRepository';

export class ConditionToolRepositoryInMemory implements IConditionToolRepository {
  private conditionTools: Map<string, ConditionTool> = new Map();

  async create(conditionTool: ConditionTool): Promise<ConditionTool> {
    this.conditionTools.set(conditionTool.getId(), conditionTool);
    return conditionTool;
  }

  async findById(id: string): Promise<ConditionTool | null> {
    const conditionTool = this.conditionTools.get(id);
    return conditionTool || null;
  }

  async findAll(): Promise<ConditionTool[]> {
    return Array.from(this.conditionTools.values());
  }

  async update(conditionTool: ConditionTool): Promise<ConditionTool> {
    if (!this.conditionTools.has(conditionTool.getId())) {
      throw new Error('ConditionTool not found');
    }
    this.conditionTools.set(conditionTool.getId(), conditionTool);
    return conditionTool;
  }

  async delete(id: string): Promise<void> {
    if (!this.conditionTools.has(id)) {
      throw new Error('ConditionTool not found');
    }
    this.conditionTools.delete(id);
  }

  clear(): void {
    this.conditionTools.clear();
  }
}
