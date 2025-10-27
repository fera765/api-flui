import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Navegação Básica da Aplicação', () => {
  test('deve carregar a página inicial sem erros', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    // Navegar para a página inicial
    await pageWithLogging.goto('/');
    
    // Aguardar aplicação estar pronta
    await helper.waitForAppReady();
    
    // Verificar se a página carregou
    await expect(pageWithLogging).toHaveTitle(/Flui/i);
    
    // Analisar logs capturados
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    
    // Verificar se não há erros críticos
    if (analyzer.hasCriticalErrors()) {
      console.error('Erros encontrados:', analyzer.getErrors());
      console.error(analyzer.generateReport());
    }
    
    expect(analyzer.hasCriticalErrors(), 
      `Erros críticos encontrados:\n${analyzer.getErrors().join('\n')}`
    ).toBe(false);
    
    // Verificar se não há requisições falhadas
    if (analyzer.hasFailedRequests()) {
      console.error('Requisições falhadas:', analyzer.getFailedRequests());
    }
    
    expect(analyzer.hasFailedRequests(),
      `Requisições falhadas encontradas:\n${JSON.stringify(analyzer.getFailedRequests(), null, 2)}`
    ).toBe(false);
  });
  
  test('deve navegar entre páginas principais', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    await pageWithLogging.goto('/');
    await helper.waitForAppReady();
    
    // Páginas para testar (ajustar conforme as rotas da aplicação)
    const routes = [
      { path: '/', name: 'Home' },
      { path: '/agents', name: 'Agents' },
      { path: '/automations', name: 'Automations' },
      { path: '/tools', name: 'Tools' },
      { path: '/mcps', name: 'MCPs' },
      { path: '/settings', name: 'Settings' },
    ];
    
    for (const route of routes) {
      await pageWithLogging.goto(route.path);
      await helper.waitForAppReady();
      
      // Verificar se não há erros visíveis
      const hasErrors = await helper.hasVisibleErrors();
      expect(hasErrors, `Erros visíveis encontrados na página ${route.name}`).toBe(false);
      
      // Capturar screenshot da página
      await helper.captureScreenshot(route.name);
    }
    
    // Relatório final de logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log(analyzer.generateReport());
  });
  
  test('deve capturar métricas de performance', async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    await pageWithLogging.goto('/');
    await helper.waitForAppReady();
    
    // Obter métricas de performance
    const metrics = await helper.getPerformanceMetrics();
    
    console.log('Métricas de Performance:', JSON.stringify(metrics, null, 2));
    
    // Verificar se o tempo de carregamento é razoável (< 5 segundos)
    expect(metrics.loadTime).toBeLessThan(5000);
    
    // Verificar First Contentful Paint (< 2 segundos)
    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    }
  });
});
