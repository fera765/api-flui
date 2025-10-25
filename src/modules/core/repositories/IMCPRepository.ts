import { MCP, CreateMCPProps } from '../domain/MCP';
import { Tool } from '../domain/Tool';

export interface IMCPRepository {
  create(props: CreateMCPProps, tools: Tool[]): Promise<MCP>;
  findAll(): Promise<MCP[]>;
  findById(id: string): Promise<MCP | null>;
  delete(id: string): Promise<void>;
}
