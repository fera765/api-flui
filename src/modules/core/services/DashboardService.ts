import { IAgentRepository } from '../repositories/IAgentRepository';
import { IMCPRepository } from '../repositories/IMCPRepository';
import { IAutomationRepository } from '../repositories/IAutomationRepository';
import { ISystemToolRepository } from '../repositories/ISystemToolRepository';

export interface DashboardStats {
  agents: {
    total: number;
  };
  mcps: {
    total: number;
    connected: number;
  };
  automations: {
    total: number;
  };
  tools: {
    system: number;
    mcp: number;
    agent: number;
    total: number;
  };
}

export interface IDashboardService {
  getStats(): Promise<DashboardStats>;
}

export class DashboardService implements IDashboardService {
  constructor(
    private readonly agentRepository: IAgentRepository,
    private readonly mcpRepository: IMCPRepository,
    private readonly automationRepository: IAutomationRepository,
    private readonly systemToolRepository: ISystemToolRepository
  ) {}

  public async getStats(): Promise<DashboardStats> {
    // Get all data in parallel for better performance
    const [agents, mcps, automations, systemTools] = await Promise.all([
      this.agentRepository.findAll(),
      this.mcpRepository.findAll(),
      this.automationRepository.findAll(),
      this.systemToolRepository.findAll(),
    ]);

    // Count MCP tools
    let mcpToolsCount = 0;
    for (const mcp of mcps) {
      const tools = mcp.getTools();
      mcpToolsCount += tools.length;
    }

    // Count agent tools
    let agentToolsCount = 0;
    for (const agent of agents) {
      const tools = agent.getTools();
      agentToolsCount += tools.length;
    }

    // Count connected MCPs (those that have tools)
    const connectedMcps = mcps.filter(mcp => mcp.getTools().length > 0).length;

    return {
      agents: {
        total: agents.length,
      },
      mcps: {
        total: mcps.length,
        connected: connectedMcps,
      },
      automations: {
        total: automations.length,
      },
      tools: {
        system: systemTools.length,
        mcp: mcpToolsCount,
        agent: agentToolsCount,
        total: systemTools.length + mcpToolsCount + agentToolsCount,
      },
    };
  }
}
