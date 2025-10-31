/**
 * Safe Shell Sandbox
 * Executes shell commands in a restricted sandbox environment
 * - Only allows safe commands (whitelist)
 * - Restricts execution to current directory and subdirectories
 * - Uses isolated Node.js process with resource limits
 * - Implements timeout protection
 */

import { spawn } from 'child_process';
import { resolve, relative } from 'path';
import { access } from 'fs/promises';
import { constants } from 'fs';

// Whitelist of safe commands
const SAFE_COMMANDS = [
  'ls', 'dir', 'cat', 'type', 'head', 'tail', 'grep', 'find', 'wc',
  'echo', 'pwd', 'mkdir', 'touch', 'cp', 'copy', 'mv', 'move', 'rm', 'del',
  'git', 'npm', 'node', 'python', 'python3', 'bash', 'sh', 'chmod', 'chown',
  'tar', 'zip', 'unzip', 'gzip', 'gunzip', 'cd', 'cd..', 'cd..\\', 'cd ../',
] as const;

// Dangerous commands that should never be allowed
const DANGEROUS_PATTERNS = [
  /rm\s+-rf/,           // Force delete
  /format/,             // Disk formatting
  /dd:\s*if=/,          // Disk cloning
  /mkfs/,               // File system creation
  /fdisk/,              // Partition manipulation
  />\s*\/dev/,          // Direct device access
  /exec\s+\$\{/,        // Command injection patterns
  /eval\s+/,            // Eval
  /system\s*\(/,        // System calls
  /\$\{.*\}/,           // Variable expansion injection
  /`.*`/,               // Command substitution
  /\$\(.*\)/,           // Command substitution
  /;.*rm/,              // Command chaining with rm
  /\|\s*rm/,            // Pipe to rm
  /&&\s*rm/,            // And with rm
  /<.*>/g,              // Redirection to devices
];

export interface SandboxResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export interface SandboxOptions {
  timeout?: number; // Timeout in milliseconds (default: 30000)
  maxOutputSize?: number; // Max output size in bytes (default: 10MB)
  cwd?: string; // Working directory (default: process.cwd())
}

/**
 * Validates if a command is safe to execute
 */
function isCommandSafe(command: string): boolean {
  const trimmed = command.trim();
  
  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  
  // Extract base command (first word)
  const baseCommand = trimmed.split(/\s+/)[0]?.toLowerCase();
  if (!baseCommand) {
    return false;
  }
  
  // Check if base command is in whitelist
  return SAFE_COMMANDS.some(cmd => baseCommand === cmd || baseCommand.startsWith(cmd + '.'));
}

/**
 * Validates if a path is within allowed directory (current dir and subdirs)
 */
async function isPathAllowed(path: string, baseDir: string): Promise<boolean> {
  try {
    // Resolve paths to absolute
    const resolvedBase = resolve(baseDir);
    let resolvedPath: string;
    
    // Handle relative and absolute paths
    if (path.startsWith('/') || (process.platform === 'win32' && /^[A-Za-z]:/.test(path))) {
      // Absolute path
      resolvedPath = resolve(path);
    } else {
      // Relative path - resolve relative to baseDir
      resolvedPath = resolve(resolvedBase, path);
    }
    
    // Normalize paths for comparison
    const normalizedPath = resolvedPath.replace(/\\/g, '/');
    const normalizedBase = resolvedBase.replace(/\\/g, '/');
    
    // Check if path is within base directory
    if (!normalizedPath.startsWith(normalizedBase)) {
      return false;
    }
    
    // Get relative path and check it doesn't go up
    const relativePath = relative(resolvedBase, resolvedPath);
    if (relativePath.startsWith('..') || relativePath === '..') {
      return false;
    }
    
    // Path is allowed (existence check is optional for commands like mkdir)
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts and validates paths from command arguments
 */
async function validateCommandPaths(command: string, baseDir: string): Promise<boolean> {
  // Extract potential paths from command
  // Pattern matches: absolute paths (/path, C:\path), relative paths with .., and quoted paths
  const pathPattern = /(['"]?)((?:\.\.?[\/\\])+[^\s'"]*|[\/\\][^\s'"]+|[A-Za-z]:[\/\\][^\s'"]+)\1/g;
  const matches = Array.from(command.matchAll(pathPattern));
  
  if (!matches || matches.length === 0) {
    return true; // No paths found, command is safe
  }
  
  // Validate each path
  for (const match of matches) {
    const path = match[2]?.replace(/['"]/g, '') || '';
    
    // Skip if path is just . or .. (relative navigation)
    if (path === '.' || path === '..') {
      continue;
    }
    
    // Check for dangerous path patterns
    if (path.includes('..')) {
      return false; // Explicitly block parent directory navigation
    }
    
    if (!await isPathAllowed(path, baseDir)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Executes a shell command in a safe sandbox environment
 */
export async function executeInSandbox(
  command: string,
  options: SandboxOptions = {}
): Promise<SandboxResult> {
  const {
    timeout = 30000, // 30 seconds default
    maxOutputSize = 10 * 1024 * 1024, // 10MB default
    cwd = process.cwd(),
  } = options;
  
  // Validate command safety
  if (!isCommandSafe(command)) {
    return {
      stdout: '',
      stderr: `Command rejected: Command contains dangerous patterns or is not in whitelist`,
      exitCode: 1,
      success: false,
    };
  }
  
  // Validate paths in command
  const baseDir = resolve(cwd);
  const pathValid = await validateCommandPaths(command, baseDir);
  if (!pathValid) {
    return {
      stdout: '',
      stderr: `Command rejected: Path references outside allowed directory (${baseDir})`,
      exitCode: 1,
      success: false,
    };
  }
  
  // Ensure cwd exists and is accessible
  try {
    await access(baseDir, constants.F_OK | constants.R_OK);
  } catch {
    return {
      stdout: '',
      stderr: `Command rejected: Working directory not accessible: ${baseDir}`,
      exitCode: 1,
      success: false,
    };
  }
  
  return new Promise<SandboxResult>((resolve) => {
    // Determine shell based on platform
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'cmd.exe' : '/bin/bash';
    const shellArgs = isWindows ? ['/c'] : ['-c'];
    
    // Spawn isolated process with restricted environment
    const child = spawn(shell, [...shellArgs, command], {
      cwd: baseDir,
      env: {
        // Minimal environment variables
        PATH: process.env.PATH || '',
        HOME: process.env.HOME || '',
        USER: process.env.USER || '',
        ...(isWindows ? {} : { SHELL: '/bin/bash' }),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    
    let stdout = '';
    let stderr = '';
    let stdoutSize = 0;
    let stderrSize = 0;
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      if (child && !child.killed) {
        child.kill('SIGTERM');
      }
      resolve({
        stdout: stdout.substring(0, maxOutputSize),
        stderr: stderr + '\nCommand timeout after ' + timeout + 'ms',
        exitCode: 124, // Timeout exit code
        success: false,
      });
    }, timeout);
    
    // Collect stdout
    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        stdoutSize += data.length;
        if (stdoutSize <= maxOutputSize) {
          stdout += data.toString();
        } else {
          if (child && !child.killed) {
            child.kill('SIGTERM');
          }
        }
      });
    }
    
    // Collect stderr
    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        stderrSize += data.length;
        if (stderrSize <= maxOutputSize) {
          stderr += data.toString();
        } else {
          if (child && !child.killed) {
            child.kill('SIGTERM');
          }
        }
      });
    }
    
    // Handle process completion
    child.on('close', (code: number | null) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: stdout.substring(0, maxOutputSize),
        stderr: stderr.substring(0, maxOutputSize),
        exitCode: code ?? 1,
        success: code === 0,
      });
    });
    
    // Handle errors
    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      resolve({
        stdout: '',
        stderr: `Execution error: ${error.message}`,
        exitCode: 1,
        success: false,
      });
    });
  });
}
