import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileText, Package, ShoppingCart, Users, Plus, ArrowRight, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = user?.role === "admin";

  const { data: quotes, isLoading: quotesLoading } = trpc.quotes.list.useQuery();
  const { data: paymentMethods } = trpc.paymentMethods.list.useQuery({ activeOnly: false });

  const draftCount = quotes?.filter((q) => q.status === "draft").length ?? 0;
  const totalCount = quotes?.length ?? 0;
  const sentCount = quotes?.filter((q) => q.status === "sent").length ?? 0;

  const recentQuotes = quotes?.slice(0, 5) ?? [];

  const statusLabel: Record<string, string> = {
    draft: "Rascunho",
    sent: "Enviado",
    approved: "Aprovado",
    rejected: "Recusado",
  };
  const statusColor: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    sent: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Olá, {user?.name?.split(" ")[0] || "Usuário"}!
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Bem-vindo ao sistema de orçamentos Segalla.
            </p>
          </div>
          <Button
            onClick={() => setLocation("/orcamentos/novo")}
            className="gap-2"
            style={{ background: "var(--segalla-red)" }}
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4" style={{ borderLeftColor: "var(--segalla-red)" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Orçamentos</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{totalCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(0.48 0.22 25 / 0.1)" }}>
                  <FileText className="h-6 w-6" style={{ color: "var(--segalla-red)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4" style={{ borderLeftColor: "var(--segalla-blue)" }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Em Rascunho</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{draftCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "oklch(0.40 0.18 250 / 0.1)" }}>
                  <ShoppingCart className="h-6 w-6" style={{ color: "var(--segalla-blue)" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Enviados</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{sentCount}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {isAdmin && (
            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Formas de Pagamento</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{paymentMethods?.length ?? 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick actions + Recent quotes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-between h-11"
                onClick={() => setLocation("/produtos")}
              >
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Buscar Produtos</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between h-11"
                onClick={() => setLocation("/orcamentos/novo")}
              >
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span>Novo Orçamento</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              <Button
                variant="outline"
                className="w-full justify-between h-11"
                onClick={() => setLocation("/orcamentos")}
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>Ver Orçamentos</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  className="w-full justify-between h-11"
                  onClick={() => setLocation("/admin/usuarios")}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>Gerenciar Usuários</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Recent quotes */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">Orçamentos Recentes</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/orcamentos")}
                className="text-xs text-muted-foreground hover:text-foreground">
                Ver todos
              </Button>
            </CardHeader>
            <CardContent>
              {quotesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : recentQuotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum orçamento ainda.</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setLocation("/orcamentos/novo")}
                    style={{ background: "var(--segalla-red)" }}
                  >
                    Criar primeiro orçamento
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border"
                      onClick={() => setLocation(`/orcamentos/${quote.id}`)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: "oklch(0.48 0.22 25 / 0.1)" }}>
                          <FileText className="h-4 w-4" style={{ color: "var(--segalla-red)" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            #{quote.number}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {quote.customerName || "Cliente não informado"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[quote.status]}`}>
                          {statusLabel[quote.status]}
                        </span>
                        <span className="text-sm font-semibold text-foreground">
                          {quote.totalAmount
                            ? `R$ ${parseFloat(String(quote.totalAmount)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                            : "R$ 0,00"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
