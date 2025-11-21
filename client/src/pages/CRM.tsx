import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader2, MessageSquare, Search } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function CRM() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: conversations, isLoading } = trpc.conversations.list.useQuery({
    limit: 100,
  });

  if (!user) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Filter conversations by search query
  const filteredConversations = conversations?.filter((conv) => {
    const query = searchQuery.toLowerCase();
    return (
      (conv.contactName || "").toLowerCase().includes(query) ||
      conv.contactNumber.includes(query) ||
      conv.messageContent.toLowerCase().includes(query)
    );
  });

  // Group conversations by contact
  const groupedConversations = new Map<string, typeof conversations>();
  filteredConversations?.forEach((conv) => {
    const key = conv.contactNumber;
    if (!groupedConversations.has(key)) {
      groupedConversations.set(key, []);
    }
    groupedConversations.get(key)!.push(conv);
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">CRM - Conversas</h1>
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
                <CardTitle>Conversas Recebidas</CardTitle>
                <CardDescription>
                  Visualize todas as mensagens recebidas pelos seus chips
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contato ou mensagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : groupedConversations.size === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma conversa encontrada.</p>
                <p className="text-sm mt-2">
                  As mensagens recebidas aparecerão aqui automaticamente.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Array.from(groupedConversations.entries()).map(([contactNumber, messages]) => {
                  if (!messages || messages.length === 0) return null;
                  const latestMessage = messages[0];
                  const messageCount = messages.length;

                  return (
                    <div key={contactNumber} className="border rounded-lg p-4 space-y-3">
                      {/* Contact Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{latestMessage.contactName}</div>
                          <div className="text-sm text-muted-foreground">
                            {contactNumber}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {messageCount} mensagem(ns)
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 rounded-lg ${
                              msg.isFromMe
                                ? "bg-primary/10 ml-8"
                                : "bg-muted mr-8"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm">{msg.messageContent}</p>
                              </div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(msg.timestamp).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                            {msg.isFromMe && (
                              <div className="text-xs text-muted-foreground mt-1">
                                Enviado por você
                              </div>
                            )}
                          </div>
                        ))}
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
