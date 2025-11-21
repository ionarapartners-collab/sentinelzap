import { useAuth } from "@/auth-mock";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, Upload, Send, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function BulkSend() {
  const { user } = useAuth();
  const [campaignName, setCampaignName] = useState("");
  const [messageTemplate, setMessageTemplate] = useState("");
  const [csvContent, setCsvContent] = useState("");
  const [csvFile, setCsvFile] = useState<File | null>(null);

  const createCampaignMutation = trpc.bulk.createCampaign.useMutation();
  const startCampaignMutation = trpc.bulk.startCampaign.useMutation();
  const { data: campaigns, refetch } = trpc.bulk.listCampaigns.useQuery();

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !messageTemplate || !csvContent) {
      toast.error("Preencha todos os campos");
      return;
    }

    try {
      const result = await createCampaignMutation.mutateAsync({
        name: campaignName,
        messageTemplate,
        csvContent,
      });

      if (result.success) {
        toast.success("Campanha criada com sucesso!");
        setCampaignName("");
        setMessageTemplate("");
        setCsvContent("");
        setCsvFile(null);
        refetch();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar campanha");
    }
  };

  const handleStartCampaign = async (campaignId: number) => {
    try {
      await startCampaignMutation.mutateAsync({ campaignId });
      toast.success("Campanha iniciada! O envio está em andamento.");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar campanha");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Envio em Massa</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Campaign */}
          <Card>
            <CardHeader>
              <CardTitle>Nova Campanha</CardTitle>
              <CardDescription>
                Importe uma lista de contatos e envie mensagens em massa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaignName">Nome da Campanha *</Label>
                <Input
                  id="campaignName"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Ex: Prospecção Dezembro 2024"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="messageTemplate">Mensagem *</Label>
                <Textarea
                  id="messageTemplate"
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder="Olá {nome}, tudo bem? ..."
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{nome}"} para personalizar. Campos personalizados do CSV também podem ser usados: {"{campo}"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="csvFile">Arquivo CSV *</Label>
                <div className="flex gap-2">
                  <Input
                    id="csvFile"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                  />
                  {csvFile && (
                    <Button variant="outline" size="sm" disabled>
                      <FileText className="mr-2 h-4 w-4" />
                      {csvFile.name}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formato: telefone,nome (primeira linha é cabeçalho)
                </p>
              </div>

              {csvContent && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Preview:</p>
                  <pre className="text-xs overflow-auto max-h-32">
                    {csvContent.split("\n").slice(0, 5).join("\n")}
                    {csvContent.split("\n").length > 5 && "\n..."}
                  </pre>
                </div>
              )}

              <Button
                onClick={handleCreateCampaign}
                disabled={createCampaignMutation.isPending}
                className="w-full"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Criar Campanha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Campaigns List */}
          <Card>
            <CardHeader>
              <CardTitle>Campanhas</CardTitle>
              <CardDescription>Gerencie suas campanhas de envio</CardDescription>
            </CardHeader>
            <CardContent>
              {!campaigns || campaigns.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma campanha criada ainda
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {campaigns.map((campaign) => {
                    const progress =
                      campaign.totalContacts > 0
                        ? Math.round(
                            ((campaign.sentCount + campaign.failedCount) /
                              campaign.totalContacts) *
                              100
                          )
                        : 0;

                    const statusColor =
                      campaign.status === "completed"
                        ? "text-green-600"
                        : campaign.status === "running"
                        ? "text-blue-600"
                        : campaign.status === "failed"
                        ? "text-red-600"
                        : "text-gray-600";

                    return (
                      <div key={campaign.id} className="p-4 border rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-medium">{campaign.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {campaign.totalContacts} contatos
                            </div>
                          </div>
                          <span className={`text-xs font-medium ${statusColor}`}>
                            {campaign.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Progresso</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">
                              ✓ {campaign.sentCount} enviados
                            </span>
                            <span className="text-red-600">
                              ✗ {campaign.failedCount} falhas
                            </span>
                          </div>
                        </div>

                        {campaign.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleStartCampaign(campaign.id)}
                            disabled={startCampaignMutation.isPending}
                            className="w-full"
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Iniciar Envio
                          </Button>
                        )}

                        {campaign.status === "running" && (
                          <p className="text-xs text-blue-600 text-center">
                            ⏳ Envio em andamento...
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CSV Format Help */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Formato do CSV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>O arquivo CSV deve seguir o seguinte formato:</p>
              <pre className="p-3 bg-muted rounded-lg overflow-auto">
{`telefone,nome,empresa,cargo
5511999999999,João Silva,Empresa X,Gerente
5511888888888,Maria Santos,Empresa Y,Diretora`}
              </pre>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Primeira linha: cabeçalhos das colunas</li>
                <li>Coluna <strong>telefone</strong> é obrigatória (com código do país)</li>
                <li>Coluna <strong>nome</strong> é opcional mas recomendada</li>
                <li>Campos personalizados podem ser adicionados e usados na mensagem com {"{campo}"}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
