# 🎭 Guia do Playwright MCP - Flui Frontend

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Instalação e Configuração](#instalação-e-configuração)
3. [Executando Testes](#executando-testes)
4. [Servidor MCP](#servidor-mcp)
5. [Recursos Avançados](#recursos-avançados)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Este projeto está configurado com **Playwright MCP** (Model Context Protocol), uma ferramenta oficial da Microsoft que permite:

- ✅ Automação de testes E2E (End-to-End)
- ✅ Captura automática de logs do console
- ✅ Monitoramento de requisições de rede
- ✅ Detecção de erros JavaScript
- ✅ Análise de performance
- ✅ Integração com Cursor AI via MCP

### 📦 Versões Instaladas

- **@playwright/test**: 1.56.1 (última versão estável)
- **@playwright/mcp**: 0.0.44 (última versão do MCP oficial)
- **Navegador**: Chromium (incluído)

---

## 🚀 Instalação e Configuração

### 1. Instalação Inicial (Já concluída)

```bash
cd flui-frontend
npm install
```

### 2. Instalar Navegadores do Playwright

Se ainda não instalou os navegadores:

```bash
npm run mcp:install
```

Ou manualmente:

```bash
npx playwright install --with-deps chromium
```

### 3. Estrutura de Arquivos

```
flui-frontend/
├── playwright.config.ts           # Configuração principal do Playwright
├── mcp-server.config.json         # Configuração do servidor MCP
├── tests/
│   ├── e2e/                       # Testes end-to-end
│   │   ├── basic-navigation.spec.ts
│   │   ├── agents.spec.ts
│   │   ├── automations.spec.ts
│   │   └── workflow-editor.spec.ts
│   └── fixtures/                  # Fixtures personalizadas
│       ├── console-capture.ts     # Captura de logs
│       └── mcp-helpers.ts         # Helpers do MCP
├── scripts/
│   └── run-mcp-server.js          # Script do servidor MCP
├── test-results/                  # Resultados dos testes
├── playwright-report/             # Relatórios HTML
└── screenshots/                   # Screenshots capturadas
```

---

## 🧪 Executando Testes

### Pré-requisito: Servidor de Desenvolvimento

**IMPORTANTE**: Os testes esperam que o servidor de desenvolvimento esteja rodando em `http://localhost:5173`.

Abra um terminal separado e execute:

```bash
npm run dev
```

### Comandos de Teste

#### Executar todos os testes
```bash
npm test
```

#### Executar com interface UI (recomendado para desenvolvimento)
```bash
npm run test:ui
```

#### Executar em modo headed (ver o navegador)
```bash
npm run test:headed
```

#### Executar em modo debug
```bash
npm run test:debug
```

#### Executar apenas no Chromium
```bash
npm run test:chromium
```

#### Ver relatório dos últimos testes
```bash
npm run test:report
```

#### Gerar testes automaticamente (codegen)
```bash
npm run test:codegen
```

### Executar Testes Específicos

```bash
# Executar um arquivo específico
npx playwright test basic-navigation.spec.ts

# Executar um teste específico
npx playwright test -g "deve carregar a página inicial sem erros"

# Executar testes de uma suite
npx playwright test -g "Navegação Básica"
```

---

## 🖥️ Servidor MCP

O Playwright MCP Server permite que o Cursor AI controle o navegador diretamente via Model Context Protocol.

### Iniciar o Servidor MCP

```bash
npm run mcp:server
```

Ou diretamente:

```bash
node scripts/run-mcp-server.js
```

### Configuração do Servidor

O servidor MCP está configurado em `mcp-server.config.json`:

```json
{
  "playwright": {
    "baseURL": "http://localhost:5173",
    "headless": true,
    "browser": "chromium"
  },
  "logging": {
    "level": "info",
    "captureConsole": true,
    "captureNetwork": true,
    "captureErrors": true
  }
}
```

### Variáveis de Ambiente

```bash
# Porta do servidor MCP (padrão: 8080)
MCP_PORT=8080

# Modo headless (padrão: true)
HEADLESS=false

# URL base da aplicação
BASE_URL=http://localhost:5173
```

---

## 🔧 Recursos Avançados

### 1. Captura de Logs e Console

Todos os testes utilizam fixtures personalizadas que capturam automaticamente:

```typescript
import { test, expect } from '../fixtures/console-capture';

test('meu teste', async ({ pageWithLogging, capturedLogs }) => {
  // pageWithLogging: página com captura ativada
  // capturedLogs: objeto com todos os logs capturados
  
  await pageWithLogging.goto('/');
  
  // Verificar logs capturados
  console.log('Console logs:', capturedLogs.console);
  console.log('Erros:', capturedLogs.errors);
  console.log('Requisições:', capturedLogs.network);
});
```

### 2. Análise de Logs com MCPLogAnalyzer

```typescript
import { MCPLogAnalyzer } from '../fixtures/mcp-helpers';

test('analisar logs', async ({ pageWithLogging, capturedLogs }) => {
  await pageWithLogging.goto('/');
  
  const analyzer = new MCPLogAnalyzer(capturedLogs);
  
  // Verificar erros
  if (analyzer.hasCriticalErrors()) {
    console.error(analyzer.getErrors());
  }
  
  // Verificar requisições falhadas
  if (analyzer.hasFailedRequests()) {
    console.error(analyzer.getFailedRequests());
  }
  
  // Gerar relatório completo
  console.log(analyzer.generateReport());
  
  // Exportar logs em JSON
  const logsJSON = analyzer.exportJSON();
});
```

### 3. Helpers de Página

```typescript
import { MCPPageHelper } from '../fixtures/mcp-helpers';

test('usar helpers', async ({ pageWithLogging }) => {
  const helper = new MCPPageHelper(pageWithLogging);
  
  // Aguardar app estar pronto
  await helper.waitForAppReady();
  
  // Capturar screenshot
  await helper.captureScreenshot('nome-do-teste');
  
  // Verificar erros visíveis
  const hasErrors = await helper.hasVisibleErrors();
  
  // Obter métricas de performance
  const metrics = await helper.getPerformanceMetrics();
  console.log('Performance:', metrics);
});
```

### 4. Métricas de Performance

Todos os testes podem capturar métricas de performance:

```typescript
test('performance', async ({ pageWithLogging }) => {
  const helper = new MCPPageHelper(pageWithLogging);
  
  await pageWithLogging.goto('/');
  await helper.waitForAppReady();
  
  const metrics = await helper.getPerformanceMetrics();
  
  console.log({
    loadTime: metrics.loadTime,
    domContentLoaded: metrics.domContentLoaded,
    firstPaint: metrics.firstPaint,
    firstContentfulPaint: metrics.firstContentfulPaint
  });
  
  // Asserções de performance
  expect(metrics.loadTime).toBeLessThan(5000); // < 5 segundos
  expect(metrics.firstContentfulPaint).toBeLessThan(2000); // < 2 segundos
});
```

### 5. Code Coverage

Os testes capturam automaticamente coverage de JavaScript e CSS:

```typescript
test('coverage', async ({ capturedLogs }) => {
  // Coverage é coletado automaticamente
  
  // Acessar coverage
  const jsCoverage = capturedLogs.coverage.js;
  const cssCoverage = capturedLogs.coverage.css;
  
  console.log('JS Coverage:', jsCoverage);
  console.log('CSS Coverage:', cssCoverage);
});
```

---

## 📊 Relatórios e Resultados

### Relatórios HTML

Após executar os testes, visualize o relatório HTML:

```bash
npm run test:report
```

### Estrutura de Resultados

```
test-results/
├── results.json              # Resultados em JSON
├── videos/                   # Vídeos dos testes (falhas)
├── network.har              # Arquivo HAR com requisições
└── traces/                   # Traces para debugging
```

### Screenshots

Screenshots são capturadas automaticamente:
- ✅ Em falhas de teste
- ✅ Via `helper.captureScreenshot()`
- ✅ Armazenados em `screenshots/`

---

## 🐛 Troubleshooting

### Problema: "Navegador não encontrado"

**Solução:**
```bash
npm run mcp:install
```

### Problema: "Timed out waiting from config.webServer"

**Solução:**
1. Inicie o servidor de desenvolvimento manualmente:
   ```bash
   npm run dev
   ```

2. Ou comente a seção `webServer` em `playwright.config.ts`

### Problema: "Page didn't respond"

**Solução:**
- Aumente o timeout em `playwright.config.ts`:
  ```typescript
  timeout: 60 * 1000, // 60 segundos
  ```

### Problema: Testes falhando por elementos não encontrados

**Solução:**
1. Use o modo UI para debugar:
   ```bash
   npm run test:ui
   ```

2. Ou execute em modo headed:
   ```bash
   npm run test:headed
   ```

3. Use o codegen para gerar seletores corretos:
   ```bash
   npm run test:codegen
   ```

### Problema: "Cannot connect to MCP server"

**Solução:**
1. Verifique se o servidor está rodando:
   ```bash
   npm run mcp:server
   ```

2. Verifique a porta (padrão: 8080):
   ```bash
   MCP_PORT=8080 npm run mcp:server
   ```

---

## 📚 Recursos Adicionais

### Documentação Oficial

- [Playwright Docs](https://playwright.dev/)
- [Playwright MCP GitHub](https://github.com/microsoft/playwright-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

### Exemplos de Testes

Veja os arquivos em `tests/e2e/` para exemplos completos:

- `basic-navigation.spec.ts` - Navegação e métricas
- `agents.spec.ts` - Testes de listagem e busca
- `automations.spec.ts` - Testes de CRUD
- `workflow-editor.spec.ts` - Testes do React Flow

### Comandos Úteis

```bash
# Limpar cache e resultados
rm -rf test-results playwright-report screenshots

# Ver versão do Playwright
npx playwright --version

# Listar todos os testes
npx playwright test --list

# Executar testes em paralelo
npx playwright test --workers=4

# Executar testes serialmente
npx playwright test --workers=1

# Executar com retry automático
npx playwright test --retries=2

# Executar apenas testes que falharam
npx playwright test --last-failed
```

---

## ✅ Checklist de Validação

Antes de entregar para produção, execute:

- [ ] Todos os testes passando: `npm test`
- [ ] Sem erros críticos nos logs
- [ ] Sem requisições falhadas (4xx, 5xx)
- [ ] Performance adequada (< 5s load, < 2s FCP)
- [ ] Screenshots sem erros visíveis
- [ ] Servidor MCP operacional: `npm run mcp:server`
- [ ] Coverage de código adequado

---

## 🎉 Conclusão

O Playwright MCP está **totalmente configurado e operacional** no projeto Flui Frontend!

**Próximos passos sugeridos:**

1. ✅ Inicie o servidor dev: `npm run dev`
2. ✅ Execute os testes: `npm run test:ui`
3. ✅ Analise o relatório: `npm run test:report`
4. ✅ Inicie o MCP server: `npm run mcp:server`
5. ✅ Configure o Cursor para usar o MCP

**Para dúvidas ou problemas:**
- Consulte os logs em `test-results/`
- Execute em modo debug: `npm run test:debug`
- Verifique este guia para troubleshooting

---

**Documentação criada em:** 27/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Operacional
