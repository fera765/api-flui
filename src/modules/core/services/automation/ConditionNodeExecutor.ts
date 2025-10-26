import { Node } from '../../domain/Automation';
import { IConditionToolRepository } from '../../repositories/IConditionToolRepository';
import { AppError } from '@shared/errors';
import { ConditionEvaluationResult } from '../../domain/ConditionTool';

export interface ConditionNodeResult {
  outputs: Record<string, unknown>;
  satisfiedCondition?: ConditionEvaluationResult;
}

/**
 * ConditionNodeExecutor
 * Handles execution of CONDITION type nodes
 */
export class ConditionNodeExecutor {
  constructor(private readonly conditionToolRepository: IConditionToolRepository) {}

  async execute(node: Node, input: Record<string, unknown>): Promise<ConditionNodeResult> {
    const conditionTool = await this.conditionToolRepository.findById(node.getReferenceId());

    if (!conditionTool) {
      throw new AppError(`ConditionTool not found: ${node.getReferenceId()}`, 404);
    }

    // Evaluate conditions
    const result = conditionTool.evaluateConditions(input);

    if (!result.satisfied) {
      throw new AppError('No condition was satisfied', 400);
    }

    // Return the result with the satisfied condition info
    return {
      outputs: {
        conditionId: result.conditionId,
        conditionName: result.conditionName,
        satisfied: true,
        input,
      },
      satisfiedCondition: result,
    };
  }
}
