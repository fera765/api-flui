# 🚀 Quick Start - Playwright MCP

## ⚡ Início Rápido (3 passos)

### 1️⃣ Iniciar o servidor de desenvolvimento
```bash
cd flui-frontend
npm run dev
```

### 2️⃣ Executar testes (em outro terminal)
```bash
cd flui-frontend
npm run test:ui
```

### 3️⃣ (Opcional) Iniciar servidor MCP
```bash
cd flui-frontend
npm run mcp:server
```

---

## 📋 Comandos Principais

```bash
# Testes
npm test                  # Todos os testes
npm run test:ui           # Interface UI ⭐ Recomendado
npm run test:headed       # Ver o navegador
npm run test:debug        # Modo debug
npm run test:report       # Ver relatório HTML

# MCP
npm run mcp:server        # Iniciar servidor MCP
npm run mcp:validate      # Validar configuração
npm run mcp:install       # (Re)instalar navegadores

# Codegen
npm run test:codegen      # Gerar testes automaticamente
```

---

## ✅ Validar Configuração

```bash
cd flui-frontend
npm run mcp:validate
```

Deve retornar: **✅ VALIDAÇÃO CONCLUÍDA: Tudo configurado corretamente!**

---

## 📚 Documentação Completa

- **PLAYWRIGHT_MCP_GUIDE.md** - Guia completo (7 seções)
- **tests/README.md** - Como criar testes
- **../PLAYWRIGHT_MCP_SETUP_COMPLETE.md** - Relatório de implementação

---

## 🎯 Estrutura dos Testes

```
tests/
├── e2e/
│   ├── basic-navigation.spec.ts   # ⭐ Comece aqui
│   ├── agents.spec.ts
│   ├── automations.spec.ts
│   └── workflow-editor.spec.ts
└── fixtures/
    ├── console-capture.ts         # Captura de logs
    └── mcp-helpers.ts             # Helpers úteis
```

---

## 💡 Dicas Rápidas

### Criar um Teste Novo

```typescript
import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test('meu teste', async ({ pageWithLogging, capturedLogs }) => {
  const helper = new MCPPageHelper(pageWithLogging);
  
  await pageWithLogging.goto('/');
  await helper.waitForAppReady();
  
  // Seu teste aqui
  
  // Verificar erros
  const analyzer = new MCPLogAnalyzer(capturedLogs);
  expect(analyzer.hasCriticalErrors()).toBe(false);
});
```

### Debug Rápido

```bash
# Ver o navegador executando
npm run test:headed

# Interface com time travel
npm run test:ui

# Pausar e inspecionar
npm run test:debug
```

---

## 🐛 Problemas Comuns

### "Navegador não encontrado"
```bash
npm run mcp:install
```

### "Servidor não responde"
```bash
# Certifique-se que o dev server está rodando
npm run dev
```

### "Teste falhou"
```bash
# Ver detalhes no relatório
npm run test:report
```

---

## 🎉 Tudo Pronto!

O Playwright MCP está **100% configurado e operacional**.

**28 testes** prontos para executar 🚀

---

**Precisa de ajuda?** Consulte PLAYWRIGHT_MCP_GUIDE.md
