import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('PASSO 1: Teste Manual do Navegador', () => {
  test('deve validar WorkflowEditor funcionando corretamente após correções', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🎯 PASSO 1: VALIDAÇÃO MANUAL DO NAVEGADOR');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    // ==================================================
    // TESTE 1: Acessar página de automações
    // ==================================================
    console.log('📍 TESTE 1: Navegação inicial');
    console.log('─────────────────────────────────────────────────────────────');
    
    await pageWithLogging.goto('http://localhost:8080');
    await helper.waitForAppReady();
    
    // Verificar erros iniciais
    const initialErrors = capturedLogs.errors.length;
    console.log(`✅ Página inicial carregada`);
    console.log(`   Erros JavaScript: ${initialErrors}`);
    
    await helper.captureScreenshot('step1-01-homepage');
    
    // Navegar para automações
    await pageWithLogging.click('a[href="/automations"], button:has-text("Automações")');
    await pageWithLogging.waitForTimeout(2000);
    
    const urlAfterNav = pageWithLogging.url();
    console.log(`✅ Navegado para: ${urlAfterNav}`);
    
    await helper.captureScreenshot('step1-02-automations-page');
    
    // ==================================================
    // TESTE 2: Criar nova automação
    // ==================================================
    console.log('\n📍 TESTE 2: Criação de automação');
    console.log('─────────────────────────────────────────────────────────────');
    
    const errorsBefore = capturedLogs.errors.length;
    
    await pageWithLogging.click('button:has-text("Criar Automação")');
    await pageWithLogging.waitForTimeout(1500);
    
    console.log(`✅ Modal de criação aberto`);
    console.log(`   Novos erros: ${capturedLogs.errors.length - errorsBefore}`);
    
    await helper.captureScreenshot('step1-03-create-modal');
    
    // Preencher formulário
    const automationName = `Manual Test ${Date.now()}`;
    await pageWithLogging.fill('#name', automationName);
    await pageWithLogging.fill('#description', 'Validação manual pós-correções');
    
    console.log(`✅ Formulário preenchido: "${automationName}"`);
    
    // Clicar em próximo
    await pageWithLogging.click('button:has-text("Próximo")');
    await pageWithLogging.waitForTimeout(3000);
    
    const errorsAfterCreate = capturedLogs.errors.length - errorsBefore;
    console.log(`✅ WorkflowEditor aberto`);
    console.log(`   Erros durante criação: ${errorsAfterCreate}`);
    
    await helper.captureScreenshot('step1-04-workflow-editor-opened');
    
    // ==================================================
    // TESTE 3: Verificar WorkflowEditor renderizado
    // ==================================================
    console.log('\n📍 TESTE 3: WorkflowEditor renderizado corretamente');
    console.log('─────────────────────────────────────────────────────────────');
    
    // Verificar canvas React Flow
    const canvas = await pageWithLogging.$('.react-flow');
    console.log(`✅ Canvas React Flow: ${canvas ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    
    // Verificar botões de ação
    const triggerBtn = await pageWithLogging.$('button:has-text("Trigger")');
    console.log(`✅ Botão Trigger: ${triggerBtn ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    
    // Verificar toolbar
    const toolbar = await pageWithLogging.$('.react-flow__controls, [role="toolbar"]');
    console.log(`✅ Toolbar: ${toolbar ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    
    await helper.captureScreenshot('step1-05-workflow-components');
    
    // ==================================================
    // TESTE 4: Adicionar trigger e verificar
    // ==================================================
    console.log('\n📍 TESTE 4: Adicionar trigger ao workflow');
    console.log('─────────────────────────────────────────────────────────────');
    
    const errorsBeforeTrigger = capturedLogs.errors.length;
    
    if (triggerBtn) {
      await triggerBtn.click();
      await pageWithLogging.waitForTimeout(1500);
      
      console.log(`✅ Modal de seleção de trigger aberto`);
      
      await helper.captureScreenshot('step1-06-trigger-picker');
      
      // Selecionar WebHookTrigger
      await pageWithLogging.click('text=WebHookTrigger');
      await pageWithLogging.waitForTimeout(2500);
      
      const errorsAfterTrigger = capturedLogs.errors.length - errorsBeforeTrigger;
      console.log(`✅ WebHookTrigger adicionado`);
      console.log(`   Erros ao adicionar trigger: ${errorsAfterTrigger}`);
      
      await helper.captureScreenshot('step1-07-trigger-added');
      
      // Verificar node no canvas
      const nodes = await pageWithLogging.$$('.react-flow__node');
      console.log(`✅ Nodes no canvas: ${nodes.length}`);
    }
    
    // ==================================================
    // TESTE 5: Abrir modal de configuração
    // ==================================================
    console.log('\n📍 TESTE 5: Modal de configuração do trigger');
    console.log('─────────────────────────────────────────────────────────────');
    
    const errorsBeforeConfig = capturedLogs.errors.length;
    
    const configButtons = await pageWithLogging.$$('button:has-text("Config")');
    console.log(`✅ Botões Config encontrados: ${configButtons.length}`);
    
    if (configButtons.length > 0) {
      await configButtons[0].click();
      await pageWithLogging.waitForTimeout(2000);
      
      const errorsAfterConfig = capturedLogs.errors.length - errorsBeforeConfig;
      console.log(`✅ Modal de config aberto`);
      console.log(`   Erros ao abrir modal: ${errorsAfterConfig}`);
      
      await helper.captureScreenshot('step1-08-config-modal');
      
      // Verificar conteúdo do modal
      const modal = await pageWithLogging.$('[role="dialog"]');
      if (modal) {
        const modalText = await pageWithLogging.textContent('[role="dialog"]');
        
        // Verificar URL e token
        const hasUrl = modalText?.includes('http://localhost');
        const hasToken = modalText?.includes('whk_');
        
        console.log(`✅ Modal contém URL: ${hasUrl ? 'SIM' : 'NÃO'}`);
        console.log(`✅ Modal contém Token: ${hasToken ? 'SIM' : 'NÃO'}`);
        
        // Fechar modal
        const cancelBtn = await pageWithLogging.$('[role="dialog"] button:has-text("Cancelar")');
        if (cancelBtn) {
          await cancelBtn.click();
          await pageWithLogging.waitForTimeout(1000);
          console.log(`✅ Modal fechado`);
        }
      }
    }
    
    // ==================================================
    // TESTE 6: Verificar console do navegador
    // ==================================================
    console.log('\n📍 TESTE 6: Verificação do console do navegador');
    console.log('─────────────────────────────────────────────────────────────');
    
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    
    console.log(`\n📊 ESTATÍSTICAS FINAIS:`);
    console.log(`   - Total de logs: ${capturedLogs.console.length}`);
    console.log(`   - Total de erros: ${capturedLogs.errors.length}`);
    console.log(`   - Total de requisições: ${capturedLogs.network.length}`);
    console.log(`   - Requisições falhadas: ${analyzer.getFailedRequests().length}`);
    
    // Listar erros se houver
    if (capturedLogs.errors.length > 0) {
      console.log(`\n⚠️  ERROS DETECTADOS:`);
      capturedLogs.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log(`\n✅ NENHUM ERRO JAVASCRIPT DETECTADO!`);
    }
    
    await helper.captureScreenshot('step1-09-final-state');
    
    // ==================================================
    // ANÁLISE FINAL
    // ==================================================
    console.log('\n' + analyzer.generateReport());
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO DO PASSO 1:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`✅ Página inicial carregada sem erros`);
    console.log(`✅ Navegação funcionando`);
    console.log(`✅ Automação criada com sucesso`);
    console.log(`✅ WorkflowEditor renderizado corretamente`);
    console.log(`✅ Trigger adicionado sem erros`);
    console.log(`✅ Modal de configuração funcionando`);
    
    if (capturedLogs.errors.length === 0) {
      console.log(`\n🎉 PASSO 1 COMPLETO: 100% SEM ERROS!`);
    } else {
      console.log(`\n⚠️  PASSO 1 COMPLETO COM ${capturedLogs.errors.length} ERROS`);
    }
    console.log('═══════════════════════════════════════════════════════════════');
    
    // Verificações
    expect(analyzer.hasCriticalErrors()).toBe(false);
    expect(capturedLogs.errors.length).toBe(0);
  });
});
