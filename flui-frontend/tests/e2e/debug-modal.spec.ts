/**
 * Debug: Por que o modal não abre?
 */

import { test } from '@playwright/test';

test('Investigar modal de configuração', async ({ page }) => {
  console.log('\n🔍 INVESTIGANDO PROBLEMA DO MODAL\n');

  // Setup: capturar console
  const consoleLogs: any[] = [];
  page.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
    console.log(`[BROWSER ${msg.type().toUpperCase()}]:`, msg.text());
  });

  // Ir para app
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(1000);
  console.log('✅ App carregado\n');

  // Ir para automações
  await page.click('a[href="/automations"]').catch(() => {});
  await page.waitForTimeout(1000);
  console.log('✅ Página de automações\n');

  // Criar automação
  await page.click('button:has-text("Criar")', { force: true });
  await page.waitForTimeout(500);

  const nameInput = await page.$('input[name="name"]');
  if (nameInput) {
    await nameInput.fill('Debug Test');
  }

  await page.click('button:has-text("Criar")', { force: true });
  await page.waitForTimeout(2000);
  console.log('✅ Automação criada\n');

  await page.screenshot({ path: 'debug/01-automation-created.png', fullPage: true });

  // Adicionar node
  console.log('📍 Adicionando node...');
  const addButton = await page.$('button:has-text("Adicionar")');
  if (addButton) {
    await addButton.click({ force: true });
    await page.waitForTimeout(1000);

    // Selecionar primeira tool
    const firstTool = await page.$$('[role="button"]');
    if (firstTool.length > 0) {
      await firstTool[0].click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Tool selecionada\n');
    }
  }

  await page.screenshot({ path: 'debug/02-node-added.png', fullPage: true });

  // Verificar se node apareceu
  const nodes = await page.$$('[data-id*="node"]');
  console.log(`📊 Nodes no canvas: ${nodes.length}\n`);

  if (nodes.length === 0) {
    console.log('❌ PROBLEMA: Nenhum node foi criado!\n');
    return;
  }

  // Procurar botão "Configurar"
  console.log('📍 Procurando botão "Configurar"...');
  
  const configButtons = await page.$$('button:has-text("Configurar")');
  console.log(`📊 Botões "Configurar" encontrados: ${configButtons.length}\n`);

  if (configButtons.length === 0) {
    console.log('❌ PROBLEMA: Botão "Configurar" não encontrado!\n');
    
    // Debug: listar todos os botões
    const allButtons = await page.$$('button');
    console.log(`📋 Total de botões na página: ${allButtons.length}\n`);
    
    for (let i = 0; i < Math.min(10, allButtons.length); i++) {
      const text = await allButtons[i].textContent();
      const visible = await allButtons[i].isVisible();
      console.log(`  ${i + 1}. "${text?.trim()}" (visible: ${visible})`);
    }
    
    return;
  }

  // Clicar no botão configurar
  console.log('📍 Clicando no botão "Configurar"...');
  await configButtons[0].click({ force: true });
  await page.waitForTimeout(1000);
  console.log('✅ Click executado\n');

  await page.screenshot({ path: 'debug/03-after-click.png', fullPage: true });

  // Verificar se modal abriu
  console.log('📍 Verificando se modal abriu...');
  
  const modal = await page.$('[role="dialog"]');
  if (modal) {
    const modalVisible = await modal.isVisible();
    console.log(`✅ MODAL ENCONTRADO! (visible: ${modalVisible})\n`);
    
    const modalTitle = await page.$('[role="dialog"] h2');
    if (modalTitle) {
      const title = await modalTitle.textContent();
      console.log(`📋 Título do modal: "${title}"\n`);
    }
    
    // Verificar campos
    const inputs = await page.$$('[role="dialog"] input, [role="dialog"] textarea, [role="dialog"] select');
    console.log(`📊 Campos no modal: ${inputs.length}\n`);
    
    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name') || await inputs[i].getAttribute('id');
      const type = await inputs[i].getAttribute('type') || inputs[i].tagName;
      console.log(`  ${i + 1}. [${type}] ${name || 'unnamed'}`);
    }
    
  } else {
    console.log('❌ MODAL NÃO ENCONTRADO!\n');
    
    // Verificar se há algum dialog oculto
    const allDialogs = await page.$$('[role="dialog"]');
    console.log(`📊 Total de dialogs: ${allDialogs.length}\n`);
    
    // Verificar console logs
    console.log('📋 Console logs relevantes:');
    consoleLogs.forEach((log) => {
      if (log.text.includes('Configurar') || log.text.includes('modal')) {
        console.log(`  [${log.type}] ${log.text}`);
      }
    });
  }

  await page.screenshot({ path: 'debug/04-final-state.png', fullPage: true });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
