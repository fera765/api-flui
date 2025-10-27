import { defineConfig, devices } from '@playwright/test';

/**
 * Configuração do Playwright para testes frontend
 * Integrado com Playwright MCP para captura avançada de logs e eventos
 */
export default defineConfig({
  // Diretório onde estão os testes
  testDir: './tests/e2e',
  
  // Timeout padrão para cada teste
  timeout: 30 * 1000,
  
  // Timeout para cada expect()
  expect: {
    timeout: 5000
  },
  
  // Executar testes em paralelo
  fullyParallel: true,
  
  // Falhar se houver testes marcados como .only
  forbidOnly: !!process.env.CI,
  
  // Retry em caso de falha (útil em CI)
  retries: process.env.CI ? 2 : 0,
  
  // Número de workers
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter para visualizar resultados
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Configuração compartilhada para todos os projetos
  use: {
    // URL base da aplicação
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    
    // Capturar screenshot apenas em falhas
    screenshot: 'only-on-failure',
    
    // Capturar vídeo apenas em falhas
    video: 'retain-on-failure',
    
    // Capturar trace para debugging
    trace: 'on-first-retry',
    
    // Timeout para ações
    actionTimeout: 10 * 1000,
    
    // Timeout para navegação
    navigationTimeout: 30 * 1000,
  },
  
  // Configuração de projetos (navegadores)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Configurações específicas do Chromium
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
    },
    
    {
      name: 'chromium-headless',
      use: { 
        ...devices['Desktop Chrome'],
        headless: true,
        launchOptions: {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        },
      },
    },
    
    // Descomentar para habilitar outros navegadores
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    
    // Testes mobile
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],
  
  // Servidor de desenvolvimento
  // Descomente para iniciar automaticamente o servidor ao rodar testes
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5173',
  //   reuseExistingServer: !process.env.CI,
  //   stdout: 'ignore',
  //   stderr: 'pipe',
  //   timeout: 120 * 1000,
  // },
});
