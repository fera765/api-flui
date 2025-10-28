import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * 🎯 VALIDAÇÃO MANUAL DOS 3 BUGS
 * Testa especificamente os 3 bugs relatados
 */

const screenshotsDir = path.join(process.cwd(), '..', 'screenshots');

test.describe('Bug Validation - Manual Approach', () => {
  test('Bug #1: API Connection', async ({ page }) => {
    console.log('\n🔍 BUG #1: VERIFICAÇÃO DE CONEXÃO API\n');
    
    // Go to page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check API
    const apiResult = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3333/api/all-tools');
        const data = await response.json();
        return { success: true, status: response.status, toolsCount: data.summary?.totalTools };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('   API Status:', apiResult.success ? apiResult.status : 'ERROR');
    console.log('   Tools Available:', apiResult.success ? apiResult.toolsCount : 0);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'bug1-api-connection.png'),
      fullPage: true 
    });
    
    expect(apiResult.success).toBe(true);
    expect(apiResult.status).toBe(200);
    
    console.log('✅ BUG #1: API conectada e funcionando!\n');
  });
  
  test('Bug #2: Trigger Persistence - Verification via Existing Automation', async ({ page }) => {
    console.log('\n🔍 BUG #2: TRIGGER DESAPARECENDO - VERIFICAÇÃO\n');
    
    await page.goto('http://localhost:8080/automations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'bug2-01-automations-list.png'),
      fullPage: true 
    });
    console.log('   📸 bug2-01-automations-list.png');
    
    // Count automations
    const autoCards = await page.locator('[class*="card"]').count();
    console.log(`   Automações encontradas: ${autoCards}`);
    
    if (autoCards > 0) {
      // Click first "Edit" button
      const editButtons = page.locator('button').filter({ hasText: /Editar|Edit/ });
      const editCount = await editButtons.count();
      
      console.log(`   Botões "Editar" encontrados: ${editCount}`);
      
      if (editCount > 0) {
        await editButtons.first().click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, 'bug2-02-workflow-opened.png'),
          fullPage: true 
        });
        console.log('   📸 bug2-02-workflow-opened.png');
        
        // Count nodes
        const nodeCount = await page.locator('.react-flow__node').count();
        console.log(`   Nodes visíveis no workflow: ${nodeCount}`);
        
        if (nodeCount > 0) {
          // Get first node text
          const firstNode = page.locator('.react-flow__node').first();
          const firstNodeText = await firstNode.textContent();
          console.log(`   Primeiro nó: ${firstNodeText?.substring(0, 60)}...`);
          
          // Check if it's a trigger
          const isTrigger = firstNodeText?.toLowerCase().includes('trigger');
          console.log(`   É um trigger: ${isTrigger}`);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, 'bug2-03-nodes-detail.png'),
            fullPage: true 
          });
          console.log('   📸 bug2-03-nodes-detail.png');
          
          if (isTrigger && nodeCount > 0) {
            console.log('✅ BUG #2: Trigger está visível!\n');
          } else {
            console.log('⚠️  BUG #2: Trigger pode não estar visível ou não há nodes\n');
          }
        } else {
          console.log('⚠️  BUG #2: Nenhum node encontrado no workflow\n');
        }
      } else {
        console.log('⚠️  Nenhum botão "Editar" disponível\n');
      }
    } else {
      console.log('⚠️  Nenhuma automação existente para testar\n');
    }
  });
  
  test('Bug #3: Logo Navigation', async ({ page }) => {
    console.log('\n🔍 BUG #3: NAVEGAÇÃO DO LOGO\n');
    
    await page.goto('http://localhost:8080/automations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    
    const urlBefore = page.url();
    console.log(`   URL antes: ${urlBefore}`);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'bug3-01-before-logo-click.png'),
      fullPage: true 
    });
    
    // Try to click logo/brand link
    const logoSelectors = [
      'a[href="/"]',
      'a:has-text("Flui")',
      '[class*="logo"]',
      'header a:first-child'
    ];
    
    let logoClicked = false;
    for (const selector of logoSelectors) {
      try {
        const logo = page.locator(selector).first();
        if (await logo.count() > 0) {
          console.log(`   Tentando clicar logo com selector: ${selector}`);
          await logo.click({ timeout: 2000 });
          logoClicked = true;
          break;
        }
      } catch {}
    }
    
    if (logoClicked) {
      await page.waitForTimeout(1500);
      
      const urlAfter = page.url();
      console.log(`   URL depois: ${urlAfter}`);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, 'bug3-02-after-logo-click.png'),
        fullPage: true 
      });
      
      const navigatedToHome = urlAfter.endsWith('/') || !urlAfter.includes('/automations');
      
      if (navigatedToHome) {
        console.log('✅ BUG #3: Logo navega corretamente!\n');
      } else {
        console.log('❌ BUG #3: Logo NÃO navegou para home\n');
      }
      
      expect(navigatedToHome).toBe(true);
    } else {
      console.log('⚠️  Logo não encontrado para clicar\n');
    }
  });
  
  test('Complete Visual Summary', async ({ page }) => {
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 RESUMO COMPLETO DA VALIDAÇÃO VISUAL');
    console.log('═══════════════════════════════════════════\n');
    
    // Navigate through all pages
    await page.goto('http://localhost:8080');
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'summary-01-home.png'),
      fullPage: true 
    });
    console.log('📸 summary-01-home.png');
    
    await page.click('text=Automações');
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'summary-02-automations.png'),
      fullPage: true 
    });
    console.log('📸 summary-02-automations.png');
    
    await page.click('text=Tools');
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'summary-03-tools.png'),
      fullPage: true 
    });
    console.log('📸 summary-03-tools.png');
    
    await page.click('text=Agents');
    await page.waitForTimeout(1500);
    await page.screenshot({ 
      path: path.join(screenshotsDir, 'summary-04-agents.png'),
      fullPage: true 
    });
    console.log('📸 summary-04-agents.png');
    
    console.log('\n✅ VALIDAÇÃO VISUAL COMPLETA');
    console.log('═══════════════════════════════════════════\n');
  });
});
