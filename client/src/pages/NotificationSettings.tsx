import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Mail, MessageSquare, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function NotificationSettings() {
  const { user, loading } = useAuth();
  const [saving, setSaving] = useState(false);

  // Email settings
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smtpHost, setSmtpHost] = useState("smtp.gmail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFrom, setSmtpFrom] = useState("");

  // Telegram settings
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramBotToken, setTelegramBotToken] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  // Notification preferences
  const [notifyChipPaused, setNotifyChipPaused] = useState(true);
  const [notifyNearLimit, setNotifyNearLimit] = useState(true);
  const [dailyReport, setDailyReport] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Implement save logic via tRPC
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Configurações salvas com sucesso!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Por favor, faça login para acessar as configurações.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Bell className="h-8 w-8" />
          Configurações de Notificações
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure como você deseja receber alertas e relatórios do SentinelZap
        </p>
      </div>

      <Tabs defaultValue="email" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            E-mail
          </TabsTrigger>
          <TabsTrigger value="telegram">
            <MessageSquare className="h-4 w-4 mr-2" />
            Telegram
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="h-4 w-4 mr-2" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de E-mail (SMTP)</CardTitle>
              <CardDescription>
                Configure seu servidor SMTP para receber notificações por e-mail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-enabled">Ativar notificações por e-mail</Label>
                <Switch
                  id="email-enabled"
                  checked={emailEnabled}
                  onCheckedChange={setEmailEnabled}
                />
              </div>

              {emailEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-host">Servidor SMTP</Label>
                      <Input
                        id="smtp-host"
                        placeholder="smtp.gmail.com"
                        value={smtpHost}
                        onChange={(e) => setSmtpHost(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Porta</Label>
                      <Input
                        id="smtp-port"
                        placeholder="587"
                        value={smtpPort}
                        onChange={(e) => setSmtpPort(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-user">Usuário (E-mail)</Label>
                    <Input
                      id="smtp-user"
                      type="email"
                      placeholder="seu-email@gmail.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-pass">Senha ou App Password</Label>
                    <Input
                      id="smtp-pass"
                      type="password"
                      placeholder="••••••••••••••••"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Para Gmail, use uma{" "}
                      <a
                        href="https://support.google.com/accounts/answer/185833"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        senha de app
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="smtp-from">E-mail de Envio (From)</Label>
                    <Input
                      id="smtp-from"
                      type="email"
                      placeholder="SentinelZap <noreply@sentinelzap.com>"
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="telegram" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Telegram</CardTitle>
              <CardDescription>
                Configure um bot do Telegram para receber notificações instantâneas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="telegram-enabled">Ativar notificações no Telegram</Label>
                <Switch
                  id="telegram-enabled"
                  checked={telegramEnabled}
                  onCheckedChange={setTelegramEnabled}
                />
              </div>

              {telegramEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="telegram-token">Token do Bot</Label>
                    <Input
                      id="telegram-token"
                      placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Crie um bot com o{" "}
                      <a
                        href="https://t.me/BotFather"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @BotFather
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram-chat-id">Chat ID</Label>
                    <Input
                      id="telegram-chat-id"
                      placeholder="123456789"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Use o{" "}
                      <a
                        href="https://t.me/userinfobot"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        @userinfobot
                      </a>{" "}
                      para descobrir seu Chat ID
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Notificações</CardTitle>
              <CardDescription>
                Escolha quais notificações você deseja receber
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-paused">Chip Pausado</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alerta quando um chip for pausado automaticamente
                  </p>
                </div>
                <Switch
                  id="notify-paused"
                  checked={notifyChipPaused}
                  onCheckedChange={setNotifyChipPaused}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notify-near-limit">Próximo do Limite</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber alerta quando atingir 90% do limite diário
                  </p>
                </div>
                <Switch
                  id="notify-near-limit"
                  checked={notifyNearLimit}
                  onCheckedChange={setNotifyNearLimit}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-report">Relatório Diário</Label>
                  <p className="text-sm text-muted-foreground">
                    Receber relatório diário de uso às 9h da manhã
                  </p>
                </div>
                <Switch
                  id="daily-report"
                  checked={dailyReport}
                  onCheckedChange={setDailyReport}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
}
