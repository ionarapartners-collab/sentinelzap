# Guia de Deploy - SentinelZap

Este guia fornece instruções passo a passo para fazer o deploy do SentinelZap em um servidor de produção.

## Pré-requisitos

Antes de começar, você precisará:

- **Servidor VPS**: DigitalOcean, Vultr, AWS, ou similar (mínimo 2GB RAM, 1 vCPU)
- **Sistema Operacional**: Ubuntu 22.04 LTS (recomendado)
- **Domínio** (opcional): Para acessar o sistema via URL personalizada
- **Acesso SSH**: Credenciais de acesso root ou sudo ao servidor

## Parte 1: Configuração do Servidor

### 1.1 Conectar ao Servidor via SSH

```bash
ssh root@SEU_IP_DO_SERVIDOR
```

### 1.2 Atualizar o Sistema

```bash
apt update && apt upgrade -y
```

### 1.3 Instalar Dependências Básicas

```bash
# Instalar Node.js 22.x
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
apt install -y nodejs

# Instalar pnpm
npm install -g pnpm

# Instalar PM2 (gerenciador de processos)
npm install -g pm2

# Instalar dependências do Puppeteer (necessário para WPPConnect)
apt install -y \
  ca-certificates \
  fonts-liberation \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils
```

### 1.4 Instalar e Configurar MySQL/TiDB

**Opção A: MySQL Local**

```bash
apt install -y mysql-server
mysql_secure_installation
```

**Opção B: TiDB Cloud (Recomendado)**

1. Acesse [TiDB Cloud](https://tidbcloud.com/)
2. Crie uma conta gratuita
3. Crie um cluster (tier gratuito disponível)
4. Copie a string de conexão fornecida

### 1.5 Configurar Firewall

```bash
# Permitir SSH, HTTP e HTTPS
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

## Parte 2: Deploy da Aplicação

### 2.1 Clonar o Projeto

```bash
# Criar diretório para a aplicação
mkdir -p /var/www
cd /var/www

# Clonar ou fazer upload dos arquivos do projeto
# (Você pode usar git, scp, ou rsync)
```

### 2.2 Instalar Dependências

```bash
cd /var/www/SentinelZap
pnpm install
```

### 2.3 Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
nano .env
```

Adicione as seguintes variáveis:

```env
# Database
DATABASE_URL="mysql://usuario:senha@host:3306/sentinelzap"

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET="sua_chave_secreta_muito_segura_aqui"

# OAuth (se estiver usando Manus OAuth)
OAUTH_SERVER_URL="https://api.manus.im"
VITE_OAUTH_PORTAL_URL="https://portal.manus.im"
VITE_APP_ID="seu_app_id"
OWNER_OPEN_ID="seu_open_id"
OWNER_NAME="Seu Nome"

# Application
NODE_ENV="production"
PORT="3000"
VITE_APP_TITLE="SentinelZap"
VITE_APP_LOGO="/logo.svg"

# Forge API (se aplicável)
BUILT_IN_FORGE_API_URL="https://forge.manus.im"
BUILT_IN_FORGE_API_KEY="sua_chave_api"
VITE_FRONTEND_FORGE_API_KEY="sua_chave_frontend"
VITE_FRONTEND_FORGE_API_URL="https://forge.manus.im"

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT="https://analytics.manus.im"
VITE_ANALYTICS_WEBSITE_ID="seu_website_id"
```

### 2.4 Executar Migrações do Banco de Dados

```bash
pnpm db:push
```

### 2.5 Build da Aplicação

```bash
pnpm build
```

### 2.6 Iniciar com PM2

```bash
# Iniciar a aplicação
pm2 start npm --name "sentinelzap" -- start

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

## Parte 3: Configurar Nginx (Reverse Proxy)

### 3.1 Instalar Nginx

```bash
apt install -y nginx
```

### 3.2 Criar Configuração do Site

```bash
nano /etc/nginx/sites-available/sentinelzap
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.3 Ativar o Site

```bash
ln -s /etc/nginx/sites-available/sentinelzap /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### 3.4 Configurar SSL com Let's Encrypt (Opcional mas Recomendado)

```bash
# Instalar Certbot
apt install -y certbot python3-certbot-nginx

# Obter certificado SSL
certbot --nginx -d seu-dominio.com

# Renovação automática já está configurada
```

## Parte 4: Configurar Cron Job para Reset Diário

### 4.1 Criar Script de Reset

```bash
nano /var/www/SentinelZap/scripts/reset-daily-counters.mjs
```

Adicione o seguinte conteúdo:

```javascript
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { chips } from "../drizzle/schema.js";

async function resetDailyCounters() {
  console.log("[Cron] Resetting daily counters...");
  
  try {
    const db = drizzle(process.env.DATABASE_URL);
    
    await db.update(chips).set({
      messagesSentToday: 0,
      riskScore: 0,
      status: "active",
      pausedReason: null,
    });
    
    console.log("[Cron] Daily counters reset successfully!");
  } catch (error) {
    console.error("[Cron] Error resetting counters:", error);
  }
  
  process.exit(0);
}

resetDailyCounters();
```

### 4.2 Configurar Cron

```bash
crontab -e
```

Adicione a seguinte linha (executa todo dia à meia-noite):

```cron
0 0 * * * cd /var/www/SentinelZap && /usr/bin/node scripts/reset-daily-counters.mjs >> /var/log/sentinelzap-cron.log 2>&1
```

## Parte 5: Monitoramento e Manutenção

### 5.1 Ver Logs da Aplicação

```bash
# Logs em tempo real
pm2 logs sentinelzap

# Logs do cron
tail -f /var/log/sentinelzap-cron.log
```

### 5.2 Reiniciar a Aplicação

```bash
pm2 restart sentinelzap
```

### 5.3 Atualizar a Aplicação

```bash
cd /var/www/SentinelZap
git pull  # ou faça upload dos novos arquivos
pnpm install
pnpm db:push
pnpm build
pm2 restart sentinelzap
```

### 5.4 Monitorar Recursos

```bash
# Ver status do PM2
pm2 status

# Ver uso de recursos
pm2 monit

# Ver informações do servidor
htop
```

## Parte 6: Backup e Segurança

### 6.1 Backup do Banco de Dados

Crie um script de backup:

```bash
nano /root/backup-db.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR

mysqldump -u usuario -p'senha' sentinelzap > $BACKUP_DIR/sentinelzap_$DATE.sql
gzip $BACKUP_DIR/sentinelzap_$DATE.sql

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "sentinelzap_*.sql.gz" -mtime +7 -delete

echo "Backup completed: sentinelzap_$DATE.sql.gz"
```

Torne o script executável e agende:

```bash
chmod +x /root/backup-db.sh

# Adicionar ao crontab (backup diário às 2h da manhã)
crontab -e
```

```cron
0 2 * * * /root/backup-db.sh >> /var/log/backup.log 2>&1
```

### 6.2 Segurança Adicional

```bash
# Instalar Fail2Ban (proteção contra brute force)
apt install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Desabilitar login root via SSH
nano /etc/ssh/sshd_config
# Alterar: PermitRootLogin no
systemctl restart sshd
```

## Parte 7: Solução de Problemas

### Problema: Aplicação não inicia

**Solução:**
```bash
pm2 logs sentinelzap  # Ver logs de erro
pm2 restart sentinelzap
```

### Problema: Erro de conexão com banco de dados

**Solução:**
- Verifique se a string `DATABASE_URL` no `.env` está correta
- Teste a conexão manualmente:
  ```bash
  mysql -h host -u usuario -p
  ```

### Problema: QR Code não aparece

**Solução:**
- Verifique se todas as dependências do Puppeteer foram instaladas (Parte 1.3)
- Reinicie a aplicação: `pm2 restart sentinelzap`

### Problema: Mensagens não são enviadas

**Solução:**
- Verifique se o chip está conectado no painel
- Verifique os logs: `pm2 logs sentinelzap`
- Certifique-se de que o chip não está pausado por alto risco

## Custos Estimados

| Item | Provedor | Custo Mensal (USD) |
|------|----------|-------------------|
| VPS (2GB RAM) | DigitalOcean | $12 |
| VPS (2GB RAM) | Vultr | $10 |
| Banco de Dados | TiDB Cloud (Free Tier) | $0 |
| Domínio | Namecheap | $1-2 |
| SSL | Let's Encrypt | $0 |
| **Total Estimado** | | **$11-14/mês** |

## Suporte

Para suporte técnico ou dúvidas:
- Consulte a documentação da API: `WHATSAPP_API.md`
- Verifique o arquivo `todo.md` para funcionalidades implementadas
- Acesse os logs para diagnóstico de problemas

---

**Desenvolvido por Manus AI**
