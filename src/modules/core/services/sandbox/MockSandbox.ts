import { randomUUID } from 'crypto';
import { Tool } from '../../domain/Tool';
import { ISandbox, SandboxExecutionResult } from './ISandbox';

/**
 * Mock Sandbox for testing and development
 * In production, this would be replaced with a real sandboxed environment
 * using worker_threads, vm modules, or containerization
 */
export class MockSandbox implements ISandbox {
  private source?: string;
  private tools: Map<string, Tool> = new Map();

  public async initialize(_env?: Record<string, string>): Promise<void> {
    // In a real implementation, env variables would be set in the sandbox
  }

  public async loadMCP(source: string): Promise<void> {
    this.source = source;
    // In a real implementation, this would:
    // - Download/install the NPX package or connect to URL
    // - Load the module in isolated environment
    // - Parse exports and functions
  }

  public async extractTools(): Promise<Tool[]> {
    // Mock extraction - simulates finding tools in an MCP
    // In production, this would analyze the loaded module
    if (!this.source) {
      return [];
    }

    const mockTools = this.createMockTools(this.source);
    mockTools.forEach(tool => {
      this.tools.set(tool.getName(), tool);
    });

    return mockTools;
  }

  public async executeTool(toolName: string, input: unknown): Promise<SandboxExecutionResult> {
    const tool = this.tools.get(toolName);

    if (!tool) {
      return {
        success: false,
        error: `Tool '${toolName}' not found in sandbox`,
      };
    }

    try {
      const result = await tool.execute(input);
      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  public async destroy(): Promise<void> {
    this.tools.clear();
    this.source = undefined;
  }

  private createMockTools(source: string): Tool[] {
    // Simulate tools based on source
    if (source.includes('mcpollinations') || source.includes('npx')) {
      return [
        new Tool({
          id: randomUUID(),
          name: 'generate_image',
          description: 'Generates an image from text prompt',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              width: { type: 'number' },
              height: { type: 'number' },
            },
            required: ['prompt'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              url: { type: 'string' },
            },
          },
          executor: async (input: unknown) => {
            const { prompt } = input as { prompt: string };
            return {
              url: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`,
            };
          },
        }),
        new Tool({
          id: randomUUID(),
          name: 'generate_text',
          description: 'Generates text from prompt',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string' },
              model: { type: 'string' },
            },
            required: ['prompt'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string' },
            },
          },
          executor: async (input: unknown) => {
            const { prompt } = input as { prompt: string };
            return {
              text: `Generated response for: ${prompt}`,
            };
          },
        }),
      ];
    } else if (source.startsWith('http')) {
      // Mock tools for URL-based MCPs
      return [
        new Tool({
          id: randomUUID(),
          name: 'sse_stream',
          description: 'Streams data via Server-Sent Events',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string' },
            },
            required: ['query'],
          },
          outputSchema: {
            type: 'object',
            properties: {
              stream: { type: 'string' },
            },
          },
          executor: async (input: unknown) => {
            const { query } = input as { query: string };
            return {
              stream: `SSE stream for: ${query}`,
            };
          },
        }),
      ];
    }

    return [];
  }
}
