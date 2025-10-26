# 📚 Knowledge Routes - API Backend Documentation

**Versão**: 1.0.0  
**Data**: 2025-10-26  
**Base URL**: `http://localhost:3333` (padrão)

---

## 📋 Índice

1. [Health Check](#1-health-check)
2. [System Configuration](#2-system-configuration)
3. [Models](#3-models)
4. [Agents](#4-agents)
5. [MCPs (Model Context Protocol)](#5-mcps-model-context-protocol)
6. [System Tools](#6-system-tools)
7. [WebHooks](#7-webhooks)
8. [Condition Tools](#8-condition-tools)
9. [Automations](#9-automations)
10. [Execution](#10-execution)
11. [Import/Export](#11-importexport)
12. [TOR - Tool Onboarding Registry](#12-tor---tool-onboarding-registry)
13. [Chat (Feature 10)](#13-chat-feature-10)

---

## 1. Health Check

### `GET /`
Health check do sistema.

**Request:**
```
GET /
```

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-10-26T10:30:00.000Z",
  "service": "automation-api"
}
```

---

## 2. System Configuration

### `GET /api/setting`
Busca configuração do sistema.

**Request:**
```
GET /api/setting
```

**Response:** `200 OK`
```json
{
  "endpoint": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "model": "gpt-4"
}
```

**Response (Not Found):** `404 Not Found`
```json
{
  "error": "Configuration not found"
}
```

---

### `POST /api/setting`
Cria configuração do sistema (primeira vez).

**Request:**
```
POST /api/setting
Content-Type: application/json

{
  "endpoint": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "model": "gpt-4"
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| endpoint | string | ✅ | URL do endpoint da API LLM |
| apiKey | string | ❌ | Chave de API (opcional) |
| model | string | ✅ | Nome do modelo a ser usado |

**Response:** `201 Created`
```json
{
  "endpoint": "https://api.openai.com/v1",
  "apiKey": "sk-xxx",
  "model": "gpt-4"
}
```

**Response (Conflict):** `409 Conflict`
```json
{
  "error": "Configuration already exists"
}
```

---

### `PATCH /api/setting`
Atualiza configuração do sistema.

**Request:**
```
PATCH /api/setting
Content-Type: application/json

{
  "endpoint": "https://api.anthropic.com/v1",
  "model": "claude-3-opus"
}
```

**Body Parameters (todos opcionais):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| endpoint | string | URL do endpoint da API LLM |
| apiKey | string | Chave de API |
| model | string | Nome do modelo |

**Response:** `200 OK`
```json
{
  "endpoint": "https://api.anthropic.com/v1",
  "apiKey": "sk-xxx",
  "model": "claude-3-opus"
}
```

---

## 3. Models

### `GET /api/models`
Lista modelos disponíveis baseado na configuração atual.

**Request:**
```
GET /api/models
```

**Response:** `200 OK`
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai"
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "provider": "openai"
    }
  ]
}
```

---

## 4. Agents

### `GET /api/agents`
Lista todos os agentes.

**Request:**
```
GET /api/agents
```

**Response:** `200 OK`
```json
[
  {
    "id": "agent-123",
    "name": "Customer Support Agent",
    "description": "Agent for customer support",
    "prompt": "You are a helpful customer support agent...",
    "defaultModel": "gpt-4",
    "tools": [
      {
        "id": "tool-456",
        "name": "search_knowledge_base",
        "description": "Search the knowledge base",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": { "type": "string" }
          }
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "results": { "type": "array" }
          }
        }
      }
    ]
  }
]
```

---

### `GET /api/agents/:id`
Busca agente por ID.

**Request:**
```
GET /api/agents/agent-123
```

**Response:** `200 OK`
```json
{
  "id": "agent-123",
  "name": "Customer Support Agent",
  "description": "Agent for customer support",
  "prompt": "You are a helpful customer support agent...",
  "defaultModel": "gpt-4",
  "tools": []
}
```

**Response (Not Found):** `404 Not Found`
```json
{
  "error": "Agent not found"
}
```

---

### `POST /api/agents`
Cria novo agente.

**Request:**
```
POST /api/agents
Content-Type: application/json

{
  "name": "Sales Agent",
  "description": "Agent for sales support",
  "prompt": "You are a sales expert...",
  "defaultModel": "gpt-4",
  "tools": []
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | ✅ | Nome do agente |
| description | string | ❌ | Descrição do agente |
| prompt | string | ✅ | Prompt/instrução do agente |
| defaultModel | string | ❌ | Modelo padrão a ser usado |
| tools | Tool[] | ❌ | Array de tools disponíveis para o agente |

**Response:** `201 Created`
```json
{
  "id": "agent-789",
  "name": "Sales Agent",
  "description": "Agent for sales support",
  "prompt": "You are a sales expert...",
  "defaultModel": "gpt-4",
  "tools": []
}
```

---

### `PATCH /api/agents/:id`
Atualiza agente.

**Request:**
```
PATCH /api/agents/agent-123
Content-Type: application/json

{
  "name": "Updated Agent Name",
  "prompt": "Updated prompt..."
}
```

**Body Parameters (todos opcionais):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do agente |
| description | string | Descrição do agente |
| prompt | string | Prompt/instrução do agente |
| defaultModel | string | Modelo padrão |
| tools | Tool[] | Array de tools |

**Response:** `200 OK`
```json
{
  "id": "agent-123",
  "name": "Updated Agent Name",
  "description": "Agent for customer support",
  "prompt": "Updated prompt...",
  "defaultModel": "gpt-4",
  "tools": []
}
```

---

### `DELETE /api/agents/:id`
Deleta agente.

**Request:**
```
DELETE /api/agents/agent-123
```

**Response:** `204 No Content`

---

## 5. MCPs (Model Context Protocol)

### `GET /api/mcps`
Lista todos os MCPs importados.

**Request:**
```
GET /api/mcps
```

**Response:** `200 OK`
```json
[
  {
    "id": "mcp-123",
    "name": "filesystem",
    "source": "@modelcontextprotocol/server-filesystem",
    "sourceType": "npx",
    "description": "File system operations MCP",
    "tools": [
      {
        "id": "tool-fs-1",
        "name": "read_file",
        "description": "Read file contents",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": { "type": "string" }
          }
        },
        "outputSchema": {
          "type": "object",
          "properties": {
            "content": { "type": "string" }
          }
        }
      }
    ],
    "env": {
      "BASE_PATH": "/workspace"
    }
  }
]
```

---

### `POST /api/mcps/import`
Importa novo MCP.

**Request:**
```
POST /api/mcps/import
Content-Type: application/json

{
  "name": "github",
  "source": "@modelcontextprotocol/server-github",
  "description": "GitHub operations MCP",
  "env": {
    "GITHUB_TOKEN": "ghp_xxx"
  }
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | ✅ | Nome do MCP |
| source | string | ✅ | Fonte do MCP (npx package ou URL) |
| description | string | ❌ | Descrição do MCP |
| env | object | ❌ | Variáveis de ambiente necessárias |

**Response:** `201 Created`
```json
{
  "mcp": {
    "id": "mcp-456",
    "name": "github",
    "source": "@modelcontextprotocol/server-github",
    "sourceType": "npx",
    "description": "GitHub operations MCP",
    "tools": [
      {
        "id": "tool-gh-1",
        "name": "create_issue",
        "description": "Create GitHub issue",
        "inputSchema": { ... },
        "outputSchema": { ... }
      }
    ],
    "env": {
      "GITHUB_TOKEN": "ghp_xxx"
    }
  },
  "toolsExtracted": 5
}
```

---

### `GET /api/mcps/:id/tools`
Lista tools de um MCP específico.

**Request:**
```
GET /api/mcps/mcp-123/tools
```

**Response:** `200 OK`
```json
[
  {
    "id": "tool-fs-1",
    "name": "read_file",
    "description": "Read file contents",
    "inputSchema": {
      "type": "object",
      "properties": {
        "path": { "type": "string" }
      }
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "content": { "type": "string" }
      }
    }
  }
]
```

---

### `DELETE /api/mcps/:id`
Deleta MCP.

**Request:**
```
DELETE /api/mcps/mcp-123
```

**Response:** `204 No Content`

---

## 6. System Tools

### `GET /api/tools`
Lista todas as tools do sistema.

**Request:**
```
GET /api/tools
```

**Response:** `200 OK`
```json
[
  {
    "id": "tool-trigger-manual",
    "name": "trigger_manual",
    "description": "Manual trigger for automations",
    "type": "trigger",
    "config": {
      "inputs": {
        "message": "string"
      }
    },
    "inputSchema": {
      "type": "object",
      "properties": {
        "message": { "type": "string" }
      }
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "message": { "type": "string" }
      }
    }
  }
]
```

---

### `GET /api/tools/:id`
Busca tool por ID.

**Request:**
```
GET /api/tools/tool-123
```

**Response:** `200 OK`
```json
{
  "id": "tool-123",
  "name": "send_email",
  "description": "Send email action",
  "type": "action",
  "config": {},
  "inputSchema": {
    "type": "object",
    "properties": {
      "to": { "type": "string" },
      "subject": { "type": "string" },
      "body": { "type": "string" }
    },
    "required": ["to", "subject", "body"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": { "type": "string" },
      "messageId": { "type": "string" }
    }
  }
}
```

---

### `POST /api/tools`
Cria nova tool.

**Request:**
```
POST /api/tools
Content-Type: application/json

{
  "name": "custom_action",
  "description": "Custom action tool",
  "type": "action",
  "config": {},
  "inputSchema": {
    "type": "object",
    "properties": {
      "input": { "type": "string" }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    }
  }
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | ✅ | Nome da tool |
| description | string | ❌ | Descrição da tool |
| type | "trigger" \| "action" | ✅ | Tipo da tool |
| config | object | ❌ | Configuração específica da tool |
| inputSchema | object | ❌ | JSON Schema do input |
| outputSchema | object | ❌ | JSON Schema do output |
| executor | function | ❌ | Função executora (apenas no backend) |

**Response:** `201 Created`
```json
{
  "id": "tool-789",
  "name": "custom_action",
  "description": "Custom action tool",
  "type": "action",
  "config": {},
  "inputSchema": { ... },
  "outputSchema": { ... }
}
```

---

### `POST /api/tools/:id/execute`
Executa uma tool.

**Request:**
```
POST /api/tools/tool-123/execute
Content-Type: application/json

{
  "to": "user@example.com",
  "subject": "Test Email",
  "body": "This is a test"
}
```

**Body:** Qualquer payload que corresponda ao `inputSchema` da tool.

**Response:** `200 OK`
```json
{
  "status": "sent",
  "messageId": "msg-456"
}
```

---

### `DELETE /api/tools/:id`
Deleta tool.

**Request:**
```
DELETE /api/tools/tool-123
```

**Response:** `204 No Content`

---

## 7. WebHooks

### `GET /api/webhooks/:toolId`
Executa webhook via GET.

**Request:**
```
GET /api/webhooks/tool-webhook-123?param1=value1&param2=value2
Authorization: Bearer webhook-token-here
```

**Query Parameters:** Definidos no `config.inputs` da tool webhook.

**Headers:**
| Header | Obrigatório | Descrição |
|--------|-------------|-----------|
| Authorization | ✅ | Bearer token configurado na tool |

**Response:** `200 OK`
```json
{
  "status": "triggered",
  "data": { ... }
}
```

---

### `POST /api/webhooks/:toolId`
Executa webhook via POST.

**Request:**
```
POST /api/webhooks/tool-webhook-123
Authorization: Bearer webhook-token-here
Content-Type: application/json

{
  "event": "purchase",
  "amount": 99.99,
  "customer": "customer-123"
}
```

**Body:** Definido pelo `config.inputs` da tool webhook.

**Response:** `200 OK`
```json
{
  "status": "triggered",
  "automationId": "auto-123",
  "executionId": "exec-456"
}
```

---

## 8. Condition Tools

### `GET /api/tools/condition`
Lista todas as condition tools.

**Request:**
```
GET /api/tools/condition
```

**Response:** `200 OK`
```json
[
  {
    "id": "cond-123",
    "name": "Intent Router",
    "description": "Route based on user intent",
    "type": "atoom",
    "conditions": [
      {
        "id": "cond-item-1",
        "name": "compra",
        "predicate": "input.intent === 'compra'",
        "linkedNodes": ["node-sales-1"]
      },
      {
        "id": "cond-item-2",
        "name": "ajuda",
        "predicate": "input.intent === 'ajuda'",
        "linkedNodes": ["node-support-1"]
      }
    ]
  }
]
```

---

### `GET /api/tools/condition/:id`
Busca condition tool por ID.

**Request:**
```
GET /api/tools/condition/cond-123
```

**Response:** `200 OK`
```json
{
  "id": "cond-123",
  "name": "Intent Router",
  "description": "Route based on user intent",
  "type": "atoom",
  "conditions": [
    {
      "id": "cond-item-1",
      "name": "compra",
      "predicate": "input.intent === 'compra'",
      "linkedNodes": ["node-sales-1"]
    }
  ]
}
```

---

### `POST /api/tools/condition`
Cria nova condition tool.

**Request:**
```
POST /api/tools/condition
Content-Type: application/json

{
  "name": "Status Router",
  "description": "Route based on status",
  "conditions": [
    {
      "id": "cond-pending",
      "name": "pending",
      "predicate": "input.status === 'pending'",
      "linkedNodes": ["node-pending-handler"]
    },
    {
      "id": "cond-approved",
      "name": "approved",
      "predicate": "input.status === 'approved'",
      "linkedNodes": ["node-approved-handler"]
    }
  ]
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | ✅ | Nome da condition tool |
| description | string | ❌ | Descrição |
| conditions | Condition[] | ✅ | Array de condições |

**Condition Object:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | string | ✅ | ID único da condição |
| name | string | ✅ | Nome da condição |
| predicate | string | ✅ | Expressão JavaScript para avaliar |
| linkedNodes | string[] | ✅ | IDs dos nós a serem executados se condição for verdadeira |

**Response:** `201 Created`
```json
{
  "id": "cond-456",
  "name": "Status Router",
  "description": "Route based on status",
  "type": "atoom",
  "conditions": [ ... ]
}
```

---

### `PATCH /api/tools/condition/:id`
Atualiza condition tool.

**Request:**
```
PATCH /api/tools/condition/cond-123
Content-Type: application/json

{
  "name": "Updated Router",
  "conditions": [ ... ]
}
```

**Body Parameters (todos opcionais):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome da condition tool |
| description | string | Descrição |
| conditions | Condition[] | Array de condições |

**Response:** `200 OK`
```json
{
  "id": "cond-123",
  "name": "Updated Router",
  "description": "Route based on user intent",
  "type": "atoom",
  "conditions": [ ... ]
}
```

---

### `POST /api/tools/condition/:id/evaluate`
Avalia condições da tool.

**Request:**
```
POST /api/tools/condition/cond-123/evaluate
Content-Type: application/json

{
  "input": {
    "intent": "compra",
    "amount": 99.99
  },
  "evaluateAll": false
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| input | any | ✅ | Dados para avaliar |
| evaluateAll | boolean | ❌ | Se true, retorna todas as condições satisfeitas. Se false (padrão), retorna apenas a primeira |

**Response (evaluateAll = false):** `200 OK`
```json
{
  "satisfied": true,
  "conditionId": "cond-item-1",
  "conditionName": "compra",
  "linkedNodes": ["node-sales-1"]
}
```

**Response (evaluateAll = true):** `200 OK`
```json
[
  {
    "satisfied": true,
    "conditionId": "cond-item-1",
    "conditionName": "compra",
    "linkedNodes": ["node-sales-1"]
  }
]
```

---

### `DELETE /api/tools/condition/:id`
Deleta condition tool.

**Request:**
```
DELETE /api/tools/condition/cond-123
```

**Response:** `204 No Content`

---

## 9. Automations

### `GET /api/automations`
Lista todas as automações.

**Request:**
```
GET /api/automations
```

**Response:** `200 OK`
```json
[
  {
    "id": "auto-123",
    "name": "Customer Onboarding",
    "description": "Automated customer onboarding flow",
    "status": "idle",
    "nodes": [
      {
        "id": "node-1",
        "type": "trigger",
        "referenceId": "tool-trigger-webhook-1",
        "config": {},
        "outputs": {}
      },
      {
        "id": "node-2",
        "type": "agent",
        "referenceId": "agent-123",
        "config": {
          "model": "gpt-4"
        },
        "outputs": {}
      }
    ],
    "links": [
      {
        "fromNodeId": "node-1",
        "fromOutputKey": "output",
        "toNodeId": "node-2",
        "toInputKey": "input"
      }
    ]
  }
]
```

---

### `GET /api/automations/:id`
Busca automação por ID.

**Request:**
```
GET /api/automations/auto-123
```

**Response:** `200 OK`
```json
{
  "id": "auto-123",
  "name": "Customer Onboarding",
  "description": "Automated customer onboarding flow",
  "status": "idle",
  "nodes": [ ... ],
  "links": [ ... ]
}
```

---

### `POST /api/automations`
Cria nova automação.

**Request:**
```
POST /api/automations
Content-Type: application/json

{
  "name": "Sales Pipeline",
  "description": "Automated sales pipeline",
  "nodes": [
    {
      "id": "node-trigger-1",
      "type": "trigger",
      "referenceId": "tool-trigger-manual",
      "config": {}
    },
    {
      "id": "node-agent-1",
      "type": "agent",
      "referenceId": "agent-sales-1",
      "config": {
        "model": "gpt-4"
      }
    }
  ],
  "links": [
    {
      "fromNodeId": "node-trigger-1",
      "fromOutputKey": "output",
      "toNodeId": "node-agent-1",
      "toInputKey": "input"
    }
  ]
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| name | string | ✅ | Nome da automação |
| description | string | ❌ | Descrição |
| nodes | Node[] | ✅ | Array de nós |
| links | Link[] | ✅ | Array de conexões entre nós |

**Node Object:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| id | string | ✅ | ID único do nó |
| type | "trigger" \| "agent" \| "tool" \| "condition" | ✅ | Tipo do nó |
| referenceId | string | ✅ | ID da entidade referenciada (agent, tool, etc) |
| config | object | ❌ | Configuração específica do nó |
| outputs | object | ❌ | Outputs do nó (preenchido durante execução) |

**Link Object:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| fromNodeId | string | ✅ | ID do nó de origem |
| fromOutputKey | string | ✅ | Chave do output no nó de origem |
| toNodeId | string | ✅ | ID do nó de destino |
| toInputKey | string | ✅ | Chave do input no nó de destino |

**Response:** `201 Created`
```json
{
  "id": "auto-456",
  "name": "Sales Pipeline",
  "description": "Automated sales pipeline",
  "status": "idle",
  "nodes": [ ... ],
  "links": [ ... ]
}
```

---

### `PATCH /api/automations/:id`
Atualiza automação.

**Request:**
```
PATCH /api/automations/auto-123
Content-Type: application/json

{
  "name": "Updated Automation",
  "nodes": [ ... ],
  "links": [ ... ]
}
```

**Body Parameters (todos opcionais):**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome da automação |
| description | string | Descrição |
| nodes | Node[] | Array de nós |
| links | Link[] | Array de links |

**Response:** `200 OK`
```json
{
  "id": "auto-123",
  "name": "Updated Automation",
  "description": "Automated customer onboarding flow",
  "status": "idle",
  "nodes": [ ... ],
  "links": [ ... ]
}
```

---

### `POST /api/automations/:id/execute`
Executa automação (síncrono).

**Request:**
```
POST /api/automations/auto-123/execute
Content-Type: application/json

{
  "customerName": "John Doe",
  "email": "john@example.com"
}
```

**Body:** Qualquer payload que será passado como input para o trigger da automação.

**Response:** `200 OK`
```json
{
  "automationId": "auto-123",
  "executedNodes": {
    "node-1": {
      "status": "completed",
      "output": { ... }
    },
    "node-2": {
      "status": "completed",
      "output": { ... }
    }
  },
  "errors": {}
}
```

**Response (com erros):**
```json
{
  "automationId": "auto-123",
  "executedNodes": {
    "node-1": {
      "status": "completed",
      "output": { ... }
    }
  },
  "errors": {
    "node-2": "Execution failed: Connection timeout"
  }
}
```

---

### `DELETE /api/automations/:id`
Deleta automação.

**Request:**
```
DELETE /api/automations/auto-123
```

**Response:** `204 No Content`

---

## 10. Execution

### `POST /api/execution/:automationId/start`
Inicia execução assíncrona de automação.

**Request:**
```
POST /api/execution/auto-123/start
Content-Type: application/json

{
  "customerName": "Jane Smith",
  "email": "jane@example.com"
}
```

**Body:** Qualquer payload que será passado como input para o trigger da automação.

**Response:** `202 Accepted`
```json
{
  "message": "Execution started",
  "automationId": "auto-123"
}
```

---

### `GET /api/execution/:automationId/status`
Busca status da execução.

**Request:**
```
GET /api/execution/auto-123/status
```

**Response:** `200 OK`
```json
{
  "automationId": "auto-123",
  "status": "running",
  "startTime": "2025-10-26T10:00:00.000Z",
  "currentNode": "node-2",
  "completedNodes": ["node-1"]
}
```

**Status possíveis:** `"pending"`, `"running"`, `"completed"`, `"failed"`

---

### `GET /api/execution/:automationId/logs`
Busca logs da execução.

**Request:**
```
GET /api/execution/auto-123/logs
```

**Response:** `200 OK`
```json
[
  {
    "automationId": "auto-123",
    "nodeId": "node-1",
    "inputs": {
      "customerName": "Jane Smith"
    },
    "outputs": {
      "processedData": { ... }
    },
    "status": "completed",
    "startTime": "2025-10-26T10:00:00.000Z",
    "endTime": "2025-10-26T10:00:02.000Z",
    "duration": 2000
  },
  {
    "automationId": "auto-123",
    "nodeId": "node-2",
    "inputs": {
      "processedData": { ... }
    },
    "outputs": {
      "result": "success"
    },
    "status": "completed",
    "startTime": "2025-10-26T10:00:02.000Z",
    "endTime": "2025-10-26T10:00:05.000Z",
    "duration": 3000
  }
]
```

---

### `GET /api/execution/:automationId/events` 🔴 **STREAM (SSE)**
Stream de eventos da execução em tempo real.

**⚠️ Esta rota suporta Server-Sent Events (SSE)**

**Request:**
```
GET /api/execution/auto-123/events
```

**Headers:**
```
Accept: text/event-stream
```

**Response:** `200 OK` (stream contínuo)
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"nodeId":"node-1","automationId":"auto-123","status":"running","timestamp":"2025-10-26T10:00:00.000Z"}

data: {"nodeId":"node-1","automationId":"auto-123","status":"completed","outputs":{"data":"..."},"timestamp":"2025-10-26T10:00:02.000Z"}

data: {"nodeId":"node-2","automationId":"auto-123","status":"running","timestamp":"2025-10-26T10:00:02.000Z"}

data: {"nodeId":"node-2","automationId":"auto-123","status":"completed","outputs":{"result":"success"},"timestamp":"2025-10-26T10:00:05.000Z"}
```

**Event Object:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| nodeId | string | ID do nó sendo executado |
| automationId | string | ID da automação |
| status | "running" \| "completed" \| "failed" | Status do nó |
| outputs | object | Outputs do nó (quando completed) |
| error | string | Mensagem de erro (quando failed) |
| timestamp | string | Timestamp ISO do evento |

---

## 11. Import/Export

### `GET /api/automations/export/:id`
Exporta automação com todas as dependências.

**Request:**
```
GET /api/automations/export/auto-123?author=John&tags=sales,crm&description=Sales automation
```

**Query Parameters (todos opcionais):**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| author | string | Nome do autor |
| tags | string | Tags separadas por vírgula |
| description | string | Descrição da exportação |

**Response:** `200 OK`
```
Content-Type: application/json
Content-Disposition: attachment; filename="automation-auto-123-export.json"

{
  "version": "1.0.0",
  "exportedAt": "2025-10-26T10:30:00.000Z",
  "automation": {
    "id": "auto-123",
    "name": "Customer Onboarding",
    "description": "Automated customer onboarding flow",
    "status": "idle",
    "nodes": [ ... ],
    "links": [ ... ],
    "trigger": {
      "type": "webhook",
      "config": { ... }
    },
    "actions": [ ... ]
  },
  "dependencies": {
    "agents": [
      {
        "id": "agent-123",
        "name": "Support Agent",
        "description": "Customer support agent",
        "prompt": "...",
        "defaultModel": "gpt-4",
        "tools": [ ... ]
      }
    ],
    "tools": [
      {
        "id": "tool-456",
        "name": "send_email",
        "description": "Send email action",
        "type": "action",
        "config": {},
        "inputSchema": { ... },
        "outputSchema": { ... }
      }
    ],
    "mcps": [
      {
        "id": "mcp-789",
        "name": "filesystem",
        "source": "@modelcontextprotocol/server-filesystem",
        "sourceType": "npx",
        "description": "File system operations",
        "tools": [ ... ],
        "env": { ... }
      }
    ]
  },
  "metadata": {
    "author": "John",
    "tags": ["sales", "crm"],
    "description": "Sales automation",
    "environment": "production"
  },
  "hash": "1a2b3c4d5e"
}
```

---

### `GET /api/automations/export/all`
Exporta todas as automações.

**Request:**
```
GET /api/automations/export/all
```

**Response:** `200 OK`
```
Content-Type: application/json
Content-Disposition: attachment; filename="all-automations-export.json"

{
  "version": "1.0.0",
  "exportedAt": "2025-10-26T10:30:00.000Z",
  "automations": [
    {
      "automation": { ... },
      "dependencies": { ... },
      "metadata": { ... },
      "hash": "..."
    }
  ],
  "totalAutomations": 3
}
```

---

### `POST /api/automations/import/validate`
Valida dados de importação sem importar.

**Request:**
```
POST /api/automations/import/validate
Content-Type: application/json

{
  "data": {
    "version": "1.0.0",
    "exportedAt": "2025-10-26T10:30:00.000Z",
    "automation": { ... },
    "dependencies": { ... },
    "metadata": { ... },
    "hash": "1a2b3c4d5e"
  }
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| data | object | ✅ | Dados de exportação a serem validados |

**Response (válido):** `200 OK`
```json
{
  "valid": true,
  "version": "1.0.0",
  "automationName": "Customer Onboarding",
  "dependenciesCount": {
    "agents": 1,
    "tools": 2,
    "mcps": 1
  },
  "warnings": [],
  "integrityCheck": "passed"
}
```

**Response (inválido):** `200 OK`
```json
{
  "valid": false,
  "errors": [
    "Missing automation data",
    "Invalid version format",
    "Hash verification failed"
  ],
  "warnings": [
    "Some tools may not be compatible with current version"
  ]
}
```

---

### `POST /api/automations/import`
Importa automação.

**Request:**
```
POST /api/automations/import
Content-Type: application/json

{
  "data": {
    "version": "1.0.0",
    "exportedAt": "2025-10-26T10:30:00.000Z",
    "automation": { ... },
    "dependencies": { ... },
    "metadata": { ... },
    "hash": "1a2b3c4d5e"
  },
  "options": {
    "overwriteExisting": false,
    "importDependencies": true,
    "skipValidation": false
  }
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| data | object | ✅ | Dados de exportação |
| options | object | ❌ | Opções de importação |

**Import Options:**
| Campo | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| overwriteExisting | boolean | false | Sobrescrever entidades existentes |
| importDependencies | boolean | true | Importar dependências (agents, tools, mcps) |
| skipValidation | boolean | false | Pular validação (não recomendado) |

**Response (sucesso):** `201 Created`
```json
{
  "status": "success",
  "message": "Automation imported successfully",
  "automationId": "auto-new-123",
  "mappedIds": {
    "automation": {
      "old": "auto-123",
      "new": "auto-new-123"
    },
    "agents": {
      "agent-123": "agent-new-456"
    },
    "tools": {
      "tool-456": "tool-new-789"
    },
    "mcps": {
      "mcp-789": "mcp-new-012"
    }
  }
}
```

**Response (erro):** `400 Bad Request`
```json
{
  "status": "error",
  "message": "Import failed",
  "errors": [
    "Agent with name 'Support Agent' already exists",
    "Invalid automation structure"
  ]
}
```

---

## 12. TOR - Tool Onboarding Registry

### `POST /api/tor/import`
Importa tool via arquivo ZIP.

**⚠️ Esta rota usa `multipart/form-data` para upload de arquivo**

**Request:**
```
POST /api/tor/import
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="my-tool.zip"
Content-Type: application/zip

[binary data]
------WebKitFormBoundary
Content-Disposition: form-data; name="overwrite"

false
------WebKitFormBoundary--
```

**Form Fields:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| file | File | ✅ | Arquivo ZIP da tool (max 50MB) |
| overwrite | boolean | ❌ | Sobrescrever versão existente (default: false) |

**Estrutura do ZIP:**
```
my-tool.zip
├── manifest.json
├── package.json
├── src/
│   └── index.ts
└── README.md (opcional)
```

**manifest.json:**
```json
{
  "name": "my-custom-tool",
  "version": "1.0.0",
  "entry": "src/index.ts",
  "type": "tool",
  "description": "My custom tool",
  "capabilities": ["action", "webhook"],
  "inputSchema": {
    "type": "object",
    "properties": {
      "input": { "type": "string" }
    }
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    },
    "required": ["result"]
  },
  "compatibility": {
    "coreMin": "1.0.0",
    "coreMax": "2.0.0"
  }
}
```

**Response (sucesso):** `201 Created`
```json
{
  "id": "tor-tool-123",
  "name": "my-custom-tool",
  "version": "1.0.0",
  "status": "staged",
  "warnings": [
    "No tests found in package"
  ]
}
```

**Response (conflito):** `409 Conflict`
```json
{
  "errorCode": "CONFLICT",
  "message": "Tool my-custom-tool version 1.0.0 already exists"
}
```

**Response (erro de validação):** `400 Bad Request`
```json
{
  "errorCode": "IMPORT_FAILED",
  "message": "Tool import failed",
  "errors": [
    "Invalid manifest.json format",
    "Missing outputSchema (required)"
  ],
  "warnings": []
}
```

---

### `GET /api/tor`
Lista todas as tools TOR.

**Request:**
```
GET /api/tor
```

**Response:** `200 OK`
```json
{
  "tools": [
    {
      "id": "tor-tool-123",
      "name": "my-custom-tool",
      "version": "1.0.0",
      "status": "active",
      "description": "My custom tool",
      "capabilities": ["action", "webhook"],
      "createdAt": "2025-10-26T10:00:00.000Z"
    },
    {
      "id": "tor-tool-456",
      "name": "another-tool",
      "version": "2.1.0",
      "status": "staged",
      "description": "Another tool",
      "capabilities": ["action"],
      "createdAt": "2025-10-26T11:00:00.000Z"
    }
  ],
  "total": 2
}
```

**Tool Status:**
- `"staged"`: Importada, validada, aguardando ativação
- `"active"`: Ativa e pronta para execução
- `"inactive"`: Desativada
- `"error"`: Erro na ativação

---

### `GET /api/tor/:id`
Busca detalhes de uma tool TOR.

**Request:**
```
GET /api/tor/tor-tool-123
```

**Response:** `200 OK`
```json
{
  "id": "tor-tool-123",
  "name": "my-custom-tool",
  "version": "1.0.0",
  "manifest": {
    "name": "my-custom-tool",
    "version": "1.0.0",
    "entry": "src/index.ts",
    "type": "tool",
    "description": "My custom tool",
    "capabilities": ["action", "webhook"],
    "inputSchema": {
      "type": "object",
      "properties": {
        "input": { "type": "string" }
      }
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "result": { "type": "string" }
      }
    },
    "compatibility": {
      "coreMin": "1.0.0",
      "coreMax": "2.0.0"
    }
  },
  "status": "active",
  "sandboxPath": "/tmp/sandboxes/tor-tool-123",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "createdBy": "user-123"
}
```

**Response (não encontrada):** `404 Not Found`
```json
{
  "errorCode": "NOT_FOUND",
  "message": "Tool not found"
}
```

---

### `GET /api/tor/versions/:name`
Lista todas as versões de uma tool.

**Request:**
```
GET /api/tor/versions/my-custom-tool
```

**Response:** `200 OK`
```json
{
  "name": "my-custom-tool",
  "versions": [
    {
      "id": "tor-tool-123",
      "version": "1.0.0",
      "status": "active",
      "createdAt": "2025-10-26T10:00:00.000Z"
    },
    {
      "id": "tor-tool-456",
      "version": "1.1.0",
      "status": "staged",
      "createdAt": "2025-10-26T11:00:00.000Z"
    },
    {
      "id": "tor-tool-789",
      "version": "2.0.0",
      "status": "active",
      "createdAt": "2025-10-26T12:00:00.000Z"
    }
  ],
  "total": 3
}
```

---

### `DELETE /api/tor/:id`
Deleta tool TOR.

**Request:**
```
DELETE /api/tor/tor-tool-123
```

**Response:** `204 No Content`

**Response (não encontrada):** `404 Not Found`
```json
{
  "errorCode": "NOT_FOUND",
  "message": "Tool not found"
}
```

---

## 13. Chat (Feature 10)

### `POST /api/chats`
Cria novo chat.

**Request:**
```
POST /api/chats
Content-Type: application/json

{
  "automationId": "auto-123"
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| automationId | string | ✅ | ID da automação para contexto |

**Response:** `201 Created`
```json
{
  "id": "chat-123",
  "automationId": "auto-123",
  "status": "active",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:00:00.000Z",
  "messagesCount": 0,
  "messages": [],
  "context": {
    "automation": {
      "id": "auto-123",
      "name": "Customer Onboarding",
      "description": "Automated customer onboarding flow"
    },
    "availableTools": [
      {
        "id": "tool-456",
        "name": "send_email",
        "description": "Send email action"
      }
    ],
    "executionLogs": []
  }
}
```

---

### `GET /api/chats`
Lista todos os chats (com filtro opcional).

**Request:**
```
GET /api/chats?automationId=auto-123
```

**Query Parameters (todos opcionais):**
| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| automationId | string | Filtrar por automação |

**Response:** `200 OK`
```json
[
  {
    "id": "chat-123",
    "automationId": "auto-123",
    "status": "active",
    "createdAt": "2025-10-26T10:00:00.000Z",
    "updatedAt": "2025-10-26T10:05:00.000Z",
    "messagesCount": 5,
    "lastMessage": {
      "id": "msg-789",
      "chatId": "chat-123",
      "role": "assistant",
      "content": "How can I help you?",
      "timestamp": "2025-10-26T10:05:00.000Z",
      "metadata": {}
    },
    "context": { ... }
  }
]
```

---

### `GET /api/chats/:id`
Busca chat por ID.

**Request:**
```
GET /api/chats/chat-123
```

**Response:** `200 OK`
```json
{
  "id": "chat-123",
  "automationId": "auto-123",
  "status": "active",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T10:05:00.000Z",
  "messagesCount": 2,
  "lastMessage": {
    "id": "msg-456",
    "chatId": "chat-123",
    "role": "assistant",
    "content": "Hello! How can I help?",
    "timestamp": "2025-10-26T10:05:00.000Z"
  },
  "messages": [
    {
      "id": "msg-123",
      "chatId": "chat-123",
      "role": "user",
      "content": "Hello",
      "timestamp": "2025-10-26T10:00:00.000Z",
      "metadata": {}
    },
    {
      "id": "msg-456",
      "chatId": "chat-123",
      "role": "assistant",
      "content": "Hello! How can I help?",
      "timestamp": "2025-10-26T10:05:00.000Z",
      "metadata": {
        "toolCalls": []
      }
    }
  ],
  "context": {
    "automation": { ... },
    "availableTools": [ ... ],
    "executionLogs": [ ... ]
  }
}
```

**Response (não encontrado):** `404 Not Found`
```json
{
  "error": "Chat not found"
}
```

---

### `POST /api/chats/:id/messages`
Envia mensagem no chat.

**Request:**
```
POST /api/chats/chat-123/messages
Content-Type: application/json

{
  "content": "What tools are available?"
}
```

**Body Parameters:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| content | string | ✅ | Conteúdo da mensagem |

**Response:** `200 OK`
```json
{
  "id": "msg-789",
  "chatId": "chat-123",
  "role": "assistant",
  "content": "I can help you with the following tools: send_email, create_ticket, search_knowledge_base...",
  "timestamp": "2025-10-26T10:10:00.000Z",
  "metadata": {
    "toolCalls": []
  }
}
```

---

### `GET /api/chats/:id/messages`
Busca mensagens de um chat.

**Request:**
```
GET /api/chats/chat-123/messages
```

**Response:** `200 OK`
```json
[
  {
    "id": "msg-123",
    "chatId": "chat-123",
    "role": "user",
    "content": "Hello",
    "timestamp": "2025-10-26T10:00:00.000Z",
    "metadata": {}
  },
  {
    "id": "msg-456",
    "chatId": "chat-123",
    "role": "assistant",
    "content": "Hello! How can I help?",
    "timestamp": "2025-10-26T10:05:00.000Z",
    "metadata": {}
  }
]
```

---

### `GET /api/chats/:id/stream` 🔴 **STREAM (SSE)**
Envia mensagem e recebe resposta em streaming.

**⚠️ Esta rota suporta Server-Sent Events (SSE)**

**Request:**
```
GET /api/chats/chat-123/stream?message=Tell me about the automation
```

**Query Parameters:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-----------|-----------|
| message | string | ✅ | Mensagem do usuário |

**Headers:**
```
Accept: text/event-stream
```

**Response:** `200 OK` (stream contínuo)
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"content":"This"}

data: {"content":" automation"}

data: {"content":" is"}

data: {"content":" designed"}

data: {"content":" for"}

data: {"content":" customer"}

data: {"content":" onboarding..."}

data: {"done":true}
```

**Event Objects:**

**Content chunk:**
```json
{
  "content": "text chunk"
}
```

**Completion:**
```json
{
  "done": true
}
```

**Error:**
```json
{
  "error": "Error message"
}
```

---

### `PATCH /api/chats/:id/archive`
Arquiva chat.

**Request:**
```
PATCH /api/chats/chat-123/archive
```

**Response:** `200 OK`
```json
{
  "id": "chat-123",
  "automationId": "auto-123",
  "status": "archived",
  "createdAt": "2025-10-26T10:00:00.000Z",
  "updatedAt": "2025-10-26T11:00:00.000Z",
  "messagesCount": 10,
  "lastMessage": { ... },
  "context": { ... }
}
```

---

### `DELETE /api/chats/:id`
Deleta chat.

**Request:**
```
DELETE /api/chats/chat-123
```

**Response:** `204 No Content`

---

## 📊 Resumo de Endpoints

### Contagem por Módulo

| Módulo | Total de Endpoints | GET | POST | PATCH | DELETE |
|--------|-------------------|-----|------|-------|--------|
| Health Check | 1 | 1 | 0 | 0 | 0 |
| System Config | 3 | 1 | 1 | 1 | 0 |
| Models | 1 | 1 | 0 | 0 | 0 |
| Agents | 5 | 2 | 1 | 1 | 1 |
| MCPs | 4 | 2 | 1 | 0 | 1 |
| System Tools | 5 | 2 | 2 | 0 | 1 |
| WebHooks | 2 | 1 | 1 | 0 | 0 |
| Condition Tools | 6 | 2 | 2 | 1 | 1 |
| Automations | 6 | 2 | 2 | 1 | 1 |
| Execution | 4 | 3 | 1 | 0 | 0 |
| Import/Export | 4 | 2 | 2 | 0 | 0 |
| TOR | 5 | 3 | 1 | 0 | 1 |
| Chat | 8 | 4 | 2 | 1 | 1 |
| **TOTAL** | **54** | **26** | **16** | **5** | **7** |

---

## 🔴 Endpoints com Streaming (SSE)

**Total de endpoints com streaming: 2**

1. **`GET /api/execution/:automationId/events`**
   - Stream de eventos de execução de automação em tempo real
   - Formato: Server-Sent Events (SSE)
   - Content-Type: `text/event-stream`

2. **`GET /api/chats/:id/stream`**
   - Stream de resposta do chat com LLM
   - Formato: Server-Sent Events (SSE)
   - Content-Type: `text/event-stream`

---

## 🔐 Autenticação

Atualmente, a API **não possui autenticação** implementada. Todas as rotas são públicas.

**WebHooks** possuem autenticação via Bearer Token:
```
Authorization: Bearer <token-configurado-na-tool>
```

---

## 🚨 Códigos de Status HTTP

| Código | Significado | Quando é usado |
|--------|-------------|----------------|
| 200 | OK | Requisição bem-sucedida (GET, PATCH) |
| 201 | Created | Recurso criado com sucesso (POST) |
| 202 | Accepted | Requisição aceita para processamento assíncrono |
| 204 | No Content | Recurso deletado com sucesso (DELETE) |
| 400 | Bad Request | Payload inválido ou falta de parâmetros obrigatórios |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Conflito (recurso já existe) |
| 500 | Internal Server Error | Erro no servidor |

---

## 📝 Tipos e Enums

### NodeType
```typescript
enum NodeType {
  TRIGGER = 'trigger',
  AGENT = 'agent',
  TOOL = 'tool',
  CONDITION = 'condition'
}
```

### ToolType
```typescript
enum ToolType {
  TRIGGER = 'trigger',
  ACTION = 'action'
}
```

### AutomationStatus
```typescript
enum AutomationStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  ERROR = 'error'
}
```

### ExecutionStatus
```typescript
enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### NodeEventStatus
```typescript
enum NodeEventStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### ToolStatus (TOR)
```typescript
enum ToolStatus {
  STAGED = 'staged',      // Importada, validada, aguardando ativação
  ACTIVE = 'active',      // Ativa e pronta para execução
  INACTIVE = 'inactive',  // Desativada
  ERROR = 'error'         // Erro na ativação
}
```

### ChatStatus
```typescript
enum ChatStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived'
}
```

### MessageRole
```typescript
enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}
```

### MCPSourceType
```typescript
enum MCPSourceType {
  NPX = 'npx',
  URL = 'url'
}
```

---

## 🎯 Casos de Uso Comuns

### 1. Criar e Executar Automação Simples

```typescript
// 1. Criar agente
POST /api/agents
{
  "name": "Email Agent",
  "prompt": "You send emails",
  "defaultModel": "gpt-4"
}
// Resposta: { "id": "agent-1", ... }

// 2. Criar tool de email
POST /api/tools
{
  "name": "send_email",
  "type": "action",
  "inputSchema": { ... }
}
// Resposta: { "id": "tool-1", ... }

// 3. Criar automação
POST /api/automations
{
  "name": "Email Flow",
  "nodes": [
    { "id": "n1", "type": "trigger", "referenceId": "trigger-manual" },
    { "id": "n2", "type": "agent", "referenceId": "agent-1" }
  ],
  "links": [
    { "fromNodeId": "n1", "fromOutputKey": "output", 
      "toNodeId": "n2", "toInputKey": "input" }
  ]
}
// Resposta: { "id": "auto-1", ... }

// 4. Executar
POST /api/automations/auto-1/execute
{ "message": "Send welcome email" }
```

### 2. Chat com Contexto de Automação

```typescript
// 1. Criar chat
POST /api/chats
{ "automationId": "auto-123" }
// Resposta: { "id": "chat-1", ... }

// 2. Enviar mensagem
POST /api/chats/chat-1/messages
{ "content": "What can this automation do?" }

// 3. Stream de resposta
GET /api/chats/chat-1/stream?message=Explain the flow
// Resposta: SSE stream
```

### 3. Importar MCP e Usar Tools

```typescript
// 1. Importar MCP
POST /api/mcps/import
{
  "name": "github",
  "source": "@modelcontextprotocol/server-github",
  "env": { "GITHUB_TOKEN": "xxx" }
}
// Resposta: { "mcp": {...}, "toolsExtracted": 5 }

// 2. Listar tools do MCP
GET /api/mcps/{mcpId}/tools

// 3. Usar tool em automação
// Adicionar tool ao agente ou usar como nó na automação
```

### 4. Executar com Streaming

```typescript
// 1. Iniciar execução
POST /api/execution/auto-123/start
{ "input": "data" }

// 2. Conectar ao stream de eventos
GET /api/execution/auto-123/events
// SSE stream com eventos em tempo real

// 3. (Opcional) Verificar logs finais
GET /api/execution/auto-123/logs
```

---

## 🔧 Configuração do Cliente HTTP

### Exemplo com Axios (TypeScript)

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Para SSE (Server-Sent Events)
const connectSSE = (url: string, onMessage: (data: any) => void) => {
  const eventSource = new EventSource(`http://localhost:3333${url}`);
  
  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage(data);
  };
  
  eventSource.onerror = (error) => {
    console.error('SSE Error:', error);
    eventSource.close();
  };
  
  return eventSource;
};

// Exemplo de uso
const stream = connectSSE('/api/execution/auto-123/events', (event) => {
  console.log('Event:', event);
});

// Fechar quando não precisar mais
// stream.close();
```

---

## 📚 Notas Importantes

### 1. Validação de Dados
- Todos os endpoints validam os dados de entrada
- Erros de validação retornam `400 Bad Request` com detalhes do erro

### 2. IDs
- Todos os IDs são gerados automaticamente pelo backend
- IDs são strings únicas (UUID ou random)

### 3. Timestamps
- Todos os timestamps são em formato ISO 8601: `2025-10-26T10:00:00.000Z`

### 4. Schemas
- `inputSchema` e `outputSchema` seguem JSON Schema (draft-07)
- São usados para validação e documentação

### 5. Predicates (Conditions)
- Expressões JavaScript válidas
- Contexto disponível: `input` (objeto passado na avaliação)
- Exemplo: `input.status === 'approved' && input.amount > 100`

### 6. Streaming
- Use `EventSource` no browser para SSE
- Content-Type sempre será `text/event-stream`
- Eventos são enviados no formato `data: {json}\n\n`

### 7. File Upload (TOR)
- Usa `multipart/form-data`
- Limite de 50MB por arquivo
- Apenas arquivos ZIP são aceitos

### 8. Dependencies (Import/Export)
- Exportação inclui todas as dependências (agents, tools, mcps)
- Importação pode mapear IDs antigos para novos
- Hash é gerado para verificação de integridade

---

## 🎨 Frontend Guidelines

### Estrutura Recomendada

```
src/
├── api/
│   ├── client.ts          # Axios client configurado
│   ├── agents.ts          # Endpoints de agents
│   ├── automations.ts     # Endpoints de automations
│   ├── chat.ts            # Endpoints de chat
│   ├── execution.ts       # Endpoints de execution (+ SSE)
│   ├── tools.ts           # Endpoints de tools
│   ├── mcps.ts            # Endpoints de MCPs
│   └── types.ts           # TypeScript types
├── hooks/
│   ├── useAgents.ts
│   ├── useAutomations.ts
│   ├── useChat.ts
│   └── useExecution.ts
└── components/
    ├── FlowCanvas.tsx     # React Flow canvas
    ├── NodeEditor.tsx
    └── ChatInterface.tsx
```

### TypeScript Types

Crie interfaces baseadas nos responses da API:

```typescript
// src/api/types.ts
export interface Agent {
  id: string;
  name: string;
  description?: string;
  prompt: string;
  defaultModel?: string;
  tools: Tool[];
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  status: AutomationStatus;
  nodes: Node[];
  links: Link[];
}

// ... etc
```

---

**Fim da Documentação**

---

**Changelog:**
- v1.0.0 (2025-10-26): Documentação inicial completa
- Todas as 54 rotas documentadas
- 2 rotas com streaming identificadas
- Exemplos de uso incluídos
- Guidelines para frontend incluídas
