# 📦 TOR - Tool Onboarding Registry

**Documentação Oficial do Sistema de Importação de Tools**

---

## 🎯 Objetivo

O **TOR (Tool Onboarding Registry)** é o sistema padronizado e seguro para importar, registrar e executar tools customizadas na plataforma de automação. 

Ao invés de registrar tools manualmente via código, desenvolvedores agora:

1. Desenvolvem tools usando o SDK template
2. Executam `sdk build` para gerar um `.zip` padronizado
3. Fazem upload do ZIP via `POST /api/tools/import`
4. A tool é validada, registrada e executada em sandbox isolado

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│  1. Developer Side (SDK)                            │
│                                                     │
│  sdk init → develop tool → sdk build → tool.zip    │
└─────────────────┬───────────────────────────────────┘
                  │
                  │ Upload ZIP
                  ▼
┌─────────────────────────────────────────────────────┐
│  2. Backend (TOR)                                   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ POST /api/tools/import                      │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Zip Inspector                               │   │
│  │ - Verifica estrutura                        │   │
│  │ - Detecta arquivos maliciosos               │   │
│  │ - Extrai manifest.json                      │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Manifest Validator                          │   │
│  │ - Valida schema                             │   │
│  │ - Verifica outputSchema (obrigatório)       │   │
│  │ - Valida capabilities                       │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Tool Repository                             │   │
│  │ - Cria registro                             │   │
│  │ - Gerencia versões                          │   │
│  └──────────────┬──────────────────────────────┘   │
│                 │                                   │
│                 ▼                                   │
│  ┌─────────────────────────────────────────────┐   │
│  │ Sandbox Manager                             │   │
│  │ - Cria sandbox isolado                      │   │
│  │ - Executa healthcheck                       │   │
│  │ - Garante segurança                         │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 📋 Manifest.json (Contrato Obrigatório)

O `manifest.json` é o contrato entre a tool e a plataforma. **outputSchema é obrigatório**.

### Schema Completo

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["name", "version", "entry", "type", "outputSchema"],
  "properties": {
    "name": {
      "type": "string",
      "description": "Nome único da tool (ex: acme-mytool)"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Versão semver (ex: 1.0.0)"
    },
    "entry": {
      "type": "string",
      "description": "Caminho relativo para o entry point (ex: dist/index.js)"
    },
    "type": {
      "type": "string",
      "enum": ["tool"],
      "description": "Tipo deve ser 'tool'"
    },
    "description": {
      "type": "string",
      "description": "Descrição curta da tool"
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["network", "filesystem", "spawn", "env"]
      },
      "description": "Capabilities necessárias"
    },
    "inputSchema": {
      "type": "object",
      "description": "JSON Schema para validação de input (recomendado)"
    },
    "outputSchema": {
      "type": "object",
      "description": "JSON Schema para validação de output (OBRIGATÓRIO)"
    },
    "compatibility": {
      "type": "object",
      "properties": {
        "coreMin": {
          "type": "string",
          "description": "Versão mínima do core (ex: >=1.0.0 <2.0.0)"
        },
        "coreMax": {
          "type": "string"
        }
      }
    }
  }
}
```

### Exemplo Prático

```json
{
  "name": "acme-email-validator",
  "version": "1.0.0",
  "entry": "dist/index.js",
  "type": "tool",
  "description": "Validates email addresses with DNS check",
  "capabilities": ["network"],
  "inputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "email": {
        "type": "string",
        "format": "email"
      },
      "checkDNS": {
        "type": "boolean",
        "default": false
      }
    },
    "required": ["email"]
  },
  "outputSchema": {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
      "valid": {
        "type": "boolean"
      },
      "domain": {
        "type": "string"
      },
      "dnsValid": {
        "type": "boolean"
      }
    },
    "required": ["valid", "domain"]
  },
  "compatibility": {
    "coreMin": ">=1.0.0 <2.0.0"
  }
}
```

---

## 📦 Estrutura do ZIP

O comando `sdk build` deve produzir um ZIP com esta estrutura **estrita**:

```
tool-name-1.0.0.zip
├── manifest.json          ✅ OBRIGATÓRIO
├── dist/
│   ├── index.js          ✅ Entry point
│   ├── lib.js
│   └── utils.js
├── types/                 ⚠️ Opcional
│   └── index.d.ts
└── README-tool.md         ⚠️ Opcional
```

### ❌ Não Permitido

- `node_modules/` completos (use bundler)
- `.env`, `.env.local` (segredos)
- `.exe`, `.bat`, `.sh`, `.cmd` (executáveis)
- Arquivos > 50MB

---

## 🚀 Fluxo de Build (Developer Side)

### 1. Inicializar Projeto

```bash
# Usar template do SDK
sdk init my-tool
cd my-tool
npm install
```

### 2. Desenvolver Tool

```typescript
// src/index.ts
export async function handler(ctx: any, input: any) {
  const { email } = input;
  
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const domain = email.split('@')[1] || '';
  
  return {
    valid,
    domain,
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
      "valid": { "type": "boolean" },
      "domain": { "type": "string" }
    },
    "required": ["valid", "domain"]
  }
}
```

### 4. Build e Pack

```bash
# Build TypeScript
npm run build

# Pack tool (gera ZIP)
sdk build

# Output: build/my-tool-1.0.0.zip
```

---

## 🌐 API Endpoints

### POST /api/tools/import

Importa uma tool via ZIP.

**Request:**
```bash
curl -X POST "http://localhost:3000/api/tools/import" \
  -F "file=@./build/my-tool-1.0.0.zip" \
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

### GET /api/tools

Lista todas as tools.

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
      "createdAt": "2025-10-25T10:00:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/tools/:id

Detalhes de uma tool.

**Response (200):**
```json
{
  "id": "tool-123",
  "name": "my-tool",
  "version": "1.0.0",
  "manifest": { ... },
  "status": "active",
  "sandboxPath": "/tmp/tools-sandbox/my-tool-1.0.0",
  "createdAt": "2025-10-25T10:00:00Z",
  "updatedAt": "2025-10-25T10:00:05Z"
}
```

### GET /api/tools/versions/:name

Lista versões de uma tool.

**Response (200):**
```json
{
  "name": "my-tool",
  "versions": [
    {
      "id": "tool-456",
      "version": "2.0.0",
      "status": "active",
      "createdAt": "2025-10-26T10:00:00Z"
    },
    {
      "id": "tool-123",
      "version": "1.0.0",
      "status": "inactive",
      "createdAt": "2025-10-25T10:00:00Z"
    }
  ],
  "total": 2
}
```

### DELETE /api/tools/:id

Remove uma tool.

**Response (204 No Content)**

---

## 🔒 Segurança

### Capability Model

Tools declaram capabilities no manifest. O host verifica antes de executar.

```json
{
  "capabilities": ["network", "filesystem"]
}
```

**Capabilities disponíveis:**
- `network` - Fazer requests HTTP/HTTPS
- `filesystem` - Ler/escrever arquivos no sandbox
- `spawn` - Executar processos filhos
- `env` - Acessar variáveis de ambiente

### Sandbox Execution

Todas as tools executam em sandboxes isolados:

- ✅ Diretório isolado (`/tmp/tools-sandbox/tool-name-version/`)
- ✅ Timeout configurável (default: 30s)
- ✅ Memory limit (default: 512MB)
- ✅ Sem acesso ao filesystem global
- ✅ Network apenas se capability `network`

### Security Checks

Durante import:

1. ✅ Rejeita `.env`, `.exe`, `.bat`, `.sh`
2. ✅ Rejeita `node_modules` grandes
3. ✅ Valida manifest.json
4. ✅ Verifica outputSchema obrigatório
5. ✅ Calcula hash SHA256 para auditoria

---

## 📐 Versionamento

### Política de Versões

- Cada `(name, version)` é único
- Versões seguem **semver** (ex: `1.0.0`)
- Novas versões coexistem com antigas
- Use `overwrite=true` para substituir mesma versão

### Exemplo de Versionamento

```bash
# V1 - Primeira versão
curl -F "file=@my-tool-1.0.0.zip" /api/tools/import
# → Cria my-tool@1.0.0

# V2 - Nova versão
curl -F "file=@my-tool-2.0.0.zip" /api/tools/import
# → Cria my-tool@2.0.0 (V1 continua disponível)

# Atualizar V1
curl -F "file=@my-tool-1.0.0.zip" -F "overwrite=true" /api/tools/import
# → Substitui my-tool@1.0.0

# Conflito
curl -F "file=@my-tool-1.0.0.zip" /api/tools/import
# → 409 Conflict (já existe)
```

---

## 🛠️ Troubleshooting

### Erro: "manifest.json not found"

**Causa:** ZIP não contém `manifest.json` na raiz.

**Solução:** 
```bash
# Verificar estrutura do ZIP
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
```json
{
  "entry": "dist/index.js"  // ← Deve existir no ZIP
}
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

### Erro: "Capability 'xyz' is not allowed"

**Causa:** Tool pede capability não permitida pelo host.

**Solução:** Remover capability do manifest ou solicitar permissão ao administrador.

### Erro: "ZIP file too large"

**Causa:** ZIP > 50MB.

**Solução:** 
- Use bundler (webpack, esbuild) para reduzir tamanho
- Não inclua `node_modules` completos
- Remova arquivos desnecessários

---

## 🎯 Exemplos Práticos

### Exemplo 1: Email Validator

**Tool Code:**
```typescript
// src/index.ts
export async function handler(ctx: any, input: any) {
  const { email } = input;
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
    valid,
    domain: email.split('@')[1] || '',
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

### Exemplo 2: HTTP Fetcher (com capability)

**Tool Code:**
```typescript
// src/index.ts
import fetch from 'node-fetch';

export async function handler(ctx: any, input: any) {
  const { url } = input;
  const response = await fetch(url);
  const data = await response.json();
  
  return {
    status: response.status,
    data,
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

Cada import gera logs com:

- ✅ User ID (se autenticado)
- ✅ IP address
- ✅ Timestamp
- ✅ Tool name + version
- ✅ SHA256 hash do ZIP
- ✅ Resultado (success/failure)

**Exemplo de log:**
```
[2025-10-25T10:00:00Z] TOOL_IMPORT
  user: user-123
  ip: 192.168.1.100
  tool: email-validator@1.0.0
  hash: abc123def456...
  status: success
```

---

## 📈 Roadmap

### Implementado ✅
- [x] Manifest validation
- [x] ZIP inspection
- [x] Sandbox isolation
- [x] Capability model
- [x] Versioning
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

// ❌ Ruim - rejeitado
{
  // Sem outputSchema
}
```

### 2. Declare só as capabilities necessárias

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
# Use webpack, esbuild ou similar
npm run build # → Gera dist/ com tudo bundled
```

### 5. Teste localmente antes de importar

```bash
# Testar build
npm run build
node dist/index.js

# Testar ZIP
unzip -l build/my-tool-1.0.0.zip

# Validar manifest
cat manifest.json | jq .
```

---

## 🆘 Suporte

**Documentação:**
- SDK README: `/sdk/README.md`
- API Docs: `/docs/api.md`

**Issues:**
- GitHub Issues: https://github.com/your-org/automation-platform/issues

**Community:**
- Discord: https://discord.gg/automation
- Forum: https://forum.automation-platform.dev

---

**TOR v1.0.0 - Tool Onboarding Registry**

Construído com ❤️ para a comunidade de automação.
