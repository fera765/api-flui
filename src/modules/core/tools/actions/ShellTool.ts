import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';
import { executeInSandbox, SandboxOptions } from './SafeShellSandbox';

export interface ShellToolInput {
  command: string;
  cwd?: string;
  timeout?: number;
  maxOutputSize?: number;
}

export function createShellTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'Shell',
    description: 'Executes shell commands in a safe sandbox environment. Only allows safe commands and restricts execution to current directory and subdirectories.',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        command: { 
          type: 'string',
          description: 'Shell command to execute (must be in whitelist and within allowed directories)'
        },
        cwd: { 
          type: 'string',
          description: 'Working directory (default: current directory). Must be within allowed scope.'
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)'
        },
        maxOutputSize: {
          type: 'number',
          description: 'Maximum output size in bytes (default: 10485760 = 10MB)'
        },
      },
      required: ['command'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        exitCode: { type: 'number' },
        success: { type: 'boolean' },
      },
    },
    executor: async (input: unknown) => {
      const shellInput = input as ShellToolInput;
      
      if (!shellInput.command || typeof shellInput.command !== 'string') {
        return {
          stdout: '',
          stderr: 'Command is required and must be a string',
          exitCode: 1,
          success: false,
        };
      }

      const options: SandboxOptions = {
        cwd: shellInput.cwd,
        timeout: shellInput.timeout,
        maxOutputSize: shellInput.maxOutputSize,
      };

      const result = await executeInSandbox(shellInput.command, options);
      
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        success: result.success,
      };
    },
  });
}
