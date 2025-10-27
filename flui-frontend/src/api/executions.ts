import { API_BASE_URL } from '@/lib/api';

export interface NodeExecutionLog {
  automationId: string;
  nodeId: string;
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  error?: string;
  duration?: number;
}

export interface ExecutionStatus {
  automationId: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  totalNodes: number;
  completedNodes: number;
  failedNodes: number;
  logs: NodeExecutionLog[];
}

export interface NodeEvent {
  nodeId: string;
  automationId: string;
  status: 'running' | 'completed' | 'failed';
  outputs?: Record<string, any>;
  error?: string;
  timestamp: string;
}

// Start execution
export async function startExecution(
  automationId: string,
  input?: Record<string, any>
): Promise<{ executionId: string }> {
  const response = await fetch(`${API_BASE_URL}/executions/${automationId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to start execution' }));
    throw new Error(error.error || 'Failed to start execution');
  }

  return response.json();
}

// Get execution status
export async function getExecutionStatus(automationId: string): Promise<ExecutionStatus> {
  const response = await fetch(`${API_BASE_URL}/executions/${automationId}/status`);

  if (!response.ok) {
    throw new Error('Failed to fetch execution status');
  }

  return response.json();
}

// Get execution logs
export async function getExecutionLogs(automationId: string): Promise<NodeExecutionLog[]> {
  const response = await fetch(`${API_BASE_URL}/executions/${automationId}/logs`);

  if (!response.ok) {
    throw new Error('Failed to fetch execution logs');
  }

  return response.json();
}

// Stream execution events (SSE)
export function streamExecutionEvents(
  automationId: string,
  onEvent: (event: NodeEvent) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): () => void {
  const eventSource = new EventSource(
    `${API_BASE_URL}/executions/${automationId}/events`
  );

  eventSource.onmessage = (event) => {
    try {
      const data: NodeEvent = JSON.parse(event.data);
      onEvent(data);
      
      // Check if execution is complete
      if (data.status === 'completed' || data.status === 'failed') {
        // Could check if this was the last node
      }
    } catch (error) {
      console.error('Error parsing SSE event:', error);
    }
  };

  eventSource.addEventListener('complete', () => {
    eventSource.close();
    onComplete();
  });

  eventSource.addEventListener('error', () => {
    eventSource.close();
    onError(new Error('Execution failed'));
  });

  eventSource.onerror = () => {
    eventSource.close();
    onError(new Error('Connection error'));
  };

  return () => eventSource.close();
}
