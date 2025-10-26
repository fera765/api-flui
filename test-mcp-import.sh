#!/bin/bash

# Test MCP Import with Real MCPs
# This script tests the MCP import functionality with various real MCPs

API_URL="http://localhost:3000"
RESULTS_FILE="mcp-test-results.txt"

echo "🧪 Testing MCP Import with Real MCPs" > $RESULTS_FILE
echo "=====================================" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_mcp() {
  local name=$1
  local source=$2
  local description=$3
  local env_json=$4
  
  echo -e "${YELLOW}Testing: $name${NC}"
  echo "Testing: $name" >> $RESULTS_FILE
  echo "Source: $source" >> $RESULTS_FILE
  
  # Build JSON payload
  if [ -z "$env_json" ]; then
    payload="{\"name\":\"$name\",\"source\":\"$source\",\"description\":\"$description\"}"
  else
    payload="{\"name\":\"$name\",\"source\":\"$source\",\"description\":\"$description\",\"env\":$env_json}"
  fi
  
  echo "Payload: $payload" >> $RESULTS_FILE
  
  # Import MCP
  response=$(curl -s -X POST "$API_URL/api/mcps/import" \
    -H "Content-Type: application/json" \
    -d "$payload")
  
  echo "Response: $response" >> $RESULTS_FILE
  
  # Check if successful
  if echo "$response" | grep -q '"toolsExtracted"'; then
    tools_count=$(echo "$response" | grep -o '"toolsExtracted":[0-9]*' | grep -o '[0-9]*')
    mcp_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    echo -e "${GREEN}✓ Success! Tools extracted: $tools_count${NC}"
    echo "✓ Success! Tools extracted: $tools_count" >> $RESULTS_FILE
    echo "MCP ID: $mcp_id" >> $RESULTS_FILE
    
    # Get tools details
    if [ ! -z "$mcp_id" ]; then
      echo "Getting tools details..." >> $RESULTS_FILE
      tools_response=$(curl -s -X GET "$API_URL/api/mcps/$mcp_id/tools")
      echo "Tools: $tools_response" >> $RESULTS_FILE
      
      # Pretty print tool names
      tool_names=$(echo "$tools_response" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
      echo "Tool names:" >> $RESULTS_FILE
      echo "$tool_names" | while read -r tool; do
        echo "  - $tool" >> $RESULTS_FILE
      done
    fi
  else
    echo -e "${RED}✗ Failed!${NC}"
    echo "✗ Failed!" >> $RESULTS_FILE
  fi
  
  echo "" >> $RESULTS_FILE
  echo "---" >> $RESULTS_FILE
  echo "" >> $RESULTS_FILE
  sleep 2
}

# Test 1: Pollinations
echo ""
echo "Test 1: Pollinations AI"
test_mcp "pollinations" \
  "@pollinations/model-context-protocol" \
  "Image and text generation via Pollinations AI" \
  ""

# Get list of all MCPs
echo ""
echo -e "${YELLOW}Getting all MCPs...${NC}"
all_mcps=$(curl -s -X GET "$API_URL/api/mcps")
echo "All MCPs:" >> $RESULTS_FILE
echo "$all_mcps" | jq '.' >> $RESULTS_FILE 2>/dev/null || echo "$all_mcps" >> $RESULTS_FILE
echo "" >> $RESULTS_FILE

echo ""
echo -e "${GREEN}Tests completed! Check $RESULTS_FILE for details${NC}"
cat $RESULTS_FILE
