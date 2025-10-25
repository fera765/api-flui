#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}  API End-to-End Test Runner${NC}"
echo -e "${BLUE}================================${NC}\n"

# Kill any existing processes on port 3000
echo -e "${YELLOW}Checking for existing processes on port 3000...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
sleep 1

# Start the API server in background
echo -e "${YELLOW}Starting API server...${NC}"
npm run dev > api-server.log 2>&1 &
API_PID=$!

echo -e "${GREEN}API server started (PID: $API_PID)${NC}"
echo -e "${YELLOW}Waiting for API to be ready...${NC}"

# Wait for API to be ready
for i in {1..30}; do
  if curl -s http://localhost:3000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is ready!${NC}\n"
    break
  fi
  echo -n "."
  sleep 1
  if [ $i -eq 30 ]; then
    echo -e "\n${RED}✗ API failed to start within 30 seconds${NC}"
    kill $API_PID 2>/dev/null
    exit 1
  fi
done

# Run the E2E tests
echo -e "${BLUE}Running E2E tests...${NC}\n"
node test-api-e2e.js
TEST_EXIT_CODE=$?

# Cleanup: Kill the API server
echo -e "\n${YELLOW}Cleaning up...${NC}"
kill $API_PID 2>/dev/null

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ All tests completed successfully!${NC}"
else
  echo -e "${RED}✗ Tests failed with exit code $TEST_EXIT_CODE${NC}"
  echo -e "${YELLOW}Check api-server.log for server logs${NC}"
fi

exit $TEST_EXIT_CODE
