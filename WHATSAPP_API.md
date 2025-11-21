# WhatsApp API - SentinelZap

## Visão Geral

O SentinelZap utiliza o **WPPConnect** para gerenciar múltiplas sessões de WhatsApp simultaneamente. Cada chip representa uma sessão independente que pode enviar e receber mensagens.

## Arquitetura

```
Cliente (Frontend)
    ↓
tRPC API (Backend)
    ↓
Módulo de Rotação (rotation.ts)
    ↓
Módulo WhatsApp (whatsapp.ts)
    ↓
WPPConnect Library
    ↓
WhatsApp Web
```

## Fluxo de Autenticação

1. **Criar Chip**: O usuário cria um novo chip via `trpc.chips.create`
2. **Inicializar Sessão**: Chama `trpc.whatsapp.initSession` com o chipId
3. **Obter QR Code**: Busca o QR code via `trpc.whatsapp.getQRCode`
4. **Escanear QR Code**: Usuário escaneia o QR code no WhatsApp do celular
5. **Conexão Estabelecida**: Sistema atualiza automaticamente o status do chip para "active"

## Rotas Disponíveis

### 1. Gerenciamento de Chips

#### `trpc.chips.create`
Cria um novo chip.

```typescript
const chip = await trpc.chips.create.mutate({
  name: "Chip Marketing",
  phoneNumber: "5511999999999",
  sessionId: "marketing-session-1",
  dailyLimit: 100,
  totalLimit: 1000,
});
```

#### `trpc.chips.list`
Lista todos os chips do usuário.

```typescript
const chips = await trpc.chips.list.useQuery();
```

### 2. Gerenciamento de Sessões WhatsApp

#### `trpc.whatsapp.initSession`
Inicializa uma sessão WhatsApp para um chip.

```typescript
const result = await trpc.whatsapp.initSession.mutate({
  chipId: 1,
});

if (result.success) {
  console.log("Sessão inicializada!");
  console.log("QR Code:", result.qrCode);
}
```

#### `trpc.whatsapp.getQRCode`
Obtém o QR code de autenticação.

```typescript
const { qrCode } = await trpc.whatsapp.getQRCode.useQuery({
  chipId: 1,
});
```

#### `trpc.whatsapp.checkConnection`
Verifica se a sessão está conectada.

```typescript
const { isConnected } = await trpc.whatsapp.checkConnection.useQuery({
  chipId: 1,
});
```

#### `trpc.whatsapp.logout`
Desconecta uma sessão.

```typescript
await trpc.whatsapp.logout.mutate({
  chipId: 1,
});
```

### 3. Envio de Mensagens com Rodízio

#### `trpc.rotation.sendMessage`
Envia uma mensagem usando o sistema de rodízio inteligente.

```typescript
const result = await trpc.rotation.sendMessage.mutate({
  recipientNumber: "5511988888888",
  recipientName: "João Silva",
  messageContent: "Olá! Esta é uma mensagem de teste.",
  messageType: "text",
});

if (result.success) {
  console.log("Mensagem enviada via:", result.chipUsed.name);
  console.log("Motivo da seleção:", result.reason);
}
```

#### `trpc.rotation.selectChip`
Seleciona o melhor chip para envio (sem enviar mensagem).

```typescript
const { chip, reason } = await trpc.rotation.selectChip.useQuery();

if (chip) {
  console.log("Chip selecionado:", chip.name);
  console.log("Motivo:", reason);
} else {
  console.log("Nenhum chip disponível:", reason);
}
```

#### `trpc.rotation.getStatus`
Obtém status completo do sistema de rodízio.

```typescript
const status = await trpc.rotation.getStatus.useQuery();

console.log("Total de chips:", status.summary.total);
console.log("Chips ativos:", status.summary.active);
console.log("Chips pausados:", status.summary.paused);

status.chips.forEach(chip => {
  console.log(`${chip.name}: Risco ${chip.currentRiskScore}/100`);
});
```

### 4. Histórico e Conversas (CRM)

#### `trpc.messages.list`
Lista histórico de mensagens enviadas.

```typescript
const messages = await trpc.messages.list.useQuery({
  limit: 50,
});
```

#### `trpc.conversations.list`
Lista todas as conversas recebidas.

```typescript
const conversations = await trpc.conversations.list.useQuery({
  limit: 100,
});
```

#### `trpc.conversations.byContact`
Lista conversas com um contato específico.

```typescript
const conversation = await trpc.conversations.byContact.useQuery({
  contactNumber: "5511988888888",
  limit: 50,
});
```

## Sistema de Termostato

O Termostato calcula automaticamente a pontuação de risco (0-100) de cada chip baseado em:

1. **Uso Diário** (0-40 pontos): Percentual do limite diário usado
2. **Uso Total** (0-30 pontos): Percentual do limite total usado
3. **Atividade Recente** (0-20 pontos): Mensagens enviadas nos últimos minutos
4. **Status de Conexão** (0-10 pontos): Se o chip está desconectado

### Pausa Automática

O sistema pausa automaticamente um chip quando:
- Pontuação de risco ≥ 80
- Limite diário atingido
- Limite total atingido
- Chip desconectado

## Webhooks

O sistema registra automaticamente todas as mensagens recebidas no banco de dados através de webhooks. Não é necessário configuração adicional.

### Processamento de Mensagens Recebidas

Quando uma mensagem é recebida:
1. O webhook captura a mensagem
2. Extrai informações do contato e conteúdo
3. Salva na tabela `conversations`
4. Fica disponível para visualização no CRM

## Boas Práticas

1. **Sempre inicialize as sessões** após criar um chip
2. **Monitore a pontuação de risco** regularmente via `rotation.getStatus`
3. **Use o rodízio automático** (`rotation.sendMessage`) ao invés de enviar diretamente por um chip específico
4. **Configure limites realistas** para evitar bloqueios (recomendado: 100 msg/dia, 1000 msg/total)
5. **Resete os contadores diários** à meia-noite via `rotation.resetDailyCounters`

## Limitações Conhecidas

- O WPPConnect é uma solução **não-oficial** e está sujeita a mudanças do WhatsApp
- Risco de bloqueio existe mesmo com o Termostato (use com responsabilidade)
- Apenas mensagens de texto são totalmente suportadas no momento
- Mídia (imagens, vídeos) requer implementação adicional

## Próximos Passos

- Implementar suporte a envio de mídia
- Adicionar agendamento de mensagens
- Criar sistema de templates de mensagens
- Implementar relatórios avançados de uso
