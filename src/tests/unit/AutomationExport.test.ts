import { AutomationExport } from '@modules/core/domain/AutomationExport';
import { Automation, AutomationStatus } from '@modules/core/domain/Automation';
import { Agent } from '@modules/core/domain/Agent';
import { SystemTool, ToolType } from '@modules/core/domain/SystemTool';
import { MCP, MCPSourceType } from '@modules/core/domain/MCP';

describe('AutomationExport Entity', () => {
  const createSampleAutomation = () => {
    return new Automation({
      id: 'auto-test-1',
      name: 'Test Automation',
      description: 'Test Description',
      nodes: [],
      links: [],
      status: AutomationStatus.IDLE,
    });
  };

  const createSampleAgent = () => {
    return new Agent({
      id: 'agent-test-1',
      name: 'Test Agent',
      prompt: 'Test prompt',
      tools: [],
    });
  };

  const createSampleTool = () => {
    return new SystemTool({
      id: 'tool-test-1',
      name: 'Test Tool',
      type: ToolType.ACTION,
      config: {},
      executor: async () => ({}),
    });
  };

  const createSampleMCP = () => {
    return new MCP({
      id: 'mcp-test-1',
      name: 'Test MCP',
      source: 'npx test',
      sourceType: MCPSourceType.NPX,
      tools: [],
    });
  };

  describe('Creation', () => {
    it('should create export with all required fields', () => {
      const automation = createSampleAutomation();
      const agent = createSampleAgent();
      const tool = createSampleTool();
      const mcp = createSampleMCP();

      const exportEntity = AutomationExport.create(
        automation,
        { agents: [agent], tools: [tool], mcps: [mcp] }
      );

      expect(exportEntity.getVersion()).toBeDefined();
      expect(exportEntity.getExportedAt()).toBeDefined();
      expect(exportEntity.getAutomation()).toBeDefined();
      expect(exportEntity.getDependencies()).toBeDefined();
      expect(exportEntity.getHash()).toBeDefined();
    });

    it('should create export with metadata', () => {
      const automation = createSampleAutomation();
      
      const metadata = {
        author: 'Test Author',
        tags: ['test', 'automation'],
        description: 'Test export',
      };

      const exportEntity = AutomationExport.create(
        automation,
        { agents: [], tools: [], mcps: [] },
        metadata
      );

      expect(exportEntity.getMetadata()).toEqual(metadata);
    });

    it('should generate hash for integrity', () => {
      const automation = createSampleAutomation();
      
      const exportEntity = AutomationExport.create(
        automation,
        { agents: [], tools: [], mcps: [] }
      );

      expect(exportEntity.getHash()).toBeTruthy();
      expect(typeof exportEntity.getHash()).toBe('string');
    });

    it('should throw error if version is missing', () => {
      expect(() => {
        new AutomationExport({
          version: '',
          exportedAt: new Date().toISOString(),
          automation: {} as any,
          dependencies: { agents: [], tools: [], mcps: [] },
        });
      }).toThrow('Export version is required');
    });

    it('should throw error if dependencies is not valid', () => {
      expect(() => {
        new AutomationExport({
          version: '1.0.0',
          exportedAt: new Date().toISOString(),
          automation: {} as any,
          dependencies: { agents: 'invalid' as any, tools: [], mcps: [] },
        });
      }).toThrow('Dependencies agents must be an array');
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON', () => {
      const automation = createSampleAutomation();
      const agent = createSampleAgent();

      const exportEntity = AutomationExport.create(
        automation,
        { agents: [agent], tools: [], mcps: [] }
      );

      const json = exportEntity.toJSON();

      expect(json).toHaveProperty('version');
      expect(json).toHaveProperty('exportedAt');
      expect(json).toHaveProperty('automation');
      expect(json).toHaveProperty('dependencies');
      expect(json).toHaveProperty('hash');
      expect(json.dependencies.agents).toHaveLength(1);
    });
  });

  describe('Integrity Verification', () => {
    it('should verify integrity correctly', () => {
      const automation = createSampleAutomation();
      
      const exportEntity = AutomationExport.create(
        automation,
        { agents: [], tools: [], mcps: [] }
      );

      expect(exportEntity.verifyIntegrity()).toBe(true);
    });

    it('should return false if hash is missing', () => {
      const exportEntity = new AutomationExport({
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        automation: createSampleAutomation().toJSON(),
        dependencies: { agents: [], tools: [], mcps: [] },
      });

      expect(exportEntity.verifyIntegrity()).toBe(false);
    });
  });

  describe('Dependencies', () => {
    it('should include all agent dependencies', () => {
      const automation = createSampleAutomation();
      const agents = [
        createSampleAgent(),
        createSampleAgent(),
        createSampleAgent(),
      ];

      const exportEntity = AutomationExport.create(
        automation,
        { agents, tools: [], mcps: [] }
      );

      expect(exportEntity.getDependencies().agents).toHaveLength(3);
    });

    it('should include all tool dependencies', () => {
      const automation = createSampleAutomation();
      const tools = [
        createSampleTool(),
        createSampleTool(),
      ];

      const exportEntity = AutomationExport.create(
        automation,
        { agents: [], tools, mcps: [] }
      );

      expect(exportEntity.getDependencies().tools).toHaveLength(2);
    });

    it('should include all MCP dependencies', () => {
      const automation = createSampleAutomation();
      const mcps = [createSampleMCP()];

      const exportEntity = AutomationExport.create(
        automation,
        { agents: [], tools: [], mcps }
      );

      expect(exportEntity.getDependencies().mcps).toHaveLength(1);
    });
  });
});
