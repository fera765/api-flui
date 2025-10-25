import { AutomationExecutor } from '@modules/core/services/automation/AutomationExecutor';
import { SystemToolRepositoryInMemory } from '@modules/core/repositories/SystemToolRepositoryInMemory';
import { AgentRepositoryInMemory } from '@modules/core/repositories/AgentRepositoryInMemory';
import { Automation, Node, Link, NodeType, AutomationStatus } from '@modules/core/domain/Automation';
import { ToolType } from '@modules/core/domain/SystemTool';

describe('AutomationExecutor', () => {
  let executor: AutomationExecutor;
  let toolRepository: SystemToolRepositoryInMemory;
  let agentRepository: AgentRepositoryInMemory;

  beforeEach(() => {
    toolRepository = new SystemToolRepositoryInMemory();
    agentRepository = new AgentRepositoryInMemory();
    executor = new AutomationExecutor(toolRepository, agentRepository);
  });

  const mockExecutor = async (input: unknown) => ({ result: input });

  describe('execute', () => {
    it('should execute automation with trigger node', async () => {
      // Create a tool
      const tool = await toolRepository.create({
        name: 'TestTrigger',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      // Create automation
      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: tool.getId(),
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      const context = await executor.execute(automation, { test: 'data' });

      expect(context.automationId).toBe('auto-1');
      expect(context.executedNodes.size).toBe(1);
      expect(automation.getStatus()).toBe(AutomationStatus.COMPLETED);
    });

    it('should throw error when no trigger nodes', async () => {
      const toolNode = new Node({
        id: 'tool-1',
        type: NodeType.TOOL,
        referenceId: 'some-tool',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [toolNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Automation must have at least one trigger node');
    });

    it('should execute connected nodes', async () => {
      // Create tools
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ output: 'trigger result' }),
      });

      const tool = await toolRepository.create({
        name: 'Tool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ processed: input }),
      });

      // Create automation with connected nodes
      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const toolNode = new Node({
        id: 'tool-1',
        type: NodeType.TOOL,
        referenceId: tool.getId(),
      });

      const link = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'output',
        toNodeId: 'tool-1',
        toInputKey: 'input',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode, toolNode],
        links: [link],
        status: AutomationStatus.IDLE,
      });

      const context = await executor.execute(automation);

      expect(context.executedNodes.size).toBe(2);
      expect(automation.getStatus()).toBe(AutomationStatus.COMPLETED);
    });

    it('should handle execution errors', async () => {
      const tool = await toolRepository.create({
        name: 'FailingTool',
        type: ToolType.TRIGGER,
        executor: async () => {
          throw new Error('Execution failed');
        },
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: tool.getId(),
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Execution failed');

      expect(automation.getStatus()).toBe(AutomationStatus.ERROR);
    });

    it('should notify listeners on node execution', async () => {
      const tool = await toolRepository.create({
        name: 'TestTool',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: tool.getId(),
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      const listener = jest.fn();
      executor.addListener(listener);

      await executor.execute(automation);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          nodeId: 'trigger-1',
          status: 'success',
        })
      );

      executor.removeListener(listener);
    });

    it('should execute agent node', async () => {
      const agent = await agentRepository.create({
        name: 'TestAgent',
        prompt: 'Test prompt',
        tools: [],
      });

      const agentNode = new Node({
        id: 'agent-1',
        type: NodeType.AGENT,
        referenceId: agent.getId(),
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [agentNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      // Add a trigger to start execution
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const link = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'result',
        toNodeId: 'agent-1',
        toInputKey: 'input',
      });

      automation.update({
        nodes: [
          { id: triggerNode.getId(), type: triggerNode.getType(), referenceId: triggerNode.getReferenceId() },
          { id: agentNode.getId(), type: agentNode.getType(), referenceId: agentNode.getReferenceId() },
        ],
        links: [link.toJSON()],
      });

      const context = await executor.execute(automation);

      expect(context.executedNodes.has('agent-1')).toBe(true);
    });

    it('should throw error when trigger tool not found', async () => {
      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: 'non-existent-tool',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Trigger tool not found');
    });

    it('should throw error when action tool not found', async () => {
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const toolNode = new Node({
        id: 'tool-1',
        type: NodeType.TOOL,
        referenceId: 'non-existent-tool',
      });

      const link = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'result',
        toNodeId: 'tool-1',
        toInputKey: 'input',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode, toolNode],
        links: [link],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Tool not found');
    });

    it('should throw error when agent not found', async () => {
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const agentNode = new Node({
        id: 'agent-1',
        type: NodeType.AGENT,
        referenceId: 'non-existent-agent',
      });

      const link = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'result',
        toNodeId: 'agent-1',
        toInputKey: 'input',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode, agentNode],
        links: [link],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Agent not found');
    });

    it('should throw error when target node not found in link', async () => {
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const link = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'result',
        toNodeId: 'non-existent-node',
        toInputKey: 'input',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [link],
        status: AutomationStatus.IDLE,
      });

      await expect(
        executor.execute(automation)
      ).rejects.toThrow('Target node not found');
    });

    it('should handle listener errors gracefully', async () => {
      const tool = await toolRepository.create({
        name: 'TestTool',
        type: ToolType.TRIGGER,
        executor: mockExecutor,
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: tool.getId(),
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode],
        links: [],
        status: AutomationStatus.IDLE,
      });

      // Add a listener that throws an error
      const failingListener = jest.fn(() => {
        throw new Error('Listener error');
      });
      executor.addListener(failingListener);

      // Execution should continue despite listener error
      await expect(
        executor.execute(automation)
      ).resolves.toBeDefined();

      executor.removeListener(failingListener);
    });

    it('should skip already executed nodes to avoid loops', async () => {
      const trigger = await toolRepository.create({
        name: 'Trigger',
        type: ToolType.TRIGGER,
        executor: async () => ({ output: 'test' }),
      });

      const tool = await toolRepository.create({
        name: 'Tool',
        type: ToolType.ACTION,
        executor: async (input: unknown) => ({ processed: input }),
      });

      const triggerNode = new Node({
        id: 'trigger-1',
        type: NodeType.TRIGGER,
        referenceId: trigger.getId(),
      });

      const toolNode = new Node({
        id: 'tool-1',
        type: NodeType.TOOL,
        referenceId: tool.getId(),
      });

      // Create a circular link (will be prevented)
      const link1 = new Link({
        fromNodeId: 'trigger-1',
        fromOutputKey: 'output',
        toNodeId: 'tool-1',
        toInputKey: 'input',
      });

      const link2 = new Link({
        fromNodeId: 'tool-1',
        fromOutputKey: 'processed',
        toNodeId: 'tool-1',
        toInputKey: 'input',
      });

      const automation = new Automation({
        id: 'auto-1',
        name: 'Test',
        nodes: [triggerNode, toolNode],
        links: [link1, link2],
        status: AutomationStatus.IDLE,
      });

      const context = await executor.execute(automation);

      // Should execute only 2 nodes (trigger and tool once)
      expect(context.executedNodes.size).toBe(2);
    });
  });
});
