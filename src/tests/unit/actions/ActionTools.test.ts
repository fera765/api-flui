import { createEditTool } from '@modules/core/tools/actions/EditTool';
import { createWebFetchTool } from '@modules/core/tools/actions/WebFetchTool';
import { createShellTool } from '@modules/core/tools/actions/ShellTool';
import {
  createWriteFileTool,
  createReadFileTool,
  createReadFolderTool,
  createFindFilesTool,
  createReadManyFilesTool,
  createSearchTextTool,
} from '@modules/core/tools/actions/FileTool';
import { ToolType } from '@modules/core/domain/SystemTool';
import { promises as fs } from 'fs';
import * as path from 'path';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Action Tools', () => {
  describe('EditTool', () => {
    it('should create edit tool', () => {
      const tool = createEditTool();
      expect(tool.getName()).toBe('Edit');
      expect(tool.getType()).toBe(ToolType.ACTION);
    });

    it('should uppercase text', async () => {
      const tool = createEditTool();
      const result = await tool.execute({
        text: 'hello world',
        operation: 'uppercase',
      }) as { result: string };

      expect(result.result).toBe('HELLO WORLD');
    });

    it('should lowercase text', async () => {
      const tool = createEditTool();
      const result = await tool.execute({
        text: 'HELLO WORLD',
        operation: 'lowercase',
      }) as { result: string };

      expect(result.result).toBe('hello world');
    });

    it('should trim text', async () => {
      const tool = createEditTool();
      const result = await tool.execute({
        text: '  hello  ',
        operation: 'trim',
      }) as { result: string };

      expect(result.result).toBe('hello');
    });

    it('should replace text', async () => {
      const tool = createEditTool();
      const result = await tool.execute({
        text: 'hello world',
        operation: 'replace',
        find: 'world',
        replaceWith: 'universe',
      }) as { result: string };

      expect(result.result).toBe('hello universe');
    });
  });

  describe('WebFetchTool', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create web fetch tool', () => {
      const tool = createWebFetchTool();
      expect(tool.getName()).toBe('WebFetch');
      expect(tool.getType()).toBe(ToolType.ACTION);
    });

    it('should perform GET request', async () => {
      const tool = createWebFetchTool();
      (mockedAxios as unknown as jest.Mock).mockResolvedValue({
        status: 200,
        data: { message: 'success' },
        headers: {},
      });

      const result = await tool.execute({
        url: 'https://api.example.com/data',
        method: 'GET',
      }) as { status: number; data: { message: string } };

      expect(result.status).toBe(200);
      expect(result.data).toEqual({ message: 'success' });
    });

    it('should perform POST request', async () => {
      const tool = createWebFetchTool();
      (mockedAxios as unknown as jest.Mock).mockResolvedValue({
        status: 201,
        data: { id: 1 },
        headers: {},
      });

      const result = await tool.execute({
        url: 'https://api.example.com/data',
        method: 'POST',
        body: { name: 'test' },
      }) as { status: number };

      expect(result.status).toBe(201);
    });

    it('should use default GET method when not specified', async () => {
      const tool = createWebFetchTool();
      (mockedAxios as unknown as jest.Mock).mockResolvedValue({
        status: 200,
        data: {},
        headers: {},
      });

      await tool.execute({
        url: 'https://api.example.com/data',
      });

      expect(mockedAxios).toHaveBeenCalled();
    });
  });

  describe('ShellTool', () => {
    it('should create shell tool', () => {
      const tool = createShellTool();
      expect(tool.getName()).toBe('Shell');
      expect(tool.getType()).toBe(ToolType.ACTION);
    });

    it('should execute simple command', async () => {
      const tool = createShellTool();
      const result = await tool.execute({
        command: 'echo "hello"',
      }) as { stdout: string; exitCode: number };

      expect(result.stdout).toContain('hello');
      expect(result.exitCode).toBe(0);
    });

    it('should handle command errors', async () => {
      const tool = createShellTool();
      const result = await tool.execute({
        command: 'nonexistentcommand123',
      }) as { exitCode: number };

      expect(result.exitCode).not.toBe(0);
    });
  });

  describe('File Tools', () => {
    const testDir = path.join(__dirname, '../../__temp__');
    const testFile = path.join(testDir, 'test.txt');

    beforeAll(async () => {
      await fs.mkdir(testDir, { recursive: true });
    });

    afterAll(async () => {
      try {
        await fs.rm(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    describe('WriteFileTool', () => {
      it('should write file', async () => {
        const tool = createWriteFileTool();
        const result = await tool.execute({
          path: testFile,
          content: 'test content',
        }) as { success: boolean; path: string };

        expect(result.success).toBe(true);
        expect(result.path).toBe(testFile);

        const content = await fs.readFile(testFile, 'utf-8');
        expect(content).toBe('test content');
      });
    });

    describe('ReadFileTool', () => {
      beforeEach(async () => {
        await fs.writeFile(testFile, 'test content', 'utf-8');
      });

      it('should read file', async () => {
        const tool = createReadFileTool();
        const result = await tool.execute({
          path: testFile,
        }) as { content: string; path: string };

        expect(result.content).toBe('test content');
        expect(result.path).toBe(testFile);
      });
    });

    describe('ReadFolderTool', () => {
      beforeEach(async () => {
        await fs.writeFile(path.join(testDir, 'file1.txt'), 'content1', 'utf-8');
        await fs.writeFile(path.join(testDir, 'file2.txt'), 'content2', 'utf-8');
      });

      it('should list files in folder', async () => {
        const tool = createReadFolderTool();
        const result = await tool.execute({
          path: testDir,
        }) as { files: string[] };

        expect(result.files).toContain('file1.txt');
        expect(result.files).toContain('file2.txt');
      });
    });

    describe('FindFilesTool', () => {
      beforeEach(async () => {
        await fs.writeFile(path.join(testDir, 'test1.txt'), 'content', 'utf-8');
        await fs.writeFile(path.join(testDir, 'test2.js'), 'code', 'utf-8');
      });

      it('should find files by pattern', async () => {
        const tool = createFindFilesTool();
        const result = await tool.execute({
          path: testDir,
          pattern: '\\.txt$',
        }) as { files: string[] };

        expect(result.files).toContain('test1.txt');
        expect(result.files).not.toContain('test2.js');
      });
    });

    describe('ReadManyFilesTool', () => {
      beforeEach(async () => {
        await fs.writeFile(path.join(testDir, 'multi1.txt'), 'content1', 'utf-8');
        await fs.writeFile(path.join(testDir, 'multi2.txt'), 'content2', 'utf-8');
      });

      it('should read multiple files', async () => {
        const tool = createReadManyFilesTool();
        const result = await tool.execute({
          paths: [
            path.join(testDir, 'multi1.txt'),
            path.join(testDir, 'multi2.txt'),
          ],
        }) as { files: Array<{ path: string; content: string }> };

        expect(result.files).toHaveLength(2);
        expect(result.files[0].content).toBe('content1');
        expect(result.files[1].content).toBe('content2');
      });
    });

    describe('SearchTextTool', () => {
      beforeEach(async () => {
        await fs.writeFile(testFile, 'hello world\nhello universe', 'utf-8');
      });

      it('should search text in file', async () => {
        const tool = createSearchTextTool();
        const result = await tool.execute({
          path: testFile,
          searchText: 'hello',
        }) as { found: boolean; matches: string[] };

        expect(result.found).toBe(true);
        expect(result.matches).toHaveLength(2);
      });

      it('should return no matches for non-existent text', async () => {
        const tool = createSearchTextTool();
        const result = await tool.execute({
          path: testFile,
          searchText: 'notfound',
        }) as { found: boolean; matches: string[] };

        expect(result.found).toBe(false);
        expect(result.matches).toHaveLength(0);
      });
    });
  });
});
