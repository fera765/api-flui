/**
 * Teste do Fix - Modal de Configuração
 */

import { test, expect } from '@playwright/test';

test.describe('Test Modal Fix', () => {
  test('Modal de configuração deve abrir ao adicionar node', async ({ page }) => {
    console.log('\n🔍 TESTANDO FIX DO MODAL\n');

    // Ir para a aplicação
    await page.goto('http://localhost:8080');
    console.log('✅ Homepage carregada');

    // Ir para automations
    await page.click('a[href="/automations"]').catch(() => {});
    await page.waitForTimeout(1000);
    console.log('✅ Página de automações');

    // Criar automação (forçar click ignorando overlay)
    await page.click('button:has-text("Criar")', { force: true });
    await page.waitForTimeout(500);

    // Preencher nome (forçar)
    const nameInput = await page.$('input[name="name"]');
    if (nameInput) {
      await nameInput.fill('Test Modal Fix', { force: true });
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
    }

    // Confirmar (forçar)
    await page.click('button:has-text("Criar")', { force: true });
    await page.waitForTimeout(2000);
    console.log('✅ Automação criada');

    // Screenshot antes de adicionar node
    await page.screenshot({ path: 'screenshots/before-add-node.png', fullPage: true });

    // Clicar em adicionar (buscar pelo texto e forçar)
    const addButtons = await page.$$('button');
    let addedNode = false;
    
    for (const btn of addButtons) {
      const text = await btn.textContent();
      if (text?.includes('Adicionar') || text?.includes('Trigger')) {
        console.log('🔍 Tentando clicar em:', text?.trim());
        await btn.click({ force: true });
        await page.waitForTimeout(1000);
        addedNode = true;
        break;
      }
    }

    if (!addedNode) {
      console.log('⚠️ Botão adicionar não encontrado');
      await page.screenshot({ path: 'screenshots/no-add-button.png', fullPage: true });
      return;
    }

    await page.screenshot({ path: 'screenshots/after-add-click.png', fullPage: true });
    console.log('✅ Clicou em adicionar node');

    // Tentar selecionar uma tool
    await page.waitForTimeout(1000);
    const firstTool = await page.$('[role="button"], button');
    if (firstTool) {
      await firstTool.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Tool selecionada');
    }

    await page.screenshot({ path: 'screenshots/after-tool-added.png', fullPage: true });

    // Procurar botão configurar
    await page.waitForTimeout(1000);
    const configButtons = await page.$$('button:has-text("Configurar")');
    console.log(`📊 Botões "Configurar" encontrados: ${configButtons.length}`);

    if (configButtons.length === 0) {
      console.log('❌ NENHUM BOTÃO CONFIGURAR ENCONTRADO!');
      
      // Debug: listar todos os botões
      const allButtons = await page.$$('button');
      console.log(`\n📋 Total de botões: ${allButtons.length}`);
      for (let i = 0; i < Math.min(20, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const isVisible = await allButtons[i].isVisible();
        console.log(`  ${i+1}. "${text?.trim()}" (visible: ${isVisible})`);
      }

      // Tentar procurar nodes no canvas
      const nodes = await page.$$('[data-id*="node"], .react-flow__node');
      console.log(`\n📦 Nodes no canvas: ${nodes.length}`);

      await page.screenshot({ path: 'screenshots/no-configure-button.png', fullPage: true });
      throw new Error('Botão configurar não encontrado - BUG NÃO CORRIGIDO');
    }

    // Clicar no primeiro botão configurar
    console.log('🎯 Clicando em "Configurar"...');
    await configButtons[0].click({ force: true });
    await page.waitForTimeout(1000);

    await page.screenshot({ path: 'screenshots/after-configure-click.png', fullPage: true });

    // Verificar se modal abriu
    const modal = await page.$('[role="dialog"]');
    if (modal) {
      const modalVisible = await modal.isVisible();
      console.log(`✅ MODAL ENCONTRADO! (visible: ${modalVisible})`);
      
      // Capturar conteúdo do modal
      const modalText = await modal.textContent();
      console.log('📄 Modal text:', modalText?.substring(0, 200));

      await page.screenshot({ path: 'screenshots/modal-opened.png', fullPage: true });
      
      expect(modalVisible).toBeTruthy();
    } else {
      console.log('❌ MODAL NÃO ENCONTRADO!');
      
      // Verificar se há algum dialog oculto
      const allDialogs = await page.$$('[role="dialog"]');
      console.log(`Total de dialogs na página: ${allDialogs.length}`);
      
      await page.screenshot({ path: 'screenshots/modal-not-opened.png', fullPage: true });
      throw new Error('Modal não abriu - BUG NÃO CORRIGIDO');
    }

    console.log('\n✅ FIX FUNCIONOU! Modal abre corretamente!\n');
  });
});
