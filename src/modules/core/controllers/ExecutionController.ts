import { Request, Response } from 'express';
import { ExecutionService } from '../services/ExecutionService';
import { NodeEvent } from '../domain/Execution';

export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  public async start(request: Request, response: Response): Promise<Response> {
    const { automationId } = request.params;
    const input = request.body;

    const executionId = await this.executionService.startExecution(automationId, input);

    return response.status(202).json({
      message: 'Execution started',
      automationId: executionId,
    });
  }

  public async getStatus(request: Request, response: Response): Promise<Response> {
    const { automationId } = request.params;

    const status = await this.executionService.getExecutionStatus(automationId);

    return response.status(200).json(status);
  }

  public async getLogs(request: Request, response: Response): Promise<Response> {
    const { automationId } = request.params;

    const logs = await this.executionService.getExecutionLogs(automationId);

    return response.status(200).json(logs);
  }

  public async streamEvents(request: Request, response: Response): Promise<void> {
    const { automationId } = request.params;

    // Set headers for SSE
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.flushHeaders();

    // Create event listener
    const listener = (event: NodeEvent) => {
      if (event.getAutomationId() === automationId) {
        response.write(event.toSSE());
      }
    };

    // Add listener
    this.executionService.addEventListener(listener);

    // Remove listener on connection close
    request.on('close', () => {
      this.executionService.removeEventListener(listener);
      response.end();
    });
  }
}
