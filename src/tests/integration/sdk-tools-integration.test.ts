/**
 * SDK Tools Integration Tests
 * Testa a integração entre SDK e sistema de automação
 */

import { SDKToolAdapter } from '../../adapters/SDKToolAdapter';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { AutomationRepositoryInMemory } from '@modules/core/repositories/AutomationRepositoryInMemory';
import { NodeType } from '@modules/core/domain/Automation';
import { schema } from '../../../sdk/packages/core/src';

describe('SDK Tools Integration', () => {
  let adapter: SDKToolAdapter;
  let toolRepository: SystemToolRepositoryInMemory;
  let automationRepository: AutomationRepositoryInMemory;

  beforeEach(() => {
    toolRepository = new SystemToolRepositoryInMemory();
    automationRepository = new AutomationRepositoryInMemory();
    adapter = new SDKToolAdapter(toolRepository);
  });

  afterEach(() => {
    toolRepository.clear();
    automationRepository.clear();
  });

  describe('Tool Registration', () => {
    it('should register SDK tool and make it available as SystemTool', async () => {
      const sdkTool = {
        name: 'TestTool',
        description: 'A test tool',
        inputSchema: schema.object({ value: schema.string() }),
        outputSchema: schema.object({ result: schema.string() }),
        handler: async (_ctx: any, input: any) => ({
          result: input.value.toUpperCase(),
        }),
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      expect(registration.sdkId).toBeDefined();
      expect(registration.systemId).toBeDefined();
      expect(registration.name).toBe('TestTool');

      // Verify SystemTool was created
      const systemTool = await toolRepository.findById(registration.systemId);
      expect(systemTool).toBeDefined();
      expect(systemTool?.getName()).toBe('TestTool');
    });

    it('should register multiple SDK tools', async () => {
      const tools = [
        {
          name: 'Tool1',
          inputSchema: schema.object({}),
          outputSchema: schema.object({}),
          handler: async () => ({}),
        },
        {
          name: 'Tool2',
          inputSchema: schema.object({}),
          outputSchema: schema.object({}),
          handler: async () => ({}),
        },
      ];

      const registrations = await adapter.registerMultiple(tools);

      expect(registrations).toHaveLength(2);
      expect(registrations[0].name).toBe('Tool1');
      expect(registrations[1].name).toBe('Tool2');

      const allTools = await toolRepository.findAll();
      expect(allTools.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Tool Execution', () => {
    it('should execute SDK tool through SystemTool', async () => {
      const sdkTool = {
        name: 'UpperCaseTool',
        inputSchema: schema.object({ text: schema.string() }),
        outputSchema: schema.object({ result: schema.string() }),
        handler: async (_ctx: any, input: any) => ({
          result: input.text.toUpperCase(),
        }),
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      // Execute via SDK directly
      const result = await adapter.executeTool(registration.sdkId, { text: 'hello' });

      expect(result).toEqual({ result: 'HELLO' });
    });

    it('should execute SDK tool through SystemTool executor', async () => {
      const sdkTool = {
        name: 'DoubleTool',
        inputSchema: schema.object({ number: schema.number() }),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (_ctx: any, input: any) => ({
          result: input.number * 2,
        }),
      };

      const registration = await adapter.registerSDKTool(sdkTool);
      const systemTool = await toolRepository.findById(registration.systemId);

      expect(systemTool).toBeDefined();

      // Execute via adapter directly (SystemTool executor é interno)
      const result = await adapter.executeTool(registration.sdkId, { number: 5 });

      expect(result).toEqual({ result: 10 });
    });
  });

  describe('Automation Integration', () => {
    it('should use SDK tool in automation node', async () => {
      const sdkTool = {
        name: 'EmailValidator',
        inputSchema: schema.object({ email: schema.string() }),
        outputSchema: schema.object({
          valid: schema.boolean(),
          domain: schema.string(),
        }),
        handler: async (_ctx: any, input: any) => {
          const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email);
          const domain = input.email.split('@')[1] || '';
          return { valid, domain };
        },
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      // Create automation with SDK tool
      const automation = await automationRepository.create({
        name: 'Email Validation Flow',
        nodes: [
          {
            id: 'trigger',
            type: NodeType.TRIGGER,
            referenceId: 'manual',
            config: {},
          },
          {
            id: 'validate',
            type: NodeType.TOOL,
            referenceId: registration.systemId, // ← SDK tool
            config: {},
          },
        ],
        links: [
          {
            fromNodeId: 'trigger',
            toNodeId: 'validate',
            fromOutputKey: 'output',
            toInputKey: 'input',
          },
        ],
      });

      expect(automation.getNodes()).toHaveLength(2);
      expect(automation.getNodes()[1].getReferenceId()).toBe(registration.systemId);
    });

    it('should chain multiple SDK tools in automation', async () => {
      const tool1 = {
        name: 'ExtractDomain',
        inputSchema: schema.object({ email: schema.string() }),
        outputSchema: schema.object({ domain: schema.string() }),
        handler: async (_ctx: any, input: any) => ({
          domain: input.email.split('@')[1] || '',
        }),
      };

      const tool2 = {
        name: 'AnalyzeDomain',
        inputSchema: schema.object({ domain: schema.string() }),
        outputSchema: schema.object({
          length: schema.number(),
          tld: schema.string(),
        }),
        handler: async (_ctx: any, input: any) => ({
          length: input.domain.length,
          tld: input.domain.split('.').pop() || '',
        }),
      };

      const reg1 = await adapter.registerSDKTool(tool1);
      const reg2 = await adapter.registerSDKTool(tool2);

      const automation = await automationRepository.create({
        name: 'Email Domain Analysis',
        nodes: [
          {
            id: 'trigger',
            type: NodeType.TRIGGER,
            referenceId: 'webhook',
            config: {},
          },
          {
            id: 'extract',
            type: NodeType.TOOL,
            referenceId: reg1.systemId,
            config: {},
          },
          {
            id: 'analyze',
            type: NodeType.TOOL,
            referenceId: reg2.systemId,
            config: {},
          },
        ],
        links: [
          {
            fromNodeId: 'trigger',
            toNodeId: 'extract',
            fromOutputKey: 'output',
            toInputKey: 'input',
          },
          {
            fromNodeId: 'extract',
            toNodeId: 'analyze',
            fromOutputKey: 'output',
            toInputKey: 'input',
          },
        ],
      });

      expect(automation.getNodes()).toHaveLength(3);
      
      // Verify both SDK tools are in the flow
      const toolNodes = automation.getNodes().filter(n => n.getType() === NodeType.TOOL);
      expect(toolNodes).toHaveLength(2);
    });
  });

  describe('Tool Discovery', () => {
    it('should list all registered SDK tools', async () => {
      const tools = [
        {
          name: 'Tool1',
          inputSchema: schema.object({}),
          outputSchema: schema.object({}),
          handler: async () => ({}),
        },
        {
          name: 'Tool2',
          inputSchema: schema.object({}),
          outputSchema: schema.object({}),
          handler: async () => ({}),
        },
      ];

      await adapter.registerMultiple(tools);

      const sdkTools = await adapter.listSDKTools();

      expect(sdkTools).toHaveLength(2);
      expect(sdkTools.map((t: any) => t.name)).toContain('Tool1');
      expect(sdkTools.map((t: any) => t.name)).toContain('Tool2');
    });

    it('should find tool by name', async () => {
      const sdkTool = {
        name: 'FindMeTool',
        inputSchema: schema.object({}),
        outputSchema: schema.object({}),
        handler: async () => ({}),
      };

      await adapter.registerSDKTool(sdkTool);

      const found = await adapter.getSystemToolByName('FindMeTool');

      expect(found).toBeDefined();
      expect(found?.getName()).toBe('FindMeTool');
    });
  });

  describe('Error Handling', () => {
    it('should handle SDK tool execution errors', async () => {
      const sdkTool = {
        name: 'ErrorTool',
        inputSchema: schema.object({}),
        outputSchema: schema.object({}),
        handler: async () => {
          throw new Error('Intentional error');
        },
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      await expect(
        adapter.executeTool(registration.sdkId, {})
      ).rejects.toThrow();
    });

    it('should validate input schema', async () => {
      const sdkTool = {
        name: 'StrictTool',
        inputSchema: schema.object({ number: schema.number() }),
        outputSchema: schema.object({ result: schema.number() }),
        handler: async (_ctx: any, input: any) => ({
          result: input.number * 2,
        }),
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      // Invalid input (string instead of number)
      await expect(
        adapter.executeTool(registration.sdkId, { number: 'not-a-number' })
      ).rejects.toThrow();
    });
  });

  describe('Tool Lifecycle', () => {
    it('should unregister SDK tool', async () => {
      const sdkTool = {
        name: 'TemporaryTool',
        inputSchema: schema.object({}),
        outputSchema: schema.object({}),
        handler: async () => ({}),
      };

      const registration = await adapter.registerSDKTool(sdkTool);

      // Verify it exists
      let tools = await adapter.listSDKTools();
      expect(tools.some((t: any) => t.name === 'TemporaryTool')).toBe(true);

      // Unregister
      await adapter.unregisterSDKTool(registration.sdkId);

      // Verify it's gone
      tools = await adapter.listSDKTools();
      expect(tools.some((t: any) => t.name === 'TemporaryTool')).toBe(false);
    });
  });
});
