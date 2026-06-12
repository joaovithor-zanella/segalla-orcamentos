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
  Truck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

interface CartItem {
  productCode: string;
  productName: string;
  productBrand: string;
  quantity: number;
  unitPrice: number;
  company?: string;
  companyId?: number;
}

interface VehicleInfo {
  plate?: string;
  model?: string;
  year?: number;
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
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    plate: "",
    model: "",
    year: undefined,
  });

  const { data: paymentMethods } = trpc.paymentMethods.list.useQuery({ activeOnly: true });
  const { data: existingQuote } = trpc.quotes.getById.useQuery(
    { id: quoteId! },
    { enabled: isEditing && !!quoteId }
  );
  const { data: searchResults, isLoading: searchLoading } = trpc.products.search.useQuery(
    { search: debouncedSearch, pageSize: 10, companyFilter: "1" },
    { enabled: debouncedSearch.length >= 2 }
  );
  const { data: existingVehicle } = trpc.quotes.getVehicleInfo.useQuery(
    { quoteId: quoteId! },
    { enabled: isEditing && !!quoteId }
  );

  const utils = trpc.useUtils();
  
  // Move mutations to component level (FIX: Hooks must be at top level)
  const setVehicleInfoMutation = trpc.quotes.setVehicleInfo.useMutation({
    onSuccess: () => {
      utils.quotes.getVehicleInfo.invalidate();
    },
    onError: (err) => toast.error(`Erro ao salvar veículo: ${err.message}`),
  });

  const createMutation = trpc.quotes.create.useMutation({
    onSuccess: (data) => {
      toast.success(`Orçamento #${data.number} criado com sucesso!`);
      utils.quotes.list.invalidate();
      
      // Save vehicle info if provided (now using mutation at top level)
      if (vehicleInfo.plate || vehicleInfo.model || vehicleInfo.year) {
        setVehicleInfoMutation.mutate({
          quoteId: data.id,
          plate: vehicleInfo.plate,
          model: vehicleInfo.model,
          year: vehicleInfo.year,
        });
      }
      
      setLocation(`/orcamentos/${data.id}`);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      toast.success("Orçamento atualizado com sucesso!");
      utils.quotes.list.invalidate();
      if (quoteId) utils.quotes.getById.invalidate({ id: quoteId });
      
      // Save vehicle info if provided (now using mutation at top level)
      if (quoteId && (vehicleInfo.plate || vehicleInfo.model || vehicleInfo.year)) {
        setVehicleInfoMutation.mutate({
          quoteId,
          plate: vehicleInfo.plate,
          model: vehicleInfo.model,
          year: vehicleInfo.year,
        });
      }
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
          productBrand: item.productBrand || "",
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        }))
      );
    }
  }, [existingQuote]);

  // Load vehicle info from existing quote
  useEffect(() => {
    if (existingVehicle) {
      setVehicleInfo({
        plate: existingVehicle.plate || "",
        model: existingVehicle.model || "",
        year: existingVehicle.year || undefined,
      });
    }
  }, [existingVehicle]);

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

  const addProduct = (product: { code: string; name: string; brand: string; price: number; stock: number; company?: string; companyId?: number }) => {
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
        productBrand: product.brand,
        quantity: 1,
        unitPrice: product.price,
        company: product.company,
        companyId: product.companyId,
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
        productBrand: i.productBrand,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        company: i.company,
        companyId: i.companyId,
      })),
    };
    if (isEditing && quoteId) {
      updateMutation.mutate({ id: quoteId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending || setVehicleInfoMutation.isPending;

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
                                {product.brand && (
                                  <span className="text-xs text-muted-foreground">· {product.brand}</span>
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
                    <span className="text-sm font-normal text-muted-foreground">({items.length})</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum item adicionado ainda.</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.map((item, idx) => (
                      <div key={`${item.productCode}-${idx}`} className="flex gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs text-muted-foreground">{item.productCode}</p>
                          <p className="font-medium text-sm truncate">{item.productName}</p>
                          {item.productBrand && (
                            <p className="text-xs text-muted-foreground">{item.productBrand}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productCode, parseFloat(e.target.value) || 1)}
                            className="w-16 h-8 text-sm"
                          />
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(item.productCode, parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.productCode)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Customer & Summary */}
          <div className="space-y-4">
            {/* Customer Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName" className="text-sm">Nome</Label>
                  <Input
                    id="customerName"
                    placeholder="Nome do cliente"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone" className="text-sm">Telefone</Label>
                  <Input
                    id="customerPhone"
                    placeholder="(11) 99999-9999"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="h-9"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod" className="text-sm">Forma de Pagamento</Label>
                  <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                    <SelectTrigger id="paymentMethod" className="h-9">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods?.map((method) => (
                        <SelectItem key={method.id} value={String(method.id)}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Veículo (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="plate" className="text-xs">Placa</Label>
                  <Input
                    id="plate"
                    placeholder="Ex: ABC-1234"
                    value={vehicleInfo.plate || ""}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, plate: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model" className="text-xs">Modelo</Label>
                  <Input
                    id="model"
                    placeholder="Ex: Corolla"
                    value={vehicleInfo.model || ""}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year" className="text-xs">Ano</Label>
                  <Input
                    id="year"
                    placeholder="Ex: 2020"
                    type="number"
                    value={vehicleInfo.year || ""}
                    onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Observations */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Adicione observações sobre o orçamento..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="resize-none h-24 text-sm"
                />
              </CardContent>
            </Card>

            {/* Summary & Save */}
            <Card className="border-2" style={{ borderColor: "var(--segalla-blue)" }}>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span style={{ color: "var(--segalla-red)" }}>
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || items.length === 0}
                  className="w-full gap-2"
                  style={{ background: "var(--segalla-red)" }}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Salvando..." : isEditing ? "Atualizar Orçamento" : "Criar Orçamento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
