import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Validação do Manual Trigger', () => {
  test('deve verificar se manual trigger tem inputs e validar modal', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🔍 INVESTIGANDO: Manual Trigger - Inputs e Modal');
    console.log('');
    
    // Criar automação
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Test Manual Trigger');
    await pageWithLogging.fill('#description', 'Validar manual trigger');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    // Adicionar Manual Trigger
    console.log('📍 Procurando Manual Trigger...');
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    
    // Procurar por Manual Trigger
    const searchInput = await pageWithLogging.$('input[type="search"]');
    if (searchInput) {
      await searchInput.fill('manual');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await helper.captureScreenshot('trigger-list-with-manual');
    
    // Procurar ManualTrigger
    const manualTriggerOptions = [
      'text=ManualTrigger',
      'text=Manual Trigger',
      'div:has-text("Manual")',
      '[data-tool*="manual"]'
    ];
    
    let manualFound = false;
    for (const selector of manualTriggerOptions) {
      const element = await pageWithLogging.$(selector);
      if (element) {
        console.log(`✅ Manual Trigger encontrado com selector: ${selector}`);
        await element.click();
        await pageWithLogging.waitForTimeout(2000);
        manualFound = true;
        break;
      }
    }
    
    if (!manualFound) {
      console.log('⚠️  Manual Trigger não encontrado. Listando todos os triggers disponíveis...');
      const allElements = await pageWithLogging.$$('[role="button"], button, div[data-tool]');
      for (let i = 0; i < Math.min(allElements.length, 20); i++) {
        const text = await allElements[i].textContent();
        if (text && text.toLowerCase().includes('trigger')) {
          console.log(`  Trigger ${i}: "${text}"`);
        }
      }
    } else {
      await helper.captureScreenshot('after-add-manual-trigger');
      
      // Abrir config do manual trigger
      console.log('📍 Abrindo configuração do Manual Trigger...');
      await pageWithLogging.waitForTimeout(1000);
      
      const configButtons = await pageWithLogging.$$('button:has-text("Config")');
      if (configButtons.length > 0) {
        await configButtons[configButtons.length - 1].click();
        await pageWithLogging.waitForTimeout(2000);
        
        await helper.captureScreenshot('manual-trigger-config-modal');
        
        // Analisar o modal
        const modalContent = await pageWithLogging.textContent('[role="dialog"]');
        console.log('\n📄 Conteúdo do modal do Manual Trigger:');
        console.log(modalContent);
        console.log('');
        
        // Verificar se há campos de input
        const inputFields = await pageWithLogging.$$('[role="dialog"] input:not([type="hidden"])');
        const textareaFields = await pageWithLogging.$$('[role="dialog"] textarea');
        const selectFields = await pageWithLogging.$$('[role="dialog"] select, [role="dialog"] [role="combobox"]');
        
        console.log(`📊 Campos no modal:`);
        console.log(`   - Inputs: ${inputFields.length}`);
        console.log(`   - Textareas: ${textareaFields.length}`);
        console.log(`   - Selects: ${selectFields.length}`);
        console.log('');
        
        // Listar todos os campos
        for (let i = 0; i < inputFields.length; i++) {
          const placeholder = await inputFields[i].getAttribute('placeholder');
          const name = await inputFields[i].getAttribute('name');
          const value = await inputFields[i].inputValue();
          console.log(`   Input ${i+1}:`);
          console.log(`     - Name: ${name}`);
          console.log(`     - Placeholder: ${placeholder}`);
          console.log(`     - Value: ${value}`);
        }
        
        // Verificar se o modal tem mensagem de "sem campos configuráveis"
        if (modalContent?.includes('não possui campos configuráveis') || 
            modalContent?.includes('Este nó não possui')) {
          console.log('⚠️  Modal indica que não há campos configuráveis');
          console.log('   Isso pode ser normal se o Manual Trigger não precisa de configuração');
        } else if (inputFields.length === 0 && textareaFields.length === 0 && selectFields.length === 0) {
          console.log('⚠️  Modal não tem campos, mas também não mostra mensagem explicativa');
          console.log('   Recomendação: Adicionar mensagem informativa');
        } else {
          console.log('✅ Modal tem campos configuráveis');
        }
      }
    }
    
    // Análise de logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
  });
});
