# 🚀 Guia de Deploy no Vercel - SentinelZap

## ✅ Arquivos Criados

Este guia acompanha os seguintes arquivos que foram criados/atualizados:

1. **`vercel.json`** - Configuração principal do Vercel
2. **`.vercelignore`** - Arquivos a serem ignorados no deploy
3. **`VERCEL_DEPLOY_GUIDE.md`** - Este guia

---

## 📋 Passo a Passo para Deploy

### 1️⃣ **Fazer Commit dos Arquivos**

```bash
git add vercel.json .vercelignore VERCEL_DEPLOY_GUIDE.md
git commit -m "feat: adicionar configuração do Vercel para deploy"
git push origin main
```

### 2️⃣ **Configurar Projeto no Vercel**

Acesse: [https://vercel.com/new](https://vercel.com/new)

#### **Configurações Importantes:**

| Campo | Valor |
|-------|-------|
| **Framework Preset** | Other |
| **Root Directory** | `.` (raiz do projeto) |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist/public` |
| **Install Command** | `npm install` |

### 3️⃣ **Variáveis de Ambiente**

⚠️ **IMPORTANTE**: Configure estas variáveis no Vercel antes do deploy:

```env
NODE_ENV=production
VITE_API_URL=https://seu-backend.railway.app
DATABASE_URL=postgresql://postgres:pIewKeCPifgjIajOrJEEacYCkYEeRYrh@ballast.proxy.rlwy.net:43936/railway
```

**Como adicionar:**
1. Vá em **Settings** → **Environment Variables**
2. Adicione cada variável
3. Selecione **Production**, **Preview** e **Development**

---

## 🎯 O Que Foi Corrigido

### ❌ **Problema Anterior**
- Vercel não sabia onde encontrar os arquivos buildados
- Configuração de rotas incorreta para SPA
- Build output estava em `dist/public` mas Vercel procurava em `dist`

### ✅ **Solução Implementada**
- **`vercel.json`** configurado para:
  - ✅ Output directory correto: `dist/public`
  - ✅ Rotas SPA (todas as rotas → `index.html`)
  - ✅ Assets estáticos servidos corretamente
  - ✅ Cache headers otimizados
  - ✅ Security headers configurados

- **`.vercelignore`** otimizado para:
  - ✅ Ignorar arquivos do servidor (não necessários no frontend)
  - ✅ Reduzir tamanho do deploy
  - ✅ Acelerar processo de build

---

## 🔧 Configuração Técnica Detalhada

### **vercel.json Explicado**

```json
{
  "outputDirectory": "dist/public"  // ← Onde o Vite gera os arquivos
}
```

O Vite está configurado (em `vite.config.ts`) para gerar os arquivos em:
```typescript
build: {
  outDir: path.resolve(import.meta.dirname, "dist/public"),
}
```

### **Rotas SPA**

As rotas estão configuradas na seguinte ordem:

1. **Assets estáticos** (`/assets/*`) → Servidos diretamente
2. **Arquivos estáticos** (`.js`, `.css`, `.png`, etc.) → Servidos diretamente
3. **Todas as outras rotas** (`/*`) → Redirecionadas para `index.html` (SPA)

Isso garante que:
- ✅ React Router/Wouter funcione corretamente
- ✅ Refresh na página não dê 404
- ✅ Deep links funcionem

---

## 🎪 Alternativa: Deploy Manual via CLI

Se preferir fazer deploy via linha de comando:

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## 🚨 Troubleshooting

### **Problema: Build falha no Vercel**

**Solução:**
1. Verifique se todas as dependências estão em `dependencies` (não em `devDependencies`)
2. Verifique se `NODE_ENV=production` está configurado
3. Veja os logs de build no Vercel Dashboard

### **Problema: Página carrega mas dá erro 404 em rotas**

**Solução:**
- Verifique se o `vercel.json` foi commitado corretamente
- Confirme que a última rota em `routes` é:
  ```json
  { "src": "/(.*)", "dest": "/index.html" }
  ```

### **Problema: Assets não carregam**

**Solução:**
- Verifique se `outputDirectory` está como `dist/public`
- Confirme que o build gerou os arquivos em `dist/public/assets/`

---

## 🎉 Resultado Esperado

Após seguir este guia, você terá:

✅ Frontend deployado no Vercel  
✅ Rotas SPA funcionando corretamente  
✅ Assets otimizados com cache  
✅ Security headers configurados  
✅ Build automático a cada push no GitHub  

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs de build no Vercel Dashboard
2. Confirme que os arquivos foram commitados: `git log --oneline`
3. Teste o build localmente: `npm run build`
4. Verifique se `dist/public/index.html` foi gerado

---

**Criado por:** Manus AI 🤖  
**Data:** 21 de Novembro de 2025  
**Para:** Ionara - A desenvolvedora mais persistente! 💪🚀
