import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  Trash2,
  Plus,
  Save,
  Search,
  ShoppingCart,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

interface CartItem {
  productCode: string;
  productName: string;
  productReference: string;
  quantity: number;
  unitPrice: number;
}

export default function QuoteEditor() {
  const params = useParams<{ id?: string }>();
  const isEditing = !!params.id;
  const quoteId = params.id ? parseInt(params.id) : undefined;
  const [, setLocation] = useLocation();

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [observations, setObservations] = useState("");
  const [items, setItems] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const { data: paymentMethods } = trpc.paymentMethods.list.useQuery({ activeOnly: true });
  const { data: existingQuote } = trpc.quotes.getById.useQuery(
    { id: quoteId! },
    { enabled: isEditing && !!quoteId }
  );
  const { data: searchResults, isLoading: searchLoading } = trpc.products.search.useQuery(
    { search: debouncedSearch, pageSize: 10 },
    { enabled: debouncedSearch.length >= 2 }
  );

  const utils = trpc.useUtils();
  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Orçamento #${data.number} criado com sucesso!`);
      utils.quotes.list.invalidate();
      setLocation(`/orcamentos/${data.id}`);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });
  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado com sucesso!");
      utils.quotes.list.invalidate();
      if (quoteId) utils.quotes.getById.invalidate({ id: quoteId });
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  // Load existing quote data
  useEffect(() => {
    if (existingQuote) {
      setCustomerName(existingQuote.customerName || "");
      setCustomerPhone(existingQuote.customerPhone || "");
      setPaymentMethodId(existingQuote.paymentMethodId ? String(existingQuote.paymentMethodId) : "");
      setObservations(existingQuote.observations || "");
      setItems(
        existingQuote.items.map((item) => ({
          productCode: item.productCode,
          productName: item.productName,
          productReference: item.productReference || "",
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        }))
      );
    }
  }, [existingQuote]);

  // Load cart from sessionStorage (when coming from Products page)
  useEffect(() => {
    if (!isEditing) {
      const savedCart = sessionStorage.getItem("quote_cart");
      if (savedCart) {
        try {
          setItems(JSON.parse(savedCart));
          sessionStorage.removeItem("quote_cart");
        } catch {}
      }
    }
  }, [isEditing]);

  const handleProductSearch = (value: string) => {
    setProductSearch(value);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => setDebouncedSearch(value), 400);
    setSearchTimeout(t);
  };

  const addProduct = (product: { code: string; name: string; reference: string; price: number; stock: number }) => {
    if (product.stock <= 0) {
      toast.error("Produto sem estoque.");
      return;
    }
    const existing = items.find((i) => i.productCode === product.code);
    if (existing) {
      setItems(items.map((i) =>
        i.productCode === product.code ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        productCode: product.code,
        productName: product.name,
        productReference: product.reference,
        quantity: 1,
        unitPrice: product.price,
      }]);
    }
    setProductSearch("");
    setDebouncedSearch("");
    setShowSearch(false);
    toast.success(`${product.name} adicionado.`);
  };

  const updateQuantity = (code: string, qty: number) => {
    if (qty <= 0) {
      setItems(items.filter((i) => i.productCode !== code));
      return;
    }
    setItems(items.map((i) => i.productCode === code ? { ...i, quantity: qty } : i));
  };

  const updatePrice = (code: string, price: number) => {
    setItems(items.map((i) => i.productCode === code ? { ...i, unitPrice: price } : i));
  };

  const removeItem = (code: string) => {
    setItems(items.filter((i) => i.productCode !== code));
  };

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  const handleSave = () => {
    if (items.length === 0) {
      toast.error("Adicione pelo menos um produto ao orçamento.");
      return;
    }
    const payload = {
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      paymentMethodId: paymentMethodId ? parseInt(paymentMethodId) : undefined,
      observations: observations || undefined,
      items: items.map((i) => ({
        productCode: i.productCode,
        productName: i.productName,
        productReference: i.productReference,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
    };
    if (isEditing && quoteId) {
      updateMutation.mutate({ id: quoteId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/orcamentos")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? `Editar Orçamento #${existingQuote?.number || ""}` : "Novo Orçamento"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEditing ? "Edite os dados do orçamento" : "Monte um novo orçamento para o cliente"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Product search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Adicionar Produto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Input
                    placeholder="Buscar por código, nome ou referência..."
                    value={productSearch}
                    onChange={(e) => handleProductSearch(e.target.value)}
                    onFocus={() => setShowSearch(true)}
                    className="pr-10"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  )}
                </div>

                {showSearch && debouncedSearch.length >= 2 && (
                  <div className="border rounded-lg overflow-hidden shadow-sm">
                    {searchResults?.products.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        Nenhum produto encontrado.
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {searchResults?.products.map((product, idx) => (
                          <div
                            key={`${product.code}-${idx}`}
                            className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors"
                            onClick={() => addProduct(product)}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-xs text-muted-foreground">{product.code}</span>
                                {product.reference && (
                                  <span className="text-xs text-muted-foreground">· {product.reference}</span>
                                )}
                              </div>
                              <p className="text-sm font-medium truncate">{product.name}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                              <p className="text-sm font-bold">
                                R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </p>
                              <p className={`text-xs ${product.stock <= 0 ? "text-red-500" : product.stock <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                                {product.stock <= 0 ? "Sem estoque" : `${product.stock} un.`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => setLocation("/produtos")}
                >
                  <Search className="h-3.5 w-3.5" />
                  Buscar no catálogo completo
                </Button>
              </CardContent>
            </Card>

            {/* Items list */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Itens do Orçamento
                  {items.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({items.length} item{items.length !== 1 ? "s" : ""})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                    <ShoppingCart className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Nenhum produto adicionado.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/40">
                            <th className="text-left px-4 py-2 font-semibold text-muted-foreground">Produto</th>
                            <th className="text-center px-3 py-2 font-semibold text-muted-foreground w-24">Qtd</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">Preço Unit.</th>
                            <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-32">Total</th>
                            <th className="w-10 px-2" />
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => (
                            <tr key={item.productCode} className="border-b last:border-0">
                              <td className="px-4 py-3">
                                <div className="font-medium">{item.productName}</div>
                                <div className="text-xs text-muted-foreground font-mono">{item.productCode}</div>
                              </td>
                              <td className="px-3 py-3">
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.productCode, parseFloat(e.target.value) || 0)}
                                  className="h-8 text-center w-20 mx-auto"
                                />
                              </td>
                              <td className="px-3 py-3">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updatePrice(item.productCode, parseFloat(e.target.value) || 0)}
                                  className="h-8 text-right w-28 ml-auto"
                                />
                              </td>
                              <td className="px-3 py-3 text-right font-semibold">
                                R$ {(item.quantity * item.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-2 py-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  onClick={() => removeItem(item.productCode)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end px-4 py-3 border-t bg-muted/20">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Total do Orçamento</p>
                        <p className="text-2xl font-bold" style={{ color: "var(--segalla-red)" }}>
                          R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nome do Cliente</Label>
                  <Input
                    placeholder="Nome da oficina ou cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Telefone</Label>
                  <Input
                    placeholder="(00) 00000-0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods?.map((pm) => (
                      <SelectItem key={pm.id} value={String(pm.id)}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Observações, condições especiais, prazo de entrega..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Button
              className="w-full gap-2 h-11"
              onClick={handleSave}
              disabled={isSaving || items.length === 0}
              style={{ background: "var(--segalla-red)" }}
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Orçamento"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
