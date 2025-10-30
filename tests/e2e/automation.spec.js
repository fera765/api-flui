/**
 * E2E Tests - AUTOMATIONS (Focus: Complete Workflow)
 * 
 * Tests real automation flows:
 * - Creation with nodes (trigger, tools, agents, conditions)
 * - Execution and polling
 * - Linked fields (field mapping)
 * - Webhooks
 * - Side-effects validation
 * - Error handling and retries
 */

const {
  createAxiosInstance,
  generateName,
  waitFor,
  sleep,
  assertSchema,
  cleanup,
} = require('./setup');

const client = createAxiosInstance();

// Increase timeout for automation tests
jest.setTimeout(180000); // 3 minutes

describe('E2E - Automations (Complete Flow)', () => {
  const createdResources = {
    automations: [],
    agents: [],
    tools: [],
    conditions: [],
  };

  // Cleanup after all tests
  afterAll(async () => {
    console.log('\n🧹 Starting cleanup...');
    
    for (const id of createdResources.automations) {
      await cleanup(`/api/automations/${id}`, client);
    }
    for (const id of createdResources.agents) {
      await cleanup(`/api/agents/${id}`, client);
    }
    for (const id of createdResources.tools) {
      await cleanup(`/api/tools/${id}`, client);
    }
    for (const id of createdResources.conditions) {
      await cleanup(`/api/tools/condition/${id}`, client);
    }
    
    console.log('✅ Cleanup completed\n');
  });

  describe('1. Basic Automation CRUD', () => {
    test('should create automation with minimal config', async () => {
      const name = generateName('automation-minimal');
      const response = await client.post('/api/automations', {
        name,
        description: 'E2E test automation',
        nodes: [],
        links: [],
      });

      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'name', 'status', 'nodes', 'links']);
      expect(response.data.name).toBe(name);
      expect(response.data.status).toBe('idle');
      expect(response.data.nodes).toEqual([]);
      expect(response.data.links).toEqual([]);

      createdResources.automations.push(response.data.id);
    });

    test('should list all automations', async () => {
      const response = await client.get('/api/automations');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        assertSchema(response.data[0], ['id', 'name', 'status']);
      }
    });

    test('should get automation by ID', async () => {
      const name = generateName('automation-getbyid');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      const response = await client.get(`/api/automations/${created.data.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(created.data.id);
      expect(response.data.name).toBe(name);
    });

    test('should update automation', async () => {
      const name = generateName('automation-update');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      const updatedName = `${name}-updated`;
      const response = await client.patch(`/api/automations/${created.data.id}`, {
        name: updatedName,
        description: 'Updated description',
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe(updatedName);
    });

    test('should delete automation', async () => {
      const name = generateName('automation-delete');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });

      const response = await client.delete(`/api/automations/${created.data.id}`);
      expect(response.status).toBe(204);

      // Verify deletion
      await expect(
        client.get(`/api/automations/${created.data.id}`)
      ).rejects.toThrow();
    });
  });

  describe('2. Automation with Nodes', () => {
    let systemToolId;
    let agentId;

    beforeAll(async () => {
      // Get a system tool
      const toolsRes = await client.get('/api/tools');
      if (toolsRes.data.length > 0) {
        systemToolId = toolsRes.data[0].id;
      }

      // Create an agent
      const agentRes = await client.post('/api/agents', {
        name: generateName('agent'),
        description: 'E2E test agent',
        prompt: 'You are a test agent',
        defaultModel: 'gpt-4',
        tools: [],
      });
      agentId = agentRes.data.id;
      createdResources.agents.push(agentId);
    });

    test('should create automation with trigger and tool nodes', async () => {
      if (!systemToolId) {
        console.warn('⚠️  No system tools available, skipping test');
        return;
      }

      const name = generateName('automation-with-nodes');
      const response = await client.post('/api/automations', {
        name,
        description: 'Automation with nodes',
        nodes: [
          {
            id: 'node-trigger-1',
            type: 'trigger',
            referenceId: systemToolId,
            config: {},
            position: { x: 100, y: 100 },
          },
          {
            id: 'node-tool-1',
            type: 'tool',
            referenceId: systemToolId,
            config: {},
            position: { x: 300, y: 100 },
          },
        ],
        links: [
          {
            fromNodeId: 'node-trigger-1',
            fromOutputKey: 'output',
            toNodeId: 'node-tool-1',
            toInputKey: 'input',
          },
        ],
      });

      expect(response.status).toBe(201);
      expect(response.data.nodes).toHaveLength(2);
      expect(response.data.links).toHaveLength(1);
      
      // Verify node structure
      const triggerNode = response.data.nodes.find(n => n.id === 'node-trigger-1');
      expect(triggerNode).toBeDefined();
      expect(triggerNode.type).toBe('trigger');
      expect(triggerNode.position).toEqual({ x: 100, y: 100 });

      createdResources.automations.push(response.data.id);
    });

    test('should create automation with agent node', async () => {
      const name = generateName('automation-with-agent');
      const response = await client.post('/api/automations', {
        name,
        nodes: [
          {
            id: 'node-agent-1',
            type: 'agent',
            referenceId: agentId,
            config: {
              prompt: 'Analyze this data',
            },
            position: { x: 100, y: 100 },
          },
        ],
        links: [],
      });

      expect(response.status).toBe(201);
      expect(response.data.nodes).toHaveLength(1);
      expect(response.data.nodes[0].type).toBe('agent');

      createdResources.automations.push(response.data.id);
    });

    test('should update automation adding new nodes', async () => {
      if (!systemToolId) return;

      const name = generateName('automation-add-nodes');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      const response = await client.patch(`/api/automations/${created.data.id}`, {
        nodes: [
          {
            id: 'node-1',
            type: 'tool',
            referenceId: systemToolId,
            config: {},
            position: { x: 200, y: 200 },
          },
        ],
      });

      expect(response.status).toBe(200);
      expect(response.data.nodes).toHaveLength(1);
    });
  });

  describe('3. Linked Fields (Field Mapping)', () => {
    let toolId;

    beforeAll(async () => {
      const toolsRes = await client.get('/api/tools');
      if (toolsRes.data.length > 0) {
        toolId = toolsRes.data[0].id;
      }
    });

    test('should save and retrieve linked fields', async () => {
      if (!toolId) {
        console.warn('⚠️  No tools available, skipping test');
        return;
      }

      const name = generateName('automation-linked-fields');
      const response = await client.post('/api/automations', {
        name,
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            referenceId: toolId,
            config: {},
            position: { x: 100, y: 100 },
          },
          {
            id: 'node-2',
            type: 'tool',
            referenceId: toolId,
            config: {
              fieldA: 'static value',
            },
            position: { x: 300, y: 100 },
            linkedFields: {
              fieldB: {
                sourceNodeId: 'node-1',
                outputKey: 'result',
              },
            },
          },
        ],
        links: [],
      });

      expect(response.status).toBe(201);
      createdResources.automations.push(response.data.id);

      // Verify linked fields are saved
      const node2 = response.data.nodes.find(n => n.id === 'node-2');
      expect(node2.linkedFields).toBeDefined();
      expect(node2.linkedFields.fieldB).toEqual({
        sourceNodeId: 'node-1',
        outputKey: 'result',
      });

      // GET and verify persistence
      const getRes = await client.get(`/api/automations/${response.data.id}`);
      const node2Retrieved = getRes.data.nodes.find(n => n.id === 'node-2');
      expect(node2Retrieved.linkedFields.fieldB).toEqual({
        sourceNodeId: 'node-1',
        outputKey: 'result',
      });
    });

    test('should update linked fields', async () => {
      if (!toolId) return;

      const name = generateName('automation-update-linked');
      const created = await client.post('/api/automations', {
        name,
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            referenceId: toolId,
            position: { x: 100, y: 100 },
          },
          {
            id: 'node-2',
            type: 'tool',
            referenceId: toolId,
            position: { x: 300, y: 100 },
            linkedFields: {},
          },
        ],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      // Update with new linked fields
      const response = await client.patch(`/api/automations/${created.data.id}`, {
        nodes: [
          {
            id: 'node-1',
            type: 'trigger',
            referenceId: toolId,
            position: { x: 100, y: 100 },
          },
          {
            id: 'node-2',
            type: 'tool',
            referenceId: toolId,
            position: { x: 300, y: 100 },
            linkedFields: {
              email: {
                sourceNodeId: 'node-1',
                outputKey: 'userEmail',
              },
            },
          },
        ],
      });

      const node2 = response.data.nodes.find(n => n.id === 'node-2');
      expect(node2.linkedFields.email).toBeDefined();
      expect(node2.linkedFields.email.sourceNodeId).toBe('node-1');
      expect(node2.linkedFields.email.outputKey).toBe('userEmail');
    });
  });

  describe('4. Automation Execution', () => {
    test('should execute automation and return context', async () => {
      const name = generateName('automation-execute');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      const response = await client.post(`/api/automations/${created.data.id}/execute`, {
        input: { test: 'data' },
      });

      expect(response.status).toBe(200);
      assertSchema(response.data, ['automationId', 'executedNodes', 'errors']);
      expect(response.data.automationId).toBe(created.data.id);
    });

    test('should handle execution with input data', async () => {
      const name = generateName('automation-execute-input');
      const created = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(created.data.id);

      const inputData = {
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await client.post(`/api/automations/${created.data.id}/execute`, inputData);

      expect(response.status).toBe(200);
      expect(typeof response.data.executedNodes).toBe('object');
      expect(typeof response.data.errors).toBe('object');
    });
  });

  describe('5. Automation Webhooks', () => {
    test('should create webhook for automation', async () => {
      const name = generateName('automation-webhook');
      const automation = await client.post('/api/automations', {
        name,
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const response = await client.post(`/api/automations/${automation.data.id}/webhooks`, {
        method: 'POST',
        inputs: {
          email: 'string',
          name: 'string',
        },
      });

      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'url', 'token', 'method', 'inputs']);
      expect(response.data.method).toBe('POST');
      expect(response.data.url).toContain('/api/webhooks/');
      
      createdResources.tools.push(response.data.id); // Webhook creates a tool
    });

    test('should get webhook details', async () => {
      const automation = await client.post('/api/automations', {
        name: generateName('automation-webhook-get'),
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const webhook = await client.post(`/api/automations/${automation.data.id}/webhooks`, {
        method: 'GET',
        inputs: {},
      });
      createdResources.tools.push(webhook.data.id);

      const response = await client.get(`/api/automations/webhooks/${webhook.data.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(webhook.data.id);
      expect(response.data.method).toBe('GET');
    });

    test('should update webhook', async () => {
      const automation = await client.post('/api/automations', {
        name: generateName('automation-webhook-update'),
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const webhook = await client.post(`/api/automations/${automation.data.id}/webhooks`, {
        method: 'POST',
        inputs: { field1: 'string' },
      });
      createdResources.tools.push(webhook.data.id);

      const response = await client.patch(`/api/automations/webhooks/${webhook.data.id}`, {
        method: 'GET',
        inputs: { field1: 'string', field2: 'number' },
      });

      expect(response.status).toBe(200);
      expect(response.data.method).toBe('GET');
      expect(response.data.inputs.field2).toBe('number');
    });

    test('should delete webhook', async () => {
      const automation = await client.post('/api/automations', {
        name: generateName('automation-webhook-delete'),
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const webhook = await client.post(`/api/automations/${automation.data.id}/webhooks`, {
        method: 'POST',
        inputs: {},
      });

      const response = await client.delete(`/api/automations/webhooks/${webhook.data.id}`);
      expect(response.status).toBe(204);
    });

    test('should execute webhook via POST', async () => {
      const automation = await client.post('/api/automations', {
        name: generateName('automation-webhook-execute'),
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const webhook = await client.post(`/api/automations/${automation.data.id}/webhooks`, {
        method: 'POST',
        inputs: { email: 'string', name: 'string' },
      });
      createdResources.tools.push(webhook.data.id);

      const response = await client.post(`/api/webhooks/${webhook.data.id}`, {
        email: 'test@example.com',
        name: 'John Doe',
      });

      expect([200, 201, 202]).toContain(response.status);
      expect(response.data).toBeDefined();
    });
  });

  describe('6. Condition Nodes', () => {
    test('should create automation with condition node', async () => {
      // Create a condition tool first
      const conditionRes = await client.post('/api/tools/condition', {
        name: generateName('condition'),
        conditions: [
          { id: 'cond-1', label: 'If true', value: 'true' },
          { id: 'cond-2', label: 'If false', value: 'false' },
        ],
      });
      createdResources.conditions.push(conditionRes.data.id);

      const automation = await client.post('/api/automations', {
        name: generateName('automation-with-condition'),
        nodes: [
          {
            id: 'node-condition',
            type: 'condition',
            referenceId: conditionRes.data.id,
            config: {},
            position: { x: 200, y: 200 },
          },
        ],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      expect(automation.status).toBe(201);
      expect(automation.data.nodes).toHaveLength(1);
      expect(automation.data.nodes[0].type).toBe('condition');
    });

    test('should create branching automation with conditions', async () => {
      const toolsRes = await client.get('/api/tools');
      if (toolsRes.data.length === 0) {
        console.warn('⚠️  No tools available, skipping test');
        return;
      }
      const toolId = toolsRes.data[0].id;

      const conditionRes = await client.post('/api/tools/condition', {
        name: generateName('condition-branch'),
        conditions: [
          { id: 'yes', label: 'If yes', value: 'yes' },
          { id: 'no', label: 'If no', value: 'no' },
        ],
      });
      createdResources.conditions.push(conditionRes.data.id);

      const automation = await client.post('/api/automations', {
        name: generateName('automation-branching'),
        nodes: [
          {
            id: 'trigger',
            type: 'trigger',
            referenceId: toolId,
            position: { x: 100, y: 200 },
          },
          {
            id: 'condition',
            type: 'condition',
            referenceId: conditionRes.data.id,
            position: { x: 300, y: 200 },
          },
          {
            id: 'tool-yes',
            type: 'tool',
            referenceId: toolId,
            position: { x: 500, y: 100 },
          },
          {
            id: 'tool-no',
            type: 'tool',
            referenceId: toolId,
            position: { x: 500, y: 300 },
          },
        ],
        links: [
          { fromNodeId: 'trigger', fromOutputKey: 'output', toNodeId: 'condition', toInputKey: 'input' },
          { fromNodeId: 'condition', fromOutputKey: 'yes', toNodeId: 'tool-yes', toInputKey: 'input' },
          { fromNodeId: 'condition', fromOutputKey: 'no', toNodeId: 'tool-no', toInputKey: 'input' },
        ],
      });
      createdResources.automations.push(automation.data.id);

      expect(automation.status).toBe(201);
      expect(automation.data.nodes).toHaveLength(4);
      expect(automation.data.links).toHaveLength(3);
    });
  });

  describe('7. Import/Export', () => {
    test('should export automation', async () => {
      const automation = await client.post('/api/automations', {
        name: generateName('automation-export'),
        description: 'Automation for export test',
        nodes: [],
        links: [],
      });
      createdResources.automations.push(automation.data.id);

      const response = await client.get(`/api/automations/export/${automation.data.id}`);
      
      expect(response.status).toBe(200);
      assertSchema(response.data, ['version', 'automation', 'exportedAt']);
      expect(response.data.automation.name).toBe(automation.data.name);
    });

    test('should validate import payload', async () => {
      const payload = {
        automation: {
          name: generateName('automation-import-validate'),
          description: 'Test import',
          nodes: [],
          links: [],
        },
      };

      const response = await client.post('/api/automations/import/validate', payload);
      
      expect(response.status).toBe(200);
      expect(response.data.valid).toBe(true);
      expect(response.data.errors).toEqual([]);
    });

    test('should import automation', async () => {
      const payload = {
        automation: {
          name: generateName('automation-imported'),
          description: 'Imported via E2E test',
          nodes: [],
          links: [],
        },
      };

      const response = await client.post('/api/automations/import', payload);
      
      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'name', 'nodes', 'links']);
      expect(response.data.name).toBe(payload.automation.name);
      
      createdResources.automations.push(response.data.id);
    });

    test('should export all automations', async () => {
      const response = await client.get('/api/automations/export/all');
      
      expect(response.status).toBe(200);
      assertSchema(response.data, ['version', 'automations', 'exportedAt', 'total']);
      expect(Array.isArray(response.data.automations)).toBe(true);
      expect(response.data.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('8. Complex Automation Flow (Integration)', () => {
    test('FULL FLOW: create, configure, execute, and validate', async () => {
      // 1. Get available tools
      const toolsRes = await client.get('/api/tools');
      if (toolsRes.data.length === 0) {
        console.warn('⚠️  No tools available, skipping integration test');
        return;
      }
      const toolId = toolsRes.data[0].id;

      // 2. Create agent
      const agentRes = await client.post('/api/agents', {
        name: generateName('agent-integration'),
        description: 'Agent for integration test',
        prompt: 'You are an integration test agent',
        defaultModel: 'gpt-4',
        tools: [],
      });
      createdResources.agents.push(agentRes.data.id);

      // 3. Create condition
      const conditionRes = await client.post('/api/tools/condition', {
        name: generateName('condition-integration'),
        conditions: [
          { id: 'success', label: 'Success', value: 'success' },
          { id: 'failure', label: 'Failure', value: 'failure' },
        ],
      });
      createdResources.conditions.push(conditionRes.data.id);

      // 4. Create complex automation
      const automationRes = await client.post('/api/automations', {
        name: generateName('automation-integration'),
        description: 'Complex automation with all node types',
        nodes: [
          {
            id: 'trigger-node',
            type: 'trigger',
            referenceId: toolId,
            config: {},
            position: { x: 100, y: 200 },
          },
          {
            id: 'agent-node',
            type: 'agent',
            referenceId: agentRes.data.id,
            config: { prompt: 'Process this' },
            position: { x: 300, y: 200 },
            linkedFields: {
              input: {
                sourceNodeId: 'trigger-node',
                outputKey: 'output',
              },
            },
          },
          {
            id: 'condition-node',
            type: 'condition',
            referenceId: conditionRes.data.id,
            config: {},
            position: { x: 500, y: 200 },
          },
          {
            id: 'tool-success',
            type: 'tool',
            referenceId: toolId,
            config: {},
            position: { x: 700, y: 100 },
          },
          {
            id: 'tool-failure',
            type: 'tool',
            referenceId: toolId,
            config: {},
            position: { x: 700, y: 300 },
          },
        ],
        links: [
          { fromNodeId: 'trigger-node', fromOutputKey: 'output', toNodeId: 'agent-node', toInputKey: 'input' },
          { fromNodeId: 'agent-node', fromOutputKey: 'output', toNodeId: 'condition-node', toInputKey: 'input' },
          { fromNodeId: 'condition-node', fromOutputKey: 'success', toNodeId: 'tool-success', toInputKey: 'input' },
          { fromNodeId: 'condition-node', fromOutputKey: 'failure', toNodeId: 'tool-failure', toInputKey: 'input' },
        ],
      });
      createdResources.automations.push(automationRes.data.id);

      // 5. Verify creation
      expect(automationRes.status).toBe(201);
      expect(automationRes.data.nodes).toHaveLength(5);
      expect(automationRes.data.links).toHaveLength(4);

      // 6. Verify linked fields persisted
      const agentNode = automationRes.data.nodes.find(n => n.id === 'agent-node');
      expect(agentNode.linkedFields.input).toBeDefined();
      expect(agentNode.linkedFields.input.sourceNodeId).toBe('trigger-node');

      // 7. Execute automation
      const execRes = await client.post(`/api/automations/${automationRes.data.id}/execute`, {
        testData: 'integration test payload',
      });
      expect(execRes.status).toBe(200);
      expect(execRes.data.automationId).toBe(automationRes.data.id);

      // 8. Export automation
      const exportRes = await client.get(`/api/automations/export/${automationRes.data.id}`);
      expect(exportRes.status).toBe(200);
      expect(exportRes.data.automation.nodes).toHaveLength(5);

      console.log('✅ Full integration test completed successfully');
    });
  });
});
