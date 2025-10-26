/**
 * Tool Repository In-Memory
 * Implementação em memória (pronta para migrar para DB)
 */

import { Tool, CreateToolProps } from '../domain/Tool';
import { IToolRepository } from './IToolRepository';

export class ToolRepositoryInMemory implements IToolRepository {
  private tools = new Map<string, Tool>();

  async create(props: CreateToolProps): Promise<Tool> {
    const tool = Tool.create(props);
    this.tools.set(tool.getId(), tool);
    return tool;
  }

  async findById(id: string): Promise<Tool | null> {
    return this.tools.get(id) || null;
  }

  async findByNameAndVersion(name: string, version: string): Promise<Tool | null> {
    for (const tool of this.tools.values()) {
      if (tool.getName() === name && tool.getVersion() === version) {
        return tool;
      }
    }
    return null;
  }

  async findByName(name: string): Promise<Tool[]> {
    const tools: Tool[] = [];
    for (const tool of this.tools.values()) {
      if (tool.getName() === name) {
        tools.push(tool);
      }
    }
    return tools.sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());
  }

  async findAll(): Promise<Tool[]> {
    return Array.from(this.tools.values())
      .sort((a, b) => b.getCreatedAt().getTime() - a.getCreatedAt().getTime());
  }

  async update(tool: Tool): Promise<void> {
    this.tools.set(tool.getId(), tool);
  }

  async delete(id: string): Promise<void> {
    this.tools.delete(id);
  }

  clear(): void {
    this.tools.clear();
  }
}
