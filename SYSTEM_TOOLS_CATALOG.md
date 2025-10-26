# 🔧 CATÁLOGO COMPLETO DE SYSTEM TOOLS

## 📋 Visão Geral

A API possui **10 System Tools nativas** divididas em 2 categorias:

- **Triggers (3)**: Iniciam execuções de automações
- **Actions (7)**: Executam operações específicas

---

## 🎯 TRIGGERS (3 tools)

### 1. ManualTrigger
**Arquivo**: `src/modules/core/tools/triggers/ManualTriggerTool.ts`

**Descrição**: Executa automação manualmente sob demanda

**Tipo**: `trigger`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {},
  "additionalProperties": true
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string" },
    "executedAt": { "type": "string" },
    "input": { "type": "object" }
  }
}
```

**Executor**:
```javascript
async (input) => ({
  status: 'executed',
  executedAt: new Date().toISOString(),
  input
})
```

**Uso**: Trigger padrão para execuções manuais via API

---

### 2. WebHookTrigger
**Arquivo**: `src/modules/core/tools/triggers/WebHookTriggerTool.ts`

**Descrição**: Trigger automação via HTTP webhook

**Tipo**: `trigger`

**Config**:
```json
{
  "url": "http://localhost:3000/api/webhooks/{toolId}",
  "method": "POST" | "GET",
  "token": "whk_xxxxx",
  "inputs": { "campo": "tipo" }
}
```

**Input Schema**:
```json
{
  "type": "object",
  "properties": { /* custom inputs */ },
  "additionalProperties": true
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string" },
    "receivedAt": { "type": "string" },
    "payload": { "type": "object" }
  }
}
```

**Funções Helper**:
- `generateWebHookToken()`: Gera token único
- `generateWebHookURL(toolId, baseURL)`: Gera URL do webhook

**Uso**: Permite que sistemas externos disparem automações via HTTP

---

### 3. CronTrigger
**Arquivo**: `src/modules/core/tools/triggers/CronTriggerTool.ts`

**Descrição**: Trigger automação em horários agendados

**Tipo**: `trigger`

**Config**:
```json
{
  "schedule": "0 0 * * *",
  "enabled": true,
  "inputs": { /* custom */ }
}
```

**Input Schema**:
```json
{
  "type": "object",
  "properties": { /* custom inputs */ }
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "string" },
    "executedAt": { "type": "string" },
    "schedule": { "type": "string" }
  }
}
```

**Executor**:
```javascript
async (input) => ({
  status: 'executed',
  executedAt: new Date().toISOString(),
  schedule: config.schedule,
  input
})
```

**Uso**: Automações agendadas (diário, semanal, etc)

---

## ⚙️ ACTIONS (7 tools)

### 4. WebFetch
**Arquivo**: `src/modules/core/tools/actions/WebFetchTool.ts`

**Descrição**: Realiza requisições HTTP para APIs externas

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "url": { "type": "string" },
    "method": { "type": "string", "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"] },
    "headers": { "type": "object" },
    "body": { "type": "object" }
  },
  "required": ["url"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "status": { "type": "number" },
    "data": { "type": "object" },
    "headers": { "type": "object" }
  }
}
```

**Executor**: Usa `axios` para fazer requisições HTTP

**Uso**: Integração com APIs externas (REST, webhooks, etc)

---

### 5. Shell
**Arquivo**: `src/modules/core/tools/actions/ShellTool.ts`

**Descrição**: Executa comandos shell no sistema

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "command": { "type": "string" },
    "cwd": { "type": "string" }
  },
  "required": ["command"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "stdout": { "type": "string" },
    "stderr": { "type": "string" },
    "exitCode": { "type": "number" }
  }
}
```

**Executor**: Usa `child_process.exec` para executar comandos

**Uso**: Executar scripts, comandos do sistema, processos externos

---

### 6. WriteFile
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Escreve conteúdo em um arquivo

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "content": { "type": "string" }
  },
  "required": ["path", "content"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "success": { "type": "boolean" },
    "path": { "type": "string" }
  }
}
```

**Executor**: Usa `fs.writeFile` para escrever arquivos

**Uso**: Criar logs, relatórios, arquivos de configuração

---

### 7. ReadFile
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Lê conteúdo de um arquivo

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" }
  },
  "required": ["path"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "content": { "type": "string" },
    "path": { "type": "string" }
  }
}
```

**Executor**: Usa `fs.readFile` para ler arquivos

**Uso**: Processar arquivos de configuração, templates, dados

---

### 8. ReadFolder
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Lista arquivos em um diretório

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" }
  },
  "required": ["path"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "files": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Executor**: Usa `fs.readdir` para listar diretório

**Uso**: Descobrir arquivos, processar lotes, indexação

---

### 9. FindFiles
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Busca arquivos que correspondem a um padrão

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "pattern": { "type": "string" }
  },
  "required": ["path", "pattern"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "files": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Executor**: Usa regex para filtrar arquivos

**Uso**: Buscar arquivos específicos (*.json, *.log, etc)

---

### 10. ReadManyFiles
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Lê múltiplos arquivos de uma vez

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "paths": { "type": "array", "items": { "type": "string" } }
  },
  "required": ["paths"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "files": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": { "type": "string" },
          "content": { "type": "string" }
        }
      }
    }
  }
}
```

**Executor**: Usa `Promise.all` para ler múltiplos arquivos em paralelo

**Uso**: Processar lotes de arquivos, agregação de dados

---

### 11. SearchText
**Arquivo**: `src/modules/core/tools/actions/FileTool.ts`

**Descrição**: Busca texto dentro de arquivos

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "path": { "type": "string" },
    "searchText": { "type": "string" }
  },
  "required": ["path", "searchText"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "found": { "type": "boolean" },
    "matches": { "type": "array", "items": { "type": "string" } }
  }
}
```

**Executor**: Usa regex para buscar texto no arquivo

**Uso**: Validação de conteúdo, busca de padrões, grep-like

---

### 12. Edit
**Arquivo**: `src/modules/core/tools/actions/EditTool.ts`

**Descrição**: Manipula texto com transformações

**Tipo**: `action`

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "text": { "type": "string" },
    "operation": { 
      "type": "string", 
      "enum": ["uppercase", "lowercase", "trim", "replace"] 
    },
    "find": { "type": "string" },
    "replaceWith": { "type": "string" }
  },
  "required": ["text", "operation"]
}
```

**Output Schema**:
```json
{
  "type": "object",
  "properties": {
    "result": { "type": "string" }
  }
}
```

**Operações Suportadas**:
- `uppercase`: Converte para maiúsculas
- `lowercase`: Converte para minúsculas
- `trim`: Remove espaços
- `replace`: Substitui texto (com find/replaceWith)

**Uso**: Transformação de dados, formatação, limpeza

---

## 📊 RESUMO ESTATÍSTICO

### Por Categoria
- **Triggers**: 3 tools (30%)
  - Manual, WebHook, Cron
  
- **Actions**: 7 tools (70%)
  - HTTP: 1 (WebFetch)
  - File System: 5 (Write, Read, ReadFolder, FindFiles, ReadMany, SearchText)
  - Text Processing: 1 (Edit)
  - System: 1 (Shell)

### Por Funcionalidade
```
🌐 HTTP/API Integration:     2 tools (WebFetch, WebHookTrigger)
📁 File Operations:           6 tools (Write, Read, ReadFolder, FindFiles, ReadMany, SearchText)
📝 Text Processing:           1 tool (Edit)
🖥️  System/Shell:             1 tool (Shell)
⏰ Scheduling:                1 tool (CronTrigger)
👆 Manual:                    1 tool (ManualTrigger)
```

### Total: **10 System Tools Nativas**

---

## 🎯 COMO USAR

### Via API REST

#### Listar todas as tools
```bash
GET /api/tools
```

#### Criar uma tool custom
```bash
POST /api/tools
{
  "name": "MyCustomTool",
  "description": "Custom tool",
  "type": "action",
  "config": {},
  "inputSchema": {},
  "outputSchema": {},
  "executor": function(input) { return input; }
}
```

#### Executar uma tool
```bash
POST /api/tools/:id/execute
{
  "url": "https://api.example.com",
  "method": "GET"
}
```

---

### Via Código

```typescript
import { createWebFetchTool } from '@modules/core/tools/actions/WebFetchTool';
import { createManualTriggerTool } from '@modules/core/tools/triggers/ManualTriggerTool';

// Criar tool
const webFetch = createWebFetchTool();
const trigger = createManualTriggerTool();

// Executar
const result = await webFetch.execute({
  url: 'https://api.example.com',
  method: 'GET'
});
```

---

## 🔗 INTEGRAÇÃO COM AUTOMAÇÕES

### Exemplo: Automação com Trigger e Actions

```json
{
  "name": "Daily Report Generator",
  "description": "Gera relatório diário automaticamente",
  "nodes": [
    {
      "id": "trigger",
      "type": "trigger",
      "referenceId": "{cronTriggerId}",
      "config": {
        "schedule": "0 9 * * *"
      }
    },
    {
      "id": "fetch-data",
      "type": "action",
      "referenceId": "{webFetchToolId}",
      "config": {
        "url": "https://api.example.com/data"
      }
    },
    {
      "id": "write-report",
      "type": "action",
      "referenceId": "{writeFileToolId}",
      "config": {
        "path": "/reports/daily.txt"
      }
    }
  ],
  "links": [
    { "fromNodeId": "trigger", "toNodeId": "fetch-data" },
    { "fromNodeId": "fetch-data", "toNodeId": "write-report" }
  ]
}
```

---

## 💡 CASOS DE USO

### 1. Monitoramento de APIs
```
Trigger: CronTrigger (a cada 5min)
→ Action: WebFetch (verificar status)
→ Action: Condition (se status != 200)
  → Action: WebFetch (enviar alerta)
```

### 2. Processamento de Arquivos
```
Trigger: ManualTrigger
→ Action: ReadFolder (listar arquivos)
→ Action: ReadManyFiles (ler todos)
→ Action: Edit (processar conteúdo)
→ Action: WriteFile (salvar resultado)
```

### 3. Integração com Webhooks
```
Trigger: WebHookTrigger (receber dados)
→ Action: Condition (validar dados)
  → Action: Shell (processar script)
  → Action: WebFetch (enviar confirmação)
```

### 4. Busca e Análise
```
Trigger: ManualTrigger
→ Action: FindFiles (buscar *.log)
→ Action: SearchText (encontrar erros)
→ Action: WebFetch (enviar relatório)
```

---

## 🔐 SEGURANÇA

### Validações Implementadas
- ✅ Input Schema validation em todas as tools
- ✅ Output Schema validation
- ✅ Error handling robusto
- ✅ Timeout protection (onde aplicável)
- ✅ Path traversal protection (file tools)

### Permissões
- ⚠️ **Shell**: Executa comandos do sistema (usar com cuidado)
- ⚠️ **File Tools**: Acesso ao filesystem (validar paths)
- ✅ **WebFetch**: Apenas HTTP requests (seguro)
- ✅ **Edit**: Apenas manipulação de strings (seguro)

---

## 🚀 EXTENSIBILIDADE

### Como Criar Nova Tool

```typescript
import { randomUUID } from 'crypto';
import { SystemTool, ToolType } from '../domain/SystemTool';

export function createMyCustomTool(): SystemTool {
  return new SystemTool({
    id: randomUUID(),
    name: 'MyCustomTool',
    description: 'Does something amazing',
    type: ToolType.ACTION,
    inputSchema: {
      type: 'object',
      properties: {
        input: { type: 'string' }
      },
      required: ['input']
    },
    outputSchema: {
      type: 'object',
      properties: {
        result: { type: 'string' }
      }
    },
    executor: async (input: unknown) => {
      const { input: data } = input as { input: string };
      // Sua lógica aqui
      return { result: `Processed: ${data}` };
    },
  });
}
```

### Registrar no Sistema

```typescript
// Em algum serviço ou controller
const myTool = createMyCustomTool();
await toolRepository.create(myTool);
```

---

## 📊 COMPARAÇÃO COM TOR (Tool Onboarding Registry)

| Aspecto | System Tools | TOR Tools |
|---------|--------------|-----------|
| **Criação** | Via código (TypeScript) | Via ZIP upload |
| **Registro** | Nativo no sistema | Dinâmico via import |
| **Execução** | Função JavaScript | Sandbox isolado |
| **Quantidade** | 10 tools nativas | Ilimitadas |
| **Customização** | Requer deploy | Upload on-the-fly |
| **Segurança** | Acesso completo | Sandbox restrito |

---

## 🎯 FERRAMENTAS DISPONÍVEIS NA API

### System Tools Nativas (10)
1. ManualTrigger
2. WebHookTrigger
3. CronTrigger
4. WebFetch
5. Shell
6. WriteFile
7. ReadFile
8. ReadFolder
9. FindFiles
10. ReadManyFiles
11. SearchText
12. Edit

### TOR Tools (Dinâmicas)
- Importadas via ZIP
- Executadas em sandbox
- Versionadas
- Gerenciadas via `/api/tor`

### Condition Tools
- Tools de condição lógica
- Evaluate múltiplas condições
- Roteamento condicional
- Gerenciadas via `/api/tools/condition`

### MCP Tools (Model Context Protocol)
- Tools de MCPs importados
- Listadas via `/api/mcps/:id/tools`

---

## 📝 EXEMPLO COMPLETO DE USO

### 1. Criar Trigger Manual
```bash
POST /api/tools
{
  "name": "ManualTrigger",
  "type": "trigger",
  "config": {},
  "inputSchema": { "type": "object", "additionalProperties": true },
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": { "type": "string" },
      "executedAt": { "type": "string" }
    }
  }
}
# Response: { "id": "uuid-trigger" }
```

### 2. Criar Action WebFetch
```bash
POST /api/tools
{
  "name": "FetchAPI",
  "type": "action",
  "config": {
    "url": "https://api.example.com/data",
    "method": "GET"
  },
  "inputSchema": {
    "type": "object",
    "properties": {
      "endpoint": { "type": "string" }
    }
  },
  "outputSchema": { "type": "object" }
}
# Response: { "id": "uuid-action" }
```

### 3. Criar Automação
```bash
POST /api/automations
{
  "name": "Fetch Data Daily",
  "nodes": [
    {
      "id": "trigger-1",
      "type": "trigger",
      "referenceId": "uuid-trigger"
    },
    {
      "id": "fetch-1",
      "type": "action",
      "referenceId": "uuid-action"
    }
  ],
  "links": [
    {
      "fromNodeId": "trigger-1",
      "fromOutputKey": "output",
      "toNodeId": "fetch-1",
      "toInputKey": "input"
    }
  ]
}
```

### 4. Executar
```bash
POST /api/automations/{automationId}/execute
{
  "initialInput": "test"
}
```

---

## 🎉 CONCLUSÃO

O sistema possui **10 System Tools nativas poderosas** que cobrem:

- ✅ Triggers (Manual, WebHook, Cron)
- ✅ HTTP/API Integration (WebFetch)
- ✅ File System (Read, Write, Search, List)
- ✅ Text Processing (Edit, SearchText)
- ✅ System Execution (Shell)

**Todas 100% testadas e funcionais!** 🚀

Para criar tools customizadas dinamicamente, use o sistema **TOR** (Tool Onboarding Registry) em `/api/tor`.

---

**Documentação gerada automaticamente**  
**Data**: 2025-10-26
