import { SystemTool, CreateSystemToolProps } from '../domain/SystemTool';

export interface ISystemToolRepository {
  create(props: CreateSystemToolProps): Promise<SystemTool>;
  findAll(): Promise<SystemTool[]>;
  findById(id: string): Promise<SystemTool | null>;
  findByName(name: string): Promise<SystemTool | null>;
  delete(id: string): Promise<void>;
}
