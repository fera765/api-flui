#!/bin/bash

###############################################################################
#
#  SCRIPT DE TESTE E2E COMPLETO DA API
#
#  Este script demonstra o fluxo completo da API funcionando:
#  1. Health Check
#  2. Criar Agent
#  3. Criar Trigger Tool
#  4. Criar Automation (Trigger → Agent)
#  5. Executar Automation
#  6. Verificar Status e Logs
#
###############################################################################

API="${API_URL:-http://localhost:3000}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           TESTE E2E COMPLETO - API AUTOMATION               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "API: $API"
echo ""

# Helper function
check_response() {
  if echo "$1" | python3 -m json.tool > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SUCCESS${NC}"
    return 0
  else
    echo -e "${RED}❌ FAILED${NC}"
    return 1
  fi
}

# 1. Health Check
echo -e "${BLUE}1️⃣  Health Check${NC}"
HEALTH=$(curl -s "$API/")
if check_response "$HEALTH"; then
  STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])")
  echo "   Status: $STATUS"
fi
echo ""

# 2. Criar Agent
echo -e "${BLUE}2️⃣  Criando Agent${NC}"
AGENT_RESULT=$(curl -s -X POST "$API/api/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E2E Test Agent",
    "description": "Agent for E2E testing",
    "prompt": "You are a helpful assistant for automated testing.",
    "defaultModel": "gpt-4",
    "tools": []
  }')

if check_response "$AGENT_RESULT"; then
  AGENT_ID=$(echo "$AGENT_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "   Agent ID: $AGENT_ID"
fi
echo ""

# 3. Criar Trigger Tool
echo -e "${BLUE}3️⃣  Criando Trigger Tool${NC}"
TRIGGER_RESULT=$(curl -s -X POST "$API/api/tools" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "manual-trigger-e2e",
    "description": "Manual trigger for E2E testing",
    "type": "trigger",
    "inputSchema": {
      "type": "object",
      "properties": {
        "data": {"type": "object"}
      }
    },
    "outputSchema": {
      "type": "object",
      "properties": {
        "output": {"type": "object"}
      }
    }
  }')

if check_response "$TRIGGER_RESULT"; then
  TRIGGER_ID=$(echo "$TRIGGER_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "   Trigger ID: $TRIGGER_ID"
fi
echo ""

# 4. Criar Automation
echo -e "${BLUE}4️⃣  Criando Automation (Trigger → Agent)${NC}"
TRIGGER_NODE="trigger-$(date +%s)"
AGENT_NODE="agent-$(date +%s)"

AUTOMATION_RESULT=$(curl -s -X POST "$API/api/automations" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"E2E Test Automation\",
    \"description\": \"Complete end-to-end test automation\",
    \"nodes\": [
      {
        \"id\": \"$TRIGGER_NODE\",
        \"type\": \"trigger\",
        \"referenceId\": \"$TRIGGER_ID\",
        \"config\": {}
      },
      {
        \"id\": \"$AGENT_NODE\",
        \"type\": \"agent\",
        \"referenceId\": \"$AGENT_ID\",
        \"config\": {}
      }
    ],
    \"links\": [
      {
        \"fromNodeId\": \"$TRIGGER_NODE\",
        \"fromOutputKey\": \"output\",
        \"toNodeId\": \"$AGENT_NODE\",
        \"toInputKey\": \"input\"
      }
    ]
  }")

if check_response "$AUTOMATION_RESULT"; then
  AUTOMATION_ID=$(echo "$AUTOMATION_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
  echo "   Automation ID: $AUTOMATION_ID"
fi
echo ""

# 5. Executar Automation
echo -e "${BLUE}5️⃣  Executando Automation${NC}"
EXECUTE_RESULT=$(curl -s -X POST "$API/api/execution/$AUTOMATION_ID/start" \
  -H "Content-Type: application/json" \
  -d "{
    \"input\": {
      \"message\": \"E2E test execution\",
      \"timestamp\": $(date +%s)
    }
  }")

if check_response "$EXECUTE_RESULT"; then
  echo "   Execution started successfully"
fi
echo ""

# 6. Aguardar execução
echo -e "${BLUE}6️⃣  Aguardando execução${NC}"
echo -n "   "
for i in {1..3}; do
  echo -n "."
  sleep 1
done
echo " done!"
echo ""

# 7. Verificar Status
echo -e "${BLUE}7️⃣  Verificando Status${NC}"
STATUS_RESULT=$(curl -s "$API/api/execution/$AUTOMATION_ID/status")

if check_response "$STATUS_RESULT"; then
  STATUS=$(echo "$STATUS_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status'])")
  COMPLETED=$(echo "$STATUS_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['completedNodes'])")
  FAILED=$(echo "$STATUS_RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['failedNodes'])")
  
  echo "   Status: $STATUS"
  echo "   Completed Nodes: $COMPLETED"
  echo "   Failed Nodes: $FAILED"
  
  if [ "$STATUS" == "completed" ] && [ "$FAILED" == "0" ]; then
    echo -e "   ${GREEN}✅ EXECUTION SUCCESSFUL!${NC}"
  else
    echo -e "   ${YELLOW}⚠️  Some nodes failed${NC}"
  fi
fi
echo ""

# 8. Verificar Logs
echo -e "${BLUE}8️⃣  Logs da Execução${NC}"
LOGS_RESULT=$(curl -s "$API/api/execution/$AUTOMATION_ID/logs")

if check_response "$LOGS_RESULT"; then
  LOGS_COUNT=$(echo "$LOGS_RESULT" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
  echo "   Total logs: $LOGS_COUNT"
  
  # Exibir logs resumidos
  echo "$LOGS_RESULT" | python3 << 'PYTHON'
import sys, json
logs = json.load(sys.stdin)
for i, log in enumerate(logs, 1):
    status = log.get('status', 'unknown')
    node_id = log.get('nodeId', 'unknown')
    duration = log.get('duration', 0)
    emoji = '✅' if status == 'completed' else '❌'
    print(f"   {emoji} Node {i}: {node_id} ({status}) - {duration}ms")
PYTHON
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ TESTE E2E COMPLETO FINALIZADO!${NC}"
echo ""
echo "Resumo:"
echo "  - Agent criado: $AGENT_ID"
echo "  - Trigger criado: $TRIGGER_ID"
echo "  - Automation criada: $AUTOMATION_ID"
echo "  - Execution: $STATUS"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo ""
