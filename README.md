# SentinelZap - Gerenciador de Rodízio WhatsApp

Sistema de rodízio automático de chips para WhatsApp com Termostato inteligente para evitar bloqueios.

## Funcionalidades Principais

- **Rodízio Inteligente**: Seleção automática do melhor chip baseado em uso e risco
- **Termostato**: Cálculo de pontuação de risco (0-100) e pausa automática quando risco ≥ 80
- **Envio em Massa**: Importação CSV e envio em lote com rodízio automático
- **CRM Integrado**: Visualização de conversas recebidas em painel centralizado
- **Analytics**: Gráficos de uso, taxa de sucesso e histórico de risco
- **API REST**: Integração completa com Make.com e outras plataformas
- **Notificações**: Alertas por e-mail e Telegram quando chip é pausado
- **Agendamento**: Campanhas programadas com cadências automáticas de follow-up
- **Relatórios Exportáveis**: PDF e Excel com gráficos de performance

## Documentação

- [Guia de Deploy](./DEPLOY.md) - Instruções para deploy em DigitalOcean/Vultr
- [API REST](./API_REST_DOCUMENTATION.md) - Documentação completa da API para integração com Make
- [API WhatsApp](./WHATSAPP_API.md) - Documentação da integração WPPConnect

## Tecnologias

- **Frontend**: React 19 + Tailwind CSS 4
- **Backend**: Node.js + Express + tRPC
- **Banco de Dados**: MySQL/TiDB (Drizzle ORM)
- **Automação WhatsApp**: WPPConnect
- **Scheduler**: node-cron
- **Notificações**: Nodemailer + Telegram Bot API

## Primeiros Passos

1. Acesse o dashboard e faça login
2. Vá em "Gerenciar Chips" e adicione seus chips
3. Conecte cada chip escaneando o QR code
4. Configure limites diários e totais
5. Comece a enviar mensagens!

## Integração com Make.com

1. Acesse "API Keys" no dashboard
2. Gere uma nova API Key
3. Configure seu cenário no Make usando os endpoints documentados
4. Configure webhooks para receber notificações de mensagens

## Suporte

Para dúvidas ou problemas, consulte a documentação ou entre em contato.
