import { useAuth } from "@/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Download, FileText, FileSpreadsheet } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function Analytics() {
  const { user } = useAuth();
  const { data: chips } = trpc.chips.list.useQuery();
  const { data: messages } = trpc.messages.list.useQuery({ limit: 1000 });

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Calculate statistics
  const totalChips = chips?.length || 0;
  const activeChips = chips?.filter((c) => c.status === "active").length || 0;
  const totalMessagesSent = chips?.reduce((sum, c) => sum + c.messagesSentTotal, 0) || 0;
  const totalMessagesToday = chips?.reduce((sum, c) => sum + c.messagesSentToday, 0) || 0;
  
  const successRate = messages
    ? Math.round(
        (messages.filter((m) => m.status === "sent" || m.status === "delivered").length / messages.length) * 100
      )
    : 0;

  const avgRiskScore = chips && chips.length > 0
    ? Math.round(
        chips.reduce((sum, c) => sum + (c.riskScore || 0), 0) / chips.length
      )
    : 0;

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.text("SentinelZap - Relatório de Analytics", 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
      doc.text(`Usuário: ${user.name || "N/A"}`, 14, 33);
      
      // Summary
      doc.setFontSize(14);
      doc.text("Resumo Geral", 14, 45);
      
      const summaryData = [
        ["Total de Chips", totalChips.toString()],
        ["Chips Ativos", activeChips.toString()],
        ["Mensagens Enviadas (Total)", totalMessagesSent.toString()],
        ["Mensagens Enviadas (Hoje)", totalMessagesToday.toString()],
        ["Taxa de Sucesso", `${successRate}%`],
        ["Pontuação Média de Risco", avgRiskScore.toString()],
      ];
      
      autoTable(doc, {
        startY: 50,
        head: [["Métrica", "Valor"]],
        body: summaryData,
        theme: "grid",
      });
      
      // Chips details
      if (chips && chips.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.text("Detalhes dos Chips", 14, 20);
        
        const chipsData = chips.map((chip) => [
          chip.name,
          chip.phoneNumber,
          chip.status,
          `${chip.messagesSentToday}/${chip.dailyLimit}`,
          `${chip.messagesSentTotal}/${chip.totalLimit}`,
          chip.riskScore?.toString() || "0",
        ]);
        
        autoTable(doc, {
          startY: 25,
          head: [["Nome", "Telefone", "Status", "Uso Diário", "Uso Total", "Risco"]],
          body: chipsData,
          theme: "grid",
          styles: { fontSize: 8 },
        });
      }
      
      doc.save(`sentinelzap-relatorio-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Relatório PDF gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    }
  };

  const exportToExcel = () => {
    try {
      const workbook = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ["SentinelZap - Relatório de Analytics"],
        ["Gerado em:", new Date().toLocaleString("pt-BR")],
        ["Usuário:", user.name || "N/A"],
        [],
        ["Métrica", "Valor"],
        ["Total de Chips", totalChips],
        ["Chips Ativos", activeChips],
        ["Mensagens Enviadas (Total)", totalMessagesSent],
        ["Mensagens Enviadas (Hoje)", totalMessagesToday],
        ["Taxa de Sucesso", `${successRate}%`],
        ["Pontuação Média de Risco", avgRiskScore],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumo");
      
      // Chips sheet
      if (chips && chips.length > 0) {
        const chipsData = [
          ["Nome", "Telefone", "Status", "Uso Diário", "Limite Diário", "Uso Total", "Limite Total", "Risco"],
          ...chips.map((chip) => [
            chip.name,
            chip.phoneNumber,
            chip.status,
            chip.messagesSentToday,
            chip.dailyLimit,
            chip.messagesSentTotal,
            chip.totalLimit,
            chip.riskScore || 0,
          ]),
        ];
        
        const chipsSheet = XLSX.utils.aoa_to_sheet(chipsData);
        XLSX.utils.book_append_sheet(workbook, chipsSheet, "Chips");
      }
      
      // Messages sheet
      if (messages && messages.length > 0) {
        const messagesData = [
          ["Data", "Chip", "Destinatário", "Status", "Mensagem"],
          ...messages.slice(0, 1000).map((msg) => [
            new Date(msg.sentAt).toLocaleString("pt-BR"),
            msg.chipId,
            msg.recipientNumber,
            msg.status,
            msg.messageContent?.substring(0, 100) || "",
          ]),
        ];
        
        const messagesSheet = XLSX.utils.aoa_to_sheet(messagesData);
        XLSX.utils.book_append_sheet(workbook, messagesSheet, "Mensagens");
      }
      
      XLSX.writeFile(workbook, `sentinelzap-relatorio-${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Relatório Excel gerado com sucesso!");
    } catch (error) {
      console.error("Erro ao gerar Excel:", error);
      toast.error("Erro ao gerar relatório Excel");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Analytics</h1>
          <div className="flex items-center gap-2">
            <Button onClick={exportToPDF} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
            <Button onClick={exportToExcel} variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Chips</CardDescription>
              <CardTitle className="text-3xl">{totalChips}</CardTitle>
            </CardHeader>
            <CardContent>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Chips Ativos</CardDescription>
              <CardTitle className="text-3xl text-green-600">{activeChips}</CardTitle>
            </CardHeader>
            <CardContent>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Taxa de Sucesso</CardDescription>
              <CardTitle className="text-3xl">{successRate}%</CardTitle>
            </CardHeader>
            <CardContent>
              {successRate >= 90 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Risco Médio</CardDescription>
              <CardTitle className="text-3xl">{avgRiskScore}</CardTitle>
            </CardHeader>
            <CardContent>
              <AlertTriangle
                className={`h-4 w-4 ${
                  avgRiskScore >= 70 ? "text-red-600" : avgRiskScore >= 40 ? "text-orange-600" : "text-green-600"
                }`}
              />
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Mensagens Enviadas</CardTitle>
              <CardDescription>Estatísticas de envio de mensagens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hoje</span>
                <span className="font-bold text-2xl">{totalMessagesToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-2xl">{totalMessagesSent}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Chips</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold text-2xl">{totalChips}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-600">Ativos</span>
                <span className="font-bold text-2xl text-green-600">{activeChips}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-orange-600">Pausados</span>
                <span className="font-bold text-2xl text-orange-600">
                  {chips?.filter((c) => c.status === "paused").length || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-600">Offline</span>
                <span className="font-bold text-2xl text-red-600">
                  {chips?.filter((c) => c.status === "offline").length || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chips Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Performance por Chip</CardTitle>
            <CardDescription>Uso e pontuação de risco de cada chip</CardDescription>
          </CardHeader>
          <CardContent>
            {!chips || chips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum chip cadastrado ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {chips.map((chip) => {
                  const dailyUsage = chip.dailyLimit > 0 ? (chip.messagesSentToday / chip.dailyLimit) * 100 : 0;
                  const totalUsage = chip.totalLimit > 0 ? (chip.messagesSentTotal / chip.totalLimit) * 100 : 0;
                  const riskScore = chip.riskScore || 0;
                  
                  return (
                    <div key={chip.id} className="p-4 border rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{chip.name}</div>
                          <div className="text-sm text-muted-foreground">{chip.phoneNumber}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Status</div>
                          <div className={`font-medium ${
                            chip.status === "active" ? "text-green-600" :
                            chip.status === "paused" ? "text-orange-600" : "text-red-600"
                          }`}>
                            {chip.status === "active" ? "Ativo" :
                             chip.status === "paused" ? "Pausado" : "Offline"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Uso Diário</div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${dailyUsage >= 90 ? "bg-red-500" : dailyUsage >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(dailyUsage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1">{chip.messagesSentToday}/{chip.dailyLimit}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Uso Total</div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${totalUsage >= 90 ? "bg-red-500" : totalUsage >= 70 ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${Math.min(totalUsage, 100)}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1">{chip.messagesSentTotal}/{chip.totalLimit}</div>
                        </div>
                        
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Risco</div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full ${riskScore >= 80 ? "bg-red-500" : riskScore >= 50 ? "bg-orange-500" : "bg-green-500"}`}
                              style={{ width: `${riskScore}%` }}
                            />
                          </div>
                          <div className="text-xs mt-1">{riskScore}/100</div>
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
  );
}
