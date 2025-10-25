import { ExecutionContext } from '../domain/Execution';
import { IExecutionLogRepository } from './IExecutionLogRepository';

export class ExecutionLogRepositoryInMemory implements IExecutionLogRepository {
  private logs: Map<string, ExecutionContext[]> = new Map();

  public async save(context: ExecutionContext): Promise<void> {
    const automationId = context.getAutomationId();
    const existing = this.logs.get(automationId) || [];
    
    // Update existing log or add new one
    const index = existing.findIndex(
      ctx => ctx.getNodeId() === context.getNodeId()
    );

    if (index >= 0) {
      existing[index] = context;
    } else {
      existing.push(context);
    }

    this.logs.set(automationId, existing);
  }

  public async findByAutomationId(automationId: string): Promise<ExecutionContext[]> {
    return this.logs.get(automationId) || [];
  }

  public async findByNodeId(automationId: string, nodeId: string): Promise<ExecutionContext | null> {
    const logs = this.logs.get(automationId) || [];
    return logs.find(ctx => ctx.getNodeId() === nodeId) || null;
  }

  public async findAll(): Promise<ExecutionContext[]> {
    const allLogs: ExecutionContext[] = [];
    for (const logs of this.logs.values()) {
      allLogs.push(...logs);
    }
    return allLogs;
  }

  public clear(): void {
    this.logs.clear();
  }
}
