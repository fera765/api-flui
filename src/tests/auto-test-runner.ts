/**
 * 🧠 AUTO TEST RUNNER
 * Sistema de testes E2E automatizado com autocorreção
 */

import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
const RESULTS_DIR = path.join(__dirname, 'results');

interface TestResult {
  route: string;
  method: string;
  status: 'OK' | 'CORRECTED' | 'FAILED';
  statusCode?: number;
  responseTime: number;
  error?: string;
  corrections?: string[];
  timestamp: string;
}

interface TestContext {
  agentId?: string;
  mcpId?: string;
  toolId?: string;
  systemToolId?: string;
  conditionToolId?: string;
  automationId?: string;
  torToolId?: string;
}

class AutoTestRunner {
  private results: TestResult[] = [];
  private context: TestContext = {};
  private startTime = Date.now();

  // Helper para fazer requisições
  private async makeRequest(
    method: string,
    endpoint: string,
    data?: any,
    config?: any
  ): Promise<{ status: number; data: any; time: number }> {
    const start = Date.now();
    try {
      const response = await axios({
        method,
        url: `${BASE_URL}${endpoint}`,
        data,
        ...config,
      });
      return {
        status: response.status,
        data: response.data,
        time: Date.now() - start,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        status: axiosError.response?.status || 500,
        data: axiosError.response?.data,
        time: Date.now() - start,
      };
    }
  }

  // Registrar resultado do teste
  private logResult(
    route: string,
    method: string,
    status: 'OK' | 'CORRECTED' | 'FAILED',
    statusCode: number,
    responseTime: number,
    error?: string,
    corrections?: string[]
  ) {
    const result: TestResult = {
      route,
      method,
      status,
      statusCode,
      responseTime,
      error,
      corrections,
      timestamp: new Date().toISOString(),
    };
    this.results.push(result);

    const emoji = status === 'OK' ? '✅' : status === 'CORRECTED' ? '🔧' : '❌';
    console.log(`${emoji} ${method} ${route} - ${statusCode} (${responseTime}ms)`);
    if (error) console.log(`   Error: ${error}`);
    if (corrections) console.log(`   Corrections: ${corrections.join(', ')}`);
  }

  // 1️⃣ CORE & HEALTH
  async testHealthAndConfig() {
    console.log('\n🏥 Testing Health & Config...');

    // Health Check
    const health = await this.makeRequest('GET', '/');
    this.logResult('/', 'GET', health.status === 200 ? 'OK' : 'FAILED', health.status, health.time);

    // Get Models (before config)
    const models = await this.makeRequest('GET', '/api/models');
    this.logResult('/api/models', 'GET', models.status === 200 ? 'OK' : 'FAILED', models.status, models.time);

    // Create Config
    const configData = {
      endpoint: 'https://api.openai.com/v1',
      apiKey: 'test-key-123',
      model: 'gpt-4',
    };
    const createConfig = await this.makeRequest('POST', '/api/setting', configData);
    this.logResult('/api/setting', 'POST', createConfig.status === 201 ? 'OK' : 'FAILED', createConfig.status, createConfig.time);

    // Get Config
    const getConfig = await this.makeRequest('GET', '/api/setting');
    this.logResult('/api/setting', 'GET', getConfig.status === 200 ? 'OK' : 'FAILED', getConfig.status, getConfig.time);

    // Update Config
    const updateConfig = await this.makeRequest('PATCH', '/api/setting', { model: 'gpt-4-turbo' });
    this.logResult('/api/setting', 'PATCH', updateConfig.status === 200 ? 'OK' : 'FAILED', updateConfig.status, updateConfig.time);
  }

  // 2️⃣ AGENTS
  async testAgents() {
    console.log('\n🤖 Testing Agents...');

    // Create Agent
    const agentData = {
      name: 'Test Agent',
      description: 'Agent for automated testing',
      prompt: 'You are a helpful test agent',
      defaultModel: 'gpt-4',
    };
    const createAgent = await this.makeRequest('POST', '/api/agents', agentData);
    this.logResult('/api/agents', 'POST', createAgent.status === 201 ? 'OK' : 'FAILED', createAgent.status, createAgent.time);
    
    if (createAgent.status === 201 && createAgent.data?.id) {
      this.context.agentId = createAgent.data.id;
    }

    // Get All Agents
    const getAllAgents = await this.makeRequest('GET', '/api/agents');
    this.logResult('/api/agents', 'GET', getAllAgents.status === 200 ? 'OK' : 'FAILED', getAllAgents.status, getAllAgents.time);

    if (this.context.agentId) {
      // Get Agent by ID
      const getAgent = await this.makeRequest('GET', `/api/agents/${this.context.agentId}`);
      this.logResult(`/api/agents/:id`, 'GET', getAgent.status === 200 ? 'OK' : 'FAILED', getAgent.status, getAgent.time);

      // Update Agent
      const updateAgent = await this.makeRequest('PATCH', `/api/agents/${this.context.agentId}`, {
        description: 'Updated test agent',
      });
      this.logResult(`/api/agents/:id`, 'PATCH', updateAgent.status === 200 ? 'OK' : 'FAILED', updateAgent.status, updateAgent.time);
    }
  }

  // 3️⃣ MCPs
  async testMCPs() {
    console.log('\n🔌 Testing MCPs...');

    // Import MCP
    const mcpData = {
      name: 'Test MCP',
      source: 'npx test-mcp',
      description: 'MCP for testing',
      env: { TEST_KEY: 'test_value' },
    };
    const importMCP = await this.makeRequest('POST', '/api/mcps/import', mcpData);
    this.logResult('/api/mcps/import', 'POST', importMCP.status === 201 ? 'OK' : 'FAILED', importMCP.status, importMCP.time);
    
    if (importMCP.status === 201 && importMCP.data?.id) {
      this.context.mcpId = importMCP.data.id;
    }

    // Get All MCPs
    const getAllMCPs = await this.makeRequest('GET', '/api/mcps');
    this.logResult('/api/mcps', 'GET', getAllMCPs.status === 200 ? 'OK' : 'FAILED', getAllMCPs.status, getAllMCPs.time);

    if (this.context.mcpId) {
      // Get MCP Tools
      const getMCPTools = await this.makeRequest('GET', `/api/mcps/${this.context.mcpId}/tools`);
      this.logResult(`/api/mcps/:id/tools`, 'GET', getMCPTools.status === 200 ? 'OK' : 'FAILED', getMCPTools.status, getMCPTools.time);
    }
  }

  // 4️⃣ SYSTEM TOOLS
  async testSystemTools() {
    console.log('\n🔧 Testing System Tools...');

    // Create Tool
    const toolData = {
      name: 'Test Tool',
      description: 'Tool for testing',
      type: 'webhook',
      config: {
        url: 'https://httpbin.org/post',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      inputSchema: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      outputSchema: {
        type: 'object',
      },
    };
    const createTool = await this.makeRequest('POST', '/api/tools', toolData);
    this.logResult('/api/tools', 'POST', createTool.status === 201 ? 'OK' : 'FAILED', createTool.status, createTool.time);
    
    if (createTool.status === 201 && createTool.data?.id) {
      this.context.systemToolId = createTool.data.id;
    }

    // Get All Tools
    const getAllTools = await this.makeRequest('GET', '/api/tools');
    this.logResult('/api/tools', 'GET', getAllTools.status === 200 ? 'OK' : 'FAILED', getAllTools.status, getAllTools.time);

    if (this.context.systemToolId) {
      // Get Tool by ID
      const getTool = await this.makeRequest('GET', `/api/tools/${this.context.systemToolId}`);
      this.logResult(`/api/tools/:id`, 'GET', getTool.status === 200 ? 'OK' : 'FAILED', getTool.status, getTool.time);

      // Execute Tool
      const executeTool = await this.makeRequest('POST', `/api/tools/${this.context.systemToolId}/execute`, {
        message: 'Test execution',
      });
      this.logResult(`/api/tools/:id/execute`, 'POST', executeTool.status === 200 ? 'OK' : 'FAILED', executeTool.status, executeTool.time);
    }
  }

  // 5️⃣ CONDITION TOOLS
  async testConditionTools() {
    console.log('\n⚖️ Testing Condition Tools...');

    // Create Condition Tool
    const conditionData = {
      name: 'Test Condition',
      description: 'Condition for testing',
      conditions: [
        { field: 'status', operator: 'eq', value: 'active', logicalOperator: 'AND' },
        { field: 'count', operator: 'gt', value: 10, logicalOperator: 'AND' },
      ],
    };
    const createCondition = await this.makeRequest('POST', '/api/tools/condition', conditionData);
    this.logResult('/api/tools/condition', 'POST', createCondition.status === 201 ? 'OK' : 'FAILED', createCondition.status, createCondition.time);
    
    if (createCondition.status === 201 && createCondition.data?.id) {
      this.context.conditionToolId = createCondition.data.id;
    }

    // Get All Conditions
    const getAllConditions = await this.makeRequest('GET', '/api/tools/condition');
    this.logResult('/api/tools/condition', 'GET', getAllConditions.status === 200 ? 'OK' : 'FAILED', getAllConditions.status, getAllConditions.time);

    if (this.context.conditionToolId) {
      // Get Condition by ID
      const getCondition = await this.makeRequest('GET', `/api/tools/condition/${this.context.conditionToolId}`);
      this.logResult(`/api/tools/condition/:id`, 'GET', getCondition.status === 200 ? 'OK' : 'FAILED', getCondition.status, getCondition.time);

      // Evaluate Condition
      const evaluateCondition = await this.makeRequest('POST', `/api/tools/condition/${this.context.conditionToolId}/evaluate`, {
        input: { status: 'active', count: 15 },
        evaluateAll: false,
      });
      this.logResult(`/api/tools/condition/:id/evaluate`, 'POST', evaluateCondition.status === 200 ? 'OK' : 'FAILED', evaluateCondition.status, evaluateCondition.time);

      // Update Condition
      const updateCondition = await this.makeRequest('PATCH', `/api/tools/condition/${this.context.conditionToolId}`, {
        description: 'Updated condition',
      });
      this.logResult(`/api/tools/condition/:id`, 'PATCH', updateCondition.status === 200 ? 'OK' : 'FAILED', updateCondition.status, updateCondition.time);
    }
  }

  // 6️⃣ AUTOMATIONS
  async testAutomations() {
    console.log('\n⚙️ Testing Automations...');

    // Create Automation
    const automationData = {
      name: 'Test Automation',
      description: 'Automation for testing',
      nodes: [
        { id: 'node1', type: 'trigger', config: { event: 'test_start' } },
        { id: 'node2', type: 'action', config: { action: 'log', message: 'Test message' } },
      ],
      links: [{ from: 'node1', to: 'node2' }],
    };
    const createAutomation = await this.makeRequest('POST', '/api/automations', automationData);
    this.logResult('/api/automations', 'POST', createAutomation.status === 201 ? 'OK' : 'FAILED', createAutomation.status, createAutomation.time);
    
    if (createAutomation.status === 201 && createAutomation.data?.id) {
      this.context.automationId = createAutomation.data.id;
    }

    // Get All Automations
    const getAllAutomations = await this.makeRequest('GET', '/api/automations');
    this.logResult('/api/automations', 'GET', getAllAutomations.status === 200 ? 'OK' : 'FAILED', getAllAutomations.status, getAllAutomations.time);

    if (this.context.automationId) {
      // Get Automation by ID
      const getAutomation = await this.makeRequest('GET', `/api/automations/${this.context.automationId}`);
      this.logResult(`/api/automations/:id`, 'GET', getAutomation.status === 200 ? 'OK' : 'FAILED', getAutomation.status, getAutomation.time);

      // Update Automation
      const updateAutomation = await this.makeRequest('PATCH', `/api/automations/${this.context.automationId}`, {
        description: 'Updated automation',
      });
      this.logResult(`/api/automations/:id`, 'PATCH', updateAutomation.status === 200 ? 'OK' : 'FAILED', updateAutomation.status, updateAutomation.time);

      // Execute Automation (sync)
      const executeAutomation = await this.makeRequest('POST', `/api/automations/${this.context.automationId}/execute`, {
        testData: 'sample input',
      });
      this.logResult(`/api/automations/:id/execute`, 'POST', executeAutomation.status === 200 ? 'OK' : 'FAILED', executeAutomation.status, executeAutomation.time);
    }
  }

  // 7️⃣ EXECUTION (Async with Stream)
  async testExecution() {
    console.log('\n🚀 Testing Execution...');

    if (!this.context.automationId) {
      console.log('⚠️ Skipping execution tests - no automation created');
      return;
    }

    // Start Execution
    const startExecution = await this.makeRequest('POST', `/api/execution/${this.context.automationId}/start`, {
      testData: 'async execution',
    });
    this.logResult(`/api/execution/:id/start`, 'POST', startExecution.status === 202 ? 'OK' : 'FAILED', startExecution.status, startExecution.time);

    // Wait a bit for execution
    await new Promise(resolve => setTimeout(resolve, 500));

    // Get Status
    const getStatus = await this.makeRequest('GET', `/api/execution/${this.context.automationId}/status`);
    this.logResult(`/api/execution/:id/status`, 'GET', getStatus.status === 200 ? 'OK' : 'FAILED', getStatus.status, getStatus.time);

    // Get Logs
    const getLogs = await this.makeRequest('GET', `/api/execution/${this.context.automationId}/logs`);
    this.logResult(`/api/execution/:id/logs`, 'GET', getLogs.status === 200 ? 'OK' : 'FAILED', getLogs.status, getLogs.time);

    // Note: /api/execution/:id/events is SSE stream - cannot test with axios easily
    console.log('ℹ️ Stream endpoint /api/execution/:id/events requires SSE client (skipped)');
  }

  // 8️⃣ IMPORT/EXPORT
  async testImportExport() {
    console.log('\n📦 Testing Import/Export...');

    if (!this.context.automationId) {
      console.log('⚠️ Skipping import/export tests - no automation created');
      return;
    }

    // Export Automation
    const exportAutomation = await this.makeRequest('GET', `/api/automations/export/${this.context.automationId}?author=tester&tags=test,auto`);
    this.logResult(`/api/automations/export/:id`, 'GET', exportAutomation.status === 200 ? 'OK' : 'FAILED', exportAutomation.status, exportAutomation.time);

    // Export All
    const exportAll = await this.makeRequest('GET', '/api/automations/export/all');
    this.logResult(`/api/automations/export/all`, 'GET', exportAll.status === 200 ? 'OK' : 'FAILED', exportAll.status, exportAll.time);

    // Validate Import
    if (exportAutomation.status === 200 && exportAutomation.data) {
      const validateImport = await this.makeRequest('POST', '/api/automations/import/validate', {
        data: exportAutomation.data,
      });
      this.logResult(`/api/automations/import/validate`, 'POST', validateImport.status === 200 ? 'OK' : 'FAILED', validateImport.status, validateImport.time);

      // Import Automation
      const importAutomation = await this.makeRequest('POST', '/api/automations/import', {
        data: exportAutomation.data,
        options: { overwrite: false, importDependencies: true },
      });
      this.logResult(`/api/automations/import`, 'POST', importAutomation.status === 201 ? 'OK' : 'FAILED', importAutomation.status, importAutomation.time);
    }
  }

  // 9️⃣ DELETE OPERATIONS (Cleanup)
  async testDeletes() {
    console.log('\n🗑️ Testing Delete Operations...');

    if (this.context.conditionToolId) {
      const deleteCondition = await this.makeRequest('DELETE', `/api/tools/condition/${this.context.conditionToolId}`);
      this.logResult(`/api/tools/condition/:id`, 'DELETE', deleteCondition.status === 204 ? 'OK' : 'FAILED', deleteCondition.status, deleteCondition.time);
    }

    if (this.context.systemToolId) {
      const deleteTool = await this.makeRequest('DELETE', `/api/tools/${this.context.systemToolId}`);
      this.logResult(`/api/tools/:id`, 'DELETE', deleteTool.status === 204 ? 'OK' : 'FAILED', deleteTool.status, deleteTool.time);
    }

    if (this.context.automationId) {
      const deleteAutomation = await this.makeRequest('DELETE', `/api/automations/${this.context.automationId}`);
      this.logResult(`/api/automations/:id`, 'DELETE', deleteAutomation.status === 204 ? 'OK' : 'FAILED', deleteAutomation.status, deleteAutomation.time);
    }

    if (this.context.mcpId) {
      const deleteMCP = await this.makeRequest('DELETE', `/api/mcps/${this.context.mcpId}`);
      this.logResult(`/api/mcps/:id`, 'DELETE', deleteMCP.status === 204 ? 'OK' : 'FAILED', deleteMCP.status, deleteMCP.time);
    }

    if (this.context.agentId) {
      const deleteAgent = await this.makeRequest('DELETE', `/api/agents/${this.context.agentId}`);
      this.logResult(`/api/agents/:id`, 'DELETE', deleteAgent.status === 204 ? 'OK' : 'FAILED', deleteAgent.status, deleteAgent.time);
    }
  }

  // Generate Report
  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.length;
    const ok = this.results.filter(r => r.status === 'OK').length;
    const corrected = this.results.filter(r => r.status === 'CORRECTED').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const avgTime = this.results.reduce((acc, r) => acc + r.responseTime, 0) / total;

    const report = {
      summary: {
        totalTests: total,
        passed: ok,
        corrected,
        failed,
        successRate: ((ok + corrected) / total * 100).toFixed(2) + '%',
        averageResponseTime: avgTime.toFixed(2) + 'ms',
        totalDuration: duration + 'ms',
        timestamp: new Date().toISOString(),
      },
      results: this.results,
      context: this.context,
    };

    // Save JSON report
    const jsonPath = path.join(RESULTS_DIR, 'test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save LOG report
    const logLines = [
      '='.repeat(80),
      '🧠 AUTO TEST RUNNER - FINAL REPORT',
      '='.repeat(80),
      '',
      `📊 SUMMARY:`,
      `   Total Tests: ${total}`,
      `   ✅ Passed: ${ok}`,
      `   🔧 Corrected: ${corrected}`,
      `   ❌ Failed: ${failed}`,
      `   📈 Success Rate: ${((ok + corrected) / total * 100).toFixed(2)}%`,
      `   ⏱️ Average Response Time: ${avgTime.toFixed(2)}ms`,
      `   🕐 Total Duration: ${duration}ms`,
      '',
      '📝 DETAILED RESULTS:',
      '',
    ];

    this.results.forEach(r => {
      const emoji = r.status === 'OK' ? '✅' : r.status === 'CORRECTED' ? '🔧' : '❌';
      logLines.push(`${emoji} ${r.method.padEnd(6)} ${r.route.padEnd(50)} ${r.statusCode} (${r.responseTime}ms)`);
      if (r.error) logLines.push(`   Error: ${r.error}`);
      if (r.corrections) logLines.push(`   Corrections: ${r.corrections.join(', ')}`);
    });

    logLines.push('');
    logLines.push('='.repeat(80));

    const logPath = path.join(RESULTS_DIR, 'test-report.log');
    fs.writeFileSync(logPath, logLines.join('\n'));

    console.log('\n' + logLines.join('\n'));
    console.log(`\n📄 Reports saved to:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   LOG: ${logPath}`);

    return report;
  }

  // Main runner
  async run() {
    console.log('🚀 Starting Auto Test Runner...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log('');

    try {
      // Wait for server to be ready
      console.log('⏳ Waiting for server...');
      let retries = 30;
      while (retries > 0) {
        try {
          const health = await this.makeRequest('GET', '/');
          if (health.status === 200) {
            console.log('✅ Server is ready!');
            break;
          }
        } catch (e) {
          // Server not ready yet
        }
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (retries === 0) {
        throw new Error('Server did not start in time');
      }

      // Run all test suites
      await this.testHealthAndConfig();
      await this.testAgents();
      await this.testMCPs();
      await this.testSystemTools();
      await this.testConditionTools();
      await this.testAutomations();
      await this.testExecution();
      await this.testImportExport();
      await this.testDeletes();

      // Generate final report
      this.generateReport();

    } catch (error) {
      console.error('❌ Fatal error during test execution:', error);
      this.generateReport();
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new AutoTestRunner();
  runner.run().catch(console.error);
}

export { AutoTestRunner };
