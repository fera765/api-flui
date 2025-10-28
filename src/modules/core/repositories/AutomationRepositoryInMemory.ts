import { randomUUID } from 'crypto';
import { Automation, AutomationStatus, CreateAutomationProps, Node, Link } from '../domain/Automation';
import { IAutomationRepository } from './IAutomationRepository';

export class AutomationRepositoryInMemory implements IAutomationRepository {
  private automations: Map<string, Automation> = new Map();

  public async create(props: CreateAutomationProps): Promise<Automation> {
    const id = randomUUID();
    const nodes = props.nodes.map(nodeProps => {
      const nodeId = nodeProps.id || randomUUID();
      return new Node({
        id: nodeId,
        type: nodeProps.type,
        referenceId: nodeProps.referenceId,
        config: nodeProps.config,
        position: nodeProps.position, // ✅ FEATURE 2: Suporte a posição
      });
    });

    const links = props.links.map(linkProps => new Link(linkProps));

    const automation = new Automation({
      id,
      name: props.name,
      description: props.description,
      nodes,
      links,
      status: AutomationStatus.IDLE,
    });

    this.automations.set(id, automation);
    return automation;
  }

  public async findAll(): Promise<Automation[]> {
    return Array.from(this.automations.values());
  }

  public async findById(id: string): Promise<Automation | null> {
    return this.automations.get(id) || null;
  }

  public async findByName(name: string): Promise<Automation | null> {
    for (const automation of this.automations.values()) {
      if (automation.getName() === name) {
        return automation;
      }
    }
    return null;
  }

  public async update(automation: Automation): Promise<void> {
    const id = automation.getId();
    if (!this.automations.has(id)) {
      throw new Error('Automation not found');
    }
    this.automations.set(id, automation);
  }

  public async delete(id: string): Promise<void> {
    const exists = this.automations.has(id);
    if (!exists) {
      throw new Error('Automation not found');
    }
    this.automations.delete(id);
  }

  public clear(): void {
    this.automations.clear();
  }
}
