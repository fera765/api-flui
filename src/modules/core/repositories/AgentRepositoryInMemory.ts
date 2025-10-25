import { randomUUID } from 'crypto';
import { Agent, CreateAgentProps, UpdateAgentProps } from '../domain/Agent';
import { IAgentRepository } from './IAgentRepository';

export class AgentRepositoryInMemory implements IAgentRepository {
  private agents: Map<string, Agent> = new Map();

  public async create(props: CreateAgentProps): Promise<Agent> {
    const id = randomUUID();
    const agent = new Agent({
      id,
      name: props.name,
      description: props.description,
      prompt: props.prompt,
      defaultModel: props.defaultModel,
      tools: props.tools || [],
    });

    this.agents.set(id, agent);
    return agent;
  }

  public async findAll(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  public async findById(id: string): Promise<Agent | null> {
    return this.agents.get(id) || null;
  }

  public async update(id: string, props: UpdateAgentProps): Promise<Agent> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error('Agent not found');
    }

    agent.update(props);
    return agent;
  }

  public async delete(id: string): Promise<void> {
    const exists = this.agents.has(id);
    if (!exists) {
      throw new Error('Agent not found');
    }
    this.agents.delete(id);
  }

  // Testing purposes
  public clear(): void {
    this.agents.clear();
  }
}
