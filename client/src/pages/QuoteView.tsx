import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  Edit,
  Download,
  FileText,
  FileSpreadsheet,
  FileType,
  User,
  Phone,
  CreditCard,
  MessageSquare,
  Package,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

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

export default function QuoteView() {
  const params = useParams<{ id: string }>();
  const quoteId = parseInt(params.id);
  const [, setLocation] = useLocation();

  const { data: quote, isLoading } = trpc.quotes.getById.useQuery({ id: quoteId });
  const { data: paymentMethods } = trpc.paymentMethods.list.useQuery({ activeOnly: false });
  const utils = trpc.useUtils();
  const updateMutation = trpc.quotes.update.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado.");
      utils.quotes.getById.invalidate({ id: quoteId });
    },
  });

  const paymentMethod = paymentMethods?.find((pm) => pm.id === quote?.paymentMethodId);

  const handleExport = async (format: "pdf" | "xlsx" | "docx") => {
    try {
      const response = await fetch(`/api/export/quote/${quoteId}/${format}`);
      if (!response.ok) throw new Error("Erro ao exportar");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento-${quote?.number}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exportado em ${format.toUpperCase()} com sucesso.`);
    } catch {
      toast.error("Erro ao exportar orçamento.");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 max-w-4xl mx-auto">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </DashboardLayout>
    );
  }

  if (!quote) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
          <FileText className="h-12 w-12 opacity-30" />
          <p>Orçamento não encontrado.</p>
          <Button variant="outline" onClick={() => setLocation("/orcamentos")}>
            Voltar
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const total = quote.items.reduce(
    (sum, item) => sum + parseFloat(item.quantity) * parseFloat(item.unitPrice),
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-5 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/orcamentos")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">Orçamento #{quote.number}</h1>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor[quote.status]}`}>
                  {statusLabel[quote.status]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Criado em {new Date(quote.createdAt).toLocaleDateString("pt-BR", {
                  day: "2-digit", month: "long", year: "numeric"
                })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setLocation(`/orcamentos/${quoteId}/editar`)}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => handleExport("pdf")}
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
                onClick={() => handleExport("xlsx")}
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                Excel
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50"
                onClick={() => handleExport("docx")}
              >
                <FileType className="h-3.5 w-3.5" />
                Word
              </Button>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quote.customerName && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: "oklch(0.40 0.18 250 / 0.1)" }}>
                  <User className="h-4 w-4" style={{ color: "var(--segalla-blue)" }} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cliente</p>
                  <p className="text-sm font-semibold">{quote.customerName}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {quote.customerPhone && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-green-50">
                  <Phone className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-semibold">{quote.customerPhone}</p>
                </div>
              </CardContent>
            </Card>
          )}
          {paymentMethod && (
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-50">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pagamento</p>
                  <p className="text-sm font-semibold">{paymentMethod.name}</p>
                </div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Status</p>
              <Select
                value={quote.status}
                onValueChange={(val) =>
                  updateMutation.mutate({
                    id: quoteId,
                    status: val as "draft" | "sent" | "approved" | "rejected",
                  })
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="rejected">Recusado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Itens do Orçamento ({quote.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Código</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Produto</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Referência</th>
                    <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Qtd</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Preço Unit.</th>
                    <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.items.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{item.productCode}</td>
                      <td className="px-4 py-3 font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                        {item.productBrand || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">{parseFloat(item.quantity)}</td>
                      <td className="px-4 py-3 text-right">
                        R$ {parseFloat(item.unitPrice).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        R$ {(parseFloat(item.quantity) * parseFloat(item.unitPrice)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t bg-muted/20">
                    <td colSpan={5} className="px-4 py-3 text-right font-semibold">Total Geral</td>
                    <td className="px-4 py-3 text-right text-xl font-bold" style={{ color: "var(--segalla-red)" }}>
                      R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Observations */}
        {quote.observations && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-wrap">{quote.observations}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
