# 🧠 AUTO TEST RUNNER - Documentação Completa

## 📖 Sobre

Sistema automatizado de testes E2E (End-to-End) para validação completa de todas as rotas da API. O sistema:

- ✅ Testa todas as rotas automaticamente
- ✅ Cria dados dinamicamente conforme necessário
- ✅ Monitora performance e estabilidade
- ✅ Gera relatórios detalhados
- ✅ Implementa watchdog anti-travamento
- ✅ Autocorreção de problemas de build

---

## 🚀 Como Executar

### Opção 1: Script Completo (Recomendado)
```bash
./run-auto-tests.sh
```

Este script irá:
1. Verificar e instalar dependências
2. Compilar o projeto
3. Corrigir imports automaticamente
4. Iniciar o servidor de teste
5. Executar todos os testes
6. Gerar relatórios completos
7. Limpar recursos automaticamente

### Opção 2: Teste Manual
```bash
# 1. Build
npm run build
./fix-dist-imports.sh

# 2. Iniciar servidor
PORT=3333 node dist/index.js &
SERVER_PID=$!

# 3. Executar testes
BASE_URL="http://localhost:3333" npx ts-node -r tsconfig-paths/register src/tests/auto-test-runner.ts

# 4. Cleanup
kill $SERVER_PID
```

---

## 📊 Resultados da Última Execução

### Resumo Rápido
- **Total de Endpoints**: 46 rotas disponíveis
- **Testados**: 32 rotas (69.57%)
- **✅ Sucesso**: 27 rotas (84.38%)
- **❌ Falhas**: 5 rotas (15.62%)
- **⏱️ Performance**: 20.34ms média
- **🎯 Score**: 89.5% (B+)

### Status por Módulo
```
✅ Core & Configuration    100% (5/5)
✅ Agents CRUD             100% (5/5)
✅ Async Execution         100% (3/3)
⚠️  System Tools            50% (2/4 testadas)
⚠️  Condition Tools         50% (1/2 testadas)
⚠️  Automations            83% (5/6)
⚠️  Import/Export          75% (3/4)
```

---

## 📁 Arquivos de Relatório

Os relatórios são gerados em `/workspace/src/tests/results/`:

| Arquivo | Descrição |
|---------|-----------|
| `SUMMARY.txt` | Resumo executivo visual (ASCII art) |
| `RELATORIO_FINAL.md` | Relatório completo em Markdown |
| `ROTAS_COMPLETAS.md` | Tabela detalhada de todas as rotas |
| `ANALYSIS.md` | Análise técnica dos problemas |
| `test-report.json` | Dados brutos em JSON |
| `test-report.log` | Log completo da execução |
| `server.log` | Log do servidor durante testes |
| `test-execution.log` | Output dos testes em tempo real |

### Como Visualizar

```bash
# Resumo rápido
cat src/tests/results/SUMMARY.txt

# Relatório completo
cat src/tests/results/RELATORIO_FINAL.md

# Tabela de rotas
cat src/tests/results/ROTAS_COMPLETAS.md

# JSON estruturado
cat src/tests/results/test-report.json | jq
```

---

## 🔍 Problemas Identificados

### 1. 🔴 Conflito de Rotas `/api/tools`
**Endpoints Afetados**: 
- GET `/api/tools/:id` → 404
- DELETE `/api/tools/:id` → 404

**Causa**: Rotas TOR e System Tools compartilham o mesmo namespace.

**Solução Sugerida**:
```typescript
// Em src/http/routes.ts
routes.use('/api/tools/condition', conditionRoutes);
routes.use('/api/tor', torRoutes);              // Mover TOR
routes.use('/api/tools', toolsRoutes);          // Manter System Tools
```

### 2. 🔴 Validação de ConditionTool
**Endpoint**: POST `/api/tools/condition` → 400

**Ação**: Revisar schema de validação em `ConditionToolService`

### 3. 🔴 Rota Execute não encontrada
**Endpoint**: POST `/api/automations/:id/execute` → 404

**Ação**: Verificar ordem de montagem das rotas

### 4. 🔴 Import Automation falha
**Endpoint**: POST `/api/automations/import` → 400

**Ação**: Revisar lógica em `ImportExportService`

### 5. 🟡 Performance de `/api/models`
**Tempo**: 373ms (muito lento)

**Ação**: Implementar cache ou otimizar consulta

---

## 🛠️ Scripts Disponíveis

### Teste Completo
```bash
./run-auto-tests.sh
```

### Fix de Imports (após build)
```bash
./fix-dist-imports.sh
```

### Apenas Build
```bash
npm run build
```

### Testes Específicos
```bash
# Unit tests
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Todos os testes (Jest)
npm run test:all
```

---

## 📈 Métricas de Performance

### Top 5 Rotas Mais Rápidas
1. GET `/api/execution/:id/logs` - **2ms** ⚡⚡⚡
2. GET `/api/setting` - **3ms** ⚡⚡⚡
3. PATCH `/api/automations/:id` - **3ms** ⚡⚡⚡
4. DELETE `/api/automations/:id` - **3ms** ⚡⚡⚡
5. POST `/api/tools` - **4ms** ⚡⚡⚡

### Distribuição
- **< 10ms**: 71.88% das rotas ⚡
- **10-50ms**: 21.88% das rotas ✅
- **> 50ms**: 6.24% das rotas ⚠️

---

## 🎯 Próximos Passos

### Prioridade ALTA
1. [ ] Resolver conflito de rotas `/api/tools`
2. [ ] Corrigir validação de ConditionTool
3. [ ] Debugar rota execute de automações

### Prioridade MÉDIA
4. [ ] Corrigir importação de automações
5. [ ] Testar webhooks
6. [ ] Otimizar `/api/models`

### Prioridade BAIXA
7. [ ] Completar testes de TOR (upload ZIP)
8. [ ] Testar SSE streaming
9. [ ] Adicionar testes de carga (K6)

---

## 🔐 Segurança e Estabilidade

### ✅ Pontos Fortes
- Sistema não trava durante testes
- Nenhuma exceção não tratada
- Cleanup automático funciona
- Memória estável
- Sem memory leaks

### ⚠️ Áreas de Atenção
- Validações precisam refinamento
- Mensagens de erro poderiam ser mais claras
- Falta tratamento para conflitos de ID

---

## 🤝 Contribuindo

### Adicionar Novo Teste

Edite `/workspace/src/tests/auto-test-runner.ts`:

```typescript
async testMeuModulo() {
  console.log('\n🔧 Testing Meu Módulo...');
  
  // Criar recurso
  const create = await this.makeRequest('POST', '/api/meumodulo', {
    name: 'Test',
  });
  this.logResult('/api/meumodulo', 'POST', 
    create.status === 201 ? 'OK' : 'FAILED',
    create.status, create.time);
}

// Adicionar ao run()
async run() {
  // ...
  await this.testMeuModulo();
  // ...
}
```

### Melhorar Relatórios

Os relatórios são gerados em `generateReport()`. Customize conforme necessário.

---

## 📚 Documentação Adicional

- [Análise Técnica](src/tests/results/ANALYSIS.md)
- [Relatório Executivo](src/tests/results/RELATORIO_FINAL.md)
- [Mapa de Rotas](src/tests/results/ROTAS_COMPLETAS.md)

---

## 💬 Suporte

Para dúvidas ou problemas:
1. Verificar logs em `src/tests/results/`
2. Verificar console de saída do script
3. Revisar código em `src/tests/auto-test-runner.ts`

---

## 📝 Changelog

### v1.0.0 (2025-10-26)
- ✅ Sistema de teste automatizado completo
- ✅ Testes de 32 endpoints
- ✅ Geração automática de relatórios
- ✅ Watchdog anti-travamento
- ✅ Autocorreção de builds
- ✅ Performance tracking
- ✅ Relatórios em múltiplos formatos

---

**Desenvolvido com ❤️ para garantir qualidade de código**
