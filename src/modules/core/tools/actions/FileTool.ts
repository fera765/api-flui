import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../../domain/SystemTool';
import { promises as fs } from 'fs';

export function createWriteFileTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'WriteFile',
    description: 'Writes content to a file',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        content: { type: 'string' },
      },
      required: ['path', 'content'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        path: { type: 'string' },
      },
    },
    executor: async (input: unknown) => {
      const { path: filePath, content } = input as { path: string; content: string };
      await fs.writeFile(filePath, content, 'utf-8');
      return { success: true, path: filePath };
    },
  });
}

export function createReadFileTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'ReadFile',
    description: 'Reads content from a single file',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
        path: { type: 'string' },
      },
    },
    executor: async (input: unknown) => {
      const { path: filePath } = input as { path: string };
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, path: filePath };
    },
  });
}

export function createReadFolderTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'ReadFolder',
    description: 'Lists files in a directory',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
      },
      required: ['path'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
      },
    },
    executor: async (input: unknown) => {
      const { path: dirPath } = input as { path: string };
      const files = await fs.readdir(dirPath);
      return { files };
    },
  });
}

export function createFindFilesTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'FindFiles',
    description: 'Searches for files matching a pattern',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        pattern: { type: 'string' },
      },
      required: ['path', 'pattern'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string' } },
      },
    },
    executor: async (input: unknown) => {
      const { path: dirPath, pattern } = input as { path: string; pattern: string };
      const allFiles = await fs.readdir(dirPath);
      const regex = new RegExp(pattern);
      const matchedFiles = allFiles.filter(file => regex.test(file));
      return { files: matchedFiles };
    },
  });
}

export function createReadManyFilesTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'ReadManyFiles',
    description: 'Reads multiple files at once',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        paths: { type: 'array', items: { type: 'string' } },
      },
      required: ['paths'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              content: { type: 'string' },
            },
          },
        },
      },
    },
    executor: async (input: unknown) => {
      const { paths } = input as { paths: string[] };
      const files = await Promise.all(
        paths.map(async (filePath) => {
          const content = await fs.readFile(filePath, 'utf-8');
          return { path: filePath, content };
        })
      );
      return { files };
    },
  });
}

export function createSearchTextTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'SearchText',
    description: 'Searches for text within files',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        searchText: { type: 'string' },
      },
      required: ['path', 'searchText'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        found: { type: 'boolean' },
        matches: { type: 'array', items: { type: 'string' } },
      },
    },
    executor: async (input: unknown) => {
      const { path: filePath, searchText } = input as { path: string; searchText: string };
      const content = await fs.readFile(filePath, 'utf-8');
      const regex = new RegExp(searchText, 'g');
      const matches = content.match(regex) || [];
      return {
        found: matches.length > 0,
        matches,
      };
    },
  });
}
