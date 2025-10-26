#!/bin/bash

# EXECUTE ESTE SCRIPT ENQUANTO O BACKEND ESTÁ RODANDO
# npm run dev deve estar ativo em outro terminal

echo "========================================="
echo "🧪 TESTING 5 MCPs - MANUAL VERSION"
echo "========================================="
echo ""

# Detect API port
API_URL="http://localhost:3000"

# Test which port is working
echo "Detecting API port..."
if curl -s "$API_URL/api/health" >/dev/null 2>&1; then
    echo "✓ API found on port 3000"
elif curl -s "http://localhost:26053/api/health" >/dev/null 2>&1; then
    API_URL="http://localhost:26053"
    echo "✓ API found on port 26053"
else
    echo "❌ API not responding on port 3000 or 26053"
    echo ""
    echo "Please make sure backend is running:"
    echo "  cd /workspace"
    echo "  npm run dev"
    exit 1
fi

echo "Using API_URL: $API_URL"
echo ""

# TEST 1: Memory MCP
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Memory MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Memory MCP",
    "source": "@modelcontextprotocol/server-memory",
    "description": "Knowledge graph memory"
  }'
echo ""
echo ""
sleep 5

# TEST 2: Filesystem MCP
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Filesystem MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Filesystem MCP",
    "source": "@modelcontextprotocol/server-filesystem",
    "description": "File operations",
    "env": {"ALLOWED_DIRECTORY": "/tmp"}
  }'
echo ""
echo ""
sleep 5

# TEST 3: Puppeteer MCP
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Puppeteer MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Puppeteer MCP",
    "source": "@modelcontextprotocol/server-puppeteer",
    "description": "Browser automation"
  }'
echo ""
echo ""
sleep 5

# TEST 4: Pollinations MCP
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Pollinations MCP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pollinations MCP",
    "source": "@pollinations/model-context-protocol",
    "description": "AI image generation"
  }'
echo ""
echo ""
sleep 5

# TEST 5: Brave Search MCP
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Brave Search MCP (may fail without API key)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Brave Search MCP",
    "source": "@modelcontextprotocol/server-brave-search",
    "description": "Web search"
  }'
echo ""
echo ""

# List all MCPs
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ALL MCPs IMPORTED:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_URL/api/mcps" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/api/mcps"
echo ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "ALL TOOLS (System + MCP):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s "$API_URL/api/all-tools" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f\"Total tools: {data['total']}\"); print(f\"System: {data['sources']['system']}\"); print(f\"MCP: {data['sources']['mcp']}\"); print('\nTools:'); [print(f\"  - {t['name']}\") for t in data['tools'][:20]]" 2>/dev/null || echo "See all tools in response"

echo ""
echo "✅ TESTING COMPLETE!"
echo ""
echo "Check backend terminal for detailed logs including:"
echo "  [MCP] Discovering executable for package: ..."
echo "  [MCP] Querying NPM for bin name: ..."
echo "  [MCP] Found bin name: ..."
echo "  [MCP] Successfully connected to ..."
