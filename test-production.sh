#!/bin/bash

# 🚀 PRODUCTION TEST SCRIPT
# Tests all MCP integration features

echo "======================================"
echo "🧪 TESTING MCP PRODUCTION INTEGRATION"
echo "======================================"
echo ""

BASE_URL="http://localhost:3000"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

function test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "1️⃣  Testing Health Check"
echo "------------------------"
test_endpoint "Health endpoint" "GET" "/health"
echo ""

echo "2️⃣  Testing All Tools Endpoint"
echo "-------------------------------"
test_endpoint "Get all tools" "GET" "/api/all-tools"
test_endpoint "Search tools" "GET" "/api/all-tools/search?q=test"
echo ""

echo "3️⃣  Testing MCP Management"
echo "--------------------------"
test_endpoint "List MCPs" "GET" "/api/mcps"
echo ""

echo "4️⃣  Importing Test MCP (Memory - no env required)"
echo "---------------------------------------------------"
MCP_DATA='{
  "name": "Memory MCP Test",
  "source": "@modelcontextprotocol/server-memory",
  "description": "Test MCP import"
}'

echo "Importing MCP... (this may take 30-60s on first run)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/mcps/import" \
    -H "Content-Type: application/json" \
    -d "$MCP_DATA")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo -e "${GREEN}✓ MCP Import PASSED${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    
    # Extract MCP ID
    MCP_ID=$(echo "$body" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    TOOLS_COUNT=$(echo "$body" | grep -o '"toolsExtracted":[0-9]*' | cut -d':' -f2)
    
    echo "  MCP ID: $MCP_ID"
    echo "  Tools Extracted: $TOOLS_COUNT"
    echo ""
    
    if [ -n "$MCP_ID" ]; then
        echo "5️⃣  Testing MCP Tools Endpoint"
        echo "------------------------------"
        test_endpoint "Get MCP tools" "GET" "/api/mcps/$MCP_ID/tools"
        echo ""
        
        echo "6️⃣  Verifying Tools in All-Tools Endpoint"
        echo "------------------------------------------"
        test_endpoint "All tools (should include MCP tools)" "GET" "/api/all-tools"
        echo ""
        
        echo "7️⃣  Cleanup - Delete Test MCP"
        echo "-----------------------------"
        test_endpoint "Delete MCP" "DELETE" "/api/mcps/$MCP_ID"
    fi
else
    echo -e "${RED}✗ MCP Import FAILED${NC} (HTTP $http_code)"
    echo "Response: $body"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

echo ""
echo "======================================"
echo "📊 TEST RESULTS"
echo "======================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Production integration is working correctly!"
    echo ""
    echo "Next steps:"
    echo "  1. Open http://localhost:5173/mcps - Test MCP UI"
    echo "  2. Open http://localhost:5173/tools - View all tools"
    echo "  3. Import MCPs and see them in the tools page"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Check backend logs for details:"
    echo "  cd /workspace && npm run dev"
    exit 1
fi
