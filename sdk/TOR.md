# 📦 TOR - Tool Onboarding Registry

**Documentação Oficial do Sistema de Importação de Tools**

**Versão:** 1.0.0  
**Data:** 2025-10-26

---

## 🎯 Visão Geral

O **TOR (Tool Onboarding Registry)** é o sistema padronizado e seguro para importar, registrar e executar tools customizadas na plataforma de automação.

### O que é TOR?

TOR substitui completamente o sistema antigo de registro de ferramentas, oferecendo:

- ✅ **Simplicidade** - Desenvolva, builde um ZIP, faça upload
- ✅ **Segurança** - Execução em sandbox isolado, validação de schemas
- ✅ **Padronização** - Manifest obrigatório, estrutura consistente
- ✅ **Isolamento** - Sem dependências do core no ambiente da ferramenta
- ✅ **Auditoria** - Versionamento completo e rastreabilidade

### Fluxo Completo

```
┌─────────────────────┐
│ 1. Desenvolver Tool │
│    (SDK Template)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Build + Pack     │
│    npm run sdk:build│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Upload ZIP       │
│    POST /api/tools  │
│         /import     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Tool Ativa       │
│    Pronta para uso  │
└─────────────────────┘
```

---

## 🚀 Quick Start

### 1. Criar Nova Tool

```bash
# Copiar template
cp -r /workspace/sdk-template my-custom-tool
cd my-custom-tool
npm install
```

### 2. Desenvolver

```typescript
// src/index.ts
export async function handler(ctx, input) {
  ctx.logger.info('Processing...', input);
  
  // Sua lógica aqui
  const result = processData(input);
  
  return {
    result,
    timestamp: Date.now()
  };
}
```

### 3. Configurar Manifest

```json
// manifest.json
{
  "name": "my-tool",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "type": "tool",
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    },
    "required": ["result"]
  }
}
```

### 4. Build e Pack

```bash
npm run sdk:build
# Gera: build/my-tool-1.0.0.zip
```

### 5. Import

```bash
curl -X POST "http://localhost:3000/api/tools/import" \
  -F "file=@build/my-tool-1.0.0.zip"
```

**Resposta (sucesso):**
```json
{
  "id": "tool-uuid-abc123",
  "name": "my-tool",
  "version": "1.0.0",
  "status": "active"
}
```

---

## 📋 Manifest.json (Contrato)

O `manifest.json` é o contrato obrigatório entre a tool e a plataforma.

### Estrutura Completa

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "name": "string",
  "version": "string",
  "entry": "string",
  "type": "tool",
  "description": "string",
  "capabilities": ["string"],
  "inputSchema": { /* JSON Schema */ },
  "outputSchema": { /* JSON Schema */ },
  "compatibility": {
    "coreMin": "string",
    "coreMax": "string"
  }
}
```

### Campos Obrigatórios

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `name` | string | Nome único da tool (ex: "acme-mytool") |
| `version` | string | Versão semver (ex: "1.0.0") |
| `entry` | string | Caminho para entry point (ex: "dist/index.js") |
| `type` | "tool" | Sempre "tool" |
| `outputSchema` | object | **JSON Schema do output (OBRIGATÓRIO!)** |

### Campos Opcionais

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `description` | string | Descrição da tool |
| `capabilities` | string[] | Permissões necessárias |
| `inputSchema` | object | JSON Schema do input (recomendado) |
| `compatibility` | object | Compatibilidade de versão |

---

## 🔑 Campos Detalhados

### name

```json
{
  "name": "acme-email-validator"
}
```

- Deve ser único
- Usar kebab-case
- Sem espaços ou caracteres especiais
- Máx 50 caracteres

### version

```json
{
  "version": "1.0.0"
}
```

- Formato **semver** obrigatório
- Formato: `MAJOR.MINOR.PATCH`
- Exemplos válidos: "1.0.0", "2.3.1", "0.1.0"
- Exemplos inválidos: "v1.0", "1.0", "1"

### entry

```json
{
  "entry": "dist/index.js"
}
```

- Caminho relativo ao root do ZIP
- Deve apontar para arquivo `.js`
- Arquivo deve existir no ZIP

### type

```json
{
  "type": "tool"
}
```

- Sempre `"tool"`
- Outros tipos não são suportados

### outputSchema (OBRIGATÓRIO!)

```json
{
  "outputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "result": {
        "type": "string",
        "description": "Result message"
      },
      "timestamp": {
        "type": "number",
        "description": "Processing timestamp"
      }
    },
    "required": ["result", "timestamp"]
  }
}
```

**IMPORTANTE:** `outputSchema` é **OBRIGATÓRIO**!

Sem ele, sua tool será rejeitada.

### inputSchema (Recomendado)

```json
{
  "inputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "format": "email"
      }
    },
    "required": ["email"]
  }
}
```

Embora opcional, é **altamente recomendado** para validação.

### capabilities

```json
{
  "capabilities": ["network", "filesystem"]
}
```

Capabilities disponíveis:
- `network` - HTTP requests, APIs externas
- `filesystem` - Leitura/escrita de arquivos no sandbox
- `spawn` - Executar processos filhos
- `env` - Acessar variáveis de ambiente

### compatibility

```json
{
  "compatibility": {
    "coreMin": ">=1.0.0 <2.0.0",
    "coreMax": "2.0.0"
  }
}
```

Define compatibilidade com versões do core.

---

## 📦 Estrutura do ZIP

O comando `npm run pack` gera um ZIP com esta estrutura **obrigatória**:

```
tool-name-1.0.0.zip
├── manifest.json      ✅ OBRIGATÓRIO
├── dist/
│   └── index.js      ✅ Entry point
└── README-tool.md    ⚠️  Opcional
```

### Regras do ZIP

**✅ Permitido:**
- `manifest.json` na raiz
- Pasta `dist/` com código buildado
- `README-tool.md` (opcional)
- Arquivos `.d.ts` (types)

**❌ Proibido:**
- `node_modules/` (use bundler)
- `.env`, `.env.local` (secrets)
- `.exe`, `.bat`, `.sh`, `.cmd` (executáveis)
- Arquivos > 50MB
- `.git/` (versionamento)

---

## 🌐 API Endpoints

### POST /api/tools/import

Importa uma tool via ZIP.

**Request:**
```bash
curl -X POST "http://localhost:3000/api/tools/import" \
  -F "file=@tool.zip" \
  -F "overwrite=false"
```

**Success Response (201):**
```json
{
  "id": "tool-uuid-123",
  "name": "my-tool",
  "version": "1.0.0",
  "status": "active",
  "warnings": []
}
```

**Error Responses:**

**400 Bad Request** - Manifest inválido
```json
{
  "errorCode": "IMPORT_FAILED",
  "message": "Tool import failed",
  "errors": [
    "outputSchema: Field 'outputSchema' is required"
  ]
}
```

**409 Conflict** - Tool já existe
```json
{
  "errorCode": "CONFLICT",
  "message": "Tool my-tool@1.0.0 already exists. Use overwrite=true to replace."
}
```

**422 Unprocessable** - Healthcheck falhou
```json
{
  "errorCode": "HEALTHCHECK_FAILED",
  "message": "Tool loaded but healthcheck failed",
  "details": "Entry point not found"
}
```

---

### GET /api/tools

Lista todas as tools importadas.

**Response (200):**
```json
{
  "tools": [
    {
      "id": "tool-123",
      "name": "my-tool",
      "version": "1.0.0",
      "status": "active",
      "description": "Email validator",
      "capabilities": ["network"],
      "createdAt": "2025-10-26T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET /api/tools/:id

Detalhes de uma tool específica.

**Response (200):**
```json
{
  "id": "tool-123",
  "name": "my-tool",
  "version": "1.0.0",
  "manifest": { /* manifest completo */ },
  "status": "active",
  "sandboxPath": "/tmp/tools-sandbox/my-tool-1.0.0",
  "createdAt": "2025-10-26T10:00:00Z",
  "updatedAt": "2025-10-26T10:00:05Z"
}
```

---

### GET /api/tools/versions/:name

Lista todas as versões de uma tool.

**Response (200):**
```json
{
  "name": "my-tool",
  "versions": [
    {
      "id": "tool-456",
      "version": "2.0.0",
      "status": "active",
      "createdAt": "2025-10-27T10:00:00Z"
    },
    {
      "id": "tool-123",
      "version": "1.0.0",
      "status": "inactive",
      "createdAt": "2025-10-26T10:00:00Z"
    }
  ],
  "total": 2
}
```

---

### DELETE /api/tools/:id

Remove uma tool.

**Response (204 No Content)**

---

## 🔐 Segurança

### Capability Model

Tools declaram capabilities no manifest. O TOR verifica antes de executar.

```json
{
  "capabilities": ["network", "filesystem"]
}
```

**Verificação:**
```typescript
if (tool.capabilities.includes('network') && !context.allowedCapabilities.network) {
  throw new Error('Capability network is required but not allowed');
}
```

### Sandbox Execution

Todas as tools executam em sandboxes isolados:

- ✅ Diretório isolado (`/tmp/tools-sandbox/tool-name-version/`)
- ✅ Timeout configurável (default: 30s)
- ✅ Memory limit (default: 512MB)
- ✅ Sem acesso ao filesystem global
- ✅ Network apenas se capability `network`

### Security Checks

Durante import, TOR executa:

1. ✅ Rejeita `.env`, `.exe`, `.bat`, `.sh`
2. ✅ Rejeita `node_modules` grandes
3. ✅ Valida `manifest.json`
4. ✅ Verifica `outputSchema` obrigatório
5. ✅ Calcula hash SHA256 para auditoria
6. ✅ Executa healthcheck (opcional)

---

## 📐 Versionamento

### Política de Versões

- Cada `(name, version)` é **único**
- Versões seguem **semver**
- Novas versões coexistem com antigas
- Use `overwrite=true` para substituir mesma versão

### Exemplos

```bash
# Primeira versão
curl -F "file=@my-tool-1.0.0.zip" /api/tools/import
# → Cria my-tool@1.0.0

# Nova versão
curl -F "file=@my-tool-2.0.0.zip" /api/tools/import
# → Cria my-tool@2.0.0 (v1 continua disponível)

# Atualizar v1
curl -F "file=@my-tool-1.0.0.zip" -F "overwrite=true" /api/tools/import
# → Substitui my-tool@1.0.0

# Conflito sem overwrite
curl -F "file=@my-tool-1.0.0.zip" /api/tools/import
# → 409 Conflict
```

---

## 🛠️ Troubleshooting

### Erro: "manifest.json not found"

**Causa:** ZIP não contém `manifest.json` na raiz.

**Solução:**
```bash
# Verificar estrutura
unzip -l my-tool.zip

# Deve mostrar:
# manifest.json
# dist/index.js
```

### Erro: "outputSchema is required"

**Causa:** `manifest.json` não tem `outputSchema`.

**Solução:**
```json
{
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    },
    "required": ["result"]
  }
}
```

### Erro: "Entry point not found"

**Causa:** `entry` no manifest aponta para arquivo inexistente.

**Solução:**
```bash
# Verificar se arquivo existe
unzip -l my-tool.zip | grep "dist/index.js"
```

### Erro: "Version is not valid semver"

**Causa:** Versão não segue formato semver.

**Solução:**
```json
{
  "version": "1.0.0"  // ✅ Correto
  // "version": "v1.0" // ❌ Errado
}
```

### Erro: "ZIP file too large"

**Causa:** ZIP > 50MB.

**Solução:**
- Use bundler (webpack, esbuild)
- Não inclua `node_modules`
- Remova arquivos desnecessários

---

## 🎯 Exemplos Práticos

### Exemplo 1: Email Validator

**Tool Code:**
```typescript
// src/index.ts
export async function handler(ctx, input) {
  const { email } = input;
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  
  return {
    valid,
    domain: email.split('@')[1] || ''
  };
}
```

**Manifest:**
```json
{
  "name": "email-validator",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "type": "tool",
  "outputSchema": {
    "type": "object",
    "properties": {
      "valid": { "type": "boolean" },
      "domain": { "type": "string" }
    },
    "required": ["valid", "domain"]
  }
}
```

**Import:**
```bash
curl -F "file=@email-validator-1.0.0.zip" \
  http://localhost:3000/api/tools/import
```

---

### Exemplo 2: HTTP Fetcher (com capability)

**Tool Code:**
```typescript
// src/index.ts
import fetch from 'node-fetch';

export async function handler(ctx, input) {
  const { url } = input;
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    status: response.status,
    data
  };
}
```

**Manifest:**
```json
{
  "name": "http-fetcher",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "type": "tool",
  "capabilities": ["network"],
  "outputSchema": {
    "type": "object",
    "properties": {
      "status": { "type": "number" },
      "data": { "type": "object" }
    },
    "required": ["status", "data"]
  }
}
```

---

## 💡 Best Practices

### 1. Sempre use outputSchema

```json
// ✅ Bom
{
  "outputSchema": {
    "type": "object",
    "properties": {
      "result": { "type": "string" }
    },
    "required": ["result"]
  }
}

// ❌ Ruim - será rejeitado
{
  // Sem outputSchema
}
```

### 2. Declare só capabilities necessárias

```json
// ✅ Bom - só o que precisa
{
  "capabilities": ["network"]
}

// ❌ Ruim - over-permissive
{
  "capabilities": ["network", "filesystem", "spawn", "env"]
}
```

### 3. Use semver corretamente

```
1.0.0 → 1.0.1  ✅ Bug fix
1.0.0 → 1.1.0  ✅ New feature (backward compatible)
1.0.0 → 2.0.0  ✅ Breaking change
```

### 4. Bundle suas dependências

```bash
# Use bundler
npm install --save-dev tsup
npm run build  # Gera dist/ bundled
```

### 5. Teste localmente antes de importar

```bash
# Build
npm run build

# Test
node dist/index.js

# Validate ZIP
unzip -l build/my-tool-1.0.0.zip
```

---

## 📊 Códigos HTTP

| Código | Significado | Quando |
|--------|-------------|--------|
| 201 | Created | Import bem-sucedido |
| 200 | OK | GET, listagens |
| 204 | No Content | DELETE bem-sucedido |
| 400 | Bad Request | Manifest/schema inválido |
| 409 | Conflict | Tool já existe (sem overwrite) |
| 422 | Unprocessable | Healthcheck falhou |
| 404 | Not Found | Tool não encontrada |
| 500 | Internal Error | Erro no servidor |

---

## 🔍 Auditoria

Cada import gera logs completos:

```
[2025-10-26T10:00:00Z] TOOL_IMPORT
  user: user-123
  ip: 192.168.1.100
  tool: email-validator@1.0.0
  hash: abc123def456...
  status: success
  warnings: []
```

---

## 📈 Roadmap

### Implementado ✅
- [x] Manifest validation
- [x] ZIP inspection
- [x] Sandbox isolation
- [x] Capability model
- [x] Versionamento
- [x] API endpoints
- [x] Healthcheck

### Planejado 🔮
- [ ] Assinatura digital de ZIPs
- [ ] Antivirus scan
- [ ] Tool marketplace
- [ ] Metrics & monitoring
- [ ] Hot reload
- [ ] Tool dependencies
- [ ] Custom runtimes (Python, Go)

---

## 🆘 Suporte

**Documentação:**
- SDK Template: `/workspace/sdk-template/README.md`
- TOR Docs: Este arquivo

**Issues:**
- GitHub: https://github.com/your-org/automation-platform/issues

**Community:**
- Discord: https://discord.gg/automation
- Forum: https://forum.automation-platform.dev

---

**TOR v1.0.0 - Tool Onboarding Registry**

Construído com ❤️ para a comunidade de automação.
