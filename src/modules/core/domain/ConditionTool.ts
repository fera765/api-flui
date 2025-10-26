import { Condition, ConditionProps, ConditionResponse } from './Condition';

export interface ConditionToolProps {
  id: string;
  name: string;
  description?: string;
  type: 'atoom';
  conditions: Condition[];
}

export interface ConditionToolResponse {
  id: string;
  name: string;
  description?: string;
  type: 'atoom';
  conditions: ConditionResponse[];
}

export interface ConditionEvaluationResult {
  satisfied: boolean;
  conditionId?: string;
  conditionName?: string;
  linkedNodes: string[];
}

/**
 * ConditionTool Entity
 * Represents a conditional routing node in an automation
 * Routes execution to different nodes based on condition evaluation
 */
export class ConditionTool {
  private readonly id: string;
  private name: string;
  private description?: string;
  private readonly type: 'atoom';
  private conditions: Condition[];

  constructor(props: ConditionToolProps) {
    this.validateProps(props);
    
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.type = 'atoom';
    this.conditions = props.conditions || [];
  }

  private validateProps(props: ConditionToolProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('ConditionTool ID is required');
    }

    if (!props.name || props.name.trim() === '') {
      throw new Error('ConditionTool name is required');
    }

    if (props.type !== 'atoom') {
      throw new Error('ConditionTool type must be "atoom"');
    }

    if (!Array.isArray(props.conditions)) {
      throw new Error('Conditions must be an array');
    }
  }

  /**
   * Evaluates all conditions and returns the first satisfied one
   */
  public evaluateConditions(input: any): ConditionEvaluationResult {
    for (const condition of this.conditions) {
      if (condition.evaluate(input)) {
        return {
          satisfied: true,
          conditionId: condition.getId(),
          conditionName: condition.getName(),
          linkedNodes: condition.getLinkedNodes(),
        };
      }
    }

    return {
      satisfied: false,
      linkedNodes: [],
    };
  }

  /**
   * Evaluates all conditions and returns all satisfied ones
   */
  public evaluateAllConditions(input: any): ConditionEvaluationResult[] {
    const results: ConditionEvaluationResult[] = [];

    for (const condition of this.conditions) {
      if (condition.evaluate(input)) {
        results.push({
          satisfied: true,
          conditionId: condition.getId(),
          conditionName: condition.getName(),
          linkedNodes: condition.getLinkedNodes(),
        });
      }
    }

    return results;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getType(): 'atoom' {
    return this.type;
  }

  public getConditions(): Condition[] {
    return [...this.conditions];
  }

  public getConditionById(conditionId: string): Condition | undefined {
    return this.conditions.find(c => c.getId() === conditionId);
  }

  public updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('ConditionTool name cannot be empty');
    }
    this.name = name;
  }

  public updateDescription(description: string | undefined): void {
    this.description = description;
  }

  public addCondition(condition: Condition): void {
    // Check if condition with same ID already exists
    const exists = this.conditions.some(c => c.getId() === condition.getId());
    if (exists) {
      throw new Error(`Condition with ID ${condition.getId()} already exists`);
    }
    this.conditions.push(condition);
  }

  public updateCondition(conditionId: string, updates: Partial<ConditionProps>): void {
    const condition = this.getConditionById(conditionId);
    if (!condition) {
      throw new Error(`Condition with ID ${conditionId} not found`);
    }

    if (updates.name !== undefined) {
      condition.updateName(updates.name);
    }

    if (updates.predicate !== undefined) {
      condition.updatePredicate(updates.predicate);
    }

    if (updates.linkedNodes !== undefined) {
      condition.setLinkedNodes(updates.linkedNodes);
    }
  }

  public removeCondition(conditionId: string): void {
    const index = this.conditions.findIndex(c => c.getId() === conditionId);
    if (index === -1) {
      throw new Error(`Condition with ID ${conditionId} not found`);
    }
    this.conditions.splice(index, 1);
  }

  public toJSON(): ConditionToolResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      conditions: this.conditions.map(c => c.toJSON()),
    };
  }

  public static create(props: Omit<ConditionToolProps, 'id' | 'type'>): ConditionTool {
    const id = Math.random().toString(36).substring(2, 15);
    return new ConditionTool({
      ...props,
      id,
      type: 'atoom',
    });
  }
}
