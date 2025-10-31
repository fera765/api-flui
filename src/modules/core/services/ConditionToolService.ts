import { ConditionTool, ConditionToolResponse, ConditionEvaluationResult } from '../domain/ConditionTool';
import { Condition } from '../domain/Condition';
import { IConditionToolRepository } from '../repositories/IConditionToolRepository';
import { AppError } from '@shared/errors';

export interface CreateConditionToolDTO {
  name: string;
  description?: string;
  conditions: Array<{
    name: string;
    predicate: string;
    linkedNodes: string[];
  }>;
}

export interface UpdateConditionToolDTO {
  name?: string;
  description?: string;
  conditions?: Array<{
    id?: string;
    name: string;
    predicate: string;
    linkedNodes: string[];
  }>;
}

export interface EvaluateConditionDTO {
  input: Record<string, unknown>;
  evaluateAll?: boolean; // If true, returns all satisfied conditions
}

export class ConditionToolService {
  constructor(private conditionToolRepository: IConditionToolRepository) {}

  async createConditionTool(data: CreateConditionToolDTO): Promise<ConditionToolResponse> {
    // Validate input
    if (!data.name || data.name.trim() === '') {
      throw new AppError('ConditionTool name is required', 400);
    }

    if (!data.conditions || !Array.isArray(data.conditions) || data.conditions.length === 0) {
      throw new AppError('At least one condition is required', 400);
    }

    // Validate conditions
    for (const conditionData of data.conditions) {
      if (!conditionData.name || conditionData.name.trim() === '') {
        throw new AppError('Condition name is required', 400);
      }

      if (!conditionData.predicate || conditionData.predicate.trim() === '') {
        throw new AppError('Condition predicate is required', 400);
      }

      if (!Array.isArray(conditionData.linkedNodes)) {
        throw new AppError('Condition linkedNodes must be an array', 400);
      }
    }

    // Create conditions
    const conditions: Condition[] = data.conditions.map(conditionData => {
      return Condition.create({
        name: conditionData.name,
        predicate: conditionData.predicate,
        linkedNodes: conditionData.linkedNodes,
      });
    });

    // Create ConditionTool
    const conditionTool = ConditionTool.create({
      name: data.name,
      description: data.description,
      conditions,
    });

    await this.conditionToolRepository.create(conditionTool);

    return conditionTool.toJSON();
  }

  async getConditionToolById(id: string): Promise<ConditionToolResponse> {
    const conditionTool = await this.conditionToolRepository.findById(id);

    if (!conditionTool) {
      throw new AppError('ConditionTool not found', 404);
    }

    return conditionTool.toJSON();
  }

  async getAllConditionTools(): Promise<ConditionToolResponse[]> {
    const conditionTools = await this.conditionToolRepository.findAll();
    return conditionTools.map(ct => ct.toJSON());
  }

  async updateConditionTool(id: string, data: UpdateConditionToolDTO): Promise<ConditionToolResponse> {
    const conditionTool = await this.conditionToolRepository.findById(id);

    if (!conditionTool) {
      throw new AppError('ConditionTool not found', 404);
    }

    // Update basic properties
    if (data.name !== undefined) {
      if (data.name.trim() === '') {
        throw new AppError('ConditionTool name cannot be empty', 400);
      }
      conditionTool.updateName(data.name);
    }

    if (data.description !== undefined) {
      conditionTool.updateDescription(data.description);
    }

    // Update conditions
    if (data.conditions !== undefined) {
      if (!Array.isArray(data.conditions)) {
        throw new AppError('Conditions must be an array', 400);
      }

      // For simplicity, we'll replace all conditions
      // Remove all existing conditions
      const existingConditions = conditionTool.getConditions();
      for (const condition of existingConditions) {
        conditionTool.removeCondition(condition.getId());
      }

      // Add new conditions
      for (const conditionData of data.conditions) {
        if (!conditionData.name || conditionData.name.trim() === '') {
          throw new AppError('Condition name is required', 400);
        }

        if (!conditionData.predicate || conditionData.predicate.trim() === '') {
          throw new AppError('Condition predicate is required', 400);
        }

        if (!Array.isArray(conditionData.linkedNodes)) {
          throw new AppError('Condition linkedNodes must be an array', 400);
        }

        const condition = conditionData.id
          ? new Condition({
              id: conditionData.id,
              name: conditionData.name,
              predicate: conditionData.predicate,
              linkedNodes: conditionData.linkedNodes,
            })
          : Condition.create({
              name: conditionData.name,
              predicate: conditionData.predicate,
              linkedNodes: conditionData.linkedNodes,
            });

        conditionTool.addCondition(condition);
      }
    }

    await this.conditionToolRepository.update(conditionTool);

    return conditionTool.toJSON();
  }

  async deleteConditionTool(id: string): Promise<void> {
    const conditionTool = await this.conditionToolRepository.findById(id);

    if (!conditionTool) {
      throw new AppError('ConditionTool not found', 404);
    }

    await this.conditionToolRepository.delete(id);
  }

  async evaluateCondition(id: string, data: EvaluateConditionDTO): Promise<ConditionEvaluationResult | ConditionEvaluationResult[]> {
    const conditionTool = await this.conditionToolRepository.findById(id);

    if (!conditionTool) {
      throw new AppError('ConditionTool not found', 404);
    }

    if (data.evaluateAll) {
      return conditionTool.evaluateAllConditions(data.input);
    }

    return conditionTool.evaluateConditions(data.input);
  }
}
