/**
 * Tool Repository Interface
 * Interface para persistência de Tools
 */

import { Tool, CreateToolProps } from '../domain/Tool';

export interface IToolRepository {
  create(props: CreateToolProps): Promise<Tool>;
  findById(id: string): Promise<Tool | null>;
  findByNameAndVersion(name: string, version: string): Promise<Tool | null>;
  findByName(name: string): Promise<Tool[]>;
  findAll(): Promise<Tool[]>;
  update(tool: Tool): Promise<void>;
  delete(id: string): Promise<void>;
  clear(): void; // Para testes
}
