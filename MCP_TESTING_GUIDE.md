# 🧪 Guia Completo de Teste de MCPs

## ⚠️ IMPORTANTE: Backend Real com MCP SDK

O backend agora usa o **RealMCPSandbox** que conecta a MCPs reais via SDK oficial.

---

## 📋 Pré-requisitos

1. **Backend rodando**: `npm run dev` na porta 3000
2. **Pacote npx** disponível globalmente
3. **Conexão com internet** (para instalar MCPs via npx)

---

## 🚀 Como Iniciar o Backend

```bash
cd /workspace
npm run dev
```

Aguarde a mensagem: `Server running on port 3000`

---

## 🧪 Teste 1: @pollinations/model-context-protocol

### Importar o MCP:
```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pollinations",
    "source": "@pollinations/model-context-protocol",
    "description": "Image and text generation via Pollinations AI"
  }'
```

### Resposta Esperada:
```json
{
  "mcp": {
    "id": "mcp-...",
    "name": "pollinations",
    "source": "@pollinations/model-context-protocol",
    "sourceType": "npx",
    "description": "Image and text generation via Pollinations AI",
    "tools": [
      {
        "id": "tool-...",
        "name": "generate_image",
        "description": "Generate an image from a text prompt",
        "inputSchema": {
          "type": "object",
          "properties": {
            "prompt": {
              "type": "string",
              "description": "Text description of the image to generate"
            },
            "model": {
              "type": "string",
              "description": "Model to use for generation",
              "enum": ["flux", "flux-realism", "flux-cablyai", "flux-anime", "turbo", "flux-3d"]
            },
            "width": {
              "type": "number",
              "description": "Width of generated image"
            },
            "height": {
              "type": "number",
              "description": "Height of generated image"
            }
          },
          "required": ["prompt"]
        },
        "outputSchema": {
          "type": "object"
        }
      }
      // ... mais tools
    ],
    "env": {}
  },
  "toolsExtracted": 2  // ou mais
}
```

### Ver Tools Extraídas:
```bash
# Pegue o ID do MCP da resposta anterior
MCP_ID="mcp-..."

curl -X GET http://localhost:3000/api/mcps/$MCP_ID/tools
```

---

## 🧪 Validação Manual

### Verificar Quantas Tools o Pollinations MCP Realmente Tem:

```bash
# Executar o MCP manualmente para ver suas tools
npx -y @pollinations/model-context-protocol
```

Isso vai iniciar o servidor MCP. Você pode verificar as tools manualmente ou usar um cliente MCP.

### Comparar com Nossa API:

1. **Tools que devem existir no Pollinations MCP**:
   - `generate_image` - Gerar imagem com prompt
   - `generate_text` - Gerar texto (possivelmente)
   
2. **Nossa API deve retornar**:
   - Mesmo número de tools
   - Nomes corretos das tools
   - InputSchemas reais (não mockados)

---

## 🧪 Testes Adicionais com MCPs Oficiais

### Teste 2: Filesystem MCP

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "filesystem",
    "source": "@modelcontextprotocol/server-filesystem",
    "description": "File system operations",
    "env": {
      "ALLOWED_PATHS": "/workspace"
    }
  }'
```

**Tools Esperadas**:
- `read_file`
- `write_file`
- `list_directory`
- `create_directory`
- `move_file`
- `search_files`

### Teste 3: GitHub MCP (requer token)

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "github",
    "source": "@modelcontextprotocol/server-github",
    "description": "GitHub operations",
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_your_token_here"
    }
  }'
```

**Tools Esperadas**:
- `create_or_update_file`
- `search_repositories`
- `create_repository`
- `get_file_contents`
- `push_files`
- `create_issue`
- `create_pull_request`
- `fork_repository`
- `create_branch`

### Teste 4: Brave Search MCP (requer API key)

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "brave-search",
    "source": "@modelcontextprotocol/server-brave-search",
    "description": "Web search via Brave",
    "env": {
      "BRAVE_API_KEY": "your_api_key_here"
    }
  }'
```

**Tools Esperadas**:
- `brave_web_search`

### Teste 5: Puppeteer MCP

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "puppeteer",
    "source": "@modelcontextprotocol/server-puppeteer",
    "description": "Browser automation"
  }'
```

**Tools Esperadas**:
- `puppeteer_navigate`
- `puppeteer_screenshot`
- `puppeteer_click`
- `puppeteer_fill`
- `puppeteer_select`
- `puppeteer_hover`
- `puppeteer_evaluate`

---

## 📊 Checklist de Validação

Para cada MCP testado, verificar:

- [ ] MCP foi importado com sucesso
- [ ] `toolsExtracted` > 0
- [ ] Lista de tools está populada
- [ ] Cada tool tem `name` correto
- [ ] Cada tool tem `inputSchema` válido (não vazio)
- [ ] InputSchemas contêm properties corretas
- [ ] InputSchemas indicam campos required
- [ ] Comparar com documentação oficial do MCP

---

## 🔍 Comandos Úteis

### Listar todos os MCPs:
```bash
curl -X GET http://localhost:3000/api/mcps
```

### Ver tools de um MCP específico:
```bash
curl -X GET http://localhost:3000/api/mcps/{mcp-id}/tools
```

### Deletar um MCP:
```bash
curl -X DELETE http://localhost:3000/api/mcps/{mcp-id}
```

---

## 🐛 Problemas Comuns

### "Failed to load MCP from NPX"

**Causa**: O pacote não existe ou há erro de rede

**Solução**: 
```bash
# Testar instalação manual do pacote
npx -y @pollinations/model-context-protocol
```

### "toolsExtracted: 0"

**Causa**: MCP não está expondo tools ou há erro na extração

**Solução**: Verificar logs do backend para erros

### Timeout na importação

**Causa**: MCP demorado para iniciar

**Solução**: Aumentar timeout no frontend ou aguardar mais tempo

---

## ✅ Critério de Sucesso

O sistema está funcionando corretamente se:

1. ✅ Todos os 5 MCPs podem ser importados
2. ✅ Cada MCP retorna tools > 0
3. ✅ Tool names correspondem à documentação oficial
4. ✅ InputSchemas são válidos e detalhados
5. ✅ Não há tools mockadas/hardcoded
6. ✅ Schemas mostram properties reais do MCP

---

## 📝 Notas de Implementação

### RealMCPSandbox

- Usa `@modelcontextprotocol/sdk` oficial
- Conecta via `StdioClientTransport`
- Executa `npx -y {package}` para instalar MCP
- Chama `client.listTools()` para extrair tools reais
- Retorna schemas reais do MCP

### Diferença do MockSandbox

| Aspecto | MockSandbox | RealMCPSandbox |
|---------|-------------|----------------|
| Execução | Simulada | Real via SDK |
| Tools | Hardcoded | Extraídas do MCP |
| Schemas | Fake | Reais |
| Conexão | Nenhuma | stdio via npx |
| Validação | Não confiável | 100% real |

---

## 🎯 Próximos Passos Após Validação

Depois de validar que tudo funciona:

1. ✅ Atualizar frontend para mostrar tools reais
2. ✅ Adicionar feedback visual durante import (loading)
3. ✅ Implementar SSE URLs se necessário
4. ✅ Adicionar timeout configurável
5. ✅ Melhorar tratamento de erros
6. ✅ Adicionar retry logic
7. ✅ Cache de MCPs importados

---

**🚀 Pronto para testar! Inicie o backend e execute os comandos curl acima.**
