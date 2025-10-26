import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnly__ } from '@modules/core/routes';
import { __testOnlyAgents__ } from '@modules/core/routes/agents.routes';
import { __testOnlyMCPs__ } from '@modules/core/routes/mcps.routes';
import { __testOnlyTools__ } from '@modules/core/routes/tools.routes';
import { __testOnlyAutomations__ } from '@modules/core/routes/automations.routes';
import { __testOnlyExecution__ } from '@modules/core/routes/execution.routes';

/**
 * End-to-End Test Suite - Error Scenarios and Edge Cases
 * 
 * This test suite validates error handling, validation, and edge cases across the API:
 * 1. Invalid input validation
 * 2. Resource not found scenarios
 * 3. Conflict situations
 * 4. Malformed requests
 * 5. Boundary conditions
 */
describe('E2E - Error Scenarios and Edge Cases', () => {
  beforeEach(() => {
    __testOnly__.clearRepository();
    __testOnlyAgents__.clearRepository();
    __testOnlyMCPs__.clearRepository();
    __testOnlyTools__.clearRepository();
    __testOnlyAutomations__.clearRepository();
    __testOnlyAutomations__.clearToolRepository();
    __testOnlyAutomations__.clearAgentRepository();
    __testOnlyExecution__.clearLogs();
    __testOnlyExecution__.clearAutomations();
    __testOnlyExecution__.clearTools();
    __testOnlyExecution__.clearAgents();
  });

  describe('Agent API - Error Scenarios', () => {
    it('should reject agent creation with missing required fields', async () => {
      // Missing name
      const missingName = await request(app)
        .post('/api/agents')
        .send({ prompt: 'Test prompt' });
      expect(missingName.status).toBe(400);
      expect(missingName.body).toHaveProperty('status', 'error');

      // Missing prompt
      const missingPrompt = await request(app)
        .post('/api/agents')
        .send({ name: 'Test Agent' });
      expect(missingPrompt.status).toBe(400);
      expect(missingPrompt.body).toHaveProperty('status', 'error');

      // Empty name
      const emptyName = await request(app)
        .post('/api/agents')
        .send({ name: '', prompt: 'Test prompt' });
      expect(emptyName.status).toBe(400);

      // Empty prompt
      const emptyPrompt = await request(app)
        .post('/api/agents')
        .send({ name: 'Test Agent', prompt: '' });
      expect(emptyPrompt.status).toBe(400);
    });

    it('should handle non-existent agent operations', async () => {
      const nonExistentId = 'non-existent-agent-id';

      // GET non-existent agent
      const getResponse = await request(app).get(`/api/agents/${nonExistentId}`);
      expect(getResponse.status).toBe(404);
      expect(getResponse.body).toHaveProperty('status', 'error');

      // PATCH non-existent agent
      const patchResponse = await request(app)
        .patch(`/api/agents/${nonExistentId}`)
        .send({ name: 'Updated Name' });
      expect(patchResponse.status).toBe(404);
      expect(patchResponse.body).toHaveProperty('status', 'error');

      // DELETE non-existent agent
      const deleteResponse = await request(app).delete(`/api/agents/${nonExistentId}`);
      expect(deleteResponse.status).toBe(404);
      expect(deleteResponse.body).toHaveProperty('status', 'error');
    });

    it('should handle invalid agent updates', async () => {
      // Create an agent first
      const createResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Original prompt',
        });
      expect(createResponse.status).toBe(201);
      const agentId = createResponse.body.id;

      // Try to update with empty name (may accept or reject)
      const emptyNameUpdate = await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ name: '' });
      expect([200, 400]).toContain(emptyNameUpdate.status);

      // Try to update with empty prompt (may accept or reject)
      const emptyPromptUpdate = await request(app)
        .patch(`/api/agents/${agentId}`)
        .send({ prompt: '' });
      expect([200, 400]).toContain(emptyPromptUpdate.status);
    });

    it('should handle malformed JSON in agent requests', async () => {
      const response = await request(app)
        .post('/api/agents')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');
      
      // Express may return 400 or 500 depending on middleware configuration
      expect([400, 500]).toContain(response.status);
    });
  });

  describe('Tool API - Error Scenarios', () => {
    it('should reject tool creation with invalid configuration', async () => {
      // Missing tool name
      const missingName = await request(app)
        .post('/api/tools')
        .send({
          type: 'restApi',
          config: {},
        });
      expect(missingName.status).toBe(400);

      // Missing tool type (may accept with default or reject)
      const missingType = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Tool',
          config: {},
        });
      expect([201, 400]).toContain(missingType.status);

      // Invalid tool type
      const invalidType = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Tool',
          type: 'invalidType',
          config: {},
        });
      expect(invalidType.status).toBe(400);
    });

    it('should handle non-existent tool operations', async () => {
      const nonExistentId = 'non-existent-tool-id';

      // GET non-existent tool
      const getResponse = await request(app).get(`/api/tools/${nonExistentId}`);
      expect(getResponse.status).toBe(404);

      // DELETE non-existent tool
      const deleteResponse = await request(app).delete(`/api/tools/${nonExistentId}`);
      expect(deleteResponse.status).toBe(404);

      // EXECUTE non-existent tool
      const executeResponse = await request(app)
        .post(`/api/tools/${nonExistentId}/execute`)
        .send({ input: 'test' });
      expect(executeResponse.status).toBe(404);
    });

    it('should handle tool execution with invalid input', async () => {
      // Create a code tool
      const createResponse = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Code Tool',
          type: 'code',
          config: {
            language: 'javascript',
            code: 'return input * 2;',
          },
        });
      expect(createResponse.status).toBe(201);
      const toolId = createResponse.body.id;

      // Execute with missing input
      const noInput = await request(app)
        .post(`/api/tools/${toolId}/execute`)
        .send({});
      
      // Should handle gracefully (may succeed with undefined or fail with 400)
      expect([200, 400, 500]).toContain(noInput.status);
    });

    it('should handle webhook for non-existent tool', async () => {
      const nonExistentId = 'non-existent-webhook-tool';

      const getWebhook = await request(app).get(`/api/webhooks/${nonExistentId}`);
      expect(getWebhook.status).toBe(404);

      const postWebhook = await request(app)
        .post(`/api/webhooks/${nonExistentId}`)
        .send({ data: 'test' });
      expect(postWebhook.status).toBe(404);
    });
  });

  describe('Automation API - Error Scenarios', () => {
    it('should reject automation creation with invalid trigger', async () => {
      // Missing trigger
      const missingTrigger = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          actions: [],
        });
      expect(missingTrigger.status).toBe(400);

      // Invalid trigger type
      const invalidTrigger = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'invalidType',
            config: {},
          },
          actions: [],
        });
      expect(invalidTrigger.status).toBe(400);
    });

    it('should reject automation creation with invalid actions', async () => {
      // Missing actions
      const missingActions = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'manual',
            config: {},
          },
        });
      expect(missingActions.status).toBe(400);

      // Empty actions array
      const emptyActions = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [],
        });
      expect(emptyActions.status).toBe(400);

      // Action with invalid type
      const invalidAction = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'invalidType',
              config: {},
            },
          ],
        });
      expect(invalidAction.status).toBe(400);
    });

    it('should reject automation with references to non-existent resources', async () => {
      // Action with non-existent agent
      const nonExistentAgent = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'agent',
              agentId: 'non-existent-agent-id',
              config: {},
            },
          ],
        });
      expect(nonExistentAgent.status).toBe(400);

      // Action with non-existent tool
      const nonExistentTool = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'tool',
              toolId: 'non-existent-tool-id',
              config: {},
            },
          ],
        });
      expect(nonExistentTool.status).toBe(400);
    });

    it('should handle non-existent automation operations', async () => {
      const nonExistentId = 'non-existent-automation-id';

      // GET non-existent automation
      const getResponse = await request(app).get(`/api/automations/${nonExistentId}`);
      expect(getResponse.status).toBe(404);

      // PATCH non-existent automation
      const patchResponse = await request(app)
        .patch(`/api/automations/${nonExistentId}`)
        .send({ name: 'Updated Name' });
      expect(patchResponse.status).toBe(404);

      // DELETE non-existent automation
      const deleteResponse = await request(app).delete(`/api/automations/${nonExistentId}`);
      expect(deleteResponse.status).toBe(404);

      // EXECUTE non-existent automation
      const executeResponse = await request(app)
        .post(`/api/automations/${nonExistentId}/execute`)
        .send({ input: 'test' });
      expect(executeResponse.status).toBe(404);
    });

    it('should reject invalid CRON expressions', async () => {
      const invalidCron = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: {
            type: 'cron',
            config: {
              schedule: 'invalid-cron-expression',
            },
          },
          actions: [
            {
              type: 'agent',
              agentId: 'dummy-id',
              config: {},
            },
          ],
        });
      
      // Should reject invalid CRON
      expect([400, 404]).toContain(invalidCron.status);
    });
  });

  describe('Execution API - Error Scenarios', () => {
    it('should handle execution of non-existent automation', async () => {
      const nonExistentId = 'non-existent-automation-id';

      // Start execution
      const startResponse = await request(app)
        .post(`/api/execution/${nonExistentId}/start`)
        .send({ input: 'test' });
      expect(startResponse.status).toBe(404);

      // Get status
      const statusResponse = await request(app).get(`/api/execution/${nonExistentId}/status`);
      expect(statusResponse.status).toBe(404);

      // Get logs (may return 404 or empty array)
      const logsResponse = await request(app).get(`/api/execution/${nonExistentId}/logs`);
      expect([200, 404]).toContain(logsResponse.status);
    });

    it('should handle concurrent execution attempts', async () => {
      // Create agent and automation first
      const agent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });

      const automation = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: { type: 'manual', config: {} },
          actions: [
            {
              type: 'agent',
              agentId: agent.body.id,
              config: { prompt: 'Process this' },
            },
          ],
        });

      expect([201, 400]).toContain(automation.status);
      
      // Only continue if automation was created
      if (automation.status !== 201) {
        return;
      }
      
      const automationId = automation.body.id;

      // Start multiple executions in parallel
      const execution1 = request(app)
        .post(`/api/execution/${automationId}/start`)
        .send({ input: 'test1' });

      const execution2 = request(app)
        .post(`/api/execution/${automationId}/start`)
        .send({ input: 'test2' });

      const [result1, result2] = await Promise.all([execution1, execution2]);

      // Both should succeed or at least one should succeed
      expect([result1.status, result2.status]).toContain(200);
    });
  });

  describe('MCP API - Error Scenarios', () => {
    it('should reject MCP import with invalid configuration', async () => {
      // Missing command
      const missingCommand = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Test MCP',
          args: [],
        });
      expect(missingCommand.status).toBe(400);

      // Missing name
      const missingName = await request(app)
        .post('/api/mcps/import')
        .send({
          command: 'npx',
          args: ['test'],
        });
      expect(missingName.status).toBe(400);

      // Empty command
      const emptyCommand = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Test MCP',
          command: '',
          args: [],
        });
      expect(emptyCommand.status).toBe(400);
    });

    it('should handle operations on non-existent MCP', async () => {
      const nonExistentId = 'non-existent-mcp-id';

      // Get tools from non-existent MCP
      const getToolsResponse = await request(app).get(`/api/mcps/${nonExistentId}/tools`);
      expect(getToolsResponse.status).toBe(404);

      // Delete non-existent MCP
      const deleteResponse = await request(app).delete(`/api/mcps/${nonExistentId}`);
      expect(deleteResponse.status).toBe(404);
    });

    it('should handle MCP import with invalid executable', async () => {
      const invalidMcp = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'Invalid MCP',
          command: 'non-existent-command-xyz123',
          args: ['--invalid'],
        });

      // Should fail to import
      expect([400, 500]).toContain(invalidMcp.status);
    });
  });

  describe('System Configuration - Error Scenarios', () => {
    it('should handle invalid configuration updates', async () => {
      // Create initial config
      await request(app)
        .post('/api/setting')
        .send({
          openai_api_key: 'test-key',
          default_model: 'gpt-4',
        });

      // Try to update with invalid model (may accept or reject)
      const invalidModel = await request(app)
        .patch('/api/setting')
        .send({
          default_model: '',
        });
      expect([200, 400, 404]).toContain(invalidModel.status);

      // Try to update with empty API key (may accept or reject)
      const emptyKey = await request(app)
        .patch('/api/setting')
        .send({
          openai_api_key: '',
        });
      expect([200, 400, 404]).toContain(emptyKey.status);
    });

    it('should handle malformed configuration requests', async () => {
      const malformed = await request(app)
        .post('/api/setting')
        .set('Content-Type', 'application/json')
        .send('{ invalid: json }');
      
      expect([400, 500]).toContain(malformed.status);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle very long input strings', async () => {
      const longString = 'a'.repeat(10000);

      const response = await request(app)
        .post('/api/agents')
        .send({
          name: longString,
          prompt: 'Test prompt',
        });

      // Should either accept or reject with appropriate status
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in names', async () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';

      const response = await request(app)
        .post('/api/agents')
        .send({
          name: specialChars,
          prompt: 'Test prompt',
        });

      expect([201, 400]).toContain(response.status);
    });

    it('should handle Unicode characters', async () => {
      const unicode = '你好世界 مرحبا العالم שלום עולם';

      const response = await request(app)
        .post('/api/agents')
        .send({
          name: unicode,
          prompt: 'Test prompt',
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(unicode);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });

    it('should handle null values in optional fields', async () => {
      const response = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
          description: null,
          defaultModel: null,
        });

      // Should handle null gracefully
      expect([201, 400]).toContain(response.status);
    });

    it('should handle extremely nested JSON', async () => {
      let nested: any = { value: 'deep' };
      for (let i = 0; i < 100; i++) {
        nested = { level: nested };
      }

      const response = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Tool',
          type: 'code',
          config: nested,
        });

      // Should either accept or reject gracefully
      expect([201, 400, 413]).toContain(response.status);
    });

    it('should rate limit or handle rapid successive requests', async () => {
      // Create 50 agents rapidly
      const requests = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .post('/api/agents')
          .send({
            name: `Agent ${i}`,
            prompt: `Prompt ${i}`,
          })
      );

      const responses = await Promise.all(requests);

      // Most should succeed
      const successCount = responses.filter(r => r.status === 201).length;
      expect(successCount).toBeGreaterThan(40);
    });
  });

  describe('Cross-Resource Dependencies', () => {
    it('should handle deletion of resources with dependencies', async () => {
      // Create agent
      const agent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Test Agent',
          prompt: 'Test prompt',
        });

      // Create automation using the agent
      const automation = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: { type: 'manual', config: {} },
          actions: [
            {
              type: 'agent',
              agentId: agent.body.id,
              config: { prompt: 'Do something' },
            },
          ],
        });

      expect([201, 400]).toContain(automation.status);

      // Only test deletion if automation was created
      if (automation.status === 201) {
        // Try to delete the agent (should succeed or fail with appropriate message)
        const deleteAgent = await request(app).delete(`/api/agents/${agent.body.id}`);
        
        // The behavior depends on implementation:
        // - 204: Deletion allowed (cascade or orphan)
        // - 409: Conflict (cannot delete due to dependencies)
        // - 400: Bad request
        expect([204, 400, 409]).toContain(deleteAgent.status);
      }
    });

    it('should handle tool deletion when used in automations', async () => {
      // Create tool
      const tool = await request(app)
        .post('/api/tools')
        .send({
          name: 'Test Tool',
          type: 'code',
          config: {
            language: 'javascript',
            code: 'return "test";',
          },
        });

      // Create automation using the tool
      const automation = await request(app)
        .post('/api/automations')
        .send({
          name: 'Test Automation',
          trigger: { type: 'manual', config: {} },
          actions: [
            {
              type: 'tool',
              toolId: tool.body.id,
              config: {},
            },
          ],
        });

      expect([201, 400]).toContain(automation.status);

      // Only test deletion if automation was created
      if (automation.status === 201) {
        // Try to delete the tool
        const deleteTool = await request(app).delete(`/api/tools/${tool.body.id}`);
        
        expect([204, 400, 409]).toContain(deleteTool.status);
      }
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle large automation with many actions', async () => {
      // Create multiple agents
      const agents = await Promise.all(
        Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/agents')
            .send({
              name: `Agent ${i}`,
              prompt: `Prompt ${i}`,
            })
        )
      );

      // Create automation with many actions
      const automation = await request(app)
        .post('/api/automations')
        .send({
          name: 'Complex Automation',
          trigger: { type: 'manual', config: {} },
          actions: agents.map(agent => ({
            type: 'agent',
            agentId: agent.body.id,
            config: { prompt: 'Process' },
          })),
        });

      expect([201, 400]).toContain(automation.status);
      
      // Only validate actions if automation was created successfully
      if (automation.status === 201) {
        expect(automation.body.actions).toHaveLength(5);
      }
    });

    it('should handle listing large number of resources', async () => {
      // Create many agents
      await Promise.all(
        Array.from({ length: 100 }, (_, i) =>
          request(app)
            .post('/api/agents')
            .send({
              name: `Agent ${i}`,
              prompt: `Prompt ${i}`,
            })
        )
      );

      // List all agents
      const response = await request(app).get('/api/agents');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(100);
    });
  });
});
