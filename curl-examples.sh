#!/bin/bash

# ============================================================
# CURL Examples for Manual API Testing
# ============================================================
# Make sure the API is running first: npm run dev
# Then run individual curl commands or this entire script
# ============================================================

BASE_URL="http://localhost:3000"

echo "========================================="
echo "  API Manual Testing with CURL"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

section() {
  echo ""
  echo -e "${BLUE}========================================="
  echo -e "$1"
  echo -e "=========================================${NC}"
  echo ""
}

# ============================================================
section "1. HEALTH CHECK"
# ============================================================

echo -e "${YELLOW}GET / - Health Check${NC}"
curl -X GET "$BASE_URL/" | jq '.'
echo ""

# ============================================================
section "2. SYSTEM CONFIGURATION"
# ============================================================

echo -e "${YELLOW}POST /api/setting - Create Config${NC}"
curl -X POST "$BASE_URL/api/setting" \
  -H "Content-Type: application/json" \
  -d '{
    "llmProvider": "openai",
    "apiKey": "sk-test-key-12345",
    "model": "gpt-4",
    "temperature": 0.7,
    "maxTokens": 2000
  }' | jq '.'
echo ""

echo -e "${YELLOW}GET /api/setting - Get Config${NC}"
curl -X GET "$BASE_URL/api/setting" | jq '.'
echo ""

echo -e "${YELLOW}PATCH /api/setting - Update Config${NC}"
curl -X PATCH "$BASE_URL/api/setting" \
  -H "Content-Type: application/json" \
  -d '{
    "temperature": 0.9
  }' | jq '.'
echo ""

# ============================================================
section "3. MODELS"
# ============================================================

echo -e "${YELLOW}GET /api/models - List Available Models${NC}"
curl -X GET "$BASE_URL/api/models" | jq '.'
echo ""

# ============================================================
section "4. AGENTS"
# ============================================================

echo -e "${YELLOW}POST /api/agents - Create Agent${NC}"
AGENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Agent",
    "description": "Handles customer inquiries",
    "instructions": "You are a friendly customer support agent. Help users with their questions.",
    "model": "gpt-4",
    "temperature": 0.7
  }')
echo "$AGENT_RESPONSE" | jq '.'
AGENT_ID=$(echo "$AGENT_RESPONSE" | jq -r '.id')
echo ""

echo -e "${YELLOW}GET /api/agents - List All Agents${NC}"
curl -X GET "$BASE_URL/api/agents" | jq '.'
echo ""

echo -e "${YELLOW}GET /api/agents/:id - Get Agent by ID${NC}"
curl -X GET "$BASE_URL/api/agents/$AGENT_ID" | jq '.'
echo ""

echo -e "${YELLOW}PATCH /api/agents/:id - Update Agent${NC}"
curl -X PATCH "$BASE_URL/api/agents/$AGENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated: Handles all customer inquiries and complaints"
  }' | jq '.'
echo ""

# ============================================================
section "5. TOOLS"
# ============================================================

echo -e "${YELLOW}POST /api/tools - Create HTTP Request Tool${NC}"
HTTP_TOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tools" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Fetch User Data",
    "description": "Gets user data from JSONPlaceholder API",
    "type": "http_request",
    "config": {
      "method": "GET",
      "url": "https://jsonplaceholder.typicode.com/users/1",
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }')
echo "$HTTP_TOOL_RESPONSE" | jq '.'
HTTP_TOOL_ID=$(echo "$HTTP_TOOL_RESPONSE" | jq -r '.id')
echo ""

echo -e "${YELLOW}POST /api/tools - Create Webhook Tool${NC}"
WEBHOOK_TOOL_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tools" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Order Webhook",
    "description": "Receives order notifications",
    "type": "webhook",
    "config": {
      "method": "POST",
      "responseType": "json"
    }
  }')
echo "$WEBHOOK_TOOL_RESPONSE" | jq '.'
WEBHOOK_TOOL_ID=$(echo "$WEBHOOK_TOOL_RESPONSE" | jq -r '.id')
echo ""

echo -e "${YELLOW}GET /api/tools - List All Tools${NC}"
curl -X GET "$BASE_URL/api/tools" | jq '.'
echo ""

echo -e "${YELLOW}GET /api/tools/:id - Get Tool by ID${NC}"
curl -X GET "$BASE_URL/api/tools/$HTTP_TOOL_ID" | jq '.'
echo ""

echo -e "${YELLOW}POST /api/tools/:id/execute - Execute Tool${NC}"
curl -X POST "$BASE_URL/api/tools/$HTTP_TOOL_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{"input": {}}' | jq '.'
echo ""

# ============================================================
section "6. AUTOMATIONS - Manual Trigger"
# ============================================================

echo -e "${YELLOW}POST /api/automations - Create Manual Automation${NC}"
MANUAL_AUTO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Fetch and Process User Data\",
    \"description\": \"Gets user data and processes it\",
    \"trigger\": {
      \"type\": \"manual\"
    },
    \"nodes\": [
      {
        \"id\": \"fetch-user\",
        \"type\": \"tool\",
        \"toolId\": \"$HTTP_TOOL_ID\",
        \"config\": {},
        \"next\": []
      }
    ]
  }")
echo "$MANUAL_AUTO_RESPONSE" | jq '.'
MANUAL_AUTO_ID=$(echo "$MANUAL_AUTO_RESPONSE" | jq -r '.id')
echo ""

echo -e "${YELLOW}POST /api/automations/:id/execute - Execute Automation${NC}"
curl -X POST "$BASE_URL/api/automations/$MANUAL_AUTO_ID/execute" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

# ============================================================
section "7. AUTOMATIONS - Webhook Trigger"
# ============================================================

echo -e "${YELLOW}POST /api/automations - Create Webhook Automation${NC}"
WEBHOOK_AUTO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Order Processing Automation\",
    \"description\": \"Processes incoming orders\",
    \"trigger\": {
      \"type\": \"webhook\",
      \"toolId\": \"$WEBHOOK_TOOL_ID\"
    },
    \"nodes\": [
      {
        \"id\": \"fetch-details\",
        \"type\": \"tool\",
        \"toolId\": \"$HTTP_TOOL_ID\",
        \"config\": {},
        \"next\": []
      }
    ]
  }")
echo "$WEBHOOK_AUTO_RESPONSE" | jq '.'
WEBHOOK_AUTO_ID=$(echo "$WEBHOOK_AUTO_RESPONSE" | jq -r '.id')
echo ""

echo -e "${YELLOW}POST /api/webhooks/:toolId - Trigger Webhook${NC}"
curl -X POST "$BASE_URL/api/webhooks/$WEBHOOK_TOOL_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-12345",
    "customerId": "CUST-678",
    "amount": 99.99,
    "items": ["item1", "item2"]
  }' | jq '.'
echo ""

# ============================================================
section "8. AUTOMATIONS - Cron Trigger"
# ============================================================

echo -e "${YELLOW}POST /api/automations - Create Scheduled Automation${NC}"
CRON_AUTO_RESPONSE=$(curl -s -X POST "$BASE_URL/api/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Daily Data Sync\",
    \"description\": \"Syncs data every day at midnight\",
    \"trigger\": {
      \"type\": \"cron\",
      \"schedule\": \"0 0 * * *\"
    },
    \"nodes\": [
      {
        \"id\": \"sync-data\",
        \"type\": \"tool\",
        \"toolId\": \"$HTTP_TOOL_ID\",
        \"config\": {},
        \"next\": []
      }
    ]
  }")
echo "$CRON_AUTO_RESPONSE" | jq '.'
CRON_AUTO_ID=$(echo "$CRON_AUTO_RESPONSE" | jq -r '.id')
echo ""

# ============================================================
section "9. AUTOMATIONS - Complex Multi-Node Workflow"
# ============================================================

echo -e "${YELLOW}POST /api/automations - Create Complex Automation${NC}"
curl -X POST "$BASE_URL/api/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Customer Onboarding Workflow\",
    \"description\": \"Complete customer onboarding process\",
    \"trigger\": {
      \"type\": \"manual\"
    },
    \"nodes\": [
      {
        \"id\": \"fetch-customer\",
        \"type\": \"tool\",
        \"toolId\": \"$HTTP_TOOL_ID\",
        \"config\": {},
        \"next\": [\"validate-data\"]
      },
      {
        \"id\": \"validate-data\",
        \"type\": \"agent\",
        \"agentId\": \"$AGENT_ID\",
        \"config\": {
          \"prompt\": \"Validate this customer data: {{fetch-customer.output}}\"
        },
        \"next\": [\"send-welcome\"]
      },
      {
        \"id\": \"send-welcome\",
        \"type\": \"agent\",
        \"agentId\": \"$AGENT_ID\",
        \"config\": {
          \"prompt\": \"Generate a welcome message for: {{fetch-customer.output}}\"
        },
        \"next\": []
      }
    ]
  }" | jq '.'
echo ""

# ============================================================
section "10. AUTOMATIONS CRUD"
# ============================================================

echo -e "${YELLOW}GET /api/automations - List All Automations${NC}"
curl -X GET "$BASE_URL/api/automations" | jq '.'
echo ""

echo -e "${YELLOW}GET /api/automations/:id - Get Automation by ID${NC}"
curl -X GET "$BASE_URL/api/automations/$MANUAL_AUTO_ID" | jq '.'
echo ""

echo -e "${YELLOW}PATCH /api/automations/:id - Update Automation${NC}"
curl -X PATCH "$BASE_URL/api/automations/$MANUAL_AUTO_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated: Fetches and analyzes user data"
  }' | jq '.'
echo ""

# ============================================================
section "11. EXECUTION TRACKING"
# ============================================================

echo -e "${YELLOW}POST /api/execution/:automationId/start - Start Execution${NC}"
curl -X POST "$BASE_URL/api/execution/$MANUAL_AUTO_ID/start" \
  -H "Content-Type: application/json" \
  -d '{}' | jq '.'
echo ""

sleep 2

echo -e "${YELLOW}GET /api/execution/:automationId/status - Get Execution Status${NC}"
curl -X GET "$BASE_URL/api/execution/$MANUAL_AUTO_ID/status" | jq '.'
echo ""

echo -e "${YELLOW}GET /api/execution/:automationId/logs - Get Execution Logs${NC}"
curl -X GET "$BASE_URL/api/execution/$MANUAL_AUTO_ID/logs" | jq '.'
echo ""

# ============================================================
section "12. MCPS"
# ============================================================

echo -e "${YELLOW}GET /api/mcps - List All MCPs${NC}"
curl -X GET "$BASE_URL/api/mcps" | jq '.'
echo ""

# ============================================================
section "13. CLEANUP - Delete Resources"
# ============================================================

echo -e "${YELLOW}DELETE /api/automations/:id - Delete Automations${NC}"
curl -X DELETE "$BASE_URL/api/automations/$MANUAL_AUTO_ID" -w "\nStatus: %{http_code}\n"
curl -X DELETE "$BASE_URL/api/automations/$WEBHOOK_AUTO_ID" -w "\nStatus: %{http_code}\n"
curl -X DELETE "$BASE_URL/api/automations/$CRON_AUTO_ID" -w "\nStatus: %{http_code}\n"
echo ""

echo -e "${YELLOW}DELETE /api/tools/:id - Delete Tools${NC}"
curl -X DELETE "$BASE_URL/api/tools/$HTTP_TOOL_ID" -w "\nStatus: %{http_code}\n"
curl -X DELETE "$BASE_URL/api/tools/$WEBHOOK_TOOL_ID" -w "\nStatus: %{http_code}\n"
echo ""

echo -e "${YELLOW}DELETE /api/agents/:id - Delete Agent${NC}"
curl -X DELETE "$BASE_URL/api/agents/$AGENT_ID" -w "\nStatus: %{http_code}\n"
echo ""

# ============================================================
section "DONE!"
# ============================================================

echo -e "${GREEN}✓ All curl examples completed!${NC}"
echo ""
