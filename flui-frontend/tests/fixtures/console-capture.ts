import { test as base, Page } from '@playwright/test';

/**
 * Estrutura para armazenar logs capturados
 */
export interface CapturedLogs {
  console: Array<{ type: string; text: string; timestamp: number }>;
  errors: Array<{ message: string; stack?: string; timestamp: number }>;
  network: Array<{
    url: string;
    method: string;
    status?: number;
    resourceType: string;
    timestamp: number;
  }>;
  coverage: {
    js?: any[];
    css?: any[];
  };
}

/**
 * Fixture estendida com captura de logs, console e network
 */
export const test = base.extend<{ 
  pageWithLogging: Page;
  capturedLogs: CapturedLogs;
}>({
  capturedLogs: async ({}, use) => {
    const logs: CapturedLogs = {
      console: [],
      errors: [],
      network: [],
      coverage: {}
    };
    await use(logs);
  },
  
  pageWithLogging: async ({ page, capturedLogs }, use) => {
    // Capturar mensagens do console
    page.on('console', (msg) => {
      capturedLogs.console.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now()
      });
    });
    
    // Capturar erros da página
    page.on('pageerror', (error) => {
      capturedLogs.errors.push({
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      });
    });
    
    // Capturar requisições de rede
    page.on('request', (request) => {
      capturedLogs.network.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: Date.now()
      });
    });
    
    // Capturar respostas de rede com status
    page.on('response', (response) => {
      const networkEntry = capturedLogs.network.find(
        entry => entry.url === response.url() && !entry.status
      );
      if (networkEntry) {
        networkEntry.status = response.status();
      }
    });
    
    // Habilitar coverage de código
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();
    
    await use(page);
    
    // Coletar coverage ao final
    capturedLogs.coverage.js = await page.coverage.stopJSCoverage();
    capturedLogs.coverage.css = await page.coverage.stopCSSCoverage();
  },
});

export { expect } from '@playwright/test';
