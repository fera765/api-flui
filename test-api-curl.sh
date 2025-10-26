#!/bin/bash

# =========================================
# 🧪 TESTING API WITH CURL - COMPREHENSIVE TEST
# =========================================

API_URL="http://localhost:3000"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_test() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo ""
echo "========================================="
echo "🧪 API TESTING WITH CURL"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Test 1: Import Memory MCP
print_test "TEST 1: Importing Memory MCP (NPX)"
RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@modelcontextprotocol/server-memory",
    "sourceType": "npx",
    "name": "Memory MCP Test",
    "description": "Knowledge graph memory"
  }')

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    TOOLS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['toolsExtracted'])" 2>/dev/null || echo "?")
    print_success "Memory MCP imported successfully! Tools: $TOOLS"
else
    print_error "Failed to import Memory MCP"
    echo "$RESPONSE"
fi
echo ""

# Test 2: Import Filesystem MCP
print_test "TEST 2: Importing Filesystem MCP (NPX)"
RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@modelcontextprotocol/server-filesystem",
    "sourceType": "npx",
    "name": "Filesystem MCP Test",
    "description": "File operations",
    "args": ["/tmp"]
  }')

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    TOOLS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['toolsExtracted'])" 2>/dev/null || echo "?")
    print_success "Filesystem MCP imported successfully! Tools: $TOOLS"
else
    print_error "Failed to import Filesystem MCP"
    echo "$RESPONSE"
fi
echo ""

# Test 3: Import GitHub MCP
print_test "TEST 3: Importing GitHub MCP (NPX)"
RESPONSE=$(curl -s -X POST "$API_URL/api/mcps/import" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "@modelcontextprotocol/server-github",
    "sourceType": "npx",
    "name": "GitHub MCP Test",
    "description": "GitHub operations"
  }')

if echo "$RESPONSE" | grep -q '"toolsExtracted"'; then
    TOOLS=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['toolsExtracted'])" 2>/dev/null || echo "?")
    print_success "GitHub MCP imported successfully! Tools: $TOOLS"
else
    print_error "Failed to import GitHub MCP"
    echo "$RESPONSE"
fi
echo ""

# Test 4: List all MCPs
print_test "TEST 4: Listing all MCPs"
RESPONSE=$(curl -s "$API_URL/api/mcps")
MCP_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
print_success "Total MCPs: $MCP_COUNT"
echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); [print(f\"  - {m['name']} ({m['sourceType']}): {len(m['tools'])} tools\") for m in data[:5]]" 2>/dev/null
echo ""

# Test 5: List all tools
print_test "TEST 5: Listing all tools"
RESPONSE=$(curl -s "$API_URL/api/all-tools")
TOTAL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['total'])" 2>/dev/null || echo "0")
print_success "Total tools: $TOTAL"
echo "$RESPONSE" | python3 -c "import sys,json; data=json.load(sys.stdin); [print(f\"  - {t['name']}\") for t in data['tools'][:10]]" 2>/dev/null
echo ""

# Test 6: Create automation
print_test "TEST 6: Creating automation with MCP tool"
# Get a tool ID first
TOOL_ID=$(curl -s "$API_URL/api/all-tools" | python3 -c "import sys,json; data=json.load(sys.stdin); tool=[t for t in data['tools'] if 'read' in t['name'].lower()][0]; print(tool['id'])" 2>/dev/null)

if [ -n "$TOOL_ID" ]; then
    RESPONSE=$(curl -s -X POST "$API_URL/api/automations" \
      -H "Content-Type: application/json" \
      -d "{
        \"name\": \"Test Automation\",
        \"description\": \"Test automation with MCP\",
        \"nodes\": [
          {
            \"id\": \"node1\",
            \"type\": \"trigger\",
            \"referenceId\": \"webhook\"
          },
          {
            \"id\": \"node2\",
            \"type\": \"tool\",
            \"referenceId\": \"$TOOL_ID\",
            \"config\": {\"arguments\": {}}
          }
        ],
        \"links\": []
      }")
    
    if echo "$RESPONSE" | grep -q '"id"'; then
        AUTO_ID=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
        print_success "Automation created! ID: $AUTO_ID"
    else
        print_error "Failed to create automation"
        echo "$RESPONSE"
    fi
else
    print_error "Could not find a tool to create automation"
fi
echo ""

# Test 7: Delete an MCP
print_test "TEST 7: Deleting an MCP"
MCP_ID=$(curl -s "$API_URL/api/mcps" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data[-1]['id'] if data else '')" 2>/dev/null)

if [ -n "$MCP_ID" ]; then
    curl -s -X DELETE "$API_URL/api/mcps/$MCP_ID" > /dev/null
    print_success "MCP deleted: $MCP_ID"
    
    # Verify deletion
    NEW_COUNT=$(curl -s "$API_URL/api/mcps" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    print_success "Remaining MCPs: $NEW_COUNT"
else
    print_warning "No MCP to delete"
fi
echo ""

# Summary
print_test "SUMMARY"
RESPONSE=$(curl -s "$API_URL/api/mcps")
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
unique = {}
[unique.update({m['name']: m}) for m in data]
print(f'📊 Total unique MCPs: {len(unique)}')
total_tools = sum(len(m['tools']) for m in unique.values())
print(f'🔧 Total MCP tools: {total_tools}')
" 2>/dev/null

RESPONSE=$(curl -s "$API_URL/api/all-tools")
echo "$RESPONSE" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"🎯 Total tools (System + MCP): {data['total']}\")
print(f\"📦 Sources: {', '.join(data['sources'])}\")
" 2>/dev/null

echo ""
echo "========================================="
echo "✅ TESTING COMPLETE!"
echo "========================================="
echo ""
echo "📄 Full results saved in: TEST_CURL_RESULTS.md"
echo "📋 Check API logs: tail -f api.log"
echo ""
