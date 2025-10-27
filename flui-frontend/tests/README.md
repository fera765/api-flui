# 🧪 Testes E2E com Playwright MCP

Este diretório contém todos os testes end-to-end da aplicação Flui Frontend, utilizando Playwright com captura avançada de logs via MCP.

## 📁 Estrutura

```
tests/
├── e2e/                           # Testes end-to-end
│   ├── basic-navigation.spec.ts  # Navegação e performance
│   ├── agents.spec.ts            # Testes da página de Agents
│   ├── automations.spec.ts       # Testes da página de Automations
│   └── workflow-editor.spec.ts   # Testes do editor de workflow
│
└── fixtures/                      # Fixtures reutilizáveis
    ├── console-capture.ts        # Captura de logs, console e network
    └── mcp-helpers.ts            # Helpers para análise e interação
```

## 🚀 Executando Testes

### Pré-requisito
```bash
# O servidor dev deve estar rodando
npm run dev
```

### Comandos Principais

```bash
# Interface UI (recomendado)
npm run test:ui

# Ver navegador
npm run test:headed

# Modo debug
npm run test:debug

# Todos os testes
npm test

# Teste específico
npx playwright test basic-navigation.spec.ts

# Ver relatório
npm run test:report
```

## 📝 Criando Novos Testes

### Template Básico

```typescript
import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Minha Feature', () => {
  test.beforeEach(async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    await pageWithLogging.goto('/minha-rota');
    await helper.waitForAppReady();
  });
  
  test('deve fazer algo', async ({ pageWithLogging, capturedLogs }) => {
    // Seu teste aqui
    await pageWithLogging.click('button');
    
    // Verificar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
});
```

### Fixtures Disponíveis

#### 1. pageWithLogging
Página do Playwright com captura automática de:
- Console logs
- Erros JavaScript
- Requisições de rede
- Coverage de código

```typescript
test('exemplo', async ({ pageWithLogging }) => {
  await pageWithLogging.goto('/');
  await pageWithLogging.click('button');
  await pageWithLogging.fill('input', 'texto');
});
```

#### 2. capturedLogs
Objeto com todos os logs capturados:

```typescript
test('exemplo', async ({ capturedLogs }) => {
  console.log(capturedLogs.console);  // Logs do console
  console.log(capturedLogs.errors);   // Erros JS
  console.log(capturedLogs.network);  // Requisições
  console.log(capturedLogs.coverage); // Coverage
});
```

### Helpers Disponíveis

#### MCPLogAnalyzer
Análise automática de logs:

```typescript
const analyzer = new MCPLogAnalyzer(capturedLogs);

// Verificações
analyzer.hasCriticalErrors()      // boolean
analyzer.hasFailedRequests()      // boolean

// Obter dados
analyzer.getErrors()              // string[]
analyzer.getWarnings()            // string[]
analyzer.getFailedRequests()      // Array<{url, status, method}>

// Relatórios
analyzer.generateReport()         // string
analyzer.exportJSON()             // string (JSON)
```

#### MCPPageHelper
Helpers para interação com a página:

```typescript
const helper = new MCPPageHelper(pageWithLogging);

// Aguardar carregamento
await helper.waitForAppReady()

// Screenshots
await helper.captureScreenshot('nome')

// Verificações
await helper.hasVisibleErrors()   // boolean

// Performance
await helper.getPerformanceMetrics()
```

## 🎯 Boas Práticas

### 1. Use beforeEach para setup comum

```typescript
test.beforeEach(async ({ pageWithLogging }) => {
  const helper = new MCPPageHelper(pageWithLogging);
  await pageWithLogging.goto('/rota');
  await helper.waitForAppReady();
});
```

### 2. Sempre verifique erros

```typescript
test('meu teste', async ({ capturedLogs }) => {
  // ... seu teste
  
  const analyzer = new MCPLogAnalyzer(capturedLogs);
  expect(analyzer.hasCriticalErrors()).toBe(false);
});
```

### 3. Use seletores específicos

```typescript
// ❌ Ruim - frágil
await page.click('button');

// ✅ Bom - específico
await page.click('[data-testid="submit-button"]');

// ✅ Bom - por texto
await page.click('button:has-text("Enviar")');

// ✅ Bom - por role
await page.click('button[role="submit"]');
```

### 4. Aguarde elementos estarem prontos

```typescript
// Aguardar elemento estar visível
await page.waitForSelector('button', { state: 'visible' });

// Aguardar navegação
await page.waitForLoadState('networkidle');

// Aguardar app estar pronto
await helper.waitForAppReady();
```

### 5. Capture screenshots em falhas

```typescript
test('meu teste', async ({ pageWithLogging }, testInfo) => {
  try {
    // seu teste
  } catch (error) {
    await pageWithLogging.screenshot({ 
      path: `screenshots/${testInfo.title}-failure.png` 
    });
    throw error;
  }
});
```

## 📊 Estrutura de um Teste Completo

```typescript
import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Nome da Feature', () => {
  // Setup antes de cada teste
  test.beforeEach(async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    await pageWithLogging.goto('/rota');
    await helper.waitForAppReady();
  });
  
  test('deve realizar ação X', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    // 1. Ação
    await pageWithLogging.click('[data-testid="botao"]');
    
    // 2. Aguardar resultado
    await pageWithLogging.waitForSelector('[data-testid="resultado"]');
    
    // 3. Verificação visual
    const resultado = await pageWithLogging.textContent('[data-testid="resultado"]');
    expect(resultado).toBe('Sucesso');
    
    // 4. Verificar logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
    
    // 5. Verificar requisições
    expect(analyzer.hasFailedRequests()).toBe(false);
    
    // 6. (Opcional) Screenshot
    await helper.captureScreenshot('acao-x-sucesso');
  });
  
  test('deve capturar métricas de performance', async ({ pageWithLogging }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    const metrics = await helper.getPerformanceMetrics();
    
    expect(metrics.loadTime).toBeLessThan(5000);
    expect(metrics.firstContentfulPaint).toBeLessThan(2000);
  });
  
  test('deve tratar erro Y', async ({ pageWithLogging, capturedLogs }) => {
    // Simular erro
    await pageWithLogging.click('[data-testid="botao-erro"]');
    
    // Verificar erro esperado
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    const errors = analyzer.getErrors();
    
    expect(errors.some(e => e.includes('Erro esperado'))).toBe(true);
  });
});
```

## 🔍 Debugging

### Modo UI
```bash
npm run test:ui
```
Interface gráfica com time travel debugging.

### Modo Headed
```bash
npm run test:headed
```
Ver o navegador executando os testes.

### Modo Debug
```bash
npm run test:debug
```
Pausar execução e inspecionar.

### Trace Viewer
```bash
npx playwright show-trace test-results/.../trace.zip
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Guia Completo](../PLAYWRIGHT_MCP_GUIDE.md)
- [Configuração](../playwright.config.ts)

## 💡 Dicas

1. **Use o codegen** para gerar seletores:
   ```bash
   npm run test:codegen
   ```

2. **Execute testes em paralelo** para velocidade:
   ```bash
   npx playwright test --workers=4
   ```

3. **Retry em falhas** para testes flaky:
   ```typescript
   test.describe.configure({ retries: 2 });
   ```

4. **Timeout personalizado** para testes lentos:
   ```typescript
   test('teste lento', async ({ page }) => {
     test.setTimeout(60000); // 60 segundos
     // ...
   });
   ```

## ✅ Checklist para Novos Testes

- [ ] Importar fixtures corretas
- [ ] Usar `pageWithLogging` ao invés de `page`
- [ ] Aguardar app estar pronto com `waitForAppReady()`
- [ ] Verificar erros com `MCPLogAnalyzer`
- [ ] Usar seletores específicos (data-testid, role, texto)
- [ ] Adicionar assertions adequadas
- [ ] Capturar screenshot se necessário
- [ ] Testar em ambos os projetos (chromium + headless)
- [ ] Executar teste localmente antes de commitar

---

**Happy Testing!** 🎉
