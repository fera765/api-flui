#!/bin/bash

# 🧠 AUTO TEST RUNNER ORCHESTRATOR
# Script para inicializar servidor e executar testes automatizados

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/src/tests/results"
SERVER_LOG="$LOG_DIR/server.log"
TEST_LOG="$LOG_DIR/test-execution.log"
PID_FILE="$LOG_DIR/server.pid"
PORT=3333
TIMEOUT=120  # 2 minutos de timeout por segurança

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧠 AUTO TEST RUNNER - ORCHESTRATOR${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Criar diretório de logs
mkdir -p "$LOG_DIR"

# Função de limpeza
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"
    if [ -f "$PID_FILE" ]; then
        SERVER_PID=$(cat "$PID_FILE")
        if ps -p $SERVER_PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping server (PID: $SERVER_PID)...${NC}"
            kill $SERVER_PID 2>/dev/null || true
            sleep 2
            # Force kill se ainda estiver rodando
            if ps -p $SERVER_PID > /dev/null 2>&1; then
                kill -9 $SERVER_PID 2>/dev/null || true
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # Matar qualquer processo na porta
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
}

# Registrar handler de limpeza
trap cleanup EXIT INT TERM

# Verificar se a porta está em uso
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port $PORT is already in use. Cleaning up...${NC}"
    lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
    sleep 2
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing dependencies...${NC}"
    npm install > "$LOG_DIR/npm-install.log" 2>&1
fi

# Compilar TypeScript
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build > "$LOG_DIR/build.log" 2>&1 || {
    echo -e "${RED}❌ Build failed! Check $LOG_DIR/build.log${NC}"
    exit 1
}

# Corrigir imports compilados
echo -e "${BLUE}🔧 Fixing compiled imports...${NC}"
./fix-dist-imports.sh > "$LOG_DIR/fix-imports.log" 2>&1

# Iniciar servidor em background
echo -e "${GREEN}🚀 Starting server on port $PORT...${NC}"
NODE_ENV=test PORT=$PORT node dist/index.js > "$SERVER_LOG" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"
echo -e "${GREEN}   Server PID: $SERVER_PID${NC}"

# Watchdog: verificar se servidor está rodando
watchdog() {
    local max_wait=$1
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        if ! ps -p $SERVER_PID > /dev/null 2>&1; then
            echo -e "${RED}❌ Server crashed! Check logs:${NC}"
            tail -20 "$SERVER_LOG"
            return 1
        fi
        
        # Verificar se está respondendo
        if curl -s http://localhost:$PORT/ > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Server is responding!${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}   Waiting for server... (${waited}s/${max_wait}s)${NC}"
        sleep 2
        waited=$((waited + 2))
    done
    
    echo -e "${RED}❌ Server timeout! Check logs:${NC}"
    tail -20 "$SERVER_LOG"
    return 1
}

# Esperar servidor inicializar (máximo 30 segundos)
if ! watchdog 30; then
    exit 1
fi

# Dar um tempo extra para estabilizar
sleep 2

# Executar testes
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 Running Automated Tests...${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Executar o test runner
BASE_URL="http://localhost:$PORT" npx ts-node -r tsconfig-paths/register src/tests/auto-test-runner.ts 2>&1 | tee "$TEST_LOG"
TEST_EXIT_CODE=${PIPESTATUS[0]}

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests completed successfully!${NC}"
else
    echo -e "${RED}❌ Tests failed with exit code: $TEST_EXIT_CODE${NC}"
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}📊 Reports generated:${NC}"
echo -e "   📄 JSON: $LOG_DIR/test-report.json"
echo -e "   📄 LOG:  $LOG_DIR/test-report.log"
echo -e "   📄 Test Execution: $TEST_LOG"
echo -e "   📄 Server Log: $SERVER_LOG"
echo ""

# Cleanup será executado automaticamente pelo trap

exit $TEST_EXIT_CODE
