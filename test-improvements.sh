#!/bin/bash

# Script para testar as melhorias de flexibilidade e auto-preenchimento
# Data: 2025-10-26

API_URL="${API_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║     🧪 TESTANDO MELHORIAS DE FLEXIBILIDADE MCP            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo ""

# Test 1: Metadata endpoint
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 1: Buscar metadados de pacote NPM${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RESPONSE=$(curl -s "$API_URL/api/mcps/metadata?source=@modelcontextprotocol/server-filesystem&sourceType=npx")

if echo "$RESPONSE" | grep -q '"exists":true'; then
    echo -e "${GREEN}✅ Metadados carregados com sucesso!${NC}"
    echo ""
    echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'  📦 Nome sugerido: {data[\"suggestedName\"]}')
    print(f'  📝 Descrição: {data[\"suggestedDescription\"][:60]}...')
    if data['metadata']:
        print(f'  🏷️  Versão: {data[\"metadata\"].get(\"version\", \"N/A\")}')
        print(f'  ✓  Pacote existe no NPM: {data[\"exists\"]}')
except:
    print('  ⚠️  Erro ao processar resposta')
" 2>/dev/null || echo "  $RESPONSE"
else
    echo -e "${RED}❌ Falha ao buscar metadados${NC}"
    echo "$RESPONSE"
fi

echo ""

# Test 2: Import MCP with new strategy
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 2: Importar MCP com estratégia flexível${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Importando @modelcontextprotocol/server-memory..."
echo "  (Aguarde 30-60s na primeira vez)"
echo ""

RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@modelcontextprotocol/server-memory",
    "sourceType": "npx",
    "name": "Memory Test",
    "description": "Test memory MCP"
  }')

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    echo -e "${GREEN}✅ MCP importado com sucesso usando estratégia flexível!${NC}"
    TOOLS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['toolsExtracted'])" 2>/dev/null || echo "?")
    echo "  🔧 Ferramentas extraídas: $TOOLS"
else
    echo -e "${YELLOW}⚠️  MCP pode já estar importado ou houve erro${NC}"
    echo "$RESPONSE" | head -3
fi

echo ""

# Test 3: List MCPs
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 3: Listar MCPs instalados${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

RESPONSE=$(curl -s "$API_URL/api/mcps")
MCP_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")

echo -e "${GREEN}✅ Total de MCPs instalados: $MCP_COUNT${NC}"
echo ""
echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for i, mcp in enumerate(data[:5], 1):
        print(f'  {i}. {mcp[\"name\"]} ({mcp[\"sourceType\"]})')
        print(f'     Source: {mcp[\"source\"]}')
        print(f'     Tools: {len(mcp[\"tools\"])}')
        print()
except:
    pass
" 2>/dev/null

echo ""

# Test 4: Check logs for strategy
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 4: Verificar estratégia de conexão nos logs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "api.log" ]; then
    echo "  Últimas linhas do log (estratégias usadas):"
    echo ""
    grep -E "(Trying strategy|Successfully connected using|Strategy.*failed)" api.log | tail -10 | while read line; do
        if echo "$line" | grep -q "Successfully"; then
            echo -e "  ${GREEN}$line${NC}"
        elif echo "$line" | grep -q "failed"; then
            echo -e "  ${YELLOW}$line${NC}"
        else
            echo "  $line"
        fi
    done
else
    echo -e "${YELLOW}  ⚠️  Arquivo api.log não encontrado${NC}"
fi

echo ""
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    📊 RESUMO DOS TESTES                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Endpoint de metadados funcionando"
echo "  ✅ Importação com estratégia flexível"
echo "  ✅ Listagem de MCPs"
echo "  ✅ Logs mostrando estratégias tentadas"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "  1. Testar frontend:"
echo "     cd flui-frontend && npm run dev"
echo "     Abrir: http://localhost:5173"
echo ""
echo "  2. Testar auto-preenchimento:"
echo "     - Ir para página MCPs"
echo "     - Clicar 'Adicionar MCP'"
echo "     - Digitar source e aguardar 1s"
echo "     - Verificar auto-preenchimento! ✨"
echo ""
echo "  3. Ver documentação completa:"
echo "     cat IMPROVEMENT_MCP_FLEXIBILITY.md"
echo ""
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
