import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download,
  FileSpreadsheet,
  FileType,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusLabel: Record<string, string> = {
  draft: "Rascunho",
  sent: "Enviado",
  approved: "Aprovado",
  rejected: "Recusado",
};
const statusColor: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 border-yellow-200",
  sent: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

export default function QuotesList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: quotes, isLoading, refetch } = trpc.quotes.list.useQuery();
  const utils = trpc.useUtils();
  const deleteMutation = trpc.quotes.delete.useMutation({
    onSuccess: () => {
      toast.success("Orçamento excluído.");
      utils.quotes.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const filtered = quotes?.filter((q) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      q.number.toLowerCase().includes(s) ||
      (q.customerName || "").toLowerCase().includes(s)
    );
  });

  const handleExport = async (quoteId: number, format: "pdf" | "xlsx" | "docx") => {
    try {
      const response = await fetch(`/api/export/quote/${quoteId}/${format}`);
      if (!response.ok) throw new Error("Erro ao exportar");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orcamento-${quoteId}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Orçamento exportado em ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error("Erro ao exportar orçamento.");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Orçamentos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico de todos os seus orçamentos
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

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : filtered?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <FileText className="h-12 w-12 opacity-30" />
                <p className="text-sm font-medium">Nenhum orçamento encontrado.</p>
                <Button
                  size="sm"
                  onClick={() => setLocation("/orcamentos/novo")}
                  style={{ background: "var(--segalla-red)" }}
                >
                  Criar primeiro orçamento
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nº</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Cliente</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Data</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered?.map((quote) => (
                      <tr key={quote.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-mono font-semibold text-foreground">#{quote.number}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium">{quote.customerName || <span className="text-muted-foreground italic">Não informado</span>}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${statusColor[quote.status]}`}>
                            {statusLabel[quote.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold">
                          R$ {parseFloat(String(quote.totalAmount || 0)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {new Date(quote.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Visualizar"
                              onClick={() => setLocation(`/orcamentos/${quote.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Editar"
                              onClick={() => setLocation(`/orcamentos/${quote.id}/editar`)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" title="Exportar">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleExport(quote.id, "pdf")}>
                                  <FileText className="mr-2 h-4 w-4 text-red-500" />
                                  Exportar PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport(quote.id, "xlsx")}>
                                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                                  Exportar Excel
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleExport(quote.id, "docx")}>
                                  <FileType className="mr-2 h-4 w-4 text-blue-600" />
                                  Exportar Word
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              title="Excluir"
                              onClick={() => setDeleteId(quote.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Orçamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
