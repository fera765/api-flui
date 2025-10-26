# 📋 MAPA COMPLETO DE ROTAS DA API - RESULTADO DOS TESTES

## Legenda
- ✅ **Testado e Funcionando**
- ❌ **Testado e Com Problema**
- ⚪ **Não Testado**
- ⭐ **Suporta Streaming**

---

## 1. CORE & CONFIGURATION

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/` | ✅ 200 | Nenhum | `{status, timestamp}` | 12ms | ❌ |
| GET | `/api/models` | ✅ 200 | Nenhum | `{models: []}` | 373ms | ❌ |
| POST | `/api/setting` | ✅ 201 | `{endpoint, apiKey, model}` | Config criada | 32ms | ❌ |
| GET | `/api/setting` | ✅ 200 | Nenhum | Config atual | 3ms | ❌ |
| PATCH | `/api/setting` | ✅ 200 | Config parcial | Config atualizada | 7ms | ❌ |

**Observações**:
- `/api/models` está lento (373ms) - considerar cache

---

## 2. AGENTS

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/agents` | ✅ 200 | Nenhum | Array de agents | 4ms | ❌ |
| GET | `/api/agents/:id` | ✅ 200 | ID no path | Agent completo | 9ms | ❌ |
| POST | `/api/agents` | ✅ 201 | `{name, description, prompt, defaultModel}` | Agent criado | 10ms | ❌ |
| PATCH | `/api/agents/:id` | ✅ 200 | Campos parciais | Agent atualizado | 6ms | ❌ |
| DELETE | `/api/agents/:id` | ✅ 204 | ID no path | No content | 5ms | ❌ |

**Observações**:
- CRUD 100% funcional
- Performance excelente (< 10ms)

---

## 3. MCPs (Model Context Protocol)

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/mcps` | ✅ 200 | Nenhum | Array de MCPs | 5ms | ❌ |
| POST | `/api/mcps/import` | ✅ 201 | `{name, source, description, env}` | MCP criado | 9ms | ❌ |
| GET | `/api/mcps/:id/tools` | ⚪ N/T | ID no path | Array de tools | - | ❌ |
| DELETE | `/api/mcps/:id` | ⚪ N/T | ID no path | No content | - | ❌ |

**Observações**:
- Funcionalidades básicas OK
- Testes completos dependem de MCP real instalado

---

## 4. SYSTEM TOOLS (Legacy)

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/tools` | ✅ 200 | Nenhum | Array de tools | 9ms | ❌ |
| GET | `/api/tools/:id` | ❌ 404 | ID no path | Error | 54ms | ❌ |
| POST | `/api/tools` | ✅ 201 | `{name, description, type, config, inputSchema, outputSchema}` | Tool criada | 4ms | ❌ |
| DELETE | `/api/tools/:id` | ❌ 404 | ID no path | Error | 6ms | ❌ |
| POST | `/api/tools/:id/execute` | ✅ 200 | Input conforme schema | Resultado execução | 5ms | ❌ |

**🔴 PROBLEMA**: Conflito de rotas com TOR
- IDs criados no sistema legado não são encontrados
- Rotas TOR capturando requisições primeiro

---

## 5. WEBHOOKS

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/webhooks/:toolId` | ⚪ N/T | Query params + Auth header | Resultado | - | ❌ |
| POST | `/api/webhooks/:toolId` | ⚪ N/T | Body + Auth header | Resultado | - | ❌ |

**Observações**:
- Não testados (requer configuração de webhook)

---

## 6. CONDITION TOOLS

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/tools/condition` | ✅ 200 | Nenhum | Array de conditions | 6ms | ❌ |
| GET | `/api/tools/condition/:id` | ⚪ N/T | ID no path | Condition completa | - | ❌ |
| POST | `/api/tools/condition` | ❌ 400 | `{name, description, conditions[]}` | Error | 9ms | ❌ |
| PATCH | `/api/tools/condition/:id` | ⚪ N/T | Campos parciais | Condition atualizada | - | ❌ |
| DELETE | `/api/tools/condition/:id` | ⚪ N/T | ID no path | No content | - | ❌ |
| POST | `/api/tools/condition/:id/evaluate` | ⚪ N/T | `{input, evaluateAll}` | `{result, matchedConditions}` | - | ❌ |

**🔴 PROBLEMA**: Validação falhando
- Payload rejeitado com 400
- Schema esperado pode ser diferente

---

## 7. TOR (Tool Onboarding Registry)

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/tools` | ✅ 200 | Nenhum | `{tools[], total}` | - | ❌ |
| GET | `/api/tools/:id` | ⚪ N/T | ID no path | Tool completa | - | ❌ |
| POST | `/api/tools/import` | ⚪ N/T | Multipart ZIP + overwrite | `{id, name, version, status}` | - | ❌ |
| GET | `/api/tools/versions/:name` | ⚪ N/T | Nome no path | `{name, versions[], total}` | - | ❌ |
| DELETE | `/api/tools/:id` | ⚪ N/T | ID no path | No content | - | ❌ |

**Observações**:
- Conflito com System Tools na mesma rota base
- Upload ZIP não testado (requer arquivo real)

---

## 8. AUTOMATIONS

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/automations` | ✅ 200 | Nenhum | Array de automações | 4ms | ❌ |
| GET | `/api/automations/:id` | ✅ 200 | ID no path | Automação completa | 5ms | ❌ |
| POST | `/api/automations` | ✅ 201 | `{name, description, nodes[], links[]}` | Automação criada | 6ms | ❌ |
| PATCH | `/api/automations/:id` | ✅ 200 | Campos parciais | Automação atualizada | 3ms | ❌ |
| DELETE | `/api/automations/:id` | ✅ 204 | ID no path | No content | 3ms | ❌ |
| POST | `/api/automations/:id/execute` | ❌ 404 | Input dinâmico | Resultado execução | 11ms | ❌ |

**🔴 PROBLEMA**: Rota execute retorna 404
- Rota deveria existir mas não é encontrada
- Pode haver conflito com rotas de import/export

---

## 9. EXECUTION (Assíncrono + Streaming)

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| POST | `/api/execution/:automationId/start` | ✅ 202 | Input dinâmico | `{message, automationId}` | 7ms | ❌ |
| GET | `/api/execution/:automationId/status` | ✅ 200 | Nenhum | `{status, progress, currentNode}` | 6ms | ❌ |
| GET | `/api/execution/:automationId/logs` | ✅ 200 | Nenhum | Array de logs | 2ms | ❌ |
| GET | `/api/execution/:automationId/events` | ⭐ SSE | Nenhum | Server-Sent Events | - | ✅ |

**Observações**:
- Sistema de execução assíncrona 100% funcional
- SSE stream disponível (não testado - requer cliente específico)
- Performance excelente (< 10ms)

---

## 10. IMPORT / EXPORT

| Método | Endpoint | Status | Payload Entrada | Payload Saída | Tempo | Stream |
|--------|----------|--------|-----------------|---------------|-------|--------|
| GET | `/api/automations/export/:id` | ✅ 200 | Query: author, tags, description | JSON exportado (download) | 10ms | ❌ |
| GET | `/api/automations/export/all` | ✅ 200 | Nenhum | JSON com todas (download) | 6ms | ❌ |
| POST | `/api/automations/import/validate` | ✅ 200 | `{data}` | `{status, errors[], warnings[]}` | 8ms | ❌ |
| POST | `/api/automations/import` | ❌ 400 | `{data, options}` | Error | 12ms | ❌ |

**🔴 PROBLEMA**: Import falhando
- Validação passa mas import falha
- Inconsistência entre validação e importação

---

## 📊 RESUMO POR CATEGORIA

| Módulo | Total Rotas | Testadas | Sucesso | Falha | Não Testadas | Taxa Sucesso |
|--------|-------------|----------|---------|-------|--------------|--------------|
| **Core & Config** | 5 | 5 | 5 | 0 | 0 | 100% |
| **Agents** | 5 | 5 | 5 | 0 | 0 | 100% |
| **MCPs** | 4 | 2 | 2 | 0 | 2 | 100%* |
| **System Tools** | 5 | 4 | 2 | 2 | 1 | 50% |
| **Webhooks** | 2 | 0 | 0 | 0 | 2 | - |
| **Condition Tools** | 6 | 2 | 1 | 1 | 4 | 50% |
| **TOR** | 5 | 1 | 1 | 0 | 4 | 100%* |
| **Automations** | 6 | 6 | 5 | 1 | 0 | 83% |
| **Execution** | 4 | 3 | 3 | 0 | 1 | 100% |
| **Import/Export** | 4 | 4 | 3 | 1 | 0 | 75% |
| **TOTAL** | **46** | **32** | **27** | **5** | **14** | **84.38%** |

\* Baseado apenas nos testes realizados

---

## 🎯 DISTRIBUIÇÃO DE STATUS

```
✅ Funcionando Perfeitamente:  27 rotas (58.70%)
❌ Com Problemas Identificados: 5 rotas (10.87%)
⚪ Não Testadas:               14 rotas (30.43%)
⭐ Com Streaming:              1 rota  (2.17%)
```

---

## ⚡ TOP 10 ROTAS MAIS RÁPIDAS

1. GET `/api/execution/:automationId/logs` - **2ms** ⚡⚡⚡
2. GET `/api/setting` - **3ms** ⚡⚡⚡
3. PATCH `/api/automations/:id` - **3ms** ⚡⚡⚡
4. DELETE `/api/automations/:id` - **3ms** ⚡⚡⚡
5. POST `/api/tools` - **4ms** ⚡⚡⚡
6. GET `/api/agents` - **4ms** ⚡⚡⚡
7. GET `/api/automations` - **4ms** ⚡⚡⚡
8. GET `/api/mcps` - **5ms** ⚡⚡
9. POST `/api/tools/:id/execute` - **5ms** ⚡⚡
10. GET `/api/automations/:id` - **5ms** ⚡⚡

---

## 🐢 ROTAS QUE PRECISAM OTIMIZAÇÃO

1. GET `/api/models` - **373ms** 🐢🐢🐢
   - Considerar implementar cache
   - Possível consulta externa lenta

2. GET `/api/tools/:id` - **54ms** 🐢
   - Tempo alto por causa do erro 404
   - Pode ter timeout na busca

---

## 🔥 PRIORIDADES DE CORREÇÃO

### 🔴 CRÍTICO (Bloqueia funcionalidades)
1. Resolver conflito `/api/tools` (2 rotas afetadas)
2. Corrigir validação de ConditionTool
3. Debugar rota `/api/automations/:id/execute`

### 🟡 IMPORTANTE (Funcionalidade parcial)
4. Corrigir import de automações
5. Testar e validar webhooks

### 🟢 DESEJÁVEL (Cobertura completa)
6. Completar testes de TOR (upload ZIP)
7. Testar todas as rotas de condition tools
8. Testar SSE streaming
9. Otimizar GET `/api/models`

---

**Gerado por Auto Test Runner v1.0**  
*Última atualização: 2025-10-26 12:30:00*
