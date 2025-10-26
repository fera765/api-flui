/**
 * Manifest Validator Tests
 */

import { ManifestValidator } from '../../modules/tools/validators/ManifestValidator';

describe('ManifestValidator', () => {
  describe('validate()', () => {
    it('should validate a valid manifest', () => {
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

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest without name', () => {
      const manifest = {
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'name',
        message: "Field 'name' is required",
      });
    });

    it('should reject manifest without version', () => {
      const manifest = {
        name: 'test-tool',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'version',
        message: "Field 'version' is required",
      });
    });

    it('should reject manifest without outputSchema', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'outputSchema',
        message: "Field 'outputSchema' is required",
      });
    });

    it('should reject invalid semver version', () => {
      const manifest = {
        name: 'test-tool',
        version: 'invalid',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'version',
        message: "Version 'invalid' is not valid semver",
      });
    });

    it('should reject entry without .js extension', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.ts',
        type: 'tool',
        outputSchema: {},
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'entry',
        message: 'Entry must point to a .js file',
      });
    });

    it('should reject invalid capabilities', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
        capabilities: ['invalid-cap'],
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.field === 'capabilities')).toBe(true);
    });

    it('should accept valid capabilities', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
        capabilities: ['network', 'filesystem'],
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(true);
    });

    it('should warn when inputSchema is missing', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: {},
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.warnings).toContain('inputSchema not provided - tool will accept any input');
    });

    it('should validate outputSchema is an object', () => {
      const manifest = {
        name: 'test-tool',
        version: '1.0.0',
        entry: 'dist/index.js',
        type: 'tool',
        outputSchema: 'not-an-object',
      };

      const result = ManifestValidator.validate(manifest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'outputSchema',
        message: 'outputSchema must be a valid JSON Schema object',
      });
    });
  });

  describe('isCompatible()', () => {
    it('should return true when no compatibility specified', () => {
      const manifest: any = {
        name: 'test-tool',
        version: '1.0.0',
      };

      const result = ManifestValidator.isCompatible(manifest, '1.0.0');

      expect(result).toBe(true);
    });

    it('should check coreMin compatibility', () => {
      const manifest: any = {
        compatibility: {
          coreMin: '>=1.0.0',
        },
      };

      expect(ManifestValidator.isCompatible(manifest, '1.0.0')).toBe(true);
      expect(ManifestValidator.isCompatible(manifest, '0.9.0')).toBe(false);
      expect(ManifestValidator.isCompatible(manifest, '2.0.0')).toBe(true);
    });

    it('should check coreMax compatibility', () => {
      const manifest: any = {
        compatibility: {
          coreMax: '<2.0.0',
        },
      };

      expect(ManifestValidator.isCompatible(manifest, '1.0.0')).toBe(true);
      expect(ManifestValidator.isCompatible(manifest, '2.0.0')).toBe(false);
    });
  });
});
