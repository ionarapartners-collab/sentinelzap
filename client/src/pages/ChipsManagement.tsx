import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Trash2, Power, PowerOff, QrCode } from "lucide-react";
import QRCodeLib from "qrcode";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function ChipsManagement() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedChipForQR, setSelectedChipForQR] = useState<number | null>(null);
  const [qrCodeImageUrl, setQrCodeImageUrl] = useState<string | null>(null);

  // Form state
  const [chipName, setChipName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dailyLimit, setDailyLimit] = useState("100");
  const [totalLimit, setTotalLimit] = useState("1000");

  const utils = trpc.useUtils();
  const { data: chips, isLoading } = trpc.chips.list.useQuery();
  const createChipMutation = trpc.chips.create.useMutation();
  const deleteChipMutation = trpc.chips.delete.useMutation();
  const initSessionMutation = trpc.whatsapp.initSession.useMutation({
    // Increase timeout to 90s because QR generation can take 30-40s
    trpc: {
      context: {
        signal: AbortSignal.timeout(90000),
      },
    },
  });
  const logoutMutation = trpc.whatsapp.logout.useMutation();

  const { data: qrCodeData } = trpc.whatsapp.getQRCode.useQuery(
    { chipId: selectedChipForQR! },
    { enabled: !!selectedChipForQR, refetchInterval: 2000 }
  );

  // Poll chip status to detect connection
  const { data: selectedChipData } = trpc.chips.get.useQuery(
    { chipId: selectedChipForQR! },
    { enabled: !!selectedChipForQR, refetchInterval: 2000 }
  );

  // Debug: Log qrCodeData changes
  useEffect(() => {
    if (qrCodeData) {
      console.log("🟢 [DEBUG] qrCodeData atualizado:", qrCodeData);
      console.log("🟢 [DEBUG] QR Code presente?", !!qrCodeData.qrCode);
      console.log("🟢 [DEBUG] Tamanho QR:", qrCodeData.qrCode?.length || 0);
    }
  }, [qrCodeData]);

  // Convert QR Code string to image
  useEffect(() => {
    if (qrCodeData?.qrCode) {
      console.log("🔧 [DEBUG] Converting QR Code string to image...");
      QRCodeLib.toDataURL(qrCodeData.qrCode, { width: 400, margin: 2 })
        .then((url) => {
          console.log("✅ [DEBUG] QR Code image generated successfully");
          setQrCodeImageUrl(url);
        })
        .catch((error) => {
          console.error("❌ [DEBUG] Error generating QR Code image:", error);
          toast.error("Erro ao gerar imagem do QR Code");
        });
    } else {
      setQrCodeImageUrl(null);
    }
  }, [qrCodeData]);

  // Auto-close dialog when chip connects
  useEffect(() => {
    if (selectedChipData?.isConnected && selectedChipForQR) {
      console.log("✅ [DEBUG] Chip connected! Closing dialog...");
      toast.success("✅ Chip conectado com sucesso!");
      setSelectedChipForQR(null);
      setQrCodeImageUrl(null);
      utils.chips.list.invalidate(); // Refresh chips list
    }
  }, [selectedChipData, selectedChipForQR, utils]);

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  const handleCreateChip = async () => {
    if (!chipName || !phoneNumber) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      await createChipMutation.mutateAsync({
        name: chipName,
        phoneNumber,
        sessionId: `chip-${Date.now()}`,
        dailyLimit: parseInt(dailyLimit),
        totalLimit: parseInt(totalLimit),
      });

      toast.success("Chip criado com sucesso!");
      setIsCreateDialogOpen(false);
      setChipName("");
      setPhoneNumber("");
      setDailyLimit("100");
      setTotalLimit("1000");
      utils.chips.list.invalidate();
    } catch (error) {
      toast.error("Erro ao criar chip");
      console.error(error);
    }
  };

  const handleDeleteChip = async (chipId: number, chipName: string) => {
    if (!confirm(`Tem certeza que deseja deletar o chip "${chipName}"?`)) {
      return;
    }

    try {
      await deleteChipMutation.mutateAsync({ chipId });
      toast.success("Chip deletado com sucesso!");
      utils.chips.list.invalidate();
    } catch (error) {
      toast.error("Erro ao deletar chip");
      console.error(error);
    }
  };

  const handleInitSession = async (chipId: number) => {
    try {
      console.log("🔵 [DEBUG] Iniciando sessão para chip:", chipId);
      const loadingToast = toast.loading("Gerando QR Code... Isso pode levar de 30 a 60 segundos. Aguarde!", { duration: 65000 });
      const result = await initSessionMutation.mutateAsync({ chipId });
      console.log("🔵 [DEBUG] Resposta do backend:", result);
      console.log("🔵 [DEBUG] QR Code recebido?", 'qrCode' in result && !!result.qrCode);
      console.log("🔵 [DEBUG] Tamanho do QR Code:", ('qrCode' in result && result.qrCode?.length) || 0);
      toast.dismiss(loadingToast);
      
      if (result.success) {
        if ('qrCode' in result && result.qrCode) {
          console.log("✅ [DEBUG] QR Code válido, abrindo dialog...");
          toast.success("✅ QR Code gerado com sucesso!");
          setSelectedChipForQR(chipId);
          console.log("✅ [DEBUG] selectedChipForQR setado para:", chipId);
        } else {
          console.error("❌ [DEBUG] QR Code vazio na resposta");
          toast.error("QR Code não foi gerado. Tente novamente.");
        }
      } else {
        console.error("❌ [DEBUG] Erro na resposta:", 'error' in result ? result.error : 'Unknown error');
        toast.error(('error' in result ? result.error : null) || "Erro ao inicializar sessão");
      }
    } catch (error) {
      console.error("❌ [DEBUG] Exceção capturada:", error);
      toast.error("Erro ao inicializar sessão");
      console.error(error);
    }
  };

  const handleLogout = async (chipId: number) => {
    try {
      const result = await logoutMutation.mutateAsync({ chipId });
      if (result.success) {
        toast.success("Chip desconectado com sucesso!");
        utils.chips.list.invalidate();
      } else {
        toast.error(result.error || "Erro ao desconectar");
      }
    } catch (error) {
      toast.error("Erro ao desconectar chip");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">Gerenciar Chips</h1>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Voltar ao Dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Meus Chips</CardTitle>
                <CardDescription>
                  Gerencie seus chips WhatsApp e suas conexões
                </CardDescription>
              </div>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Chip
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Novo Chip</DialogTitle>
                    <DialogDescription>
                      Configure um novo chip para envio de mensagens
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Chip *</Label>
                      <Input
                        id="name"
                        value={chipName}
                        onChange={(e) => setChipName(e.target.value)}
                        placeholder="Ex: Chip Marketing"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Número do WhatsApp *</Label>
                      <Input
                        id="phone"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="Ex: 5511999999999"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dailyLimit">Limite Diário</Label>
                        <Input
                          id="dailyLimit"
                          type="number"
                          value={dailyLimit}
                          onChange={(e) => setDailyLimit(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="totalLimit">Limite Total</Label>
                        <Input
                          id="totalLimit"
                          type="number"
                          value={totalLimit}
                          onChange={(e) => setTotalLimit(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleCreateChip}
                      disabled={createChipMutation.isPending}
                    >
                      {createChipMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Criar Chip
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : chips && chips.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum chip cadastrado ainda.</p>
                <p className="text-sm mt-2">Clique em "Novo Chip" para começar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {chips?.map((chip) => (
                  <div
                    key={chip.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{chip.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {chip.phoneNumber}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Status: <span className="font-medium">{chip.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {chip.isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLogout(chip.id)}
                          disabled={logoutMutation.isPending}
                        >
                          <PowerOff className="mr-2 h-4 w-4" />
                          Desconectar
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleInitSession(chip.id)}
                          disabled={initSessionMutation.isPending}
                        >
                          <Power className="mr-2 h-4 w-4" />
                          Conectar
                        </Button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleInitSession(chip.id)}
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteChip(chip.id, chip.name)}
                        disabled={deleteChipMutation.isPending}
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

        {/* QR Code Dialog */}
        <Dialog open={!!selectedChipForQR} onOpenChange={() => setSelectedChipForQR(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code de Autenticação</DialogTitle>
              <DialogDescription>
                Escaneie este QR code com seu WhatsApp
              </DialogDescription>
            </DialogHeader>
            {qrCodeImageUrl ? (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCodeImageUrl} alt="QR Code" className="w-full max-w-md" />
              </div>
            ) : qrCodeData?.qrCode ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium">Convertendo QR Code...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Gerando QR Code...</p>
                  <p className="text-xs text-muted-foreground">Isso pode levar de 10 a 30 segundos</p>
                  <p className="text-xs text-muted-foreground">Aguarde sem fechar esta janela</p>
                </div>
              </div>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Abra o WhatsApp → Dispositivos Conectados → Conectar um dispositivo
            </p>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedChipForQR(null);
                  setQrCodeImageUrl(null);
                }}
              >
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
