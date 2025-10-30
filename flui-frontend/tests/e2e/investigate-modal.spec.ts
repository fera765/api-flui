/**
 * Script de Investigação - Modal de Configuração do Nó
 * 
 * Este script vai:
 * 1. Iniciar o frontend
 * 2. Navegar até automações
 * 3. Criar uma automação
 * 4. Adicionar nodes
 * 5. Tentar abrir o modal de configuração
 * 6. Capturar logs, screenshots e informações de debug
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Investigação - Modal de Configuração', () => {
  let page: Page;
  let consoleLogs: any[] = [];
  let consoleErrors: any[] = [];

  test.beforeEach(async ({ page: p }) => {
    page = p;
    consoleLogs = [];
    consoleErrors = [];

    // Capturar todos os logs do console
    page.on('console', (msg) => {
      const log = {
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      };
      consoleLogs.push(log);
      
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleErrors.push(log);
        console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
      }
    });

    // Capturar erros de página
    page.on('pageerror', (error) => {
      console.log('[PAGE ERROR]:', error.message);
      consoleErrors.push({
        type: 'pageerror',
        text: error.message,
        stack: error.stack,
      });
    });

    // Capturar requisições falhadas
    page.on('requestfailed', (request) => {
      console.log('[REQUEST FAILED]:', request.url(), request.failure()?.errorText);
    });
  });

  test('Investigar modal de configuração do nó', async () => {
    console.log('\n🔍 INICIANDO INVESTIGAÇÃO DO MODAL\n');

    // 1. Navegar para a aplicação
    console.log('📍 Step 1: Navegando para a aplicação...');
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'screenshots/01-homepage.png', fullPage: true });
    console.log('✅ Homepage carregada');

    // 2. Navegar para automações
    console.log('\n📍 Step 2: Navegando para Automações...');
    await page.click('a[href="/automations"]').catch(() => {
      console.log('⚠️ Link /automations não encontrado, tentando alternativa...');
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/02-automations-page.png', fullPage: true });
    console.log('✅ Página de automações carregada');

    // 3. Criar nova automação
    console.log('\n📍 Step 3: Criando nova automação...');
    
    // Procurar botão de criar (pode ser "Criar Automação", "Nova Automação", etc)
    const createButtonSelectors = [
      'button:has-text("Criar")',
      'button:has-text("Nova")',
      'button:has-text("Adicionar")',
      '[data-testid="create-automation"]',
      'button[type="button"]',
    ];

    let createButton = null;
    for (const selector of createButtonSelectors) {
      createButton = await page.$(selector);
      if (createButton) {
        console.log(`✅ Botão criar encontrado: ${selector}`);
        break;
      }
    }

    if (createButton) {
      await createButton.click();
      await page.waitForTimeout(500);
      
      // Preencher nome (se modal aparecer)
      const nameInput = await page.$('input[name="name"], input[placeholder*="nome"]');
      if (nameInput) {
        await nameInput.fill('Test Automation for Modal Investigation');
        console.log('✅ Nome preenchido');
      }
      
      // Confirmar criação
      const confirmButton = await page.$('button:has-text("Criar"), button:has-text("Salvar"), button:has-text("Confirmar")');
      if (confirmButton) {
        await confirmButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Automação criada');
      }
    } else {
      console.log('⚠️ Botão criar não encontrado, tentando usar automação existente...');
      
      // Clicar na primeira automação da lista
      const firstAutomation = await page.$('[role="button"], a, .automation-card, [data-testid="automation-item"]');
      if (firstAutomation) {
        await firstAutomation.click();
        await page.waitForTimeout(1000);
        console.log('✅ Automação aberta da lista');
      }
    }

    await page.screenshot({ path: 'screenshots/03-after-create.png', fullPage: true });

    // 4. Procurar e clicar no botão de adicionar node
    console.log('\n📍 Step 4: Adicionando node ao workflow...');
    
    const addNodeSelectors = [
      'button:has-text("Adicionar")',
      'button:has-text("Add")',
      'button:has-text("Trigger")',
      '[data-testid="add-node"]',
      'button[aria-label*="add"]',
    ];

    let addNodeButton = null;
    for (const selector of addNodeSelectors) {
      addNodeButton = await page.$(selector);
      if (addNodeButton) {
        console.log(`✅ Botão adicionar node encontrado: ${selector}`);
        break;
      }
    }

    if (addNodeButton) {
      await addNodeButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Modal/Menu de adicionar node aberto');
      await page.screenshot({ path: 'screenshots/04-add-node-modal.png', fullPage: true });

      // Selecionar uma tool (tentar vários seletores)
      const toolSelectors = [
        'button:has-text("WebHook")',
        'button:has-text("HTTP")',
        '[data-testid="tool-item"]',
        '.tool-card',
        '[role="button"]',
      ];

      let toolButton = null;
      for (const selector of toolSelectors) {
        const tools = await page.$$(selector);
        if (tools.length > 0) {
          toolButton = tools[0];
          console.log(`✅ Tool encontrada: ${selector}`);
          break;
        }
      }

      if (toolButton) {
        await toolButton.click();
        await page.waitForTimeout(1500);
        console.log('✅ Tool adicionada ao workflow');
        await page.screenshot({ path: 'screenshots/05-tool-added.png', fullPage: true });
      }
    }

    // 5. Procurar nodes no canvas
    console.log('\n📍 Step 5: Procurando nodes no canvas...');
    
    // Esperar um pouco para o canvas renderizar
    await page.waitForTimeout(2000);
    
    // Capturar estrutura do DOM
    const canvasHTML = await page.evaluate(() => {
      const canvas = document.querySelector('.react-flow, [class*="workflow"], [class*="canvas"]');
      return canvas ? canvas.innerHTML.substring(0, 5000) : 'Canvas not found';
    });
    console.log('Canvas HTML (primeiros 5000 chars):', canvasHTML.substring(0, 500));

    // Procurar nodes
    const nodeSelectors = [
      '[data-id*="node"]',
      '.react-flow__node',
      '[class*="CustomNode"]',
      '[class*="Node"]',
      '[role="button"]',
    ];

    let nodes = [];
    for (const selector of nodeSelectors) {
      const found = await page.$$(selector);
      if (found.length > 0) {
        nodes = found;
        console.log(`✅ ${found.length} nodes encontrados com selector: ${selector}`);
        break;
      }
    }

    if (nodes.length === 0) {
      console.log('⚠️ Nenhum node encontrado no canvas');
      
      // Tentar encontrar qualquer elemento clicável
      const allButtons = await page.$$('button');
      console.log(`📊 Total de botões na página: ${allButtons.length}`);
      
      // Listar alguns botões
      for (let i = 0; i < Math.min(10, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const classes = await allButtons[i].getAttribute('class');
        console.log(`  Button ${i}: "${text?.trim()}" (${classes})`);
      }
    }

    await page.screenshot({ path: 'screenshots/06-before-config.png', fullPage: true });

    // 6. Tentar clicar no botão de configurar
    console.log('\n📍 Step 6: Procurando botão de configurar...');
    
    const configButtonSelectors = [
      'button:has-text("Configurar")',
      'button:has-text("Config")',
      'button:has-text("Settings")',
      'button[aria-label*="config"]',
      '[data-testid="configure-node"]',
      'button svg[class*="settings"]',
      'button svg[class*="gear"]',
    ];

    let configButton = null;
    for (const selector of configButtonSelectors) {
      const buttons = await page.$$(selector);
      if (buttons.length > 0) {
        configButton = buttons[0];
        console.log(`✅ Botão configurar encontrado: ${selector}`);
        break;
      }
    }

    if (!configButton && nodes.length > 0) {
      // Tentar hover no node para ver se aparece botão
      console.log('🔍 Tentando hover no node...');
      await nodes[0].hover();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'screenshots/07-node-hover.png', fullPage: true });

      // Procurar novamente após hover
      for (const selector of configButtonSelectors) {
        const buttons = await page.$$(selector);
        if (buttons.length > 0) {
          configButton = buttons[0];
          console.log(`✅ Botão configurar encontrado após hover: ${selector}`);
          break;
        }
      }
    }

    if (configButton) {
      console.log('🎯 Clicando no botão configurar...');
      await configButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ Clique executado');
      await page.screenshot({ path: 'screenshots/08-after-config-click.png', fullPage: true });

      // 7. Verificar se modal abriu
      console.log('\n📍 Step 7: Verificando se modal abriu...');
      
      const modalSelectors = [
        '[role="dialog"]',
        '.dialog',
        '[class*="modal"]',
        '[class*="Modal"]',
        '[data-state="open"]',
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        const modal = await page.$(selector);
        if (modal) {
          modalFound = true;
          console.log(`✅ Modal encontrado: ${selector}`);
          
          const modalHTML = await modal.innerHTML();
          console.log('Modal HTML (primeiros 1000 chars):', modalHTML.substring(0, 1000));
          break;
        }
      }

      if (!modalFound) {
        console.log('❌ MODAL NÃO ENCONTRADO!');
        
        // Capturar estado do DOM
        const bodyHTML = await page.evaluate(() => document.body.innerHTML);
        console.log('\n📄 Body HTML length:', bodyHTML.length);
        
        // Procurar por elementos ocultos
        const hiddenDialogs = await page.$$('[role="dialog"][style*="display: none"]');
        console.log('Dialogs ocultos encontrados:', hiddenDialogs.length);
      }
    } else {
      console.log('❌ BOTÃO CONFIGURAR NÃO ENCONTRADO!');
      
      // Tentar duplo clique no node
      if (nodes.length > 0) {
        console.log('🔍 Tentando duplo clique no node...');
        await nodes[0].dblclick();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'screenshots/09-after-dblclick.png', fullPage: true });
      }
    }

    // 8. Análise final
    console.log('\n📊 ANÁLISE FINAL:\n');
    console.log(`Total de logs do console: ${consoleLogs.length}`);
    console.log(`Total de erros/warnings: ${consoleErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:\n');
      consoleErrors.forEach((error, i) => {
        console.log(`${i + 1}. [${error.type}] ${error.text}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.substring(0, 200)}`);
        }
      });
    }

    // Salvar logs em arquivo
    const fs = require('fs');
    fs.writeFileSync('investigation-logs.json', JSON.stringify({
      consoleLogs,
      consoleErrors,
      timestamp: new Date().toISOString(),
    }, null, 2));

    console.log('\n✅ Investigação completa! Veja os screenshots em ./screenshots/');
    console.log('✅ Logs salvos em investigation-logs.json');

    // Manter navegador aberto por 5 segundos para análise
    await page.waitForTimeout(5000);
  });
});
