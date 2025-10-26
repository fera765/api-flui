#!/bin/bash

# Script para testar a correção de timeout
# Testa especificamente pacotes que falhavam com 10s

API_URL="${API_URL:-http://localhost:3000}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     🧪 TESTANDO CORREÇÃO DE TIMEOUT (10s → 45s)         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo ""

# Test 1: Pollinations (pacote que falhava)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 1: Importar @pollinations/model-context-protocol${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}⏱️  Este pacote pode demorar 30-60s na primeira vez...${NC}"
echo ""

START_TIME=$(date +%s)

RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@pollinations/model-context-protocol",
    "sourceType": "npx",
    "name": "Pollinations MCP",
    "description": "Multimodal AI generation"
  }')

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo ""
echo -e "⏱️  Tempo decorrido: ${DURATION}s"
echo ""

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    TOOLS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['toolsExtracted'])" 2>/dev/null || echo "?")
    echo -e "${GREEN}✅ SUCESSO! MCP importado em ${DURATION}s${NC}"
    echo -e "${GREEN}   Ferramentas extraídas: $TOOLS${NC}"
    
    if [ $DURATION -gt 10 ]; then
        echo -e "${GREEN}   ✓ Funcionou com timeout maior que 10s!${NC}"
    fi
elif echo "$RESPONSE" | grep -q "timeout"; then
    echo -e "${RED}❌ FALHOU: Ainda dando timeout${NC}"
    echo "$RESPONSE" | grep -i "timeout"
else
    echo -e "${YELLOW}⚠️  Resposta inesperada:${NC}"
    echo "$RESPONSE" | head -5
fi

echo ""
echo ""

# Test 2: Check logs for strategies
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 2: Verificar estratégias usadas nos logs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if [ -f "api.log" ]; then
    echo "Últimas estratégias tentadas:"
    echo ""
    
    # Buscar logs relacionados ao pollinations
    grep -A 5 "@pollinations/model-context-protocol" api.log | tail -20 | while read line; do
        if echo "$line" | grep -q "Trying strategy"; then
            echo -e "${BLUE}  $line${NC}"
        elif echo "$line" | grep -q "Successfully connected"; then
            echo -e "${GREEN}  ✅ $line${NC}"
        elif echo "$line" | grep -q "failed"; then
            echo -e "${RED}  ❌ $line${NC}"
        else
            echo "  $line"
        fi
    done
else
    echo -e "${YELLOW}⚠️  Arquivo api.log não encontrado${NC}"
fi

echo ""
echo ""

# Test 3: Other packages (quick test)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST 3: Testar pacotes rápidos (validação)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test memory MCP (rápido)
echo "Testando @modelcontextprotocol/server-memory..."
START_TIME=$(date +%s)

RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@modelcontextprotocol/server-memory",
    "sourceType": "npx",
    "name": "Memory Test",
    "description": "Knowledge graph"
  }')

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    echo -e "${GREEN}✅ Memory MCP: ${DURATION}s${NC}"
else
    echo -e "${YELLOW}⚠️  Memory MCP pode já estar importado${NC}"
fi

echo ""
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    📊 RESUMO DOS TESTES                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "  ANTES DA CORREÇÃO:"
echo "    • Timeout: 10s fixo"
echo "    • @pollinations/*: ❌ Falhava"
echo ""
echo "  DEPOIS DA CORREÇÃO:"
echo "    • Timeout: 30-45s variável"
echo "    • @pollinations/*: ✅ Deve funcionar"
echo "    • 3 estratégias ao invés de 2"
echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "  1. Se o teste falhou, verificar:"
echo "     tail -f api.log"
echo ""
echo "  2. Ver documentação completa:"
echo "     cat FIX_TIMEOUT_ISSUE.md"
echo ""
echo "  3. Testar no frontend:"
echo "     cd flui-frontend && npm run dev"
echo "     Abrir: http://localhost:5173"
echo ""
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
