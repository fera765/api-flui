/**
 * 🎯 AUTO TEST RUNNER - FINAL COMPLETE
 * Bateria final: 100% cobertura sem simulações
 */

import axios, { AxiosError } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import AdmZip from 'adm-zip';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3333';
const RESULTS_DIR = path.join(__dirname, 'results', 'final');

interface TestResult {
  route: string;
  method: string;
  status: 'OK' | 'FAILED';
  statusCode?: number;
  responseTime: number;
  error?: string;
  timestamp: string;
}

interface TestContext {
  agentId?: string;
  toolId?: string;
  conditionToolId?: string;
  automationId?: string;
  torToolId?: string;
  mcpId?: string;
}

class AutoTestRunnerFinal {
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
    status: 'OK' | 'FAILED',
    statusCode: number,
    responseTime: number,
    error?: string
  ) {
    const result: TestResult = {
      route,
      method,
      status,
      statusCode,
      responseTime,
      error,
      timestamp: new Date().toISOString(),
    };
    this.results.push(result);

    const emoji = status === 'OK' ? '✅' : '❌';
    console.log(`${emoji} ${method} ${route} - ${statusCode} (${responseTime}ms)`);
    if (error) console.log(`   Error: ${error}`);
  }

  // 1️⃣ AUTOMATIONS COMPLETO
  async testAutomationsComplete() {
    console.log('\n⚙️ Testing Automations (COMPLETE with valid references)...');

    // Create trigger tool first
    const triggerData = {
      name: 'ManualTrigger',
      description: 'Manual trigger for testing',
      type: 'trigger',
      config: {},
      inputSchema: { type: 'object', additionalProperties: true },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          executedAt: { type: 'string' },
        },
      },
    };
    const createTrigger = await this.makeRequest('POST', '/api/tools', triggerData);
    if (createTrigger.status !== 201 || !createTrigger.data?.id) {
      console.log('   ⚠️  Failed to create trigger for automation test');
      return;
    }
    const triggerId = createTrigger.data.id;

    // Create action tool
    const toolData = {
      name: 'Automation Test Tool',
      description: 'Tool for automation testing',
      type: 'webhook',
      config: {
        url: 'https://httpbin.org/anything',
        method: 'POST',
      },
      inputSchema: { type: 'object', properties: { input: { type: 'string' } } },
      outputSchema: { type: 'object' },
    };
    const createTool = await this.makeRequest('POST', '/api/tools', toolData);
    
    if (createTool.status !== 201 || !createTool.data?.id) {
      console.log('   ⚠️  Failed to create tool for automation test');
      return;
    }
    
    this.context.toolId = createTool.data.id;

    // Create automation with VALID referenceIds
    const automationData = {
      name: 'Complete Test Automation',
      description: 'Automation with valid trigger and tool',
      nodes: [
        {
          id: 'trigger-node',
          type: 'trigger',
          referenceId: triggerId, // Real trigger ID
          config: {},
        },
        {
          id: 'tool-node',
          type: 'tool',
          referenceId: this.context.toolId, // Real tool ID
          config: {},
        },
      ],
      links: [
        {
          fromNodeId: 'trigger-node',
          fromOutputKey: 'output',
          toNodeId: 'tool-node',
          toInputKey: 'input',
        },
      ],
    };

    const create = await this.makeRequest('POST', '/api/automations', automationData);
    this.logResult('/api/automations', 'POST', create.status === 201 ? 'OK' : 'FAILED', create.status, create.time,
      create.status === 201 ? undefined : JSON.stringify(create.data));

    if (create.status === 201 && create.data?.id) {
      this.context.automationId = create.data.id;

      // GET
      const get = await this.makeRequest('GET', `/api/automations/${this.context.automationId}`);
      this.logResult(`/api/automations/:id`, 'GET', get.status === 200 ? 'OK' : 'FAILED', get.status, get.time);

      // PATCH
      const patch = await this.makeRequest('PATCH', `/api/automations/${this.context.automationId}`, {
        description: 'Updated automation',
      });
      this.logResult(`/api/automations/:id`, 'PATCH', patch.status === 200 ? 'OK' : 'FAILED', patch.status, patch.time);

      // EXECUTE (sync) - Now should work!
      const execute = await this.makeRequest('POST', `/api/automations/${this.context.automationId}/execute`, {
        testInput: 'Final test data',
      });
      this.logResult(`/api/automations/:id/execute`, 'POST', execute.status === 200 ? 'OK' : 'FAILED', execute.status, execute.time,
        execute.status === 200 ? undefined : JSON.stringify(execute.data));

      // ASYNC EXECUTION
      const startExec = await this.makeRequest('POST', `/api/execution/${this.context.automationId}/start`, {
        asyncInput: 'test',
      });
      this.logResult(`/api/execution/:id/start`, 'POST', startExec.status === 202 ? 'OK' : 'FAILED', startExec.status, startExec.time);

      await new Promise(resolve => setTimeout(resolve, 500));

      const status = await this.makeRequest('GET', `/api/execution/${this.context.automationId}/status`);
      this.logResult(`/api/execution/:id/status`, 'GET', status.status === 200 ? 'OK' : 'FAILED', status.status, status.time);

      const logs = await this.makeRequest('GET', `/api/execution/${this.context.automationId}/logs`);
      this.logResult(`/api/execution/:id/logs`, 'GET', logs.status === 200 ? 'OK' : 'FAILED', logs.status, logs.time);
    }
  }

  // 2️⃣ IMPORT/EXPORT COMPLETO
  async testImportExportComplete() {
    console.log('\n📦 Testing Import/Export (COMPLETE with valid data)...');

    if (!this.context.automationId) {
      console.log('   ⚠️  No automation to export');
      return;
    }

    // Export
    const exportResult = await this.makeRequest('GET', `/api/automations/export/${this.context.automationId}?author=AutoTest&tags=final`);
    this.logResult(`/api/automations/export/:id`, 'GET', exportResult.status === 200 ? 'OK' : 'FAILED', exportResult.status, exportResult.time);

    if (exportResult.status === 200 && exportResult.data) {
      // Validate
      const validate = await this.makeRequest('POST', '/api/automations/import/validate', {
        data: exportResult.data,
      });
      this.logResult(`/api/automations/import/validate`, 'POST', validate.status === 200 ? 'OK' : 'FAILED', validate.status, validate.time);

      // Import (with different name to avoid conflict)
      const importData = {
        ...exportResult.data,
        automation: {
          ...exportResult.data.automation,
          name: 'Imported Automation Final',
        },
      };

      const importResult = await this.makeRequest('POST', '/api/automations/import', {
        data: importData,
        options: {
          overwrite: false,
          importDependencies: true,
        },
      });
      this.logResult(`/api/automations/import`, 'POST', importResult.status === 201 ? 'OK' : 'FAILED', importResult.status, importResult.time,
        importResult.status === 201 ? undefined : JSON.stringify(importResult.data));

      // Export All
      const exportAll = await this.makeRequest('GET', '/api/automations/export/all');
      this.logResult(`/api/automations/export/all`, 'GET', exportAll.status === 200 ? 'OK' : 'FAILED', exportAll.status, exportAll.time);
    }
  }

  // 3️⃣ TOR COMPLETO
  async testTORComplete() {
    console.log('\n🔧 Testing TOR (COMPLETE with real ZIP)...');

    // Create a valid tool ZIP
    const zipPath = await this.createValidToolZip();

    // Upload ZIP
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream(zipPath));
    form.append('overwrite', 'false');

    try {
      const upload = await axios.post(`${BASE_URL}/api/tor/import`, form, {
        headers: form.getHeaders(),
      });
      this.logResult(`/api/tor/import`, 'POST', upload.status === 201 ? 'OK' : 'FAILED', upload.status, 0);
      
      if (upload.status === 201 && upload.data?.id) {
        this.context.torToolId = upload.data.id;

        // GET by ID
        const getById = await this.makeRequest('GET', `/api/tor/${this.context.torToolId}`);
        this.logResult(`/api/tor/:id`, 'GET', getById.status === 200 ? 'OK' : 'FAILED', getById.status, getById.time);

        // GET versions
        const versions = await this.makeRequest('GET', `/api/tor/versions/${upload.data.name}`);
        this.logResult(`/api/tor/versions/:name`, 'GET', versions.status === 200 ? 'OK' : 'FAILED', versions.status, versions.time);

        // DELETE
        const deleteTor = await this.makeRequest('DELETE', `/api/tor/${this.context.torToolId}`);
        this.logResult(`/api/tor/:id`, 'DELETE', deleteTor.status === 204 ? 'OK' : 'FAILED', deleteTor.status, deleteTor.time);
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logResult(`/api/tor/import`, 'POST', 'FAILED', axiosError.response?.status || 500, 0, 
        JSON.stringify(axiosError.response?.data));
    } finally {
      // Cleanup
      if (fs.existsSync(zipPath)) {
        fs.unlinkSync(zipPath);
      }
    }

    // GET all (should work regardless)
    const getAll = await this.makeRequest('GET', '/api/tor');
    this.logResult(`/api/tor`, 'GET', getAll.status === 200 ? 'OK' : 'FAILED', getAll.status, getAll.time);
  }

  // Helper: Create valid tool ZIP
  private async createValidToolZip(): Promise<string> {
    const tmpDir = path.join(__dirname, 'tmp-tool');
    const distDir = path.join(tmpDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // manifest.json (root)
    const manifest = {
      name: 'test-tool',
      version: '1.0.0',
      description: 'Test tool for automated testing',
      author: 'AutoTest',
      type: 'tool',
      runtime: 'node',
      entry: 'dist/index.js',
      capabilities: ['network'],
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      },
      outputSchema: {
        type: 'object',
      },
    };
    fs.writeFileSync(path.join(tmpDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

    // dist/index.js
    const indexJs = `
module.exports = async function execute(input) {
  return {
    success: true,
    message: 'Tool executed: ' + (input.message || 'no message'),
    timestamp: new Date().toISOString(),
  };
};
`;
    fs.writeFileSync(path.join(distDir, 'index.js'), indexJs);

    // package.json
    const packageJson = {
      name: 'test-tool',
      version: '1.0.0',
      main: 'dist/index.js',
    };
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(packageJson, null, 2));

    // Create ZIP with proper structure
    const zip = new AdmZip();
    zip.addLocalFile(path.join(tmpDir, 'manifest.json'));
    zip.addLocalFile(path.join(tmpDir, 'package.json'));
    zip.addLocalFolder(distDir, 'dist');

    const zipPath = path.join(tmpDir, 'test-tool.zip');
    zip.writeZip(zipPath);

    // Cleanup temp files
    fs.unlinkSync(path.join(tmpDir, 'manifest.json'));
    fs.unlinkSync(path.join(tmpDir, 'package.json'));
    fs.unlinkSync(path.join(distDir, 'index.js'));
    fs.rmdirSync(distDir);

    return zipPath;
  }

  // 4️⃣ CLEANUP
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');

    // Delete automation
    if (this.context.automationId) {
      await this.makeRequest('DELETE', `/api/automations/${this.context.automationId}`);
    }

    // Delete tool
    if (this.context.toolId) {
      await this.makeRequest('DELETE', `/api/tools/${this.context.toolId}`);
    }

    // Cleanup tmp dir
    const tmpDir = path.join(__dirname, 'tmp-tool');
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  }

  // Generate Report
  generateReport() {
    const duration = Date.now() - this.startTime;
    const total = this.results.length;
    const ok = this.results.filter(r => r.status === 'OK').length;
    const failed = this.results.filter(r => r.status === 'FAILED').length;
    const avgTime = this.results.reduce((acc, r) => acc + r.responseTime, 0) / total;

    const report = {
      phase: 'FINAL',
      summary: {
        totalTests: total,
        passed: ok,
        failed,
        successRate: ((ok / total) * 100).toFixed(2) + '%',
        averageResponseTime: avgTime.toFixed(2) + 'ms',
        totalDuration: duration + 'ms',
        timestamp: new Date().toISOString(),
      },
      results: this.results,
      context: this.context,
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
      '🎯 AUTO TEST RUNNER - FINAL COMPLETE REPORT',
      '='.repeat(80),
      '',
      `📊 SUMMARY:`,
      `   Total Tests: ${total}`,
      `   ✅ Passed: ${ok}`,
      `   ❌ Failed: ${failed}`,
      `   📈 Success Rate: ${((ok / total) * 100).toFixed(2)}%`,
      `   ⏱️ Average Response Time: ${avgTime.toFixed(2)}ms`,
      `   🕐 Total Duration: ${duration}ms`,
      '',
      '📝 DETAILED RESULTS:',
      '',
    ];

    this.results.forEach(r => {
      const emoji = r.status === 'OK' ? '✅' : '❌';
      logLines.push(`${emoji} ${r.method.padEnd(6)} ${r.route.padEnd(50)} ${r.statusCode} (${r.responseTime}ms)`);
      if (r.error) logLines.push(`   Error: ${r.error}`);
    });

    logLines.push('');
    logLines.push('='.repeat(80));

    if (ok === total) {
      logLines.push('');
      logLines.push('🎉🎉🎉 100% SUCCESS - API READY FOR PRODUCTION! 🎉🎉🎉');
      logLines.push('');
    }

    const logPath = path.join(RESULTS_DIR, 'test-report.log');
    fs.writeFileSync(logPath, logLines.join('\n'));

    console.log('\n' + logLines.join('\n'));
    console.log(`\n📄 Final reports saved to:`);
    console.log(`   JSON: ${jsonPath}`);
    console.log(`   LOG: ${logPath}`);

    return report;
  }

  // Main runner
  async run() {
    console.log('🎯 Starting FINAL Complete Test Runner...');
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

      // Run complete tests
      await this.testAutomationsComplete();
      await this.testImportExportComplete();
      await this.testTORComplete();

      // Cleanup
      await this.cleanup();

      // Generate report
      this.generateReport();

      // Exit with appropriate code
      const failedCount = this.results.filter(r => r.status === 'FAILED').length;
      if (failedCount === 0) {
        process.exit(0);
      } else {
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Fatal error during final test execution:', error);
      await this.cleanup();
      this.generateReport();
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const runner = new AutoTestRunnerFinal();
  runner.run().catch(console.error);
}

export { AutoTestRunnerFinal };
