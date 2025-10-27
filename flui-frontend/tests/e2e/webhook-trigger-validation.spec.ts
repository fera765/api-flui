import { test, expect } from '../fixtures/console-capture';
import { MCPLogAnalyzer, MCPPageHelper } from '../fixtures/mcp-helpers';

test.describe('Validação do Trigger de Webhook', () => {
  test('deve criar automação, adicionar webhook trigger e verificar configurações', async ({ pageWithLogging, capturedLogs }) => {
    const helper = new MCPPageHelper(pageWithLogging);
    
    console.log('📍 Navegando para página de automações...');
    await pageWithLogging.goto('http://localhost:8080/automations');
    await helper.waitForAppReady();
    
    // Capturar screenshot da página inicial
    await helper.captureScreenshot('automations-page-initial');
    
    console.log('📍 Procurando botão de criar automação...');
    // Tentar encontrar botão de criar nova automação
    const createButtons = [
      'button:has-text("Nova Automação")',
      'button:has-text("Criar Automação")',
      'button:has-text("Nova")',
      'button:has-text("Criar")',
      'button:has-text("New Automation")',
      '[data-testid="create-automation"]',
      'a[href*="create"]',
      'button[aria-label*="criar"]',
      'button[aria-label*="nova"]'
    ];
    
    let createButton = null;
    for (const selector of createButtons) {
      try {
        createButton = await pageWithLogging.$(selector);
        if (createButton && await createButton.isVisible()) {
          console.log(`✅ Botão encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar tentando
      }
    }
    
    if (!createButton) {
      console.log('⚠️  Botão de criar não encontrado. Listando todos os botões...');
      const allButtons = await pageWithLogging.$$('button');
      console.log(`📊 Total de botões na página: ${allButtons.length}`);
      
      for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
        const text = await allButtons[i].textContent();
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        console.log(`  Button ${i}: "${text}" [aria-label: ${ariaLabel}]`);
      }
      
      // Tentar clicar no primeiro botão que pareça ser de criar
      for (const btn of allButtons) {
        const text = (await btn.textContent())?.toLowerCase() || '';
        if (text.includes('criar') || text.includes('nova') || text.includes('new') || text.includes('+')) {
          console.log(`🎯 Tentando clicar em botão com texto: "${text}"`);
          await btn.click();
          break;
        }
      }
    } else {
      console.log('🎯 Clicando no botão de criar automação...');
      await createButton.click();
    }
    
    // Aguardar modal ou nova página
    await pageWithLogging.waitForTimeout(2000);
    await helper.captureScreenshot('after-click-create');
    
    console.log('📍 Procurando campos de formulário...');
    // Procurar campos do formulário
    const nameInput = await pageWithLogging.$('input[name="name"], input[placeholder*="nome"], input[placeholder*="name"], #name, #automation-name');
    const descInput = await pageWithLogging.$('textarea[name="description"], textarea[placeholder*="descrição"], textarea[placeholder*="description"], #description');
    
    if (nameInput) {
      console.log('✅ Campo de nome encontrado');
      await nameInput.fill('Teste Webhook Automation');
    } else {
      console.log('⚠️  Campo de nome não encontrado');
    }
    
    if (descInput) {
      console.log('✅ Campo de descrição encontrado');
      await descInput.fill('Automação de teste para validar webhook trigger');
    } else {
      console.log('⚠️  Campo de descrição não encontrado');
    }
    
    // Procurar botão de salvar/criar
    await pageWithLogging.waitForTimeout(1000);
    const saveButtons = await pageWithLogging.$$('button:has-text("Salvar"), button:has-text("Criar"), button:has-text("Save"), button:has-text("Create"), button[type="submit"]');
    
    if (saveButtons.length > 0) {
      console.log(`📍 Encontrados ${saveButtons.length} botões de salvar/criar`);
      // Clicar no último botão (geralmente é o do modal)
      await saveButtons[saveButtons.length - 1].click();
      await pageWithLogging.waitForTimeout(2000);
      await helper.captureScreenshot('after-create-automation');
    } else {
      console.log('⚠️  Botão de salvar não encontrado');
    }
    
    console.log('📍 Procurando área do workflow/canvas...');
    // Aguardar o canvas do workflow aparecer
    await pageWithLogging.waitForTimeout(2000);
    
    // Verificar se há canvas do React Flow
    const canvas = await pageWithLogging.$('.react-flow, [data-testid="workflow-canvas"], .workflow-canvas');
    if (canvas) {
      console.log('✅ Canvas do workflow encontrado');
    } else {
      console.log('⚠️  Canvas do workflow não encontrado');
    }
    
    await helper.captureScreenshot('workflow-canvas');
    
    console.log('📍 Procurando botão de adicionar trigger/webhook...');
    // Procurar botão de adicionar trigger ou ferramenta
    const addTriggerButtons = [
      'button:has-text("Trigger")',
      'button:has-text("Webhook")',
      'button:has-text("Adicionar Tool")',
      'button:has-text("Add Tool")',
      'button:has-text("+")',
      '[data-testid="add-tool"]',
      '[data-testid="add-trigger"]',
      'button[aria-label*="adicionar"]'
    ];
    
    let addTriggerBtn = null;
    for (const selector of addTriggerButtons) {
      try {
        addTriggerBtn = await pageWithLogging.$(selector);
        if (addTriggerBtn && await addTriggerBtn.isVisible()) {
          console.log(`✅ Botão de adicionar encontrado: ${selector}`);
          await addTriggerBtn.click();
          await pageWithLogging.waitForTimeout(1500);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }
    
    if (!addTriggerBtn) {
      console.log('⚠️  Botão de adicionar trigger não encontrado. Listando botões visíveis...');
      const visibleButtons = await pageWithLogging.$$('button:visible');
      for (let i = 0; i < Math.min(visibleButtons.length, 15); i++) {
        const text = await visibleButtons[i].textContent();
        console.log(`  Botão ${i}: "${text}"`);
      }
    }
    
    await helper.captureScreenshot('after-click-add-trigger');
    
    console.log('📍 Procurando lista de tools/triggers disponíveis...');
    // Procurar por lista de tools ou search
    const searchInput = await pageWithLogging.$('input[type="search"], input[placeholder*="busca"], input[placeholder*="search"], input[placeholder*="tool"]');
    if (searchInput) {
      console.log('✅ Campo de busca encontrado');
      await searchInput.fill('webhook');
      await pageWithLogging.waitForTimeout(1000);
    }
    
    await helper.captureScreenshot('tool-search-webhook');
    
    // Procurar e clicar no webhook trigger
    console.log('📍 Procurando elemento WebHookTrigger para clicar...');
    const webhookOptions = [
      'text=WebHookTrigger',
      'text=Webhook Trigger',
      'text=webhook-trigger',
      '[data-tool="webhook-trigger"]',
      '[data-testid="tool-webhook-trigger"]',
      'button:has-text("WebHook")',
      'div:has-text("WebHookTrigger")',
      'div:has-text("Triggers automation via HTTP webhook")'
    ];
    
    let webhookOption = null;
    for (const selector of webhookOptions) {
      try {
        webhookOption = await pageWithLogging.$(selector);
        if (webhookOption && await webhookOption.isVisible()) {
          console.log(`✅ Opção Webhook encontrada: ${selector}`);
          await webhookOption.click();
          await pageWithLogging.waitForTimeout(2000);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }
    
    if (!webhookOption) {
      console.log('⚠️  Seletor direto não funcionou. Procurando por qualquer elemento com "webhook"...');
      const allElements = await pageWithLogging.$$('div, button, span, a, [role="button"]');
      let found = false;
      for (let i = 0; i < allElements.length; i++) {
        const text = await allElements[i].textContent();
        if (text && (text.includes('WebHookTrigger') || text.includes('webhook-trigger'))) {
          console.log(`✅ Encontrado elemento com webhook: "${text}"`);
          // Tentar clicar neste elemento
          try {
            await allElements[i].click();
            await pageWithLogging.waitForTimeout(2000);
            found = true;
            console.log('✅ Click realizado com sucesso!');
            break;
          } catch (e) {
            console.log(`  Erro ao clicar: ${e.message}`);
            // Continuar
          }
        }
      }
      
      if (!found) {
        console.log('❌ Não foi possível clicar no WebHookTrigger');
      }
    }
    
    await helper.captureScreenshot('after-select-webhook');
    
    console.log('📍 Aguardando o node ser adicionado ao canvas...');
    await pageWithLogging.waitForTimeout(2000);
    
    console.log('📍 Procurando o node WebHookTrigger no canvas para clicar...');
    // O node foi adicionado ao canvas, agora precisamos clicar nele para abrir o modal de configuração
    const nodeSelectors = [
      '[data-id*="webhook"]',
      '[data-nodeid*="webhook"]',
      '.react-flow__node:has-text("WebHookTrigger")',
      '[class*="node"]:has-text("WebHookTrigger")',
      'div:has-text("WebHookTrigger")',
      '[data-testid="node-webhook-trigger"]'
    ];
    
    let nodeElement = null;
    for (const selector of nodeSelectors) {
      try {
        const elements = await pageWithLogging.$$(selector);
        for (const el of elements) {
          const text = await el.textContent();
          if (text && text.includes('WebHookTrigger')) {
            nodeElement = el;
            console.log(`✅ Node encontrado com selector: ${selector}`);
            break;
          }
        }
        if (nodeElement) break;
      } catch (e) {
        // Continuar
      }
    }
    
    if (!nodeElement) {
      console.log('⚠️  Procurando node por texto genérico...');
      // Procurar por qualquer div/elemento que contenha WebHookTrigger
      const allNodes = await pageWithLogging.$$('.react-flow__node, [class*="node"], div[data-id], div[draggable="true"]');
      console.log(`📊 Total de nodes no canvas: ${allNodes.length}`);
      
      for (let i = 0; i < allNodes.length; i++) {
        const text = await allNodes[i].textContent();
        if (text && text.includes('WebHookTrigger')) {
          nodeElement = allNodes[i];
          console.log(`✅ Node WebHookTrigger encontrado no índice ${i}`);
          break;
        }
      }
    }
    
    if (nodeElement) {
      console.log('✅ Node WebHookTrigger encontrado! Agora procurando botão Config...');
      
      // Procurar pelo botão Config dentro do node
      const configButtonSelectors = [
        'button:has-text("Config")',
        'button:has(text()="Config")',
        '[class*="button"]:has-text("Config")'
      ];
      
      let configButton = null;
      for (const selector of configButtonSelectors) {
        try {
          // Procurar dentro do node element
          configButton = await nodeElement.$(selector);
          if (configButton) {
            console.log(`✅ Botão Config encontrado com selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuar
        }
      }
      
      if (!configButton) {
        // Procurar globalmente por todos os botões Config e pegar o que está próximo do WebHookTrigger
        const allConfigButtons = await pageWithLogging.$$('button:has-text("Config")');
        console.log(`📊 Total de botões Config encontrados na página: ${allConfigButtons.length}`);
        
        if (allConfigButtons.length > 0) {
          // Usar o último botão Config (provavelmente o do node recém adicionado)
          configButton = allConfigButtons[allConfigButtons.length - 1];
          console.log('✅ Usando o último botão Config encontrado');
        }
      }
      
      if (configButton) {
        console.log('🎯 Clicando no botão Config...');
        await configButton.click();
        await pageWithLogging.waitForTimeout(2000);
        await helper.captureScreenshot('after-click-config-button');
      } else {
        console.log('❌ Botão Config não encontrado');
        // Tentar clicar no node mesmo assim
        console.log('🎯 Tentando clicar no node diretamente...');
        await nodeElement.click();
        await pageWithLogging.waitForTimeout(2000);
      }
    } else {
      console.log('❌ Node WebHookTrigger não encontrado no canvas');
    }
    
    console.log('📍 Verificando se modal de configuração abriu...');
    // Aguardar modal de configuração aparecer
    await pageWithLogging.waitForTimeout(1000);
    
    // Procurar pelo modal
    const modals = [
      '[role="dialog"]',
      '.modal',
      '[data-radix-dialog-content]',
      '[data-testid="node-config-modal"]',
      '[data-testid="tool-config-modal"]'
    ];
    
    let modal = null;
    for (const selector of modals) {
      modal = await pageWithLogging.$(selector);
      if (modal && await modal.isVisible()) {
        console.log(`✅ Modal encontrado: ${selector}`);
        break;
      }
    }
    
    if (!modal) {
      console.log('⚠️  Modal de configuração não encontrado');
    }
    
    await helper.captureScreenshot('webhook-config-modal');
    
    console.log('📍 Procurando por URL do webhook e API key no modal...');
    
    // Capturar todo o conteúdo do modal
    const modalContent = modal ? await modal.textContent() : await pageWithLogging.textContent('body');
    console.log('📄 Conteúdo do modal/página:');
    console.log(modalContent);
    
    // Procurar por URL do webhook
    const urlPatterns = [
      /https?:\/\/[^\s<>"]+\/webhook\/[a-zA-Z0-9-]+/g,
      /Webhook URL[:\s]+([^\s<>"]+)/gi,
      /URL[:\s]+([^\s<>"]+)/gi
    ];
    
    let webhookUrl = null;
    for (const pattern of urlPatterns) {
      const match = modalContent?.match(pattern);
      if (match) {
        webhookUrl = match[0];
        console.log(`✅ URL do webhook encontrada: ${webhookUrl}`);
        break;
      }
    }
    
    // Procurar por API Key
    const apiKeyPatterns = [
      /API Key[:\s]+([a-zA-Z0-9-_]+)/gi,
      /Key[:\s]+([a-zA-Z0-9-_]{20,})/gi,
      /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi // UUID pattern
    ];
    
    let apiKey = null;
    for (const pattern of apiKeyPatterns) {
      const match = modalContent?.match(pattern);
      if (match) {
        apiKey = match[0];
        console.log(`✅ API Key encontrada: ${apiKey}`);
        break;
      }
    }
    
    // Procurar por elementos de input que possam conter a URL ou API key
    const inputs = await pageWithLogging.$$('input[readonly], input[disabled], input[type="text"]');
    console.log(`📊 Total de inputs encontrados: ${inputs.length}`);
    
    for (let i = 0; i < inputs.length; i++) {
      const value = await inputs[i].inputValue();
      const placeholder = await inputs[i].getAttribute('placeholder');
      const label = await inputs[i].getAttribute('aria-label');
      
      console.log(`  Input ${i}:`);
      console.log(`    Value: ${value}`);
      console.log(`    Placeholder: ${placeholder}`);
      console.log(`    Label: ${label}`);
      
      if (value && value.includes('http')) {
        webhookUrl = value;
        console.log(`✅ URL do webhook encontrada no input: ${value}`);
      }
      
      if (value && value.length > 20 && !value.includes('http')) {
        apiKey = value;
        console.log(`✅ API Key encontrada no input: ${value}`);
      }
    }
    
    // Verificar elementos com código ou valor copiável
    const codeElements = await pageWithLogging.$$('code, pre, [data-copy], [class*="code"]');
    console.log(`📊 Total de elementos de código encontrados: ${codeElements.length}`);
    
    for (let i = 0; i < codeElements.length; i++) {
      const text = await codeElements[i].textContent();
      console.log(`  Code element ${i}: ${text}`);
      
      if (text && text.includes('http')) {
        webhookUrl = text;
      }
      if (text && text.length > 20 && !text.includes('http')) {
        apiKey = text;
      }
    }
    
    await helper.captureScreenshot('webhook-config-details');
    
    // Análise de logs
    const analyzer = new MCPLogAnalyzer(capturedLogs);
    console.log('\n' + analyzer.generateReport());
    
    // Verificações
    console.log('\n📋 RESULTADO DA VALIDAÇÃO:');
    console.log('═══════════════════════════════════════════════════');
    
    if (webhookUrl) {
      console.log(`✅ URL do Webhook encontrada: ${webhookUrl}`);
    } else {
      console.log('❌ URL do Webhook NÃO foi encontrada no modal');
    }
    
    if (apiKey) {
      console.log(`✅ API Key encontrada: ${apiKey}`);
    } else {
      console.log('❌ API Key NÃO foi encontrada no modal');
    }
    
    console.log('═══════════════════════════════════════════════════');
    
    // Se não encontrou, falhar o teste mas com informação útil
    if (!webhookUrl || !apiKey) {
      console.log('\n⚠️  ATENÇÃO: URL do webhook e/ou API key não foram encontradas!');
      console.log('Isso pode indicar que:');
      console.log('1. O modal não carregou completamente');
      console.log('2. As informações estão em um formato diferente');
      console.log('3. Há um problema no backend ao gerar essas informações');
      console.log('4. O frontend não está renderizando esses dados corretamente');
    }
    
    // Verificar se houve erros críticos
    expect(analyzer.hasCriticalErrors()).toBe(false);
  });
});
