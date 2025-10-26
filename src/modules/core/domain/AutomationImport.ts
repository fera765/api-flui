import { AutomationExportResponse } from './AutomationExport';

export interface ImportOptions {
  overwrite?: boolean;
  preserveIds?: boolean;
  skipDependencies?: boolean;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingDependencies: {
    agents: string[];
    tools: string[];
    mcps: string[];
  };
}

export interface ImportResult {
  success: boolean;
  automationId?: string;
  message: string;
  mappedIds?: {
    oldId: string;
    newId: string;
  }[];
  errors?: string[];
}

/**
 * AutomationImport Entity
 * Handles the import process and validation of automation exports
 */
export class AutomationImport {
  private readonly exportData: AutomationExportResponse;
  private readonly options: ImportOptions;

  constructor(exportData: AutomationExportResponse, options: ImportOptions = {}) {
    this.validateExportData(exportData);
    
    this.exportData = exportData;
    this.options = {
      overwrite: options.overwrite ?? false,
      preserveIds: options.preserveIds ?? false,
      skipDependencies: options.skipDependencies ?? false,
    };
  }

  private validateExportData(data: AutomationExportResponse): void {
    if (!data) {
      throw new Error('Export data is required');
    }

    if (!data.version) {
      throw new Error('Export version is missing');
    }

    if (!data.automation) {
      throw new Error('Automation data is missing');
    }

    if (!data.dependencies) {
      throw new Error('Dependencies are missing');
    }

    // Validate structure
    if (!data.automation.name) {
      throw new Error('Automation name is missing');
    }

    // Accept EITHER trigger/actions OR nodes/links format
    const hasOldFormat = data.automation.trigger && Array.isArray(data.automation.actions);
    const hasNewFormat = Array.isArray((data.automation as any).nodes) && Array.isArray((data.automation as any).links);

    if (!hasOldFormat && !hasNewFormat) {
      throw new Error('Automation must have either trigger/actions or nodes/links');
    }
  }

  public getExportData(): AutomationExportResponse {
    return this.exportData;
  }

  public getOptions(): ImportOptions {
    return this.options;
  }

  public validate(): ImportValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingDependencies = {
      agents: [] as string[],
      tools: [] as string[],
      mcps: [] as string[],
    };

    try {
      // Already validated in constructor, so just return success
      // Validate version compatibility
      if (!this.isVersionCompatible(this.exportData.version)) {
        warnings.push(`Export version ${this.exportData.version} may not be fully compatible`);
      }

      // Validate hash integrity
      if (this.exportData.hash) {
        // Hash validation would be done in service layer with actual hash calculation
        // Here we just check if it exists
      }

      // Check for required fields
      if (!this.exportData.automation.name) {
        errors.push('Automation name is required');
      }

      if (!this.exportData.automation.trigger) {
        errors.push('Automation trigger is required');
      }

      if (!this.exportData.automation.actions || this.exportData.automation.actions.length === 0) {
        errors.push('Automation must have at least one action');
      }

      // Check dependencies
      if (!this.options.skipDependencies) {
        // Note: Actual dependency checking would be done in service layer
        // This is just structural validation
        if (this.exportData.dependencies.agents.length === 0 && 
            this.exportData.dependencies.tools.length === 0 && 
            this.exportData.dependencies.mcps.length === 0) {
          warnings.push('No dependencies found');
        }
      }

    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown validation error');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      missingDependencies,
    };
  }

  private isVersionCompatible(version: string): boolean {
    // Simple version compatibility check
    // In production, use semver comparison
    const [major] = version.split('.');
    return major === '1';
  }

  public getAutomationName(): string {
    return this.exportData.automation.name;
  }

  public getVersion(): string {
    return this.exportData.version;
  }

  public getMetadata(): any {
    return this.exportData.metadata;
  }

  public static fromJSON(json: string, options?: ImportOptions): AutomationImport {
    try {
      const data = JSON.parse(json);
      return new AutomationImport(data, options);
    } catch (error) {
      throw new Error('Invalid JSON format: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public static fromObject(data: AutomationExportResponse, options?: ImportOptions): AutomationImport {
    return new AutomationImport(data, options);
  }
}
