import { Tool, ToolResponse } from './Tool';

export interface AgentProps {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools: (Tool | ToolResponse)[];
}

export interface AgentResponse {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools: ToolResponse[];
}

export interface CreateAgentProps {
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools?: (Tool | ToolResponse)[];
}

export interface UpdateAgentProps {
  name?: string;
  description?: string;
  prompt?: string;
  defaultModel?: string;
  tools?: (Tool | ToolResponse)[];
}

export class Agent {
  private readonly id: string;
  private name: string;
  private description?: string;
  private prompt: string;
  private defaultModel?: string;
  private tools: (Tool | ToolResponse)[];

  constructor(props: AgentProps) {
    this.id = props.id;
    this.name = props.name;
    this.description = props.description;
    this.prompt = props.prompt;
    this.defaultModel = props.defaultModel;
    this.tools = props.tools;
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

  public getPrompt(): string {
    return this.prompt;
  }

  public getDefaultModel(): string | undefined {
    return this.defaultModel;
  }

  public getTools(): (Tool | ToolResponse)[] {
    return this.tools;
  }

  public update(props: UpdateAgentProps): void {
    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.description !== undefined) {
      this.description = props.description;
    }
    if (props.prompt !== undefined) {
      this.prompt = props.prompt;
    }
    if (props.defaultModel !== undefined) {
      this.defaultModel = props.defaultModel;
    }
    if (props.tools !== undefined) {
      this.tools = props.tools;
    }
  }

  public toJSON(): AgentResponse {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      prompt: this.prompt,
      defaultModel: this.defaultModel,
      tools: this.tools.map(tool => {
        // Handle both Tool instances and plain ToolResponse objects
        if (typeof tool === 'object' && 'toJSON' in tool && typeof tool.toJSON === 'function') {
          return tool.toJSON();
        }
        // If it's already a plain object (ToolResponse), return as-is
        return tool as ToolResponse;
      }),
    };
  }
}
