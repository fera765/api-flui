# ⚡ RESPOSTA RÁPIDA

## Como adicionar tool do SDK na automação?

### 🎯 Método Recomendado: TOR (Tool Onboarding Registry)

```bash
# 1. Build sua tool
npm run build

# 2. Criar ZIP com manifest.json + dist/
zip -r my-tool-1.0.0.zip manifest.json dist/

# 3. Import via API
curl -F "file=@my-tool-1.0.0.zip" \
  http://localhost:3000/api/tools/import

# Resposta: { "id": "tool-abc", "status": "active" }

# 4. Usar na automação
POST /api/automations
{
  "nodes": [
    { "type": "tool", "referenceId": "tool-abc" }
  ]
}
```

### ✅ Pronto! Tool no ar em 4 comandos.

---

## 📚 Documentação Completa

1. **`GUIA_DEFINITIVO_SDK_PARA_AUTOMACAO.md`** (12KB)
   - Resposta completa e detalhada

2. **`sdk/TOR.md`** (18KB)
   - Sistema TOR completo
   - Manifest schema
   - API reference

3. **`INTEGRATION_SDK_TO_AUTOMATION.md`** (18KB)
   - SDKToolAdapter
   - Código programático

4. **`TOR_IMPLEMENTATION.md`** (17KB)
   - Arquitetura
   - Implementação

---

## 🚀 Features Implementadas

- ✅ Feature 07: Condition Tool
- ✅ Feature 08: Import/Export
- ✅ Feature 09: SDK Universal
- ✅ Feature 09+: TOR (Tool Registry)
- ✅ Integração SDK → Automação

**Total: 661 testes passando**

---

Consulte `GUIA_DEFINITIVO_SDK_PARA_AUTOMACAO.md` para detalhes completos.
