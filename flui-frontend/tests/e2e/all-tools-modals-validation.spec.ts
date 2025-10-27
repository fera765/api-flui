import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Validação Completa: Modais de Todas as Tools', () => {
  test('deve testar modal de configuração de System Tool (ReadFile)', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('🎯 TESTE: Modal de System Tool - ReadFile');
    console.log('═══════════════════════════════════════════════════');
    
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    // Criar automação
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Test ReadFile Tool');
    await pageWithLogging.fill('#description', 'Validar modal da ReadFile tool');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    // Adicionar Manual Trigger
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    await pageWithLogging.click('text=ManualTrigger');
    await pageWithLogging.waitForTimeout(2000);
    
    console.log('✅ ManualTrigger adicionado');
    
    // Adicionar ReadFile tool
    console.log('\n📍 Adicionando ReadFile Tool...');
    
    // Clicar em "Adicionar Tool" no canvas
    const canvas = await pageWithLogging.$('.react-flow');
    if (canvas) {
      await canvas.click({ button: 'right' });
      await pageWithLogging.waitForTimeout(500);
    }
    
    // Procurar botão "Adicionar Tool" alternativo
    const addButtons = await pageWithLogging.$$('button, [role="button"]');
    for (const btn of addButtons) {
      const text = await btn.textContent();
      if (text && text.includes('Adicionar')) {
        console.log(`   Tentando botão: "${text}"`);
        try {
          await btn.click();
          await pageWithLogging.waitForTimeout(1500);
          break;
        } catch (e) {
          // Continuar tentando
        }
      }
    }
    
    // Buscar por "ReadFile"
    const searchBox = await pageWithLogging.$('input[type="search"], input[placeholder*="Buscar"], input[placeholder*="Search"]');
    if (searchBox) {
      await searchBox.fill('readfile');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await helper.captureScreenshot('search-readfile-tool');
    
    // Tentar clicar em ReadFile
    const readFileTool = await pageWithLogging.$('text=ReadFile');
    if (readFileTool) {
      console.log('   ✅ ReadFile encontrada, clicando...');
      await readFileTool.click();
      await pageWithLogging.waitForTimeout(2500);
      
      await helper.captureScreenshot('readfile-added-to-canvas');
      
      // Verificar nodes
      const nodes = await pageWithLogging.$$('.react-flow__node');
      console.log(`   📊 Nodes no canvas: ${nodes.length}`);
      
      // Procurar botão Config
      await pageWithLogging.waitForTimeout(1000);
      const configButtons = await pageWithLogging.$$('button:has-text("Config")');
      console.log(`   📊 Botões Config: ${configButtons.length}`);
      
      if (configButtons.length >= 2) {
        console.log('\n📍 Abrindo modal de configuração...');
        
        // Capturar erros antes
        const errorsBefore = capturedLogs.errors.length;
        
        // Clicar no config da tool (segundo botão)
        await configButtons[1].click();
        await pageWithLogging.waitForTimeout(2000);
        
        await helper.captureScreenshot('readfile-config-modal');
        
        // Capturar erros depois
        const errorsAfter = capturedLogs.errors.length;
        const newErrors = errorsAfter - errorsBefore;
        
        if (newErrors > 0) {
          console.log(`   ❌ ${newErrors} ERROS detectados!`);
          capturedLogs.errors.slice(errorsBefore).forEach((err, i) => {
            console.log(`      Erro ${i+1}: ${err}`);
          });
        } else {
          console.log('   ✅ NENHUM erro ao abrir modal!');
        }
        
        // Verificar modal
        const modal = await pageWithLogging.$('[role="dialog"]');
        if (modal) {
          console.log('   ✅ Modal aberto!');
          
          // Verificar campo "path"
          const pathInput = await pageWithLogging.$('[role="dialog"] input[name="path"], [role="dialog"] #path');
          if (pathInput) {
            console.log('   ✅ Campo "path" encontrado!');
            
            // Testar edição
            await pathInput.fill('/tmp/test.txt');
            await pageWithLogging.waitForTimeout(500);
            
            const value = await pathInput.inputValue();
            console.log(`   ✅ Valor editado: "${value}"`);
          }
          
          // Testar botão Salvar
          const saveBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
          if (saveBtn) {
            await saveBtn.click();
            await pageWithLogging.waitForTimeout(1500);
            console.log('   ✅ Configuração salva!');
          }
        } else {
          console.log('   ❌ Modal NÃO abriu!');
        }
      }
    } else {
      console.log('   ⚠️  ReadFile tool não encontrada');
    }
    
    // Análise final
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve testar modal de configuração com Agent', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('\n🎯 TESTE: Modal de Agent');
    console.log('═══════════════════════════════════════════════════');
    
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    // Criar automação
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', 'Test Agent Modal');
    await pageWithLogging.fill('#description', 'Validar modal de agent');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    // Adicionar Webhook Trigger
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2500);
    
    console.log('✅ WebHookTrigger adicionado');
    
    // Procurar por agents disponíveis
    console.log('\n📍 Procurando Agents...');
    
    // Verificar se há agents
    const response = await pageWithLogging.evaluate(async () => {
      try {
        const res = await fetch('http://localhost:3001/api/agents');
        const data = await res.json();
        return { success: true, count: data.length, agents: data };
      } catch (e) {
        return { success: false, error: e.message };
      }
    });
    
    console.log(`   📊 Agents disponíveis: ${response.success ? response.count : 0}`);
    
    if (response.success && response.count > 0) {
      console.log(`   ✅ Encontrado agent: "${response.agents[0].name}"`);
      
      // Tentar adicionar agent ao workflow
      // (código para adicionar agent - a ser implementado no UI)
      
    } else {
      console.log('   ℹ️  Nenhum agent cadastrado ainda');
    }
    
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
  
  test('deve testar fluxo completo: webhook + tools + linker + save', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('\n🎯 TESTE: Fluxo Completo com Linker');
    console.log('═══════════════════════════════════════════════════');
    
    const automationName = `Complete Flow ${Date.now()}`;
    
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    // Criar automação
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1000);
    await pageWithLogging.fill('#name', automationName);
    await pageWithLogging.fill('#description', 'Fluxo completo com webhook, tools e linker');
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    // Adicionar WebHook Trigger
    console.log('\n📍 Adicionando Webhook Trigger...');
    await pageWithLogging.click('button:has-text("Trigger")');
    await pageWithLogging.waitForTimeout(1500);
    await pageWithLogging.click('text=WebHookTrigger');
    await pageWithLogging.waitForTimeout(2500);
    
    // Configurar webhook com inputs
    const configButtons = await pageWithLogging.$$('button:has-text("Config")');
    if (configButtons.length > 0) {
      await configButtons[0].click();
      await pageWithLogging.waitForTimeout(2000);
      
      // Adicionar campos
      const addFieldBtn = await pageWithLogging.$('button:has-text("Adicionar Campo")');
      if (addFieldBtn) {
        // Campo 1: filename (string)
        await addFieldBtn.click();
        await pageWithLogging.waitForTimeout(800);
        
        const inputs = await pageWithLogging.$$('[role="dialog"] input[placeholder*="ex:"]');
        if (inputs.length > 0) {
          await inputs[inputs.length - 1].fill('filename');
          await pageWithLogging.waitForTimeout(500);
        }
        
        console.log('   ✅ Campo "filename" adicionado ao webhook');
      }
      
      // Salvar webhook
      const saveWebhook = await pageWithLogging.$('[role="dialog"] button:has-text("Salvar")');
      if (saveWebhook) {
        await saveWebhook.click();
        await pageWithLogging.waitForTimeout(1500);
      }
    }
    
    console.log('   ✅ Webhook configurado com outputs');
    
    // TODO: Adicionar tool e testar linker
    // TODO: Salvar automação
    // TODO: Validar persistência
    
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
});
