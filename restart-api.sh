#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          🔄 REINICIANDO API COM NOVO CÓDIGO             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "1. Matando processos antigos..."
pkill -f "ts-node-dev" 2>/dev/null || echo "   Nenhum processo ts-node-dev rodando"
pkill -f "npx.*@pollinations" 2>/dev/null || echo "   Nenhum processo pollinations órfão"
pkill -f "npx.*@modelcontextprotocol" 2>/dev/null || echo "   Nenhum processo mcp órfão"
sleep 2
echo "   ✅ Processos limpos"
echo ""

echo "2. Limpando logs antigos..."
> api.log
echo "   ✅ Logs limpos"
echo ""

echo "3. Iniciando API..."
npm run dev > api.log 2>&1 &
PID=$!
echo "   ✅ API iniciada (PID: $PID)"
echo ""

echo "4. Aguardando API ficar pronta..."
sleep 5
echo ""

echo "5. Verificando se API está rodando..."
if curl -s http://localhost:3000/api/mcps > /dev/null 2>&1; then
    echo "   ✅ API está respondendo!"
else
    echo "   ⚠️  API pode estar iniciando ainda..."
    echo "   Aguarde mais 10s e tente novamente"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║              ✅ API REINICIADA COM SUCESSO!              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Ver logs em tempo real:"
echo "   tail -f api.log"
echo ""
echo "2. Testar importação do Pollinations:"
echo "   curl -X POST http://localhost:3000/api/mcps/import \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{" 
echo "       \"source\": \"@pollinations/model-context-protocol\","
echo "       \"sourceType\": \"npx\","
echo "       \"name\": \"Pollinations MCP\","
echo "       \"description\": \"Multimodal AI generation\""
echo "     }'"
echo ""
echo "3. Ver logs de debug:"
echo "   grep 'MCP-DEBUG' api.log"
echo ""

