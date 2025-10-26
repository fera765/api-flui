#!/bin/bash

# 🎯 AUTO TEST RUNNER - FINAL COMPLETE
# Script para teste final 100% completo

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/src/tests/results/final"
SERVER_LOG="$LOG_DIR/server.log"
TEST_LOG="$LOG_DIR/test-execution.log"
PID_FILE="$LOG_DIR/server.pid"
PORT=3333

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                🎯 AUTO TEST RUNNER - FINAL COMPLETE                         ║${NC}"
echo -e "${MAGENTA}║                100% Cobertura | Zero Simulações | Produção Ready            ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

mkdir -p "$LOG_DIR"

cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f "$PID_FILE" ]; then
        SERVER_PID=$(cat "$PID_FILE")
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping server (PID: $SERVER_PID)...${NC}"
            kill $SERVER_PID 2>/dev/null || true
            sleep 2
            if ps -p $SERVER_PID > /dev/null 2>&1; then
                kill -9 $SERVER_PID 2>/dev/null || true
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    fuser -k $PORT/tcp 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# Check port
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT in use. Cleaning up...${NC}"
    fuser -k $PORT/tcp 2>/dev/null || true
    sleep 2
fi

# Build
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build > "$LOG_DIR/build.log" 2>&1 || {
    echo -e "${RED}❌ Build failed! Check $LOG_DIR/build.log${NC}"
    cat "$LOG_DIR/build.log"
    exit 1
}

# Fix imports
echo -e "${BLUE}🔧 Fixing compiled imports...${NC}"
./fix-dist-imports.sh > "$LOG_DIR/fix-imports.log" 2>&1

# Start server
echo -e "${GREEN}🚀 Starting server on port $PORT...${NC}"
NODE_ENV=test PORT=$PORT node dist/index.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"
echo -e "${GREEN}   Server PID: $SERVER_PID${NC}"

# Watchdog
watchdog() {
    local max_wait=$1
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        if ! ps -p $SERVER_PID > /dev/null 2>&1; then
            echo -e "${RED}❌ Server crashed! Check logs:${NC}"
            tail -20 "$SERVER_LOG"
            return 1
        fi
        
        if curl -s http://localhost:$PORT/ > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is responding!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Waiting for server... (${waited}s/${max_wait}s)${NC}"
        sleep 2
        waited=$((waited + 2))
    done
    
    echo -e "${RED}❌ Server timeout!${NC}"
    return 1
}

if ! watchdog 30; then
    exit 1
fi

sleep 2

# Execute FINAL tests
echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║                   🎯 Running FINAL Complete Tests...                        ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""

BASE_URL="http://localhost:$PORT" npx ts-node -r tsconfig-paths/register src/tests/auto-test-runner-final.ts 2>&1 | tee "$TEST_LOG"
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════════════════╗${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉🎉🎉 100% SUCCESS - API READY FOR PRODUCTION! 🎉🎉🎉${NC}"
else
    echo -e "${RED}❌ Final tests had failures. Check logs for details.${NC}"
fi

echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}📊 Final Reports:${NC}"
echo -e "   📄 JSON: $LOG_DIR/test-report.json"
echo -e "   📄 LOG:  $LOG_DIR/test-report.log"
echo -e "   📄 Execution: $TEST_LOG"
echo ""

exit $TEST_EXIT_CODE
