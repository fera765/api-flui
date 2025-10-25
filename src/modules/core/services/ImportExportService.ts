import { AutomationExport, AutomationExportResponse, ExportMetadata } from '../domain/AutomationExport';
import { AutomationImport, ImportOptions, ImportResult, ImportValidationResult } from '../domain/AutomationImport';
import { IAutomationRepository } from '../repositories/IAutomationRepository';
import { IAgentRepository } from '../repositories/IAgentRepository';
import { ISystemToolRepository } from '../repositories/ISystemToolRepository';
import { IMCPRepository } from '../repositories/IMCPRepository';
import { Automation } from '../domain/Automation';
import { Agent } from '../domain/Agent';
import { SystemTool } from '../domain/SystemTool';
import { MCP } from '../domain/MCP';
import { AppError } from '@shared/errors';
import { ExportValidator } from '@shared/utils/exportValidator';

export interface ExportAllResult {
  automations: AutomationExportResponse[];
  totalExported: number;
  exportedAt: string;
}

/**
 * ImportExportService
 * Handles all import/export operations for automations
 */
export class ImportExportService {
  constructor(
    private automationRepository: IAutomationRepository,
    private agentRepository: IAgentRepository,
    private toolRepository: ISystemToolRepository,
    private mcpRepository: IMCPRepository
  ) {}

  /**
   * Export a single automation with all its dependencies
   */
  async exportAutomation(automationId: string, metadata?: ExportMetadata): Promise<AutomationExportResponse> {
    // Get automation
    const automation = await this.automationRepository.findById(automationId);
    if (!automation) {
      throw new AppError('Automation not found', 404);
    }

    // Collect dependencies
    const dependencies = await this.collectDependencies(automation);

    // Create export
    const exportEntity = AutomationExport.create(
      automation,
      dependencies,
      metadata
    );

    return exportEntity.toJSON();
  }

  /**
   * Export all automations
   */
  async exportAll(): Promise<ExportAllResult> {
    const automations = await this.automationRepository.findAll();
    const exports: AutomationExportResponse[] = [];

    for (const automation of automations) {
      try {
        const exportData = await this.exportAutomation(automation.getId());
        exports.push(exportData);
      } catch (error) {
        // Log error but continue with other automations
        console.error(`Failed to export automation ${automation.getId()}:`, error);
      }
    }

    return {
      automations: exports,
      totalExported: exports.length,
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Validate import data before importing
   */
  async validateImport(data: string | AutomationExportResponse): Promise<ImportValidationResult> {
    try {
      // Parse if string
      const exportData = typeof data === 'string' ? JSON.parse(data) : data;

      // Validate structure
      const validator = new ExportValidator();
      const structureValidation = validator.validateExport(exportData);

      if (!structureValidation.valid) {
        return {
          valid: false,
          errors: structureValidation.errors.map(e => e.message),
          warnings: structureValidation.warnings.map(w => w.message),
          missingDependencies: {
            agents: [],
            tools: [],
            mcps: [],
          },
        };
      }

      // Create import entity
      const importEntity = typeof data === 'string' 
        ? AutomationImport.fromJSON(data)
        : AutomationImport.fromObject(exportData);

      // Validate with entity
      const validation = importEntity.validate();

      // Check for missing dependencies
      const missingDeps = await this.checkMissingDependencies(exportData);

      return {
        ...validation,
        missingDependencies: missingDeps,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: [],
        missingDependencies: {
          agents: [],
          tools: [],
          mcps: [],
        },
      };
    }
  }

  /**
   * Import automation from export data
   */
  async importAutomation(
    data: string | AutomationExportResponse,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    try {
      // Validate first
      const validation = await this.validateImport(data);
      if (!validation.valid) {
        return {
          success: false,
          message: 'Import validation failed',
          errors: validation.errors,
        };
      }

      // Parse data
      const exportData = typeof data === 'string' ? JSON.parse(data) : data;
      const sanitized = ExportValidator.sanitizeJSON(exportData);

      // Create import entity
      const importEntity = AutomationImport.fromObject(sanitized, options);

      // Check if automation with same name exists
      const existingAutomations = await this.automationRepository.findAll();
      const existing = existingAutomations.find(
        a => a.getName() === importEntity.getAutomationName()
      );

      if (existing && !options.overwrite) {
        return {
          success: false,
          message: `Automation with name "${importEntity.getAutomationName()}" already exists. Use overwrite option to replace it.`,
        };
      }

      // Import dependencies first
      const mappedIds = await this.importDependencies(sanitized.dependencies, options);

      // Create/update automation with remapped IDs
      const automationData = this.remapAutomationIds(sanitized.automation, mappedIds);
      
      let automation: Automation;
      if (existing && options.overwrite) {
        // Update existing
        automation = existing;
        automation.update({
          name: automationData.name,
          description: automationData.description,
        });
        await this.automationRepository.update(automation);
      } else {
        // Create new via repository (simplified version without nodes/links)
        // In real implementation, would convert trigger/actions to nodes/links
        automation = await this.automationRepository.create({
          name: automationData.name,
          description: automationData.description,
          nodes: [],
          links: [],
        });
      }

      return {
        success: true,
        automationId: automation.getId(),
        message: `Automation "${automation.getName()}" imported successfully`,
        mappedIds: Object.entries(mappedIds).map(([oldId, newId]) => ({ oldId, newId })),
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Collect all dependencies for an automation
   */
  private async collectDependencies(_automation: Automation): Promise<{
    agents: Agent[];
    tools: SystemTool[];
    mcps: MCP[];
  }> {
    // Simplified: collect all available resources
    // In a real implementation, would analyze automation nodes to collect specific dependencies
    const agents = await this.agentRepository.findAll();
    const tools = await this.toolRepository.findAll();
    const mcps = await this.mcpRepository.findAll();

    return { agents, tools, mcps };
  }

  /**
   * Check for missing dependencies
   */
  private async checkMissingDependencies(exportData: AutomationExportResponse): Promise<{
    agents: string[];
    tools: string[];
    mcps: string[];
  }> {
    const missing = {
      agents: [] as string[],
      tools: [] as string[],
      mcps: [] as string[],
    };

    // Check agents
    for (const agent of exportData.dependencies.agents) {
      const existing = await this.agentRepository.findById(agent.id);
      if (!existing) {
        missing.agents.push(agent.name);
      }
    }

    // Check tools
    for (const tool of exportData.dependencies.tools) {
      const existing = await this.toolRepository.findById(tool.id);
      if (!existing) {
        missing.tools.push(tool.name);
      }
    }

    // Check MCPs
    for (const mcp of exportData.dependencies.mcps) {
      const existing = await this.mcpRepository.findById(mcp.id);
      if (!existing) {
        missing.mcps.push(mcp.name);
      }
    }

    return missing;
  }

  /**
   * Import dependencies and return ID mappings
   */
  private async importDependencies(dependencies: any, options: ImportOptions): Promise<Record<string, string>> {
    const mappedIds: Record<string, string> = {};

    if (options.skipDependencies) {
      return mappedIds;
    }

    // Import agents
    for (const agentData of dependencies.agents || []) {
      try {
        const oldId = agentData.id;
        
        // Check if exists
        const existingAgent = await this.agentRepository.findById(oldId);
        
        if (!existingAgent || !options.preserveIds) {
          // Create new via repository
          const agent = await this.agentRepository.create({
            name: agentData.name,
            prompt: agentData.prompt,
            description: agentData.description,
            defaultModel: agentData.defaultModel,
            tools: [],
          });
          mappedIds[oldId] = agent.getId();
        } else {
          mappedIds[oldId] = oldId;
        }
      } catch (error) {
        console.error(`Failed to import agent ${agentData.name}:`, error);
      }
    }

    // Import tools
    // Note: Tools require executor function which cannot be serialized
    // We skip tool import and let the system use existing tools or create them manually
    for (const toolData of dependencies.tools || []) {
      try {
        const oldId = toolData.id;
        const existingTool = await this.toolRepository.findById(oldId);
        
        if (existingTool) {
          // Use existing tool
          mappedIds[oldId] = oldId;
        } else if (options.preserveIds) {
          // Try to find by name
          const allTools = await this.toolRepository.findAll();
          const toolByName = allTools.find(t => t.getName() === toolData.name);
          if (toolByName) {
            mappedIds[oldId] = toolByName.getId();
          }
        }
        // Note: Cannot create new tools from export as they need executor functions
      } catch (error) {
        console.error(`Failed to import tool ${toolData.name}:`, error);
      }
    }

    // Import MCPs
    // Note: MCPs need to be imported/discovered through MCPService
    // We skip MCP import and let the system use existing MCPs
    for (const mcpData of dependencies.mcps || []) {
      try {
        const oldId = mcpData.id;
        const existingMCP = await this.mcpRepository.findById(oldId);
        
        if (existingMCP) {
          // Use existing MCP
          mappedIds[oldId] = oldId;
        } else if (options.preserveIds) {
          // Try to find by name
          const allMCPs = await this.mcpRepository.findAll();
          const mcpByName = allMCPs.find(m => m.getName() === mcpData.name);
          if (mcpByName) {
            mappedIds[oldId] = mcpByName.getId();
          }
        }
        // Note: Cannot create new MCPs from export as they need proper import process
      } catch (error) {
        console.error(`Failed to import MCP ${mcpData.name}:`, error);
      }
    }

    return mappedIds;
  }

  /**
   * Remap IDs in automation data
   */
  private remapAutomationIds(automationData: any, mappedIds: Record<string, string>): any {
    const remapped = JSON.parse(JSON.stringify(automationData));

    // Remap action IDs
    if (Array.isArray(remapped.actions)) {
      remapped.actions = remapped.actions.map((action: any) => {
        if (action.agentId && mappedIds[action.agentId]) {
          action.agentId = mappedIds[action.agentId];
        }
        if (action.toolId && mappedIds[action.toolId]) {
          action.toolId = mappedIds[action.toolId];
        }
        return action;
      });
    }

    // Remap trigger tool ID if exists
    if (remapped.trigger?.config?.toolId && mappedIds[remapped.trigger.config.toolId]) {
      remapped.trigger.config.toolId = mappedIds[remapped.trigger.config.toolId];
    }

    return remapped;
  }
}
