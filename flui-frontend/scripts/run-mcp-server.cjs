#!/usr/bin/env node

/**
 * Script para executar o servidor MCP do Playwright
 * Permite controlar o navegador via Model Context Protocol
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configurações
const MCP_SERVER_PORT = process.env.MCP_PORT || 8080;
const PLAYWRIGHT_HEADLESS = process.env.HEADLESS !== 'false';

log('═══════════════════════════════════════════════════════════', 'bright');
log('  PLAYWRIGHT MCP SERVER - Flui Frontend', 'bright');
log('═══════════════════════════════════════════════════════════', 'bright');
log('');

log(`📦 Iniciando servidor MCP...`, 'blue');
log(`🌐 Porta: ${MCP_SERVER_PORT}`, 'blue');
log(`👁️  Headless: ${PLAYWRIGHT_HEADLESS}`, 'blue');
log('');

// Verificar se o arquivo de configuração existe
const configPath = path.join(__dirname, '..', 'mcp-server.config.json');
if (!fs.existsSync(configPath)) {
  log('⚠️  Arquivo de configuração não encontrado: mcp-server.config.json', 'yellow');
}

// Executar o servidor MCP
const mcpProcess = spawn('npx', ['mcp-server-playwright'], {
  cwd: path.join(__dirname, '..'),
  env: {
    ...process.env,
    MCP_PORT: MCP_SERVER_PORT,
    PLAYWRIGHT_HEADLESS: PLAYWRIGHT_HEADLESS ? '1' : '0',
    NODE_ENV: 'test',
  },
  stdio: 'inherit',
});

mcpProcess.on('error', (error) => {
  log(`❌ Erro ao iniciar servidor MCP: ${error.message}`, 'red');
  process.exit(1);
});

mcpProcess.on('exit', (code) => {
  if (code !== 0) {
    log(`❌ Servidor MCP encerrado com código ${code}`, 'red');
  } else {
    log('✅ Servidor MCP encerrado com sucesso', 'green');
  }
  process.exit(code);
});

// Lidar com sinais de término
process.on('SIGINT', () => {
  log('\n\n⚠️  Encerrando servidor MCP...', 'yellow');
  mcpProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  log('\n\n⚠️  Encerrando servidor MCP...', 'yellow');
  mcpProcess.kill('SIGTERM');
});

log('✅ Servidor MCP iniciado!', 'green');
log('');
log('💡 Dicas:', 'bright');
log('  - Use CTRL+C para encerrar o servidor', 'blue');
log('  - Configure o Cursor para usar este servidor MCP', 'blue');
log('  - Logs e capturas estarão em ./test-results/', 'blue');
log('');
log('═══════════════════════════════════════════════════════════', 'bright');
