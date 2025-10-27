import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Página de Automations', () => {
  test.beforeEach(async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    await pageWithLogging.goto('/automations');
    await helper.waitForAppReady();
  });
  
  test('deve carregar a página de automations sem erros', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    // Verificar se a página carregou
    await expect(pageWithLogging).toHaveURL(/\/automations/);
    
    // Verificar se não há erros visíveis
    const hasErrors = await helper.hasVisibleErrors();
    expect(hasErrors).toBe(false);
    
    // Analisar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    if (analyzer.hasCriticalErrors()) {
      console.error(analyzer.generateReport());
    }
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve exibir lista de automations', async ({ pageWithLogging }) => {
    // Verificar se há conteúdo principal
    const mainContent = await pageWithLogging.$('main, [role="main"], .automations-container');
    expect(mainContent).toBeTruthy();
  });
  
  test('deve permitir criar nova automation', async ({ pageWithLogging, capturedLogs }) => {
    // Procurar botão de criar/novo
    const createButton = await pageWithLogging.$('button:has-text("Novo"), button:has-text("Nova"), button:has-text("Criar"), button:has-text("Create")');
    
    if (createButton) {
      // Clicar no botão
      await createButton.click();
      
      // Aguardar modal ou navegação
      await pageWithLogging.waitForTimeout(1000);
      
      // Verificar se não há erros
      const analyzer = new MCPLogAnalyzer(capturedLogs);
      expect(analyzer.hasCriticalErrors()).toBe(false);
    } else {
      console.log('⚠️  Botão de criar automation não encontrado');
    }
  });
  
  test('deve capturar requisições à API', async ({ pageWithLogging, capturedLogs }) => {
    // Aguardar requisições
    await pageWithLogging.waitForTimeout(2000);
    
    // Analisar requisições de rede
    const apiRequests = capturedLogs.network.filter(req => 
      req.url.includes('/api/') || req.resourceType === 'fetch' || req.resourceType === 'xhr'
    );
    
    console.log(`🌐 Requisições API capturadas: ${apiRequests.length}`);
    
    if (apiRequests.length > 0) {
      console.log('Detalhes das requisições:');
      apiRequests.forEach(req => {
        console.log(`  - [${req.method}] ${req.url} (${req.status || 'pending'})`);
      });
    }
    
    // Verificar se há requisições falhadas
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    if (analyzer.hasFailedRequests()) {
      console.error('❌ Requisições falhadas:', analyzer.getFailedRequests());
    }
  });
});
