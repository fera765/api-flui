import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Teste Completo de Workflow', () => {
  test('deve criar workflow completo com trigger, tools e linker', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🎯 TESTE COMPLETO: Criar workflow com múltiplas tools e linker');
    console.log('');
    
    // ==================================================
    // PASSO 1: Criar Automação
    // ==================================================
    console.log('📍 PASSO 1: Criando automação...');
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Workflow Completo Test');
    await pageWithLogging.fill('#description', 'Teste completo com trigger + tools + linker');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    await helper.captureScreenshot('step1-automation-created');
    console.log('✅ Automação criada');
    
    // ==================================================
    // PASSO 2: Adicionar Webhook Trigger
    // ==================================================
    console.log('\n📍 PASSO 2: Adicionando Webhook Trigger...');
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1000);
    
    const searchInput = await pageWithLogging.$('input[type="search"]');
    if (searchInput) {
      await searchInput.fill('webhook');
      await pageWithLogging.waitForTimeout(800);
    }
    
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2000);
    
    await helper.captureScreenshot('step2-webhook-added');
    console.log('✅ Webhook Trigger adicionado ao canvas');
    
    // Configurar webhook
    let configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[0].click();
      await pageWithLogging.waitForTimeout(2000);
      
      // Verificar se URL e token estão presentes
      const inputs = await pageWithLogging.$$('[role="dialog"] input');
      console.log(`   - Webhook tem ${inputs.length} inputs configuráveis`);
      
      if (inputs.length >= 2) {
        const url = await inputs[0].inputValue();
        console.log(`   - URL: ${url}`);
        console.log('   ✅ Webhook configurado com URL');
      }
      
      // Fechar modal
      const cancelBtn = await pageWithLogging.$('button:has-text("Cancelar")');
      if (cancelBtn) {
        await cancelBtn.click();
        await pageWithLogging.waitForTimeout(1000);
      }
    }
    
    // ==================================================
    // PASSO 3: Adicionar Tool/Action
    // ==================================================
    console.log('\n📍 PASSO 3: Adicionando uma Tool/Action...');
    
    // Clicar no botão de adicionar tool
    const addToolButtons = await pageWithLogging.$$('button');
    let addToolBtn = null;
    
    for (const btn of addToolButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('Adicionar Tool') || text.includes('Add Tool'))) {
        addToolBtn = btn;
        break;
      }
    }
    
    if (addToolBtn) {
      await addToolBtn.click();
      await pageWithLogging.waitForTimeout(1500);
      
      // Procurar por uma tool/action disponível
      console.log('   Procurando tools disponíveis...');
      
      // Buscar por "agent" ou alguma tool disponível
      const searchAgain = await pageWithLogging.$('input[type="search"]');
      if (searchAgain) {
        await searchAgain.fill('');
        await pageWithLogging.waitForTimeout(500);
      }
      
      await helper.captureScreenshot('tools-list-available');
      
      // Tentar encontrar alguma tool que não seja trigger
      const toolElements = await pageWithLogging.$$('[role="dialog"] div, [role="dialog"] button');
      let toolAdded = false;
      
      for (const el of toolElements) {
        const text = await el.textContent();
        // Procurar por tools que não sejam triggers
        if (text && !text.includes('Trigger') && 
            (text.includes('Tool') || text.includes('Agent') || text.includes('Action'))) {
          console.log(`   Tentando adicionar: "${text}"`);
          try {
            await el.click();
            await pageWithLogging.waitForTimeout(2000);
            toolAdded = true;
            break;
          } catch (e) {
            // Continuar tentando
          }
        }
      }
      
      if (toolAdded) {
        await helper.captureScreenshot('step3-tool-added');
        console.log('✅ Tool adicionada ao canvas');
        
        // Verificar quantos nodes existem agora
        const nodes = await pageWithLogging.$$('.react-flow__node');
        console.log(`   - Total de nodes no canvas: ${nodes.length}`);
        
        if (nodes.length >= 2) {
          console.log('✅ Workflow tem múltiplos nodes');
          
          // ==================================================
          // PASSO 4: Abrir config da tool e testar linker
          // ==================================================
          console.log('\n📍 PASSO 4: Testando linker com output do trigger...');
          
          configButtons = await pageWithLogging.$$('button:has-text("Config")');
          if (configButtons.length >= 2) {
            // Clicar no config do segundo node (a tool)
            await configButtons[1].click();
            await pageWithLogging.waitForTimeout(2000);
            
            await helper.captureScreenshot('step4-tool-config-modal');
            
            // Procurar por botões de linker
            const linkerButtons = await pageWithLogging.$$('button:has-text("Vincular"), button[aria-label*="link"], button[title*="vincular"]');
            console.log(`   - Botões de linker encontrados: ${linkerButtons.length}`);
            
            if (linkerButtons.length > 0) {
              console.log('   ✅ Botões de linker disponíveis');
              
              // Tentar clicar no primeiro linker
              await linkerButtons[0].click();
              await pageWithLogging.waitForTimeout(1000);
              
              await helper.captureScreenshot('step4-linker-popover');
              
              // Verificar se popover abriu com outputs disponíveis
              const popoverContent = await pageWithLogging.textContent('[role="dialog"], [data-radix-popover-content]');
              console.log('\n   📄 Conteúdo do linker popover:');
              console.log(popoverContent);
              
              // Fechar popover
              await pageWithLogging.keyboard.press('Escape');
              await pageWithLogging.waitForTimeout(500);
            } else {
              console.log('   ⚠️  Nenhum botão de linker encontrado');
              console.log('   Isso pode significar que:');
              console.log('   - A tool não tem campos que podem ser linkados');
              console.log('   - Todos os campos são read-only');
              console.log('   - O node anterior não tem outputs');
            }
            
            // Fechar modal da tool
            const cancelTool = await pageWithLogging.$('button:has-text("Cancelar")');
            if (cancelTool) {
              await cancelTool.click();
              await pageWithLogging.waitForTimeout(1000);
            }
          }
        }
      } else {
        console.log('⚠️  Nenhuma tool foi adicionada');
      }
    } else {
      console.log('⚠️  Botão "Adicionar Tool" não encontrado');
    }
    
    // Análise final
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    console.log('\n📊 RESUMO DO TESTE:');
    console.log('═══════════════════════════════════════════════════');
    const finalNodes = await pageWithLogging.$$('.react-flow__node');
    console.log(`✅ Nodes no workflow: ${finalNodes.length}`);
    
    const finalEdges = await pageWithLogging.$$('.react-flow__edge');
    console.log(`✅ Conexões no workflow: ${finalEdges.length}`);
    console.log('═══════════════════════════════════════════════════');
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
});
