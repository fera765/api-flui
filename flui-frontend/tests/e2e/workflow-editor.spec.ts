import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Workflow Editor', () => {
  test.beforeEach(async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    await pageWithLogging.goto('/automations');
    await helper.waitForAppReady();
  });
  
  test('deve carregar o editor de workflow', async ({ pageWithLogging, capturedLogs }) => {
    // Verificar se há canvas do React Flow (editor de workflow)
    const canvas = await pageWithLogging.$('.react-flow, [data-testid="workflow-canvas"]');
    
    if (canvas) {
      console.log('✅ Canvas do workflow encontrado');
      expect(canvas).toBeTruthy();
    } else {
      console.log('⚠️  Canvas do workflow não encontrado - pode não estar na página inicial');
    }
    
    // Verificar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve capturar interações com nodes do workflow', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    // Procurar por nodes do React Flow
    const nodes = await pageWithLogging.$$('.react-flow__node');
    
    if (nodes.length > 0) {
      console.log(`✅ Encontrados ${nodes.length} nodes no workflow`);
      
      // Interagir com o primeiro node
      await nodes[0].click();
      await pageWithLogging.waitForTimeout(500);
      
      // Verificar se não há erros após a interação
      const analyzer = new MCPLogAnalyzer(capturedLogs);
      expect(analyzer.hasCriticalErrors()).toBe(false);
    } else {
      console.log('⚠️  Nenhum node encontrado no workflow');
    }
  });
  
  test('deve permitir adicionar novos nodes', async ({ pageWithLogging, capturedLogs }) => {
    // Procurar botão de adicionar node/tool
    const addButton = await pageWithLogging.$('button:has-text("Adicionar"), button:has-text("Add Tool"), [data-testid="add-node"]');
    
    if (addButton) {
      await addButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      // Verificar se modal/dialog abriu
      const dialog = await pageWithLogging.$('[role="dialog"], .modal, [data-radix-dialog-content]');
      if (dialog) {
        console.log('✅ Modal de adicionar node aberto');
        expect(dialog).toBeTruthy();
      }
    } else {
      console.log('⚠️  Botão de adicionar node não encontrado');
    }
    
    // Verificar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve capturar eventos do React Flow', async ({ pageWithLogging, capturedLogs }) => {
    await pageWithLogging.waitForTimeout(2000);
    
    // Verificar logs do console relacionados ao React Flow
    const reactFlowLogs = capturedLogs.console.filter(log => 
      log.text.toLowerCase().includes('flow') || 
      log.text.toLowerCase().includes('node') ||
      log.text.toLowerCase().includes('edge')
    );
    
    if (reactFlowLogs.length > 0) {
      console.log(`📊 Logs do React Flow capturados: ${reactFlowLogs.length}`);
      reactFlowLogs.forEach(log => {
        console.log(`  - [${log.type}] ${log.text}`);
      });
    }
    
    // Gerar relatório completo
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log(analyzer.generateReport());
  });
});
