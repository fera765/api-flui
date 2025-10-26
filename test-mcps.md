# MCPs Populares para Testar

## 1. @pollinations/model-context-protocol
- **Descrição**: Image and text generation via Pollinations AI
- **Fonte**: NPM package
- **Tools esperadas**: generate_image, generate_text, etc.

## 2. @modelcontextprotocol/server-filesystem
- **Descrição**: File system operations
- **Fonte**: NPM package oficial
- **Tools esperadas**: read_file, write_file, list_directory, etc.

## 3. @modelcontextprotocol/server-github
- **Descrição**: GitHub operations
- **Fonte**: NPM package oficial
- **Tools esperadas**: create_issue, create_pull_request, search_repositories, etc.

## 4. @modelcontextprotocol/server-brave-search
- **Descrição**: Web search via Brave
- **Fonte**: NPM package oficial
- **Tools esperadas**: web_search, etc.

## 5. @modelcontextprotocol/server-postgres
- **Descrição**: PostgreSQL database operations
- **Fonte**: NPM package oficial
- **Tools esperadas**: query, list_tables, describe_table, etc.

## Comandos de Teste

```bash
# Test 1 - Pollinations
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pollinations",
    "source": "@pollinations/model-context-protocol",
    "description": "Image and text generation"
  }'

# Test 2 - Filesystem
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

# Test 3 - GitHub
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "github",
    "source": "@modelcontextprotocol/server-github",
    "description": "GitHub operations",
    "env": {
      "GITHUB_TOKEN": "your_token_here"
    }
  }'

# Test 4 - Brave Search
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "brave-search",
    "source": "@modelcontextprotocol/server-brave-search",
    "description": "Web search",
    "env": {
      "BRAVE_API_KEY": "your_key_here"
    }
  }'

# Test 5 - Postgres
curl -X POST http://localhost:3000/api/mcps/import \
  -H "Content-Type: application/json" \
  -d '{
    "name": "postgres",
    "source": "@modelcontextprotocol/server-postgres",
    "description": "PostgreSQL operations",
    "env": {
      "DATABASE_URL": "postgresql://localhost/mydb"
    }
  }'

# Get all MCPs
curl -X GET http://localhost:3000/api/mcps

# Get tools from specific MCP
curl -X GET http://localhost:3000/api/mcps/<mcp-id>/tools
```
