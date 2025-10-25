import { 
  AutomationResponse, 
  CreateAutomationProps, 
  UpdateAutomationProps 
} from '../domain/Automation';
import { IAutomationRepository } from '../repositories/IAutomationRepository';
import { IAutomationExecutor, ExecutionContext } from './automation/AutomationExecutor';
import { AppError } from '@shared/errors';

export interface IAutomationService {
  createAutomation(props: CreateAutomationProps): Promise<AutomationResponse>;
  getAllAutomations(): Promise<AutomationResponse[]>;
  getAutomationById(id: string): Promise<AutomationResponse>;
  updateAutomation(id: string, props: UpdateAutomationProps): Promise<AutomationResponse>;
  deleteAutomation(id: string): Promise<void>;
  executeAutomation(id: string, input?: Record<string, unknown>): Promise<ExecutionContext>;
}

export class AutomationService implements IAutomationService {
  constructor(
    private readonly repository: IAutomationRepository,
    private readonly executor: IAutomationExecutor
  ) {}

  public async createAutomation(props: CreateAutomationProps): Promise<AutomationResponse> {
    if (!props.name || props.name.trim() === '') {
      throw new AppError('Automation name is required', 400);
    }

    if (!props.nodes || props.nodes.length === 0) {
      throw new AppError('Automation must have at least one node', 400);
    }

    // Check for duplicate name
    const existing = await this.repository.findByName(props.name);
    if (existing) {
      throw new AppError('Automation with this name already exists', 400);
    }

    // Validate that at least one trigger node exists
    const hasTrigger = props.nodes.some(node => node.type === 'trigger');
    if (!hasTrigger) {
      throw new AppError('Automation must have at least one trigger node', 400);
    }

    const automation = await this.repository.create(props);
    return automation.toJSON();
  }

  public async getAllAutomations(): Promise<AutomationResponse[]> {
    const automations = await this.repository.findAll();
    return automations.map(automation => automation.toJSON());
  }

  public async getAutomationById(id: string): Promise<AutomationResponse> {
    const automation = await this.repository.findById(id);

    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    return automation.toJSON();
  }

  public async updateAutomation(id: string, props: UpdateAutomationProps): Promise<AutomationResponse> {
    const automation = await this.repository.findById(id);

    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    if (props.name !== undefined && props.name.trim() === '') {
      throw new AppError('Automation name cannot be empty', 400);
    }

    // Check for duplicate name if changing name
    if (props.name && props.name !== automation.getName()) {
      const existing = await this.repository.findByName(props.name);
      if (existing) {
        throw new AppError('Automation with this name already exists', 400);
      }
    }

    automation.update(props);

    try {
      await this.repository.update(automation);
    } catch (error) {
      if (error instanceof Error && error.message === 'Automation not found') {
        throw new AppError('Automation not found', 404);
      }
      throw error;
    }

    return automation.toJSON();
  }

  public async deleteAutomation(id: string): Promise<void> {
    const automation = await this.repository.findById(id);

    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    try {
      await this.repository.delete(id);
    } catch (error) {
      if (error instanceof Error && error.message === 'Automation not found') {
        throw new AppError('Automation not found', 404);
      }
      throw error;
    }
  }

  public async executeAutomation(
    id: string,
    input?: Record<string, unknown>
  ): Promise<ExecutionContext> {
    const automation = await this.repository.findById(id);

    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    try {
      const context = await this.executor.execute(automation, input);
      
      // Save updated automation status
      await this.repository.update(automation);

      return context;
    } catch (error) {
      // Save error status
      await this.repository.update(automation);
      throw error;
    }
  }
}
