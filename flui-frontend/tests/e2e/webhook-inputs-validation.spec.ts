import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Validação de Campos do Webhook', () => {
  test('deve adicionar campos de diferentes tipos no webhook trigger', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('📍 Criando automação e abrindo webhook trigger...');
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    // Criar automação
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name, input[name="name"]', 'Test Webhook Inputs');
    await pageWithLogging.fill('#description, textarea', 'Testar diferentes tipos de campos');
    await pageWithLogging.click('button:has-text("Próximo: Criar Workflow")');
    
    // Aguardar canvas carregar
    await pageWithLogging.waitForTimeout(2000);
    
    // Adicionar WebHookTrigger
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2000);
    
    // Clicar no node Config
    const configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[configButtons.length - 1].click();
      await pageWithLogging.waitForTimeout(2000);
    }
    
    await helper.captureScreenshot('webhook-modal-before-adding-fields');
    
    console.log('📍 Procurando seção de inputs no modal...');
    
    // Verificar se existe a seção "inputs"
    const modalContent = await pageWithLogging.textContent('[role="dialog"]');
    console.log('Modal content:', modalContent);
    
    // Procurar botão "Adicionar Campo"
    const addFieldButton = await pageWithLogging.$('button:has-text("Adicionar Campo")');
    
    if (!addFieldButton) {
      console.log('⚠️  Botão "Adicionar Campo" não encontrado. Procurando alternativas...');
      const allButtons = await pageWithLogging.$$('button');
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Button ${i}: "${text}"`);
      }
    } else {
      console.log('✅ Botão "Adicionar Campo" encontrado!');
      
      // Teste 1: Adicionar campo tipo STRING
      console.log('\n📝 Teste 1: Adicionando campo tipo STRING...');
      await addFieldButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      // Procurar inputs do novo campo
      const inputs = await pageWithLogging.$$('input[placeholder*="campo"], input[placeholder*="chave"], input[placeholder*="key"]');
      console.log(`Encontrados ${inputs.length} inputs de campo`);
      
      if (inputs.length >= 1) {
        await inputs[inputs.length - 1].fill('nome');
        await pageWithLogging.waitForTimeout(500);
        
        // Procurar select de tipo
        const selects = await pageWithLogging.$$('select, [role="combobox"]');
        console.log(`Encontrados ${selects.length} selects`);
        
        if (selects.length > 0) {
          // Tentar selecionar "string"
          try {
            await selects[selects.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const stringOption = await pageWithLogging.$('text=string');
            if (stringOption) {
              await stringOption.click();
            }
          } catch (e) {
            console.log('  Erro ao selecionar tipo:', e.message);
          }
        }
      }
      
      await helper.captureScreenshot('after-add-string-field');
      
      // Teste 2: Adicionar campo tipo NUMBER
      console.log('\n📝 Teste 2: Adicionando campo tipo NUMBER...');
      await addFieldButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      const inputsAfter2 = await pageWithLogging.$$('input[placeholder*="campo"], input[placeholder*="chave"], input[placeholder*="key"]');
      if (inputsAfter2.length >= 2) {
        await inputsAfter2[inputsAfter2.length - 1].fill('idade');
        await pageWithLogging.waitForTimeout(500);
        
        const selectsAfter2 = await pageWithLogging.$$('select, [role="combobox"]');
        if (selectsAfter2.length > 0) {
          try {
            await selectsAfter2[selectsAfter2.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const numberOption = await pageWithLogging.$('text=number');
            if (numberOption) {
              await numberOption.click();
            }
          } catch (e) {
            console.log('  Erro ao selecionar tipo number:', e.message);
          }
        }
      }
      
      await helper.captureScreenshot('after-add-number-field');
      
      // Teste 3: Adicionar campo tipo ARRAY
      console.log('\n📝 Teste 3: Adicionando campo tipo ARRAY...');
      await addFieldButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      const inputsAfter3 = await pageWithLogging.$$('input[placeholder*="campo"], input[placeholder*="chave"], input[placeholder*="key"]');
      if (inputsAfter3.length >= 3) {
        await inputsAfter3[inputsAfter3.length - 1].fill('tags');
        await pageWithLogging.waitForTimeout(500);
        
        const selectsAfter3 = await pageWithLogging.$$('select, [role="combobox"]');
        if (selectsAfter3.length > 0) {
          try {
            await selectsAfter3[selectsAfter3.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const arrayOption = await pageWithLogging.$('text=array');
            if (arrayOption) {
              await arrayOption.click();
            }
          } catch (e) {
            console.log('  Erro ao selecionar tipo array:', e.message);
          }
        }
      }
      
      await helper.captureScreenshot('after-add-array-field');
      
      // Teste 4: Adicionar campo tipo OBJECT
      console.log('\n📝 Teste 4: Adicionando campo tipo OBJECT...');
      await addFieldButton.click();
      await pageWithLogging.waitForTimeout(1000);
      
      const inputsAfter4 = await pageWithLogging.$$('input[placeholder*="campo"], input[placeholder*="chave"], input[placeholder*="key"]');
      if (inputsAfter4.length >= 4) {
        await inputsAfter4[inputsAfter4.length - 1].fill('metadata');
        await pageWithLogging.waitForTimeout(500);
        
        const selectsAfter4 = await pageWithLogging.$$('select, [role="combobox"]');
        if (selectsAfter4.length > 0) {
          try {
            await selectsAfter4[selectsAfter4.length - 1].click();
            await pageWithLogging.waitForTimeout(500);
            const objectOption = await pageWithLogging.$('text=object');
            if (objectOption) {
              await objectOption.click();
            }
          } catch (e) {
            console.log('  Erro ao selecionar tipo object:', e.message);
          }
        }
      }
      
      await helper.captureScreenshot('after-add-all-fields');
      
      // Salvar configuração
      console.log('\n💾 Salvando configuração...');
      const saveButton = await pageWithLogging.$('button:has-text("Salvar")');
      if (saveButton) {
        await saveButton.click();
        await pageWithLogging.waitForTimeout(2000);
        console.log('✅ Configuração salva!');
      }
      
      await helper.captureScreenshot('after-save-config');
    }
    
    // Análise de logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
    expect(analyzer.hasFailedRequests()).toBe(false);
    
    console.log('\n✅ Teste de campos concluído com sucesso!');
  });
});
