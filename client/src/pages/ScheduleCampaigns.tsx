import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, Loader2, Pause, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ScheduleCampaigns() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form state
  const [campaignName, setCampaignName] = useState("");
  const [message, setMessage] = useState("");
  const [contacts, setContacts] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Cadence settings
  const [enableCadence, setEnableCadence] = useState(false);
  const [cadenceDays, setCadenceDays] = useState("3");
  const [cadenceMessage, setCadenceMessage] = useState("");

  // Mock scheduled campaigns (in real app, would come from tRPC)
  const [scheduledCampaigns] = useState([
    {
      id: 1,
      name: "Prospecção Q1 2025",
      scheduledFor: new Date("2025-01-20T09:00:00"),
      status: "scheduled",
      contactCount: 150,
    },
    {
      id: 2,
      name: "Follow-up Leads Frios",
      scheduledFor: new Date("2025-01-22T14:00:00"),
      status: "scheduled",
      contactCount: 80,
    },
  ]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleSchedule = async () => {
    if (!campaignName || !message || !contacts || !scheduleDate || !scheduleTime) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setLoading(true);
    try {
      // TODO: Implement scheduling via tRPC
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Campanha agendada com sucesso!");
      
      // Reset form
      setCampaignName("");
      setMessage("");
      setContacts("");
      setScheduleDate("");
      setScheduleTime("");
      setEnableCadence(false);
      setCadenceDays("3");
      setCadenceMessage("");
    } catch (error) {
      toast.error("Erro ao agendar campanha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Agendamento de Campanhas</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6 max-w-4xl">
        {/* Schedule New Campaign */}
        <Card>
          <CardHeader>
            <CardTitle>Agendar Nova Campanha</CardTitle>
            <CardDescription>
              Configure uma campanha de envio em massa para ser executada em um horário específico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da Campanha *</Label>
              <Input
                id="campaign-name"
                placeholder="Ex: Prospecção Q1 2025"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem *</Label>
              <Textarea
                id="message"
                placeholder="Digite a mensagem que será enviada..."
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Use variáveis: {"{nome}"}, {"{empresa}"}, {"{cargo}"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacts">Contatos (um por linha) *</Label>
              <Textarea
                id="contacts"
                placeholder="5511999999999&#10;5511888888888&#10;5511777777777"
                rows={5}
                value={contacts}
                onChange={(e) => setContacts(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                {contacts.split("\n").filter((c) => c.trim()).length} contatos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-date">Data *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schedule-date"
                    type="date"
                    className="pl-10"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="schedule-time">Horário *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="schedule-time"
                    type="time"
                    className="pl-10"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Cadence Settings */}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <Label>Cadência Automática (Follow-up)</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar mensagem de follow-up automaticamente após X dias
                  </p>
                </div>
                <Button
                  variant={enableCadence ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnableCadence(!enableCadence)}
                >
                  {enableCadence ? "Ativado" : "Desativado"}
                </Button>
              </div>

              {enableCadence && (
                <div className="space-y-4 pl-4 border-l-2 border-primary">
                  <div className="space-y-2">
                    <Label htmlFor="cadence-days">Enviar follow-up após (dias)</Label>
                    <Input
                      id="cadence-days"
                      type="number"
                      min="1"
                      max="30"
                      value={cadenceDays}
                      onChange={(e) => setCadenceDays(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cadence-message">Mensagem de Follow-up</Label>
                    <Textarea
                      id="cadence-message"
                      placeholder="Digite a mensagem de follow-up..."
                      rows={3}
                      value={cadenceMessage}
                      onChange={(e) => setCadenceMessage(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <Button onClick={handleSchedule} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Agendando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Campanha
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Campaigns */}
        <Card>
          <CardHeader>
            <CardTitle>Campanhas Agendadas</CardTitle>
            <CardDescription>Gerencie suas campanhas agendadas</CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledCampaigns.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma campanha agendada ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Agendado para: {campaign.scheduledFor.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {campaign.contactCount} contatos
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-1" />
                        Executar Agora
                      </Button>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
