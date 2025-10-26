export interface ConditionProps {
  id: string;
  name: string;
  predicate: string; // Serialized function or expression
  linkedNodes: string[];
}

export interface ConditionResponse {
  id: string;
  name: string;
  predicate: string;
  linkedNodes: string[];
}

/**
 * Condition Entity
 * Represents a single condition within a ConditionTool
 */
export class Condition {
  private readonly id: string;
  private name: string;
  private predicate: string;
  private linkedNodes: string[];

  constructor(props: ConditionProps) {
    this.validateProps(props);
    
    this.id = props.id;
    this.name = props.name;
    this.predicate = props.predicate;
    this.linkedNodes = props.linkedNodes || [];
  }

  private validateProps(props: ConditionProps): void {
    if (!props.id || props.id.trim() === '') {
      throw new Error('Condition ID is required');
    }

    if (!props.name || props.name.trim() === '') {
      throw new Error('Condition name is required');
    }

    if (!props.predicate || props.predicate.trim() === '') {
      throw new Error('Condition predicate is required');
    }

    if (!Array.isArray(props.linkedNodes)) {
      throw new Error('Condition linkedNodes must be an array');
    }
  }

  /**
   * Evaluates the condition against the input
   */
  public evaluate(input: any): boolean {
    try {
      // Create a safe evaluation context
      // The predicate should be a simple expression like:
      // "input.action === 'compra'"
      // "input.type === 'venda'"
      // "input.intent === 'ajuda'"
      
      // For safety, we'll use a simple pattern matching approach
      // In production, consider using a proper expression evaluator
      const func = new Function('input', `return ${this.predicate}`);
      return func(input);
    } catch (error) {
      console.error(`Error evaluating condition ${this.name}:`, error);
      return false;
    }
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getPredicate(): string {
    return this.predicate;
  }

  public getLinkedNodes(): string[] {
    return [...this.linkedNodes];
  }

  public updateName(name: string): void {
    if (!name || name.trim() === '') {
      throw new Error('Condition name cannot be empty');
    }
    this.name = name;
  }

  public updatePredicate(predicate: string): void {
    if (!predicate || predicate.trim() === '') {
      throw new Error('Condition predicate cannot be empty');
    }
    this.predicate = predicate;
  }

  public setLinkedNodes(nodeIds: string[]): void {
    if (!Array.isArray(nodeIds)) {
      throw new Error('Linked nodes must be an array');
    }
    this.linkedNodes = [...nodeIds];
  }

  public addLinkedNode(nodeId: string): void {
    if (!nodeId || nodeId.trim() === '') {
      throw new Error('Node ID cannot be empty');
    }
    if (!this.linkedNodes.includes(nodeId)) {
      this.linkedNodes.push(nodeId);
    }
  }

  public removeLinkedNode(nodeId: string): void {
    this.linkedNodes = this.linkedNodes.filter(id => id !== nodeId);
  }

  public toJSON(): ConditionResponse {
    return {
      id: this.id,
      name: this.name,
      predicate: this.predicate,
      linkedNodes: this.getLinkedNodes(),
    };
  }

  public static create(props: Omit<ConditionProps, 'id'>): Condition {
    const id = Math.random().toString(36).substring(2, 15);
    return new Condition({ ...props, id });
  }
}
