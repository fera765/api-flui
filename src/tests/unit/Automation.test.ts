import { 
  Automation, 
  Node, 
  Link, 
  NodeType, 
  AutomationStatus 
} from '@modules/core/domain/Automation';

describe('Automation Domain', () => {
  describe('Node', () => {
    it('should create a node with all properties', () => {
      const node = new Node({
        id: 'node-1',
        type: NodeType.TRIGGER,
        referenceId: 'trigger-1',
        config: { key: 'value' },
        outputs: { result: 'success' },
      });

      expect(node.getId()).toBe('node-1');
      expect(node.getType()).toBe(NodeType.TRIGGER);
      expect(node.getReferenceId()).toBe('trigger-1');
      expect(node.getConfig()).toEqual({ key: 'value' });
      expect(node.getOutputs()).toEqual({ result: 'success' });
    });

    it('should set outputs', () => {
      const node = new Node({
        id: 'node-1',
        type: NodeType.TOOL,
        referenceId: 'tool-1',
      });

      node.setOutputs({ result: 'test' });
      expect(node.getOutputs()).toEqual({ result: 'test' });
    });

    it('should update config', () => {
      const node = new Node({
        id: 'node-1',
        type: NodeType.AGENT,
        referenceId: 'agent-1',
        config: { initial: true },
      });

      node.updateConfig({ updated: true });
      expect(node.getConfig()).toEqual({ initial: true, updated: true });
    });

    it('should return correct JSON', () => {
      const node = new Node({
        id: 'node-1',
        type: NodeType.TRIGGER,
        referenceId: 'trigger-1',
      });

      const json = node.toJSON();
      expect(json).toEqual({
        id: 'node-1',
        type: NodeType.TRIGGER,
        referenceId: 'trigger-1',
        config: undefined,
        outputs: undefined,
      });
    });
  });

  describe('Link', () => {
    it('should create a link', () => {
      const link = new Link({
        fromNodeId: 'node-1',
        fromOutputKey: 'result',
        toNodeId: 'node-2',
        toInputKey: 'input',
      });

      expect(link.getFromNodeId()).toBe('node-1');
      expect(link.getFromOutputKey()).toBe('result');
      expect(link.getToNodeId()).toBe('node-2');
      expect(link.getToInputKey()).toBe('input');
    });

    it('should return correct JSON', () => {
      const link = new Link({
        fromNodeId: 'node-1',
        fromOutputKey: 'result',
        toNodeId: 'node-2',
        toInputKey: 'input',
      });

      const json = link.toJSON();
      expect(json).toEqual({
        fromNodeId: 'node-1',
        fromOutputKey: 'result',
        toNodeId: 'node-2',
        toInputKey: 'input',
      });
    });
  });

  describe('Automation', () => {
    const createTestAutomation = () => {
      const node1 = new Node({
        id: 'node-1',
        type: NodeType.TRIGGER,
        referenceId: 'trigger-1',
      });

      const node2 = new Node({
        id: 'node-2',
        type: NodeType.TOOL,
        referenceId: 'tool-1',
      });

      const link = new Link({
        fromNodeId: 'node-1',
        fromOutputKey: 'result',
        toNodeId: 'node-2',
        toInputKey: 'input',
      });

      return new Automation({
        id: 'auto-1',
        name: 'Test Automation',
        description: 'Test description',
        nodes: [node1, node2],
        links: [link],
        status: AutomationStatus.IDLE,
      });
    };

    it('should create automation with all properties', () => {
      const automation = createTestAutomation();

      expect(automation.getId()).toBe('auto-1');
      expect(automation.getName()).toBe('Test Automation');
      expect(automation.getDescription()).toBe('Test description');
      expect(automation.getNodes()).toHaveLength(2);
      expect(automation.getLinks()).toHaveLength(1);
      expect(automation.getStatus()).toBe(AutomationStatus.IDLE);
    });

    it('should set status', () => {
      const automation = createTestAutomation();
      automation.setStatus(AutomationStatus.RUNNING);
      expect(automation.getStatus()).toBe(AutomationStatus.RUNNING);
    });

    it('should update automation', () => {
      const automation = createTestAutomation();

      automation.update({
        name: 'Updated Automation',
        description: 'Updated description',
      });

      expect(automation.getName()).toBe('Updated Automation');
      expect(automation.getDescription()).toBe('Updated description');
    });

    it('should get node by id', () => {
      const automation = createTestAutomation();
      const node = automation.getNodeById('node-1');

      expect(node).toBeDefined();
      expect(node?.getId()).toBe('node-1');
    });

    it('should return undefined for non-existent node', () => {
      const automation = createTestAutomation();
      const node = automation.getNodeById('non-existent');

      expect(node).toBeUndefined();
    });

    it('should get links for node', () => {
      const automation = createTestAutomation();
      const links = automation.getLinksForNode('node-1');

      expect(links).toHaveLength(1);
      expect(links[0].getFromNodeId()).toBe('node-1');
    });

    it('should get trigger nodes', () => {
      const automation = createTestAutomation();
      const triggers = automation.getTriggerNodes();

      expect(triggers).toHaveLength(1);
      expect(triggers[0].getType()).toBe(NodeType.TRIGGER);
    });

    it('should return correct JSON', () => {
      const automation = createTestAutomation();
      const json = automation.toJSON();

      expect(json).toHaveProperty('id', 'auto-1');
      expect(json).toHaveProperty('name', 'Test Automation');
      expect(json).toHaveProperty('nodes');
      expect(json).toHaveProperty('links');
      expect(json).toHaveProperty('status', AutomationStatus.IDLE);
    });
  });
});
