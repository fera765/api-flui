#!/bin/bash

# Quick test for MCP import
# Tests with Memory MCP (no API keys required)

echo "🧪 QUICK MCP TEST"
echo "================="
echo ""

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if API is running
echo -n "Checking API status... "
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not running${NC}"
    echo ""
    echo "Please start the API first:"
    echo "  cd /workspace"
    echo "  npm run dev"
    exit 1
fi

echo ""
echo -e "${BLUE}Importing Memory MCP (no API keys needed)...${NC}"
echo ""

# Import Memory MCP
response=$(curl -s -X POST "$BASE_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Memory Test",
    "source": "@modelcontextprotocol/server-memory",
    "description": "Quick test MCP"
  }')

# Check if import was successful
if echo "$response" | grep -q '"id"'; then
    echo -e "${GREEN}✓ MCP imported successfully!${NC}"
    echo ""
    
    # Extract details
    tools_count=$(echo "$response" | grep -o '"toolsExtracted":[0-9]*' | cut -d':' -f2)
    mcp_id=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    
    echo "Details:"
    echo "  MCP ID: $mcp_id"
    echo "  Tools Extracted: $tools_count"
    echo ""
    
    if [ -n "$mcp_id" ]; then
        echo -e "${BLUE}Fetching tools...${NC}"
        tools_response=$(curl -s "$BASE_URL/api/mcps/$mcp_id/tools")
        
        echo "$tools_response" | jq '.tools[] | {name: .name, description: .description}' 2>/dev/null || echo "$tools_response"
        
        echo ""
        echo -e "${YELLOW}Cleaning up test MCP...${NC}"
        curl -s -X DELETE "$BASE_URL/api/mcps/$mcp_id" > /dev/null
        echo -e "${GREEN}✓ Test MCP deleted${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ MCP System is working correctly!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Try frontend: http://localhost:5173/mcps"
    echo "  2. Import other MCPs from the list"
    echo "  3. View all tools: http://localhost:5173/tools"
    echo ""
    echo "Recommended MCPs to try:"
    echo "  • @modelcontextprotocol/server-filesystem"
    echo "  • @modelcontextprotocol/server-github (needs token)"
    echo "  • @modelcontextprotocol/server-puppeteer"
    
else
    echo -e "${RED}✗ MCP import failed${NC}"
    echo ""
    echo "Error details:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
    echo "Common issues:"
    echo "  1. Wrong package name (use full @org/name format)"
    echo "  2. No internet connection"
    echo "  3. NPM/NPX not installed"
    echo ""
    echo "See MCP_PACKAGES_LIST.md for correct package names"
    exit 1
fi
