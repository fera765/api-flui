// Export validator utilities

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * ExportValidator
 * Validates the structure and integrity of automation exports
 */
export class ExportValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  public validateExport(data: any): { valid: boolean; errors: ValidationError[]; warnings: ValidationError[] } {
    this.errors = [];
    this.warnings = [];

    this.validateRequired(data);
    this.validateVersion(data);
    this.validateAutomation(data);
    this.validateDependencies(data);
    this.validateMetadata(data);

    return {
      valid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private validateRequired(data: any): void {
    if (!data) {
      this.errors.push({
        field: 'root',
        message: 'Export data is null or undefined',
        severity: 'error',
      });
      return;
    }

    const requiredFields = ['version', 'exportedAt', 'automation', 'dependencies'];
    for (const field of requiredFields) {
      if (!data[field]) {
        this.errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'error',
        });
      }
    }
  }

  private validateVersion(data: any): void {
    if (!data.version) return;

    if (typeof data.version !== 'string') {
      this.errors.push({
        field: 'version',
        message: 'Version must be a string',
        severity: 'error',
      });
      return;
    }

    // Validate semver format
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(data.version)) {
      this.warnings.push({
        field: 'version',
        message: 'Version does not follow semver format (x.y.z)',
        severity: 'warning',
      });
    }
  }

  private validateAutomation(data: any): void {
    if (!data.automation) return;

    const automation = data.automation;

    // Required automation fields
    if (!automation.name || automation.name.trim() === '') {
      this.errors.push({
        field: 'automation.name',
        message: 'Automation name is required',
        severity: 'error',
      });
    }

    if (!automation.trigger) {
      this.errors.push({
        field: 'automation.trigger',
        message: 'Automation trigger is required',
        severity: 'error',
      });
    }

    if (!Array.isArray(automation.actions)) {
      this.errors.push({
        field: 'automation.actions',
        message: 'Automation actions must be an array',
        severity: 'error',
      });
    } else if (automation.actions.length === 0) {
      this.errors.push({
        field: 'automation.actions',
        message: 'Automation must have at least one action',
        severity: 'error',
      });
    }

    // Validate trigger structure
    if (automation.trigger) {
      if (!automation.trigger.type) {
        this.errors.push({
          field: 'automation.trigger.type',
          message: 'Trigger type is required',
          severity: 'error',
        });
      }

      if (!automation.trigger.config) {
        this.warnings.push({
          field: 'automation.trigger.config',
          message: 'Trigger config is missing',
          severity: 'warning',
        });
      }
    }

    // Validate actions
    if (Array.isArray(automation.actions)) {
      automation.actions.forEach((action: any, index: number) => {
        if (!action.type) {
          this.errors.push({
            field: `automation.actions[${index}].type`,
            message: 'Action type is required',
            severity: 'error',
          });
        }

        const validActionTypes = ['agent', 'tool', 'condition'];
        if (action.type && !validActionTypes.includes(action.type)) {
          this.warnings.push({
            field: `automation.actions[${index}].type`,
            message: `Unknown action type: ${action.type}`,
            severity: 'warning',
          });
        }
      });
    }
  }

  private validateDependencies(data: any): void {
    if (!data.dependencies) return;

    const dependencies = data.dependencies;

    // Validate structure
    const requiredDependencyFields = ['agents', 'tools', 'mcps'];
    for (const field of requiredDependencyFields) {
      if (!Array.isArray(dependencies[field])) {
        this.errors.push({
          field: `dependencies.${field}`,
          message: `${field} must be an array`,
          severity: 'error',
        });
      }
    }

    // Validate agents
    if (Array.isArray(dependencies.agents)) {
      dependencies.agents.forEach((agent: any, index: number) => {
        if (!agent.name) {
          this.errors.push({
            field: `dependencies.agents[${index}].name`,
            message: 'Agent name is required',
            severity: 'error',
          });
        }
      });
    }

    // Validate tools
    if (Array.isArray(dependencies.tools)) {
      dependencies.tools.forEach((tool: any, index: number) => {
        if (!tool.name) {
          this.errors.push({
            field: `dependencies.tools[${index}].name`,
            message: 'Tool name is required',
            severity: 'error',
          });
        }

        if (!tool.type) {
          this.errors.push({
            field: `dependencies.tools[${index}].type`,
            message: 'Tool type is required',
            severity: 'error',
          });
        }
      });
    }

    // Validate MCPs
    if (Array.isArray(dependencies.mcps)) {
      dependencies.mcps.forEach((mcp: any, index: number) => {
        if (!mcp.name) {
          this.errors.push({
            field: `dependencies.mcps[${index}].name`,
            message: 'MCP name is required',
            severity: 'error',
          });
        }

        if (!mcp.command) {
          this.errors.push({
            field: `dependencies.mcps[${index}].command`,
            message: 'MCP command is required',
            severity: 'error',
          });
        }
      });
    }
  }

  private validateMetadata(data: any): void {
    if (!data.metadata) return;

    const metadata = data.metadata;

    if (metadata.tags && !Array.isArray(metadata.tags)) {
      this.warnings.push({
        field: 'metadata.tags',
        message: 'Tags should be an array',
        severity: 'warning',
      });
    }

    if (metadata.author && typeof metadata.author !== 'string') {
      this.warnings.push({
        field: 'metadata.author',
        message: 'Author should be a string',
        severity: 'warning',
      });
    }

    if (metadata.description && typeof metadata.description !== 'string') {
      this.warnings.push({
        field: 'metadata.description',
        message: 'Description should be a string',
        severity: 'warning',
      });
    }
  }

  public static isValidJSON(str: string): boolean {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  }

  public static sanitizeJSON(data: any): any {
    // Remove potentially dangerous fields
    const sanitized = JSON.parse(JSON.stringify(data));

    // Remove scripts or code execution fields if they exist
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    
    const removeDangerousFields = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      if (Array.isArray(obj)) {
        return obj.map(removeDangerousFields);
      }

      const cleaned: any = {};
      for (const key of Object.keys(obj)) {
        if (!dangerousFields.includes(key)) {
          cleaned[key] = removeDangerousFields(obj[key]);
        }
      }
      return cleaned;
    };

    return removeDangerousFields(sanitized);
  }
}
