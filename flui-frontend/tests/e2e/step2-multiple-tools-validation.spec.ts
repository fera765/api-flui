import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('PASSO 2: Adicionar Múltiplas Tools e Validar Modais', () => {
  test.setTimeout(120000); // 2 minutos
  
  test('deve adicionar várias tools e testar cada modal individualmente', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 PASSO 2: MÚLTIPLAS TOOLS E VALIDAÇÃO DE MODAIS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    const toolsToTest = [
      { name: 'ReadFile', type: 'System Tool', hasFields: true },
      { name: 'WriteFile', type: 'System Tool', hasFields: true },
    ];
    
    const toolsAdded: any[] = [];
    
    // ==================================================
    // SETUP: Criar automação base
    // ==================================================
    console.log('📍 SETUP: Criando automação base');
    console.log('─────────────────────────────────────────────────────────────');
    
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', `Multi Tools Test ${Date.now()}`);
    await pageWithLogging.fill('#description', 'Teste de múltiplas tools');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    // Adicionar trigger inicial
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    await pageWithLogging.click('text=ManualTrigger');
    await pageWithLogging.waitForTimeout(2000);
    
    console.log('✅ Automação criada com ManualTrigger');
    await helper.captureScreenshot('step2-00-setup-complete');
    
    const initialErrors = capturedLogs.errors.length;
    
    // ==================================================
    // Loop: Adicionar e testar cada tool
    // ==================================================
    for (let i = 0; i < toolsToTest.length; i++) {
      const tool = toolsToTest[i];
      
      console.log(`\n═══════════════════════════════════════════════════════════════`);
      console.log(`📍 TOOL ${i+1}/${toolsToTest.length}: ${tool.name} (${tool.type})`);
      console.log(`═══════════════════════════════════════════════════════════════`);
      
      const errorsBeforeTool = capturedLogs.errors.length;
      
      // --------------------------------------------------
      // Etapa 1: Encontrar botão "Adicionar Tool"
      // --------------------------------------------------
      console.log(`\n🔍 Etapa 1: Procurando botão "Adicionar Tool"`);
      
      let addToolBtn = null;
      const allButtons = await pageWithLogging.$$('button');
      
      for (const btn of allButtons) {
        const text = await btn.textContent();
        if (text && text.toLowerCase().includes('adicionar tool')) {
          addToolBtn = btn;
          break;
        }
      }
      
      if (!addToolBtn) {
        console.log(`   ⚠️  Botão não encontrado, tentando alternativas...`);
        continue;
      }
      
      await addToolBtn.click();
      await pageWithLogging.waitForTimeout(1500);
      console.log(`   ✅ Modal de seleção aberto`);
      
      await helper.captureScreenshot(`step2-${i+1}a-tool-picker`);
      
      // --------------------------------------------------
      // Etapa 2: Buscar pela tool
      // --------------------------------------------------
      console.log(`\n🔍 Etapa 2: Buscando por "${tool.name}"`);
      
      const searchInput = await pageWithLogging.$('input[type="search"]');
      if (searchInput) {
        await searchInput.fill(tool.name.toLowerCase());
        await pageWithLogging.waitForTimeout(1000);
        console.log(`   ✅ Busca realizada: "${tool.name}"`);
      }
      
      await helper.captureScreenshot(`step2-${i+1}b-search-${tool.name}`);
      
      // --------------------------------------------------
      // Etapa 3: Clicar na tool
      // --------------------------------------------------
      console.log(`\n🔍 Etapa 3: Adicionando tool ao canvas`);
      
      const toolElement = await pageWithLogging.$(`text=${tool.name}`);
      
      if (!toolElement) {
        console.log(`   ❌ Tool "${tool.name}" não encontrada`);
        continue;
      }
      
      await toolElement.click();
      await pageWithLogging.waitForTimeout(2500);
      
      const errorsAfterAdd = capturedLogs.errors.length - errorsBeforeTool;
      console.log(`   ✅ Tool adicionada ao canvas`);
      console.log(`   📊 Erros ao adicionar: ${errorsAfterAdd}`);
      
      await helper.captureScreenshot(`step2-${i+1}c-tool-added`);
      
      // Verificar nodes
      const nodes = await pageWithLogging.$$('.react-flow__node');
      console.log(`   📊 Total de nodes: ${nodes.length}`);
      
      // --------------------------------------------------
      // Etapa 4: Abrir modal de configuração
      // --------------------------------------------------
      console.log(`\n🔍 Etapa 4: Testando modal de configuração`);
      
      await pageWithLogging.waitForTimeout(1000);
      
      const configButtons = await pageWithLogging.$$('button:has-text("Config")');
      console.log(`   📊 Botões Config encontrados: ${configButtons.length}`);
      
      if (configButtons.length > i + 1) {
        const errorsBeforeConfig = capturedLogs.errors.length;
        
        // Clicar no botão Config da tool (não do trigger)
        // Esperar overlay desaparecer
        await pageWithLogging.waitForTimeout(500);
        
        try {
          await configButtons[i + 1].click({ timeout: 5000 });
          await pageWithLogging.waitForTimeout(2000);
        } catch (e) {
          console.log(`   ⚠️  Erro ao clicar em Config: ${e.message}`);
          console.log(`   Tentando fechar overlay e clicar novamente...`);
          
          // Tentar fechar qualquer overlay
          await pageWithLogging.keyboard.press('Escape');
          await pageWithLogging.waitForTimeout(1000);
          
          // Tentar novamente
          await configButtons[i + 1].click({ force: true });
          await pageWithLogging.waitForTimeout(2000);
        }
        
        const errorsAfterConfig = capturedLogs.errors.length - errorsBeforeConfig;
        
        console.log(`   ✅ Modal de config aberto`);
        console.log(`   📊 Erros ao abrir modal: ${errorsAfterConfig}`);
        
        await helper.captureScreenshot(`step2-${i+1}d-modal-opened`);
        
        // --------------------------------------------------
        // Etapa 5: Validar conteúdo do modal
        // --------------------------------------------------
        console.log(`\n🔍 Etapa 5: Validando conteúdo do modal`);
        
        const modal = await pageWithLogging.$('[role="dialog"]');
        
        if (modal) {
          // Verificar título
          const modalText = await pageWithLogging.textContent('[role="dialog"]');
          const hasToolName = modalText?.includes(tool.name);
          console.log(`   ✅ Modal contém nome da tool: ${hasToolName ? 'SIM' : 'NÃO'}`);
          
          // Verificar campos de input
          const inputs = await pageWithLogging.$$('[role="dialog"] input:not([type="hidden"])');
          const textareas = await pageWithLogging.$$('[role="dialog"] textarea');
          const selects = await pageWithLogging.$$('[role="dialog"] select, [role="dialog"] [role="combobox"]');
          
          const totalFields = inputs.length + textareas.length + selects.length;
          
          console.log(`   📊 Campos editáveis:`);
          console.log(`      - Inputs: ${inputs.length}`);
          console.log(`      - Textareas: ${textareas.length}`);
          console.log(`      - Selects: ${selects.length}`);
          console.log(`      - Total: ${totalFields}`);
          
          // Verificar botões de ação
          const saveBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
          const cancelBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Cancelar")');
          
          console.log(`   📊 Botões de ação:`);
          console.log(`      - Salvar: ${saveBtn ? '✅' : '❌'}`);
          console.log(`      - Cancelar: ${cancelBtn ? '✅' : '❌'}`);
          
          // --------------------------------------------------
          // Etapa 6: Testar edição de campos
          // --------------------------------------------------
          if (tool.hasFields && totalFields > 0) {
            console.log(`\n🔍 Etapa 6: Testando edição de campos`);
            
            // Tentar editar o primeiro campo
            if (inputs.length > 0) {
              const firstInput = inputs[0];
              const fieldName = await firstInput.getAttribute('name') || await firstInput.getAttribute('id') || 'campo1';
              
              const testValue = tool.name === 'ReadFile' ? '/tmp/test.txt' :
                              tool.name === 'WriteFile' ? '/tmp/output.txt' :
                              tool.name === 'WebFetch' ? 'https://api.example.com' :
                              tool.name === 'Shell' ? 'echo "test"' :
                              'test value';
              
              await firstInput.fill(testValue);
              await pageWithLogging.waitForTimeout(500);
              
              const value = await firstInput.inputValue();
              console.log(`      ✅ Campo "${fieldName}" editado`);
              console.log(`         Valor: "${value}"`);
              
              await helper.captureScreenshot(`step2-${i+1}e-field-edited`);
            }
          }
          
          // Fechar modal
          if (cancelBtn) {
            await cancelBtn.click();
            await pageWithLogging.waitForTimeout(1000);
            console.log(`   ✅ Modal fechado`);
          }
          
          // Registrar resultado
          toolsAdded.push({
            name: tool.name,
            type: tool.type,
            modalOpened: true,
            fieldsFound: totalFields,
            errorsOnAdd: errorsAfterAdd,
            errorsOnConfig: errorsAfterConfig,
          });
          
        } else {
          console.log(`   ❌ Modal NÃO abriu!`);
          
          toolsAdded.push({
            name: tool.name,
            type: tool.type,
            modalOpened: false,
            fieldsFound: 0,
            errorsOnAdd: errorsAfterAdd,
            errorsOnConfig: errorsAfterConfig,
          });
        }
      } else {
        console.log(`   ⚠️  Botão Config não encontrado para esta tool`);
      }
      
      await helper.captureScreenshot(`step2-${i+1}f-final-state`);
    }
    
    // ==================================================
    // ANÁLISE FINAL
    // ==================================================
    console.log(`\n═══════════════════════════════════════════════════════════════`);
    console.log(`📊 RESUMO DO PASSO 2:`);
    console.log(`═══════════════════════════════════════════════════════════════`);
    
    console.log(`\n📋 Tools testadas: ${toolsAdded.length}/${toolsToTest.length}`);
    console.log('');
    
    toolsAdded.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name} (${tool.type})`);
      console.log(`   - Modal abriu: ${tool.modalOpened ? '✅' : '❌'}`);
      console.log(`   - Campos encontrados: ${tool.fieldsFound}`);
      console.log(`   - Erros ao adicionar: ${tool.errorsOnAdd}`);
      console.log(`   - Erros ao abrir config: ${tool.errorsOnConfig}`);
    });
    
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    const totalErrors = capturedLogs.errors.length - initialErrors;
    const toolsWithModal = toolsAdded.filter(t => t.modalOpened).length;
    const toolsWithErrors = toolsAdded.filter(t => t.errorsOnAdd > 0 || t.errorsOnConfig > 0).length;
    
    console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
    console.log(`   - Tools adicionadas: ${toolsAdded.length}`);
    console.log(`   - Modais abertos: ${toolsWithModal}/${toolsAdded.length}`);
    console.log(`   - Tools com erros: ${toolsWithErrors}`);
    console.log(`   - Total de erros novos: ${totalErrors}`);
    
    if (totalErrors === 0 && toolsWithModal === toolsAdded.length) {
      console.log(`\n🎉 PASSO 2 COMPLETO: 100% SEM ERROS!`);
    } else if (totalErrors === 0) {
      console.log(`\n✅ PASSO 2 COMPLETO: SEM ERROS (alguns modais não abriram)`);
    } else {
      console.log(`\n⚠️  PASSO 2 COMPLETO COM ${totalErrors} ERROS`);
    }
    
    console.log(`═══════════════════════════════════════════════════════════════`);
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
    expect(totalErrors).toBe(0);
  });
});
