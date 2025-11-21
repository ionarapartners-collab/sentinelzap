import { useAuth } from "@/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Flame, Play, Square, CheckCircle, AlertTriangle, Loader2, Settings } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function WarmupDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  
  const { data: warmupData, isLoading, refetch } = trpc.warmup.getWarmupStatus.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: settings } = trpc.warmup.getSettings.useQuery(undefined, {
    enabled: !!user && showSettings,
  });

  const startWarmupMutation = trpc.warmup.startWarmup.useMutation();
  const stopWarmupMutation = trpc.warmup.stopWarmup.useMutation();
  const updateSettingsMutation = trpc.warmup.updateSettings.useMutation();

  const [settingsForm, setSettingsForm] = useState({
    warmupDurationDays: 14,
    phase1MessagesPerDay: 15,
    phase2MessagesPerDay: 40,
    phase3MessagesPerDay: 75,
    phase1Duration: 3,
    phase2Duration: 4,
    phase3Duration: 7,
    blockUnwarmedChips: false,
  });

  // Update form when settings load
  useState(() => {
    if (settings) {
      setSettingsForm({
        warmupDurationDays: settings.warmupDurationDays,
        phase1MessagesPerDay: settings.phase1MessagesPerDay,
        phase2MessagesPerDay: settings.phase2MessagesPerDay,
        phase3MessagesPerDay: settings.phase3MessagesPerDay,
        phase1Duration: settings.phase1Duration,
        phase2Duration: settings.phase2Duration,
        phase3Duration: settings.phase3Duration,
        blockUnwarmedChips: settings.blockUnwarmedChips,
      });
    }
  });

  if (authLoading || isLoading) {
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

  const handleStartWarmup = async (chipId: number) => {
    try {
      await startWarmupMutation.mutateAsync({ chipId });
      toast.success("Aquecimento iniciado com sucesso!");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao iniciar aquecimento");
    }
  };

  const handleStopWarmup = async (chipId: number, markAsCompleted: boolean = false) => {
    try {
      await stopWarmupMutation.mutateAsync({ chipId, markAsCompleted });
      toast.success(markAsCompleted ? "Aquecimento concluído!" : "Aquecimento interrompido");
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao parar aquecimento");
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(settingsForm);
      toast.success("Configurações salvas com sucesso!");
      setShowSettings(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar configurações");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "not_started":
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700">Não Iniciado</span>;
      case "in_progress":
        return <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-700">Em Progresso</span>;
      case "completed":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-200 text-green-700">Concluído</span>;
      case "skipped":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-200 text-yellow-700">Pulado</span>;
      default:
        return null;
    }
  };

  const getPhaseLabel = (phase: number) => {
    switch (phase) {
      case 1:
        return "Fase 1: Início Suave";
      case 2:
        return "Fase 2: Aumento Gradual";
      case 3:
        return "Fase 3: Consolidação";
      default:
        return "N/A";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <h1 className="text-xl font-bold">Aquecimento de Chips</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Voltar</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Info Card */}
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              O que é Aquecimento de Chips?
            </CardTitle>
            <CardDescription className="text-foreground/80">
              O aquecimento (warm-up) é um processo essencial para evitar bloqueios no WhatsApp.
              Chips novos que começam a enviar muitas mensagens imediatamente são marcados como spam.
              Durante o aquecimento, seus chips trocam mensagens entre si simulando uso orgânico,
              "ensinando" o algoritmo do WhatsApp que são contas legítimas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium text-orange-700">Fase 1 (Dias 1-3)</div>
                <div className="text-muted-foreground">10-20 mensagens/dia entre chips</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">Fase 2 (Dias 4-7)</div>
                <div className="text-muted-foreground">30-50 mensagens/dia com variação</div>
              </div>
              <div>
                <div className="font-medium text-orange-700">Fase 3 (Dias 8-14)</div>
                <div className="text-muted-foreground">50-100 mensagens/dia consolidação</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Panel */}
        {showSettings && (
          <Card>
            <CardHeader>
              <CardTitle>Configurações de Aquecimento</CardTitle>
              <CardDescription>
                Personalize a duração e intensidade do aquecimento. Os valores padrão são recomendados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Duração Total (dias)</Label>
                  <Input
                    type="number"
                    min={7}
                    max={30}
                    value={settingsForm.warmupDurationDays}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, warmupDurationDays: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Recomendado: 14 dias</p>
                </div>

                <div className="space-y-2">
                  <Label>Bloquear chips não aquecidos</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Switch
                      checked={settingsForm.blockUnwarmedChips}
                      onCheckedChange={(checked) =>
                        setSettingsForm({ ...settingsForm, blockUnwarmedChips: checked })
                      }
                    />
                    <span className="text-sm text-muted-foreground">
                      Impedir uso de chips não aquecidos em campanhas
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Fase 1</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Duração (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={settingsForm.phase1Duration}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase1Duration: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Mensagens/dia</Label>
                    <Input
                      type="number"
                      min={5}
                      max={50}
                      value={settingsForm.phase1MessagesPerDay}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase1MessagesPerDay: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Fase 2</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Duração (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={settingsForm.phase2Duration}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase2Duration: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Mensagens/dia</Label>
                    <Input
                      type="number"
                      min={10}
                      max={100}
                      value={settingsForm.phase2MessagesPerDay}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase2MessagesPerDay: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Fase 3</h4>
                  <div className="space-y-2">
                    <Label className="text-xs">Duração (dias)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={settingsForm.phase3Duration}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase3Duration: parseInt(e.target.value) })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Mensagens/dia</Label>
                    <Input
                      type="number"
                      min={20}
                      max={150}
                      value={settingsForm.phase3MessagesPerDay}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, phase3MessagesPerDay: parseInt(e.target.value) })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSettings} disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Configurações"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chips List */}
        <Card>
          <CardHeader>
            <CardTitle>Status de Aquecimento dos Chips</CardTitle>
            <CardDescription>
              Gerencie o aquecimento de cada chip individualmente
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!warmupData || warmupData.chips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum chip cadastrado ainda.</p>
                <Button asChild className="mt-4">
                  <Link href="/dashboard/chips">Criar Primeiro Chip</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {warmupData.chips.map((chip) => (
                  <div
                    key={chip.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    {/* Chip Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{chip.name}</div>
                        <div className="text-sm text-muted-foreground">{chip.phoneNumber}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(chip.warmupStatus)}
                        {!chip.isConnected && (
                          <span className="px-2 py-1 text-xs rounded-full bg-red-200 text-red-700">
                            Desconectado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {chip.warmupStatus === "in_progress" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {getPhaseLabel(chip.currentPhase)} - Dia {chip.warmupCurrentDay}/
                            {warmupData.settings.warmupDurationDays}
                          </span>
                          <span className="font-medium">{chip.progress}%</span>
                        </div>
                        <Progress value={chip.progress} className="h-2" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Mensagens hoje: {chip.warmupMessagesToday}/{chip.targetMessagesPerDay}
                          </span>
                          {chip.warmupEndDate && (
                            <span>
                              Conclusão prevista: {new Date(chip.warmupEndDate).toLocaleDateString("pt-BR")}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Completed Status */}
                    {chip.warmupStatus === "completed" && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm font-medium">
                          Chip aquecido e pronto para uso em produção!
                        </span>
                      </div>
                    )}

                    {/* Not Started Status */}
                    {chip.warmupStatus === "not_started" && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="text-sm">
                          Chip novo - recomendamos iniciar o aquecimento antes de usar em campanhas
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      {chip.warmupStatus === "not_started" && (
                        <Button
                          size="sm"
                          onClick={() => handleStartWarmup(chip.id)}
                          disabled={!chip.isConnected || startWarmupMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Aquecimento
                        </Button>
                      )}

                      {chip.warmupStatus === "in_progress" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStopWarmup(chip.id, false)}
                            disabled={stopWarmupMutation.isPending}
                          >
                            <Square className="h-4 w-4 mr-2" />
                            Interromper
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleStopWarmup(chip.id, true)}
                            disabled={stopWarmupMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Concluído
                          </Button>
                        </>
                      )}

                      {(chip.warmupStatus === "completed" || chip.warmupStatus === "skipped") && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStartWarmup(chip.id)}
                          disabled={!chip.isConnected || startWarmupMutation.isPending}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Reiniciar Aquecimento
                        </Button>
                      )}

                      {!chip.isConnected && (
                        <Button asChild size="sm" variant="outline">
                          <Link href="/dashboard/chips">Conectar Chip</Link>
                        </Button>
                      )}
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
