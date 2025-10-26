import { Automation, AutomationResponse } from './Automation';
import { Agent, AgentResponse } from './Agent';
import { SystemTool, SystemToolResponse } from './SystemTool';
import { MCP, MCPResponse } from './MCP';

export interface ExportMetadata {
  author?: string;
  tags?: string[];
  description?: string;
  environment?: string;
}

export interface AutomationDependencies {
  agents: AgentResponse[];
  tools: SystemToolResponse[];
  mcps: MCPResponse[];
}

// Extended automation data for export (includes additional fields)
export interface ExportAutomationData extends AutomationResponse {
  trigger?: {
    type: string;
    config?: Record<string, unknown>;
  };
  actions?: Array<{
    type: string;
    agentId?: string;
    toolId?: string;
    config?: Record<string, unknown>;
  }>;
}

export interface AutomationExportProps {
  version: string;
  exportedAt: string;
  automation: ExportAutomationData;
  dependencies: AutomationDependencies;
  metadata?: ExportMetadata;
  hash?: string;
}

export interface AutomationExportResponse extends AutomationExportProps {}

/**
 * AutomationExport Entity
 * Represents a complete exportable snapshot of an automation with all dependencies
 */
export class AutomationExport {
  private readonly version: string;
  private readonly exportedAt: string;
  private readonly automation: AutomationResponse;
  private readonly dependencies: AutomationDependencies;
  private readonly metadata?: ExportMetadata;
  private readonly hash?: string;

  constructor(props: AutomationExportProps) {
    this.validateProps(props);
    
    this.version = props.version;
    this.exportedAt = props.exportedAt;
    this.automation = props.automation;
    this.dependencies = props.dependencies;
    this.metadata = props.metadata;
    this.hash = props.hash;
  }

  private validateProps(props: AutomationExportProps): void {
    if (!props.version || props.version.trim() === '') {
      throw new Error('Export version is required');
    }

    if (!props.exportedAt || props.exportedAt.trim() === '') {
      throw new Error('Export date is required');
    }

    if (!props.automation) {
      throw new Error('Automation is required');
    }

    if (!props.dependencies) {
      throw new Error('Dependencies are required');
    }

    if (!Array.isArray(props.dependencies.agents)) {
      throw new Error('Dependencies agents must be an array');
    }

    if (!Array.isArray(props.dependencies.tools)) {
      throw new Error('Dependencies tools must be an array');
    }

    if (!Array.isArray(props.dependencies.mcps)) {
      throw new Error('Dependencies mcps must be an array');
    }
  }

  public getVersion(): string {
    return this.version;
  }

  public getExportedAt(): string {
    return this.exportedAt;
  }

  public getAutomation(): AutomationResponse {
    return this.automation;
  }

  public getDependencies(): AutomationDependencies {
    return this.dependencies;
  }

  public getMetadata(): ExportMetadata | undefined {
    return this.metadata;
  }

  public getHash(): string | undefined {
    return this.hash;
  }

  public toJSON(): AutomationExportResponse {
    return {
      version: this.version,
      exportedAt: this.exportedAt,
      automation: this.automation,
      dependencies: this.dependencies,
      metadata: this.metadata,
      hash: this.hash,
    };
  }

  public static create(
    automation: Automation,
    dependencies: {
      agents: Agent[];
      tools: SystemTool[];
      mcps: MCP[];
    },
    metadata?: ExportMetadata,
    additionalData?: { trigger?: any; actions?: any[] }
  ): AutomationExport {
    const version = '1.0.0';
    const exportedAt = new Date().toISOString();

    const automationResponse = automation.toJSON();
    const agentResponses = dependencies.agents.map(agent => agent.toJSON());
    const toolResponses = dependencies.tools.map(tool => tool.toJSON());
    const mcpResponses = dependencies.mcps.map(mcp => mcp.toJSON());

    // Extend automation data with trigger and actions if provided
    const extendedAutomation: ExportAutomationData = {
      ...automationResponse,
      trigger: additionalData?.trigger,
      actions: additionalData?.actions,
    };

    const exportData = {
      version,
      exportedAt,
      automation: extendedAutomation,
      dependencies: {
        agents: agentResponses,
        tools: toolResponses,
        mcps: mcpResponses,
      },
      metadata,
    };

    // Generate hash for integrity verification
    const hash = AutomationExport.generateHash(exportData);

    return new AutomationExport({
      ...exportData,
      hash,
    });
  }

  private static generateHash(data: any): string {
    // Simple hash generation (in production, use crypto.createHash)
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  public verifyIntegrity(): boolean {
    if (!this.hash) {
      return false;
    }

    const dataWithoutHash = {
      version: this.version,
      exportedAt: this.exportedAt,
      automation: this.automation,
      dependencies: this.dependencies,
      metadata: this.metadata,
    };

    const calculatedHash = AutomationExport.generateHash(dataWithoutHash);
    return calculatedHash === this.hash;
  }
}
