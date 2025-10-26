/**
 * Import Controller Integration Tests
 */

import { ToolImportController } from '../../modules/tools/controllers/ToolImportController';
import { ToolImportService } from '../../modules/tools/services/ToolImportService';
import { ToolRepositoryInMemory } from '../../modules/tools/repositories/ToolRepositoryInMemory';
import { SandboxManager } from '../../modules/tools/infra/sandbox/SandboxManager';
import { Request, Response } from 'express';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('ToolImportController Integration', () => {
  let controller: ToolImportController;
  let service: ToolImportService;
  let repository: ToolRepositoryInMemory;
  let sandboxManager: SandboxManager;
  let tempDir: string;

  beforeEach(async () => {
    repository = new ToolRepositoryInMemory();
    sandboxManager = new SandboxManager();
    service = new ToolImportService(repository, sandboxManager);
    controller = new ToolImportController(service);
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'import-test-'));
  });

  afterEach(async () => {
    try {
      repository.clear();
      await sandboxManager.cleanup();
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  async function createValidToolZip(): Promise<string> {
    const manifest = {
      name: 'test-tool',
      version: '1.0.0',
      entry: 'dist/index.js',
      type: 'tool',
      outputSchema: {
        type: 'object',
        properties: {
          result: { type: 'string' },
        },
      },
    };

    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
    zip.addFile('dist/index.js', Buffer.from('module.exports.handler = async () => ({ result: "test" });'));

    const zipPath = path.join(tempDir, 'tool.zip');
    zip.writeZip(zipPath);

    return zipPath;
  }

  function createMockRequest(zipPath: string, overwrite = false): Partial<Request> {
    return {
      file: {
        path: zipPath,
        filename: 'tool.zip',
        originalname: 'tool.zip',
        mimetype: 'application/zip',
        size: 1024,
      } as any,
      body: {
        overwrite: overwrite ? 'true' : 'false',
      },
    };
  }

  function createMockResponse(): Partial<Response> {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    return res;
  }

  describe('POST /api/tools/import', () => {
    it('should import a valid tool', async () => {
      const zipPath = await createValidToolZip();
      const req = createMockRequest(zipPath);
      const res = createMockResponse();

      await controller.import(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.any(String),
          name: 'test-tool',
          version: '1.0.0',
          status: 'active',
        })
      );
    });

    it('should reject when file is missing', async () => {
      const req: Partial<Request> = { body: {} };
      const res = createMockResponse();

      await controller.import(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        errorCode: 'MISSING_FILE',
        message: 'ZIP file is required',
      });
    });

    it('should reject invalid manifest', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        // Missing entry and outputSchema
        type: 'tool',
      };

      const zip = new AdmZip();
      zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
      zip.addFile('dist/index.js', Buffer.from('code'));

      const zipPath = path.join(tempDir, 'invalid.zip');
      zip.writeZip(zipPath);

      const req = createMockRequest(zipPath);
      const res = createMockResponse();

      await controller.import(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'IMPORT_FAILED',
          errors: expect.any(Array),
        })
      );
    });

    it('should handle conflict when tool exists', async () => {
      const zipPath = await createValidToolZip();

      // First import
      const req1 = createMockRequest(zipPath);
      const res1 = createMockResponse();
      await controller.import(req1 as Request, res1 as Response);

      // Second import without overwrite
      const zipPath2 = await createValidToolZip();
      const req2 = createMockRequest(zipPath2, false);
      const res2 = createMockResponse();
      await controller.import(req2 as Request, res2 as Response);

      expect(res2.status).toHaveBeenCalledWith(409);
      expect(res2.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errorCode: 'CONFLICT',
        })
      );
    });

    it('should allow overwrite when specified', async () => {
      const zipPath1 = await createValidToolZip();

      // First import
      const req1 = createMockRequest(zipPath1);
      const res1 = createMockResponse();
      await controller.import(req1 as Request, res1 as Response);

      // Second import with overwrite
      const zipPath2 = await createValidToolZip();
      const req2 = createMockRequest(zipPath2, true);
      const res2 = createMockResponse();
      await controller.import(req2 as Request, res2 as Response);

      expect(res2.status).toHaveBeenCalledWith(201);
    });
  });

  describe('GET /api/tools', () => {
    it('should list all tools', async () => {
      // Import a tool first
      const zipPath = await createValidToolZip();
      const importReq = createMockRequest(zipPath);
      const importRes = createMockResponse();
      await controller.import(importReq as Request, importRes as Response);

      // List tools
      const req: Partial<Request> = {};
      const res = createMockResponse();
      await controller.listAll(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        tools: expect.arrayContaining([
          expect.objectContaining({
            name: 'test-tool',
            version: '1.0.0',
          }),
        ]),
        total: 1,
      });
    });

    it('should return empty list when no tools', async () => {
      const req: Partial<Request> = {};
      const res = createMockResponse();

      await controller.listAll(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        tools: [],
        total: 0,
      });
    });
  });

  describe('GET /api/tools/:id', () => {
    it('should get tool by id', async () => {
      // Import a tool first
      const zipPath = await createValidToolZip();
      const importReq = createMockRequest(zipPath);
      const importRes = createMockResponse();
      await controller.import(importReq as Request, importRes as Response);

      const importResult = (importRes.json as jest.Mock).mock.calls[0][0];
      const toolId = importResult.id;

      // Get by ID
      const req: Partial<Request> = {
        params: { id: toolId },
      };
      const res = createMockResponse();
      await controller.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: toolId,
          name: 'test-tool',
          version: '1.0.0',
        })
      );
    });

    it('should return 404 when tool not found', async () => {
      const req: Partial<Request> = {
        params: { id: 'non-existent-id' },
      };
      const res = createMockResponse();

      await controller.getById(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        errorCode: 'NOT_FOUND',
        message: 'Tool not found',
      });
    });
  });

  describe('DELETE /api/tools/:id', () => {
    it('should delete tool', async () => {
      // Import a tool first
      const zipPath = await createValidToolZip();
      const importReq = createMockRequest(zipPath);
      const importRes = createMockResponse();
      await controller.import(importReq as Request, importRes as Response);

      const importResult = (importRes.json as jest.Mock).mock.calls[0][0];
      const toolId = importResult.id;

      // Delete
      const req: Partial<Request> = {
        params: { id: toolId },
      };
      const res = createMockResponse();
      await controller.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();

      // Verify it's gone
      const allTools = await repository.findAll();
      expect(allTools).toHaveLength(0);
    });

    it('should return 404 when deleting non-existent tool', async () => {
      const req: Partial<Request> = {
        params: { id: 'non-existent-id' },
      };
      const res = createMockResponse();

      await controller.delete(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('GET /api/tools/versions/:name', () => {
    it('should list versions of a tool', async () => {
      // Import tool v1.0.0
      const manifest1 = {
        name: 'versioned-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: { type: 'object', properties: {} },
      };
      const zip1 = new AdmZip();
      zip1.addFile('manifest.json', Buffer.from(JSON.stringify(manifest1)));
      zip1.addFile('dist/index.js', Buffer.from('code'));
      const zipPath1 = path.join(tempDir, 'v1.zip');
      zip1.writeZip(zipPath1);

      const req1 = createMockRequest(zipPath1);
      const res1 = createMockResponse();
      await controller.import(req1 as Request, res1 as Response);

      // Import tool v2.0.0
      const manifest2 = { ...manifest1, version: '2.0.0' };
      const zip2 = new AdmZip();
      zip2.addFile('manifest.json', Buffer.from(JSON.stringify(manifest2)));
      zip2.addFile('dist/index.js', Buffer.from('code'));
      const zipPath2 = path.join(tempDir, 'v2.zip');
      zip2.writeZip(zipPath2);

      const req2 = createMockRequest(zipPath2);
      const res2 = createMockResponse();
      await controller.import(req2 as Request, res2 as Response);

      // List versions
      const req: Partial<Request> = {
        params: { name: 'versioned-tool' },
      };
      const res = createMockResponse();
      await controller.listVersions(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        name: 'versioned-tool',
        versions: expect.arrayContaining([
          expect.objectContaining({ version: '1.0.0' }),
          expect.objectContaining({ version: '2.0.0' }),
        ]),
        total: 2,
      });
    });
  });
});
