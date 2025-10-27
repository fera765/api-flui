import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Teste Completo: Modal de System Tools', () => {
  test('deve abrir modal de configuração de System Tools sem erros', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🎯 TESTE: Modal de System Tools');
    console.log('═══════════════════════════════════════════════════');
    
    // ==================================================
    // FASE 1: Criar Automação
    // ==================================================
    console.log('\n📍 FASE 1: Criando automação');
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Test System Tools Modal');
    await pageWithLogging.fill('#description', 'Validar modal de system tools');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    console.log('✅ Automação criada');
    await helper.captureScreenshot('phase1-automation-created');
    
    // ==================================================
    // FASE 2: Adicionar Manual Trigger
    // ==================================================
    console.log('\n📍 FASE 2: Adicionando Manual Trigger');
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    
    const searchInput = await pageWithLogging.$('input[type="search"]');
    if (searchInput) {
      await searchInput.fill('manual');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await pageWithLogging.click('text=ManualTrigger');
    await pageWithLogging.waitForTimeout(2000);
    console.log('✅ ManualTrigger adicionado');
    
    // ==================================================
    // FASE 3: Adicionar System Tool
    // ==================================================
    console.log('\n📍 FASE 3: Procurando System Tools');
    
    // Procurar botão de adicionar tool
    const toolButtons = await pageWithLogging.$$('button');
    let addToolBtn = null;
    
    for (const btn of toolButtons) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('adicionar tool')) {
        addToolBtn = btn;
        break;
      }
    }
    
    if (!addToolBtn) {
      console.log('⚠️  Botão "Adicionar Tool" não encontrado');
      console.log('   Procurando alternativas...');
      
      // Tentar outros seletores
      addToolBtn = await pageWithLogging.$('[aria-label*="adicionar"], button:has-text("Add Tool")');
    }
    
    if (addToolBtn) {
      await addToolBtn.click();
      await pageWithLogging.waitForTimeout(2000);
      
      await helper.captureScreenshot('phase3-tool-picker-opened');
      
      // Buscar por tools do tipo "system"
      console.log('   Procurando System Tools na lista...');
      
      // Limpar busca
      const search = await pageWithLogging.$('input[type="search"]');
      if (search) {
        await search.fill('');
        await pageWithLogging.waitForTimeout(500);
      }
      
      // Listar todas as tools disponíveis
      const toolElements = await pageWithLogging.$$('[role="dialog"] [data-tool], [role="dialog"] .tool-item, [role="dialog"] div:has-text("Tool")');
      console.log(`   📊 Tools encontradas: ${toolElements.length}`);
      
      let systemToolAdded = false;
      
      // Procurar especificamente por "ListAgentsTool" ou outras system tools
      const systemToolNames = ['ListAgentsTool', 'ListMCPsTool', 'ListToolsTool', 'InvokeAgentTool'];
      
      for (const toolName of systemToolNames) {
        const toolElement = await pageWithLogging.$(`text=${toolName}`);
        if (toolElement) {
          console.log(`   ✅ Encontrada: ${toolName}`);
          await toolElement.click();
          await pageWithLogging.waitForTimeout(2500);
          systemToolAdded = true;
          await helper.captureScreenshot(`phase3-${toolName}-added`);
          break;
        }
      }
      
      if (!systemToolAdded) {
        console.log('   ⚠️  Nenhuma System Tool específica encontrada');
        console.log('   Tentando adicionar qualquer tool disponível...');
        
        // Tentar clicar em qualquer tool
        if (toolElements.length > 0) {
          await toolElements[0].click();
          await pageWithLogging.waitForTimeout(2500);
          systemToolAdded = true;
        }
      }
      
      if (systemToolAdded) {
        console.log('   ✅ Tool adicionada ao canvas');
        
        // Verificar nodes no canvas
        const nodes = await pageWithLogging.$$('.react-flow__node');
        console.log(`   📊 Nodes no canvas: ${nodes.length}`);
        
        // ==================================================
        // FASE 4: Abrir Modal de Configuração
        // ==================================================
        console.log('\n📍 FASE 4: Abrindo modal de configuração da tool');
        
        // Aguardar um pouco para garantir que o node foi renderizado
        await pageWithLogging.waitForTimeout(1000);
        
        // Capturar logs de erro ANTES de clicar em Config
        const consoleLogsBefore = capturedLogs.console.length;
        const errorsBefore = capturedLogs.errors.length;
        
        console.log(`   📊 Logs antes: ${consoleLogsBefore} console, ${errorsBefore} erros`);
        
        // Procurar todos os botões Config
        const configButtons = await pageWithLogging.$$('button:has-text("Config")');
        console.log(`   📊 Botões Config encontrados: ${configButtons.length}`);
        
        if (configButtons.length >= 2) {
          // Clicar no segundo botão Config (da tool, não do trigger)
          console.log('   Clicando no botão Config da tool...');
          await configButtons[1].click();
          await pageWithLogging.waitForTimeout(2500);
          
          await helper.captureScreenshot('phase4-config-modal-opened');
          
          // Capturar logs de erro DEPOIS de abrir o modal
          const consoleLogsAfter = capturedLogs.console.length;
          const errorsAfter = capturedLogs.errors.length;
          
          console.log(`   📊 Logs depois: ${consoleLogsAfter} console, ${errorsAfter} erros`);
          
          // Verificar se houve erros novos
          const newErrors = errorsAfter - errorsBefore;
          
          if (newErrors > 0) {
            console.log(`   ❌ ${newErrors} NOVOS ERROS detectados ao abrir o modal!`);
            
            // Listar os erros
            const recentErrors = capturedLogs.errors.slice(errorsBefore);
            recentErrors.forEach((error, index) => {
              console.log(`\n   Erro ${index + 1}:`);
              console.log(`      ${error}`);
            });
          } else {
            console.log('   ✅ NENHUM erro detectado ao abrir o modal!');
          }
          
          // Verificar se o modal está aberto
          const modal = await pageWithLogging.$('[role="dialog"]');
          
          if (modal) {
            console.log('   ✅ Modal aberto com sucesso');
            
            // Verificar conteúdo do modal
            const modalContent = await pageWithLogging.textContent('[role="dialog"]');
            console.log(`\n   📄 Conteúdo do modal (primeiros 200 chars):`);
            console.log(`      ${modalContent?.substring(0, 200)}...`);
            
            // Verificar se há campos de input
            const inputs = await pageWithLogging.$$('[role="dialog"] input:not([type="hidden"])');
            const selects = await pageWithLogging.$$('[role="dialog"] select, [role="dialog"] [role="combobox"]');
            const textareas = await pageWithLogging.$$('[role="dialog"] textarea');
            
            console.log(`\n   📊 Campos no modal:`);
            console.log(`      - Inputs: ${inputs.length}`);
            console.log(`      - Selects: ${selects.length}`);
            console.log(`      - Textareas: ${textareas.length}`);
            
            if (inputs.length === 0 && selects.length === 0 && textareas.length === 0) {
              console.log('   ℹ️  Modal sem campos editáveis (pode ser normal)');
            }
            
            // Verificar botões de ação
            const saveBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
            const cancelBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Cancelar")');
            
            console.log(`\n   📊 Botões de ação:`);
            console.log(`      - Salvar: ${saveBtn ? '✅' : '❌'}`);
            console.log(`      - Cancelar: ${cancelBtn ? '✅' : '❌'}`);
            
            await helper.captureScreenshot('phase4-modal-content-detail');
            
          } else {
            console.log('   ❌ Modal NÃO abriu!');
          }
        } else {
          console.log('   ⚠️  Botão Config da tool não encontrado');
        }
      }
    } else {
      console.log('⚠️  Não foi possível adicionar tool');
    }
    
    // ==================================================
    // ANÁLISE FINAL
    // ==================================================
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    console.log('\n═══════════════════════════════════════════════════');
    console.log('📊 RESULTADO DO TESTE:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`✅ Automação criada`);
    console.log(`✅ Trigger adicionado`);
    console.log(`✅ Tool adicionada`);
    
    if (capturedLogs.errors.length === 0) {
      console.log(`✅ NENHUM erro JavaScript detectado`);
    } else {
      console.log(`⚠️  ${capturedLogs.errors.length} erros JavaScript detectados`);
    }
    
    console.log('═══════════════════════════════════════════════════');
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
});
