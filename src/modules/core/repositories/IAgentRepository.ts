import { Agent, CreateAgentProps, UpdateAgentProps } from '../domain/Agent';

export interface IAgentRepository {
  create(props: CreateAgentProps): Promise<Agent>;
  findAll(): Promise<Agent[]>;
  findById(id: string): Promise<Agent | null>;
  update(id: string, props: UpdateAgentProps): Promise<Agent>;
  delete(id: string): Promise<void>;
}
