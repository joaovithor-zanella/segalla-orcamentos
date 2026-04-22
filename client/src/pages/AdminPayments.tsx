import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { trpc } from "@/lib/trpc";
import { CreditCard, Plus, Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface PaymentForm {
  id?: number;
  name: string;
  description: string;
  active: boolean;
}

const emptyForm: PaymentForm = { name: "", description: "", active: true };

export default function AdminPayments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<PaymentForm>(emptyForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  if (user && user.role !== "admin") {
    setLocation("/");
    return null;
  }

  const { data: paymentMethods, isLoading } = trpc.paymentMethods.list.useQuery({ activeOnly: false });
  const utils = trpc.useUtils();

  const createMutation = trpc.paymentMethods.create.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento criada.");
      utils.paymentMethods.list.invalidate();
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const updateMutation = trpc.paymentMethods.update.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento atualizada.");
      utils.paymentMethods.list.invalidate();
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const deleteMutation = trpc.paymentMethods.delete.useMutation({
    onSuccess: () => {
      toast.success("Forma de pagamento excluída.");
      utils.paymentMethods.list.invalidate();
      setDeleteId(null);
    },
    onError: (err) => toast.error(`Erro: ${err.message}`),
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error("Informe o nome da forma de pagamento.");
      return;
    }
    if (form.id) {
      updateMutation.mutate({
        id: form.id,
        name: form.name,
        description: form.description || undefined,
        active: form.active ? "yes" : "no",
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description || undefined,
        active: form.active ? "yes" : "no",
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CreditCard className="h-6 w-6" style={{ color: "var(--segalla-red)" }} />
              Formas de Pagamento
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie as formas de pagamento disponíveis nos orçamentos
            </p>
          </div>
          <Button
            onClick={() => { setForm(emptyForm); setShowForm(true); }}
            className="gap-2"
            style={{ background: "var(--segalla-red)" }}
          >
            <Plus className="h-4 w-4" />
            Nova Forma
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Formas Cadastradas
              {paymentMethods && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({paymentMethods.length})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : paymentMethods?.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <CreditCard className="h-10 w-10 opacity-30" />
                <p className="text-sm">Nenhuma forma de pagamento cadastrada.</p>
                <Button
                  size="sm"
                  onClick={() => { setForm(emptyForm); setShowForm(true); }}
                  style={{ background: "var(--segalla-red)" }}
                >
                  Cadastrar primeira
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Nome</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Descrição</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethods?.map((pm) => (
                      <tr key={pm.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3 font-medium">{pm.name}</td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {pm.description || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            pm.active === "yes"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {pm.active === "yes" ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setForm({
                                  id: pm.id,
                                  name: pm.name,
                                  description: pm.description || "",
                                  active: pm.active === "yes",
                                });
                                setShowForm(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(pm.id)}
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

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) { setShowForm(false); setForm(emptyForm); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ex: Boleto 30 dias, Pix, Cartão..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea
                placeholder="Detalhes adicionais (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Ativo</Label>
                <p className="text-xs text-muted-foreground">Disponível para seleção nos orçamentos</p>
              </div>
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowForm(false); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              style={{ background: "var(--segalla-red)" }}
            >
              {isSaving ? "Salvando..." : form.id ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Forma de Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta forma de pagamento?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
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
