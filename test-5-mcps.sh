#!/bin/bash

# Test 5 different MCPs to validate the system
# Run this while backend is running: npm run dev

echo "========================================="
echo "🧪 TESTING 5 DIFFERENT MCPs"
echo "========================================="
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
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null)

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API is not running on port 3000${NC}"
    echo ""
    echo "Please start the API first in another terminal:"
    echo "  cd /workspace"
    echo "  npm run dev"
    echo ""
    echo "Then run this script again."
    exit 1
fi

echo ""

# Array to store MCP IDs for cleanup
declare -a MCP_IDS

# Test function
test_mcp() {
    local test_num=$1
    local name=$2
    local source=$3
    local description=$4
    local env_vars=$5
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST $test_num: $name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "Source: $source"
    echo "Env: ${env_vars:-none}"
    echo ""
    echo "Importing MCP... (this may take 30-60s on first run)"
    
    # Build JSON payload
    if [ -z "$env_vars" ]; then
        payload="{\"name\":\"$name\",\"source\":\"$source\",\"description\":\"$description\"}"
    else
        payload="{\"name\":\"$name\",\"source\":\"$source\",\"description\":\"$description\",\"env\":$env_vars}"
    fi
    
    # Import MCP
    response=$(curl -s -X POST "$BASE_URL/api/mcps/import" \
        -H "Content-Type: application/json" \
        -d "$payload" 2>&1)
    
    # Check if import was successful
    if echo "$response" | grep -q '"id"'; then
        mcp_id=$(echo "$response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
        tools_count=$(echo "$response" | grep -o '"toolsExtracted":[0-9]*' | cut -d':' -f2)
        
        echo -e "${GREEN}✓ SUCCESS${NC}"
        echo "  MCP ID: $mcp_id"
        echo "  Tools Extracted: $tools_count"
        
        # Store ID for cleanup
        MCP_IDS+=("$mcp_id")
        
        # Get tools
        echo ""
        echo "Tools available:"
        tools_response=$(curl -s "$BASE_URL/api/mcps/$mcp_id/tools" 2>/dev/null)
        if command -v jq >/dev/null 2>&1; then
            echo "$tools_response" | jq -r '.tools[] | "  - \(.name): \(.description // "No description")"' 2>/dev/null | head -5
        else
            echo "$tools_response" | grep -o '"name":"[^"]*' | cut -d'"' -f4 | head -5 | sed 's/^/  - /'
        fi
        
        echo ""
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        echo "Error: $response"
        echo ""
        return 1
    fi
}

# Test counters
PASSED=0
FAILED=0

# TEST 1: Memory MCP (no env vars, always works)
if test_mcp 1 "Memory MCP" "@modelcontextprotocol/server-memory" "Knowledge graph memory"; then
    PASSED=$((PASSED + 1))
else
    FAILED=$((FAILED + 1))
fi

# TEST 2: Filesystem MCP (with env var)
if test_mcp 2 "Filesystem MCP" "@modelcontextprotocol/server-filesystem" "File operations" '{"ALLOWED_DIRECTORY":"/tmp"}'; then
    PASSED=$((PASSED + 1))
else
    FAILED=$((FAILED + 1))
fi

# TEST 3: Puppeteer MCP (no env vars)
if test_mcp 3 "Puppeteer MCP" "@modelcontextprotocol/server-puppeteer" "Browser automation"; then
    PASSED=$((PASSED + 1))
else
    FAILED=$((FAILED + 1))
fi

# TEST 4: Sqlite MCP (no env vars)
if test_mcp 4 "Sqlite MCP" "@modelcontextprotocol/server-sqlite" "SQLite database operations"; then
    PASSED=$((PASSED + 1))
else
    FAILED=$((FAILED + 1))
fi

# TEST 5: Fetch MCP (no env vars)
if test_mcp 5 "Fetch MCP" "@modelcontextprotocol/server-fetch" "HTTP requests"; then
    PASSED=$((PASSED + 1))
else
    FAILED=$((FAILED + 1))
fi

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC} / 5"
echo -e "Failed: ${RED}$FAILED${NC} / 5"
echo ""

# Cleanup
if [ ${#MCP_IDS[@]} -gt 0 ]; then
    echo -e "${YELLOW}Cleaning up test MCPs...${NC}"
    for mcp_id in "${MCP_IDS[@]}"; do
        curl -s -X DELETE "$BASE_URL/api/mcps/$mcp_id" >/dev/null 2>&1
        echo "  ✓ Deleted $mcp_id"
    done
    echo ""
fi

# Final result
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✅ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "🎉 MCP system is working perfectly with multiple packages!"
    echo ""
    echo "System is flexible and supports:"
    echo "  ✓ NPX packages with different executable names"
    echo "  ✓ Packages with env variables"
    echo "  ✓ Packages without env variables"
    echo "  ✓ Multiple concurrent MCPs"
    echo ""
    echo "Ready for production! 🚀"
    exit 0
else
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "Check backend logs for details."
    echo "Common issues:"
    echo "  1. Internet connection required for first install"
    echo "  2. NPX must be installed (comes with npm)"
    echo "  3. Some packages may not be available in your region"
    exit 1
fi
