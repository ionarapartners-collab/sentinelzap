import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Send, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function WarmupPage() {
  const { user } = useAuth();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const { data: chips, isLoading: chipsLoading } = trpc.chips.list.useQuery();
  // Warmup config - will be implemented later
  const warmupConfig = { nextRun: "A cada 3 horas" };
  
  const sendWarmupMutation = trpc.warmup.sendWarmupNow.useMutation({
    onSuccess: (data) => {
      toast.success(`✅ ${data.message}`);
    },
    onError: (error: any) => {
      toast.error(`❌ Erro ao enviar: ${error.message}`);
    },
  });

  const activeChips = chips?.filter(c => c.isConnected) || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold">Aquecimento de Chips</h1>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao Dashboard</Button>
          </Link>
        </div>
      </header>

      <main className="container py-8 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status do Aquecimento</CardTitle>
            <CardDescription>
              Envio automático de mensagens para manter os chips ativos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Chips Ativos</p>
                  <p className="text-2xl font-bold">{activeChips.length}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Frequência</p>
                  <p className="text-2xl font-bold">3h</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Send className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Próximo Envio</p>
                  <p className="text-lg font-semibold">
                    {warmupConfig?.nextRun || "Aguardando..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => sendWarmupMutation.mutate()}
                disabled={sendWarmupMutation.isPending || activeChips.length === 0}
                className="w-full md:w-auto"
              >
                {sendWarmupMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Aquecimento Agora
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Chips */}
        <Card>
          <CardHeader>
            <CardTitle>Chips Participando do Aquecimento</CardTitle>
            <CardDescription>
              Apenas chips conectados recebem mensagens de aquecimento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chipsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activeChips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum chip ativo no momento</p>
                <p className="text-sm mt-2">Conecte chips na página de gerenciamento</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeChips.map((chip) => (
                  <div
                    key={chip.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{chip.name}</p>
                      <p className="text-sm text-muted-foreground">{chip.phoneNumber}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm text-green-600 font-medium">Ativo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Como Funciona</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Mensagens de aquecimento são enviadas automaticamente a cada 3 horas</p>
            <p>• Cada chip envia uma mensagem para um número de teste configurado</p>
            <p>• Isso mantém os chips ativos e evita bloqueios por inatividade</p>
            <p>• Você pode enviar manualmente clicando no botão acima</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
