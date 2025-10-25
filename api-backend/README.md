# API Backend - Node.js + TypeScript

Backend API desenvolvido seguindo os padrões Rocketseat, aplicando Clean Architecture, DDD e princípios SOLID.

## 🏗️ Arquitetura

O projeto segue uma arquitetura modular e escalável com separação clara de responsabilidades:

```
/api-backend
 ├─ /src
 │   ├─ /config          # Configurações da aplicação
 │   ├─ /shared          # Código compartilhado (erros, utils)
 │   ├─ /modules         # Módulos de negócio
 │   │   └─ /core        # Módulo principal (health check)
 │   ├─ /http            # Camada HTTP (rotas, middlewares)
 │   ├─ /infra           # Infraestrutura (futuras implementações)
 │   ├─ /tests           # Testes unitários e de integração
 │   └─ index.ts         # Ponto de entrada da aplicação
```

## 🚀 Funcionalidades

- **Rota Principal**: `GET /` - Confirma que a API está funcionando
- **Health Check**: `GET /api/health` - Endpoint de verificação de saúde
- **Arquitetura Limpa**: Separação clara entre domínio, aplicação e infraestrutura
- **TDD**: Desenvolvimento orientado a testes com 100% de cobertura
- **TypeScript**: Tipagem estática completa
- **Armazenamento em Memória**: Pronto para futura integração com banco de dados

## 🛠️ Tecnologias

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **Jest** - Framework de testes
- **CORS** + **Helmet** - Segurança
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Executar testes
npm test

# Executar testes com cobertura
npm run test:coverage

# Build para produção
npm run build

# Executar em produção
npm start
```

## 🧪 Testes

O projeto possui **34 testes** com cobertura de:
- **Statements**: 100%
- **Branches**: 96.55%
- **Functions**: 100%
- **Lines**: 100%

### Estrutura de Testes

- **Unitários**: Testam componentes isoladamente
- **Integração**: Testam fluxos completos
- **TDD**: Todos os códigos de produção foram escritos após os testes

## 🏛️ Padrões Aplicados

### Clean Architecture
- **Domain**: Entidades e regras de negócio
- **Application**: Casos de uso e serviços
- **Infrastructure**: Implementações concretas
- **Presentation**: Controllers e rotas HTTP

### DDD (Domain-Driven Design)
- **Agregados**: HealthStatus como entidade de domínio
- **Repositórios**: Abstração para persistência
- **Serviços**: Lógica de aplicação

### SOLID
- **S** - Single Responsibility: Cada classe tem uma responsabilidade
- **O** - Open/Closed: Aberto para extensão, fechado para modificação
- **L** - Liskov Substitution: Interfaces bem definidas
- **I** - Interface Segregation: Interfaces específicas
- **D** - Dependency Inversion: Dependências injetadas

## 🔧 Configuração

### Variáveis de Ambiente

```env
NODE_ENV=development
PORT=3333
API_NAME=API Backend
API_VERSION=1.0.0
```

### Banco de Dados

Atualmente utiliza armazenamento em memória, mas a estrutura está preparada para integração com:
- PostgreSQL
- MySQL
- MongoDB
- Outros bancos de dados

## 📡 Endpoints

### GET /
Retorna informações sobre o status da API.

**Resposta:**
```json
{
  "message": "API is running",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/health
Endpoint alternativo para verificação de saúde.

**Resposta:** Mesma estrutura do endpoint principal.

## 🚀 Próximos Passos

A estrutura está preparada para expansão futura:

1. **Novos Módulos**: Adicionar módulos de negócio específicos
2. **Banco de Dados**: Integrar com banco real
3. **Autenticação**: Implementar JWT ou OAuth
4. **Validação**: Adicionar validação de dados
5. **Logging**: Sistema de logs estruturado
6. **Documentação**: Swagger/OpenAPI

## 📊 Status do Projeto

✅ **Estrutura de pastas criada**  
✅ **Configurações base implementadas**  
✅ **Sistema de erros compartilhado**  
✅ **Módulo core com TDD**  
✅ **Rota principal funcionando**  
✅ **Middlewares configurados**  
✅ **Testes com 100% de cobertura**  
✅ **Build funcionando**  

## 🎯 Objetivos Alcançados

- [x] Estrutura modular e escalável
- [x] Clean Architecture aplicada
- [x] DDD implementado
- [x] Princípios SOLID seguidos
- [x] TDD com 100% de cobertura
- [x] TypeScript totalmente tipado
- [x] Padrões Rocketseat aplicados
- [x] Pronto para expansão futura

---

**Desenvolvido seguindo os padrões Rocketseat** 🚀