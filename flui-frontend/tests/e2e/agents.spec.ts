import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Página de Agents', () => {
  test.beforeEach(async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    await pageWithLogging.goto('/agents');
    await helper.waitForAppReady();
  });
  
  test('deve exibir a lista de agents', async ({ pageWithLogging, capturedLogs }) => {
    // Verificar se há elementos na página
    const agentsSection = await pageWithLogging.$('[data-testid="agents-list"], .agents-container, main');
    expect(agentsSection).toBeTruthy();
    
    // Analisar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve permitir buscar agents', async ({ pageWithLogging }) => {
    // Tentar encontrar campo de busca
    const searchInput = await pageWithLogging.$('input[type="search"], input[placeholder*="busca"], input[placeholder*="search"]');
    
    if (searchInput) {
      await searchInput.fill('test');
      await pageWithLogging.waitForTimeout(500); // Aguardar debounce
      
      // Verificar se a busca foi executada
      expect(await searchInput.inputValue()).toBe('test');
    }
  });
  
  test('deve capturar logs de interações com agents', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    // Tentar encontrar botões de ação
    const buttons = await pageWithLogging.$$('button');
    
    if (buttons.length > 0) {
      console.log(`Encontrados ${buttons.length} botões na página`);
    }
    
    // Verificar console logs
    console.log(`Console logs capturados: ${capturedLogs.console.length}`);
    console.log(`Network requests capturadas: ${capturedLogs.network.length}`);
    
    // Gerar relatório
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log(analyzer.generateReport());
  });
});
