import { ExecutionContext } from '../domain/Execution';

export interface IExecutionLogRepository {
  save(context: ExecutionContext): Promise<void>;
  findByAutomationId(automationId: string): Promise<ExecutionContext[]>;
  findByNodeId(automationId: string, nodeId: string): Promise<ExecutionContext | null>;
  findAll(): Promise<ExecutionContext[]>;
  clear(): void;
}
