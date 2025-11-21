# SentinelZap REST API - Documentação para Integração com Make.com

## 📋 Visão Geral

A API REST do SentinelZap permite integrar o sistema de rodízio de chips com ferramentas de automação como Make.com, Zapier, n8n e outras plataformas.

**Base URL**: `https://seu-dominio.com/api/v1`

---

## 🔐 Autenticação

Todas as requisições (exceto `/health`) requerem autenticação via API Key.

### Obtendo uma API Key

1. Acesse o dashboard do SentinelZap
2. Vá em "API Keys (Make)"
3. Clique em "Criar Nova API Key"
4. Copie a key gerada (ela só será exibida uma vez!)

### Como Usar

Adicione o header `X-API-Key` em todas as requisições:

```
X-API-Key: sk_sua_api_key_aqui
```

---

## 📡 Endpoints Disponíveis

### 1. Health Check

Verifica se a API está funcionando.

**Endpoint**: `GET /api/v1/health`

**Autenticação**: Não requerida

**Resposta**:
```json
{
  "success": true,
  "service": "SentinelZap API",
  "version": "1.0.0",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. Enviar Mensagem (com Rodízio Automático)

Envia uma mensagem via WhatsApp usando o rodízio inteligente de chips.

**Endpoint**: `POST /api/v1/messages/send`

**Autenticação**: Requerida

**Body (JSON)**:
```json
{
  "phoneNumber": "5511999999999",
  "message": "Olá! Esta é uma mensagem personalizada gerada pela IA.",
  "chipId": 1  // Opcional: força uso de um chip específico
}
```

**Parâmetros**:
- `phoneNumber` (string, obrigatório): Número do destinatário no formato internacional (ex: 5511999999999)
- `message` (string, obrigatório): Conteúdo da mensagem
- `chipId` (number, opcional): ID do chip a ser usado. Se omitido, o sistema seleciona automaticamente o chip com menor risco

**Resposta de Sucesso** (200):
```json
{
  "success": true,
  "data": {
    "chipId": 1,
    "chipName": "Chip Principal",
    "phoneNumber": "5511988888888",
    "recipientNumber": "5511999999999",
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Resposta de Erro** (400/500):
```json
{
  "success": false,
  "error": "No active chips available"
}
```

---

### 3. Consultar Status do Sistema

Retorna o status de todos os chips e estatísticas gerais.

**Endpoint**: `GET /api/v1/status`

**Autenticação**: Requerida

**Resposta** (200):
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 3,
      "active": 2,
      "paused": 1,
      "offline": 0
    },
    "chips": [
      {
        "id": 1,
        "name": "Chip Principal",
        "phoneNumber": "5511988888888",
        "status": "active",
        "isConnected": true,
        "messagesSentToday": 45,
        "messagesSentTotal": 320,
        "dailyLimit": 100,
        "totalLimit": 1000,
        "riskScore": 35,
        "lastMessageAt": "2024-01-15T10:25:00.000Z"
      }
    ]
  }
}
```

---

### 4. Listar Chips

Lista todos os chips cadastrados.

**Endpoint**: `GET /api/v1/chips`

**Autenticação**: Requerida

**Resposta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Chip Principal",
      "phoneNumber": "5511988888888",
      "status": "active",
      "isConnected": true,
      "messagesSentToday": 45,
      "messagesSentTotal": 320,
      "dailyLimit": 100,
      "totalLimit": 1000,
      "riskScore": 35
    }
  ]
}
```

---

### 5. Obter Chip Específico

Retorna detalhes de um chip específico.

**Endpoint**: `GET /api/v1/chips/:chipId`

**Autenticação**: Requerida

**Parâmetros de URL**:
- `chipId` (number): ID do chip

**Resposta** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chip Principal",
    "phoneNumber": "5511988888888",
    "status": "active",
    "isConnected": true,
    "messagesSentToday": 45,
    "messagesSentTotal": 320,
    "dailyLimit": 100,
    "totalLimit": 1000,
    "riskScore": 35,
    "lastMessageAt": "2024-01-15T10:25:00.000Z"
  }
}
```

---

### 6. Criar Chip

Cria um novo chip no sistema.

**Endpoint**: `POST /api/v1/chips`

**Autenticação**: Requerida

**Body (JSON)**:
```json
{
  "name": "Chip Secundário",
  "phoneNumber": "5511977777777",
  "sessionId": "chip-secondary-001",
  "dailyLimit": 100,
  "totalLimit": 1000
}
```

**Resposta** (201):
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Chip Secundário",
    "phoneNumber": "5511977777777",
    "sessionId": "chip-secondary-001",
    "status": "offline",
    "isConnected": false,
    "dailyLimit": 100,
    "totalLimit": 1000
  }
}
```

---

### 7. Atualizar Chip

Atualiza informações de um chip existente.

**Endpoint**: `PATCH /api/v1/chips/:chipId`

**Autenticação**: Requerida

**Body (JSON)**:
```json
{
  "name": "Chip Principal Atualizado",
  "dailyLimit": 150,
  "status": "paused"
}
```

**Resposta** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Chip Principal Atualizado",
    "dailyLimit": 150,
    "status": "paused"
  }
}
```

---

### 8. Deletar Chip

Remove um chip do sistema.

**Endpoint**: `DELETE /api/v1/chips/:chipId`

**Autenticação**: Requerida

**Resposta** (200):
```json
{
  "success": true,
  "message": "Chip deleted successfully"
}
```

---

### 9. Configurar Webhook

Configura um webhook para receber notificações de eventos.

**Endpoint**: `POST /api/v1/webhooks`

**Autenticação**: Requerida

**Body (JSON)**:
```json
{
  "name": "Make Webhook",
  "url": "https://hook.make.com/seu-webhook-id",
  "events": ["message.received", "chip.paused", "message.sent"]
}
```

**Eventos Disponíveis**:
- `message.received`: Quando uma mensagem é recebida
- `message.sent`: Quando uma mensagem é enviada
- `chip.paused`: Quando um chip é pausado automaticamente (Termostato)

**Resposta** (201):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Make Webhook",
    "url": "https://hook.make.com/seu-webhook-id",
    "events": ["message.received", "chip.paused", "message.sent"],
    "secret": "webhook_secret_abc123..."
  }
}
```

**⚠️ Importante**: Guarde o `secret` retornado. Ele será usado para validar webhooks.

---

### 10. Listar Webhooks

Lista todos os webhooks configurados.

**Endpoint**: `GET /api/v1/webhooks`

**Autenticação**: Requerida

**Resposta** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Make Webhook",
      "url": "https://hook.make.com/seu-webhook-id",
      "events": ["message.received", "chip.paused"],
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "lastTriggeredAt": "2024-01-15T10:25:00.000Z"
    }
  ]
}
```

---

## 🔔 Webhooks - Payload de Eventos

### Evento: `message.received`

Disparado quando uma mensagem é recebida.

```json
{
  "event": "message.received",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "chipId": 1,
    "chipName": "Chip Principal",
    "senderNumber": "5511999999999",
    "senderName": "João Silva",
    "messageContent": "Olá, tenho interesse no produto!",
    "messageType": "text",
    "receivedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Evento: `message.sent`

Disparado quando uma mensagem é enviada com sucesso.

```json
{
  "event": "message.sent",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "chipId": 1,
    "chipName": "Chip Principal",
    "recipientNumber": "5511999999999",
    "messageContent": "Mensagem enviada",
    "sentAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Evento: `chip.paused`

Disparado quando um chip é pausado automaticamente pelo Termostato.

```json
{
  "event": "chip.paused",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "chipId": 1,
    "chipName": "Chip Principal",
    "riskScore": 85,
    "reason": "High risk score detected",
    "messagesSentToday": 95,
    "dailyLimit": 100
  }
}
```

---

## 🎯 Exemplo de Integração com Make.com

### Cenário: SDR IA com Cadência Omnichannel

**Fluxo Completo**:

1. **Apollo/Lusha** → Busca leads
2. **Clay** → Enriquece dados
3. **ChatGPT (Embeddings)** → Gera mensagens personalizadas
4. **Make** → Orquestra todo o fluxo
5. **SentinelZap API** → Envia mensagens via WhatsApp com rodízio
6. **Webhook** → Recebe respostas dos leads
7. **Make** → Atualiza CRM

### Módulo Make: Enviar Mensagem

**HTTP Request**:
- Method: `POST`
- URL: `https://seu-dominio.com/api/v1/messages/send`
- Headers:
  ```
  X-API-Key: sk_sua_api_key
  Content-Type: application/json
  ```
- Body:
  ```json
  {
    "phoneNumber": "{{lead.phone}}",
    "message": "{{ai_generated_message}}"
  }
  ```

### Módulo Make: Receber Respostas (Webhook)

1. Crie um Webhook no Make
2. Configure o webhook no SentinelZap via API:
   ```bash
   curl -X POST https://seu-dominio.com/api/v1/webhooks \
     -H "X-API-Key: sk_sua_api_key" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Make Webhook",
       "url": "https://hook.make.com/seu-webhook-id",
       "events": ["message.received"]
     }'
   ```

---

## 🔒 Segurança

### Boas Práticas

1. **Nunca compartilhe sua API Key** publicamente
2. **Armazene a API Key em variáveis de ambiente** no Make
3. **Use HTTPS** sempre (obrigatório em produção)
4. **Valide webhooks** usando o `secret` fornecido
5. **Monitore o uso** através do dashboard

### Rate Limits

- **Envio de mensagens**: Limitado pelos limites diários/totais de cada chip
- **Consultas de status**: 100 requisições/minuto
- **Criação de recursos**: 20 requisições/minuto

---

## 🐛 Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Bad Request - Parâmetros inválidos |
| 401 | Unauthorized - API Key inválida ou ausente |
| 404 | Not Found - Recurso não encontrado |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Erro no servidor |

---

## 📞 Suporte

Para dúvidas ou problemas com a API, entre em contato através do dashboard do SentinelZap.

---

## 🚀 Changelog

### v1.0.0 (2024-01-15)
- Lançamento inicial da API REST
- Endpoints de envio de mensagens
- Sistema de webhooks
- Gerenciamento de chips via API
