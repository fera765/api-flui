export interface ToolExecutor {
  (input: unknown): Promise<unknown>;
}

export interface ToolProps {
  id: string;
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema: object;
  executor: ToolExecutor;
}

export interface ToolResponse {
  id: string;
  name: string;
  description?: string;
  inputSchema: object;
  outputSchema: object;
}

export class Tool {
  private readonly id: string;
  private readonly name: string;
  private readonly description?: string;
  private readonly inputSchema: object;
  private readonly outputSchema: object;
  private readonly executor: ToolExecutor;

  constructor(props: ToolProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.inputSchema = props.inputSchema;
    this.outputSchema = props.outputSchema;
    this.executor = props.executor;
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

  public getInputSchema(): object {
    return this.inputSchema;
  }

  public getOutputSchema(): object {
    return this.outputSchema;
  }

  public async execute(input: unknown): Promise<unknown> {
    return this.executor(input);
  }

  public toJSON(): ToolResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
    };
  }
}
