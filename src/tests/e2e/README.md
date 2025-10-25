# End-to-End (E2E) Tests

Este diretório contém os testes end-to-end para validar toda a API do sistema.

## 📋 Estrutura dos Testes

### `api-complete-flow.test.ts`
Testa o fluxo completo da API em cenários realistas:
- ✅ Health check e configuração do sistema
- ✅ Criação e gerenciamento de agentes
- ✅ Criação e gerenciamento de ferramentas (tools)
- ✅ Importação de MCPs (Model Context Protocol)
- ✅ Criação de automações com diferentes tipos de triggers
- ✅ Execução e monitoramento de automações
- ✅ Workflows de colaboração entre múltiplos agentes
- ✅ Streaming de eventos em tempo real
- ✅ Gerenciamento de configurações

**Cenários cobertos:**
1. **Scenario 1**: Fluxo completo de usuário (setup até execução)
2. **Scenario 2**: Colaboração entre múltiplos agentes
3. **Scenario 3**: Streaming de eventos em tempo real
4. **Scenario 4**: Gerenciamento de configurações

### `api-error-scenarios.test.ts`
Testa cenários de erro, validação e casos extremos:
- ❌ Validação de entrada inválida
- ❌ Recursos não encontrados
- ❌ Conflitos de dados
- ❌ Requisições malformadas
- ❌ Condições de limite
- ❌ Dependências entre recursos
- ⚡ Testes de performance e carga

**Áreas testadas:**
- API de Agentes (erros de criação, atualização, deleção)
- API de Tools (configuração inválida, execução com erros)
- API de Automações (triggers inválidos, ações inválidas)
- API de Execução (automações não existentes, concorrência)
- API de MCPs (importação inválida)
- Configuração do Sistema (validações)
- Edge cases e condições de limite

### `api-security-validation.test.ts`
Testa aspectos de segurança e validação de dados:
- 🔒 Sanitização de entrada (XSS, SQL Injection, Command Injection)
- 🔒 Validação de Content-Type
- 🔒 Restrições de métodos HTTP
- 🔒 Integridade de dados
- 🔒 Mensagens de erro seguras
- 🔒 Limites de tamanho de requisição
- 🔒 Condições de corrida
- 🔒 Estabilidade da API

**Testes de segurança:**
- Tentativas de XSS em nomes e descrições
- Tentativas de SQL injection
- Tentativas de command injection
- Path traversal attempts
- Validação de tipos de dados
- Limites de tamanho de payload
- Operações simultâneas

## 🚀 Como Executar

### Executar todos os testes E2E
```bash
npm run test:e2e
```

### Executar testes E2E em modo watch
```bash
npm run test:e2e:watch
```

### Executar todos os testes (unit + integration + e2e)
```bash
npm test
```

### Executar com coverage
```bash
npm run test:coverage
```

## 📊 Cobertura de Testes

Os testes E2E cobrem:

### Endpoints testados:
- ✅ `GET /` - Health check
- ✅ `GET/POST/PATCH /api/setting` - Configuração do sistema
- ✅ `GET /api/models` - Modelos disponíveis
- ✅ `GET/POST/PATCH/DELETE /api/agents` - Gerenciamento de agentes
- ✅ `GET/POST/DELETE /api/tools` - Gerenciamento de ferramentas
- ✅ `POST /api/tools/:id/execute` - Execução de ferramentas
- ✅ `GET/POST /api/webhooks/:toolId` - Webhooks
- ✅ `GET/POST/PATCH/DELETE /api/automations` - Gerenciamento de automações
- ✅ `POST /api/automations/:id/execute` - Execução de automações
- ✅ `GET/POST /api/mcps` - Gerenciamento de MCPs
- ✅ `GET /api/mcps/:id/tools` - Ferramentas de MCP
- ✅ `POST/GET /api/execution/:id/*` - Controle de execução

### Cenários de uso:
1. ✅ Fluxo completo de setup e configuração
2. ✅ Criação e gerenciamento de recursos
3. ✅ Execução de automações simples e complexas
4. ✅ Workflows multi-agente
5. ✅ Tratamento de erros e validações
6. ✅ Segurança e sanitização
7. ✅ Integridade de dados
8. ✅ Performance sob carga
9. ✅ Operações concorrentes
10. ✅ Lifecycle completo (CRUD)

## 🔍 Estrutura dos Testes

Cada arquivo de teste segue o padrão:
```typescript
describe('E2E - Nome do Teste', () => {
  beforeEach(() => {
    // Limpeza dos repositórios
  });

  describe('Categoria de Teste', () => {
    it('should comportamento esperado', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 📝 Boas Práticas

1. **Isolamento**: Cada teste limpa os repositórios antes de executar
2. **Independência**: Testes não dependem uns dos outros
3. **Clareza**: Nomes descritivos e comentários explicativos
4. **Abrangência**: Cobertura de casos de sucesso e erro
5. **Realismo**: Simulam fluxos reais de usuários
6. **Performance**: Usam operações paralelas quando possível

## 🐛 Debugging

Para debugar um teste específico:
```bash
npm test -- api-complete-flow.test.ts
```

Para executar apenas um cenário:
```typescript
describe.only('Scenario 1', () => { ... });
// ou
it.only('should do something', () => { ... });
```

## 📈 Métricas

Os testes E2E validam:
- ✅ 17+ endpoints diferentes
- ✅ 100+ casos de teste
- ✅ 4 workflows completos
- ✅ 50+ cenários de erro
- ✅ 30+ testes de segurança
- ✅ Operações de CRUD completas
- ✅ Integrações entre módulos

## 🔄 Manutenção

Ao adicionar novos endpoints ou funcionalidades:
1. Adicione testes de fluxo completo em `api-complete-flow.test.ts`
2. Adicione testes de erro em `api-error-scenarios.test.ts`
3. Adicione testes de segurança em `api-security-validation.test.ts`
4. Atualize esta documentação

## 📚 Recursos

- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
