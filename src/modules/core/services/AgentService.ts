import { CreateAgentProps, UpdateAgentProps, AgentResponse } from '../domain/Agent';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { AppError } from '@shared/errors';

export interface IAgentService {
  createAgent(props: CreateAgentProps): Promise<AgentResponse>;
  getAllAgents(): Promise<AgentResponse[]>;
  getAgentById(id: string): Promise<AgentResponse>;
  updateAgent(id: string, props: UpdateAgentProps): Promise<AgentResponse>;
  deleteAgent(id: string): Promise<void>;
}

export class AgentService implements IAgentService {
  constructor(private readonly repository: IAgentRepository) {}

  public async createAgent(props: CreateAgentProps): Promise<AgentResponse> {
    if (!props.name || props.name.trim() === '') {
      throw new AppError('Name is required', 400);
    }

    if (!props.prompt || props.prompt.trim() === '') {
      throw new AppError('Prompt is required', 400);
    }

    const agent = await this.repository.create(props);
    return agent.toJSON();
  }

  public async getAllAgents(): Promise<AgentResponse[]> {
    const agents = await this.repository.findAll();
    return agents.map(agent => agent.toJSON());
  }

  public async getAgentById(id: string): Promise<AgentResponse> {
    const agent = await this.repository.findById(id);
    
    if (!agent) {
      throw new AppError('Agent not found', 404);
    }

    return agent.toJSON();
  }

  public async updateAgent(id: string, props: UpdateAgentProps): Promise<AgentResponse> {
    try {
      const agent = await this.repository.update(id, props);
      return agent.toJSON();
    } catch (error) {
      if (error instanceof Error && error.message === 'Agent not found') {
        throw new AppError('Agent not found', 404);
      }
      throw error;
    }
  }

  public async deleteAgent(id: string): Promise<void> {
    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Agent not found') {
        throw new AppError('Agent not found', 404);
      }
      throw error;
    }
  }
}
