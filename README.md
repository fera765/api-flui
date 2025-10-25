# API Backend - Node.js + TypeScript

Backend desenvolvido com Clean Architecture, DDD e princípios SOLID seguindo os padrões Rocketseat.

## 📋 Sobre o Projeto

Este é um backend estruturado para escalabilidade, utilizando as melhores práticas de desenvolvimento:

- **Clean Architecture**: Separação clara de responsabilidades em camadas
- **DDD (Domain-Driven Design)**: Organização por domínios de negócio
- **SOLID**: Princípios de design orientado a objetos
- **TDD (Test-Driven Development)**: 100% de cobertura de testes

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **TypeScript** - Tipagem estática
- **Express** - Framework web
- **Jest** - Framework de testes
- **Supertest** - Testes de integração HTTP

## 📁 Estrutura do Projeto

```
/api-backend
 ├─ /src
 │   ├─ /config              # Configurações da aplicação
 │   ├─ /shared              # Código compartilhado
 │   │   ├─ /errors          # Tratamento de erros
 │   │   └─ /utils           # Utilitários
 │   ├─ /modules             # Módulos da aplicação
 │   │   └─ /core            # Módulo principal
 │   │        ├─ /controllers
 │   │        ├─ /services
 │   │        ├─ /domain
 │   │        └─ routes.ts
 │   ├─ /http                # Configurações HTTP
 │   ├─ /infra               # Infraestrutura
 │   ├─ /tests               # Testes
 │   │   ├─ /unit
 │   │   └─ /integration
 │   └─ index.ts
 ├─ .env
 ├─ jest.config.ts
 ├─ package.json
 └─ tsconfig.json
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install
```

## ⚙️ Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
PORT=3000
NODE_ENV=development
```

## 🏃 Execução

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Produção
npm start
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com watch
npm run test:watch

# Cobertura de testes
npm run test:coverage
```

### Cobertura Atual

✅ **100%** de cobertura em:
- Statements
- Branches
- Functions
- Lines

## 📡 Rotas da API

### Health Check

**GET /** - Verifica se a API está funcionando

**Response:**
```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 Princípios Aplicados

### Clean Architecture
- Independência de frameworks
- Testabilidade
- Independência de UI
- Independência de banco de dados

### SOLID
- **S**ingle Responsibility Principle
- **O**pen/Closed Principle
- **L**iskov Substitution Principle
- **I**nterface Segregation Principle
- **D**ependency Inversion Principle

### DDD
- Organização por domínios
- Camadas bem definidas
- Linguagem ubíqua
- Entidades de domínio

## 🔄 Ciclo TDD

Todo código foi desenvolvido seguindo o ciclo:

1. **Red** - Escrever teste que falha
2. **Green** - Implementar código mínimo para passar
3. **Refactor** - Melhorar o código mantendo testes verdes

## 📝 Próximos Passos

- Adicionar autenticação JWT
- Integrar banco de dados (PostgreSQL/MongoDB)
- Implementar módulos de usuários
- Adicionar validação com Zod/Yup
- Implementar cache com Redis
- Adicionar documentação Swagger

## 📄 Licença

MIT

---

**Status do Projeto:** ✅ Estrutura base completa e testada