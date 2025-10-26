# 🔧 Fix: Erro "pollinations-mcp: not found"

## ❌ Problema

Você tentou importar um MCP com o nome `pollinations-mcp` e recebeu o erro:
```
sh: 1: pollinations-mcp: not found
Error connecting to NPX MCP: McpError: MCP error -32000: Connection closed
```

## ✅ Solução

O problema é o **nome do pacote**. Você usou `pollinations-mcp`, mas o nome correto no NPM é diferente.

### Pacote INCORRETO ❌
```
pollinations-mcp
```

### Pacote CORRETO ✅
```
@pollinations/model-context-protocol
```

---

## 🎯 Como Corrigir

### Opção 1: Frontend (Recomendado)

1. Acesse: http://localhost:5173/mcps
2. Clique em "Add MCP"
3. No campo **Source**, use:
   ```
   @pollinations/model-context-protocol
   ```
4. Clique no dropdown "📦 Ver exemplos de pacotes" para mais opções

### Opção 2: cURL

```bash
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pollinations",
    "source": "@pollinations/model-context-protocol",
    "description": "AI image generation"
  }'
```

---

## 📦 Pacotes MCP Corretos

Sempre use o formato completo `@org/nome-do-pacote`:

### ✅ Funciona (Testados)

| Nome Curto | Pacote NPM Completo |
|------------|---------------------|
| Memory | `@modelcontextprotocol/server-memory` |
| Filesystem | `@modelcontextprotocol/server-filesystem` |
| GitHub | `@modelcontextprotocol/server-github` |
| Brave Search | `@modelcontextprotocol/server-brave-search` |
| Google Maps | `@modelcontextprotocol/server-google-maps` |
| Puppeteer | `@modelcontextprotocol/server-puppeteer` |
| Slack | `@modelcontextprotocol/server-slack` |

### ❌ NÃO Funciona (Nomes Incorretos)

| Tentativa Incorreta | Erro | Correto |
|---------------------|------|---------|
| `pollinations-mcp` | not found | `@pollinations/model-context-protocol` |
| `mcp-filesystem` | not found | `@modelcontextprotocol/server-filesystem` |
| `server-memory` | not found | `@modelcontextprotocol/server-memory` |
| `modelcontextprotocol/server-github` | invalid | `@modelcontextprotocol/server-github` |

---

## 🧪 Teste Rápido

Para testar se o sistema está funcionando corretamente:

```bash
# 1. Teste com Memory MCP (não precisa de API keys)
./test-mcp-quick.sh

# 2. Ou manualmente:
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Memory Test",
    "source": "@modelcontextprotocol/server-memory"
  }'
```

Se funcionar, você verá:
```json
{
  "id": "mcp-xxx",
  "name": "Memory Test",
  "toolsExtracted": 6,
  "message": "MCP imported successfully"
}
```

---

## 🔍 Como Encontrar o Nome Correto

### Método 1: NPM Search
```bash
npm search @modelcontextprotocol
```

### Método 2: NPM Info
```bash
# Ver informações do pacote
npm info @modelcontextprotocol/server-filesystem

# Listar versões
npm view @modelcontextprotocol/server-memory versions
```

### Método 3: Repositório GitHub
Visite: https://github.com/modelcontextprotocol/servers

---

## 💡 Dicas

### 1. Use o nome COMPLETO
Sempre inclua o `@org/` no início:
- ✅ `@modelcontextprotocol/server-memory`
- ❌ `server-memory`

### 2. Não invente nomes
Os pacotes MCP têm nomes específicos no NPM. Não tente adivinhar.

### 3. Consulte a lista
Veja `MCP_PACKAGES_LIST.md` para a lista completa de pacotes testados.

### 4. Primeira vez demora
- NPX baixa o pacote automaticamente
- Pode levar 30-60 segundos
- Imports subsequentes são mais rápidos

### 5. Monitore os logs
O backend agora mostra logs úteis:
```
[MCP] Connecting to NPX package: @modelcontextprotocol/server-memory
[MCP] Using command: npx -y @modelcontextprotocol/server-memory
[MCP] Successfully connected to @modelcontextprotocol/server-memory
```

---

## 🚀 Melhorias Aplicadas

O sistema foi melhorado com:

### ✅ Backend
- Melhor error handling
- Mensagens de erro descritivas
- Logs detalhados do processo
- Sugestões de pacotes comuns

### ✅ Frontend
- Dropdown com exemplos de pacotes
- Pacotes clicáveis (auto-preenche)
- Avisos sobre formato correto
- Alert durante import

### ✅ Documentação
- `MCP_PACKAGES_LIST.md` - Lista completa de pacotes
- `FIX_MCP_ERROR.md` - Este guia de solução
- `test-mcp-quick.sh` - Teste automatizado

---

## ✅ Próximos Passos

1. **Reinicie o backend** (se estava rodando):
   ```bash
   cd /workspace
   npm run build
   npm run dev
   ```

2. **Teste com Memory MCP**:
   ```bash
   ./test-mcp-quick.sh
   ```

3. **Use o frontend**:
   - Abra: http://localhost:5173/mcps
   - Clique nos exemplos do dropdown
   - Import sucesso! ✓

---

## 🆘 Ainda com Problemas?

### Erro persiste?
1. Verifique se o backend está rodando
2. Verifique sua conexão com internet
3. Confirme que NPX está instalado: `npx --version`
4. Tente o pacote Memory primeiro (mais simples)

### Backend não inicia?
```bash
cd /workspace
npm install
npm run build
npm run dev
```

### Frontend não conecta?
Verifique `.env` no frontend:
```bash
cd /workspace/flui-frontend
cat .env
# Deve ter: VITE_API_URL=http://localhost:3000
```

---

## 📚 Recursos Úteis

- **Lista de Pacotes:** `MCP_PACKAGES_LIST.md`
- **Teste Rápido:** `./test-mcp-quick.sh`
- **Teste Completo:** `./test-production.sh`
- **Documentação:** `PRODUCTION_READY_MCPS.md`

---

**Status:** ✅ Corrigido e melhorado  
**Versão:** 1.1.0  
**Data:** 2025-10-26
