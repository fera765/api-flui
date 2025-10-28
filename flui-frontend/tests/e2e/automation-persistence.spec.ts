import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Automation Persistence Tests', () => {
  const screenshotsDir = path.join(process.cwd(), '..', 'screenshots');
  
  test.beforeEach(async ({ page }) => {
    // Navigate to automations page
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    
    // Click on Automations in the menu
    await page.click('text=Automações');
    await page.waitForLoadState('networkidle');
  });

  test('01 - Create automation and verify persistence', async ({ page }) => {
    // Screenshot 1: Initial automations page
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-automations-initial-page.png'),
      fullPage: true 
    });

    // Click "Criar Automação" button
    await page.click('text=Criar Automação');
    await page.waitForSelector('text=Nova Automação');
    
    // Screenshot 2: Create dialog
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02-create-automation-dialog.png'),
      fullPage: true 
    });

    // Fill in automation details
    await page.fill('input[id="name"]', 'Test Automation Persistence');
    await page.fill('textarea[id="description"]', 'Testing node positions and config persistence');
    
    // Screenshot 3: Filled form
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03-filled-automation-form.png'),
      fullPage: true 
    });

    // Click "Próximo: Criar Workflow"
    await page.click('text=Próximo: Criar Workflow');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for workflow editor to load
    
    // Screenshot 4: Empty workflow editor
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04-empty-workflow-editor.png'),
      fullPage: true 
    });

    // Add first node (trigger)
    await page.click('text=Adicionar Trigger');
    await page.waitForSelector('text=Selecionar Tool');
    
    // Screenshot 5: Tool selection modal
    await page.screenshot({ 
      path: path.join(screenshotsDir, '05-tool-selection-modal.png'),
      fullPage: true 
    });

    // Select Manual Trigger
    await page.click('text=Manual Trigger');
    await page.waitForTimeout(500);
    
    // Screenshot 6: First node added
    await page.screenshot({ 
      path: path.join(screenshotsDir, '06-first-node-added.png'),
      fullPage: true 
    });

    // Add second node (tool)
    await page.click('text=Adicionar Tool');
    await page.waitForSelector('text=Selecionar Tool');
    
    // Try to find and click a tool (e.g., Shell Tool or File Tool)
    const shellTool = page.locator('text=Shell Tool').first();
    if (await shellTool.count() > 0) {
      await shellTool.click();
    } else {
      // If Shell Tool not found, click the first available tool
      await page.locator('[role="button"]').filter({ hasText: /Tool|Action/ }).first().click();
    }
    await page.waitForTimeout(500);
    
    // Screenshot 7: Second node added
    await page.screenshot({ 
      path: path.join(screenshotsDir, '07-second-node-added.png'),
      fullPage: true 
    });

    // Drag first node to reposition (simulate position change)
    const firstNode = page.locator('.react-flow__node').first();
    if (await firstNode.count() > 0) {
      const box = await firstNode.boundingBox();
      if (box) {
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 50);
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }
    
    // Screenshot 8: Repositioned nodes
    await page.screenshot({ 
      path: path.join(screenshotsDir, '08-repositioned-nodes.png'),
      fullPage: true 
    });

    // Try to configure first node
    const configButton = page.locator('[aria-label*="Configure"]').or(page.locator('button:has-text("Configurar")')).first();
    if (await configButton.count() > 0) {
      await configButton.click();
      await page.waitForTimeout(500);
      
      // Screenshot 9: Configuration modal
      await page.screenshot({ 
        path: path.join(screenshotsDir, '09-configuration-modal.png'),
        fullPage: true 
      });
      
      // Fill some config if available
      const textInput = page.locator('input[type="text"]').first();
      if (await textInput.count() > 0 && await textInput.isVisible()) {
        await textInput.fill('Test configuration value');
      }
      
      // Save config
      const saveButton = page.locator('button:has-text("Salvar")').first();
      if (await saveButton.count() > 0) {
        await saveButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    // Screenshot 10: After configuration
    await page.screenshot({ 
      path: path.join(screenshotsDir, '10-after-configuration.png'),
      fullPage: true 
    });

    // Save the automation
    const saveAutomationButton = page.locator('button:has-text("Salvar")').first();
    await saveAutomationButton.click();
    await page.waitForTimeout(1000); // Wait for save to complete
    
    // Screenshot 11: After save
    await page.screenshot({ 
      path: path.join(screenshotsDir, '11-after-save.png'),
      fullPage: true 
    });

    // Click back button
    const backButton = page.locator('button').filter({ hasText: /Voltar|Back/ }).first();
    if (await backButton.count() > 0) {
      await backButton.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }
    
    // Screenshot 12: Back to automations list
    await page.screenshot({ 
      path: path.join(screenshotsDir, '12-back-to-list.png'),
      fullPage: true 
    });

    // Verify automation appears in the list
    await expect(page.locator('text=Test Automation Persistence')).toBeVisible();
    
    // Click edit on the automation
    const editButton = page.locator('button:has-text("Editar")').last();
    await editButton.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot 13: Reopened editor
    await page.screenshot({ 
      path: path.join(screenshotsDir, '13-reopened-editor.png'),
      fullPage: true 
    });

    // Verify nodes are still there
    const nodes = page.locator('.react-flow__node');
    expect(await nodes.count()).toBeGreaterThan(0);
    
    // Screenshot 14: Verify nodes persisted
    await page.screenshot({ 
      path: path.join(screenshotsDir, '14-verify-nodes-persisted.png'),
      fullPage: true 
    });

    console.log('✅ Test completed successfully - all screenshots saved');
  });

  test('02 - Verify connections persistence', async ({ page }) => {
    // This test verifies that connections/links are properly saved
    
    // Create a new automation
    await page.click('text=Criar Automação');
    await page.fill('input[id="name"]', 'Test Connections');
    await page.click('text=Próximo: Criar Workflow');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Screenshot 15: New workflow for connections test
    await page.screenshot({ 
      path: path.join(screenshotsDir, '15-new-workflow-connections.png'),
      fullPage: true 
    });

    // Add trigger
    await page.click('text=Adicionar Trigger');
    await page.click('text=Manual Trigger');
    await page.waitForTimeout(500);

    // Add another tool
    await page.click('text=Adicionar Tool');
    const firstTool = page.locator('[role="button"]').filter({ hasText: /Tool|Action/ }).first();
    await firstTool.click();
    await page.waitForTimeout(500);
    
    // Screenshot 16: Two connected nodes
    await page.screenshot({ 
      path: path.join(screenshotsDir, '16-two-connected-nodes.png'),
      fullPage: true 
    });

    // Verify edge/connection exists
    const edges = page.locator('.react-flow__edge');
    expect(await edges.count()).toBeGreaterThan(0);
    
    // Save
    await page.locator('button:has-text("Salvar")').first().click();
    await page.waitForTimeout(1000);
    
    // Go back
    const backButton = page.locator('button').filter({ hasText: /Voltar|Back/ }).first();
    if (await backButton.count() > 0) {
      await backButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Screenshot 17: Connections list view
    await page.screenshot({ 
      path: path.join(screenshotsDir, '17-connections-list-view.png'),
      fullPage: true 
    });

    // Check that it shows correct number of connections
    const automationCard = page.locator('text=Test Connections').locator('..').locator('..');
    const connectionsText = automationCard.locator('text=/\\d+ conexões/');
    await expect(connectionsText).toBeVisible();
    
    console.log('✅ Connections test completed');
  });
});
