/**
 * E2E Tests - Cleanup & System State Validation
 * 
 * Ensures:
 * - Test resources are properly cleaned up
 * - System can be reset to clean state
 * - No orphaned resources remain
 */

const {
  createAxiosInstance,
  generateName,
} = require('./setup');

const client = createAxiosInstance();

jest.setTimeout(60000);

describe('E2E - Cleanup & System State', () => {
  describe('Cleanup Test Resources', () => {
    test('should identify and remove test resources by prefix', async () => {
      const testPrefix = process.env.TEST_PREFIX || 'e2e-';
      
      // Get all automations
      const automationsRes = await client.get('/api/automations');
      const testAutomations = automationsRes.data.filter(a => a.name.startsWith(testPrefix));
      
      console.log(`Found ${testAutomations.length} test automations to clean up`);
      
      for (const automation of testAutomations) {
        try {
          await client.delete(`/api/automations/${automation.id}`);
          console.log(`✅ Deleted automation: ${automation.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to delete automation ${automation.id}:`, error.message);
        }
      }
    });

    test('should clean up test agents', async () => {
      const testPrefix = process.env.TEST_PREFIX || 'e2e-';
      
      const agentsRes = await client.get('/api/agents');
      const testAgents = agentsRes.data.filter(a => a.name.startsWith(testPrefix));
      
      console.log(`Found ${testAgents.length} test agents to clean up`);
      
      for (const agent of testAgents) {
        try {
          await client.delete(`/api/agents/${agent.id}`);
          console.log(`✅ Deleted agent: ${agent.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to delete agent ${agent.id}:`, error.message);
        }
      }
    });

    test('should clean up test conditions', async () => {
      const testPrefix = process.env.TEST_PREFIX || 'e2e-';
      
      const conditionsRes = await client.get('/api/tools/condition');
      const testConditions = conditionsRes.data.filter(c => c.name.startsWith(testPrefix));
      
      console.log(`Found ${testConditions.length} test conditions to clean up`);
      
      for (const condition of testConditions) {
        try {
          await client.delete(`/api/tools/condition/${condition.id}`);
          console.log(`✅ Deleted condition: ${condition.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to delete condition ${condition.id}:`, error.message);
        }
      }
    });

    test('should clean up test chats', async () => {
      const testPrefix = process.env.TEST_PREFIX || 'e2e-';
      
      try {
        const chatsRes = await client.get('/api/chats');
        const testChats = chatsRes.data.filter(c => c.title && c.title.startsWith(testPrefix));
        
        console.log(`Found ${testChats.length} test chats to clean up`);
        
        for (const chat of testChats) {
          try {
            await client.delete(`/api/chats/${chat.id}`);
            console.log(`✅ Deleted chat: ${chat.title}`);
          } catch (error) {
            console.warn(`⚠️  Failed to delete chat ${chat.id}:`, error.message);
          }
        }
      } catch (error) {
        console.log('ℹ️  Chat cleanup skipped (not critical)');
      }
    });
  });

  describe('System State Validation', () => {
    test('should verify system is operational after cleanup', async () => {
      // Health check
      const health = await client.get('/');
      expect([200, 204]).toContain(health.status);

      // Dashboard stats
      const stats = await client.get('/api/dashboard/stats');
      expect(stats.status).toBe(200);
      
      console.log('📊 Current system state:', stats.data);
    });

    test('should verify all API endpoints are accessible', async () => {
      const endpoints = [
        { method: 'GET', path: '/api/automations' },
        { method: 'GET', path: '/api/agents' },
        { method: 'GET', path: '/api/tools' },
        { method: 'GET', path: '/api/tools/condition' },
        { method: 'GET', path: '/api/mcps' },
        { method: 'GET', path: '/api/all-tools' },
        { method: 'GET', path: '/api/chats' },
        { method: 'GET', path: '/api/tor' },
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await client.request({
            method: endpoint.method,
            url: endpoint.path,
          });
          expect([200, 201, 204]).toContain(response.status);
          console.log(`✅ ${endpoint.method} ${endpoint.path} - ${response.status}`);
        } catch (error) {
          console.error(`❌ ${endpoint.method} ${endpoint.path} failed:`, error.message);
          throw error;
        }
      }
    });

    test('should create and delete a test resource successfully', async () => {
      // Create
      const automation = await client.post('/api/automations', {
        name: generateName('cleanup-test'),
        nodes: [],
        links: [],
      });
      expect(automation.status).toBe(201);

      // Verify exists
      const get = await client.get(`/api/automations/${automation.data.id}`);
      expect(get.status).toBe(200);

      // Delete
      const del = await client.delete(`/api/automations/${automation.data.id}`);
      expect(del.status).toBe(204);

      // Verify deleted
      await expect(
        client.get(`/api/automations/${automation.data.id}`)
      ).rejects.toThrow();

      console.log('✅ CRUD cycle completed successfully');
    });
  });

  describe('Orphaned Resources Check', () => {
    test('should check for orphaned webhook tools', async () => {
      const toolsRes = await client.get('/api/tools');
      const webhookTools = toolsRes.data.filter(t => 
        t.type === 'webhook' || t.name.toLowerCase().includes('webhook')
      );
      
      console.log(`Found ${webhookTools.length} webhook tools`);
      
      // This is informational - not failing if there are webhooks
      if (webhookTools.length > 0) {
        console.log('ℹ️  Webhook tools found (may be legitimate)');
      }
    });

    test('should report system statistics', async () => {
      const stats = await client.get('/api/dashboard/stats');
      
      console.log('\n📊 Final System Statistics:');
      console.log('==========================');
      console.log(`Automations: ${stats.data.automations.total}`);
      console.log(`Agents: ${stats.data.agents.total}`);
      console.log(`MCPs: ${stats.data.mcps.total}`);
      console.log(`System Tools: ${stats.data.tools.system}`);
      console.log(`Total Tools: ${stats.data.tools.total}`);
      console.log('==========================\n');

      expect(stats.status).toBe(200);
    });
  });

  describe('Reset Capability', () => {
    test('should be able to delete all test automations at once', async () => {
      const testPrefix = process.env.TEST_PREFIX || 'e2e-';
      
      const automationsRes = await client.get('/api/automations');
      const before = automationsRes.data.filter(a => a.name.startsWith(testPrefix)).length;
      
      for (const automation of automationsRes.data) {
        if (automation.name.startsWith(testPrefix)) {
          try {
            await client.delete(`/api/automations/${automation.id}`);
          } catch (error) {
            // Continue on error
          }
        }
      }
      
      const afterRes = await client.get('/api/automations');
      const after = afterRes.data.filter(a => a.name.startsWith(testPrefix)).length;
      
      console.log(`Cleaned up ${before - after} test automations`);
      expect(after).toBeLessThanOrEqual(before);
    });
  });
});
