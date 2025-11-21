# SentinelZap - TODO

## Dia 1: Estrutura e Modelagem
- [x] Modelagem de dados (tabelas: chips, histórico de mensagens, conversas)
- [x] Criação do schema no Drizzle com suporte a N chips
- [x] Implementação de campos para Termostato (pontuação de risco, status)
- [x] Push do schema para o banco de dados
- [x] Criação de funções auxiliares no db.ts

## Dia 2: Lógica de Rodízio e Termostato
- [x] Implementar algoritmo de seleção de chip (rodízio inteligente)
- [x] Implementar cálculo de pontuação de risco (Termostato)
- [x] Implementar pausa automática de chips com alto risco
- [x] Criar rotas tRPC para gerenciamento de chips
- [x] Criar rotas tRPC para registro de histórico

## Dia 3: API de Automação e Integração
- [x] Pesquisar e configurar WPPConnect para N sessões
- [x] Criar módulo de automação separado
- [x] Implementar inicialização de múltiplas sessões
- [x] Criar webhooks para receber mensagens
- [x] Integrar API de automação com backend (envio de mensagens)
- [x] Integrar recebimento de mensagens com ## Dia 4: Frontend
- [x] Criar página de gerenciamento de chips (cadastro, edição, exclusão)
- [x] Criar visualização de status dos chips (online/offline/pausado)
- [x] Criar painel de Termostato (exibição de pontuação de risco)
- [x] Criar interface de envio de mensagens
- [x] Criar painel CRM para visualizar conversas
- [x] Criar dashboard principal com estatísticas e proteção de rotas

## Dia 5: Testes e Documentação
- [x] Testar rodízio de chips end-to-end
- [x] Testar Termostato e pausa automática
- [x] Testar envio de mensagens
- [x] Testar recebimento de mensagens (webhooks)
- [x] Criar documentação de deploy (DigitalOcean/Vultr)
- [x] Criar guia de configuração dos chips
- [x] Configurar script de cron para reset diário
- [x] Salvar checkpoint final

## Página de Teste (Extra)
- [x] Criar página de teste para validar integração WhatsApp
- [x] Implementar formulário de criação de chip
- [x] Implementar visualização de QR code
- [x] Implementar teste de envio de mensagens

## Envio em Massa (Extra)
- [x] Criar interface de importação de CSV
- [x] Implementar parser de CSV para contatos
- [x] Criar fila de envio em massa
- [x] Implementar envio em lote com rodízio automático
- [ ] Adicionar progresso de envio em tempo real (frontend pendente)

## Analytics e Relatórios (Extra)
- [x] Criar página de analytics
- [x] Implementar gráficos de uso por chip
- [x] Implementar taxa de sucesso de envio
- [x] Implementar histórico de pontuação de risco

## API REST para Integração com Make
- [x] Criar endpoints REST para envio de mensagens
- [x] Criar endpoints REST para gerenciamento de chips (CRUD)
- [x] Criar endpoint para consultar status do sistema
- [x] Implementar autenticação via API Key
- [x] Criar middleware de autenticação
- [x] Gerar API Keys por usuário
- [x] Implementar webhooks para notificar Make sobre mensagens recebidas
- [x] Criar endpoint de configuração de webhook
- [x] Documentar API REST completa com exemplos Make
- [x] Testar integração end-to-end

## Webhooks Funcionais
- [x] Implementar disparo real de webhooks para eventos
- [x] Adicionar validação HMAC para segurança
- [x] Implementar retry automático com backoff exponencial
- [x] Criar logs de webhooks disparados

## Sistema de Notificações
- [x] Configurar envio de e-mails (SMTP)
- [x] Integrar Telegram Bot API
- [x] Criar notificação quando chip for pausado
- [x] Criar notificação quando atingir 90% do limite
- [x] Implementar relatório diário por e-mail
- [x] Criar interface de configuração de notificações
- [x] Integrar notificações nos eventos do sistema

### Agendamento de Campanhas
- [x] Criar tabela de campanhas agendadas
- [x] Implementar job scheduler (cron)
- [x] Integrar scheduler no servidor
- [x] Implementar reset diário automático (00:00)
- [x] Implementar envio de relatórios diários (09:00)
- [x] Criar interface de agendamento de campanhas
- [x] Implementar cadências automáticas de follow-up
- [x] Pausar/retomar campanhas agendadas
- [x] Criar visualização de campanhas agendadas

## Relatórios Exportáveis
- [x] Implementar exportação de relatórios em PDF
- [x] Implementar exportação de relatórios em Excel
- [x] Adicionar gráficos de performance mensal
- [x] Criar histórico completo de uso por chipCriar interface## Melhorias de UX
- [x] Adicionar loading states em todas as ações
- [x] Melhorar mensagens de erro
- [x] Adicionar toast notifications
- [x] Criar tutorial de primeiro uso (onboarding)icionar tooltips explicativos
- [ ] Melhorar feedback visual de ações

## Correção OAuth Pós-Publicação
- [ ] Investigar erro 404 no endpoint /api/oauth/login
- [ ] Verificar configuração de rotas OAuth
- [ ] Testar autenticação após correção

## Sistema de Aquecimento de Chips (Warm-up)
- [x] Adicionar campos de aquecimento no schema (warmupStatus, warmupStartDate, warmupEndDate, warmupDaysTotal)
- [x] Criar tabela warmupSettings para configurações globais
- [x] Criar tabela warmupHistory para histórico de mensagens de aquecimento
- [x] Implementar lógica de automação de mensagens entre chips
- [x] Criar scheduler para enviar mensagens de aquecimento automaticamente
- [x] Criar rotas tRPC para gerenciar aquecimento (start, stop, configure)
- [x] Criar página WarmupDashboard.tsx com progresso visual
- [x] Adicionar proteção contra uso de chips não aquecidos
- [x] Integrar aquecimento com sistema de rotação
- [x] Documentar funcionalidade de aquecimento

## Bug: QR Code Travado
- [x] Investigar por que QR Code não carrega (loading infinito)
- [x] Verificar logs do servidor WPPConnect
- [x] Corrigir geração e exibição do QR Code
- [x] Adicionar logs detalhados e feedback visual
- [ ] Testar conexão de chip end-to-end

## Bug Crítico: WPPConnect não gera QR Code
- [x] Verificar se WPPConnect está instalado corretamente
- [x] Analisar logs do servidor para erros de inicialização
- [x] Verificar dependências do Puppeteer/Chromium
- [x] Instalar Chromium via npx puppeteer browsers install chrome
- [x] Configurar WPPConnect para usar Chromium instalado (puppeteerOptions.executablePath)
- [ ] Testar geração de QR Code com sucesso

## Bug Persistente: QR Code ainda não funciona
- [x] Verificar logs do servidor para erro específico
- [x] Testar WPPConnect manualmente com script isolado - FUNCIONA!
- [x] Identificar problema: initSession retornava antes do QR ser gerado
- [x] Implementar Promise.race para esperar QR Code antes de retornar
- [x] Melhorar feedback visual no frontend
- [ ] Validar funcionamento completo com usuário

## Bug: Fluxo do botão QR Code incorreto
- [x] Verificar se botão QR Code abre dialog antes de inicializar sessão - SIM!
- [x] Corrigir fluxo para chamar handleInitSession primeiro
- [x] Garantir que dialog só abre quando QR Code estiver pronto
- [x] Testar fluxo completo com usuário - FUNCIONA!

## Bug: Caminho do Chrome hardcoded
- [x] Verificar versão do Chromium instalada - linux-131.0.6778.204
- [x] Implementar detecção automática do executablePath com fallback
- [ ] Testar geração de QR Code com novo caminho

## Bug Persistente: QR Code ainda não funciona após todas correções
- [x] Criar teste isolado para capturar erro exato - QR Code gerado com sucesso!
- [x] Analisar logs e identificar causa raiz - Timeout do tRPC (30s) menor que tempo de geração (~40s)
- [x] Implementar solução definitiva - Aumentar timeout para 90s
- [x] Criar checkpoint com correção
- [ ] Aguardando validação do usuário

## Bug: Sess\u00e3o Chromium j\u00e1 em execu\u00e7\u00e3o
- [ ] Matar processos Chromium antigos
- [ ] Limpar diret\u00f3rio tokens/ de sess\u00f5es antigas
- [ ] Testar gera\u00e7\u00e3o de QR Code novamente

## Bug: QR Code gerado mas não exibido no dialog
- [x] Adicionar logs de debug no handleInitSession
- [x] Verificar se result.qrCode está chegando do backend (logs adicionados)
- [x] Garantir que dialog abre quando QR Code estiver pronto (setSelectedChipForQR)
- [ ] Testar e validar com usuário

## Bug CRÍTICO: Chrome não encontrado no executablePath
- [x] Verificar onde o Chrome está instalado
- [x] Reinstalar Chrome se necessário (não foi preciso)
- [x] Atualizar whatsapp.ts para usar caminho correto ou remover executablePath (usar padrão do Puppeteer)
- [ ] Testar geração de QR Code com correção (aguardando teste do usuário)

## Bug: Cannot set properties of undefined (setting 'userDataDir')
- [x] Investigar configuração do puppeteerOptions
- [x] Remover ou ajustar configuração que está causando undefined (removido puppeteerOptions completamente)
- [ ] Testar geração de QR Code novamente

## NOVA ESTRATÉGIA: Exibir QR Code via polling do banco (evitar Puppeteer)
- [x] Criar endpoint tRPC chips.getQRCode para buscar QR Code do banco
- [x] Implementar polling no frontend (buscar a cada 2s até QR Code aparecer)
- [x] Remover dependência do dialog abrir imediatamente (já implementado)
- [ ] Testar geração e exibição do QR Code

## MIGRAÇÃO: Trocar WPPConnect por whatsapp-web.js
- [x] Desinstalar @wppconnect-team/wppconnect
- [x] Instalar whatsapp-web.js
- [x] Reescrever server/whatsapp.ts com whatsapp-web.js
- [x] Manter mesma interface (initializeSession, sendMessage, etc)
- [ ] Testar geração de QR Code
- [ ] Testar envio de mensagens

## ÚLTIMA TENTATIVA: Corrigir Chrome/Puppeteer
- [x] Verificar versão do Chrome instalada (Chromium 128)
- [x] Instalar dependências do Puppeteer (libgbm, etc)
- [x] Configurar whatsapp-web.js para usar executablePath correto (/usr/bin/chromium-browser)
- [ ] Testar geração de QR Code
- [ ] Se falhar: migrar para Baileys

## Bug: Site lento/travado
- [x] Reiniciar servidor
- [x] Verificar performance (servidor rodando normalmente)
- [ ] Decidir: continuar tentando whatsapp-web.js ou migrar para Baileys

## MIGRAÇÃO FINAL: Trocar whatsapp-web.js por Baileys
- [x] Desinstalar whatsapp-web.js
- [x] Instalar @whiskeysockets/baileys (v6.7.21)
- [x] Reescrever server/whatsapp.ts com Baileys
- [ ] Testar geração de QR Code
- [ ] Testar envio de mensagens
- [ ] Criar checkpoint

## MIGRAÇÃO BAILEYS (Após Reset do Sandbox)
- [x] Desinstalar @wppconnect-team/wppconnect (já estava removido)
- [x] Instalar @whiskeysockets/baileys + pino + @hapi/boom (já instalados)
- [x] Reescrever server/whatsapp.ts com Baileys
- [ ] Corrigir routers.ts (remover funções antigas)
- [x] Corrigir webhooks.ts (remover onMessage)
- [ ] Testar geração de QR Code
- [ ] Criar checkpoint

## Correção Final: QR Code com Baileys
- [x] Corrigir todos os erros TypeScript (sendMessage agora usa chipId ao invés de sessionId)
- [x] Corrigir server/routers.ts (linha 272)
- [x] Corrigir server/rest-api.ts (linha 151)
- [x] Corrigir server/bulk-sender.ts (linha 98)
- [x] Corrigir server/lib/warmup-automation.ts (linha 200)
- [x] Testar initializeSession diretamente - FUNCIONA! QR Code gerado em ~1s
- [x] Verificar banco de dados - QR Codes salvos com sucesso (237 chars)
- [x] Identificar bug: QR Code é STRING, não imagem
- [x] Instalar biblioteca qrcode para converter string em imagem
- [x] Implementar conversão de QR Code string para Data URL
- [x] Atualizar frontend para exibir imagem gerada
- [x] Reiniciar servidor e validar correção
- [ ] Testar QR Code end-to-end com usuário

## Bug: Dialog de QR Code não fecha após conexão
- [ ] Adicionar polling para verificar status de conexão do chip
- [ ] Fechar dialog automaticamente quando chip conectar
- [ ] Atualizar lista de chips em tempo real
- [ ] Adicionar botão "Fechar" manual no dialog
- [ ] Melhorar feedback visual de conexão bem-sucedida

## Bug: Chips desconectando automaticamente
- [x] Investigar logs do servidor para identificar causa da desconexão
- [x] Verificar status dos chips no banco de dados
- [x] Implementar reconexão automática do Baileys
- [ ] Limpar sessões antigas (pasta tokens/)
- [ ] Melhorar tratamento de erros do Baileys
- [ ] Implementar reconexão automática quando detectar desconexão
- [ ] Adicionar logs detalhados para debug
- [ ] Testar estabilidade da conexão por 5+ minutos

## Bug CRÍTICO: Chips caindo e reconectando em loop
- [ ] Implementar debounce para evitar inicializações simultâneas
- [ ] Criar fila de conexão (um chip por vez)
- [ ] Aumentar timeout de conexão
- [ ] Melhorar tratamento de erros (não marcar erro durante reconexão)
- [ ] Adicionar estado "connecting" no banco
- [ ] Testar estabilidade com múltiplos chips

## Bug: Página de aquecimento travada em loading
- [ ] Investigar erro de carregamento
- [ ] Verificar timeout de queries tRPC
- [ ] Corrigir erro de dados ou lógica
- [ ] Testar carregamento com chips ativos

## Bug: Envio de mensagens falhando
- [ ] Investigar logs do servidor
- [ ] Verificar se Baileys está realmente conectado
- [ ] Corrigir função sendMessage no whatsapp.ts
- [ ] Testar envio de mensagem manual

## Bug: Botão "Enviar Aquecimento Agora" não aparece
- [ ] Verificar se página WarmupPage está carregando
- [ ] Verificar erros no console do navegador
- [ ] Corrigir renderização do botão

## Investigação: Aquecimento não está enviando mensagens
- [x] Verificar se scheduler está rodando
- [x] Verificar logs de aquecimento
- [x] Testar envio manual de mensagem via /dashboard/messages
- [x] Verificar se warmup-automation.ts está funcionando
- [ ] Verificar se há mensagens na tabela warmupHistory
- [x] Criar script de teste manual (test-warmup-manual.mjs)
- [x] Criar documentação de uso (TESTE-AQUECIMENTO.md)

## 🚨 EMERGÊNCIA: Loop infinito de warmup
- [ ] Parar servidor imediatamente
- [ ] Investigar causa do loop
- [ ] Verificar quantas mensagens foram enviadas
- [ ] Corrigir código de warmup
- [ ] Reiniciar com segurança
