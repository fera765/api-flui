/**
 * 🧠 AUTO TEST RUNNER - PHASE 2
 * Segunda bateria de testes: rotas faltantes + correções
 */

import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
const RESULTS_DIR = path.join(__dirname, 'results', 'phase2');

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
  systemToolId?: string;
  conditionToolId?: string;
  automationId?: string;
  torToolId?: string;
  webhookToolId?: string;
}

class AutoTestRunnerPhase2 {
  private results: TestResult[] = [];
  private context: TestContext = {};
  private startTime = Date.now();

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

  // ====== RETESTS com Correções ======

  async retestSystemTools() {
    console.log('\n🔧 Retesting System Tools (após correção de rotas)...');

    // Create tool
    const toolData = {
      name: 'System Tool Phase 2',
      description: 'Tool for retesting',
      type: 'webhook',
      config: {
        url: 'https://httpbin.org/post',
        method: 'POST',
      },
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
    };
    const createTool = await this.makeRequest('POST', '/api/tools', toolData);
    this.logResult('/api/tools', 'POST', createTool.status === 201 ? 'OK' : 'FAILED', createTool.status, createTool.time);
    
    if (createTool.status === 201 && createTool.data?.id) {
      this.context.systemToolId = createTool.data.id;

      // GET by ID (anteriormente 404)
      const getTool = await this.makeRequest('GET', `/api/tools/${this.context.systemToolId}`);
      this.logResult(`/api/tools/:id`, 'GET', getTool.status === 200 ? 'CORRECTED' : 'FAILED', getTool.status, getTool.time,
        getTool.status === 200 ? undefined : 'Still failing after route fix', getTool.status === 200 ? ['Separated TOR to /api/tor'] : undefined);

      // Execute
      const execute = await this.makeRequest('POST', `/api/tools/${this.context.systemToolId}/execute`, { test: 'data' });
      this.logResult(`/api/tools/:id/execute`, 'POST', execute.status === 200 ? 'OK' : 'FAILED', execute.status, execute.time);

      // DELETE by ID (anteriormente 404)
      const deleteTool = await this.makeRequest('DELETE', `/api/tools/${this.context.systemToolId}`);
      this.logResult(`/api/tools/:id`, 'DELETE', deleteTool.status === 204 ? 'CORRECTED' : 'FAILED', deleteTool.status, deleteTool.time,
        deleteTool.status === 204 ? undefined : 'Still failing after route fix', deleteTool.status === 204 ? ['Separated TOR to /api/tor'] : undefined);
    }
  }

  async retestConditionTools() {
    console.log('\n⚖️ Retesting Condition Tools (com payload corrigido)...');

    // Payload correto (não field/operator/value, mas name/predicate/linkedNodes)
    const conditionData = {
      name: 'Test Condition Phase 2',
      description: 'Condition with correct format',
      conditions: [
        {
          name: 'Status is active',
          predicate: "input.status === 'active'",
          linkedNodes: [],
        },
        {
          name: 'Count greater than 10',
          predicate: 'input.count > 10',
          linkedNodes: [],
        },
      ],
    };
    const createCondition = await this.makeRequest('POST', '/api/tools/condition', conditionData);
    this.logResult('/api/tools/condition', 'POST', createCondition.status === 201 ? 'CORRECTED' : 'FAILED', createCondition.status, createCondition.time,
      createCondition.status === 201 ? undefined : JSON.stringify(createCondition.data), createCondition.status === 201 ? ['Fixed payload format'] : undefined);

    if (createCondition.status === 201 && createCondition.data?.id) {
      this.context.conditionToolId = createCondition.data.id;

      // GET by ID
      const getCondition = await this.makeRequest('GET', `/api/tools/condition/${this.context.conditionToolId}`);
      this.logResult(`/api/tools/condition/:id`, 'GET', getCondition.status === 200 ? 'OK' : 'FAILED', getCondition.status, getCondition.time);

      // Evaluate
      const evaluate = await this.makeRequest('POST', `/api/tools/condition/${this.context.conditionToolId}/evaluate`, {
        input: { status: 'active', count: 15 },
        evaluateAll: false,
      });
      this.logResult(`/api/tools/condition/:id/evaluate`, 'POST', evaluate.status === 200 ? 'OK' : 'FAILED', evaluate.status, evaluate.time);

      // Update
      const update = await this.makeRequest('PATCH', `/api/tools/condition/${this.context.conditionToolId}`, {
        description: 'Updated via Phase 2',
      });
      this.logResult(`/api/tools/condition/:id`, 'PATCH', update.status === 200 ? 'OK' : 'FAILED', update.status, update.time);

      // DELETE
      const deleteCondition = await this.makeRequest('DELETE', `/api/tools/condition/${this.context.conditionToolId}`);
      this.logResult(`/api/tools/condition/:id`, 'DELETE', deleteCondition.status === 204 ? 'OK' : 'FAILED', deleteCondition.status, deleteCondition.time);
    }
  }

  async retestAutomations() {
    console.log('\n⚙️ Retesting Automations (incluindo execute)...');

    // Create automation
    const automationData = {
      name: 'Automation Phase 2',
      description: 'Testing execute endpoint',
      nodes: [
        { id: 'node1', type: 'trigger', config: {} },
        { id: 'node2', type: 'action', config: {} },
      ],
      links: [{ from: 'node1', to: 'node2' }],
    };
    const create = await this.makeRequest('POST', '/api/automations', automationData);
    this.logResult('/api/automations', 'POST', create.status === 201 ? 'OK' : 'FAILED', create.status, create.time);

    if (create.status === 201 && create.data?.id) {
      this.context.automationId = create.data.id;

      // Execute (anteriormente 404)
      const execute = await this.makeRequest('POST', `/api/automations/${this.context.automationId}/execute`, { test: 'input' });
      this.logResult(`/api/automations/:id/execute`, 'POST', execute.status === 200 ? 'CORRECTED' : 'FAILED', execute.status, execute.time,
        execute.status === 200 ? undefined : JSON.stringify(execute.data), execute.status === 200 ? ['Route working now'] : undefined);

      // DELETE
      const deleteAuto = await this.makeRequest('DELETE', `/api/automations/${this.context.automationId}`);
      this.logResult(`/api/automations/:id`, 'DELETE', deleteAuto.status === 204 ? 'OK' : 'FAILED', deleteAuto.status, deleteAuto.time);
    }
  }

  async retestImportExport() {
    console.log('\n📦 Retesting Import/Export (validação completa)...');

    // Create simple automation for export
    const auto = await this.makeRequest('POST', '/api/automations', {
      name: 'Export Test Auto',
      description: 'For testing export/import',
      nodes: [{ id: 'n1', type: 'trigger', config: {} }],
      links: [],
    });

    if (auto.status === 201 && auto.data?.id) {
      const autoId = auto.data.id;

      // Export
      const exportData = await this.makeRequest('GET', `/api/automations/export/${autoId}`);
      this.logResult(`/api/automations/export/:id`, 'GET', exportData.status === 200 ? 'OK' : 'FAILED', exportData.status, exportData.time);

      if (exportData.status === 200) {
        // Validate
        const validate = await this.makeRequest('POST', '/api/automations/import/validate', { data: exportData.data });
        this.logResult(`/api/automations/import/validate`, 'POST', validate.status === 200 ? 'OK' : 'FAILED', validate.status, validate.time);

        // Import with overwrite
        const importResult = await this.makeRequest('POST', '/api/automations/import', {
          data: exportData.data,
          options: { overwrite: false, importDependencies: true },
        });
        this.logResult(`/api/automations/import`, 'POST', importResult.status === 201 ? 'CORRECTED' : 'FAILED', importResult.status, importResult.time,
          importResult.status === 201 ? undefined : JSON.stringify(importResult.data), importResult.status === 201 ? ['Import now working'] : undefined);
      }

      // Cleanup
      await this.makeRequest('DELETE', `/api/automations/${autoId}`);
    }
  }

  // ====== NOVOS TESTES: Rotas Faltantes ======

  async testWebhooks() {
    console.log('\n🔗 Testing Webhooks...');

    // First create a webhook tool
    const webhookTool = {
      name: 'Webhook Test Tool',
      description: 'Tool for webhook testing',
      type: 'webhook',
      config: {
        url: 'https://httpbin.org/anything',
        method: 'POST',
        requireAuth: true,
        token: 'test-token-123',
      },
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
    };
    const create = await this.makeRequest('POST', '/api/tools', webhookTool);
    
    if (create.status === 201 && create.data?.id) {
      this.context.webhookToolId = create.data.id;

      // Test GET webhook
      const getWebhook = await this.makeRequest('GET', `/api/webhooks/${this.context.webhookToolId}?test=param`, null, {
        headers: { Authorization: 'Bearer test-token-123' },
      });
      this.logResult(`/api/webhooks/:toolId`, 'GET', getWebhook.status === 200 ? 'OK' : 'FAILED', getWebhook.status, getWebhook.time,
        getWebhook.status === 200 ? undefined : JSON.stringify(getWebhook.data));

      // Test POST webhook
      const postWebhook = await this.makeRequest('POST', `/api/webhooks/${this.context.webhookToolId}`, { data: 'test' }, {
        headers: { Authorization: 'Bearer test-token-123' },
      });
      this.logResult(`/api/webhooks/:toolId`, 'POST', postWebhook.status === 200 ? 'OK' : 'FAILED', postWebhook.status, postWebhook.time,
        postWebhook.status === 200 ? undefined : JSON.stringify(postWebhook.data));

      // Cleanup
      await this.makeRequest('DELETE', `/api/tools/${this.context.webhookToolId}`);
    }
  }

  async testTORRoutes() {
    console.log('\n🔧 Testing TOR Routes (em /api/tor)...');

    // List all TOR tools
    const listAll = await this.makeRequest('GET', '/api/tor');
    this.logResult('/api/tor', 'GET', listAll.status === 200 ? 'OK' : 'FAILED', listAll.status, listAll.time);

    // Note: ZIP upload test requires actual file, skipping for automated test
    console.log('   ⚠️  TOR ZIP upload requires file - skipping in automated test');
    console.log('   ℹ️  To test manually: POST /api/tor/import with multipart/form-data');

    // Test GET by ID (if we had a tool)
    // Test GET versions/:name (if we had a tool)
    // Test DELETE (if we had a tool)
  }

  async testMCPsAdvanced() {
    console.log('\n🔌 Testing MCPs Advanced...');

    // Create MCP
    const mcpData = {
      name: 'Advanced MCP Test',
      source: 'npx test-mcp',
      description: 'For advanced testing',
      env: { KEY: 'value' },
    };
    const create = await this.makeRequest('POST', '/api/mcps/import', mcpData);
    this.logResult('/api/mcps/import', 'POST', create.status === 201 ? 'OK' : 'FAILED', create.status, create.time);

    if (create.status === 201 && create.data?.id) {
      this.context.mcpId = create.data.id;

      // GET tools (requires real MCP server)
      const getTools = await this.makeRequest('GET', `/api/mcps/${this.context.mcpId}/tools`);
      this.logResult(`/api/mcps/:id/tools`, 'GET', getTools.status === 200 ? 'OK' : 'FAILED', getTools.status, getTools.time,
        getTools.status === 200 ? undefined : JSON.stringify(getTools.data));

      // DELETE
      const deleteMCP = await this.makeRequest('DELETE', `/api/mcps/${this.context.mcpId}`);
      this.logResult(`/api/mcps/:id`, 'DELETE', deleteMCP.status === 204 ? 'OK' : 'FAILED', deleteMCP.status, deleteMCP.time);
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
      phase: 2,
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
      improvements: this.results.filter(r => r.corrections).map(r => ({
        route: `${r.method} ${r.route}`,
        corrections: r.corrections,
      })),
    };

    // Save JSON
    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
    }
    const jsonPath = path.join(RESULTS_DIR, 'test-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

    // Save LOG
    const logLines = [
      '='.repeat(80),
      '🧠 AUTO TEST RUNNER - PHASE 2 REPORT',
      '='.repeat(80),
      '',
      `📊 SUMMARY:`,
      `   Total Tests: ${total}`,
      `   ✅ Passed: ${ok}`,
      `   🔧 Corrected: ${corrected}`,
      `   ❌ Failed: ${failed}`,
      `   📈 Success Rate: ${((ok + corrected) / total * 100).toFixed(2)}%`,
      `   ⏱️ Average Response Time: ${avgTime.toFixed(2)}ms`,
      '',
      '🔧 CORRECTIONS APPLIED:',
      '',
    ];

    report.improvements.forEach(imp => {
      logLines.push(`   ${imp.route}:`);
      imp.corrections?.forEach(c => logLines.push(`      - ${c}`));
    });

    logLines.push('');
    logLines.push('📝 DETAILED RESULTS:');
    logLines.push('');

    this.results.forEach(r => {
      const emoji = r.status === 'OK' ? '✅' : r.status === 'CORRECTED' ? '🔧' : '❌';
      logLines.push(`${emoji} ${r.method.padEnd(6)} ${r.route.padEnd(50)} ${r.statusCode} (${r.responseTime}ms)`);
      if (r.error) logLines.push(`   Error: ${r.error}`);
    });

    const logPath = path.join(RESULTS_DIR, 'test-report.log');
    fs.writeFileSync(logPath, logLines.join('\n'));

    console.log('\n' + logLines.join('\n'));
    console.log(`\n📄 Phase 2 reports saved to:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   LOG: ${logPath}`);

    return report;
  }

  // Main runner
  async run() {
    console.log('🚀 Starting Auto Test Runner - PHASE 2...');
    console.log(`📍 Base URL: ${BASE_URL}`);
    console.log('');

    try {
      // Wait for server
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
          // not ready
        }
        retries--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (retries === 0) {
        throw new Error('Server did not start in time');
      }

      // RETESTS com correções
      await this.retestSystemTools();
      await this.retestConditionTools();
      await this.retestAutomations();
      await this.retestImportExport();

      // NOVOS TESTES
      await this.testWebhooks();
      await this.testTORRoutes();
      await this.testMCPsAdvanced();

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Fatal error during Phase 2 execution:', error);
      this.generateReport();
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new AutoTestRunnerPhase2();
  runner.run().catch(console.error);
}

export { AutoTestRunnerPhase2 };
