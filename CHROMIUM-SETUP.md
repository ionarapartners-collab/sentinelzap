# Chromium Setup para WPPConnect

O SentinelZap usa o WPPConnect para gerenciar conexões WhatsApp, que requer o navegador Chromium instalado.

## Instalação Automática

Execute o script de instalação:

```bash
./install-chromium.sh
```

## Instalação Manual

Se preferir instalar manualmente:

```bash
cd /home/ubuntu/SentinelZap
npx puppeteer browsers install chrome
```

## Verificação

Após a instalação, verifique se o Chromium foi instalado corretamente:

```bash
ls -la /home/ubuntu/.cache/puppeteer/chrome/
```

Você deve ver um diretório com a versão do Chrome instalada, exemplo:
```
drwxr-xr-x 3 ubuntu ubuntu 4096 Nov 18 05:15 linux-131.0.6778.204
```

## Solução de Problemas

### Erro: "Could not find Chrome"

Se você ver este erro nos logs:
```
Could not find Chrome (ver. XXX.X.XXXX.XXX)
```

**Solução:** Execute o script de instalação do Chromium:
```bash
./install-chromium.sh
```

### Erro: "Failed to launch the browser process"

Se o Chromium não conseguir iniciar, verifique:

1. **Permissões**: O executável do Chrome precisa ter permissão de execução
   ```bash
   chmod +x /home/ubuntu/.cache/puppeteer/chrome/*/chrome-linux64/chrome
   ```

2. **Dependências do sistema**: O Chromium precisa de bibliotecas do sistema
   ```bash
   sudo apt-get update
   sudo apt-get install -y \
     libnss3 \
     libatk1.0-0 \
     libatk-bridge2.0-0 \
     libcups2 \
     libdrm2 \
     libxkbcommon0 \
     libxcomposite1 \
     libxdamage1 \
     libxfixes3 \
     libxrandr2 \
     libgbm1 \
     libasound2
   ```

## Configuração em Produção

O arquivo `server/whatsapp.ts` já está configurado para usar o Chromium instalado:

```typescript
puppeteerOptions: {
  executablePath: '/home/ubuntu/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome',
}
```

**Nota:** Se você atualizar o Chromium para uma versão diferente, atualize o caminho no código.

## Logs

Para verificar se o WPPConnect está funcionando corretamente, monitore os logs:

```bash
# Logs do servidor
tail -f /tmp/*.log | grep -i "whatsapp\|qr\|chrome"
```

Você deve ver mensagens como:
```
[WhatsApp] Initializing NEW session: chip-XXXXX
[WhatsApp] Using Chrome at: /home/ubuntu/.cache/puppeteer/chrome/...
[WhatsApp] ✅ QR Code generated for session: chip-XXXXX
```

## Suporte

Se você continuar tendo problemas:

1. Verifique os logs do servidor
2. Teste a instalação do Chromium manualmente
3. Verifique se há erros de permissão
4. Certifique-se de que o servidor tem memória suficiente (mínimo 512MB recomendado)
