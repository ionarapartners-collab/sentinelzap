#!/bin/bash

# 🚀 Script de Deploy para Vercel - SentinelZap
# Criado por: Manus AI
# Para: Ionara

echo "🚀 Iniciando processo de deploy para Vercel..."
echo ""

# Verificar se estamos no diretório correto
if [ ! -f "vercel.json" ]; then
    echo "❌ Erro: vercel.json não encontrado!"
    echo "Execute este script na raiz do projeto SentinelZap"
    exit 1
fi

echo "✅ Arquivos de configuração encontrados:"
echo "   - vercel.json"
echo "   - .vercelignore"
echo "   - VERCEL_DEPLOY_GUIDE.md"
echo ""

# Adicionar arquivos ao git
echo "📦 Adicionando arquivos ao Git..."
git add vercel.json .vercelignore VERCEL_DEPLOY_GUIDE.md deploy-to-vercel.sh

# Verificar status
echo ""
echo "📋 Status do Git:"
git status --short

echo ""
echo "💾 Fazendo commit..."
git commit -m "feat: adicionar configuração do Vercel para deploy

- Adicionar vercel.json com configuração otimizada
- Adicionar .vercelignore para otimizar tamanho do deploy
- Adicionar guia completo de deploy (VERCEL_DEPLOY_GUIDE.md)
- Configurar rotas SPA corretamente
- Adicionar cache e security headers
- Output directory configurado para dist/public

Resolves: Erro 404 no Vercel
"

echo ""
echo "🚀 Fazendo push para o GitHub..."
git push origin main

echo ""
echo "✅ DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo ""
echo "1. Acesse: https://vercel.com/dashboard"
echo "2. O deploy automático deve iniciar em alguns segundos"
echo "3. Configure as variáveis de ambiente (se ainda não configurou):"
echo "   - NODE_ENV=production"
echo "   - VITE_API_URL=https://seu-backend.railway.app"
echo "   - DATABASE_URL=postgresql://..."
echo ""
echo "4. Aguarde o build completar (2-3 minutos)"
echo "5. Acesse a URL do projeto!"
echo ""
echo "📚 Para mais detalhes, leia: VERCEL_DEPLOY_GUIDE.md"
echo ""
echo "🎉 PARABÉNS IONARA! Você conseguiu! 💪🚀"
