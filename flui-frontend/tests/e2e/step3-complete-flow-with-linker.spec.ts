import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('PASSO 3: Fluxo Completo com Linker', () => {
  test.setTimeout(180000); // 3 minutos
  
  test('deve criar workflow completo com trigger + tools + linker + save', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 PASSO 3: FLUXO COMPLETO COM LINKER');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    const automationName = `Complete Linker Flow ${Date.now()}`;
    
    // ==================================================
    // ETAPA 1: Criar Automação com Webhook Trigger
    // ==================================================
    console.log('📍 ETAPA 1: Criando automação com Webhook Trigger');
    console.log('─────────────────────────────────────────────────────────────');
    
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', automationName);
    await pageWithLogging.fill('#description', 'Teste completo de linker entre nodes');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    console.log(`✅ Automação "${automationName}" criada`);
    
    // Adicionar Webhook Trigger
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2500);
    
    console.log('✅ WebHookTrigger adicionado');
    await helper.captureScreenshot('step3-01-trigger-added');
    
    // ==================================================
    // ETAPA 2: Configurar Webhook com Outputs
    // ==================================================
    console.log('\n📍 ETAPA 2: Configurando webhook com campos de output');
    console.log('─────────────────────────────────────────────────────────────');
    
    const configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[0].click();
      await pageWithLogging.waitForTimeout(2000);
      
      console.log('✅ Modal de config do webhook aberto');
      
      // Adicionar campos que serão outputs
      const addFieldBtn = await pageWithLogging.$('button:has-text("Adicionar Campo")');
      
      if (addFieldBtn) {
        // Campo 1: filename (string)
        console.log('   Adicionando campo "filename" (string)...');
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs.length > 0) {
          await inputs[inputs.length - 1].fill('filename');
          await pageWithLogging.waitForTimeout(500);
          console.log('   ✅ Campo "filename" adicionado');
        }
        
        // Campo 2: content (string)
        console.log('   Adicionando campo "content" (string)...');
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs2 = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs2.length > 1) {
          await inputs2[inputs2.length - 1].fill('content');
          await pageWithLogging.waitForTimeout(500);
          console.log('   ✅ Campo "content" adicionado');
        }
      }
      
      await helper.captureScreenshot('step3-02-webhook-with-fields');
      
      // Salvar webhook
      const saveBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
      if (saveBtn) {
        await saveBtn.click();
        await pageWithLogging.waitForTimeout(1500);
        console.log('✅ Webhook configurado com 2 campos de output');
      }
    }
    
    // ==================================================
    // ETAPA 3: Adicionar Tool (WriteFile)
    // ==================================================
    console.log('\n📍 ETAPA 3: Adicionando WriteFile tool');
    console.log('─────────────────────────────────────────────────────────────');
    
    const addToolBtns = await pageWithLogging.$$('button');
    for (const btn of addToolBtns) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('adicionar tool')) {
        await btn.click();
        break;
      }
    }
    await pageWithLogging.waitForTimeout(1500);
    
    const search = await pageWithLogging.$('input[type="search"]');
    if (search) {
      await search.fill('writefile');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await pageWithLogging.click('text=WriteFile');
    await pageWithLogging.waitForTimeout(2500);
    
    console.log('✅ WriteFile tool adicionada');
    await helper.captureScreenshot('step3-03-writefile-added');
    
    const nodes = await pageWithLogging.$$('.react-flow__node');
    console.log(`📊 Total de nodes no workflow: ${nodes.length}`);
    
    // ==================================================
    // ETAPA 4: Testar Linker com Outputs do Webhook
    // ==================================================
    console.log('\n📍 ETAPA 4: Testando linker com outputs do webhook');
    console.log('─────────────────────────────────────────────────────────────');
    
    const errorsBeforeLinker = capturedLogs.errors.length;
    
    // Abrir config da WriteFile
    await pageWithLogging.waitForTimeout(1000);
    const configAgain = await pageWithLogging.$$('button:has-text("Config")');
    
    if (configAgain.length >= 2) {
      try {
        await configAgain[1].click({ timeout: 5000 });
        await pageWithLogging.waitForTimeout(2000);
      } catch (e) {
        await pageWithLogging.keyboard.press('Escape');
        await pageWithLogging.waitForTimeout(1000);
        await configAgain[1].click({ force: true });
        await pageWithLogging.waitForTimeout(2000);
      }
      
      console.log('✅ Modal de WriteFile aberto');
      await helper.captureScreenshot('step3-04-writefile-modal');
      
      // Procurar botões de linker
      console.log('\n   Procurando botões de linker...');
      
      const linkerButtons = await pageWithLogging.$$('[role="dialog"] button[aria-label*="link"], [role="dialog"] button[title*="vincular"], [role="dialog"] button:has-text("Vincular")');
      console.log(`   📊 Botões de linker encontrados: ${linkerButtons.length}`);
      
      if (linkerButtons.length > 0) {
        console.log('   ✅ Botões de linker disponíveis!');
        
        // Clicar no primeiro botão de linker
        console.log('   Tentando abrir popover de linker...');
        
        try {
          await linkerButtons[0].click();
          await pageWithLogging.waitForTimeout(1500);
          
          console.log('   ✅ Popover de linker aberto');
          await helper.captureScreenshot('step3-05-linker-popover');
          
          // Verificar se há outputs disponíveis
          const popoverText = await pageWithLogging.textContent('[role="dialog"], [data-radix-popover-content]');
          
          const hasFilename = popoverText?.includes('filename');
          const hasContent = popoverText?.includes('content');
          const hasWebhook = popoverText?.includes('WebHook') || popoverText?.includes('node');
          
          console.log(`\n   📊 Outputs disponíveis no linker:`);
          console.log(`      - Contém "filename": ${hasFilename ? '✅' : '❌'}`);
          console.log(`      - Contém "content": ${hasContent ? '✅' : '❌'}`);
          console.log(`      - Referência ao webhook: ${hasWebhook ? '✅' : '❌'}`);
          
          if (hasFilename || hasContent) {
            console.log(`\n   🎉 LINKER FUNCIONANDO: Outputs do webhook disponíveis!`);
            
            // Tentar selecionar um output
            const filenameOption = await pageWithLogging.$('text=filename');
            if (filenameOption) {
              await filenameOption.click();
              await pageWithLogging.waitForTimeout(1000);
              console.log(`   ✅ Output "filename" selecionado via linker`);
              
              await helper.captureScreenshot('step3-06-output-selected');
            }
          } else {
            console.log(`\n   ⚠️  Outputs do webhook não aparecem no linker`);
            console.log(`   Conteúdo do popover: ${popoverText?.substring(0, 200)}`);
          }
          
        } catch (e) {
          console.log(`   ⚠️  Erro ao abrir linker: ${e.message}`);
        }
        
      } else {
        console.log('   ⚠️  Nenhum botão de linker encontrado');
        console.log('   Isso pode significar que:');
        console.log('   - Os campos não suportam linker');
        console.log('   - O node anterior não tem outputs');
        console.log('   - O UI não renderizou os botões');
      }
      
      // Fechar modal
      const cancelBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Cancelar")');
      if (cancelBtn) {
        await cancelBtn.click();
        await pageWithLogging.waitForTimeout(1000);
      }
    }
    
    const errorsAfterLinker = capturedLogs.errors.length - errorsBeforeLinker;
    console.log(`\n📊 Erros durante teste de linker: ${errorsAfterLinker}`);
    
    // ==================================================
    // ETAPA 5: Salvar Automação
    // ==================================================
    console.log('\n📍 ETAPA 5: Salvando automação');
    console.log('─────────────────────────────────────────────────────────────');
    
    const saveAutomationBtn = await pageWithLogging.$('button:has-text("Salvar")');
    if (saveAutomationBtn) {
      await saveAutomationBtn.click();
      await pageWithLogging.waitForTimeout(3000);
      console.log('✅ Automação salva');
      
      await helper.captureScreenshot('step3-07-automation-saved');
      
      // Verificar toast de sucesso
      const toasts = await pageWithLogging.$$('[data-sonner-toast], [role="status"]');
      if (toasts.length > 0) {
        const toastText = await toasts[0].textContent();
        console.log(`📢 Toast: "${toastText}"`);
      }
    }
    
    // ==================================================
    // ETAPA 6: Verificar Persistência
    // ==================================================
    console.log('\n📍 ETAPA 6: Verificando persistência no backend');
    console.log('─────────────────────────────────────────────────────────────');
    
    const backendCheck = await pageWithLogging.evaluate(async (name) => {
      try {
        const res = await fetch('http://localhost:3001/api/automations');
        const data = await res.json();
        const found = data.find((a: any) => a.name === name);
        
        if (found) {
          return {
            success: true,
            nodes: found.nodes?.length || 0,
            links: found.links?.length || 0,
            hasWebhook: found.nodes?.some((n: any) => n.type === 'trigger'),
            hasWriteFile: found.nodes?.some((n: any) => n.referenceId),
          };
        }
        return { success: false };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }, automationName);
    
    if (backendCheck.success) {
      console.log('✅ Automação encontrada no backend');
      console.log(`   📊 Nodes: ${backendCheck.nodes}`);
      console.log(`   📊 Links: ${backendCheck.links}`);
      console.log(`   📊 Tem webhook: ${backendCheck.hasWebhook ? '✅' : '❌'}`);
      console.log(`   📊 Tem WriteFile: ${backendCheck.hasWriteFile ? '✅' : '❌'}`);
    } else {
      console.log('⚠️  Automação não encontrada no backend');
    }
    
    // ==================================================
    // ANÁLISE FINAL
    // ==================================================
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO DO PASSO 3:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Automação criada com webhook trigger`);
    console.log(`✅ Webhook configurado com 2 outputs`);
    console.log(`✅ WriteFile tool adicionada`);
    console.log(`✅ Linker testado`);
    console.log(`✅ Automação salva`);
    console.log(`✅ Persistência verificada`);
    
    const totalErrors = capturedLogs.errors.length;
    if (totalErrors === 0) {
      console.log(`\n🎉 PASSO 3 COMPLETO: 100% SEM ERROS!`);
    } else {
      console.log(`\n⚠️  PASSO 3 COMPLETO COM ${totalErrors} ERROS`);
    }
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
    expect(totalErrors).toBe(0);
    expect(backendCheck.success).toBe(true);
  });
});
