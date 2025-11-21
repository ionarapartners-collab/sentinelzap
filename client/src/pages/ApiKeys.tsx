import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Copy, Key, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function ApiKeys() {
  const { user, loading: authLoading } = useAuth();
  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation();
  const deleteMutation = trpc.apiKeys.delete.useMutation();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);

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

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Nome da API Key é obrigatório");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        name: newKeyName,
      });

      setCreatedKey(result.apiKey);
      setNewKeyName("");
      refetch();
      toast.success("API Key criada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar API Key");
    }
  };

  const handleDeleteKey = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar esta API Key? Esta ação não pode ser desfeita.")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id });
      refetch();
      toast.success("API Key deletada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao deletar API Key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Gerenciar API Keys</h1>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>API REST para Integração com Make</CardTitle>
            <CardDescription>
              Use estas API Keys para integrar o SentinelZap com o Make.com e outras ferramentas de automação.
              A documentação completa está disponível em <code className="text-sm bg-muted px-1 py-0.5 rounded">/api/v1/health</code>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Create Button */}
        <div className="flex justify-end">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Nova API Key
          </Button>
        </div>

        {/* API Keys List */}
        <Card>
          <CardHeader>
            <CardTitle>Suas API Keys</CardTitle>
            <CardDescription>
              Gerencie as API Keys para integração com ferramentas externas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!apiKeys || apiKeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Nenhuma API Key criada ainda.</p>
                <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
                  Criar Primeira API Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{key.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <code className="bg-muted px-2 py-1 rounded">{key.keyPrefix}...</code>
                        {key.isActive ? (
                          <span className="text-green-600">● Ativa</span>
                        ) : (
                          <span className="text-red-600">● Inativa</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Criada em: {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                        {key.lastUsedAt && (
                          <> · Último uso: {new Date(key.lastUsedAt).toLocaleDateString("pt-BR")}</>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova API Key</DialogTitle>
            <DialogDescription>
              Dê um nome descritivo para identificar onde esta key será usada (ex: "Make Integration")
            </DialogDescription>
          </DialogHeader>

          {!createdKey ? (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="keyName">Nome da API Key</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Make Integration"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateKey} disabled={createMutation.isPending}>
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar API Key"
                  )}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm font-medium text-yellow-900 mb-2">
                    ⚠️ Importante: Copie esta API Key agora!
                  </p>
                  <p className="text-xs text-yellow-800">
                    Por segurança, esta key só será exibida uma vez. Guarde-a em um local seguro.
                  </p>
                </div>

                <div>
                  <Label>Sua API Key</Label>
                  <div className="flex gap-2 mt-2">
                    <Input value={createdKey} readOnly className="font-mono text-sm" />
                    <Button onClick={() => copyToClipboard(createdKey)} size="icon">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => {
                    setCreatedKey(null);
                    setShowCreateDialog(false);
                  }}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
