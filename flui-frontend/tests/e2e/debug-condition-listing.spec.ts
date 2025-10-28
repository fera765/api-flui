import { test, expect } from '@playwright/test';

/**
 * DEBUG: Por que Condition não aparece na lista?
 * Teste completo com logs detalhados
 */

test('DEBUG: Encontrar por que Condition não aparece', async ({ page }) => {
  test.setTimeout(240000);

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                🔍 DEBUG - CONDITION LISTING                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const logs: any[] = [];
  const networkRequests: any[] = [];
  const errors: string[] = [];

  // Capturar TODOS os logs
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    logs.push({ type, text, timestamp: Date.now() });
    console.log(`[BROWSER ${type.toUpperCase()}] ${text}`);
    
    if (type === 'error') {
      errors.push(text);
    }
  });

  // Capturar requisições de rede
  page.on('request', request => {
    const url = request.url();
    if (url.includes('/api/')) {
      networkRequests.push({
        url,
        method: request.method(),
        timestamp: Date.now()
      });
      console.log(`[NETWORK] ${request.method()} ${url}`);
    }
  });

  page.on('response', async response => {
    const url = response.url();
    if (url.includes('/api/tools') || url.includes('/condition')) {
      try {
        const status = response.status();
        const body = await response.text();
        console.log(`[RESPONSE] ${status} ${url}`);
        console.log(`[RESPONSE BODY] ${body.substring(0, 200)}...`);
      } catch (e) {
        // Ignore
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 1: Verificar API diretamente
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 1: Verificar API');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const apiResponse = await fetch('http://localhost:3000/api/tools/condition');
  const conditions = await apiResponse.json();
  
  console.log(`✅ API retorna ${conditions.length} conditions`);
  conditions.forEach((c: any, i: number) => {
    console.log(`   ${i + 1}. ${c.name} (ID: ${c.id}, Type: ${c.type})`);
  });

  expect(conditions.length).toBeGreaterThan(0);

  // ═══════════════════════════════════════════════════════════════
  // PASSO 2: Ir para página de automações
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 2: Abrir página de automações');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await page.goto('http://localhost:8080/automations', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await page.screenshot({ path: '/tmp/debug-01-automations.png', fullPage: true });
  console.log('✅ Página de automações carregada');

  // Procurar automação existente
  const automationCards = await page.$$('.hover\\:shadow-lg, [class*="Card"]');
  console.log(`   ${automationCards.length} automações encontradas`);

  if (automationCards.length > 0) {
    // Clicar no primeiro card ou botão "Editar workflow"
    const editButtons = await page.$$('button, [role="button"]');
    
    for (const btn of editButtons) {
      const text = await btn.textContent();
      if (text && (text.includes('Editar') || text.includes('workflow'))) {
        console.log(`   → Clicando em: "${text}"`);
        await btn.click();
        await page.waitForTimeout(3000);
        break;
      }
    }
  }

  await page.screenshot({ path: '/tmp/debug-02-after-click.png', fullPage: true });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 3: Verificar se workflow editor abriu
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 3: Verificar Workflow Editor');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Procurar elementos do ReactFlow
  const reactFlow = await page.$('.react-flow');
  if (reactFlow) {
    console.log('✅ ReactFlow encontrado');
  } else {
    console.log('⚠️  ReactFlow NÃO encontrado');
  }

  // Procurar botões do workflow
  const allButtons = await page.$$('button');
  console.log(`   ${allButtons.length} botões na página`);

  let addToolButton = null;
  for (const btn of allButtons) {
    const text = await btn.textContent();
    if (text) {
      if (text.toLowerCase().includes('adicionar tool') || 
          text.toLowerCase().includes('add tool') ||
          (text.includes('+') && text.toLowerCase().includes('tool'))) {
        console.log(`   ✅ Encontrado: "${text}"`);
        addToolButton = btn;
        break;
      }
    }
  }

  if (!addToolButton) {
    console.log('❌ Botão "Adicionar Tool" não encontrado');
    console.log('\n   Botões disponíveis:');
    for (const btn of allButtons.slice(0, 10)) {
      const text = await btn.textContent();
      if (text && text.trim()) {
        console.log(`   - "${text.trim()}"`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // PASSO 4: Abrir modal de tools
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 4: Abrir Modal de Tools');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (addToolButton) {
    await addToolButton.click();
    console.log('✅ Clicou no botão');
    await page.waitForTimeout(3000);
  }

  await page.screenshot({ path: '/tmp/debug-03-after-click-add.png', fullPage: true });

  // Verificar se modal abriu
  const modal = await page.$('[role="dialog"]');
  if (modal) {
    console.log('✅ Modal aberto');

    // Verificar conteúdo do modal
    const modalText = await modal.textContent();
    console.log(`\n   Modal contém: "${modalText?.substring(0, 200)}..."`);

    // Buscar por "condition"
    const searchInput = await page.$('[role="dialog"] input');
    if (searchInput) {
      await searchInput.fill('condition');
      console.log('✅ Buscou por "condition"');
      await page.waitForTimeout(2000);
    }

    await page.screenshot({ path: '/tmp/debug-04-search-condition.png', fullPage: true });

    // ═══════════════════════════════════════════════════════════════
    // PASSO 5: ANALISAR O MODAL EM DETALHES
    // ═══════════════════════════════════════════════════════════════
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📍 PASSO 5: Analisar Modal em Detalhes');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Procurar todas as seções
    const sections = await page.$$('[role="dialog"] h3, [role="dialog"] [class*="font-semibold"]');
    console.log(`   ${sections.length} seções encontradas:`);
    
    for (const section of sections) {
      const text = await section.textContent();
      if (text && text.trim()) {
        console.log(`   - "${text.trim()}"`);
      }
    }

    // Procurar ícone GitBranch
    const gitBranchIcons = await page.$$('[role="dialog"] svg.lucide-git-branch');
    console.log(`\n   🔀 ${gitBranchIcons.length} ícones GitBranch`);

    // Procurar texto "Conditions"
    const conditionsText = await page.$('[role="dialog"] :text("Conditions")');
    console.log(`   📝 Texto "Conditions": ${conditionsText ? '✅ SIM' : '❌ NÃO'}`);

    // Procurar texto "condition" (case insensitive)
    const anyCondition = await page.$('[role="dialog"] :text-matches("condition", "i")');
    console.log(`   📝 Qualquer "condition": ${anyCondition ? '✅ SIM' : '❌ NÃO'}`);

    // Listar todos os tools visíveis
    console.log('\n   🔧 Tools listadas no modal:');
    const toolCards = await page.$$('[role="dialog"] [class*="cursor-pointer"], [role="dialog"] [class*="hover"]');
    console.log(`   Total de cards: ${toolCards.length}`);
    
    for (const card of toolCards.slice(0, 20)) {
      const cardText = await card.textContent();
      if (cardText && cardText.trim()) {
        console.log(`   - ${cardText.trim().substring(0, 60)}`);
      }
    }

  } else {
    console.log('❌ Modal NÃO abriu');
  }

  // ═══════════════════════════════════════════════════════════════
  // PASSO 6: Análise de Requisições
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 6: Análise de Requisições de Rede');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log(`   Total de requisições: ${networkRequests.length}`);
  
  const conditionRequests = networkRequests.filter(r => r.url.includes('condition'));
  console.log(`   Requisições para /condition: ${conditionRequests.length}`);
  
  conditionRequests.forEach(req => {
    console.log(`   → ${req.method} ${req.url}`);
  });

  const toolsRequests = networkRequests.filter(r => r.url.includes('/tools'));
  console.log(`\n   Requisições para /tools: ${toolsRequests.length}`);
  
  toolsRequests.forEach(req => {
    console.log(`   → ${req.method} ${req.url}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 7: Logs JavaScript
  // ═══════════════════════════════════════════════════════════════
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📍 PASSO 7: Logs JavaScript');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const relevantLogs = logs.filter(log => 
    log.text.toLowerCase().includes('condition') ||
    log.text.toLowerCase().includes('tool') ||
    log.text.toLowerCase().includes('load')
  );

  console.log(`   Logs relevantes: ${relevantLogs.length}`);
  relevantLogs.forEach(log => {
    console.log(`   [${log.type}] ${log.text}`);
  });

  console.log(`\n   Erros: ${errors.length}`);
  errors.forEach(err => {
    console.log(`   ❌ ${err}`);
  });

  // ═══════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                     📊 DIAGNÓSTICO                            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`API /condition retorna: ${conditions.length} conditions`);
  console.log(`Modal abriu: ${modal ? '✅' : '❌'}`);
  console.log(`Requisição /condition feita: ${conditionRequests.length > 0 ? '✅' : '❌'}`);
  console.log(`Seção "Conditions" visível: ${await page.$('[role="dialog"] :text("Conditions")') ? '✅' : '❌'}`);
  console.log(`Erros JS: ${errors.length}`);

  console.log('\n📸 Screenshots em /tmp/debug-*.png');

  // Se não encontrou, fazer assertion fail para ver o erro
  const conditionsVisible = await page.$('[role="dialog"] :text("Conditions")');
  if (!conditionsVisible && modal) {
    console.log('\n❌ PROBLEMA IDENTIFICADO: Modal abre mas Conditions não aparecem!');
    console.log('   Possíveis causas:');
    console.log('   1. getAllConditionTools() não está sendo chamado');
    console.log('   2. Erro ao processar as conditions');
    console.log('   3. Conditions não sendo adicionadas ao allToolItems');
    console.log('   4. showOnlyTriggers está true e escondendo conditions');
  }

  expect(modal).toBeTruthy();
  expect(conditionRequests.length).toBeGreaterThan(0);
  expect(conditionsVisible).toBeTruthy();
});
