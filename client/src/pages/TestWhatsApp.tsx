import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TestWhatsApp() {
  const { user, loading: authLoading } = useAuth();
  const [chipName, setChipName] = useState("Chip Teste");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionId, setSessionId] = useState(`test-${Date.now()}`);
  const [createdChipId, setCreatedChipId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Test message fields
  const [recipientNumber, setRecipientNumber] = useState("");
  const [messageContent, setMessageContent] = useState("Olá! Esta é uma mensagem de teste do SentinelZap.");

  const createChipMutation = trpc.chips.create.useMutation();
  const initSessionMutation = trpc.whatsapp.initSession.useMutation();
  const sendMessageMutation = trpc.rotation.sendMessage.useMutation();
  
  const { data: qrCodeData, refetch: refetchQR } = trpc.whatsapp.getQRCode.useQuery(
    { chipId: createdChipId! },
    { enabled: !!createdChipId, refetchInterval: 2000 }
  );

  const { data: connectionData, refetch: refetchConnection } = trpc.whatsapp.checkConnection.useQuery(
    { chipId: createdChipId! },
    { enabled: !!createdChipId, refetchInterval: 3000 }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Login Necessário</CardTitle>
            <CardDescription>Faça login para testar a integração WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = getLoginUrl()} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreateChip = async () => {
    if (!phoneNumber) {
      toast.error("Digite o número do WhatsApp");
      return;
    }

    try {
      const chip = await createChipMutation.mutateAsync({
        name: chipName,
        phoneNumber,
        sessionId,
        dailyLimit: 100,
        totalLimit: 1000,
      });

      setCreatedChipId(chip.id);
      toast.success("Chip criado com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar chip");
      console.error(error);
    }
  };

  const handleInitSession = async () => {
    if (!createdChipId) return;

    try {
      const result = await initSessionMutation.mutateAsync({
        chipId: createdChipId,
      });

      if (result.success) {
        toast.success("Sessão inicializada! Aguarde o QR code...");
        if ('qrCode' in result && result.qrCode) {
          setQrCode(result.qrCode);
        }
        setTimeout(() => refetchQR(), 2000);
      } else {
        if ('error' in result) {
          toast.error(result.error || "Erro ao inicializar sessão");
        }
      }
    } catch (error) {
      toast.error("Erro ao inicializar sessão");
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!recipientNumber || !messageContent) {
      toast.error("Preencha o número e a mensagem");
      return;
    }

    try {
      const result = await sendMessageMutation.mutateAsync({
        recipientNumber,
        messageContent,
        messageType: "text",
      });

      if (result.success) {
        toast.success(`Mensagem enviada via ${result.chipUsed?.name || 'chip'}!`);
        setMessageContent("");
      } else {
        toast.error(result.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      toast.error("Erro ao enviar mensagem");
      console.error(error);
    }
  };

  // Update connection status
  if (connectionData?.isConnected && !isConnected) {
    setIsConnected(true);
    setQrCode(null);
    toast.success("WhatsApp conectado com sucesso!");
  }

  // Update QR code
  if (qrCodeData?.qrCode && qrCodeData.qrCode !== qrCode) {
    setQrCode(qrCodeData.qrCode);
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Teste de Integração WhatsApp</h1>
          <p className="text-muted-foreground mt-2">
            Use esta página para validar a conexão com o WhatsApp
          </p>
        </div>

        {/* Step 1: Create Chip */}
        <Card>
          <CardHeader>
            <CardTitle>1. Criar Chip de Teste</CardTitle>
            <CardDescription>Configure um novo chip para teste</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chipName">Nome do Chip</Label>
              <Input
                id="chipName"
                value={chipName}
                onChange={(e) => setChipName(e.target.value)}
                placeholder="Ex: Chip Teste"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Número do WhatsApp</Label>
              <Input
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: 5511999999999"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionId">Session ID (gerado automaticamente)</Label>
              <Input id="sessionId" value={sessionId} disabled />
            </div>
            <Button
              onClick={handleCreateChip}
              disabled={createChipMutation.isPending || !!createdChipId}
              className="w-full"
            >
              {createChipMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {createdChipId ? "Chip Criado ✓" : "Criar Chip"}
            </Button>
          </CardContent>
        </Card>

        {/* Step 2: Initialize Session & QR Code */}
        {createdChipId && (
          <Card>
            <CardHeader>
              <CardTitle>2. Conectar ao WhatsApp</CardTitle>
              <CardDescription>
                Inicialize a sessão e escaneie o QR code com seu WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                {isConnected ? (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="h-5 w-5 mr-1" />
                    Conectado
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600">
                    <XCircle className="h-5 w-5 mr-1" />
                    Desconectado
                  </div>
                )}
              </div>

              {!isConnected && (
                <>
                  <Button
                    onClick={handleInitSession}
                    disabled={initSessionMutation.isPending}
                    className="w-full"
                  >
                    {initSessionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Inicializar Sessão
                  </Button>

                  {qrCode && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>QR Code</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => refetchQR()}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Atualizar
                        </Button>
                      </div>
                      <div className="flex justify-center p-4 bg-white rounded-lg">
                        <img src={qrCode} alt="QR Code" className="w-64 h-64" />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Abra o WhatsApp no seu celular → Dispositivos Conectados → Conectar um dispositivo
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Send Test Message */}
        {isConnected && (
          <Card>
            <CardHeader>
              <CardTitle>3. Enviar Mensagem de Teste</CardTitle>
              <CardDescription>
                Teste o envio de mensagens com rodízio automático
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="recipientNumber">Número do Destinatário</Label>
                <Input
                  id="recipientNumber"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  placeholder="Ex: 5511988888888"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="messageContent">Mensagem</Label>
                <Textarea
                  id="messageContent"
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  rows={4}
                />
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending}
                className="w-full"
              >
                {sendMessageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Mensagem
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
