import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, BarChart3, MessageSquare } from "lucide-react";
import { APP_CONFIG, getLoginUrl } from '../const'; // ✅ CORRIGIDO: Importações corretas
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">{APP_CONFIG.title}</h1> {/* ✅ CORRIGIDO: APP_CONFIG.title */}
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">
                  Olá, {user?.name || "Usuário"}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sair
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <a href={getLoginUrl()}>Entrar</a>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Gerencie Múltiplos Chips WhatsApp com{" "}
              <span className="text-primary">Segurança Inteligente</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Sistema de rodízio automático com Termostato para evitar bloqueios.
              Envie milhares de mensagens com segurança usando múltiplos chips.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              {isAuthenticated ? (
                <>
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      <Zap className="mr-2 h-5 w-5" />
                      Acessar Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/test">Testar Integração</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/test">
                      <Zap className="mr-2 h-5 w-5" />
                      Testar Agora
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a href={getLoginUrl()}>Fazer Login</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Termostato Inteligente</CardTitle>
                <CardDescription>
                  Sistema de pontuação de risco (0-100) que pausa automaticamente chips em alto risco
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Rodízio Automático</CardTitle>
                <CardDescription>
                  Seleção inteligente do melhor chip baseada em uso e risco para cada mensagem
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>N Chips Simultâneos</CardTitle>
                <CardDescription>
                  Gerencie quantos chips precisar. Cada um com limites e monitoramento independente
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <MessageSquare className="h-10 w-10 text-primary mb-2" />
                <CardTitle>CRM Integrado</CardTitle>
                <CardDescription>
                  Visualize todas as conversas recebidas em um painel centralizado
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-16">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">
                Pronto para começar?
              </h3>
              <p className="text-primary-foreground/90">
                Teste a integração WhatsApp agora mesmo. Conecte seu primeiro chip em menos de 2 minutos.
              </p>
              <Button asChild size="lg" variant="secondary">
                <Link href="/test">
                  Testar Integração WhatsApp
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 bg-background">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            {APP_CONFIG.title} - Sistema de Rodízio de Chips para WhatsApp {/* ✅ CORRIGIDO */}
          </p>
        </div>
      </footer>
    </div>
  );
}