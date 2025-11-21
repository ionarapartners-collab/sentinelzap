# 🔥 Como Testar o Aquecimento Manualmente

Este documento explica como testar o sistema de aquecimento **SEM reiniciar o servidor** e **SEM perder as conexões dos chips**.

---

## 📋 Pré-requisitos

1. ✅ Servidor rodando (`pnpm dev`)
2. ✅ Pelo menos 1 chip conectado
3. ✅ Chips com `warmupStatus = "in_progress"`

---

## 🚀 Método 1: Script de Teste (RECOMENDADO)

Abra um **novo terminal** e execute:

```bash
cd /home/ubuntu/SentinelZap
npx tsx test-warmup-manual.mjs
```

**O que o script faz:**
- ✅ Lista todos os chips em aquecimento
- ✅ Chama a API de warmup via HTTP
- ✅ Mostra resultado (sucesso/falha)
- ✅ **NÃO reinicia o servidor!**

---

## 🌐 Método 2: Interface Web (quando funcionar)

1. Acesse: `https://3000-xxx.manusvm.computer/dashboard/warmup`
2. Clique em **"Enviar Aquecimento Agora"**
3. Aguarde confirmação

**Nota:** Este botão só aparece quando a página carrega corretamente!

---

## 🔍 Verificar se Aquecimento Funcionou

### Opção A: Verificar no WhatsApp
- Abra o WhatsApp dos chips
- Veja se mensagens foram enviadas

### Opção B: Verificar no Banco de Dados
```bash
cd /home/ubuntu/SentinelZap
npx tsx -e "
import { drizzle } from 'drizzle-orm/mysql2';
import { warmupHistory } from './drizzle/schema.ts';
import { desc } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
const history = await db.select().from(warmupHistory).orderBy(desc(warmupHistory.sentAt)).limit(10);

console.log('📊 Últimas 10 mensagens de aquecimento:');
for (const msg of history) {
  console.log(\`  \${msg.sentAt} - Chip \${msg.chipId} → \${msg.recipientNumber}\`);
}
"
```

---

## ⏰ Aquecimento Automático

O scheduler envia mensagens automaticamente a cada 3 horas:
- 00:00 (meia-noite)
- 03:00
- 06:00
- 09:00
- 12:00
- 15:00
- 18:00
- 21:00

**Próximo envio automático:** Verifique os logs do servidor

---

## 🐛 Troubleshooting

### Problema: "No chips in warmup"
**Solução:** Chips precisam ter `warmupStatus = "in_progress"`. Execute:
```bash
cd /home/ubuntu/SentinelZap
npx tsx -e "
import { drizzle } from 'drizzle-orm/mysql2';
import { chips } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

const db = drizzle(process.env.DATABASE_URL);
await db.update(chips).set({ warmupStatus: 'in_progress' }).where(eq(chips.isConnected, true));
console.log('✅ Todos os chips conectados agora estão em warmup!');
"
```

### Problema: "UNAUTHORIZED"
**Solução:** Use o Método 2 (Interface Web) que tem autenticação automática

### Problema: Chips desconectam após teste
**Solução:** Isso NÃO deveria acontecer! Se acontecer, me avise imediatamente!

---

## 📝 Notas Importantes

- ⚠️ **NÃO reinicie o servidor** enquanto os chips estiverem conectados
- ⚠️ **NÃO execute `pnpm dev` novamente** - isso reinicia tudo
- ✅ O script de teste é **SEGURO** e não afeta as conexões existentes
- ✅ Você pode executar o script **quantas vezes quiser**

---

## 🆘 Precisa de Ajuda?

Se algo der errado, me chame no chat! 💬
