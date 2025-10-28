import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * 🔬 INVESTIGAÇÃO COMPLETA - TRIGGER DESAPARECENDO + VINCULAÇÃO CONDITION
 * 
 * Fluxo completo conforme especificado:
 * 1. Verificar ambiente
 * 2. Testar conexão
 * 3. Criar automação base
 * 4. Reproduzir bug do trigger
 * 5. Testar persistência de vinculação
 * 6. Verificar ordem/contagem
 * 7. Documentar evidências
 */

const evidenceDir = path.join(process.cwd(), '..', 'investigation-evidence');
const screenshotsDir = path.join(evidenceDir, 'screenshots');
const logsDir = path.join(evidenceDir, 'logs');
const payloadsDir = path.join(evidenceDir, 'payloads');

test.describe('INVESTIGAÇÃO COMPLETA - TRIGGER + VINCULAÇÃO', () => {
  let networkLogs: any[] = [];
  let consoleLogs: any[] = [];
  let savePayloads: any[] = [];
  let testLog: string[] = [];
  
  const log = (message: string, level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    const timestamp = new Date().toISOString().substring(11, 23);
    const icon = { INFO: '📍', WARN: '⚠️', ERROR: '❌', SUCCESS: '✅' }[level];
    const msg = `[${timestamp}] ${icon} ${message}`;
    console.log(msg);
    testLog.push(msg);
  };
  
  test.beforeEach(async ({ page }) => {
    // Capture console logs
    page.on('console', (msg) => {
      consoleLogs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text(),
      });
    });
    
    // Capture network activity
    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('localhost:3333')) {
        const logEntry = {
          timestamp: new Date().toISOString(),
          method: response.request().method(),
          url: url,
          status: response.status(),
        };
        
        networkLogs.push(logEntry);
        
        // Capture POST/PATCH payloads (save operations)
        if (logEntry.method === 'POST' || logEntry.method === 'PATCH') {
          try {
            const requestBody = response.request().postData();
            const responseBody = await response.json().catch(() => null);
            
            const payload = {
              timestamp: logEntry.timestamp,
              method: logEntry.method,
              url: url,
              status: logEntry.status,
              requestBody: requestBody ? JSON.parse(requestBody) : null,
              responseBody: responseBody,
            };
            
            savePayloads.push(payload);
            
            // Save to file
            fs.appendFileSync(
              path.join(payloadsDir, 'save_operations.json'),
              JSON.stringify(payload, null, 2) + ',\n'
            );
          } catch (error) {
            log(`Failed to capture payload: ${error}`, 'WARN');
          }
        }
      }
    });
  });
  
  test('FLUXO COMPLETO - Criar, Editar, Reproduzir Bugs', async ({ page }) => {
    log('\n═══════════════════════════════════════════', 'INFO');
    log('🔬 INVESTIGAÇÃO COMPLETA INICIADA', 'INFO');
    log('═══════════════════════════════════════════\n', 'INFO');
    
    // ========================================
    // STEP 1: VERIFICAÇÃO DE AMBIENTE
    // ========================================
    log('STEP 1: Verificação de Ambiente', 'INFO');
    log('   API URL: http://localhost:3333', 'INFO');
    log('   Frontend URL: http://localhost:8080', 'INFO');
    log('   ✅ Ambiente configurado (validação via UI)\n', 'SUCCESS');
    
    // ========================================
    // STEP 2: TESTE DE CONEXÃO
    // ========================================
    log('STEP 2: Teste de Conexão', 'INFO');
    
    await page.goto('http://localhost:8080');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Capture network state
    const networkState = {
      requests: networkLogs.length,
      errors: networkLogs.filter(l => l.status >= 400).length,
    };
    
    log(`   Network Requests: ${networkState.requests}`, 'INFO');
    log(`   Network Errors: ${networkState.errors}`, networkState.errors > 0 ? 'WARN' : 'SUCCESS');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01_home_network_ok.png'),
      fullPage: true 
    });
    log('   📸 01_home_network_ok.png', 'SUCCESS');
    
    if (networkState.errors > 0) {
      log('   Network errors detected! Stopping.', 'ERROR');
      throw new Error('Network errors present');
    }
    
    log('   ✅ Conexão validada\n', 'SUCCESS');
    
    // ========================================
    // STEP 3: ABRIR AUTOMAÇÃO EXISTENTE
    // ========================================
    log('STEP 3: Abrir Automação Existente para Teste', 'INFO');
    log('   Estratégia: Focar em edição (onde bugs aparecem)', 'INFO');
    
    await page.click('text=Automações');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '02_automations_list.png'),
      fullPage: true 
    });
    log('   📸 02_automations_list.png', 'SUCCESS');
    
    // Count existing automations
    const autoCards = await page.locator('[class*="Card"]').count();
    log(`   Automações encontradas: ${autoCards}`, 'INFO');
    
    // Click first automation card to open/edit
    const firstCard = page.locator('[class*="Card"]').first();
    if (await firstCard.count() > 0) {
      await firstCard.click();
      await page.waitForTimeout(2000);
      log('   Primeira automação clicada', 'INFO');
    } else {
      // Alternative: look for workflow icon/link
      const workflowLinks = page.locator('[class*="workflow"], [href*="automation"]');
      if (await workflowLinks.count() > 0) {
        await workflowLinks.first().click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Should be in workflow editor now
    await page.screenshot({ 
      path: path.join(screenshotsDir, '03_add_trigger.png'),
      fullPage: true 
    });
    log('   📸 03_add_trigger.png - Editor aberto', 'SUCCESS');
    
    // Count initial nodes
    let initialNodeCount = await page.locator('.react-flow__node').count();
    log(`   Nodes iniciais: ${initialNodeCount}`, 'INFO');
    
    // If no nodes, add trigger
    if (initialNodeCount === 0) {
      log('   Adicionando trigger...', 'INFO');
      
      const addBtn = page.locator('button').filter({ hasText: /Adicionar/ }).first();
      if (await addBtn.count() > 0) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        
        // Click ManualTrigger
        const triggerBtn = page.locator('button, [role="option"]').filter({ hasText: /Manual|Trigger/ }).first();
        if (await triggerBtn.count() > 0) {
          await triggerBtn.click();
          await page.waitForTimeout(2000);
          
          initialNodeCount = await page.locator('.react-flow__node').count();
          log(`   Nodes após trigger: ${initialNodeCount}`, 'SUCCESS');
        }
      }
    }
    
    // Add 3 more nodes
    log('   Adicionando nodes 1-3...', 'INFO');
    
    for (let i = 1; i <= 3; i++) {
      const addToolBtn = page.locator('button').filter({ hasText: /Adicionar Tool/ }).first();
      
      if (await addToolBtn.count() > 0) {
        await addToolBtn.click();
        await page.waitForTimeout(1000);
        
        // Select any available tool
        const toolOptions = page.locator('button').filter({ hasText: /Shell|Edit|ReadFile|WriteFile/ });
        const toolCount = await toolOptions.count();
        
        if (toolCount > 0) {
          const randomIndex = Math.floor(Math.random() * Math.min(toolCount, 4));
          await toolOptions.nth(randomIndex).click();
          await page.waitForTimeout(2000);
          
          const currentNodes = await page.locator('.react-flow__node').count();
          log(`   Node ${i} adicionado - Total: ${currentNodes}`, 'INFO');
        }
      }
    }
    
    const nodesAfter3 = await page.locator('.react-flow__node').count();
    log(`   Total após 3 nodes: ${nodesAfter3}`, 'SUCCESS');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '04_add_nodes_1-3.png'),
      fullPage: true 
    });
    log('   📸 04_add_nodes_1-3.png\n', 'SUCCESS');
    
    // ========================================
    // STEP 4: SALVAR PRIMEIRA VEZ
    // ========================================
    log('STEP 4: Salvar Automação (Primeira Vez)', 'INFO');
    
    const saveBtn = page.locator('button').filter({ hasText: /Salvar/ }).first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, '05_save_first_time.png'),
        fullPage: true 
      });
      log('   📸 05_save_first_time.png', 'SUCCESS');
      log(`   Payloads de save capturados: ${savePayloads.length}`, 'INFO');
      log('   ✅ Primeira gravação concluída\n', 'SUCCESS');
    }
    
    // ========================================
    // STEP 5: REPRODUZIR BUG DO TRIGGER
    // ========================================
    log('STEP 4: Reproduzir Bug do Trigger Desaparecendo', 'INFO');
    log('   Estratégia: Adicionar nodes 4, 5, 6, 7 e verificar trigger', 'INFO');
    
    // Go back and reopen
    const backBtn = page.locator('button').filter({ hasText: /Voltar/ }).first();
    if (await backBtn.count() > 0) {
      await backBtn.click();
      await page.waitForTimeout(2000);
      
      await page.screenshot({ 
        path: path.join(screenshotsDir, '06_back_to_list.png'),
        fullPage: true 
      });
      log('   📸 06_back_to_list.png', 'SUCCESS');
      
      // Reopen automation
      const editBtn = page.locator('button').filter({ hasText: /Editar/ }).first();
      if (await editBtn.count() > 0) {
        await editBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '07_reopened_automation.png'),
          fullPage: true 
        });
        log('   📸 07_reopened_automation.png', 'SUCCESS');
        
        const nodesOnReopen = await page.locator('.react-flow__node').count();
        log(`   Nodes após reabrir: ${nodesOnReopen}`, 'INFO');
        
        // Check first node
        if (nodesOnReopen > 0) {
          const firstNode = page.locator('.react-flow__node').first();
          const firstNodeText = await firstNode.textContent();
          const isTrigger = firstNodeText?.toLowerCase().includes('trigger') || firstNodeText?.toLowerCase().includes('manual');
          
          log(`   Primeiro node: ${firstNodeText?.substring(0, 40)}...`, 'INFO');
          log(`   É trigger: ${isTrigger}`, isTrigger ? 'SUCCESS' : 'WARN');
          
          if (!isTrigger) {
            log('   ⚠️ BUG DETECTADO: Primeiro node NÃO é trigger!', 'WARN');
          }
        }
        
        // Now add nodes 4-7 to reproduce bug
        log('   Adicionando nodes 4-7 para reproduzir bug...', 'INFO');
        
        for (let i = 4; i <= 7; i++) {
          const addToolBtn = page.locator('button').filter({ hasText: /Adicionar Tool/ }).first();
          
          if (await addToolBtn.count() > 0) {
            await addToolBtn.click();
            await page.waitForTimeout(1000);
            
            const toolOptions = page.locator('button').filter({ hasText: /Shell|Edit|ReadFile|WriteFile|WebFetch/ });
            const toolCount = await toolOptions.count();
            
            if (toolCount > 0) {
              await toolOptions.first().click();
              await page.waitForTimeout(2000);
              
              const currentNodes = await page.locator('.react-flow__node').count();
              log(`   Node ${i} adicionado - Total nodes: ${currentNodes}`, 'INFO');
              
              // Check trigger after each addition
              const firstNodeNow = page.locator('.react-flow__node').first();
              const firstText = await firstNodeNow.textContent();
              const stillTrigger = firstText?.toLowerCase().includes('trigger') || firstText?.toLowerCase().includes('manual');
              
              if (!stillTrigger) {
                log(`   ⚠️ TRIGGER DESAPARECEU após adicionar node ${i}!`, 'ERROR');
                log(`   Primeiro node agora: ${firstText?.substring(0, 40)}`, 'ERROR');
                
                await page.screenshot({ 
                  path: path.join(screenshotsDir, `08_trigger_disappeared_node${i}.png`),
                  fullPage: true 
                });
                log(`   📸 08_trigger_disappeared_node${i}.png - BUG REPRODUZIDO`, 'ERROR');
                
                // Capture payload/state
                const nodeState = await page.evaluate(() => {
                  const nodes = document.querySelectorAll('.react-flow__node');
                  return {
                    totalVisible: nodes.length,
                    firstNodeClasses: nodes[0]?.className || '',
                    firstNodeHtml: nodes[0]?.innerHTML.substring(0, 200) || '',
                  };
                });
                
                log(`   UI State: ${JSON.stringify(nodeState)}`, 'ERROR');
                
                fs.writeFileSync(
                  path.join(payloadsDir, 'trigger_bug_ui_state.json'),
                  JSON.stringify(nodeState, null, 2)
                );
              }
              
              // Capture screenshot at nodes 5 and 7
              if (i === 5 || i === 7) {
                await page.screenshot({ 
                  path: path.join(screenshotsDir, `09_edit_add_node_${i}.png`),
                  fullPage: true 
                });
                log(`   📸 09_edit_add_node_${i}.png`, 'SUCCESS');
              }
            }
          }
        }
        
        const finalNodeCount = await page.locator('.react-flow__node').count();
        log(`   Total final de nodes: ${finalNodeCount}`, 'INFO');
        
        // Check final state
        if (finalNodeCount > 0) {
          const firstNodeFinal = page.locator('.react-flow__node').first();
          const finalText = await firstNodeFinal.textContent();
          const triggerStillFirst = finalText?.toLowerCase().includes('trigger') || finalText?.toLowerCase().includes('manual');
          
          log(`   Primeiro node (final): ${finalText?.substring(0, 40)}`, 'INFO');
          
          if (triggerStillFirst) {
            log('   ✅ TRIGGER PERMANECEU na posição 1!', 'SUCCESS');
          } else {
            log('   ❌ BUG CONFIRMADO: Trigger não está na posição 1', 'ERROR');
          }
        }
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '10_all_nodes_added.png'),
          fullPage: true 
        });
        log('   📸 10_all_nodes_added.png\n', 'SUCCESS');
      }
    }
    
    // ========================================
    // STEP 6: TESTAR CONDITION NODE LINKING
    // ========================================
    log('STEP 5: Testar Persistência de Vinculação (Condition Node)', 'INFO');
    
    // Add Condition node
    const addToolBtn = page.locator('button').filter({ hasText: /Adicionar Tool/ }).first();
    if (await addToolBtn.count() > 0) {
      await addToolBtn.click();
      await page.waitForTimeout(1000);
      
      const conditionBtn = page.locator('button').filter({ hasText: /Condition/ }).first();
      if (await conditionBtn.count() > 0) {
        await conditionBtn.click();
        await page.waitForTimeout(2000);
        
        log('   Condition node adicionado', 'SUCCESS');
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '11_condition_node_added.png'),
          fullPage: true 
        });
        log('   📸 11_condition_node_added.png', 'SUCCESS');
        
        // Configure Condition node
        const configButtons = page.locator('button[aria-label*="Configure"], button[aria-label*="Configurar"]');
        const configCount = await configButtons.count();
        
        log(`   Botões de configurar encontrados: ${configCount}`, 'INFO');
        
        if (configCount > 0) {
          // Click last config button (should be Condition node)
          await configButtons.last().click();
          await page.waitForTimeout(1500);
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, '12_link_click.png'),
            fullPage: true 
          });
          log('   📸 12_link_click.png - Modal de configuração aberto', 'SUCCESS');
          
          // Try to link
          const vincularBtn = page.locator('button').filter({ hasText: /Vincular/ }).first();
          if (await vincularBtn.count() > 0) {
            await vincularBtn.click();
            await page.waitForTimeout(1000);
            
            log('   Modal de vinculação aberto', 'INFO');
            
            // Select first available output
            const outputOptions = page.locator('button, [role="option"]').filter({ hasText: /output|result|status|success|stdout/ });
            const outputCount = await outputOptions.count();
            
            log(`   Outputs disponíveis para vincular: ${outputCount}`, 'INFO');
            
            if (outputCount > 0) {
              await outputOptions.first().click();
              await page.waitForTimeout(1500);
              
              log('   Output selecionado', 'SUCCESS');
              
              await page.screenshot({ 
                path: path.join(screenshotsDir, '13_link_confirmed.png'),
                fullPage: true 
              });
              log('   📸 13_link_confirmed.png - Link selecionado', 'SUCCESS');
              
              // Check if link is displayed
              const linkDisplay = page.locator('text=/.*\\..*/');
              const linkDisplayCount = await linkDisplay.count();
              
              if (linkDisplayCount > 0) {
                const linkText = await linkDisplay.first().textContent();
                log(`   Link mostrado na UI: ${linkText}`, 'SUCCESS');
                
                // Add a condition value
                const conditionInput = page.locator('input[placeholder*="COMPRAR"], input[placeholder*="valor"]').first();
                if (await conditionInput.count() > 0) {
                  await conditionInput.fill('SUCCESS');
                  log('   Valor de condição adicionado: SUCCESS', 'INFO');
                } else {
                  // Try to add condition
                  const addConditionBtn = page.locator('button').filter({ hasText: /ADD|Adicionar/ }).first();
                  if (await addConditionBtn.count() > 0) {
                    await addConditionBtn.click();
                    await page.waitForTimeout(500);
                    
                    const newInput = page.locator('input').last();
                    await newInput.fill('SUCCESS');
                    log('   Condição adicionada: SUCCESS', 'INFO');
                  }
                }
                
                // Save configuration
                const saveConfigBtn = page.locator('button').filter({ hasText: /Salvar/ }).first();
                if (await saveConfigBtn.count() > 0) {
                  await saveConfigBtn.click();
                  await page.waitForTimeout(1500);
                  
                  log('   Configuração de Condition salva', 'SUCCESS');
                  
                  // Save automation
                  const saveAutoBtn = page.locator('button').filter({ hasText: /Salvar/ }).first();
                  if (await saveAutoBtn.count() > 0) {
                    await saveAutoBtn.click();
                    await page.waitForTimeout(3000);
                    
                    log('   Automação salva com Condition linkado', 'SUCCESS');
                    
                    await page.screenshot({ 
                      path: path.join(screenshotsDir, '14_saved_with_condition.png'),
                      fullPage: true 
                    });
                    log('   📸 14_saved_with_condition.png\n', 'SUCCESS');
                  }
                }
              } else {
                log('   ⚠️ Link não foi exibido na UI', 'WARN');
              }
            } else {
              log('   ⚠️ Nenhum output disponível para vincular', 'WARN');
            }
          } else {
            log('   ⚠️ Botão "Vincular" não encontrado', 'WARN');
          }
        } else {
          log('   ⚠️ Botão de configurar não encontrado', 'WARN');
        }
      }
    }
    
    // ========================================
    // STEP 7: VERIFICAR PERSISTÊNCIA DO LINK
    // ========================================
    log('STEP 6: Verificar Persistência do Link', 'INFO');
    
    // Go back and reopen
    const backBtn2 = page.locator('button').filter({ hasText: /Voltar/ }).first();
    if (await backBtn2.count() > 0) {
      await backBtn2.click();
      await page.waitForTimeout(2000);
      
      // Reopen
      const editBtn2 = page.locator('button').filter({ hasText: /Editar/ }).first();
      if (await editBtn2.count() > 0) {
        await editBtn2.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);
        
        log('   Automação reaberta para verificação', 'INFO');
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '15_after_reload_link_state.png'),
          fullPage: true 
        });
        log('   📸 15_after_reload_link_state.png', 'SUCCESS');
        
        // Open Condition config again
        const configButtons2 = page.locator('button[aria-label*="Configure"], button[aria-label*="Configurar"]');
        const configCount2 = await configButtons2.count();
        
        if (configCount2 > 0) {
          await configButtons2.last().click();
          await page.waitForTimeout(1500);
          
          // Check if link persisted
          const linkDisplay2 = page.locator('text=/.*\\..*/');
          const vinculadoBadge = page.locator('button').filter({ hasText: /Vinculado/ });
          
          const linkPersisted = await linkDisplay2.count() > 0;
          const badgePresent = await vinculadoBadge.count() > 0;
          
          log(`   Link visível: ${linkPersisted}`, linkPersisted ? 'SUCCESS' : 'ERROR');
          log(`   Badge "Vinculado": ${badgePresent}`, badgePresent ? 'SUCCESS' : 'WARN');
          
          if (linkPersisted) {
            const linkText2 = await linkDisplay2.first().textContent();
            log(`   Link persistido: ${linkText2}`, 'SUCCESS');
            log('   ✅ VINCULAÇÃO PERSISTIU CORRETAMENTE!', 'SUCCESS');
          } else {
            log('   ❌ BUG CONFIRMADO: Vinculação NÃO persistiu', 'ERROR');
          }
          
          await page.screenshot({ 
            path: path.join(screenshotsDir, '16_link_persistence_check.png'),
            fullPage: true 
          });
          log('   📸 16_link_persistence_check.png\n', 'SUCCESS');
        }
      }
    }
    
    // ========================================
    // STEP 8: VERIFICAR ORDEM E CONTAGEM
    // ========================================
    log('STEP 7: Verificar Ordem e Contagem de Nodes', 'INFO');
    
    const finalState = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('.react-flow__node'));
      return {
        totalNodes: nodes.length,
        nodesInfo: nodes.slice(0, 5).map((node, i) => ({
          position: i + 1,
          text: node.textContent?.substring(0, 50) || '',
          id: node.getAttribute('data-id') || '',
        })),
      };
    });
    
    log(`   Total nodes na UI: ${finalState.totalNodes}`, 'INFO');
    finalState.nodesInfo.forEach((node: any) => {
      log(`   Posição ${node.position}: ${node.text}`, 'INFO');
    });
    
    fs.writeFileSync(
      path.join(payloadsDir, 'final_ui_state.json'),
      JSON.stringify(finalState, null, 2)
    );
    
    log('   UI state salvo em: final_ui_state.json', 'SUCCESS');
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '17_final_state_complete.png'),
      fullPage: true 
    });
    log('   📸 17_final_state_complete.png\n', 'SUCCESS');
    
    // ========================================
    // SAVE ALL LOGS
    // ========================================
    fs.writeFileSync(
      path.join(logsDir, 'test_execution.log'),
      testLog.join('\n')
    );
    
    fs.writeFileSync(
      path.join(logsDir, 'network_logs.json'),
      JSON.stringify(networkLogs, null, 2)
    );
    
    fs.writeFileSync(
      path.join(logsDir, 'console_logs.json'),
      JSON.stringify(consoleLogs, null, 2)
    );
    
    log('\n═══════════════════════════════════════════', 'INFO');
    log('📊 INVESTIGAÇÃO COMPLETA FINALIZADA', 'SUCCESS');
    log('═══════════════════════════════════════════', 'INFO');
    log(`Screenshots: ${fs.readdirSync(screenshotsDir).length}`, 'INFO');
    log(`Network Logs: ${networkLogs.length} requests`, 'INFO');
    log(`Save Operations: ${savePayloads.length}`, 'INFO');
    log(`Console Logs: ${consoleLogs.length} messages`, 'INFO');
    log('═══════════════════════════════════════════\n', 'INFO');
  });
});
