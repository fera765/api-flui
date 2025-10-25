# 🧪 Guia Completo de Testes da API

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Instalação](#instalação)
3. [Executar Testes](#executar-testes)
4. [Estrutura dos Testes](#estrutura-dos-testes)
5. [Exemplos com cURL](#exemplos-com-curl)
6. [Cenários de Automação](#cenários-de-automação)

---

## 🎯 Visão Geral

Esta API possui **60 testes end-to-end** que cobrem todas as rotas e cenários:

- ✅ Health Check
- ✅ Configuração do Sistema
- ✅ Agents (CRUD completo)
- ✅ Tools (CRUD completo)
- ✅ MCPs
- ✅ Automações (Manual, Webhook, Cron)
- ✅ Workflows Complexos
- ✅ Execution Tracking
- ✅ Error Handling

**Resultado:** 100% dos testes passando ✨

---

## 📦 Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Compilar o projeto
npm run build
```

---

## 🚀 Executar Testes

### Opção 1: Script Automatizado (Recomendado)

```bash
# Inicia a API e executa todos os testes automaticamente
bash run-e2e-tests.sh
```

Este script:
1. Mata processos existentes na porta 3000
2. Inicia a API em background
3. Aguarda a API ficar pronta
4. Executa os testes E2E
5. Faz cleanup automático

### Opção 2: Teste Manual

```bash
# Terminal 1: Iniciar a API
npm run build
npm start
# ou para desenvolvimento
npm run dev

# Terminal 2: Executar testes E2E
node test-api-e2e.js
```

### Opção 3: Testes Unitários e de Integração (Jest)

```bash
# Rodar todos os testes Jest
npm test

# Rodar com cobertura
npm run test:coverage

# Rodar em modo watch
npm run test:watch
```

---

## 📁 Estrutura dos Testes

### Arquivos Criados

```
workspace/
├── test-api-e2e.js           # Suite completa E2E com axios
├── run-e2e-tests.sh          # Script automatizado de teste
├── curl-examples.sh          # Exemplos de teste com curl
├── TESTE-E2E-RESULTADOS.md   # Relatório detalhado dos resultados
└── TESTES-README.md          # Este arquivo (guia)
```

### O que cada teste cobre

#### `test-api-e2e.js` - Testes Automatizados (60 testes)

```javascript
// Seções de teste:
0.  Cleanup de dados existentes
1.  Health Check (4 testes)
2.  System Configuration (6 testes)
3.  Models (1 teste informativo)
4.  Agents CRUD (10 testes)
5.  Tools CRUD (8 testes)
6.  MCPs (2 testes)
7.  Automações Manual (3 testes)
8.  Automações Webhook (2 testes)
9.  Automações Cron (2 testes)
10. Workflow Complexo (2 testes)
11. Automações CRUD (5 testes)
12. Execution Tracking (3 testes)
13. Error Handling (3 testes)
14. Cleanup Final (11 testes)
```

---

## 📡 Exemplos com cURL

### Executar Todos os Exemplos

```bash
# Certifique-se que a API está rodando primeiro!
npm start

# Em outro terminal:
bash curl-examples.sh
```

### Exemplos Individuais

#### 1. Health Check
```bash
curl http://localhost:3000/
```

#### 2. Criar um Agent
```bash
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Assistente Virtual",
    "description": "Ajuda usuários com perguntas",
    "prompt": "Você é um assistente prestativo",
    "defaultModel": "gpt-4"
  }'
```

#### 3. Listar Agents
```bash
curl http://localhost:3000/api/agents
```

#### 4. Criar uma Tool
```bash
curl -X POST http://localhost:3000/api/tools \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API de Clima",
    "description": "Busca informações do clima",
    "type": "http_request",
    "config": {
      "method": "GET",
      "url": "https://api.weather.com/current",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }'
```

#### 5. Criar uma Automação
```bash
curl -X POST http://localhost:3000/api/automations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Notificação Diária",
    "description": "Envia relatório diário",
    "nodes": [
      {
        "id": "trigger-1",
        "type": "trigger",
        "referenceId": "cron-daily"
      },
      {
        "id": "fetch-1",
        "type": "tool",
        "referenceId": "<TOOL_ID>"
      }
    ],
    "links": [
      {"from": "trigger-1", "to": "fetch-1"}
    ]
  }'
```

#### 6. Executar Automação
```bash
curl -X POST http://localhost:3000/api/automations/<AUTOMATION_ID>/execute \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### 7. Configurar Sistema
```bash
curl -X POST http://localhost:3000/api/setting \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "https://api.openai.com/v1",
    "apiKey": "sk-your-api-key",
    "model": "gpt-4"
  }'
```

---

## 🔄 Cenários de Automação

### 1. Automação com Trigger Manual

**Caso de uso:** Executar sob demanda

```json
{
  "name": "Processar Dados Manualmente",
  "nodes": [
    {
      "id": "manual-trigger",
      "type": "trigger",
      "referenceId": "manual"
    },
    {
      "id": "fetch-data",
      "type": "tool",
      "referenceId": "tool-id-here"
    }
  ],
  "links": [
    {"from": "manual-trigger", "to": "fetch-data"}
  ]
}
```

**Executar:**
```bash
POST /api/automations/:id/execute
```

### 2. Automação com Webhook

**Caso de uso:** Responder a eventos externos (pedidos, notificações, etc)

```json
{
  "name": "Processar Pedido",
  "nodes": [
    {
      "id": "webhook-trigger",
      "type": "trigger",
      "referenceId": "webhook-tool-id"
    },
    {
      "id": "validate",
      "type": "agent",
      "referenceId": "agent-id"
    },
    {
      "id": "save",
      "type": "tool",
      "referenceId": "save-tool-id"
    }
  ],
  "links": [
    {"from": "webhook-trigger", "to": "validate"},
    {"from": "validate", "to": "save"}
  ]
}
```

**Disparar webhook:**
```bash
POST /api/webhooks/:toolId
Body: { "orderId": "123", "amount": 99.99 }
```

### 3. Automação Agendada (Cron)

**Caso de uso:** Tarefas periódicas (relatórios, backups, sincronização)

```json
{
  "name": "Relatório Diário",
  "nodes": [
    {
      "id": "cron-trigger",
      "type": "trigger",
      "referenceId": "cron",
      "config": {
        "schedule": "0 9 * * *"
      }
    },
    {
      "id": "generate-report",
      "type": "agent",
      "referenceId": "agent-id"
    }
  ],
  "links": [
    {"from": "cron-trigger", "to": "generate-report"}
  ]
}
```

**Formatos de Cron:**
- `* * * * *` - A cada minuto
- `0 * * * *` - A cada hora
- `0 9 * * *` - Diariamente às 9h
- `0 9 * * 1` - Toda segunda-feira às 9h

### 4. Workflow Complexo Multi-Step

**Caso de uso:** Pipeline de processamento com múltiplas etapas

```json
{
  "name": "Pipeline de Análise Completo",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger",
      "referenceId": "manual"
    },
    {
      "id": "fetch",
      "type": "tool",
      "referenceId": "fetch-tool-id",
      "config": {"url": "https://api.example.com/data"}
    },
    {
      "id": "validate",
      "type": "agent",
      "referenceId": "validator-agent-id",
      "config": {
        "prompt": "Valide estes dados: {{fetch.output}}"
      }
    },
    {
      "id": "transform",
      "type": "agent",
      "referenceId": "transformer-agent-id",
      "config": {
        "prompt": "Transforme: {{validate.output}}"
      }
    },
    {
      "id": "save",
      "type": "tool",
      "referenceId": "save-tool-id",
      "config": {"data": "{{transform.output}}"}
    }
  ],
  "links": [
    {"from": "trigger", "to": "fetch"},
    {"from": "fetch", "to": "validate"},
    {"from": "validate", "to": "transform"},
    {"from": "transform", "to": "save"}
  ]
}
```

---

## 🔍 Monitoramento de Execução

### Iniciar Execução
```bash
POST /api/execution/:automationId/start
```

### Ver Status
```bash
GET /api/execution/:automationId/status
```

Resposta:
```json
{
  "automationId": "xxx",
  "status": "running|completed|error",
  "startedAt": "2025-10-25T10:00:00Z",
  "completedAt": "2025-10-25T10:00:05Z"
}
```

### Ver Logs
```bash
GET /api/execution/:automationId/logs
```

Resposta:
```json
[
  {
    "timestamp": "2025-10-25T10:00:00Z",
    "level": "info",
    "message": "Execution started",
    "nodeId": "trigger"
  },
  {
    "timestamp": "2025-10-25T10:00:02Z",
    "level": "info",
    "message": "Tool executed successfully",
    "nodeId": "fetch"
  }
]
```

### Stream de Eventos (SSE)
```bash
GET /api/execution/:automationId/events
```

---

## 🐛 Tratamento de Erros

A API retorna erros padronizados:

### 400 - Bad Request
```json
{
  "status": "error",
  "message": "Name is required"
}
```

### 404 - Not Found
```json
{
  "status": "error",
  "message": "Agent not found"
}
```

### 500 - Internal Server Error
```json
{
  "status": "error",
  "message": "Failed to execute tool"
}
```

---

## 📊 Resultados dos Testes

Veja o arquivo **`TESTE-E2E-RESULTADOS.md`** para:
- ✅ Relatório completo de todos os 60 testes
- 📈 Cobertura detalhada por endpoint
- 📝 Estruturas de dados validadas
- 💡 Observações e recomendações

---

## 🎓 Exemplos de Uso Real

### Exemplo 1: Sistema de Notificações

1. Criar webhook tool para receber eventos
2. Criar agent para processar notificação
3. Criar automação ligando webhook → agent
4. Configurar sistema externo para chamar o webhook

### Exemplo 2: Relatório Automático

1. Criar tool para buscar dados do banco
2. Criar agent para gerar relatório
3. Criar tool para enviar email
4. Criar automação cron: fetch → generate → send

### Exemplo 3: Chatbot com IA

1. Criar agent com prompt específico
2. Criar ferramentas auxiliares (busca, cálculo, etc)
3. Configurar o agent para usar as tools
4. Executar via API manual

---

## 📚 Recursos Adicionais

### Estrutura do Projeto
```
src/
├── modules/core/
│   ├── controllers/     # Controladores HTTP
│   ├── services/        # Lógica de negócio
│   ├── repositories/    # Persistência (In-Memory)
│   ├── domain/          # Entidades do domínio
│   └── routes/          # Definição de rotas
└── tests/
    ├── unit/            # Testes unitários
    └── integration/     # Testes de integração
```

### Tecnologias

- **Backend:** Node.js + Express + TypeScript
- **Arquitetura:** Clean Architecture + DDD + SOLID
- **Testes:** Jest + Supertest
- **E2E:** Axios

---

## 🤝 Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `api-server.log`
2. Execute os testes: `bash run-e2e-tests.sh`
3. Consulte `TESTE-E2E-RESULTADOS.md`
4. Revise os exemplos em `curl-examples.sh`

---

**🎉 Happy Testing!**
