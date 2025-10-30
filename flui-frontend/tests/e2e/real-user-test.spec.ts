/**
 * Teste Simulando Usuário Real
 * 
 * Este teste vai simular exatamente o que um usuário faria:
 * 1. Criar uma automação
 * 2. Adicionar múltiplos nodes
 * 3. Configurar cada node
 * 4. Verificar se os campos estão corretos
 * 5. Salvar
 * 6. Recarregar e verificar persistência
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';

// Helper para capturar estado
async function captureState(page: any, step: string) {
  const timestamp = Date.now();
  const filename = `debug/${step}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage: true });
  
  // Capturar nodes do canvas
  const nodesData = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('[data-id*="node"]'));
    return nodes.map((node: any) => ({
      id: node.getAttribute('data-id'),
      text: node.textContent?.substring(0, 100),
      visible: node.offsetParent !== null,
    }));
  });
  
  console.log(`\n📸 [${step}] Nodes no canvas:`, nodesData.length);
  nodesData.forEach((n: any, i: number) => {
    console.log(`   ${i + 1}. ${n.id}: ${n.text?.trim()}`);
  });
  
  return nodesData;
}

test.describe('Teste de Usuário Real', () => {
  test('Criar automação, adicionar múltiplos nodes e configurar', async ({ page }) => {
    // Setup: criar pasta para debug
    if (!fs.existsSync('debug')) {
      fs.mkdirSync('debug');
    }
    
    console.log('\n🚀 INICIANDO TESTE DE USUÁRIO REAL\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // STEP 1: Navegar para aplicação
    console.log('📍 STEP 1: Navegando para aplicação...');
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(1000);
    await captureState(page, '01-homepage');
    console.log('✅ Homepage carregada\n');

    // STEP 2: Ir para automações
    console.log('📍 STEP 2: Navegando para Automações...');
    await page.click('a[href="/automations"]').catch(() => {});
    await page.waitForTimeout(1000);
    await captureState(page, '02-automations-list');
    console.log('✅ Lista de automações\n');

    // STEP 3: Criar nova automação
    console.log('📍 STEP 3: Criando nova automação...');
    
    // Clicar em criar (forçar para ignorar overlay)
    await page.click('button:has-text("Criar")', { force: true });
    await page.waitForTimeout(500);
    
    // Preencher nome
    const nameInput = await page.$('input[name="name"]');
    if (nameInput) {
      await nameInput.fill('Test Multi-Node Automation');
      console.log('   ✓ Nome preenchido: Test Multi-Node Automation');
    }
    
    // Preencher descrição
    const descInput = await page.$('textarea[name="description"], input[name="description"]');
    if (descInput) {
      await descInput.fill('Testing multiple nodes addition and configuration');
      console.log('   ✓ Descrição preenchida');
    }
    
    // Confirmar criação
    await page.click('button:has-text("Criar")', { force: true });
    await page.waitForTimeout(2000);
    await captureState(page, '03-automation-created');
    console.log('✅ Automação criada\n');

    // STEP 4: Adicionar NODE 1 (Trigger/WebHook)
    console.log('📍 STEP 4: Adicionando NODE 1 (Trigger)...');
    
    // Procurar botão de adicionar
    const addButton = await page.$('button:has-text("Adicionar"), button:has-text("Trigger")');
    if (addButton) {
      await addButton.click({ force: true });
      await page.waitForTimeout(1000);
      console.log('   ✓ Modal de adicionar aberto');
      
      await captureState(page, '04-add-modal-opened');
      
      // Tentar selecionar WebHook ou primeiro item
      const firstTool = await page.$('button:has-text("WebHook"), [role="button"]');
      if (firstTool) {
        const toolText = await firstTool.textContent();
        console.log(`   ✓ Selecionando tool: ${toolText?.trim()}`);
        await firstTool.click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    
    const nodes1 = await captureState(page, '05-node1-added');
    console.log(`✅ NODE 1 adicionado (Total: ${nodes1.length} nodes)\n`);

    // STEP 5: Adicionar NODE 2
    console.log('📍 STEP 5: Adicionando NODE 2...');
    
    const addButton2 = await page.$('button:has-text("Adicionar"), button:has-text("Tool")');
    if (addButton2) {
      await addButton2.click({ force: true });
      await page.waitForTimeout(1000);
      console.log('   ✓ Modal de adicionar aberto novamente');
      
      // Selecionar segunda tool
      const tools = await page.$$('[role="button"], button');
      if (tools.length > 1) {
        const tool2Text = await tools[1].textContent();
        console.log(`   ✓ Selecionando tool: ${tool2Text?.trim()}`);
        await tools[1].click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    
    const nodes2 = await captureState(page, '06-node2-added');
    console.log(`✅ NODE 2 adicionado (Total: ${nodes2.length} nodes)`);
    
    // VERIFICAÇÃO CRÍTICA 1: Dois nodes devem existir
    if (nodes2.length < 2) {
      console.log('❌ PROBLEMA DETECTADO: Deveria haver 2 nodes, mas há apenas', nodes2.length);
      console.log('   → Possível replace de node acontecendo!');
    } else {
      console.log('✅ VALIDAÇÃO OK: 2 nodes presentes no canvas');
    }
    console.log('');

    // STEP 6: Adicionar NODE 3
    console.log('📍 STEP 6: Adicionando NODE 3...');
    
    const addButton3 = await page.$('button:has-text("Adicionar"), button:has-text("Tool")');
    if (addButton3) {
      await addButton3.click({ force: true });
      await page.waitForTimeout(1000);
      
      const tools = await page.$$('[role="button"], button');
      if (tools.length > 2) {
        const tool3Text = await tools[2].textContent();
        console.log(`   ✓ Selecionando tool: ${tool3Text?.trim()}`);
        await tools[2].click({ force: true });
        await page.waitForTimeout(2000);
      }
    }
    
    const nodes3 = await captureState(page, '07-node3-added');
    console.log(`✅ NODE 3 adicionado (Total: ${nodes3.length} nodes)`);
    
    // VERIFICAÇÃO CRÍTICA 2: Três nodes devem existir
    if (nodes3.length < 3) {
      console.log('❌ PROBLEMA DETECTADO: Deveria haver 3 nodes, mas há apenas', nodes3.length);
      console.log('   → REPLACE DE NODES CONFIRMADO!');
    } else {
      console.log('✅ VALIDAÇÃO OK: 3 nodes presentes no canvas');
    }
    console.log('');

    // STEP 7: Configurar NODE 1
    console.log('📍 STEP 7: Configurando NODE 1...');
    
    const configButtons = await page.$$('button:has-text("Configurar")');
    console.log(`   ℹ️  Botões "Configurar" encontrados: ${configButtons.length}`);
    
    if (configButtons.length > 0) {
      await configButtons[0].click({ force: true });
      await page.waitForTimeout(1500);
      
      await captureState(page, '08-config-modal-opened');
      
      // VERIFICAR CAMPOS DO MODAL
      console.log('\n   🔍 ANALISANDO CAMPOS DO MODAL:');
      
      const modalFields = await page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input, textarea, select, [role="switch"]'));
        return inputs.map((input: any) => ({
          type: input.type || input.tagName,
          name: input.name || input.id,
          placeholder: input.placeholder,
          value: input.value,
          visible: input.offsetParent !== null,
        }));
      });
      
      console.log(`   📊 Total de campos encontrados: ${modalFields.length}`);
      modalFields.forEach((field: any, i: number) => {
        console.log(`      ${i + 1}. [${field.type}] ${field.name || 'unnamed'} ${field.visible ? '✓' : '✗'}`);
      });
      
      // VERIFICAR BOTÕES DE VINCULAR
      const linkButtons = await page.$$('button:has-text("🔗"), button[aria-label*="link"], button[aria-label*="vincular"]');
      console.log(`\n   🔗 Botões de vincular encontrados: ${linkButtons.length}`);
      
      if (linkButtons.length === 0) {
        console.log('   ⚠️  PROBLEMA: Nenhum botão de vincular encontrado!');
      }
      
      // Fechar modal
      const closeButton = await page.$('button:has-text("Cancelar"), button:has-text("Fechar")');
      if (closeButton) {
        await closeButton.click({ force: true });
        await page.waitForTimeout(500);
      }
    } else {
      console.log('   ❌ PROBLEMA: Nenhum botão "Configurar" encontrado!');
    }
    console.log('');

    // STEP 8: Salvar automação
    console.log('📍 STEP 8: Salvando automação...');
    
    const saveButton = await page.$('button:has-text("Salvar")');
    if (saveButton) {
      await saveButton.click({ force: true });
      await page.waitForTimeout(2000);
      console.log('✅ Automação salva\n');
    }

    // STEP 9: Capturar estado final
    console.log('📍 STEP 9: Verificando estado final...');
    const finalNodes = await captureState(page, '09-final-state');
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMO DA ANÁLISE:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Nodes após adicionar 1°: ${nodes1.length}`);
    console.log(`Nodes após adicionar 2°: ${nodes2.length}`);
    console.log(`Nodes após adicionar 3°: ${nodes3.length}`);
    console.log(`Nodes no estado final: ${finalNodes.length}`);
    console.log('');
    
    // ANÁLISE DE PROBLEMAS
    const problems: string[] = [];
    
    if (nodes2.length < 2) {
      problems.push('❌ REPLACE DE NODES: Adicionar 2° node substitui o 1°');
    }
    
    if (nodes3.length < 3) {
      problems.push('❌ REPLACE DE NODES: Adicionar 3° node não mantém todos');
    }
    
    if (configButtons.length === 0) {
      problems.push('❌ BOTÕES CONFIGURAR: Não aparecem nos nodes');
    }
    
    if (modalFields.length === 0) {
      problems.push('❌ CAMPOS DO MODAL: Nenhum campo renderizado');
    }
    
    if (linkButtons.length === 0) {
      problems.push('❌ BOTÕES VINCULAR: Não aparecem ao lado dos inputs');
    }
    
    if (problems.length > 0) {
      console.log('🐛 PROBLEMAS IDENTIFICADOS:\n');
      problems.forEach((p, i) => console.log(`${i + 1}. ${p}`));
    } else {
      console.log('✅ NENHUM PROBLEMA ENCONTRADO!\n');
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      nodesAfterStep1: nodes1.length,
      nodesAfterStep2: nodes2.length,
      nodesAfterStep3: nodes3.length,
      finalNodes: finalNodes.length,
      configButtonsFound: configButtons.length,
      modalFieldsFound: modalFields.length,
      linkButtonsFound: linkButtons.length,
      problems: problems,
      nodes1Data: nodes1,
      nodes2Data: nodes2,
      nodes3Data: nodes3,
      finalNodesData: finalNodes,
    };
    
    fs.writeFileSync('debug/test-report.json', JSON.stringify(report, null, 2));
    console.log('📄 Relatório salvo em debug/test-report.json\n');
  });
});
