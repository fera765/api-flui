import { DashboardService } from '@modules/core/services/DashboardService';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { MCPRepositoryInMemory } from '@modules/core/repositories/MCPRepositoryInMemory';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { Tool } from '@modules/core/domain/Tool';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('DashboardService', () => {
  let dashboardService: DashboardService;
  let agentRepository: AgentRepositoryInMemory;
  let mcpRepository: MCPRepositoryInMemory;
  let automationRepository: AutomationRepositoryInMemory;
  let systemToolRepository: SystemToolRepositoryInMemory;

  beforeEach(() => {
    agentRepository = new AgentRepositoryInMemory();
    mcpRepository = new MCPRepositoryInMemory();
    automationRepository = new AutomationRepositoryInMemory();
    systemToolRepository = new SystemToolRepositoryInMemory();
    
    dashboardService = new DashboardService(
      agentRepository,
      mcpRepository,
      automationRepository,
      systemToolRepository
    );
  });

  afterEach(() => {
    agentRepository.clear();
    mcpRepository.clear();
    automationRepository.clear();
    systemToolRepository.clear();
  });

  describe('getStats', () => {
    it('should return empty stats when no data exists', async () => {
      const stats = await dashboardService.getStats();

      expect(stats).toEqual({
        agents: {
          total: 0,
        },
        mcps: {
          total: 0,
          connected: 0,
        },
        automations: {
          total: 0,
        },
        tools: {
          system: 0,
          mcp: 0,
          agent: 0,
          total: 0,
        },
      });
    });

    it('should count agents correctly', async () => {
      await agentRepository.create({
        name: 'Agent 1',
        prompt: 'Test prompt',
        tools: [],
      });

      await agentRepository.create({
        name: 'Agent 2',
        prompt: 'Test prompt 2',
        tools: [],
      });

      const stats = await dashboardService.getStats();

      expect(stats.agents.total).toBe(2);
    });

    it('should count MCPs correctly', async () => {
      await mcpRepository.create({
        name: 'MCP 1',
        source: '@test/mcp1',
      }, []);

      await mcpRepository.create({
        name: 'MCP 2',
        source: '@test/mcp2',
      }, []);

      const stats = await dashboardService.getStats();

      expect(stats.mcps.total).toBe(2);
    });

    it('should count automations correctly', async () => {
      await automationRepository.create({
        name: 'Automation 1',
        description: 'Test automation',
        nodes: [],
        links: [],
      });

      const stats = await dashboardService.getStats();

      expect(stats.automations.total).toBe(1);
    });

    it('should count system tools correctly', async () => {
      await systemToolRepository.create({
        name: 'Tool 1',
        type: ToolType.ACTION,
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });

      await systemToolRepository.create({
        name: 'Tool 2',
        type: ToolType.ACTION,
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });

      const stats = await dashboardService.getStats();

      expect(stats.tools.system).toBe(2);
      expect(stats.tools.total).toBe(2);
    });

    it('should count connected MCPs correctly', async () => {
      const tool1 = new Tool({
        id: 'mcp1-tool1',
        name: 'MCP1 Tool 1',
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });

      await mcpRepository.create({
        name: 'MCP 1',
        source: '@test/mcp1',
      }, [tool1]);

      await mcpRepository.create({
        name: 'MCP 2',
        source: '@test/mcp2',
      }, []);

      const stats = await dashboardService.getStats();

      expect(stats.mcps.total).toBe(2);
      expect(stats.mcps.connected).toBe(1);
      expect(stats.tools.mcp).toBe(1);
    });

    it('should count all tool types correctly', async () => {
      // System tools
      await systemToolRepository.create({
        name: 'System Tool',
        type: ToolType.ACTION,
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });

      // MCP tools
      const mcpTool = new Tool({
        id: 'mcp-tool',
        name: 'MCP Tool',
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });
      
      await mcpRepository.create({
        name: 'MCP',
        source: '@test/mcp',
      }, [mcpTool]);

      // Agent tools
      await agentRepository.create({
        name: 'Agent',
        prompt: 'Test',
        tools: [
          {
            id: 'agent-tool',
            name: 'Agent Tool',
            inputSchema: {},
            outputSchema: {},
          },
        ],
      });

      const stats = await dashboardService.getStats();

      expect(stats.tools.system).toBe(1);
      expect(stats.tools.mcp).toBe(1);
      expect(stats.tools.agent).toBe(1);
      expect(stats.tools.total).toBe(3);
    });

    it('should return comprehensive stats', async () => {
      // Create agents
      await agentRepository.create({
        name: 'Agent 1',
        prompt: 'Prompt 1',
        tools: [],
      });

      // Create MCPs
      const tool = new Tool({
        id: 'tool-1',
        name: 'Tool 1',
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });
      
      await mcpRepository.create({
        name: 'MCP 1',
        source: '@test/mcp',
      }, [tool]);

      // Create automations
      await automationRepository.create({
        name: 'Automation 1',
        description: 'Test',
        nodes: [],
        links: [],
      });

      // Create system tools
      await systemToolRepository.create({
        name: 'System Tool',
        type: ToolType.ACTION,
        inputSchema: {},
        outputSchema: {},
        executor: async () => ({}),
      });

      const stats = await dashboardService.getStats();

      expect(stats).toEqual({
        agents: {
          total: 1,
        },
        mcps: {
          total: 1,
          connected: 1,
        },
        automations: {
          total: 1,
        },
        tools: {
          system: 1,
          mcp: 1,
          agent: 0,
          total: 2,
        },
      });
    });
  });
});
