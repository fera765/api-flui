export enum ToolType {
  TRIGGER = 'trigger',
  ACTION = 'action',
}

export interface TriggerManualConfig {
  inputs?: Record<string, unknown>;
}

export interface TriggerWebHookConfig {
  url: string;
  method: 'POST' | 'GET';
  token: string;
  inputs?: Record<string, 'string' | 'number' | 'array' | 'object'>;
  customConfig?: Record<string, unknown>;
}

export interface TriggerCronConfig {
  schedule: string;
  enabled: boolean;
  inputs?: Record<string, unknown>;
}

export type ToolConfig = TriggerManualConfig | TriggerWebHookConfig | TriggerCronConfig | Record<string, unknown>;

export interface ToolExecutor {
  (input: unknown): Promise<unknown>;
}

export interface SystemToolProps {
  id: string;
  name: string;
  description?: string;
  type: ToolType;
  config?: ToolConfig;
  inputSchema?: object;
  outputSchema?: object;
  executor: ToolExecutor;
}

export interface SystemToolResponse {
  id: string;
  name: string;
  description?: string;
  type: ToolType;
  config?: ToolConfig;
  inputSchema?: object;
  outputSchema?: object;
}

export interface CreateSystemToolProps {
  name: string;
  description?: string;
  type: ToolType;
  config?: ToolConfig;
  inputSchema?: object;
  outputSchema?: object;
  executor: ToolExecutor;
}

export class SystemTool {
  private readonly id: string;
  private readonly name: string;
  private description?: string;
  private readonly type: ToolType;
  private config?: ToolConfig;
  private readonly inputSchema?: object;
  private readonly outputSchema?: object;
  private readonly executor: ToolExecutor;

  constructor(props: SystemToolProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.type = props.type;
    this.config = props.config;
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

  public getType(): ToolType {
    return this.type;
  }

  public getConfig(): ToolConfig | undefined {
    return this.config;
  }

  public getInputSchema(): object | undefined {
    return this.inputSchema;
  }

  public getOutputSchema(): object | undefined {
    return this.outputSchema;
  }

  public async execute(input: unknown): Promise<unknown> {
    return this.executor(input);
  }

  public updateConfig(config: ToolConfig): void {
    this.config = config;
  }

  public toJSON(): SystemToolResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.type,
      config: this.config,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
    };
  }
}
