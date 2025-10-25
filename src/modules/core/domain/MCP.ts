import { Tool, ToolResponse } from './Tool';

export enum MCPSourceType {
  NPX = 'npx',
  URL = 'url',
}

export interface MCPProps {
  id: string;
  name: string;
  source: string;
  sourceType: MCPSourceType;
  description?: string;
  tools: Tool[];
  env?: Record<string, string>;
}

export interface MCPResponse {
  id: string;
  name: string;
  source: string;
  sourceType: MCPSourceType;
  description?: string;
  tools: ToolResponse[];
  env?: Record<string, string>;
}

export interface CreateMCPProps {
  name: string;
  source: string;
  description?: string;
  env?: Record<string, string>;
}

export interface ImportMCPResult {
  mcp: MCPResponse;
  toolsExtracted: number;
}

export class MCP {
  private readonly id: string;
  private readonly name: string;
  private readonly source: string;
  private readonly sourceType: MCPSourceType;
  private description?: string;
  private tools: Tool[];
  private env?: Record<string, string>;

  constructor(props: MCPProps) {
    this.id = props.id;
    this.name = props.name;
    this.source = props.source;
    this.sourceType = props.sourceType;
    this.description = props.description;
    this.tools = props.tools;
    this.env = props.env;
  }

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getSource(): string {
    return this.source;
  }

  public getSourceType(): MCPSourceType {
    return this.sourceType;
  }

  public getDescription(): string | undefined {
    return this.description;
  }

  public getTools(): Tool[] {
    return this.tools;
  }

  public getEnv(): Record<string, string> | undefined {
    return this.env;
  }

  public addTool(tool: Tool): void {
    this.tools.push(tool);
  }

  public toJSON(): MCPResponse {
    return {
      id: this.id,
      name: this.name,
      source: this.source,
      sourceType: this.sourceType,
      description: this.description,
      tools: this.tools.map(tool => tool.toJSON()),
      env: this.env,
    };
  }

  public static determineSourceType(source: string): MCPSourceType {
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return MCPSourceType.URL;
    }
    return MCPSourceType.NPX;
  }
}
