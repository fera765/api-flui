import { randomUUID } from 'crypto';
import { MCP, CreateMCPProps } from '../domain/MCP';
import { Tool } from '../domain/Tool';
import { IMCPRepository } from './IMCPRepository';

export class MCPRepositoryInMemory implements IMCPRepository {
  private mcps: Map<string, MCP> = new Map();

  public async create(props: CreateMCPProps, tools: Tool[]): Promise<MCP> {
    const id = randomUUID();
    const sourceType = MCP.determineSourceType(props.source);

    const mcp = new MCP({
      id,
      name: props.name,
      source: props.source,
      sourceType,
      description: props.description,
      tools,
      env: props.env,
    });

    this.mcps.set(id, mcp);
    return mcp;
  }

  public async findAll(): Promise<MCP[]> {
    return Array.from(this.mcps.values());
  }

  public async findById(id: string): Promise<MCP | null> {
    return this.mcps.get(id) || null;
  }

  public async delete(id: string): Promise<void> {
    const exists = this.mcps.has(id);
    if (!exists) {
      throw new Error('MCP not found');
    }
    this.mcps.delete(id);
  }

  // Testing purposes
  public clear(): void {
    this.mcps.clear();
  }
}
