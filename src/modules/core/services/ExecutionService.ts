import { 
  ExecutionContext, 
  ExecutionStatus, 
  NodeEvent, 
  NodeEventStatus,
  ExecutionContextResponse 
} from '../domain/Execution';
import { IExecutionLogRepository } from '../repositories/IExecutionLogRepository';
import { IAutomationRepository } from '../repositories/IAutomationRepository';
import { IAutomationExecutor, NodeExecutionResult } from './automation/AutomationExecutor';
import { AppError } from '@shared/errors';

export type EventListener = (event: NodeEvent) => void;

export interface ExecutionStatusResponse {
  automationId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  logs: ExecutionContextResponse[];
}

export interface IExecutionService {
  startExecution(automationId: string, input?: Record<string, unknown>): Promise<string>;
  getExecutionStatus(automationId: string): Promise<ExecutionStatusResponse>;
  getExecutionLogs(automationId: string): Promise<ExecutionContextResponse[]>;
  addEventListener(listener: EventListener): void;
  removeEventListener(listener: EventListener): void;
}

export class ExecutionService implements IExecutionService {
  private eventListeners: EventListener[] = [];

  constructor(
    private readonly automationRepository: IAutomationRepository,
    private readonly executionLogRepository: IExecutionLogRepository,
    private readonly automationExecutor: IAutomationExecutor
  ) {
    // Register executor listener to capture node events
    this.automationExecutor.addListener((result: NodeExecutionResult) => {
      this.handleNodeExecution(result);
    });
  }

  private handleNodeExecution(result: NodeExecutionResult): void {
    // Determine status
    const status = result.status === 'success' 
      ? NodeEventStatus.COMPLETED 
      : NodeEventStatus.FAILED;

    // Create event
    const event = new NodeEvent({
      nodeId: result.nodeId,
      automationId: '', // Will be set from context
      status,
      outputs: result.outputs,
      error: result.error,
      timestamp: new Date(),
    });

    // Notify listeners
    this.notifyEventListeners(event);
  }

  private notifyEventListeners(event: NodeEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        // Ignore listener errors
      }
    });
  }

  public addEventListener(listener: EventListener): void {
    this.eventListeners.push(listener);
  }

  public removeEventListener(listener: EventListener): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  public async startExecution(
    automationId: string,
    input?: Record<string, unknown>
  ): Promise<string> {
    // Validate automation exists
    const automation = await this.automationRepository.findById(automationId);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    // Create execution contexts for all nodes
    const nodes = automation.getNodes();
    for (const node of nodes) {
      const context = new ExecutionContext({
        automationId,
        nodeId: node.getId(),
        inputs: input || {},
        status: ExecutionStatus.PENDING,
        startTime: new Date(),
      });

      await this.executionLogRepository.save(context);

      // Emit running event
      const runningEvent = new NodeEvent({
        nodeId: node.getId(),
        automationId,
        status: NodeEventStatus.RUNNING,
        timestamp: new Date(),
      });
      this.notifyEventListeners(runningEvent);
    }

    // Execute automation asynchronously (don't await)
    this.executeAutomationAsync(automationId, automation, input);

    return automationId;
  }

  private async executeAutomationAsync(
    automationId: string,
    automation: ReturnType<typeof this.automationRepository.findById> extends Promise<infer T> ? NonNullable<T> : never,
    input?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Update contexts to running
      const logs = await this.executionLogRepository.findByAutomationId(automationId);
      for (const log of logs) {
        log.setStatus(ExecutionStatus.RUNNING);
        log.setEndTime(new Date());
        await this.executionLogRepository.save(log);
      }

      // Execute automation
      const executionContext = await this.automationExecutor.execute(automation, input);

      // Update contexts with results
      for (const [nodeId, outputs] of executionContext.executedNodes.entries()) {
        const log = await this.executionLogRepository.findByNodeId(automationId, nodeId);
        if (log) {
          log.setOutputs(outputs);
          log.setStatus(ExecutionStatus.COMPLETED);
          log.setEndTime(new Date());
          await this.executionLogRepository.save(log);

          // Emit completed event
          const completedEvent = new NodeEvent({
            nodeId,
            automationId,
            status: NodeEventStatus.COMPLETED,
            outputs,
            timestamp: new Date(),
          });
          this.notifyEventListeners(completedEvent);
        }
      }

      // Handle errors
      for (const [nodeId, error] of executionContext.errors.entries()) {
        const log = await this.executionLogRepository.findByNodeId(automationId, nodeId);
        if (log) {
          log.setError(error.message);
          log.setStatus(ExecutionStatus.FAILED);
          log.setEndTime(new Date());
          await this.executionLogRepository.save(log);

          // Emit failed event
          const failedEvent = new NodeEvent({
            nodeId,
            automationId,
            status: NodeEventStatus.FAILED,
            error: error.message,
            timestamp: new Date(),
          });
          this.notifyEventListeners(failedEvent);
        }
      }
    } catch (error) {
      // Handle execution errors
      const logs = await this.executionLogRepository.findByAutomationId(automationId);
      for (const log of logs) {
        if (log.getStatus() === ExecutionStatus.RUNNING) {
          log.setError(error instanceof Error ? error.message : 'Unknown error');
          log.setStatus(ExecutionStatus.FAILED);
          log.setEndTime(new Date());
          await this.executionLogRepository.save(log);
        }
      }
    }
  }

  public async getExecutionStatus(automationId: string): Promise<ExecutionStatusResponse> {
    const automation = await this.automationRepository.findById(automationId);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    const logs = await this.executionLogRepository.findByAutomationId(automationId);
    const logsJson = logs.map(log => log.toJSON());

    const totalNodes = automation.getNodes().length;
    const completedNodes = logs.filter(log => log.getStatus() === ExecutionStatus.COMPLETED).length;
    const failedNodes = logs.filter(log => log.getStatus() === ExecutionStatus.FAILED).length;

    return {
      automationId,
      status: automation.getStatus(),
      totalNodes,
      completedNodes,
      failedNodes,
      logs: logsJson,
    };
  }

  public async getExecutionLogs(automationId: string): Promise<ExecutionContextResponse[]> {
    const logs = await this.executionLogRepository.findByAutomationId(automationId);
    return logs.map(log => log.toJSON());
  }
}
