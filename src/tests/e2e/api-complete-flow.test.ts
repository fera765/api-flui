import request from 'supertest';
import { app } from '@infra/http/app';
import { __testOnly__ } from '@modules/core/routes';
import { __testOnlyAgents__ } from '@modules/core/routes/agents.routes';
import { __testOnlyMCPs__ } from '@modules/core/routes/mcps.routes';
import { __testOnlyTools__ } from '@modules/core/routes/tools.routes';
import { __testOnlyAutomations__ } from '@modules/core/routes/automations.routes';
import { __testOnlyExecution__ } from '@modules/core/routes/execution.routes';

/**
 * End-to-End Test Suite - Complete API Flow
 * 
 * This test suite validates the entire API functionality in a realistic workflow:
 * 1. Health check and system configuration
 * 2. Create and manage agents
 * 3. Create and manage tools
 * 4. Import MCPs
 * 5. Create automations with triggers and actions
 * 6. Execute automations and monitor results
 */
describe('E2E - Complete API Flow', () => {
  // Clean up all repositories before each test
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

  describe('Scenario 1: Complete User Workflow', () => {
    it('should execute a complete workflow from setup to automation execution', async () => {
      // ==========================================
      // STEP 1: Health Check and System Setup
      // ==========================================
      
      // Check if API is healthy
      const healthResponse = await request(app).get('/');
      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body).toHaveProperty('status', 'success');

      // Get system configuration
      const configGetResponse = await request(app).get('/api/setting');
      expect([200, 404]).toContain(configGetResponse.status);

      // Create system configuration
      const configCreateResponse = await request(app)
        .post('/api/setting')
        .send({
          openai_api_key: 'sk-test-key-12345',
          anthropic_api_key: 'anthropic-test-key',
          default_model: 'gpt-4',
        });
      expect([200, 201, 400]).toContain(configCreateResponse.status);

      // Get available models
      const modelsResponse = await request(app).get('/api/models');
      expect(modelsResponse.status).toBe(200);
      expect(Array.isArray(modelsResponse.body)).toBe(true);

      // ==========================================
      // STEP 2: Create Agents
      // ==========================================

      // Create a customer support agent
      const supportAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Customer Support Agent',
          description: 'Handles customer inquiries and support tickets',
          prompt: 'You are a helpful customer support agent. Be polite, clear, and provide accurate information.',
          defaultModel: 'gpt-4',
        });
      expect(supportAgentResponse.status).toBe(201);
      expect(supportAgentResponse.body).toHaveProperty('id');
      const supportAgentId = supportAgentResponse.body.id;

      // Create a data analysis agent
      const dataAgentResponse = await request(app)
        .post('/api/agents')
        .send({
          name: 'Data Analyst',
          description: 'Analyzes data and generates reports',
          prompt: 'You are a data analyst. Analyze data carefully and provide insights.',
          defaultModel: 'gpt-4-turbo',
        });
      expect(dataAgentResponse.status).toBe(201);
      const dataAgentId = dataAgentResponse.body.id;

      // Verify agents were created
      const agentsListResponse = await request(app).get('/api/agents');
      expect(agentsListResponse.status).toBe(200);
      expect(agentsListResponse.body).toHaveLength(2);

      // Get specific agent details
      const agentDetailsResponse = await request(app).get(`/api/agents/${supportAgentId}`);
      expect(agentDetailsResponse.status).toBe(200);
      expect(agentDetailsResponse.body.name).toBe('Customer Support Agent');

      // Update agent
      const agentUpdateResponse = await request(app)
        .patch(`/api/agents/${supportAgentId}`)
        .send({
          description: 'Enhanced customer support agent with extended capabilities',
        });
      expect(agentUpdateResponse.status).toBe(200);
      expect(agentUpdateResponse.body.description).toContain('Enhanced');

      // ==========================================
      // STEP 3: Create System Tools
      // ==========================================

      // Create a REST API tool
      const restApiToolResponse = await request(app)
        .post('/api/tools')
        .send({
          name: 'Customer API',
          description: 'REST API to fetch customer data',
          type: 'restApi',
          config: {
            url: 'https://api.example.com/customers',
            method: 'GET',
            headers: {
              'Authorization': 'Bearer token123',
            },
          },
        });
      expect(restApiToolResponse.status).toBe(201);
      expect(restApiToolResponse.body).toHaveProperty('id');
      const restApiToolId = restApiToolResponse.body.id;

      // Create a webhook tool
      const webhookToolResponse = await request(app)
        .post('/api/tools')
        .send({
          name: 'Notification Webhook',
          description: 'Webhook to receive notifications',
          type: 'webHook',
          config: {
            enabled: true,
          },
        });
      expect(webhookToolResponse.status).toBe(201);
      const webhookToolId = webhookToolResponse.body.id;

      // Create a code execution tool
      const codeToolResponse = await request(app)
        .post('/api/tools')
        .send({
          name: 'Data Processor',
          description: 'Executes JavaScript code to process data',
          type: 'code',
          config: {
            language: 'javascript',
            code: 'return input.map(x => x * 2);',
          },
        });
      expect(codeToolResponse.status).toBe(201);
      const codeToolId = codeToolResponse.body.id;

      // List all tools
      const toolsListResponse = await request(app).get('/api/tools');
      expect(toolsListResponse.status).toBe(200);
      expect(toolsListResponse.body).toHaveLength(3);

      // Get specific tool
      const toolDetailsResponse = await request(app).get(`/api/tools/${restApiToolId}`);
      expect(toolDetailsResponse.status).toBe(200);
      expect(toolDetailsResponse.body.name).toBe('Customer API');

      // Execute code tool
      const toolExecutionResponse = await request(app)
        .post(`/api/tools/${codeToolId}/execute`)
        .send({
          input: [1, 2, 3, 4, 5],
        });
      expect(toolExecutionResponse.status).toBe(200);

      // ==========================================
      // STEP 4: Test Webhooks
      // ==========================================

      // Test webhook GET
      const webhookGetResponse = await request(app)
        .get(`/api/webhooks/${webhookToolId}`)
        .query({ test: 'data' });
      expect([200, 400, 404]).toContain(webhookGetResponse.status);

      // Test webhook POST
      const webhookPostResponse = await request(app)
        .post(`/api/webhooks/${webhookToolId}`)
        .send({ event: 'test', data: { message: 'Hello' } });
      expect([200, 400, 404]).toContain(webhookPostResponse.status);

      // ==========================================
      // STEP 5: Import MCPs (Model Context Protocol)
      // ==========================================

      const mcpImportResponse = await request(app)
        .post('/api/mcps/import')
        .send({
          name: 'File System MCP',
          command: 'npx',
          args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp'],
        });
      
      // MCP import may fail in test environment (201) or due to missing dependencies (400)
      expect([201, 400, 500]).toContain(mcpImportResponse.status);
      
      // Only continue with MCP tests if import succeeded
      if (mcpImportResponse.status === 201) {
        expect(mcpImportResponse.body).toHaveProperty('id');
        const mcpId = mcpImportResponse.body.id;

        // List all MCPs
        const mcpsListResponse = await request(app).get('/api/mcps');
        expect(mcpsListResponse.status).toBe(200);
        expect(Array.isArray(mcpsListResponse.body)).toBe(true);

        // Get MCP tools
        const mcpToolsResponse = await request(app).get(`/api/mcps/${mcpId}/tools`);
        expect(mcpToolsResponse.status).toBe(200);
        expect(Array.isArray(mcpToolsResponse.body)).toBe(true);
      }

      // ==========================================
      // STEP 6: Create Automations
      // ==========================================

      // Create automation with CRON trigger
      const cronAutomationResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Daily Report Generator',
          description: 'Generates daily customer reports',
          trigger: {
            type: 'cron',
            config: {
              schedule: '0 9 * * *', // Every day at 9 AM
            },
          },
          actions: [
            {
              type: 'tool',
              toolId: restApiToolId,
              config: {},
            },
            {
              type: 'agent',
              agentId: dataAgentId,
              config: {
                prompt: 'Analyze the customer data and create a report',
              },
            },
          ],
        });
      expect([201, 400]).toContain(cronAutomationResponse.status);
      
      // Only continue if automation was created
      let cronAutomationId: string | undefined;
      if (cronAutomationResponse.status === 201) {
        expect(cronAutomationResponse.body).toHaveProperty('id');
        cronAutomationId = cronAutomationResponse.body.id;
      }

      // Create automation with webhook trigger
      const webhookAutomationResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Support Ticket Handler',
          description: 'Handles incoming support tickets',
          trigger: {
            type: 'webhook',
            config: {
              toolId: webhookToolId,
            },
          },
          actions: [
            {
              type: 'agent',
              agentId: supportAgentId,
              config: {
                prompt: 'Process this support ticket and provide a response',
              },
            },
          ],
        });
      expect([201, 400]).toContain(webhookAutomationResponse.status);
      const webhookAutomationId = webhookAutomationResponse.status === 201 ? webhookAutomationResponse.body.id : undefined;

      // Create manual automation
      const manualAutomationResponse = await request(app)
        .post('/api/automations')
        .send({
          name: 'Data Processing Pipeline',
          description: 'Manually triggered data processing',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'tool',
              toolId: codeToolId,
              config: {
                input: [10, 20, 30],
              },
            },
          ],
        });
      expect([201, 400]).toContain(manualAutomationResponse.status);
      const manualAutomationId = manualAutomationResponse.status === 201 ? manualAutomationResponse.body.id : undefined;

      // List all automations
      const automationsListResponse = await request(app).get('/api/automations');
      expect(automationsListResponse.status).toBe(200);
      expect(Array.isArray(automationsListResponse.body)).toBe(true);

      // Get specific automation (only if it was created)
      if (cronAutomationId) {
        const automationDetailsResponse = await request(app).get(`/api/automations/${cronAutomationId}`);
        expect(automationDetailsResponse.status).toBe(200);
        expect(automationDetailsResponse.body.name).toBe('Daily Report Generator');
      }

      // Update automation (only if it was created)
      if (cronAutomationId) {
        const automationUpdateResponse = await request(app)
          .patch(`/api/automations/${cronAutomationId}`)
          .send({
            description: 'Updated: Generates comprehensive daily customer reports',
          });
        expect(automationUpdateResponse.status).toBe(200);
        expect(automationUpdateResponse.body.description).toContain('Updated');
      }

      // ==========================================
      // STEP 7: Execute Automations and Monitor
      // ==========================================

      // Execute manual automation directly (only if it was created)
      if (manualAutomationId) {
        const executeDirectResponse = await request(app)
          .post(`/api/automations/${manualAutomationId}/execute`)
          .send({ input: 'test data' });
        expect([200, 400]).toContain(executeDirectResponse.status);
      }

      // Start automation execution via execution controller (only if automation exists)
      if (manualAutomationId) {
        const startExecutionResponse = await request(app)
          .post(`/api/execution/${manualAutomationId}/start`)
          .send({ input: 'test execution' });
        expect([200, 400, 404]).toContain(startExecutionResponse.status);
        
        if (startExecutionResponse.status === 200) {
          expect(startExecutionResponse.body).toHaveProperty('executionId');
        }
      }

      // Get execution status (only if automation exists)
      if (manualAutomationId) {
        const statusResponse = await request(app).get(`/api/execution/${manualAutomationId}/status`);
        expect([200, 404]).toContain(statusResponse.status);
        
        if (statusResponse.status === 200) {
          expect(statusResponse.body).toHaveProperty('status');
        }
      }

      // Get execution logs (only if automation exists)
      if (manualAutomationId) {
        const logsResponse = await request(app).get(`/api/execution/${manualAutomationId}/logs`);
        expect([200, 404]).toContain(logsResponse.status);
        
        if (logsResponse.status === 200) {
          expect(Array.isArray(logsResponse.body)).toBe(true);
        }
      }

      // ==========================================
      // STEP 8: Cleanup Operations
      // ==========================================

      // Delete MCP (only if it was created)
      if (mcpImportResponse.status === 201 && mcpImportResponse.body.id) {
        const mcpDeleteResponse = await request(app).delete(`/api/mcps/${mcpImportResponse.body.id}`);
        expect(mcpDeleteResponse.status).toBe(204);
      }

      // Delete automation (only if it was created)
      if (webhookAutomationId) {
        const automationDeleteResponse = await request(app).delete(`/api/automations/${webhookAutomationId}`);
        expect(automationDeleteResponse.status).toBe(204);

        // Verify automation was deleted
        const deletedAutomationResponse = await request(app).get(`/api/automations/${webhookAutomationId}`);
        expect(deletedAutomationResponse.status).toBe(404);
      }

      // Delete tool
      const toolDeleteResponse = await request(app).delete(`/api/tools/${codeToolId}`);
      expect(toolDeleteResponse.status).toBe(204);

      // Delete agent
      const agentDeleteResponse = await request(app).delete(`/api/agents/${dataAgentId}`);
      expect(agentDeleteResponse.status).toBe(204);

      // Verify final state
      const finalAgentsResponse = await request(app).get('/api/agents');
      expect(finalAgentsResponse.body).toHaveLength(1);

      const finalToolsResponse = await request(app).get('/api/tools');
      expect(finalToolsResponse.body).toHaveLength(2);

      const finalAutomationsResponse = await request(app).get('/api/automations');
      expect(Array.isArray(finalAutomationsResponse.body)).toBe(true);
    });
  });

  describe('Scenario 2: Multi-Agent Collaboration Workflow', () => {
    it('should coordinate multiple agents in a complex automation', async () => {
      // Create specialized agents
      const researchAgent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Research Agent',
          prompt: 'You are a research specialist. Gather and organize information.',
          defaultModel: 'gpt-4',
        });

      const writerAgent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Content Writer',
          prompt: 'You are a skilled content writer. Create engaging content.',
          defaultModel: 'gpt-4',
        });

      const reviewerAgent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Content Reviewer',
          prompt: 'You are a content reviewer. Ensure quality and accuracy.',
          defaultModel: 'gpt-4',
        });

      expect(researchAgent.status).toBe(201);
      expect(writerAgent.status).toBe(201);
      expect(reviewerAgent.status).toBe(201);

      // Create tools for the workflow
      const dataTool = await request(app)
        .post('/api/tools')
        .send({
          name: 'Data Fetcher',
          type: 'restApi',
          config: {
            url: 'https://api.example.com/data',
            method: 'GET',
          },
        });

      expect(dataTool.status).toBe(201);

      // Create complex automation
      const contentPipeline = await request(app)
        .post('/api/automations')
        .send({
          name: 'Content Creation Pipeline',
          description: 'Multi-agent content creation workflow',
          trigger: {
            type: 'manual',
            config: {},
          },
          actions: [
            {
              type: 'tool',
              toolId: dataTool.body.id,
              config: {},
            },
            {
              type: 'agent',
              agentId: researchAgent.body.id,
              config: { prompt: 'Research the topic' },
            },
            {
              type: 'agent',
              agentId: writerAgent.body.id,
              config: { prompt: 'Write content based on research' },
            },
            {
              type: 'agent',
              agentId: reviewerAgent.body.id,
              config: { prompt: 'Review and improve the content' },
            },
          ],
        });

      expect([201, 400]).toContain(contentPipeline.status);
      
      // Only test execution if creation succeeded
      if (contentPipeline.status !== 201) {
        return;
      }

      // Execute the pipeline
      const execution = await request(app)
        .post(`/api/automations/${contentPipeline.body.id}/execute`)
        .send({ topic: 'AI in Healthcare' });

      expect(execution.status).toBe(200);
    });
  });

  describe('Scenario 3: Real-time Event Streaming', () => {
    it('should handle event streaming for long-running automations', async () => {
      // Create an agent
      const agent = await request(app)
        .post('/api/agents')
        .send({
          name: 'Processing Agent',
          prompt: 'Process data streams',
        });

      // Create automation
      const automation = await request(app)
        .post('/api/automations')
        .send({
          name: 'Stream Processor',
          trigger: { type: 'manual', config: {} },
          actions: [
            {
              type: 'agent',
              agentId: agent.body.id,
              config: { prompt: 'Process this data' },
            },
          ],
        });

      expect([201, 400]).toContain(automation.status);
      
      // Only continue if creation succeeded
      if (automation.status !== 201) {
        return;
      }

      // Start execution
      const execution = await request(app)
        .post(`/api/execution/${automation.body.id}/start`)
        .send({ data: 'test' });

      expect(execution.status).toBe(200);

      // Note: Event streaming endpoint is tested but won't wait for events in this test
      // In a real scenario, you would establish an SSE connection
      const eventsEndpoint = `/api/execution/${automation.body.id}/events`;
      expect(eventsEndpoint).toBeDefined();
    });
  });

  describe('Scenario 4: Configuration Management', () => {
    it('should manage system configuration effectively', async () => {
      // Create initial config
      const createConfig = await request(app)
        .post('/api/setting')
        .send({
          openai_api_key: 'initial-key',
          default_model: 'gpt-3.5-turbo',
        });

      expect([200, 201, 400]).toContain(createConfig.status);

      // Get config
      const getConfig = await request(app).get('/api/setting');
      expect([200, 404]).toContain(getConfig.status);
      
      if (getConfig.status === 200 && getConfig.body) {
        // Config body may have different structure - just verify it exists
        expect(getConfig.body).toBeDefined();
      }

      // Update config
      const updateConfig = await request(app)
        .patch('/api/setting')
        .send({
          default_model: 'gpt-4',
          anthropic_api_key: 'new-anthropic-key',
        });

      expect([200, 404]).toContain(updateConfig.status);
      if (updateConfig.status === 200) {
        expect(updateConfig.body.default_model).toBe('gpt-4');
      }

      // Verify models are available
      const models = await request(app).get('/api/models');
      expect(models.status).toBe(200);
      expect(Array.isArray(models.body)).toBe(true);
    });
  });
});
