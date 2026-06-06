import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  Search,
  Package,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Wifi,
  WifiOff,
  Plus,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

interface CartItem {
  productCode: string;
  productName: string;
  productBrand: string;
  quantity: number;
  unitPrice: number;
}

export default function Products() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, error } = trpc.products.search.useQuery(
    { search: debouncedSearch, page, pageSize: 20 },
    {}
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
    setSearchTimeout(timeout);
  };

  const addToCart = (product: {
    code: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
  }) => {
    if (product.stock <= 0) {
      toast.error("Produto sem estoque disponível.");
      return;
    }
    const existing = cart.find((i) => i.productCode === product.code);
    if (existing) {
      setCart(cart.map((i) =>
        i.productCode === product.code
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
      toast.success(`Quantidade de "${product.name}" atualizada.`);
    } else {
      setCart([...cart, {
        productCode: product.code,
        productName: product.name,
        productBrand: product.brand,
        quantity: 1,
        unitPrice: product.price,
      }]);
      toast.success(`"${product.name}" adicionado ao orçamento.`);
    }
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const goToNewQuote = () => {
    if (cart.length === 0) {
      toast.error("Adicione pelo menos um produto ao orçamento.");
      return;
    }
    sessionStorage.setItem("quote_cart", JSON.stringify(cart));
    setLocation("/orcamentos/novo");
  };

  const stockBadge = (stock: number) => {
    if (stock <= 0) return <span className="segalla-badge-stock-out">Sem estoque</span>;
    if (stock <= 5) return <span className="segalla-badge-stock-low">{stock} un.</span>;
    return <span className="segalla-badge-stock-ok">{stock} un.</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo de Produtos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Busque produtos por código, nome ou referência
            </p>
          </div>
          {cart.length > 0 && (
            <Button
              onClick={goToNewQuote}
              className="gap-2"
              style={{ background: "var(--segalla-red)" }}
            >
              <ShoppingCart className="h-4 w-4" />
              Criar Orçamento ({cart.length})
            </Button>
          )}
        </div>

        {/* Search bar */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nome ou referência..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-11 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Connection status */}
        {data && !data.connected && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>
              <strong>Firebird não conectado.</strong> Configure a conexão nas variáveis de ambiente
              (FIREBIRD_HOST, FIREBIRD_DATABASE, etc.) para visualizar o estoque em tempo real.
            </span>
          </div>
        )}
        {data?.connected && (
          <div className="flex items-center gap-1.5 text-xs text-green-600">
            <Wifi className="h-3.5 w-3.5" />
            <span>Conectado ao Firebird — estoque em tempo real</span>
          </div>
        )}

        {/* Cart summary */}
        {cart.length > 0 && (
          <Card className="border-2" style={{ borderColor: "var(--segalla-blue)" }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" style={{ color: "var(--segalla-blue)" }} />
                  <span className="font-medium text-sm">
                    {cart.length} produto(s) selecionado(s)
                  </span>
                  <span className="text-muted-foreground text-sm">·</span>
                  <span className="font-bold text-sm">
                    R$ {cartTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCart([])}
                  >
                    Limpar
                  </Button>
                  <Button
                    size="sm"
                    onClick={goToNewQuote}
                    style={{ background: "var(--segalla-red)" }}
                  >
                    Criar Orçamento
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products table */}
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Produtos
              {data && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({data.total} encontrado{data.total !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm">Erro ao carregar produtos.</p>
              </div>
            ) : data?.products.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                <Package className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nenhum produto encontrado.</p>
                {debouncedSearch && (
                  <p className="text-xs">Tente buscar por outro termo.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Descrição</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Referência</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Marca</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Preço</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Estoque</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.products.map((product, idx) => {
                      const inCart = cart.find((i) => i.productCode === product.code);
                      return (
                        <tr
                          key={`${product.code}-${idx}`}
                          className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${inCart ? "bg-blue-50/50" : ""}`}
                        >
                          <td className="px-4 py-3 font-mono text-xs font-medium">
                            {product.code}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">{product.name}</div>
                            {product.brand && (
                              <div className="text-xs text-muted-foreground">{product.brand}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {product.brand || "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            {product.price > 0
                              ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {stockBadge(product.stock)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              size="sm"
                              variant={inCart ? "secondary" : "outline"}
                              onClick={() => addToCart(product)}
                              disabled={product.stock <= 0}
                              className="gap-1 h-8"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {inCart ? `(${inCart.quantity})` : "Add"}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Página {data.page} de {data.totalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                    disabled={page >= data.totalPages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
