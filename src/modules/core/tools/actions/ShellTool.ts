import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function createShellTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'Shell',
    description: 'Executes shell commands on the system',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string' },
        cwd: { type: 'string' },
      },
      required: ['command'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        stdout: { type: 'string' },
        stderr: { type: 'string' },
        exitCode: { type: 'number' },
      },
    },
    executor: async (input: unknown) => {
      const { command, cwd } = input as {
        command: string;
        cwd?: string;
      };

      try {
        const { stdout, stderr } = await execAsync(command, { cwd });
        return {
          stdout,
          stderr,
          exitCode: 0,
        };
      } catch (error: unknown) {
        const err = error as { stdout?: string; stderr?: string; code?: number };
        return {
          stdout: err.stdout || '',
          stderr: err.stderr || '',
          exitCode: err.code || 1,
        };
      }
    },
  });
}
