import { test, expect } from '@playwright/test';

/**
 * TESTE DIRETO: Condition Tool Disponível
 * Vai direto ao ponto - verificar se Condition aparece no modal
 */

test('Condition Tool está disponível no modal - TESTE REAL', async ({ page }) => {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║           🎯 TESTE DIRETO - CONDITION DISPONÍVEL              ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 1: API
  // ═══════════════════════════════════════════════════════════════
  console.log('📡 PASSO 1: Verificando API...\n');

  const response = await fetch('http://localhost:3000/api/tools/condition');
  const conditions = await response.json();
  
  console.log(`✅ API retorna ${conditions.length} conditions:`);
  conditions.forEach((c: any, i: number) => {
    console.log(`   ${i + 1}. ${c.name} (${c.id})`);
  });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 2: ABRIR WORKFLOW EXISTENTE OU CRIAR NOVO
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📂 PASSO 2: Abrindo workflow editor...\n');

  await page.goto('http://localhost:8080/automations');
  await page.waitForTimeout(2000);

  // Tentar abrir automação existente primeiro
  const firstAutomation = await page.$('.hover\\:shadow-lg');
  if (firstAutomation) {
    console.log('   → Abrindo automação existente');
    
    // Procurar botão "Editar" ou ícone de editar
    const editButtons = await page.$$('[title*="Editar"], button:has-text("Editar")');
    if (editButtons.length > 0) {
      await editButtons[0].click();
      await page.waitForTimeout(3000);
    }
  } else {
    console.log('   → Criando nova automação');
    
    await page.click('button:has-text("Criar Automação")');
    await page.waitForTimeout(1000);
    
    await page.fill('#name', `Test Direct ${Date.now()}`);
    await page.fill('#description', 'Teste direto');
    
    await page.click('button:has-text("Próximo")');
    await page.waitForTimeout(3000);
  }

  console.log('✅ Workflow editor aberto');
  await page.screenshot({ path: '/tmp/direct-01-editor.png', fullPage: true });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 3: ABRIR MODAL DE TOOLS (PULANDO TRIGGER SE NÃO NECESSÁRIO)
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔍 PASSO 3: Abrindo modal de tools...\n');

  // Procurar botão "Adicionar Tool" ou similar
  await page.waitForTimeout(1000);
  
  const buttons = await page.$$('button');
  let foundButton = false;
  
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text && (
      text.toLowerCase().includes('adicionar tool') ||
      text.toLowerCase().includes('add tool') ||
      text.includes('+')
    )) {
      const isVisible = await btn.isVisible();
      if (isVisible) {
        await btn.click();
        foundButton = true;
        console.log(`   → Clicou em: "${text}"`);
        break;
      }
    }
  }

  if (!foundButton) {
    console.log('⚠️  Botão não encontrado, tentando alternativas...');
    
    // Alternativa: clicar em qualquer lugar vazio e procurar menu
    await page.click('.react-flow__pane');
    await page.waitForTimeout(500);
  }

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/direct-02-modal-opened.png' });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 4: VERIFICAR MODAL E BUSCAR CONDITION
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎯 PASSO 4: Verificando modal de tools...\n');

  const modal = await page.$('[role="dialog"]');
  if (!modal) {
    console.log('❌ Modal não abriu');
    await page.screenshot({ path: '/tmp/direct-03-no-modal.png', fullPage: true });
    expect(modal).toBeTruthy();
    return;
  }

  console.log('✅ Modal aberto');

  // Buscar por "condition"
  const searchInput = await page.$('[role="dialog"] input[placeholder*="Buscar"]');
  if (searchInput) {
    await searchInput.fill('condition');
    await page.waitForTimeout(2000);
    console.log('✅ Buscou por "condition"');
  }

  await page.screenshot({ path: '/tmp/direct-03-search.png' });

  // ═══════════════════════════════════════════════════════════════
  // PASSO 5: VERIFICAR SE CONDITION APARECE
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔎 PASSO 5: Procurando Condition Tools...\n');

  // Método 1: Procurar pela seção "Conditions"
  const conditionSection = await page.$('[role="dialog"] text=Conditions');
  
  if (conditionSection) {
    console.log('✅ SEÇÃO "Conditions" ENCONTRADA!');
  } else {
    console.log('❌ Seção "Conditions" NÃO encontrada');
    
    // Listar o que existe no modal
    console.log('\n   📋 Seções encontradas no modal:');
    const allText = await page.$$('[role="dialog"] h3, [role="dialog"] [class*="font-semibold"]');
    for (const el of allText) {
      const text = await el.textContent();
      if (text) {
        console.log(`   - ${text}`);
      }
    }
  }

  // Método 2: Procurar por ícone GitBranch
  const gitBranchIcons = await page.$$('[role="dialog"] svg.lucide-git-branch');
  console.log(`\n   🔀 ${gitBranchIcons.length} ícones GitBranch encontrados`);

  // Método 3: Contar cards de condition
  let conditionCards = 0;
  const allCards = await page.$$('[role="dialog"] [class*="cursor-pointer"]');
  
  for (const card of allCards) {
    const hasGitBranch = await card.$('svg.lucide-git-branch');
    if (hasGitBranch) {
      conditionCards++;
      const cardText = await card.textContent();
      console.log(`   ✓ Condition card: ${cardText?.substring(0, 60)}...`);
    }
  }

  console.log(`\n📊 RESULTADO: ${conditionCards} Condition Tools encontradas`);

  await page.screenshot({ path: '/tmp/direct-04-final.png' });

  // ═══════════════════════════════════════════════════════════════
  // ANÁLISE DE ERROS
  // ═══════════════════════════════════════════════════════════════
  const criticalErrors = errors.filter(e => 
    e.includes('TypeError') || 
    e.includes('ReferenceError') ||
    e.includes('Failed')
  );

  console.log(`\n⚠️  Erros críticos: ${criticalErrors.length}`);
  if (criticalErrors.length > 0) {
    console.log('\nErros encontrados:');
    criticalErrors.forEach((e, i) => {
      console.log(`   ${i + 1}. ${e.substring(0, 100)}`);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // RELATÓRIO FINAL
  // ═══════════════════════════════════════════════════════════════
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                     📊 RELATÓRIO FINAL                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`API:                ${conditions.length} conditions`);
  console.log(`Modal aberto:       ${modal ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Seção Conditions:   ${conditionSection ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`Ícones GitBranch:   ${gitBranchIcons.length}`);
  console.log(`Condition Cards:    ${conditionCards}`);
  console.log(`Erros críticos:     ${criticalErrors.length}`);

  console.log('\n📸 Screenshots: /tmp/direct-*.png');

  if (conditionCards > 0) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         ✅ CONDITION TOOL DISPONÍVEL! ✅                      ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
  } else {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║         ❌ CONDITION TOOL NÃO ENCONTRADA ❌                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
  }

  // Assertions
  expect(conditions.length).toBeGreaterThan(0);
  expect(modal).toBeTruthy();
  expect(conditionCards).toBeGreaterThan(0);
  expect(criticalErrors.length).toBe(0);
});
