export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum NodeEventStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface ExecutionContextProps {
  automationId: string;
  nodeId: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: ExecutionStatus;
  startTime: Date;
  endTime?: Date;
  error?: string;
}

export interface ExecutionContextResponse {
  automationId: string;
  nodeId: string;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: ExecutionStatus;
  startTime: string;
  endTime?: string;
  error?: string;
  duration?: number;
}

export class ExecutionContext {
  private readonly automationId: string;
  private readonly nodeId: string;
  private readonly inputs: Record<string, unknown>;
  private outputs?: Record<string, unknown>;
  private status: ExecutionStatus;
  private readonly startTime: Date;
  private endTime?: Date;
  private error?: string;

  constructor(props: ExecutionContextProps) {
    this.automationId = props.automationId;
    this.nodeId = props.nodeId;
    this.inputs = props.inputs;
    this.outputs = props.outputs;
    this.status = props.status;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.error = props.error;
  }

  public getAutomationId(): string {
    return this.automationId;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getInputs(): Record<string, unknown> {
    return this.inputs;
  }

  public getOutputs(): Record<string, unknown> | undefined {
    return this.outputs;
  }

  public getStatus(): ExecutionStatus {
    return this.status;
  }

  public getStartTime(): Date {
    return this.startTime;
  }

  public getEndTime(): Date | undefined {
    return this.endTime;
  }

  public getError(): string | undefined {
    return this.error;
  }

  public setOutputs(outputs: Record<string, unknown>): void {
    this.outputs = outputs;
  }

  public setStatus(status: ExecutionStatus): void {
    this.status = status;
  }

  public setEndTime(endTime: Date): void {
    this.endTime = endTime;
  }

  public setError(error: string): void {
    this.error = error;
  }

  public getDuration(): number | undefined {
    if (!this.endTime) {
      return undefined;
    }
    return this.endTime.getTime() - this.startTime.getTime();
  }

  public toJSON(): ExecutionContextResponse {
    return {
      automationId: this.automationId,
      nodeId: this.nodeId,
      inputs: this.inputs,
      outputs: this.outputs,
      status: this.status,
      startTime: this.startTime.toISOString(),
      endTime: this.endTime?.toISOString(),
      error: this.error,
      duration: this.getDuration(),
    };
  }
}

export interface NodeEventProps {
  nodeId: string;
  automationId: string;
  status: NodeEventStatus;
  outputs?: Record<string, unknown>;
  error?: string;
  timestamp: Date;
}

export interface NodeEventResponse {
  nodeId: string;
  automationId: string;
  status: NodeEventStatus;
  outputs?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

export class NodeEvent {
  private readonly nodeId: string;
  private readonly automationId: string;
  private readonly status: NodeEventStatus;
  private readonly outputs?: Record<string, unknown>;
  private readonly error?: string;
  private readonly timestamp: Date;

  constructor(props: NodeEventProps) {
    this.nodeId = props.nodeId;
    this.automationId = props.automationId;
    this.status = props.status;
    this.outputs = props.outputs;
    this.error = props.error;
    this.timestamp = props.timestamp;
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getAutomationId(): string {
    return this.automationId;
  }

  public getStatus(): NodeEventStatus {
    return this.status;
  }

  public getOutputs(): Record<string, unknown> | undefined {
    return this.outputs;
  }

  public getError(): string | undefined {
    return this.error;
  }

  public getTimestamp(): Date {
    return this.timestamp;
  }

  public toJSON(): NodeEventResponse {
    return {
      nodeId: this.nodeId,
      automationId: this.automationId,
      status: this.status,
      outputs: this.outputs,
      error: this.error,
      timestamp: this.timestamp.toISOString(),
    };
  }

  public toSSE(): string {
    return `data: ${JSON.stringify(this.toJSON())}\n\n`;
  }
}
