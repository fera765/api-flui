/**
 * Example Tool for TOR (Tool Onboarding Registry)
 * 
 * This is a minimal example of a tool that can be imported via TOR.
 * Replace this with your custom logic.
 */

export interface ToolContext {
  logger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
  capabilities: Record<string, boolean>;
}

export interface ToolInput {
  message: string;
}

export interface ToolOutput {
  result: string;
  timestamp: number;
}

/**
 * Main handler function
 * This is the entry point that TOR will call
 */
export async function handler(
  ctx: ToolContext,
  input: ToolInput
): Promise<ToolOutput> {
  ctx.logger.info('Processing message:', input.message);

  // Your custom logic here
  const result = `Processed: ${input.message}`;
  const timestamp = Date.now();

  ctx.logger.info('Processing complete');

  return {
    result,
    timestamp,
  };
}

// Optional: Export additional functions if needed
export function healthcheck(): boolean {
  return true;
}
