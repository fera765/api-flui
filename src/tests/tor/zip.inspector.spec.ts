/**
 * Zip Inspector Tests
 */

import { ZipInspector } from '../../modules/tools/infra/zip/ZipInspector';
import AdmZip from 'adm-zip';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

describe('ZipInspector', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zip-test-'));
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  async function createTestZip(files: Record<string, string>): Promise<string> {
    const zip = new AdmZip();

    for (const [filename, content] of Object.entries(files)) {
      zip.addFile(filename, Buffer.from(content, 'utf8'));
    }

    const zipPath = path.join(tempDir, 'test.zip');
    zip.writeZip(zipPath);

    return zipPath;
  }

  describe('inspect()', () => {
    it('should validate a valid ZIP', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'dist/index.js': 'module.exports.handler = async () => {};',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.manifest).toEqual(manifest);
    });

    it('should reject ZIP without manifest.json', async () => {
      const zipPath = await createTestZip({
        'dist/index.js': 'code',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('manifest.json not found in ZIP');
    });

    it('should reject ZIP with invalid JSON in manifest', async () => {
      const zipPath = await createTestZip({
        'manifest.json': 'not valid json {',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('manifest.json is not valid JSON');
    });

    it('should reject ZIP without dist folder', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'index.js': 'code',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('dist/ folder not found in ZIP');
    });

    it('should reject ZIP when entry point not found', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'dist/other.js': 'code',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Entry point 'dist/index.js' not found in ZIP");
    });

    it('should detect forbidden files', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'dist/index.js': 'code',
        '.env': 'SECRET=123',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Forbidden file detected'))).toBe(true);
    });

    it('should detect forbidden extensions', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'dist/index.js': 'code',
        'malicious.exe': 'binary',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Forbidden file extension'))).toBe(true);
    });

    it('should warn about suspicious paths', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
        'dist/index.js': 'code',
        'node_modules/package/index.js': 'code',
      });

      const result = await ZipInspector.inspect(zipPath);

      expect(result.warnings).toBeDefined();
      expect(result.warnings!.some(w => w.includes('Suspicious path'))).toBe(true);
    });
  });

  describe('extractManifest()', () => {
    it('should extract manifest from ZIP', async () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
      };

      const zipPath = await createTestZip({
        'manifest.json': JSON.stringify(manifest),
      });

      const extracted = await ZipInspector.extractManifest(zipPath);

      expect(extracted).toEqual(manifest);
    });

    it('should throw when manifest not found', async () => {
      const zipPath = await createTestZip({
        'other.json': '{}',
      });

      await expect(ZipInspector.extractManifest(zipPath)).rejects.toThrow('manifest.json not found');
    });
  });

  describe('calculateHash()', () => {
    it('should calculate SHA256 hash', async () => {
      const zipPath = await createTestZip({
        'file.txt': 'content',
      });

      const hash = await ZipInspector.calculateHash(zipPath);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(64); // SHA256 is 64 hex chars
    });

    it('should return same hash for same content', async () => {
      const zipPath1 = await createTestZip({ 'file.txt': 'content' });
      const zipPath2 = await createTestZip({ 'file.txt': 'content' });

      const hash1 = await ZipInspector.calculateHash(zipPath1);
      const hash2 = await ZipInspector.calculateHash(zipPath2);

      expect(hash1).toBe(hash2);
    });
  });

  describe('extract()', () => {
    it('should extract ZIP to directory', async () => {
      const zipPath = await createTestZip({
        'file1.txt': 'content1',
        'dir/file2.txt': 'content2',
      });

      const extractDir = path.join(tempDir, 'extracted');
      await ZipInspector.extract(zipPath, extractDir);

      const file1 = await fs.readFile(path.join(extractDir, 'file1.txt'), 'utf8');
      const file2 = await fs.readFile(path.join(extractDir, 'dir/file2.txt'), 'utf8');

      expect(file1).toBe('content1');
      expect(file2).toBe('content2');
    });
  });
});
