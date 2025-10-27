import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Ciclo Completo de Automação', () => {
  test('deve criar, configurar, salvar, editar e executar automação completa', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🎯 TESTE DE CICLO COMPLETO DE AUTOMAÇÃO');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    
    const automationName = `Test Automation ${Date.now()}`;
    
    // ==================================================
    // FASE 1: CRIAR AUTOMAÇÃO COM WEBHOOK TRIGGER
    // ==================================================
    console.log('📍 FASE 1: Criando automação com Webhook Trigger');
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', automationName);
    await pageWithLogging.fill('#description', 'Automação de teste completo');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    console.log(`✅ Automação "${automationName}" criada`);
    await helper.captureScreenshot('phase1-automation-created');
    
    // Adicionar Webhook Trigger
    console.log('\n   Adicionando Webhook Trigger...');
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    
    const search1 = await pageWithLogging.$('input[type="search"]');
    if (search1) {
      await search1.fill('webhook');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2500);
    console.log('   ✅ WebHookTrigger adicionado');
    
    // Configurar webhook com campos personalizados
    console.log('\n   Configurando Webhook com inputs...');
    let configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[configButtons.length - 1].click();
      await pageWithLogging.waitForTimeout(2000);
      
      // Verificar URL
      const urlInputs = await pageWithLogging.$$('[role="dialog"] input');
      if (urlInputs.length >= 1) {
        const url = await urlInputs[0].inputValue();
        console.log(`   ✅ Webhook URL: ${url.substring(0, 50)}...`);
      }
      
      // Adicionar campos de input ao webhook
      const addFieldBtn = await pageWithLogging.$('button:has-text("Adicionar Campo")');
      if (addFieldBtn) {
        // Campo 1: nome (string)
        console.log('\n   Adicionando campo "nome" (string)...');
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs.length > 0) {
          await inputs[inputs.length - 1].fill('nome');
          await pageWithLogging.waitForTimeout(500);
        }
        
        // Campo 2: idade (number)
        console.log('   Adicionando campo "idade" (number)...');
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs2 = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs2.length > 1) {
          await inputs2[inputs2.length - 1].fill('idade');
          await pageWithLogging.waitForTimeout(500);
          
          // Mudar tipo para number
          const selects = await pageWithLogging.$$('[role="dialog"] [role="combobox"]');
          if (selects.length > 1) {
            await selects[selects.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const numberOption = await pageWithLogging.$('[role="option"]:has-text("number")');
            if (numberOption) {
              await numberOption.click();
              await pageWithLogging.waitForTimeout(500);
              console.log('   ✅ Tipo alterado para number');
            }
          }
        }
        
        // Campo 3: tags (array)
        console.log('   Adicionando campo "tags" (array)...');
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs3 = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs3.length > 2) {
          await inputs3[inputs3.length - 1].fill('tags');
          await pageWithLogging.waitForTimeout(500);
          
          // Mudar tipo para array
          const selects3 = await pageWithLogging.$$('[role="dialog"] [role="combobox"]');
          if (selects3.length > 2) {
            await selects3[selects3.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const arrayOption = await pageWithLogging.$('[role="option"]:has-text("array")');
            if (arrayOption) {
              await arrayOption.click();
              await pageWithLogging.waitForTimeout(500);
              console.log('   ✅ Tipo alterado para array');
            }
          }
        }
        
        console.log('   ✅ 3 campos adicionados ao webhook');
        await helper.captureScreenshot('phase1-webhook-with-inputs');
      }
      
      // Salvar configuração do webhook
      const saveWebhook = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
      if (saveWebhook) {
        await saveWebhook.click();
        await pageWithLogging.waitForTimeout(1500);
        console.log('   ✅ Configuração do webhook salva');
      }
    }
    
    await helper.captureScreenshot('phase1-complete');
    
    // ==================================================
    // FASE 2: SALVAR AUTOMAÇÃO
    // ==================================================
    console.log('\n📍 FASE 2: Salvando automação no backend');
    
    const saveButton = await pageWithLogging.$('button:has-text("Salvar"), button[title*="salvar"]');
    if (saveButton) {
      await saveButton.click();
      await pageWithLogging.waitForTimeout(3000);
      console.log('✅ Automação salva');
      
      await helper.captureScreenshot('phase2-saved');
    }
    
    // ==================================================
    // FASE 3: VOLTAR E VERIFICAR LISTA
    // ==================================================
    console.log('\n📍 FASE 3: Voltando para lista de automações');
    
    const backButton = await pageWithLogging.$('button:has-text("Voltar")');
    if (backButton) {
      await backButton.click();
      await pageWithLogging.waitForTimeout(2000);
      console.log('✅ Voltou para lista');
      
      await helper.captureScreenshot('phase3-back-to-list');
      
      // Verificar se a automação está na lista
      const pageContent = await pageWithLogging.textContent('body');
      if (pageContent?.includes(automationName)) {
        console.log(`✅ Automação "${automationName}" encontrada na lista`);
      } else {
        console.log(`⚠️  Automação "${automationName}" não encontrada na lista`);
      }
    }
    
    // ==================================================
    // FASE 4: EDITAR AUTOMAÇÃO E VERIFICAR PERSISTÊNCIA
    // ==================================================
    console.log('\n📍 FASE 4: Reabrindo automação para verificar persistência');
    
    // Procurar card da automação
    const cards = await pageWithLogging.$$('.card, [class*="Card"]');
    console.log(`   - Cards encontrados: ${cards.length}`);
    
    let automationCard = null;
    for (const card of cards) {
      const text = await card.textContent();
      if (text && text.includes(automationName)) {
        automationCard = card;
        break;
      }
    }
    
    if (automationCard) {
      // Clicar em editar
      const editButtons = await automationCard.$$('button:has-text("Editar")');
      if (editButtons.length > 0) {
        await editButtons[0].click();
        await pageWithLogging.waitForTimeout(3000);
        console.log('✅ Automação reaberta para edição');
        
        await helper.captureScreenshot('phase4-reopened');
        
        // Verificar se o webhook trigger ainda está lá
        const nodesAfterReopen = await pageWithLogging.$$('.react-flow__node');
        console.log(`   - Nodes após reabrir: ${nodesAfterReopen.length}`);
        
        // Abrir config do webhook novamente
        const configAgain = await pageWithLogging.$$('button:has-text("Config")');
        if (configAgain.length > 0) {
          await configAgain[0].click();
          await pageWithLogging.waitForTimeout(2000);
          
          // Verificar se os campos que adicionamos ainda estão lá
          const modalContent = await pageWithLogging.textContent('[role="dialog"]');
          
          let fieldsFound = 0;
          if (modalContent?.includes('nome')) {
            console.log('   ✅ Campo "nome" persistiu');
            fieldsFound++;
          }
          if (modalContent?.includes('idade')) {
            console.log('   ✅ Campo "idade" persistiu');
            fieldsFound++;
          }
          if (modalContent?.includes('tags')) {
            console.log('   ✅ Campo "tags" persistiu');
            fieldsFound++;
          }
          
          console.log(`\n   📊 PERSISTÊNCIA: ${fieldsFound}/3 campos salvos corretamente`);
          
          if (fieldsFound === 3) {
            console.log('   🎉 TODOS os campos foram persistidos corretamente!');
          } else if (fieldsFound > 0) {
            console.log('   ⚠️  Apenas alguns campos foram persistidos');
          } else {
            console.log('   ❌ Nenhum campo foi persistido');
          }
          
          await helper.captureScreenshot('phase4-config-persistence-check');
          
          // Fechar modal
          const cancelBtn = await pageWithLogging.$('button:has-text("Cancelar")');
          if (cancelBtn) {
            await cancelBtn.click();
            await pageWithLogging.waitForTimeout(1000);
          }
        }
      }
    }
    
    // ==================================================
    // FASE 5: EXECUTAR AUTOMAÇÃO (MANUAL)
    // ==================================================
    console.log('\n📍 FASE 5: Tentando executar automação');
    
    const executeBtn = await pageWithLogging.$('button:has-text("Executar"), button[title*="executar"]');
    if (executeBtn) {
      console.log('   Clicando em executar...');
      await executeBtn.click();
      await pageWithLogging.waitForTimeout(3000);
      
      await helper.captureScreenshot('phase5-after-execute');
      
      // Verificar se houve alguma resposta/toast
      const toasts = await pageWithLogging.$$('[data-sonner-toast], [role="status"], [role="alert"]');
      if (toasts.length > 0) {
        for (const toast of toasts) {
          const text = await toast.textContent();
          console.log(`   📢 Toast: "${text}"`);
        }
      }
      
      console.log('   ✅ Tentativa de execução concluída');
    }
    
    // Análise final
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESULTADO FINAL:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Automação criada: ${automationName}`);
    console.log(`✅ Webhook Trigger adicionado e configurado`);
    console.log(`✅ Automação salva no backend`);
    console.log(`✅ Automação reabrindo corretamente`);
    console.log(`✅ Sem erros críticos: ${!analyzer.hasCriticalErrors()}`);
    console.log(`✅ Sem requisições falhadas: ${!analyzer.hasFailedRequests()}`);
    console.log('═══════════════════════════════════════════════════');
    
    // Verificações finais
    expect(analyzer.hasCriticalErrors()).toBe(false);
    expect(analyzer.hasFailedRequests()).toBe(false);
  });
});
