#!/bin/bash

# Script para corrigir imports no código compilado
# Substitui @alias/path por caminhos relativos corretos

echo "🔧 Fixing compiled imports..."

cd dist

# Função para calcular o caminho relativo
fix_imports() {
    local file=$1
    local dir=$(dirname "$file")
    
    # Calcular profundidade do arquivo
    local depth=$(echo "$dir" | tr -cd '/' | wc -c)
    local back_path="./"
    for ((i=0; i<depth; i++)); do
        back_path="../$back_path"
    done
    
    # Substituir imports
    sed -i "s|@config/|${back_path}config/|g" "$file"
    sed -i "s|@shared/|${back_path}shared/|g" "$file"
    sed -i "s|@modules/|${back_path}modules/|g" "$file"
    sed -i "s|@http/|${back_path}http/|g" "$file"
    sed -i "s|@infra/|${back_path}infra/|g" "$file"
}

# Processar todos os arquivos .js
find . -name "*.js" -type f | while read file; do
    if grep -q "@config\|@shared\|@modules\|@http\|@infra" "$file"; then
        echo "  Fixing: $file"
        fix_imports "$file"
    fi
done

echo "✅ Import fix complete!"
