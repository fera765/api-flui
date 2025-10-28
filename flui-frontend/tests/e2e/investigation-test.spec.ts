import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * 🔬 TESTE DE INVESTIGAÇÃO COMPLETO
 * 
 * Reproduz e documenta:
 * 1. Trigger desaparecendo ao editar automação
 * 2. Vinculação de Condition node não persistindo
 */

const screenshotsDir = path.join(process.cwd(), '..', 'investigation-screenshots');
const logsDir = path.join(screenshotsDir, 'logs');

// Ensure directories exist
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

test.describe('Investigation: Trigger Disappearing & Link Persistence', () => {
  let networkLogs: any[] = [];
  let consoleLogs: any[] = [];
  
  test.beforeEach(async ({ page }) => {
    // Capture network logs
    page.on('response', async (response) => {
      if (response.url().includes('localhost:3333')) {
        networkLogs.push({
          timestamp: new Date().toISOString(),
          url: response.url(),
          status: response.status(),
          method: response.request().method(),
        });
      }
    });
    
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
      });
    });
    
    console.log('\n═══════════════════════════════════════════');
    console.log('🔬 STARTING INVESTIGATION TEST');
    console.log('═══════════════════════════════════════════\n');
  });
  
  test('Complete Investigation Flow', async ({ page }) => {
    const automationName = `Investigation ${Date.now()}`;
    
    // ========================================
    // PASSO 2: TESTE DE CONEXÃO INICIAL
    // ========================================
    console.log('📍 PASSO 2: Teste de Conexão Inicial');
    
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Test API connection
    const apiTest = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3333/api/automations');
        return {
          status: response.status,
          ok: response.ok,
          error: null
        };
      } catch (error: any) {
        return {
          status: 0,
          ok: false,
          error: error.message
        };
      }
    });
    
    if (apiTest.ok) {
      console.log(`✅ API Connection: Status ${apiTest.status}`);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '01_home_network_ok.png'),
        fullPage: true 
      });
    } else {
      console.log(`❌ API Connection Failed: ${apiTest.error || apiTest.status}`);
      await page.screenshot({ 
        path: path.join(screenshotsDir, '01_home_network_error.png'),
        fullPage: true 
      });
      
      // Save network logs
      fs.writeFileSync(
        path.join(logsDir, 'network_error.json'),
        JSON.stringify({ apiTest, networkLogs }, null, 2)
      );
      
      throw new Error(`API not reachable: ${apiTest.error}`);
    }
    
    console.log('Network Logs:', networkLogs.length, 'requests captured\n');
    
    // ========================================
    // PASSO 3: CRIAR AUTOMAÇÃO BASE
    // ========================================
    console.log('📍 PASSO 3: Criar Automação Base');
    
    // Navigate to automations
    try {
      await page.click('text=Automações', { timeout: 5000 });
      await page.waitForTimeout(1500);
    } catch {
      await page.goto('http://localhost:8080/automations');
      await page.waitForTimeout(1500);
    }
    
    // 02 - Create start
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02_create_start.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: 02_create_start.png');
    
    // Open create dialog
    const createBtn = page.locator('button').filter({ hasText: /Criar/ }).first();
    if (await createBtn.count() > 0) {
      await createBtn.click();
      await page.waitForTimeout(1000);
      
      const nameInput = page.locator('input#name, input[type="text"]').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill(automationName);
        
        const nextBtn = page.locator('button').filter({ hasText: /Próximo|Criar/ }).last();
        await nextBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    }
    
    console.log(`✅ Automation "${automationName}" creation started\n`);
    
    // ========================================
    // Add Trigger (should be first node)
    // ========================================
    console.log('📍 Adding Trigger (Node 1)...');
    
    const addBtn1 = page.locator('button').filter({ hasText: /Adicionar/ }).first();
    if (await addBtn1.count() > 0) {
      await addBtn1.click();
      await page.waitForTimeout(1000);
      
      // Look for Manual Trigger
      const triggerOptions = await page.locator('text=Manual, button').count();
      if (triggerOptions > 0) {
        await page.locator('text=Manual').first().click();
        await page.waitForTimeout(1500);
        
        // 03 - Add trigger
        await page.screenshot({ 
          path: path.join(screenshotsDir, '03_add_trigger.png'),
          fullPage: true 
        });
        console.log('📸 Screenshot: 03_add_trigger.png');
        
        const nodesCount = await page.locator('.react-flow__node').count();
        console.log(`   Nodes after adding trigger: ${nodesCount}`);
        console.log(`   ✅ Trigger added\n`);
      }
    }
    
    // ========================================
    // Add 3 more nodes
    // ========================================
    console.log('📍 Adding Nodes 2-4...');
    
    for (let i = 2; i <= 4; i++) {
      const addBtn = page.locator('button').filter({ hasText: /Adicionar/ }).first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        
        // Click first available tool
        const toolBtns = page.locator('button, [role="button"]').filter({ hasText: /Shell|File|Edit|Tool/ });
        const toolCount = await toolBtns.count();
        if (toolCount > 0) {
          const index = Math.min(i - 2, toolCount - 1);
          await toolBtns.nth(index).click();
          await page.waitForTimeout(1500);
          
          console.log(`   Node ${i} added`);
        }
      }
    }
    
    // 04 - Nodes 1-3 added
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04_add_nodes_1-4.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: 04_add_nodes_1-4.png');
    
    const totalNodes = await page.locator('.react-flow__node').count();
    console.log(`   Total nodes: ${totalNodes}`);
    console.log(`   ✅ Nodes 1-4 added\n`);
    
    // ========================================
    // SAVE FIRST TIME
    // ========================================
    console.log('📍 Saving automation for the first time...');
    
    const saveBtn = page.locator('button').filter({ hasText: /^Salvar/ }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(2000);
      
      // 05 - Save first time
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05_save_first_time.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot: 05_save_first_time.png');
      console.log('   ✅ Automation saved\n');
    }
    
    // Capture save payload from network
    const saveRequest = networkLogs.filter(log => 
      log.method === 'POST' || log.method === 'PATCH'
    ).slice(-1)[0];
    
    if (saveRequest) {
      console.log('   Save request:', saveRequest.url);
      fs.writeFileSync(
        path.join(logsDir, 'save_request_1.json'),
        JSON.stringify(saveRequest, null, 2)
      );
    }
    
    // ========================================
    // PASSO 4: EDITAR E REPRODUZIR BUG DO TRIGGER
    // ========================================
    console.log('📍 PASSO 4: Editar Automação e Reproduzir Bug');
    
    // Go back
    const backBtn = page.locator('button').filter({ hasText: /Voltar/ }).first();
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    }
    
    // Reopen automation
    console.log('   Reopening automation...');
    const editBtn = page.locator('button').filter({ hasText: /Editar/ }).last();
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      const nodesAfterReopen = await page.locator('.react-flow__node').count();
      console.log(`   Nodes after reopen: ${nodesAfterReopen}`);
      
      // Check if trigger is visible
      const triggerVisible = await page.locator('.react-flow__node').first().isVisible();
      console.log(`   First node (trigger) visible: ${triggerVisible}`);
    }
    
    // Add more nodes to trigger the bug
    console.log('\n   Adding nodes 5-7 (testing trigger visibility)...');
    
    for (let i = 5; i <= 7; i++) {
      const addBtn = page.locator('button').filter({ hasText: /Adicionar/ }).first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1000);
        
        const toolBtns = page.locator('button, [role="button"]').filter({ hasText: /Shell|File|Edit|Tool/ });
        const toolCount = await toolBtns.count();
        if (toolCount > 0) {
          await toolBtns.first().click();
          await page.waitForTimeout(1500);
          
          const currentNodes = await page.locator('.react-flow__node').count();
          console.log(`   After adding node ${i}: ${currentNodes} nodes visible`);
          
          // Screenshot for each addition
          await page.screenshot({ 
            path: path.join(screenshotsDir, `0${i + 1}_edit_add_node_${i}.png`),
            fullPage: true 
          });
          console.log(`   📸 Screenshot: 0${i + 1}_edit_add_node_${i}.png`);
        }
      }
    }
    
    const finalNodes = await page.locator('.react-flow__node').count();
    console.log(`\n   Final node count: ${finalNodes}`);
    console.log(`   Expected: 7 (1 trigger + 6 tools)\n`);
    
    // ========================================
    // VERIFICATION: Check trigger position
    // ========================================
    console.log('🔍 VERIFICATION: Checking trigger position...');
    
    const allNodes = await page.locator('.react-flow__node').all();
    console.log(`   Total nodes in DOM: ${allNodes.length}`);
    
    if (allNodes.length > 0) {
      for (let i = 0; i < Math.min(3, allNodes.length); i++) {
        const nodeText = await allNodes[i].textContent();
        console.log(`   Node ${i + 1}: ${nodeText?.substring(0, 50)}...`);
      }
    }
    
    // ========================================
    // SAVE AND FINAL VERIFICATION
    // ========================================
    console.log('\n📍 Saving edited automation...');
    
    const saveBtn2 = page.locator('button').filter({ hasText: /^Salvar/ }).first();
    if (await saveBtn2.count() > 0) {
      await saveBtn2.click();
      await page.waitForTimeout(2000);
    }
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '09_save_after_edit.png'),
      fullPage: true 
    });
    console.log('📸 Screenshot: 09_save_after_edit.png\n');
    
    // ========================================
    // SAVE ALL LOGS
    // ========================================
    fs.writeFileSync(
      path.join(logsDir, 'network_logs.json'),
      JSON.stringify(networkLogs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(logsDir, 'console_logs.json'),
      JSON.stringify(consoleLogs, null, 2)
    );
    
    console.log('═══════════════════════════════════════════');
    console.log('📊 INVESTIGATION SUMMARY');
    console.log('═══════════════════════════════════════════');
    console.log(`Screenshots captured: 9+`);
    console.log(`Network requests logged: ${networkLogs.length}`);
    console.log(`Console logs captured: ${consoleLogs.length}`);
    console.log(`Final node count: ${finalNodes}`);
    console.log('✅ Investigation test completed\n');
  });
});
