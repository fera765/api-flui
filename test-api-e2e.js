/**
 * End-to-End API Testing Script
 * Tests all endpoints and automation scenarios
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const api = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true, // Don't throw on any status
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testCount = 0;
let passCount = 0;
let failCount = 0;

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function assert(condition, message) {
  testCount++;
  if (condition) {
    passCount++;
    log(`  ✓ ${message}`, colors.green);
  } else {
    failCount++;
    log(`  ✗ ${message}`, colors.red);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function section(title) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${title}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

// Helper to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Store created resources
const resources = {
  agents: [],
  tools: [],
  automations: [],
  mcps: [],
};

async function runTests() {
  try {
    log('\n🚀 Starting End-to-End API Tests\n', colors.blue);
    
    // ============================================================
    // 0. CLEANUP EXISTING DATA
    // ============================================================
    section('0. Cleanup - Remove existing test data');
    
    // Clean agents
    const existingAgents = await api.get('/api/agents');
    for (const agent of existingAgents.data || []) {
      await api.delete(`/api/agents/${agent.id}`);
    }
    log(`  Cleaned ${existingAgents.data?.length || 0} existing agents`);
    
    // Clean tools
    const existingTools = await api.get('/api/tools');
    for (const tool of existingTools.data || []) {
      await api.delete(`/api/tools/${tool.id}`);
    }
    log(`  Cleaned ${existingTools.data?.length || 0} existing tools`);
    
    // Clean automations
    const existingAutos = await api.get('/api/automations');
    for (const auto of existingAutos.data || []) {
      await api.delete(`/api/automations/${auto.id}`);
    }
    log(`  Cleaned ${existingAutos.data?.length || 0} existing automations`);
    
    // ============================================================
    // 1. HEALTH CHECK
    // ============================================================
    section('1. Health Check Tests');
    
    const health = await api.get('/');
    assert(health.status === 200, 'Health check returns 200');
    assert(health.data.status === 'success', 'Health check status is success');
    assert(health.data.message === 'API is running', 'Health check has correct message');
    assert(health.data.timestamp, 'Health check has timestamp');
    log(`  Response: ${JSON.stringify(health.data)}`);

    // ============================================================
    // 2. SYSTEM CONFIGURATION
    // ============================================================
    section('2. System Configuration Tests');
    
    // Create config
    const configData = {
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'sk-test-api-key-12345',
      model: 'gpt-4',
    };
    
    const createConfig = await api.post('/api/setting', configData);
    assert(createConfig.status === 201, 'Create config returns 201');
    assert(createConfig.data.endpoint === 'https://api.openai.com/v1', 'Config has correct endpoint');
    assert(createConfig.data.model === 'gpt-4', 'Config has correct model');
    
    // Get config
    const getConfig = await api.get('/api/setting');
    assert(getConfig.status === 200, 'Get config returns 200');
    assert(getConfig.data.endpoint === 'https://api.openai.com/v1', 'Retrieved config matches');
    
    // Update config
    const updateConfig = await api.patch('/api/setting', { 
      endpoint: 'https://api.openai.com/v1',
      model: 'gpt-4-turbo'
    });
    assert(updateConfig.status === 200, 'Update config returns 200');
    assert(updateConfig.data.model === 'gpt-4-turbo', 'Config updated correctly');

    // ============================================================
    // 3. MODELS
    // ============================================================
    section('3. Models Tests');
    
    const models = await api.get('/api/models');
    // Models endpoint may fail if external API is not available - that's expected
    log(`  Get models status: ${models.status}`);
    if (models.status === 200) {
      log(`  Models endpoint working: ${JSON.stringify(models.data).substring(0, 100)}...`);
    } else {
      log(`  Models endpoint returned error (expected with test credentials): ${models.data.message}`);
    }

    // ============================================================
    // 4. AGENTS CRUD
    // ============================================================
    section('4. Agents CRUD Tests');
    
    // Create agent
    const agentData = {
      name: 'Test Agent',
      description: 'An agent for E2E testing',
      prompt: 'You are a helpful assistant',
      defaultModel: 'gpt-4',
    };
    
    const createAgent = await api.post('/api/agents', agentData);
    assert(createAgent.status === 201, 'Create agent returns 201');
    assert(createAgent.data.id, 'Agent has ID');
    assert(createAgent.data.name === 'Test Agent', 'Agent has correct name');
    assert(createAgent.data.prompt === 'You are a helpful assistant', 'Agent has correct prompt');
    resources.agents.push(createAgent.data.id);
    
    // Get all agents
    const getAgents = await api.get('/api/agents');
    assert(getAgents.status === 200, 'Get agents returns 200');
    assert(Array.isArray(getAgents.data), 'Agents response is array');
    assert(getAgents.data.length >= 1, 'Has at least one agent');
    
    // Get agent by ID
    const getAgent = await api.get(`/api/agents/${createAgent.data.id}`);
    assert(getAgent.status === 200, 'Get agent by ID returns 200');
    assert(getAgent.data.id === createAgent.data.id, 'Retrieved correct agent');
    
    // Update agent
    const updateAgent = await api.patch(`/api/agents/${createAgent.data.id}`, {
      description: 'Updated description',
    });
    assert(updateAgent.status === 200, 'Update agent returns 200');
    assert(updateAgent.data.description === 'Updated description', 'Agent updated correctly');

    // Create second agent for automation tests
    const agent2 = await api.post('/api/agents', {
      name: 'Analysis Agent',
      description: 'Agent for data analysis',
      prompt: 'Analyze data and provide insights',
      defaultModel: 'gpt-4',
    });
    resources.agents.push(agent2.data.id);

    // ============================================================
    // 5. TOOLS CRUD
    // ============================================================
    section('5. Tools CRUD Tests');
    
    // Create HTTP tool
    const httpTool = {
      name: 'HTTP GET Tool',
      description: 'Makes HTTP GET requests',
      type: 'http_request',
      config: {
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: { 'Content-Type': 'application/json' },
      },
    };
    
    const createHttpTool = await api.post('/api/tools', httpTool);
    assert(createHttpTool.status === 201, 'Create HTTP tool returns 201');
    assert(createHttpTool.data.id, 'Tool has ID');
    assert(createHttpTool.data.type === 'http_request', 'Tool has correct type');
    resources.tools.push(createHttpTool.data.id);
    
    // Create webhook tool
    const webhookTool = {
      name: 'Webhook Tool',
      description: 'Receives webhook data',
      type: 'webhook',
      config: {
        method: 'POST',
        responseType: 'json',
      },
    };
    
    const createWebhookTool = await api.post('/api/tools', webhookTool);
    assert(createWebhookTool.status === 201, 'Create webhook tool returns 201');
    resources.tools.push(createWebhookTool.data.id);
    
    // Get all tools
    const getTools = await api.get('/api/tools');
    assert(getTools.status === 200, 'Get tools returns 200');
    assert(getTools.data.length >= 2, 'Has at least 2 tools');
    
    // Get tool by ID
    const getTool = await api.get(`/api/tools/${createHttpTool.data.id}`);
    assert(getTool.status === 200, 'Get tool by ID returns 200');
    
    // Execute HTTP tool
    const executeTool = await api.post(`/api/tools/${createHttpTool.data.id}/execute`, {
      input: {},
    });
    assert(executeTool.status === 200, 'Execute tool returns 200');
    log(`  Tool execution result: ${JSON.stringify(executeTool.data).substring(0, 100)}`);

    // ============================================================
    // 6. MCP TESTS
    // ============================================================
    section('6. MCP Tests');
    
    // Get all MCPs (initially empty)
    const getMCPs = await api.get('/api/mcps');
    assert(getMCPs.status === 200, 'Get MCPs returns 200');
    assert(Array.isArray(getMCPs.data), 'MCPs response is array');
    
    // Import MCP (will fail without actual MCP server, but tests the endpoint)
    const importMCP = await api.post('/api/mcps/import', {
      name: 'Test MCP',
      command: 'node',
      args: ['test-mcp-server.js'],
    });
    log(`  Import MCP status: ${importMCP.status} (expected to fail without real MCP server)`);

    // ============================================================
    // 7. AUTOMATIONS - MANUAL TRIGGER
    // ============================================================
    section('7. Automation Tests - Manual Trigger');
    
    const manualAutomation = {
      name: 'Manual HTTP Request Automation',
      description: 'Fetches data from API manually',
      nodes: [
        {
          id: 'trigger-1',
          type: 'trigger',
          referenceId: 'manual-trigger',
        },
        {
          id: 'http-request-1',
          type: 'tool',
          referenceId: createHttpTool.data.id,
        },
      ],
      links: [
        { from: 'trigger-1', to: 'http-request-1' },
      ],
    };
    
    const createManualAuto = await api.post('/api/automations', manualAutomation);
    assert(createManualAuto.status === 201, 'Create manual automation returns 201');
    assert(createManualAuto.data.id, 'Automation has ID');
    assert(createManualAuto.data.name === 'Manual HTTP Request Automation', 'Automation has correct name');
    resources.automations.push(createManualAuto.data.id);
    
    // Execute manual automation
    const executeManual = await api.post(`/api/automations/${createManualAuto.data.id}/execute`, {});
    log(`  Execute manual automation status: ${executeManual.status}`);
    if (executeManual.status === 200) {
      log(`  Execution result: ${executeManual.data.status || 'completed'}`);
    }

    // ============================================================
    // 8. AUTOMATIONS - WEBHOOK TRIGGER
    // ============================================================
    section('8. Automation Tests - Webhook Trigger');
    
    const webhookAutomation = {
      name: 'Webhook Triggered Automation',
      description: 'Triggered by webhook',
      nodes: [
        {
          id: 'webhook-trigger-1',
          type: 'trigger',
          referenceId: createWebhookTool.data.id,
        },
        {
          id: 'process-webhook',
          type: 'tool',
          referenceId: createHttpTool.data.id,
        },
      ],
      links: [
        { from: 'webhook-trigger-1', to: 'process-webhook' },
      ],
    };
    
    const createWebhookAuto = await api.post('/api/automations', webhookAutomation);
    assert(createWebhookAuto.status === 201, 'Create webhook automation returns 201');
    assert(createWebhookAuto.data.name === 'Webhook Triggered Automation', 'Webhook automation has correct name');
    resources.automations.push(createWebhookAuto.data.id);
    
    // Trigger webhook
    const triggerWebhook = await api.post(`/api/webhooks/${createWebhookTool.data.id}`, {
      data: { test: 'webhook data' },
    });
    log(`  Webhook trigger status: ${triggerWebhook.status}`);
    if (triggerWebhook.status === 200 || triggerWebhook.status === 201) {
      log(`  Webhook triggered successfully`);
    }

    // ============================================================
    // 9. AUTOMATIONS - CRON TRIGGER (Create only, won't execute)
    // ============================================================
    section('9. Automation Tests - Cron/Scheduled Trigger');
    
    const cronAutomation = {
      name: 'Scheduled Automation',
      description: 'Runs periodically',
      nodes: [
        {
          id: 'cron-trigger-1',
          type: 'trigger',
          referenceId: 'cron-schedule',
          config: { schedule: '* * * * *' }, // Every minute
        },
        {
          id: 'scheduled-task',
          type: 'tool',
          referenceId: createHttpTool.data.id,
        },
      ],
      links: [
        { from: 'cron-trigger-1', to: 'scheduled-task' },
      ],
    };
    
    const createCronAuto = await api.post('/api/automations', cronAutomation);
    assert(createCronAuto.status === 201, 'Create scheduled automation returns 201');
    assert(createCronAuto.data.name === 'Scheduled Automation', 'Scheduled automation has correct name');
    resources.automations.push(createCronAuto.data.id);
    log(`  Scheduled automation created successfully`);

    // ============================================================
    // 10. AUTOMATIONS - COMPLEX WORKFLOW
    // ============================================================
    section('10. Automation Tests - Complex Workflow');
    
    const complexAutomation = {
      name: 'Complex Multi-Step Workflow',
      description: 'Automation with multiple nodes and branches',
      nodes: [
        {
          id: 'trigger-complex',
          type: 'trigger',
          referenceId: 'manual-complex',
        },
        {
          id: 'fetch-data',
          type: 'tool',
          referenceId: createHttpTool.data.id,
        },
        {
          id: 'process-data',
          type: 'agent',
          referenceId: createAgent.data.id,
          config: {
            prompt: 'Process this data: {{fetch-data.output}}',
          },
        },
        {
          id: 'analyze',
          type: 'agent',
          referenceId: agent2.data.id,
          config: {
            prompt: 'Analyze: {{process-data.output}}',
          },
        },
      ],
      links: [
        { from: 'trigger-complex', to: 'fetch-data' },
        { from: 'fetch-data', to: 'process-data' },
        { from: 'process-data', to: 'analyze' },
      ],
    };
    
    const createComplexAuto = await api.post('/api/automations', complexAutomation);
    assert(createComplexAuto.status === 201, 'Create complex automation returns 201');
    assert(createComplexAuto.data.nodes.length === 4, 'Complex automation has 4 nodes');
    resources.automations.push(createComplexAuto.data.id);
    
    // Execute complex automation (may fail if agents need real API keys)
    const executeComplex = await api.post(`/api/automations/${createComplexAuto.data.id}/execute`, {});
    log(`  Complex automation execution status: ${executeComplex.status}`);

    // ============================================================
    // 11. AUTOMATIONS CRUD
    // ============================================================
    section('11. Automations CRUD Tests');
    
    // Get all automations
    const getAutomations = await api.get('/api/automations');
    assert(getAutomations.status === 200, 'Get automations returns 200');
    assert(getAutomations.data.length >= 3, 'Has at least 3 automations');
    
    // Get automation by ID
    const getAutomation = await api.get(`/api/automations/${createManualAuto.data.id}`);
    assert(getAutomation.status === 200, 'Get automation by ID returns 200');
    
    // Update automation
    const updateAutomation = await api.patch(`/api/automations/${createManualAuto.data.id}`, {
      description: 'Updated automation description',
    });
    assert(updateAutomation.status === 200, 'Update automation returns 200');
    assert(updateAutomation.data.description === 'Updated automation description', 'Automation updated');

    // ============================================================
    // 12. EXECUTION TRACKING
    // ============================================================
    section('12. Execution Tracking Tests');
    
    // Start execution
    const startExecution = await api.post(`/api/execution/${createManualAuto.data.id}/start`, {});
    log(`  Start execution status: ${startExecution.status}`);
    if (startExecution.status === 200) {
      log(`  Execution started successfully`);
    }
    
    // Wait a bit for execution
    await sleep(1000);
    
    // Get execution status
    const getStatus = await api.get(`/api/execution/${createManualAuto.data.id}/status`);
    log(`  Get execution status: ${getStatus.status}`);
    if (getStatus.status === 200) {
      log(`  Execution status: ${JSON.stringify(getStatus.data)}`);
    }
    
    // Get execution logs
    const getLogs = await api.get(`/api/execution/${createManualAuto.data.id}/logs`);
    log(`  Get execution logs: ${getLogs.status}`);
    if (getLogs.status === 200 && Array.isArray(getLogs.data)) {
      log(`  Found ${getLogs.data.length} execution logs`);
    }

    // ============================================================
    // 13. ERROR HANDLING
    // ============================================================
    section('13. Error Handling Tests');
    
    // Get non-existent agent
    const notFound = await api.get('/api/agents/non-existent-id');
    assert(notFound.status === 404, 'Non-existent resource returns 404');
    
    // Create agent with invalid data
    const invalidAgent = await api.post('/api/agents', { name: '' });
    assert(invalidAgent.status === 400, 'Invalid data returns 400');
    
    // Update non-existent resource
    const updateNonExistent = await api.patch('/api/agents/non-existent-id', { name: 'Test' });
    assert(updateNonExistent.status === 404, 'Update non-existent returns 404');

    // ============================================================
    // 14. CLEANUP - DELETE RESOURCES
    // ============================================================
    section('14. Cleanup - Delete Resources');
    
    // Delete automations
    for (const autoId of resources.automations) {
      const deleteAuto = await api.delete(`/api/automations/${autoId}`);
      assert(deleteAuto.status === 204, `Delete automation ${autoId} returns 204`);
    }
    
    // Delete tools
    for (const toolId of resources.tools) {
      const deleteTool = await api.delete(`/api/tools/${toolId}`);
      assert(deleteTool.status === 204, `Delete tool ${toolId} returns 204`);
    }
    
    // Delete agents
    for (const agentId of resources.agents) {
      const deleteAgent = await api.delete(`/api/agents/${agentId}`);
      assert(deleteAgent.status === 204, `Delete agent ${agentId} returns 204`);
    }
    
    // Verify deletions
    const finalAgents = await api.get('/api/agents');
    assert(finalAgents.data.length === 0, 'All agents deleted');
    
    const finalTools = await api.get('/api/tools');
    assert(finalTools.data.length === 0, 'All tools deleted');
    
    const finalAutomations = await api.get('/api/automations');
    assert(finalAutomations.data.length === 0, 'All automations deleted');

    // ============================================================
    // RESULTS SUMMARY
    // ============================================================
    section('Test Results Summary');
    
    log(`\nTotal Tests: ${testCount}`, colors.blue);
    log(`Passed: ${passCount}`, colors.green);
    log(`Failed: ${failCount}`, failCount > 0 ? colors.red : colors.green);
    log(`Success Rate: ${((passCount / testCount) * 100).toFixed(2)}%\n`, colors.cyan);
    
    if (failCount === 0) {
      log('🎉 All tests passed successfully!', colors.green);
    } else {
      log('❌ Some tests failed. Please review the output above.', colors.red);
    }
    
    process.exit(failCount > 0 ? 1 : 0);
    
  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
log('Waiting 2 seconds for API to be ready...', colors.yellow);
setTimeout(runTests, 2000);
