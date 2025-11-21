import { useAuth } from "@/auth-mock";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function SendMessages() {
  const { user } = useAuth();
  const [recipientNumber, setRecipientNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [messageContent, setMessageContent] = useState("");

  const sendMessageMutation = trpc.rotation.sendMessage.useMutation();
  const { data: statusData } = trpc.rotation.getStatus.useQuery();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleSendMessage = async () => {
    if (!recipientNumber || !messageContent) {
      toast.error("Preencha o número e a mensagem");
      return;
    }

    try {
      const result = await sendMessageMutation.mutateAsync({
        recipientNumber,
        recipientName: recipientName || undefined,
        messageContent,
        messageType: "text",
      });

      if (result.success) {
        toast.success(`Mensagem enviada via ${result.chipUsed?.name || "chip"}!`);
        setMessageContent("");
        setRecipientNumber("");
        setRecipientName("");
      } else {
        toast.error(result.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error(error);
    }
  };

  const availableChips = statusData?.chips.filter((c) => c.status === "active") || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Enviar Mensagens</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Send Message Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Nova Mensagem</CardTitle>
                <CardDescription>
                  O sistema selecionará automaticamente o melhor chip para envio
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientNumber">Número do Destinatário *</Label>
                  <Input
                    id="recipientNumber"
                    value={recipientNumber}
                    onChange={(e) => setRecipientNumber(e.target.value)}
                    placeholder="Ex: 5511988888888"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientName">Nome do Destinatário (opcional)</Label>
                  <Input
                    id="recipientName"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="messageContent">Mensagem *</Label>
                  <Textarea
                    id="messageContent"
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    {messageContent.length} caracteres
                  </p>
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={sendMessageMutation.isPending || availableChips.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {sendMessageMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>

                {availableChips.length === 0 && (
                  <p className="text-sm text-orange-600 text-center">
                    ⚠️ Nenhum chip ativo disponível. Conecte um chip primeiro.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chips Status Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Chips Disponíveis</CardTitle>
                <CardDescription>
                  {availableChips.length} chip(s) ativo(s)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {availableChips.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Nenhum chip ativo
                  </div>
                ) : (
                  <div className="space-y-3">
                    {availableChips.map((chip) => {
                      const riskScore = chip.currentRiskScore;
                      const riskColor =
                        riskScore >= 80
                          ? "bg-red-500"
                          : riskScore >= 50
                          ? "bg-orange-500"
                          : riskScore >= 25
                          ? "bg-yellow-500"
                          : "bg-green-500";

                      return (
                        <div key={chip.id} className="p-3 border rounded-lg space-y-2">
                          <div className="font-medium text-sm">{chip.name}</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Uso Diário</span>
                              <span>
                                {chip.messagesSentToday}/{chip.dailyLimit}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${riskColor}`}
                                  style={{ width: `${riskScore}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">{riskScore}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
