#!/bin/bash
# Script rápido para visualizar resultados dos últimos testes

echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                   📊 RESULTADOS DOS ÚLTIMOS TESTES                          ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo ""

if [ -f "src/tests/results/SUMMARY.txt" ]; then
    cat src/tests/results/SUMMARY.txt
else
    echo "❌ Nenhum teste foi executado ainda."
    echo "   Execute: ./run-auto-tests.sh"
    exit 1
fi

echo ""
echo "📂 Relatórios disponíveis:"
echo "   • src/tests/results/RELATORIO_FINAL.md"
echo "   • src/tests/results/ROTAS_COMPLETAS.md"
echo "   • src/tests/results/ANALYSIS.md"
echo ""
echo "Para ver o relatório completo:"
echo "   cat src/tests/results/RELATORIO_FINAL.md"
