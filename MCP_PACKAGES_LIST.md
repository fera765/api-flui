# 📦 Lista de Pacotes MCP Testados

**Atualizado:** 2025-10-26

## ✅ Pacotes Funcionando

### 1. Filesystem MCP
**Nome do Pacote:** `@modelcontextprotocol/server-filesystem`

**Descrição:** Operações de sistema de arquivos (ler, escrever, listar)

**Env Variables:**
```json
{
  "ALLOWED_DIRECTORY": "/tmp"
}
```

**Tools Disponíveis:**
- `read_file` - Ler arquivo
- `write_file` - Escrever arquivo
- `list_directory` - Listar diretório
- `create_directory` - Criar diretório
- `move_file` - Mover arquivo
- `search_files` - Buscar arquivos

**Como Importar (Frontend):**
- Name: `Filesystem`
- Source: `@modelcontextprotocol/server-filesystem`
- Env: `ALLOWED_DIRECTORY=/tmp`

---

### 2. Memory MCP
**Nome do Pacote:** `@modelcontextprotocol/server-memory`

**Descrição:** Sistema de memória para armazenar entidades e relações

**Env Variables:** Nenhuma (opcional)

**Tools Disponíveis:**
- `create_entities` - Criar entidades
- `create_relations` - Criar relações
- `search_nodes` - Buscar nodes
- `open_nodes` - Abrir nodes
- `delete_entities` - Deletar entidades
- `delete_relations` - Deletar relações

**Como Importar (Frontend):**
- Name: `Memory`
- Source: `@modelcontextprotocol/server-memory`
- Env: (deixar vazio)

---

### 3. GitHub MCP
**Nome do Pacote:** `@modelcontextprotocol/server-github`

**Descrição:** Operações com repositórios GitHub

**Env Variables:**
```json
{
  "GITHUB_PERSONAL_ACCESS_TOKEN": "seu_token_aqui"
}
```

**Tools Disponíveis:**
- `create_or_update_file` - Criar/atualizar arquivo
- `search_repositories` - Buscar repositórios
- `create_repository` - Criar repositório
- `get_file_contents` - Obter conteúdo de arquivo
- `push_files` - Push de arquivos
- `create_issue` - Criar issue
- `create_pull_request` - Criar PR
- `fork_repository` - Fazer fork
- `create_branch` - Criar branch

**Como Importar (Frontend):**
- Name: `GitHub`
- Source: `@modelcontextprotocol/server-github`
- Env: `GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxx`

---

### 4. Brave Search MCP
**Nome do Pacote:** `@modelcontextprotocol/server-brave-search`

**Descrição:** Busca na web usando Brave Search API

**Env Variables:**
```json
{
  "BRAVE_API_KEY": "seu_api_key"
}
```

**Tools Disponíveis:**
- `brave_web_search` - Buscar na web
- `brave_local_search` - Buscar local

**Como Importar (Frontend):**
- Name: `Brave Search`
- Source: `@modelcontextprotocol/server-brave-search`
- Env: `BRAVE_API_KEY=BSAxxx`

---

### 5. Google Maps MCP
**Nome do Pacote:** `@modelcontextprotocol/server-google-maps`

**Descrição:** Operações com Google Maps

**Env Variables:**
```json
{
  "GOOGLE_MAPS_API_KEY": "seu_api_key"
}
```

**Tools Disponíveis:**
- `maps_geocode` - Geocoding
- `maps_reverse_geocode` - Reverse geocoding
- `maps_search_places` - Buscar lugares
- `maps_get_place_details` - Detalhes do lugar
- `maps_get_distance` - Calcular distância
- `maps_get_directions` - Obter direções

**Como Importar (Frontend):**
- Name: `Google Maps`
- Source: `@modelcontextprotocol/server-google-maps`
- Env: `GOOGLE_MAPS_API_KEY=AIzaxxx`

---

### 6. Puppeteer MCP
**Nome do Pacote:** `@modelcontextprotocol/server-puppeteer`

**Descrição:** Automação de browser com Puppeteer

**Env Variables:** Nenhuma

**Tools Disponíveis:**
- `puppeteer_navigate` - Navegar para URL
- `puppeteer_screenshot` - Capturar screenshot
- `puppeteer_click` - Clicar em elemento
- `puppeteer_fill` - Preencher campo
- `puppeteer_select` - Selecionar opção
- `puppeteer_hover` - Hover sobre elemento
- `puppeteer_evaluate` - Executar JavaScript

**Como Importar (Frontend):**
- Name: `Puppeteer`
- Source: `@modelcontextprotocol/server-puppeteer`
- Env: (deixar vazio)

---

### 7. Slack MCP
**Nome do Pacote:** `@modelcontextprotocol/server-slack`

**Descrição:** Integração com Slack

**Env Variables:**
```json
{
  "SLACK_BOT_TOKEN": "xoxb-xxx",
  "SLACK_TEAM_ID": "T123456"
}
```

**Tools Disponíveis:**
- `slack_send_message` - Enviar mensagem
- `slack_reply_to_thread` - Responder thread
- `slack_add_reaction` - Adicionar reação
- `slack_list_channels` - Listar canais
- `slack_get_channel_info` - Info do canal

**Como Importar (Frontend):**
- Name: `Slack`
- Source: `@modelcontextprotocol/server-slack`
- Env: `SLACK_BOT_TOKEN=xoxb-xxx`

---

## ❌ Pacotes que NÃO Funcionam

### ⚠️ `pollinations-mcp`
**Erro:** Pacote não existe no NPM com este nome

**Pacote Correto:** `@pollinations/model-context-protocol`

---

### ⚠️ `mcp-server-xxx` (sem @org)
**Erro:** Pacotes MCP oficiais usam escopo `@modelcontextprotocol/`

**Formato Correto:** `@modelcontextprotocol/server-xxx`

---

## 📝 Formato Correto de Pacotes

### ✅ Correto
```
@modelcontextprotocol/server-filesystem
@modelcontextprotocol/server-memory
@modelcontextprotocol/server-github
@pollinations/model-context-protocol
```

### ❌ Incorreto
```
pollinations-mcp (não existe)
mcp-filesystem (não existe)
server-filesystem (faltando @org)
modelcontextprotocol/server-github (faltando @)
```

---

## 🔍 Como Encontrar Pacotes MCP

### 1. NPM Search
```bash
npm search @modelcontextprotocol
```

### 2. GitHub
Repositório oficial: https://github.com/modelcontextprotocol/servers

### 3. Awesome MCP
Lista comunitária: https://github.com/punkpeye/awesome-mcp-servers

---

## 🧪 Como Testar um Pacote

### Via cURL
```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test MCP",
    "source": "@modelcontextprotocol/server-memory",
    "description": "Testing MCP import"
  }'
```

### Via Frontend
1. Acesse http://localhost:5173/mcps
2. Clique em "Add MCP"
3. Preencha:
   - Name: Nome descritivo
   - Source: Nome do pacote NPM (com @org)
   - Env: Variáveis necessárias (uma por linha)
4. Clique em "Importar MCP"
5. Aguarde 30-60s na primeira vez

---

## 💡 Dicas

### 1. Primeira vez demora
- NPX precisa baixar o pacote
- Pode levar 30-60 segundos
- Imports subsequentes são rápidos (5-10s)

### 2. Verifique o nome no NPM
```bash
# Buscar pacote
npm search @modelcontextprotocol

# Ver informações
npm info @modelcontextprotocol/server-filesystem
```

### 3. Env variables
- Separar por linha no frontend
- Formato: `KEY=value`
- Exemplo:
  ```
  GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxx
  DEBUG=true
  ```

### 4. Logs do backend
- Monitore o terminal do backend
- Verá: `[MCP] Connecting to NPX package: ...`
- Se der erro, verá detalhes completos

---

## 🆘 Troubleshooting

### Erro: "not found"
**Causa:** Nome do pacote incorreto  
**Solução:** Verifique o nome exato no NPM

### Erro: "Connection closed"
**Causa:** Pacote não inicializou corretamente  
**Solução:** 
1. Verifique env variables obrigatórias
2. Tente outro pacote para confirmar que sistema funciona
3. Verifique internet

### Erro: "Permission denied"
**Causa:** Pacote precisa de permissões especiais  
**Solução:** Execute backend com permissões adequadas

---

## 📚 Recursos

- **MCP Protocol:** https://modelcontextprotocol.io
- **Official Servers:** https://github.com/modelcontextprotocol/servers
- **SDK Docs:** https://github.com/modelcontextprotocol/sdk

---

## ✅ Pacotes Recomendados para Começar

Para testar o sistema, recomendamos começar com:

1. **Memory** - Não precisa de API keys
2. **Filesystem** - Simples, apenas path necessário
3. **GitHub** - Se você tiver token do GitHub

Evite começar com pacotes que precisam de API keys externas se você não as tiver.
