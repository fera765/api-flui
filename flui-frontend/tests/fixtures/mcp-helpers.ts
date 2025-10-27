import { Page } from '@playwright/test';
import { CapturedLogs } from './console-capture';

/**
 * Helper para análise de logs capturados
 */
export class MCPLogAnalyzer {
  constructor(private logs: CapturedLogs) {}
  
  /**
   * Verifica se há erros críticos nos logs
   */
  hasCriticalErrors(): boolean {
    return this.logs.errors.length > 0 || 
           this.logs.console.some(log => log.type === 'error');
  }
  
  /**
   * Retorna todos os erros encontrados
   */
  getErrors(): string[] {
    const errors: string[] = [];
    
    // Erros de JavaScript
    this.logs.errors.forEach(error => {
      errors.push(`[JS Error] ${error.message}`);
    });
    
    // Erros do console
    this.logs.console
      .filter(log => log.type === 'error')
      .forEach(log => {
        errors.push(`[Console Error] ${log.text}`);
      });
    
    return errors;
  }
  
  /**
   * Retorna warnings encontrados
   */
  getWarnings(): string[] {
    return this.logs.console
      .filter(log => log.type === 'warning')
      .map(log => log.text);
  }
  
  /**
   * Verifica se há requisições falhadas (4xx, 5xx)
   */
  hasFailedRequests(): boolean {
    return this.logs.network.some(
      req => req.status && req.status >= 400
    );
  }
  
  /**
   * Retorna requisições falhadas
   */
  getFailedRequests(): Array<{ url: string; status?: number; method: string }> {
    return this.logs.network
      .filter(req => req.status && req.status >= 400)
      .map(req => ({
        url: req.url,
        status: req.status,
        method: req.method
      }));
  }
  
  /**
   * Gera relatório completo dos logs
   */
  generateReport(): string {
    const report: string[] = [];
    
    report.push('=== RELATÓRIO DE ANÁLISE MCP ===\n');
    
    // Resumo
    report.push('RESUMO:');
    report.push(`- Total de logs do console: ${this.logs.console.length}`);
    report.push(`- Total de erros: ${this.logs.errors.length}`);
    report.push(`- Total de requisições: ${this.logs.network.length}`);
    report.push(`- Requisições falhadas: ${this.getFailedRequests().length}\n`);
    
    // Erros
    if (this.hasCriticalErrors()) {
      report.push('ERROS ENCONTRADOS:');
      this.getErrors().forEach(error => {
        report.push(`  - ${error}`);
      });
      report.push('');
    }
    
    // Warnings
    const warnings = this.getWarnings();
    if (warnings.length > 0) {
      report.push('WARNINGS ENCONTRADOS:');
      warnings.forEach(warning => {
        report.push(`  - ${warning}`);
      });
      report.push('');
    }
    
    // Requisições falhadas
    if (this.hasFailedRequests()) {
      report.push('REQUISIÇÕES FALHADAS:');
      this.getFailedRequests().forEach(req => {
        report.push(`  - [${req.status}] ${req.method} ${req.url}`);
      });
      report.push('');
    }
    
    return report.join('\n');
  }
  
  /**
   * Exporta logs em formato JSON
   */
  exportJSON(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

/**
 * Helper para interações avançadas com a página
 */
export class MCPPageHelper {
  constructor(private page: Page) {}
  
  /**
   * Aguarda a aplicação estar completamente carregada
   */
  async waitForAppReady(): Promise<void> {
    // Aguarda o React estar montado
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
    
    // Aguarda o root do React estar presente
    await this.page.waitForSelector('#root', { timeout: 10000 });
  }
  
  /**
   * Captura screenshot com timestamp
   */
  async captureScreenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path: filename, fullPage: true });
    return filename;
  }
  
  /**
   * Verifica se há elementos de erro visíveis na página
   */
  async hasVisibleErrors(): Promise<boolean> {
    const errorSelectors = [
      '[role="alert"]',
      '.error',
      '[data-error="true"]',
      '.alert-destructive'
    ];
    
    for (const selector of errorSelectors) {
      const element = await this.page.$(selector);
      if (element && await element.isVisible()) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Obtém informações de performance da página
   */
  async getPerformanceMetrics(): Promise<any> {
    return await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        loadTime: navigation?.loadEventEnd - navigation?.fetchStart,
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
        timestamp: Date.now()
      };
    });
  }
}
