import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Bug: Campo vazio sendo excluído ao mudar tipo', () => {
  test('deve investigar comportamento ao mudar tipo de campo vazio', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🔍 INVESTIGANDO BUG: Campo vazio sendo excluído ao mudar tipo');
    console.log('');
    
    // Criar automação
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Test Bug Campo Vazio');
    await pageWithLogging.fill('#description', 'Investigar bug de exclusão de campo');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(2000);
    
    // Adicionar WebHookTrigger
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2000);
    
    // Abrir config
    const configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[configButtons.length - 1].click();
      await pageWithLogging.waitForTimeout(2000);
    }
    
    await helper.captureScreenshot('before-add-empty-field');
    
    // Cenário 1: Adicionar campo VAZIO e tentar mudar tipo
    console.log('\n📝 CENÁRIO 1: Campo vazio - mudando tipo');
    const addButton = await pageWithLogging.$('button:has-text("Adicionar Campo")');
    
    if (addButton) {
      await addButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      console.log('✅ Campo adicionado');
      await helper.captureScreenshot('after-add-empty-field');
      
      // Contar campos antes
      const fieldsBefore = await pageWithLogging.$$('[data-field-row], .field-row, div:has(> input):has(> select)');
      console.log(`📊 Campos antes de mudar tipo: ${fieldsBefore.length}`);
      
      // Tentar mudar o tipo SEM preencher a chave
      console.log('🔄 Tentando mudar tipo sem preencher chave...');
      const selects = await pageWithLogging.$$('select');
      
      if (selects.length > 0) {
        const lastSelect = selects[selects.length - 1];
        await lastSelect.selectOption('number');
        await pageWithLogging.waitForTimeout(1000);
        
        await helper.captureScreenshot('after-change-type-empty-key');
        
        // Contar campos depois
        const fieldsAfter = await pageWithLogging.$$('[data-field-row], .field-row, div:has(> input):has(> select)');
        console.log(`📊 Campos depois de mudar tipo: ${fieldsAfter.length}`);
        
        if (fieldsAfter.length < fieldsBefore.length) {
          console.log('❌ BUG CONFIRMADO: Campo foi excluído ao mudar tipo com chave vazia!');
          console.log(`   Campos antes: ${fieldsBefore.length}, depois: ${fieldsAfter.length}`);
        } else {
          console.log('✅ Campo permaneceu após mudar tipo');
        }
      }
      
      // Cenário 2: Adicionar campo PREENCHIDO e mudar tipo
      console.log('\n📝 CENÁRIO 2: Campo preenchido - mudando tipo');
      await addButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      const inputs = await pageWithLogging.$$('input[placeholder*="campo"], input[placeholder*="chave"]');
      if (inputs.length > 0) {
        const lastInput = inputs[inputs.length - 1];
        await lastInput.fill('teste_preenchido');
        await pageWithLogging.waitForTimeout(500);
        
        console.log('✅ Campo adicionado com chave preenchida: "teste_preenchido"');
        await helper.captureScreenshot('after-add-filled-field');
        
        const fieldsBeforeFilled = await pageWithLogging.$$('[data-field-row], .field-row, div:has(> input):has(> select)');
        console.log(`📊 Campos antes de mudar tipo: ${fieldsBeforeFilled.length}`);
        
        // Mudar tipo COM chave preenchida
        const selectsAgain = await pageWithLogging.$$('select');
        if (selectsAgain.length > 0) {
          const lastSelectAgain = selectsAgain[selectsAgain.length - 1];
          await lastSelectAgain.selectOption('array');
          await pageWithLogging.waitForTimeout(1000);
          
          await helper.captureScreenshot('after-change-type-filled-key');
          
          const fieldsAfterFilled = await pageWithLogging.$$('[data-field-row], .field-row, div:has(> input):has(> select)');
          console.log(`📊 Campos depois de mudar tipo: ${fieldsAfterFilled.length}`);
          
          if (fieldsAfterFilled.length < fieldsBeforeFilled.length) {
            console.log('❌ Campo foi excluído mesmo com chave preenchida!');
          } else {
            console.log('✅ Campo permaneceu após mudar tipo com chave preenchida');
          }
        }
      }
    }
    
    // Análise de logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    if (analyzer.hasCriticalErrors()) {
      console.log('\n⚠️  ERROS ENCONTRADOS DURANTE O TESTE');
      analyzer.getErrors().forEach(error => console.log(`  - ${error}`));
    }
  });
});
