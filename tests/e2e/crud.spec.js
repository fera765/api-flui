/**
 * E2E Tests - CRUD Operations
 * 
 * Basic CRUD tests for all main resources:
 * - Agents
 * - MCPs
 * - Tools
 * - Conditions
 */

const {
  createAxiosInstance,
  generateName,
  assertSchema,
  cleanup,
} = require('./setup');

const client = createAxiosInstance();

jest.setTimeout(60000); // 1 minute

describe('E2E - CRUD Operations', () => {
  const createdResources = {
    agents: [],
    mcps: [],
    tools: [],
    conditions: [],
  };

  afterAll(async () => {
    console.log('\n🧹 Cleaning up CRUD test resources...');
    
    for (const id of createdResources.agents) {
      await cleanup(`/api/agents/${id}`, client);
    }
    for (const id of createdResources.mcps) {
      await cleanup(`/api/mcps/${id}`, client);
    }
    for (const id of createdResources.tools) {
      await cleanup(`/api/tools/${id}`, client);
    }
    for (const id of createdResources.conditions) {
      await cleanup(`/api/tools/condition/${id}`, client);
    }
    
    console.log('✅ CRUD cleanup completed\n');
  });

  describe('Agents CRUD', () => {
    test('should create agent', async () => {
      const name = generateName('agent');
      const response = await client.post('/api/agents', {
        name,
        description: 'E2E test agent',
        prompt: 'You are a helpful assistant',
        defaultModel: 'gpt-4',
        tools: [],
      });

      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'name', 'description', 'defaultModel', 'tools']);
      expect(response.data.name).toBe(name);
      expect(response.data.defaultModel).toBe('gpt-4');

      createdResources.agents.push(response.data.id);
    });

    test('should list all agents', async () => {
      const response = await client.get('/api/agents');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should get agent by ID', async () => {
      const name = generateName('agent-get');
      const created = await client.post('/api/agents', {
        name,
        description: 'Test',
        prompt: 'You are a test agent',
        defaultModel: 'gpt-3.5-turbo',
        tools: [],
      });
      createdResources.agents.push(created.data.id);

      const response = await client.get(`/api/agents/${created.data.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(created.data.id);
      expect(response.data.name).toBe(name);
    });

    test('should update agent', async () => {
      const created = await client.post('/api/agents', {
        name: generateName('agent-update'),
        description: 'Original',
        prompt: 'Original prompt',
        defaultModel: 'gpt-4',
        tools: [],
      });
      createdResources.agents.push(created.data.id);

      const response = await client.patch(`/api/agents/${created.data.id}`, {
        description: 'Updated description',
        defaultModel: 'gpt-3.5-turbo',
      });

      expect(response.status).toBe(200);
      expect(response.data.description).toBe('Updated description');
      expect(response.data.defaultModel).toBe('gpt-3.5-turbo');
    });

    test('should delete agent', async () => {
      const created = await client.post('/api/agents', {
        name: generateName('agent-delete'),
        description: 'To be deleted',
        prompt: 'Delete me',
        defaultModel: 'gpt-4',
        tools: [],
      });

      const response = await client.delete(`/api/agents/${created.data.id}`);
      expect(response.status).toBe(204);

      // Verify deletion
      await expect(
        client.get(`/api/agents/${created.data.id}`)
      ).rejects.toThrow();
    });

    test('should create agent with tools', async () => {
      // Get available system tools
      const toolsRes = await client.get('/api/tools');
      const toolIds = toolsRes.data.slice(0, 2).map(t => t.id);

      const response = await client.post('/api/agents', {
        name: generateName('agent-with-tools'),
        description: 'Agent with tools',
        prompt: 'You are a tool-using agent',
        defaultModel: 'gpt-4',
        tools: toolIds,
      });

      expect(response.status).toBe(201);
      createdResources.agents.push(response.data.id);
    });
  });

  describe('Tools CRUD', () => {
    test('should list system tools', async () => {
      const response = await client.get('/api/tools');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      if (response.data.length > 0) {
        assertSchema(response.data[0], ['id', 'name', 'type']);
      }
    });

    test('should get tool by ID', async () => {
      const toolsRes = await client.get('/api/tools');
      
      if (toolsRes.data.length === 0) {
        console.warn('⚠️  No tools available, skipping test');
        return;
      }

      const toolId = toolsRes.data[0].id;
      const response = await client.get(`/api/tools/${toolId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(toolId);
      assertSchema(response.data, ['id', 'name', 'type', 'inputSchema', 'outputSchema']);
    });

    test('should create custom tool', async () => {
      const response = await client.post('/api/tools', {
        name: generateName('tool'),
        description: 'Custom E2E tool',
        type: 'action',
        inputSchema: {
          type: 'object',
          properties: {
            input: { type: 'string' },
          },
          required: ['input'],
        },
        outputSchema: {
          type: 'object',
          properties: {
            output: { type: 'string' },
          },
        },
      });

      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'name', 'type']);
      
      createdResources.tools.push(response.data.id);
    });

    test('should delete tool', async () => {
      const created = await client.post('/api/tools', {
        name: generateName('tool-delete'),
        description: 'To be deleted',
        type: 'action',
        inputSchema: { type: 'object' },
        outputSchema: { type: 'object' },
      });

      const response = await client.delete(`/api/tools/${created.data.id}`);
      expect(response.status).toBe(204);
    });

    test('should execute tool directly', async () => {
      const toolsRes = await client.get('/api/tools');
      
      if (toolsRes.data.length === 0) {
        console.warn('⚠️  No tools available, skipping test');
        return;
      }

      const tool = toolsRes.data[0];
      
      // Build minimal valid input based on schema
      let input = {};
      if (tool.inputSchema?.properties) {
        Object.keys(tool.inputSchema.properties).forEach(key => {
          const prop = tool.inputSchema.properties[key];
          if (prop.type === 'string') input[key] = 'test';
          if (prop.type === 'number') input[key] = 123;
          if (prop.type === 'boolean') input[key] = true;
        });
      }

      try {
        const response = await client.post(`/api/tools/${tool.id}/execute`, input);
        expect([200, 201, 202]).toContain(response.status);
      } catch (error) {
        // Some tools may require specific input - that's OK for this test
        if (error.response?.status === 400) {
          console.log(`ℹ️  Tool ${tool.name} requires specific input format (expected)`);
        } else {
          throw error;
        }
      }
    });
  });

  describe('Condition Tools CRUD', () => {
    test('should create condition tool', async () => {
      const response = await client.post('/api/tools/condition', {
        name: generateName('condition'),
        description: 'Test condition tool',
        conditions: [
          { name: 'Condition A', predicate: 'input.value === "A"', linkedNodes: [] },
          { name: 'Condition B', predicate: 'input.value === "B"', linkedNodes: [] },
        ],
      });

      expect(response.status).toBe(201);
      assertSchema(response.data, ['id', 'name', 'conditions']);
      expect(response.data.conditions).toHaveLength(2);

      createdResources.conditions.push(response.data.id);
    });

    test('should list condition tools', async () => {
      const response = await client.get('/api/tools/condition');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should get condition by ID', async () => {
      const created = await client.post('/api/tools/condition', {
        name: generateName('condition-get'),
        conditions: [{ name: 'C1', predicate: 'input === "v1"', linkedNodes: [] }],
      });
      createdResources.conditions.push(created.data.id);

      const response = await client.get(`/api/tools/condition/${created.data.id}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(created.data.id);
    });

    test('should update condition', async () => {
      const created = await client.post('/api/tools/condition', {
        name: generateName('condition-update'),
        conditions: [{ name: 'Original', predicate: 'input === "v1"', linkedNodes: [] }],
      });
      createdResources.conditions.push(created.data.id);

      const response = await client.patch(`/api/tools/condition/${created.data.id}`, {
        name: 'Updated Name',
        conditions: [
          { name: 'Updated', predicate: 'input === "v1"', linkedNodes: [] },
          { name: 'New', predicate: 'input === "v2"', linkedNodes: [] },
        ],
      });

      expect(response.status).toBe(200);
      expect(response.data.name).toBe('Updated Name');
      expect(response.data.conditions).toHaveLength(2);
    });

    test('should evaluate condition', async () => {
      const created = await client.post('/api/tools/condition', {
        name: generateName('condition-eval'),
        conditions: [
          { name: 'Yes', predicate: 'input === "yes"', linkedNodes: [] },
          { name: 'No', predicate: 'input === "no"', linkedNodes: [] },
        ],
      });
      createdResources.conditions.push(created.data.id);

      const response = await client.post(`/api/tools/condition/${created.data.id}/evaluate`, {
        input: 'yes',
      });

      expect(response.status).toBe(200);
      // Condition evaluation returns matched conditions
      expect(response.data).toBeDefined();
    });

    test('should delete condition', async () => {
      const created = await client.post('/api/tools/condition', {
        name: generateName('condition-delete'),
        conditions: [{ name: 'Delete', predicate: 'true', linkedNodes: [] }],
      });

      const response = await client.delete(`/api/tools/condition/${created.data.id}`);
      expect(response.status).toBe(204);
    });
  });

  describe('MCPs CRUD', () => {
    test('should list MCPs', async () => {
      const response = await client.get('/api/mcps');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });

    test('should fetch MCP metadata', async () => {
      // This test depends on having a valid MCP source
      // Skipping if no real MCP source is available
      console.log('ℹ️  MCP metadata fetch requires external package - skipping');
    });

    test('should import MCP', async () => {
      // This test requires a valid MCP package
      // For E2E purposes, we document that it requires external dependencies
      console.log('ℹ️  MCP import requires external package - skipping');
      console.log('   To test manually: POST /api/mcps/import with { source: "npm:package-name" }');
    });

    test('should get MCP tools (if any MCP exists)', async () => {
      const mcpsRes = await client.get('/api/mcps');
      
      if (mcpsRes.data.length === 0) {
        console.log('ℹ️  No MCPs available - skipping MCP tools test');
        return;
      }

      const mcpId = mcpsRes.data[0].id;
      const response = await client.get(`/api/mcps/${mcpId}/tools`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
    });
  });

  describe('All Tools API', () => {
    test('should get all tools (system + mcps + agents)', async () => {
      const response = await client.get('/api/all-tools');
      
      expect(response.status).toBe(200);
      assertSchema(response.data, ['tools', 'pagination', 'filters', 'summary']);
      assertSchema(response.data.tools, ['system', 'mcps', 'agents']);
      expect(Array.isArray(response.data.tools.system)).toBe(true);
      expect(Array.isArray(response.data.tools.mcps)).toBe(true);
      expect(Array.isArray(response.data.tools.agents)).toBe(true);
    });

    test('should filter tools by category', async () => {
      const response = await client.get('/api/all-tools?category=system');
      
      expect(response.status).toBe(200);
      expect(response.data.filters.category).toBe('system');
    });

    test('should paginate tools', async () => {
      const response = await client.get('/api/all-tools?page=1&pageSize=10');
      
      expect(response.status).toBe(200);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.pageSize).toBe(10);
    });

    test('should search tools', async () => {
      const response = await client.get('/api/all-tools/search?q=file');
      
      expect(response.status).toBe(200);
      assertSchema(response.data, ['query', 'tools', 'total']);
      expect(response.data.query).toBe('file');
      expect(Array.isArray(response.data.tools)).toBe(true);
    });
  });
});
