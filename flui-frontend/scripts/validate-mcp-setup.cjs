#!/usr/bin/env node

/**
 * Script para validar a configuração do Playwright MCP
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  const exists = fs.existsSync(path.join(__dirname, '..', filePath));
  if (exists) {
    log(`✅ ${description}`, 'green');
    return true;
  } else {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'ignore' });
    log(`✅ ${description}`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description}`, 'red');
    return false;
  }
}

log('\n═══════════════════════════════════════════════════════════', 'bright');
log('  VALIDAÇÃO DA CONFIGURAÇÃO DO PLAYWRIGHT MCP', 'bright');
log('═══════════════════════════════════════════════════════════\n', 'bright');

let allValid = true;

// 1. Verificar arquivos de configuração
log('📁 Verificando arquivos de configuração...', 'blue');
allValid &= checkFile('playwright.config.ts', 'Arquivo playwright.config.ts encontrado');
allValid &= checkFile('mcp-server.config.json', 'Arquivo mcp-server.config.json encontrado');
allValid &= checkFile('tests/fixtures/console-capture.ts', 'Fixture console-capture.ts encontrada');
allValid &= checkFile('tests/fixtures/mcp-helpers.ts', 'Fixture mcp-helpers.ts encontrada');
console.log();

// 2. Verificar diretórios
log('📂 Verificando diretórios...', 'blue');
allValid &= checkFile('tests/e2e', 'Diretório tests/e2e/ encontrado');
allValid &= checkFile('tests/fixtures', 'Diretório tests/fixtures/ encontrado');
console.log();

// 3. Verificar testes
log('🧪 Verificando arquivos de teste...', 'blue');
allValid &= checkFile('tests/e2e/basic-navigation.spec.ts', 'Teste basic-navigation.spec.ts encontrado');
allValid &= checkFile('tests/e2e/agents.spec.ts', 'Teste agents.spec.ts encontrado');
allValid &= checkFile('tests/e2e/automations.spec.ts', 'Teste automations.spec.ts encontrado');
allValid &= checkFile('tests/e2e/workflow-editor.spec.ts', 'Teste workflow-editor.spec.ts encontrado');
console.log();

// 4. Verificar dependências
log('📦 Verificando dependências npm...', 'blue');
allValid &= checkCommand(
  'npm list @playwright/test --depth=0 2>/dev/null',
  '@playwright/test instalado'
);
allValid &= checkCommand(
  'npm list @playwright/mcp --depth=0 2>/dev/null',
  '@playwright/mcp instalado'
);
console.log();

// 5. Verificar navegadores
log('🌐 Verificando navegadores do Playwright...', 'blue');
const browsersPath = path.join(require('os').homedir(), '.cache/ms-playwright');
if (fs.existsSync(browsersPath)) {
  const browsers = fs.readdirSync(browsersPath);
  const hasChromium = browsers.some(b => b.includes('chromium'));
  if (hasChromium) {
    log('✅ Navegador Chromium instalado', 'green');
  } else {
    log('⚠️  Navegador Chromium não encontrado', 'yellow');
    log('   Execute: npm run mcp:install', 'yellow');
    allValid = false;
  }
} else {
  log('⚠️  Navegadores não instalados', 'yellow');
  log('   Execute: npm run mcp:install', 'yellow');
  allValid = false;
}
console.log();

// 6. Verificar scripts do package.json
log('📜 Verificando scripts do package.json...', 'blue');
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')
);
const requiredScripts = [
  'test',
  'test:ui',
  'test:headed',
  'test:debug',
  'mcp:server',
  'mcp:install'
];

for (const script of requiredScripts) {
  if (packageJson.scripts[script]) {
    log(`✅ Script "${script}" encontrado`, 'green');
  } else {
    log(`❌ Script "${script}" não encontrado`, 'red');
    allValid = false;
  }
}
console.log();

// 7. Verificar se consegue listar testes
log('🔍 Verificando se o Playwright consegue listar testes...', 'blue');
try {
  const output = execSync('npx playwright test --list 2>&1', { 
    cwd: path.join(__dirname, '..'),
    encoding: 'utf-8' 
  });
  const testCount = (output.match(/Total: (\d+) tests/i) || [])[1];
  if (testCount) {
    log(`✅ ${testCount} testes encontrados`, 'green');
  } else {
    log('⚠️  Não foi possível contar os testes', 'yellow');
  }
} catch (error) {
  log('❌ Erro ao listar testes', 'red');
  allValid = false;
}
console.log();

// Resultado final
log('═══════════════════════════════════════════════════════════', 'bright');
if (allValid) {
  log('✅ VALIDAÇÃO CONCLUÍDA: Tudo configurado corretamente!', 'green');
  log('\nPróximos passos:', 'blue');
  log('  1. Inicie o servidor dev: npm run dev', 'blue');
  log('  2. Execute os testes: npm run test:ui', 'blue');
  log('  3. Inicie o MCP server: npm run mcp:server', 'blue');
} else {
  log('❌ VALIDAÇÃO FALHOU: Alguns itens precisam de atenção', 'red');
  log('\nVerifique os itens marcados com ❌ acima', 'yellow');
  log('Consulte PLAYWRIGHT_MCP_GUIDE.md para ajuda', 'yellow');
}
log('═══════════════════════════════════════════════════════════\n', 'bright');

process.exit(allValid ? 0 : 1);
