import { test, expect } from '@playwright/test';

/**
 * TESTE REAL: Validar se Condition Tool está disponível
 * SEM MOCK, SEM HARDCODE - 100% REAL
 */

test.describe('Validação: Condition Tool Disponível', () => {
  test.setTimeout(180000); // 3 minutos

  test('Verificar se Condition está na lista de tools', async ({ page }) => {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║      🔍 VALIDANDO CONDITION TOOL NA LISTA - 100% REAL        ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const logs: string[] = [];
    const errors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      logs.push(text);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // ═══════════════════════════════════════════════════════════════
    // PARTE 1: VERIFICAR API DIRETAMENTE
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 1: Verificar API /api/tools/condition');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let conditionsFromAPI: any[] = [];
    
    try {
      const response = await fetch('http://localhost:3000/api/tools/condition');
      if (response.ok) {
        conditionsFromAPI = await response.json();
        console.log(`✅ API respondeu com ${conditionsFromAPI.length} conditions`);
        
        if (conditionsFromAPI.length > 0) {
          conditionsFromAPI.forEach((cond, idx) => {
            console.log(`   ${idx + 1}. ${cond.name} (ID: ${cond.id})`);
          });
        } else {
          console.log('⚠️  API retornou array vazio - criando condition de teste...');
          
          // Criar uma condition de teste
          const createResponse = await fetch('http://localhost:3000/api/tools/condition', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Test Condition',
              description: 'Condition de teste para validação',
              conditions: [
                { name: 'Opção A', predicate: 'input.value === "A"', linkedNodes: [] },
                { name: 'Opção B', predicate: 'input.value === "B"', linkedNodes: [] }
              ]
            })
          });
          
          if (createResponse.ok) {
            const created = await createResponse.json();
            conditionsFromAPI = [created];
            console.log(`✅ Condition criada: ${created.name} (ID: ${created.id})`);
          } else {
            console.log('❌ Falha ao criar condition de teste');
          }
        }
      } else {
        console.log(`❌ API falhou com status ${response.status}`);
      }
    } catch (error: any) {
      console.log(`❌ Erro ao acessar API: ${error.message}`);
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 2: CRIAR AUTOMAÇÃO E ABRIR MODAL DE TOOLS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 2: Abrir Modal de Tools no Workflow');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await page.goto('http://localhost:8080/automations');
    await page.waitForTimeout(2000);

    await page.click('button:has-text("Criar Automação")');
    await page.waitForTimeout(1000);

    await page.fill('#name', `Validation Test ${Date.now()}`);
    await page.fill('#description', 'Validação de Condition disponível');
    
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(3000);

    console.log('✅ Workflow editor aberto');

    await page.screenshot({ path: '/tmp/validate-01-editor.png', fullPage: true });

    // Adicionar trigger primeiro
    await page.click('button:has-text("Trigger")');
    await page.waitForTimeout(1500);

    await page.screenshot({ path: '/tmp/validate-02-trigger-modal.png' });

    // Verificar se modal abriu
    const triggerModal = await page.$('[role="dialog"]');
    if (triggerModal) {
      console.log('✅ Modal de Trigger aberto');
      
      // Selecionar ManualTrigger
      const manualTrigger = await page.$('text=ManualTrigger');
      if (manualTrigger) {
        await manualTrigger.click();
        await page.waitForTimeout(2000);
        console.log('✅ ManualTrigger adicionado');
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 3: ABRIR MODAL DE ADICIONAR TOOL E BUSCAR CONDITION
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 3: Verificar Condition no Modal de Tools');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Clicar em "Adicionar Tool"
    await page.waitForTimeout(1000);
    const addToolButtons = await page.$$('button');
    let clicked = false;
    
    for (const btn of addToolButtons) {
      const text = await btn.textContent();
      if (text && text.toLowerCase().includes('adicionar tool')) {
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (clicked) {
      console.log('✅ Clicou em "Adicionar Tool"');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: '/tmp/validate-03-tools-modal.png' });

      // Verificar se modal abriu
      const toolsModal = await page.$('[role="dialog"]');
      if (toolsModal) {
        console.log('✅ Modal de Tools aberto');

        // Buscar por "condition"
        const searchInput = await page.$('[role="dialog"] input[placeholder*="Buscar"]');
        if (searchInput) {
          await searchInput.fill('condition');
          await page.waitForTimeout(1500);
          console.log('✅ Buscou por "condition"');
          
          await page.screenshot({ path: '/tmp/validate-04-search-condition.png' });
        }

        // Verificar DevTools Network para ver a requisição
        console.log('\n   📡 Verificando requisições de rede...');
        
        // Verificar se existe seção "Conditions"
        const conditionSection = await page.$('text=Conditions');
        if (conditionSection) {
          console.log('✅ SEÇÃO "Conditions" ENCONTRADA!');

          // Contar quantas condition tools aparecem
          const conditionCards = await page.$$('[role="dialog"] [class*="cursor-pointer"]');
          let conditionCount = 0;
          
          for (const card of conditionCards) {
            const hasGitBranch = await card.$('svg.lucide-git-branch');
            if (hasGitBranch) {
              conditionCount++;
              const cardText = await card.textContent();
              console.log(`   → Condition encontrada: ${cardText?.substring(0, 50)}...`);
            }
          }
          
          console.log(`\n✅ Total de Conditions disponíveis: ${conditionCount}`);

          if (conditionCount === 0) {
            console.log('⚠️  Seção existe mas está vazia');
          }

          await page.screenshot({ path: '/tmp/validate-05-conditions-found.png' });

        } else {
          console.log('❌ SEÇÃO "Conditions" NÃO ENCONTRADA');
          
          // Debug: listar todas as seções visíveis
          console.log('\n   📋 Seções disponíveis no modal:');
          const allSections = await page.$$('[role="dialog"] h3');
          for (const section of allSections) {
            const text = await section.textContent();
            console.log(`   - ${text}`);
          }
        }

        // Verificar logs do console do navegador
        const conditionLogs = logs.filter(log => 
          log.toLowerCase().includes('condition') || 
          log.toLowerCase().includes('getAllConditionTools')
        );
        
        if (conditionLogs.length > 0) {
          console.log('\n   📝 Logs relacionados a Condition:');
          conditionLogs.forEach(log => {
            console.log(`   ${log}`);
          });
        }

      } else {
        console.log('❌ Modal de Tools NÃO abriu');
      }
    } else {
      console.log('❌ Botão "Adicionar Tool" não encontrado');
    }

    // ═══════════════════════════════════════════════════════════════
    // PARTE 4: VERIFICAR ERROS
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PARTE 4: Análise de Erros');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('ReferenceError') ||
      e.includes('Failed to fetch')
    );

    console.log(`📊 Total de erros: ${errors.length}`);
    console.log(`⚠️  Erros críticos: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('\n❌ ERROS ENCONTRADOS:');
      criticalErrors.slice(0, 5).forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.substring(0, 120)}`);
      });
    }

    // ═══════════════════════════════════════════════════════════════
    // RELATÓRIO FINAL
    // ═══════════════════════════════════════════════════════════════
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                   📊 RELATÓRIO FINAL                          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    console.log(`API retornou: ${conditionsFromAPI.length} conditions`);
    console.log(`Erros críticos: ${criticalErrors.length}`);

    const conditionSectionExists = await page.$('text=Conditions');
    console.log(`Seção "Conditions" no modal: ${conditionSectionExists ? '✅ SIM' : '❌ NÃO'}`);

    console.log('\n📸 Screenshots: /tmp/validate-*.png');

    // ═══════════════════════════════════════════════════════════════
    // ASSERTIONS
    // ═══════════════════════════════════════════════════════════════
    expect(conditionsFromAPI.length).toBeGreaterThan(0);
    expect(conditionSectionExists).toBeTruthy();
    expect(criticalErrors.length).toBe(0);

    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║          ✅ CONDITION TOOL DISPONÍVEL E FUNCIONANDO!          ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
  });
});
