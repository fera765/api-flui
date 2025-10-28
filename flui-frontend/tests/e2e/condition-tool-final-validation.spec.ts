import { test, expect } from '@playwright/test';

/**
 * TESTE FINAL: Validar Condition Tool como System Tool
 * 
 * IMPORTANTE: Execute este teste após reiniciar o backend!
 * O backend precisa registrar a nova Condition Tool
 */

test.describe('Condition Tool - System Tool Normal', () => {
  test.setTimeout(180000);

  test('Validar que Condition aparece como System Tool', async ({ page }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║     ✅ VALIDAÇÃO FINAL: CONDITION COMO SYSTEM TOOL            ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const logs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
        console.log(`[ERRO] ${text}`);
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // PARTE 1: VERIFICAR API
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 1: Verificar API /api/tools');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let conditionToolFromAPI: any = null;
    
    try {
      const response = await fetch('http://localhost:3000/api/tools');
      if (response.ok) {
        const tools = await response.json();
        console.log(`✅ API retorna ${tools.length} tools`);
        
        // Procurar Condition tool
        conditionToolFromAPI = tools.find((t: any) => t.name === 'Condition');
        
        if (conditionToolFromAPI) {
          console.log(`\n✅ CONDITION TOOL ENCONTRADA NA API!`);
          console.log(`   ID: ${conditionToolFromAPI.id}`);
          console.log(`   Nome: ${conditionToolFromAPI.name}`);
          console.log(`   Tipo: ${conditionToolFromAPI.type}`);
          console.log(`   Descrição: ${conditionToolFromAPI.description}`);
        } else {
          console.log('\n❌ Condition Tool NÃO encontrada na API');
          console.log('   Tools disponíveis:');
          tools.slice(0, 5).forEach((t: any) => {
            console.log(`   - ${t.name} (${t.type})`);
          });
        }
      } else {
        console.log(`❌ API falhou: ${response.status}`);
      }
    } catch (error: any) {
      console.log(`❌ Erro ao acessar API: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 2: VERIFICAR NA PÁGINA /TOOLS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 2: Verificar Página /tools');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.goto('http://localhost:8080/tools');
    await page.waitForTimeout(3000);

    await page.screenshot({ path: '/tmp/final-01-tools-page.png', fullPage: true });

    // Buscar por "Condition" na página
    const conditionOnPage = await page.$('text=Condition');
    
    if (conditionOnPage) {
      console.log('✅ "Condition" encontrada na página /tools');
    } else {
      console.log('❌ "Condition" NÃO encontrada na página /tools');
    }

    // Buscar por ícone GitBranch
    const gitBranchIcon = await page.$('svg.lucide-git-branch');
    if (gitBranchIcon) {
      console.log('✅ Ícone GitBranch encontrado');
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 3: CRIAR AUTOMAÇÃO E ADICIONAR CONDITION
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 3: Adicionar Condition no Workflow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.goto('http://localhost:8080/automations');
    await page.waitForTimeout(2000);

    // Criar automação
    await page.click('button:has-text("Criar Automação")');
    await page.waitForTimeout(1000);

    const automationName = `Condition Test ${Date.now()}`;
    await page.fill('#name', automationName);
    await page.fill('#description', 'Validação final da Condition tool');
    
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(3000);

    console.log(`✅ Automação criada: ${automationName}`);

    await page.screenshot({ path: '/tmp/final-02-workflow-editor.png', fullPage: true });

    // Adicionar ManualTrigger
    await page.click('button:has-text("Trigger")');
    await page.waitForTimeout(2000);

    await page.click('text=ManualTrigger');
    await page.waitForTimeout(2500);

    console.log('✅ ManualTrigger adicionado');

    // ═══════════════════════════════════════════════════════════════
    // PARTE 4: PROCURAR CONDITION NO MODAL DE TOOLS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 4: Procurar Condition no Modal de Tools');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Adicionar tool
    await page.waitForTimeout(1000);
    const addToolBtn = await page.$('button:has-text("Adicionar Tool")');
    
    if (addToolBtn) {
      await addToolBtn.click();
      await page.waitForTimeout(2000);

      await page.screenshot({ path: '/tmp/final-03-tools-modal.png', fullPage: true });

      // Buscar "condition"
      const searchInput = await page.$('[role="dialog"] input[placeholder*="Buscar"]');
      if (searchInput) {
        await searchInput.fill('condition');
        await page.waitForTimeout(1500);
        
        await page.screenshot({ path: '/tmp/final-04-search-condition.png', fullPage: true });
      }

      // Procurar tool "Condition" na lista
      const conditionTool = await page.$('[role="dialog"] :text("Condition")');
      
      if (conditionTool) {
        console.log('✅ CONDITION TOOL ENCONTRADA NO MODAL!');
        
        // Tentar clicar
        await conditionTool.click();
        await page.waitForTimeout(2500);

        await page.screenshot({ path: '/tmp/final-05-condition-added.png', fullPage: true });

        console.log('✅ Condition Tool adicionada ao workflow');

        // Verificar se o ConditionNode renderizou
        const conditionNode = await page.$('.border-purple-500');
        if (conditionNode) {
          console.log('✅ ConditionNode renderizado (border purple)');
        }

        // Abrir configuração
        const configButtons = await page.$$('button:has-text("Config")');
        if (configButtons.length > 0) {
          await configButtons[configButtons.length - 1].click();
          await page.waitForTimeout(2000);

          await page.screenshot({ path: '/tmp/final-06-condition-config-modal.png', fullPage: true });

          // Verificar se é o ConditionConfigModal
          const modalTitle = await page.$('text=Configurar Condição');
          if (modalTitle) {
            console.log('✅ ConditionConfigModal aberto');

            // Verificar botão "ADD CONDITION"
            const addConditionBtn = await page.$('button:has-text("ADD CONDITION")');
            if (addConditionBtn) {
              console.log('✅ Botão "ADD CONDITION" encontrado');
            }
          }
        }

      } else {
        console.log('❌ Condition Tool NÃO encontrada no modal');
        
        // Listar tools visíveis
        console.log('\n   Tools visíveis no modal:');
        const toolItems = await page.$$('[role="dialog"] [class*="cursor-pointer"]');
        for (const item of toolItems.slice(0, 10)) {
          const text = await item.textContent();
          if (text) {
            console.log(`   - ${text.substring(0, 50)}`);
          }
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // RELATÓRIO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                     📊 RELATÓRIO FINAL                        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`API tem Condition: ${conditionToolFromAPI ? '✅' : '❌'}`);
    console.log(`Página /tools: ${conditionOnPage ? '✅' : '❌'}`);
    console.log(`Modal de tools: ${conditionTool ? '✅' : '❌'}`);
    console.log(`Erros críticos: ${errors.length}`);

    console.log('\n📸 Screenshots: /tmp/final-*.png');

    if (conditionToolFromAPI && conditionTool) {
      console.log('\n╔═══════════════════════════════════════════════════════════════╗');
      console.log('║          ✅ CONDITION TOOL DISPONÍVEL E FUNCIONANDO!          ║');
      console.log('╚═══════════════════════════════════════════════════════════════╝');
    }

    // Assertions
    expect(conditionToolFromAPI).toBeTruthy();
    expect(conditionTool).toBeTruthy();
  });
});
