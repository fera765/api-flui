/**
 * Manifest Validator
 * Valida o manifest.json de uma tool importada
 */

import { ToolManifest } from '../domain/Tool';
import * as semver from 'semver';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: string[];
}

export class ManifestValidator {
  private static REQUIRED_FIELDS = ['name', 'version', 'entry', 'type', 'outputSchema'];
  private static VALID_TYPES = ['tool'];
  private static ALLOWED_CAPABILITIES = ['network', 'filesystem', 'spawn', 'env'];

  /**
   * Valida um manifest completo
   */
  public static validate(manifest: any, allowedCapabilities?: string[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: string[] = [];

    // Validar se é objeto
    if (!manifest || typeof manifest !== 'object') {
      return {
        valid: false,
        errors: [{ field: 'manifest', message: 'Manifest must be a valid object' }],
      };
    }

    // Validar campos obrigatórios
    for (const field of this.REQUIRED_FIELDS) {
      if (!manifest[field]) {
        errors.push({
          field,
          message: `Field '${field}' is required`,
        });
      }
    }

    // Validar name
    if (manifest.name) {
      if (typeof manifest.name !== 'string' || manifest.name.trim() === '') {
        errors.push({
          field: 'name',
          message: 'Name must be a non-empty string',
        });
      }
    }

    // Validar version (semver)
    if (manifest.version) {
      if (!semver.valid(manifest.version)) {
        errors.push({
          field: 'version',
          message: `Version '${manifest.version}' is not valid semver`,
        });
      }
    }

    // Validar entry
    if (manifest.entry) {
      if (typeof manifest.entry !== 'string') {
        errors.push({
          field: 'entry',
          message: 'Entry must be a string',
        });
      } else if (!manifest.entry.endsWith('.js')) {
        errors.push({
          field: 'entry',
          message: 'Entry must point to a .js file',
        });
      }
    }

    // Validar type
    if (manifest.type && !this.VALID_TYPES.includes(manifest.type)) {
      errors.push({
        field: 'type',
        message: `Type must be one of: ${this.VALID_TYPES.join(', ')}`,
      });
    }

    // Validar outputSchema (obrigatório)
    if (manifest.outputSchema === undefined) {
      errors.push({
        field: 'outputSchema',
        message: 'outputSchema is required',
      });
    } else if (typeof manifest.outputSchema !== 'object') {
      errors.push({
        field: 'outputSchema',
        message: 'outputSchema must be a valid JSON Schema object',
      });
    }

    // Validar inputSchema (opcional mas recomendado)
    if (!manifest.inputSchema) {
      warnings.push('inputSchema not provided - tool will accept any input');
    }

    // Validar capabilities
    if (manifest.capabilities) {
      if (!Array.isArray(manifest.capabilities)) {
        errors.push({
          field: 'capabilities',
          message: 'Capabilities must be an array',
        });
      } else {
        const allowed = allowedCapabilities || this.ALLOWED_CAPABILITIES;
        for (const cap of manifest.capabilities) {
          if (!allowed.includes(cap)) {
            errors.push({
              field: 'capabilities',
              message: `Capability '${cap}' is not allowed. Allowed: ${allowed.join(', ')}`,
            });
          }
        }
      }
    }

    // Validar compatibility
    if (manifest.compatibility) {
      if (manifest.compatibility.coreMin && !semver.validRange(manifest.compatibility.coreMin)) {
        errors.push({
          field: 'compatibility.coreMin',
          message: 'coreMin must be a valid semver range',
        });
      }
      if (manifest.compatibility.coreMax && !semver.validRange(manifest.compatibility.coreMax)) {
        errors.push({
          field: 'compatibility.coreMax',
          message: 'coreMax must be a valid semver range',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Valida compatibilidade com versão do core
   */
  public static isCompatible(manifest: ToolManifest, coreVersion: string): boolean {
    if (!manifest.compatibility) {
      return true; // Se não especificou, assume compatível
    }

    if (manifest.compatibility.coreMin && !semver.satisfies(coreVersion, manifest.compatibility.coreMin)) {
      return false;
    }

    if (manifest.compatibility.coreMax && !semver.satisfies(coreVersion, manifest.compatibility.coreMax)) {
      return false;
    }

    return true;
  }
}
