import { randomUUID } from 'crypto';
import { SystemTool, CreateSystemToolProps } from '../domain/SystemTool';
import { ISystemToolRepository } from './ISystemToolRepository';

export class SystemToolRepositoryInMemory implements ISystemToolRepository {
  private tools: Map<string, SystemTool> = new Map();

  public async create(props: CreateSystemToolProps): Promise<SystemTool> {
    const id = randomUUID();
    const tool = new SystemTool({
      id,
      name: props.name,
      description: props.description,
      type: props.type,
      config: props.config,
      inputSchema: props.inputSchema,
      outputSchema: props.outputSchema,
      executor: props.executor,
    });

    this.tools.set(id, tool);
    return tool;
  }

  public async findAll(): Promise<SystemTool[]> {
    return Array.from(this.tools.values());
  }

  public async findById(id: string): Promise<SystemTool | null> {
    return this.tools.get(id) || null;
  }

  public async findByName(name: string): Promise<SystemTool | null> {
    for (const tool of this.tools.values()) {
      if (tool.getName() === name) {
        return tool;
      }
    }
    return null;
  }

  public async delete(id: string): Promise<void> {
    const exists = this.tools.has(id);
    if (!exists) {
      throw new Error('Tool not found');
    }
    this.tools.delete(id);
  }

  public clear(): void {
    this.tools.clear();
  }
}
