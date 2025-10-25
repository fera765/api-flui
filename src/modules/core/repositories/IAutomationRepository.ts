import { Automation, CreateAutomationProps } from '../domain/Automation';

export interface IAutomationRepository {
  create(props: CreateAutomationProps): Promise<Automation>;
  findAll(): Promise<Automation[]>;
  findById(id: string): Promise<Automation | null>;
  findByName(name: string): Promise<Automation | null>;
  update(automation: Automation): Promise<void>;
  delete(id: string): Promise<void>;
}
