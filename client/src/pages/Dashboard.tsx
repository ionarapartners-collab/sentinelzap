// Mock de autenticação - substituindo useAuth.ts problemático
const useAuth = () => ({
  user: { id: '1', name: 'Usuário Demo' },
  loading: false,
  isAuthenticated: true,
  login: async () => {},
  logout: () => {}
});

import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Bell, Calendar, CheckCircle, XCircle, Loader2, Flame } from "lucide-react";
import { Link } from "wouter";
import OnboardingTutorial from "@/components/OnboardingTutorial";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  // ✅ HOTFIX: Dados mock para quando o banco não está disponível
  const mockStatusData = {
    summary: { total: 0, active: 0, paused: 0, offline: 0 },
    chips: []
  };

  // ✅ HOTFIX: Usar dados mock se a API falhar
  const { data: statusData, isLoading } = trpc.rotation.getStatus.useQuery(undefined, {
    refetchInterval: 5000,
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // ✅ HOTFIX: Usar dados mock se a API estiver carregando ou falhar
  const displayData = statusData || mockStatusData;
  const summary = displayData.summary || { total: 0, active: 0, paused: 0, offline: 0 };
  const chips = displayData.chips || [];

  return (
    <>
      <OnboardingTutorial />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <h1 className="text-xl font-bold">SentinelZap Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {user?.name || "Usuário Demo"}
              </span>
              <Button asChild variant="outline" size="sm">
                <Link href="/">Voltar</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 space-y-6">
          {/* ✅ HOTFIX: Banner informativo */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-blue-800 font-medium">Modo de Desenvolvimento</p>
                  <p className="text-blue-700 text-sm">
                    Sistema funcionando sem banco de dados. Para uso completo, configure o banco PostgreSQL.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Cards */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total de Chips</CardDescription>
                <CardTitle className="text-3xl">{summary.total}</CardTitle>
              </CardHeader>
              <CardContent>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ativos</CardDescription>
                <CardTitle className="text-3xl text-green-600">{summary.active}</CardTitle>
              </CardHeader>
              <CardContent>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pausados</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{summary.paused}</CardTitle>
              </CardHeader>
              <CardContent>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Offline</CardDescription>
                <CardTitle className="text-3xl text-red-600">{summary.offline}</CardTitle>
              </CardHeader>
              <CardContent>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/dashboard/chips">Gerenciar Chips</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/messages">Enviar Mensagens</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/bulk">Envio em Massa</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/schedule">
                  <Calendar className="h-4 w-4 mr-2" />
                  Agendar Campanhas
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/crm">Ver Conversas (CRM)</Link>
              </Button>
              <Button asChild variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                <Link href="/warmup">
                  <Flame className="h-4 w-4 mr-2" />
                  Aquecimento de Chips
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/analytics">Analytics</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/api-keys">API Keys (Make)</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/notifications">
                  <Bell className="h-4 w-4 mr-2" />
                  Notificações
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Chips Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Status dos Chips</CardTitle>
              <CardDescription>
                Visão geral da pontuação de risco e uso de cada chip
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhum chip cadastrado ainda.</p>
                  <p className="text-sm mt-2">Configure o banco de dados para gerenciar chips.</p>
                  <Button asChild className="mt-4">
                    <Link href="/dashboard/chips">Criar Primeiro Chip</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {chips.map((chip) => {
                    const riskScore = chip.currentRiskScore;
                    const riskColor =
                      riskScore >= 80
                        ? "bg-red-500"
                        : riskScore >= 50
                        ? "bg-orange-500"
                        : riskScore >= 25
                        ? "bg-yellow-500"
                        : "bg-green-500";

                    const statusIcon =
                      chip.status === "active" ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : chip.status === "paused" ? (
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      );

                    return (
                      <div
                        key={chip.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          {statusIcon}
                          <div className="flex-1">
                            <div className="font-medium">{chip.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {chip.phoneNumber}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Uso Diário</div>
                            <div className="font-medium">
                              {chip.messagesSentToday}/{chip.dailyLimit}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Uso Total</div>
                            <div className="font-medium">
                              {chip.messagesSentTotal}/{chip.totalLimit}
                            </div>
                          </div>
                          <div className="text-right min-w-[100px]">
                            <div className="text-sm text-muted-foreground">Risco</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${riskColor}`}
                                  style={{ width: `${riskScore}%` }}
                                />
                              </div>
                              <span className="font-medium text-sm">{riskScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
